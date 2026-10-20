import React, { useEffect, useRef, useState } from 'react';
import { prepareMask, drawPoster } from './poster.js';

export default function App() {
  const canvas = useRef(null), fileInput = useRef(null), video = useRef(null);
  const cameraRequest = useRef(0), cameraFrame = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const model = useRef({ photo: null, overlay: null, zoom: 1, offset: { x: 0, y: 0 } });
  const stream = useRef(null), drag = useRef(null), mounted = useRef(false), photoRequest = useRef(0);
  const pointers = useRef(new Map());
  const [adjustmentsOpen, setAdjustmentsOpen] = useState(false);
  const [ready, setReady] = useState(false), [hasPhoto, setHasPhoto] = useState(false);
  const [zoom, setZoom] = useState(1), [openingCamera, setOpeningCamera] = useState(false);
  const [message, setMessage] = useState('Carregando a moldura…');
  const render = () => drawPoster(canvas.current, model.current);
  function stopCamera() {
    cameraRequest.current++;
    cancelAnimationFrame(cameraFrame.current); cameraFrame.current = null;
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    if (video.current) video.current.srcObject = null;
    if (mounted.current) { setCameraActive(false); setOpeningCamera(false); render(); }
  }
  useEffect(() => {
    mounted.current = true;
    prepareMask(`${import.meta.env.BASE_URL}mascara-cellera.png`).then(overlay => {
      if (!mounted.current) return;
      model.current.overlay = overlay; render(); setReady(true);
      setMessage('Escolha uma foto ou tire uma selfie para começar.');
    }).catch(() => { if (mounted.current) setMessage('Não foi possível carregar a moldura. Recarregue a página.'); });
    const onHide = () => { stopCamera(); };
    window.addEventListener('pagehide', onHide);
    return () => { mounted.current = false; photoRequest.current++; stopCamera(); window.removeEventListener('pagehide', onHide); };
  }, []);
  async function loadPhoto(blob) {
    const request = ++photoRequest.current, url = URL.createObjectURL(blob);
    try {
      const image = new Image(); image.src = url; await image.decode();
      if (!mounted.current || request !== photoRequest.current) return;
      Object.assign(model.current, { photo: image, zoom: 1, offset: { x: 0, y: 0 } });
      pointers.current.clear(); drag.current = null;
      setZoom(1); setAdjustmentsOpen(false); setHasPhoto(true); render(); setMessage('Arraste para posicionar. Use dois dedos para ampliar.');
    } catch { if (mounted.current) setMessage('Não foi possível abrir essa imagem. Tente JPG, PNG ou WebP.'); }
    finally { URL.revokeObjectURL(url); }
  }
  function selectPhoto(event) {
    const file = event.target.files[0]; event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMessage('Escolha um arquivo de imagem.');
    if (file.size > 12 * 1024 * 1024) return setMessage('A imagem precisa ter até 12 MB.');
    loadPhoto(file);
  }
  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) return setMessage('Para usar a câmera, abra em HTTPS ou localhost. Você também pode escolher uma imagem.');
    setOpeningCamera(true);
    const request = ++cameraRequest.current;
    pointers.current.clear(); drag.current = null; setAdjustmentsOpen(false);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1920 } }, audio: false });
      if (!mounted.current || request !== cameraRequest.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media; video.current.srcObject = media; await video.current.play();
      if (!mounted.current || request !== cameraRequest.current) return;
      setCameraActive(true); setMessage('Enquadre seu rosto na moldura e toque em Capturar foto.');
      const preview = () => {
        if (request !== cameraRequest.current || !mounted.current) return;
        if (video.current.readyState >= 2) drawPoster(canvas.current, { photo: video.current, overlay: model.current.overlay, zoom: 1, offset: { x: 0, y: 0 }, mirrored: true });
        cameraFrame.current = requestAnimationFrame(preview);
      };
      preview();
    } catch {
      if (request !== cameraRequest.current) return;
      stopCamera();
      if (mounted.current) setMessage('Não foi possível acessar a câmera. Confira a permissão ou escolha uma imagem.');
    } finally { if (mounted.current && request === cameraRequest.current) setOpeningCamera(false); }
  }
  function capturePhoto() {
    const v = video.current; if (!v.videoWidth) return;
    const capture = document.createElement('canvas'); capture.width = v.videoWidth; capture.height = v.videoHeight;
    const ctx = capture.getContext('2d'); ctx.translate(capture.width, 0); ctx.scale(-1, 1); ctx.drawImage(v, 0, 0);
    photoRequest.current++;
    Object.assign(model.current, { photo: capture, zoom: 1, offset: { x: 0, y: 0 } });
    setZoom(1); setHasPhoto(true); setAdjustmentsOpen(false);
    stopCamera(); setMessage('Arraste para posicionar. Use dois dedos para ampliar.');
  }
  function download() {
    render(); canvas.current.toBlob(blob => {
      if (!mounted.current) return;
      if (!blob) return setMessage('Não foi possível gerar o pôster. Tente novamente.');
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'cellera-semana-qualidade-2026.png'; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000); setMessage('Pôster gerado! Confira os downloads do dispositivo.');
    }, 'image/png');
  }
  function gestureSnapshot() {
    const points = [...pointers.current.values()].slice(0, 2);
    if (!points.length) { drag.current = null; return; }
    const a = points[0], b = points[1] || a;
    drag.current = {
      x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
      distance: points.length === 2 ? Math.hypot(b.x - a.x, b.y - a.y) : 0,
      zoom: model.current.zoom, offset: { ...model.current.offset },
    };
  }
  function pointerDown(event) {
    if (!hasPhoto || cameraActive || openingCamera) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureSnapshot();
  }
  function pointerMove(event) {
    if (!pointers.current.has(event.pointerId) || !drag.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()].slice(0, 2), a = points[0], b = points[1] || a;
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    const rect = canvas.current.getBoundingClientRect(), ratio = canvas.current.width / rect.width, start = drag.current;
    const value = start.distance > 0 ? Math.max(1, Math.min(3, start.zoom * Math.hypot(b.x - a.x, b.y - a.y) / start.distance)) : start.zoom;
    const scale = value / start.zoom;
    // Keep the photo point beneath the fingers anchored while scaling.
    model.current.offset = {
      x: start.offset.x * scale + (1 - scale) * ((start.x - rect.left) * ratio - 540) + (x - start.x) * ratio,
      y: start.offset.y * scale + (1 - scale) * ((start.y - rect.top) * ratio - 1012.5) + (y - start.y) * ratio,
    };
    model.current.zoom = value; setZoom(value);
    render();
    gestureSnapshot();
  }
  function pointerEnd(event) {
    pointers.current.delete(event.pointerId);
    gestureSnapshot();
  }
  return <>
    <main><section className="editor" aria-label="Monte seu pôster">
      <div className="poster">
        <div className="poster-art">
        <canvas ref={canvas} id="poster" width="1080" height="1920" aria-label="Prévia do pôster com sua foto"
          onPointerDown={pointerDown}
          onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} />
        {!hasPhoto && !cameraActive && <span id="placeholder">Sua foto entra aqui</span>}
        </div>
      </div>
      <div className="controls">
        {hasPhoto && !cameraActive && !openingCamera && <>
          <button className="adjustments-toggle secondary" aria-expanded={adjustmentsOpen} aria-controls="photo-adjustments" onClick={() => { pointers.current.clear(); drag.current = null; setAdjustmentsOpen(open => !open); }}>
            {adjustmentsOpen ? 'Recolher ajustes ▴' : 'Ajustar zoom ▾'}
          </button>
          <div id="photo-adjustments" className="adjustments" hidden={!adjustmentsOpen}>
          <label htmlFor="zoom">Zoom <output>{zoom.toFixed(2)}×</output></label>
          <input id="zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={event => { const value = Number(event.target.value); setZoom(value); model.current.zoom = value; render(); }} />
          <small>Arraste para posicionar ou use dois dedos para ampliar.</small>
        </div></>}
        <p id="status" role="status" aria-live="polite">{message}</p>
        <div className="actions">
          {cameraActive || openingCamera ? <>
            <button disabled={!cameraActive} onClick={capturePhoto}>{openingCamera ? 'Abrindo câmera…' : 'Capturar foto'}</button>
            <button className="secondary" onClick={() => { stopCamera(); setMessage(hasPhoto ? 'Arraste para posicionar. Use dois dedos para ampliar.' : 'Escolha uma foto ou tire uma selfie para começar.'); }}>Cancelar</button>
          </> : <>
          <button disabled={!ready || openingCamera} onClick={openCamera}>{openingCamera ? 'Abrindo câmera…' : 'Tirar selfie'}</button>
          <button className="secondary" disabled={!ready} onClick={() => fileInput.current.click()}>{hasPhoto ? 'Trocar imagem' : 'Escolher imagem'}</button>
          {hasPhoto && <button id="downloadButton" onClick={download}>Baixar pôster PNG</button>}
          </>}
        </div>
      </div>
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={selectPhoto} />
    </section></main>
    <video ref={video} autoPlay muted playsInline hidden aria-hidden="true" />
  </>;
}
