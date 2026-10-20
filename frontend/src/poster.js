const area = { x: 96, y: 431, w: 888, h: 1163, r: 26 };
export async function prepareMask(url) {
  const mask = new Image(); mask.src = url; await mask.decode();
    const overlay = document.createElement('canvas'); overlay.width = 1080; overlay.height = 1920;
    const c = overlay.getContext('2d', { willReadFrequently: true }); c.drawImage(mask, 0, 0, 1080, 1920);
    // Remove only the connected white photo opening; retain lettering and foreground blocks.
    const pixels = c.getImageData(0, 0, 1080, 1920), data = pixels.data;
    const queue = new Int32Array(1080 * 1920); let head = 0, tail = 0;
    function visit(p) {
      const i = p * 4;
      if (data[i + 3] && data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) {
        data[i + 3] = 0; queue[tail++] = p;
      }
    }
    visit(600 * 1080 + 540);
    while (head < tail) {
      const p = queue[head++], x = p % 1080;
      if (x > 0) visit(p - 1); if (x < 1079) visit(p + 1);
      if (p >= 1080) visit(p - 1080); if (p < 1080 * 1919) visit(p + 1080);
    }
    c.putImageData(pixels, 0, 0);
  return overlay;
}
export function drawPoster(canvas, model) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { photo, overlay, zoom, offset } = model;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (photo) {
    const scale = Math.max(area.w / photo.width, area.h / photo.height) * zoom;
    const w = photo.width * scale, h = photo.height * scale;
    const limitX = (w - area.w) / 2, limitY = (h - area.h) / 2;
    offset.x = Math.max(-limitX, Math.min(limitX, offset.x));
    offset.y = Math.max(-limitY, Math.min(limitY, offset.y));
    ctx.save(); ctx.beginPath(); ctx.roundRect(area.x, area.y, area.w, area.h, area.r); ctx.clip();
    ctx.drawImage(photo, area.x + (area.w - w) / 2 + offset.x, area.y + (area.h - h) / 2 + offset.y, w, h);
    ctx.restore();
  }
  if (overlay) ctx.drawImage(overlay, 0, 0);
}
