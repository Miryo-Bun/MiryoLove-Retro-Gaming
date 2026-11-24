// Визуальные эффекты: взрывы, огонь, дым, обломки, следы гари, разрушение предметов, стадии повреждений машин.
import { G, state } from '../state.js';
import { damagePed } from './peds.js';
import { makeNoise } from './combat.js';
import { CHUNK, TS, OX, OZ, CW } from '../world/map.js';

const MAXFX = 520;
export function addFx(f) {
  if (G.fx.length >= MAXFX) { for (let i = 0; i < G.fx.length; i++) { const k = G.fx[i].k; if (k === 'smoke' || k === 'ember' || k === 'debris') { G.fx.splice(i, 1); break; } } if (G.fx.length >= MAXFX) return; }
  G.fx.push(f);
}
G.decals = G.decals || [];
const rnd = (a, b) => a + Math.random() * (b - a);

export function explode(x, z, o = {}) {
  const r = o.r ?? 7, dmg = o.dmg ?? 90, by = o.by === 'player', p = G.player;
  const dp = Math.hypot(p.x - x, p.z - z);
  addFx({ k: 'ring', x, z, t: 0, life: 0.55, r });
  addFx({ k: 'blast', x, z, t: 0, life: 0.28, r });
  const near = dp < 140;
  if (near) {
    for (let i = 0; i < 20; i++) { const a = Math.random() * 6.28, s = rnd(1.5, 9); addFx({ k: 'fire', x, z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, t: 0, life: rnd(0.45, 1.1), size: rnd(0.7, 1.9) }); }
    for (let i = 0; i < 12; i++) { const a = Math.random() * 6.28, s = rnd(3, 13); addFx({ k: 'debris', x, z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, t: 0, life: rnd(0.9, 1.9), size: rnd(0.15, 0.4), rot: Math.random() * 6, vr: rnd(-12, 12), col: Math.random() < 0.5 ? '#222' : '#5a4a3a' }); }
    for (let i = 0; i < 9; i++) addFx({ k: 'smoke', x: x + rnd(-2, 2), z: z + rnd(-2, 2), vx: rnd(-1, 1), vz: rnd(-1.6, -0.3), t: 0, life: rnd(1.6, 3.2), r: rnd(0.9, 1.6) });
  }
  G.decals.push({ x, z, r: r * 0.5, rot: Math.random() * 6 }); if (G.decals.length > 70) G.decals.shift();
  if (G.cam) G.cam.shake = Math.max(G.cam.shake, Math.max(0, Math.min(1.1, 1.3 - dp / 45)));
  makeNoise(x, z, 'shot', 70);
  G.sfx?.('explosion', dp);
  // Урон
  for (const q of G.peds) { if (q.dead) continue; const d = Math.hypot(q.x - x, q.z - z); if (d < r) damagePed(q, dmg * (1 - d / r) * 1.3, by, x, z); }
  for (const v of G.cars) {
    const d = Math.hypot(v.x - x, v.z - z); if (d > r + v.stats.l / 2 || v === o.skip) continue;
    const f = 1 - Math.min(1, d / (r + v.stats.l / 2));
    v.damage(dmg * 4.5 * f, 'blast', 0, by); const dx = v.x - x, dz = v.z - z, n = Math.hypot(dx, dz) || 1; v.vx += dx / n * 12 * f / v.stats.mass; v.vz += dz / n * 12 * f / v.stats.mass;
  }
  if (dp < r && !p.dead) { const f = 1 - dp / r; G.hurtPlayer(dmg * f * 0.9, 'blast'); if (!p.inVehicle) { p.vx += (p.x - x) / (dp || 1) * 6 * f; p.vz += (p.z - z) / (dp || 1) * 6 * f; } }
  if (by) G.crime?.('explosion', x, z);
}

export function debrisBurst(x, z, n = 6, col = '#6a5a4a') {
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = rnd(2, 6); addFx({ k: 'debris', x, z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, t: 0, life: rnd(0.5, 1.1), size: rnd(0.1, 0.28), rot: Math.random() * 6, vr: rnd(-10, 10), col }); }
  for (let i = 0; i < 3; i++) addFx({ k: 'spark', x, z, t: 0, life: 0.2 });
}

// Разрушение декора при наезде/ударе
export const DESTRUCTIBLE = new Set(['lamp', 'hydrant', 'bin', 'bench', 'busstop', 'cafe_table', 'umbrella_red', 'umbrella_blue', 'flowers', 'fence', 'fence_v', 'barrier', 'sandbags', 'pump']);
export function breakDecor(d) {
  if (d.broken) return; d.broken = true; d.lampRef && (d.lampRef.broken = true);
  debrisBurst(d.x, d.z, d.name === 'lamp' ? 8 : 6, d.name === 'hydrant' ? '#b02a2a' : '#6a5a4a');
  if (d.name === 'hydrant') for (let i = 0; i < 14; i++) addFx({ k: 'water', x: d.x, z: d.z, vx: rnd(-2, 2), vz: rnd(-2, 2), t: 0, life: rnd(0.8, 1.6), size: 0.18 });
  G.renderer?.invalidate(d.x, d.z); G.sfx?.('crash_small');
}
export function updateDestruction(dt) {
  const w = G.world; if (!w) return;
  for (const v of G.cars) {
    const sp = Math.hypot(v.vx, v.vz); if (sp < 3.5) continue;
    const ci = Math.floor((v.x - OX) / TS / CHUNK), cj = Math.floor((v.z - OZ) / TS / CHUNK); const ch = w.chunks[cj * CW + ci]; if (!ch) continue;
    for (const d of ch.d) { if (d.broken || !DESTRUCTIBLE.has(d.name) || d.name[0] === '@') continue; if (Math.abs(d.x - v.x) > v.stats.l / 2 + 1 || Math.abs(d.z - v.z) > v.stats.l / 2 + 1) continue; if (v.inside(d.x, d.z, 0.5)) { breakDecor(d); v.vx *= 0.96; v.vz *= 0.96; } }
  }
}

// Горящая машина: огонь, затем взрыв
export function updateVehicleFire(v, dt) {
  if (!v.wreck || v.charred) return;
  if (!v.burning) { v.burning = true; v.burnT = v.type === 'tank' ? 7 : 3.5 + Math.random() * 4; v.lastHitBy = v.lastHitBy || null; }
  v.burnT -= dt;
  if (Math.hypot(v.x - G.player.x, v.z - G.player.z) < 130) {
    v.fxT = (v.fxT || 0) - dt;
    if (v.fxT <= 0) { v.fxT = 0.07; const a = Math.random() * 6.28, rr = Math.random() * v.stats.l * 0.3; addFx({ k: 'fire', x: v.x + Math.cos(a) * rr, z: v.z + Math.sin(a) * rr, vx: rnd(-0.6, 0.6), vz: rnd(-1.6, -0.5), t: 0, life: rnd(0.35, 0.7), size: rnd(0.5, 1.1) }); if (Math.random() < 0.5) addFx({ k: 'smoke', x: v.x, z: v.z, vx: rnd(-0.6, 0.6), vz: rnd(-1.2, -0.4), t: 0, life: rnd(1.2, 2.2), r: rnd(0.5, 0.9) }); }
  }
  if (v.burnT <= 0) { v.burning = false; v.charred = true; explode(v.x, v.z, { r: 6.2, dmg: 60, by: v.lastHitBy === 'player' ? 'player' : null, skip: v }); }
}

// Метки повреждений (предрассчитанные, детерминированные) — рисуются поверх спрайта в Vehicle.draw
export function damageMarks(v) {
  let s = (v.id * 2654435761) >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const L = v.stats.l, W = v.stats.w, marks = [];
  for (let i = 0; i < 10; i++) marks.push({ x: (r() - 0.5) * L * 0.8, z: (r() - 0.5) * W * 0.7, a: r() * 3.14, len: 0.4 + r() * 0.8, w: 0.25 + r() * 0.5 });
  return marks;
}
export function drawDamage(ctx, v, k) {
  const f = v.hp / v.maxHp, charred = v.charred, wreck = v.wreck; if (f > 0.75 && !wreck) return;
  const m = v.marks || (v.marks = damageMarks(v)); const n = wreck ? 10 : f < 0.25 ? 9 : f < 0.5 ? 6 : 3;
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const q = m[i], x = q.x * k, z = q.z * k;
    if (i < 3 || (i % 2 === 0 && f < 0.5)) { ctx.strokeStyle = 'rgba(235,235,235,0.55)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x, z); ctx.lineTo(x + Math.cos(q.a) * q.len * k, z + Math.sin(q.a) * q.len * k); ctx.stroke(); ctx.strokeStyle = 'rgba(20,20,20,0.5)'; ctx.beginPath(); ctx.moveTo(x + 1, z + 1); ctx.lineTo(x + 1 + Math.cos(q.a) * q.len * k, z + 1 + Math.sin(q.a) * q.len * k); ctx.stroke(); }
    if (f < 0.5 || wreck) { ctx.fillStyle = f < 0.25 || wreck ? 'rgba(15,12,10,0.55)' : 'rgba(70,45,30,0.4)'; ctx.beginPath(); ctx.ellipse(x, z, q.w * k * 0.9, q.w * k * 0.6, q.a, 0, 7); ctx.fill(); }
  }
  if (f < 0.25 || wreck) { // треснувшее лобовое
    ctx.strokeStyle = 'rgba(240,250,255,0.7)'; ctx.lineWidth = 0.9; ctx.beginPath(); const fx0 = v.stats.l * 0.12 * k; ctx.moveTo(fx0, -v.stats.w * 0.25 * k); ctx.lineTo(fx0 + 4, -2); ctx.lineTo(fx0 - 2, 3); ctx.lineTo(fx0 + 5, v.stats.w * 0.25 * k); ctx.stroke();
  }
  if (charred) { ctx.fillStyle = 'rgba(8,6,5,0.72)'; ctx.fillRect(-v.stats.l / 2 * k, -v.stats.w / 2 * k, v.stats.l * k, v.stats.w * k); }
  else if (wreck) { ctx.fillStyle = 'rgba(10,8,6,0.5)'; ctx.fillRect(-v.stats.l / 2 * k, -v.stats.w / 2 * k, v.stats.l * k, v.stats.w * k); }
  ctx.restore();
}
