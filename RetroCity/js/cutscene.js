// Лёгкие кат-сцены: затемнение + портрет + диалог + субтитры, с возможностью пропуска (Space/Enter/клик).
import { G, state } from './state.js';
import { heroFrame } from './engine/assets.js';

let active = null;
export function isCutscene() { return !!active; }
export function playCutscene(lines, opts = {}) {
  return new Promise(res => {
    active = { lines, i: 0, t: 0, perLine: opts.perLine ?? 3.0, portrait: opts.portrait !== false, onDone: res, fadeIn: 0.4, fadeOut: 0, cameraX: G.cam?.x, cameraZ: G.cam?.z };
    G.sfx?.('cutscene');
  });
}
export function skipCutscene() { if (active) { const r = active.onDone; active = null; r?.(); } }
export function updateCutscene(dt) {
  if (!active) return;
  active.t += dt;
  const line = active.lines[active.i] || {};
  if (G.cam && (line.target || line.zoom)) {
    if (line.target) {
      G.cam.x += ((line.target.x ?? G.cam.x) - G.cam.x) * Math.min(1, dt * (line.cameraSpeed ?? 1.8));
      G.cam.z += ((line.target.z ?? G.cam.z) - G.cam.z) * Math.min(1, dt * (line.cameraSpeed ?? 1.8));
    }
    if (line.zoom) G.cam.zoom += (line.zoom - G.cam.zoom) * Math.min(1, dt * 1.4);
  }
  if (active.t > active.perLine) { active.t = 0; active.i++; if (active.i >= active.lines.length) { const r = active.onDone; active = null; r?.(); } }
}
export function renderCutscene(ctx, w, h) {
  if (!active) return;
  const a = Math.min(1, active.fadeIn <= 0 ? 1 : 1 - active.fadeIn), bar = Math.min(h * 0.14, 90 * (active.fadeIn > 0 ? 1 - active.fadeIn : 1));
  active.fadeIn = Math.max(0, active.fadeIn - 0.05);
  ctx.save();
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, bar); ctx.fillRect(0, h - bar, w, bar);
  const line = active.lines[active.i] || {};
  if (active.portrait && line.heroId) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 96; const g = cv.getContext('2d');
    g.fillStyle = '#5f635a'; g.fillRect(0, 0, 96, 96); const [img, sx, sy] = heroFrame(line.heroId, 'idle', 0);
    g.imageSmoothingEnabled = false; g.drawImage(img, sx, sy, 64, 64, 16, 16, 64, 64);
    ctx.drawImage(cv, 24, h - bar + (bar - 96) / 2 > 10 ? h - 86 - 96 : 24, 96, 96);
  }
  ctx.font = '13px "Press Start 2P", monospace'; ctx.fillStyle = '#ffd400'; ctx.textAlign = 'left';
  if (line.who) ctx.fillText(line.who, 140, h - 60);
  ctx.font = '11px "Press Start 2P", monospace'; ctx.fillStyle = '#fff';
  wrapText(ctx, line.text || '', 140, h - 38, w - 200, 16);
  ctx.textAlign = 'right'; ctx.font = '9px monospace'; ctx.fillStyle = '#999'; ctx.fillText('Пробел — пропустить', w - 20, h - 14);
  ctx.restore();
}
function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '', yy = y;
  for (const wd of words) { const t = line + wd + ' '; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = wd + ' '; yy += lh; } else line = t; }
  ctx.fillText(line, x, yy);
}
