// Поезда на двух путях (ряды 129 и 130), шлагбаумы на переездах, гибель при столкновении.
import { G } from '../state.js';
import { TS, OX, OZ, WORLD, tileZ, RAIL_R0 } from '../world/map.js';
import { damagePed } from './peds.js';

const TRACKS = [{ z: tileZ(RAIL_R0), dir: 1 }, { z: tileZ(RAIL_R0 + 1), dir: -1 }];
const LOCO = 18, WAG = 14.5, GAP = 0.8;
const PAINT = [['#b02a2a', '#e8e3d6'], ['#2d4f8a', '#e8e3d6'], ['#3a6b45', '#dcd6c4']];

export function initTrains() {
  G.trains = TRACKS.map((tr, i) => ({ ...tr, x: 0, active: false, wait: 6 + i * 14, len: 0, n: 0, speed: 0, paint: PAINT[i % 3], cargo: [] }));
}
function launch(t) {
  t.n = 4 + Math.floor(Math.random() * 4); t.len = LOCO + t.n * (WAG + GAP); t.speed = 13 + Math.random() * 5;
  t.cargo = Array.from({ length: t.n }, () => ['#6b5a3a', '#4a5568', '#7a3b2e', '#58606b'][Math.floor(Math.random() * 4)]);
  const px = G.player.x;
  t.x = t.dir > 0 ? Math.max(WORLD.x0 - 5, px - 330) : Math.min(WORLD.x1 + 5, px + 330) ;   // x головы
  if (t.dir > 0) t.x = Math.max(t.x, WORLD.x0 + t.len * 0 - 5); t.active = true;
}
export function trainRect(t) { // [xmin, xmax]
  return t.dir > 0 ? [t.x - t.len, t.x] : [t.x, t.x + t.len];
}
export function updateTrains(dt) {
  for (const t of G.trains) {
    if (!t.active) { t.wait -= dt; if (t.wait <= 0) launch(t); continue; }
    t.x += t.dir * t.speed * dt;
    const [a, b] = trainRect(t);
    if (b < WORLD.x0 - 30 || a > WORLD.x1 + 30) { t.active = false; t.wait = 25 + Math.random() * 40; continue; }
    // Столкновения
    const z0 = t.z - 1.6, z1 = t.z + 1.6, p = G.player;
    if (!p.inVehicle && !p.dead && p.x > a && p.x < b && p.z > z0 && p.z < z1) G.hurtPlayer(1000, 'train');
    for (const q of G.peds) if (!q.dead && q.x > a && q.x < b && q.z > z0 && q.z < z1) damagePed(q, 999, false, q.x, q.z - 1);
    for (const v of G.cars) {
      if (v.wreck && Math.abs(v.vx) < 0.1) { if (!(v.x > a && v.x < b && v.z > z0 - 2 && v.z < z1 + 2)) continue; }
      for (const [cx, cz, r] of v.circles()) {
        if (cx > a - r && cx < b + r && cz > z0 - r && cz < z1 + r) {
          v.damage(600, 'train', 20); v.vx = t.dir * t.speed * 0.6; v.vz += (v.z < t.z ? -1 : 1) * 3; if (v.driver === 'player') G.hurtPlayer(1000, 'train'); break;
        }
      }
    }
  }
  for (const g of G.gates) g.closed = G.trains.some(t => { if (!t.active) return false; const [a, b] = trainRect(t); return g.x > a - 55 && g.x < b + 45; });
}

export function drawTrains(ctx, cam) {
  for (const t of G.trains) {
    if (!t.active) continue;
    const [a, b] = trainRect(t); if (b < cam.wx(0) - 5 || a > cam.wx(cam.w) + 5 || Math.abs(t.z - cam.z) > cam.h / cam.ppm / 2 + 5) continue;
    const k = cam.ppm, y = cam.sz(t.z), H = 3.1 * k;
    const segs = []; let x = t.x;
    for (let i = 0; i <= t.n; i++) { const len = i === 0 ? LOCO : WAG; if (t.dir > 0) { segs.push({ x0: x - len, len, i }); x -= len + GAP; } else { segs.push({ x0: x, len, i }); x += len + GAP; } }
    for (const s of segs) {
      const sx = cam.sx(s.x0), w = s.len * k;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(sx + 0.3 * k, y - H / 2 + 0.35 * k, w, H);
      ctx.fillStyle = s.i === 0 ? t.paint[0] : t.cargo[s.i - 1]; ctx.fillRect(sx, y - H / 2, w, H);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(sx, y - H / 2, w, H * 0.2);
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(sx, y + H / 2 - H * 0.2, w, H * 0.2);
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(sx, y - H / 2, w, H);
      if (s.i === 0) {
        ctx.fillStyle = t.paint[1]; ctx.fillRect(sx + w * 0.08, y - H * 0.18, w * 0.84, H * 0.36);
        ctx.fillStyle = '#26323f'; const front = t.dir > 0 ? sx + w - 4.2 * k : sx + 0.4 * k; ctx.fillRect(front, y - H * 0.38, 3.8 * k, H * 0.76);
        ctx.fillStyle = '#222'; for (let q = 0; q < 3; q++) ctx.fillRect(sx + w * (0.2 + q * 0.17), y - H * 0.4, w * 0.1, H * 0.8);
      } else {
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; for (let q = 1; q < 9; q++) { const rx = sx + w * q / 9; ctx.beginPath(); ctx.moveTo(rx, y - H / 2 + 3); ctx.lineTo(rx, y + H / 2 - 3); ctx.stroke(); }
      }
    }
    // фара
    const hx = cam.sx(t.dir > 0 ? t.x : t.x); ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(hx, y - H * 0.28, 3, 0, 7); ctx.arc(hx, y + H * 0.28, 3, 0, 7); ctx.fill();
  }
}

export function drawGates(ctx, cam, time) {
  for (const g of G.gates) {
    if (!cam.visible(g.x, g.z, 14)) continue;
    const open = 1 - g.arm;
    for (const north of [true, false]) {
      const px = cam.sx(north ? g.x - 4 : g.x + 4), pz = cam.sz(north ? tileZ(RAIL_R0 - 1) - 0.5 : tileZ(RAIL_R0 + 2) + 0.5);
      ctx.fillStyle = '#2a2d33'; ctx.fillRect(px - 4, pz - 4, 8, 8);
      ctx.save(); ctx.translate(px, pz); ctx.rotate(-open * 1.45);
      const L = 4 * cam.ppm, th = 0.32 * cam.ppm, dir = north ? 1 : -1;
      for (let q = 0; q < 6; q++) { ctx.fillStyle = q % 2 ? '#f4f4f4' : '#d62a2a'; ctx.fillRect(dir > 0 ? q * L / 6 : -(q + 1) * L / 6, -th / 2, L / 6 + 0.5, th); }
      ctx.restore();
      if (g.closed) { ctx.fillStyle = Math.floor(time * 3) % 2 ? '#ff3030' : '#601010'; ctx.beginPath(); ctx.arc(px, pz + (north ? -9 : 9), 4, 0, 7); ctx.fill(); }
    }
  }
}
