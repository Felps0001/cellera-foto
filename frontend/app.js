const canvas = document.querySelector('#composition');
const context = canvas.getContext('2d', { willReadFrequently: true });
const photoFile = document.querySelector('#photo-file');
const uploadZone = document.querySelector('#upload-zone');
const uploadLabel = document.querySelector('#upload-label');
const formMessage = document.querySelector('#form-message');
const cameraStart = document.querySelector('#camera-start');
const cameraView = document.querySelector('#camera-view');
const cameraVideo = document.querySelector('#camera-video');

let maskImage = null;
let photoImage = null;
let photoIsMirrored = false;
let cameraStream = null;
let maskHole = null;

function findTransparentOpening(image) {
  const scale = Math.min(1, 480 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const sample = document.createElement('canvas');
  sample.width = width;
  sample.height = height;
  const sampleContext = sample.getContext('2d', { willReadFrequently: true });
  sampleContext.drawImage(image, 0, 0, width, height);
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const horizontal = sampleContext.getImageData(0, centerY, width, 1).data;
  const vertical = sampleContext.getImageData(centerX, 0, 1, height).data;
  const findRun = (length, center, alphaAt) => {
    if (alphaAt(center) >= 32) return null;
    let start = center;
    let end = center;
    while (start > 0 && alphaAt(start - 1) < 32) start -= 1;
    while (end < length - 1 && alphaAt(end + 1) < 32) end += 1;
    return { start, end };
  };
  const horizontalRun = findRun(width, centerX, (x) => horizontal[x * 4 + 3]);
  const verticalRun = findRun(height, centerY, (y) => vertical[y * 4 + 3]);
  if (!horizontalRun || !verticalRun) return null;
  const factorX = image.naturalWidth / width;
  const factorY = image.naturalHeight / height;
  const x = horizontalRun.start * factorX;
  const y = verticalRun.start * factorY;
  const openingWidth = (horizontalRun.end - horizontalRun.start + 1) * factorX;
  const openingHeight = (verticalRun.end - verticalRun.start + 1) * factorY;
  if (openingWidth / openingHeight < 0.5 || openingWidth / openingHeight > 1.5) return null;
  return { x, y, width: openingWidth, height: openingHeight };
}

function setMask(image) {
  maskImage = image;
  maskHole = findTransparentOpening(image);
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  renderComposition();
  if (!maskHole) {
    formMessage.textContent = 'Não encontrei uma área transparente central na moldura.';
    formMessage.style.color = '#b54a34';
  } else {
    formMessage.textContent = 'Máscara pronta. Escolha uma foto para continuar.';
    formMessage.style.color = '';
  }
}

function renderComposition() {
  if (!maskImage) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (photoImage && maskHole) {
    const { x, y, width, height } = maskHole;
    const scale = Math.max(width / photoImage.naturalWidth, height / photoImage.naturalHeight);
    const photoWidth = photoImage.naturalWidth * scale;
    const photoHeight = photoImage.naturalHeight * scale;
    context.save();
    if (photoIsMirrored) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(photoImage, x + (width - photoWidth) / 2, y + (height - photoHeight) / 2, photoWidth, photoHeight);
    context.restore();
  }
  context.drawImage(maskImage, 0, 0);

  uploadLabel.textContent = photoImage && maskHole ? 'Baixar imagem' : 'Escolher imagem';
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

async function setPhoto(source, label, mirrored = false) {
  try {
    photoImage = await loadImage(source);
    photoIsMirrored = mirrored;
    renderComposition();
    formMessage.textContent = maskHole ? 'Foto pronta. Baixe sua imagem pelo botão no rodapé.' : 'A moldura precisa ter uma área transparente central.';
    formMessage.style.color = '';
  } catch {
    formMessage.textContent = 'Não foi possível abrir essa imagem. Tente outro arquivo.';
    formMessage.style.color = '#b54a34';
  }
}

photoFile.addEventListener('change', () => {
  const file = photoFile.files[0];
  if (file) {
    stopCamera();
    setPhoto(URL.createObjectURL(file), file.name);
  }
});

function downloadComposition() {
  if (!photoImage || !maskHole) return;
  const anchor = document.createElement('a');
  anchor.download = 'celera-farma-semana-qualidade.png';
  anchor.href = canvas.toDataURL('image/png');
  anchor.click();
}

uploadZone.addEventListener('click', (event) => {
  if (!photoImage || !maskHole) return;
  event.preventDefault();
  downloadComposition();
});

cameraStart.addEventListener('click', async () => {
  if (cameraStream) {
    if (!cameraVideo.videoWidth) return;
    const capture = document.createElement('canvas');
    capture.width = cameraVideo.videoWidth;
    capture.height = cameraVideo.videoHeight;
    const captureContext = capture.getContext('2d');
    captureContext.translate(capture.width, 0);
    captureContext.scale(-1, 1);
    captureContext.drawImage(cameraVideo, 0, 0, capture.width, capture.height);
    setPhoto(capture.toDataURL('image/png'), 'selfie.png');
    stopCamera();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    formMessage.textContent = 'A câmera não está disponível neste navegador.';
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    cameraVideo.srcObject = cameraStream;
    cameraView.hidden = false;
    cameraStart.textContent = 'Capturar selfie';
  } catch {
    formMessage.textContent = 'Permita o acesso à câmera para fazer uma selfie.';
    formMessage.style.color = '#b54a34';
  }
});

function stopCamera() {
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  cameraVideo.srcObject = null;
  cameraView.hidden = true;
  cameraStart.textContent = 'Tirar selfie';
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && cameraStream) stopCamera();
});

window.addEventListener('beforeunload', stopCamera);

loadImage('/Moldura.png')
  .then(setMask)
  .catch(() => {
    formMessage.textContent = 'Não foi possível carregar a moldura.';
  });