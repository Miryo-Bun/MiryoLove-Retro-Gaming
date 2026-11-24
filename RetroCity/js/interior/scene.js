// Сцена интерьера: вход/выход, движение игрока, NPC внутри, интерактивные объекты, отрисовка (вид сверху, тот же стиль).
import { G, state } from '../state.js';
import { A, vehicleSprite } from '../engine/assets.js';
import { Person, advanceAnim, drawPerson, drawPersonShadow, moveSlide } from '../entities/person.js';
import { input, down, hit } from '../engine/input.js';
import { buildInterior } from './defs.js';
import { smooth, turnToward, angDiff, clamp } from '../engine/util.js';
import { speedMul } from '../economy.js';

const CELL = 32;   // px на клетку при 16 px/м
const cache = new Map();
const HOURS = { office: [8, 19], bank: [9, 18], dealer: [9, 20], shop: [7, 23], restaurant: [8, 24], mall: [8, 22], gas: [0, 24] };
export function openNow(type, t = state.dayTime) {
  const k = type.startsWith('shop_') ? 'shop' : type; const h = HOURS[k]; if (!h) return true;
  return t >= h[0] && t < h[1];
}
export function openHoursText(type) { const k = type.startsWith('shop_') ? 'shop' : type; const h = HOURS[k]; return h ? `${h[0]}:00–${h[1] === 24 ? '24:00' : h[1] + ':00'}` : ''; }

function bake(def) {
  const W = def.w * CELL, H = def.h * CELL, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), it = A.m.interior.items; g.imageSmoothingEnabled = false;
  const draw = (name, x, y, w, h) => { const [sx, sy, sw, sh] = it[name]; g.drawImage(A.interior, sx, sy, sw, sh, x, y, w ?? sw, h ?? sh); };
  for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) { draw(def.cells[y * def.w + x], x * CELL, y * CELL, CELL, CELL); }
  for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) if (def.walls[y * def.w + x]) draw('wall', x * CELL, y * CELL, CELL, CELL);
  for (const cx of def.wins) { g.fillStyle = '#9fd0ea'; g.fillRect(cx * CELL + 4, 5, CELL - 8, 7); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(cx * CELL + 4, 5, CELL - 8, 2); }
  g.imageSmoothingEnabled = true;
  const place = (name, x, z, rot) => { const [sx, sy, sw, sh] = it[name]; g.save(); g.translate(x * 16, z * 16); g.rotate(rot * Math.PI / 2); g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(-sw / 2 + 3, -sh / 2 + 3, sw, sh); g.drawImage(A.interior, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh); g.restore(); };
  const flat = def.items.filter(i => ['rug', 'platform'].includes(i.name)), rest = def.items.filter(i => !['rug', 'platform'].includes(i.name)).sort((a, b) => a.z - b.z);
  for (const i of flat) { const [sx, sy, sw, sh] = it[i.name]; g.save(); g.translate(i.x * 16, i.z * 16); g.rotate(i.rot * Math.PI / 2); g.drawImage(A.interior, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh); g.restore(); }
  for (const c of def.cars) {
    const sp = vehicleSprite(c.type, c.color), [sx, sy, sw, sh] = sp.rect, k = 16 / A.m.vehicles.ppu;
    g.save(); g.translate(c.x * 16, c.z * 16 - 2); g.rotate(c.ang); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-sw * k / 2 + 3, -sh * k / 2 + 3, sw * k, sh * k); g.drawImage(A.veh, sx, sy, sw, sh, -sw * k / 2, -sh * k / 2, sw * k, sh * k); g.restore();
  }
  for (const i of rest) place(i.name, i.x, i.z, i.rot);
  // подсветка точек взаимодействия
  g.fillStyle = 'rgba(255,214,0,0.18)'; for (const a of def.acts) { g.beginPath(); g.arc(a.x * 16, a.z * 16, 10, 0, 7); g.fill(); }
  return cv;
}

export function enterBuilding(b, opts = {}) {
  const p = G.player, spec = b.interior;
  if (!spec) return false;
  if (state.wanted > 0 && !opts.force) { G.msg('Двери закрыты: вас ищет полиция', 2); return false; }
  if (!openNow(spec.type) && !opts.force) { G.msg(`Закрыто. Часы работы: ${openHoursText(spec.type)}`, 2.5); return false; }
  let ent = cache.get(b.id);
  if (!ent) { const def = buildInterior(spec); ent = { def, canvas: bake(def) }; cache.set(b.id, ent); }
  const def = ent.def;
  G.interior = { b, def, canvas: ent.canvas, npcs: [], t: 0, act: null, ret: { x: b.door.px, z: b.door.pz }, camPrev: { zoom: G.cam.zoom, user: G.cam.userZoom }, fadeIn: 0.35 };
  const S = G.interior;
  for (const n of def.npcs) {
    const per = new Person({ kind: 'npc', variant: n.variant ?? Math.floor(Math.random() * 40), x: n.x, z: n.z, ang: n.ang, hp: 40 }); per.base = 1.0; per.role = n.role; per.home = { x: n.x, z: n.z }; per.wander = n.wander; per.mode = 'idle'; per.timer = 2 + Math.random() * 5; S.npcs.push(per);
  }
  p.x = def.spawn.x; p.z = def.spawn.z; p.ang = -Math.PI / 2; p.vx = p.vz = 0; p.speed = 0; p.crouch = 0;
  G.cam.bounds = { x0: 0, z0: 0, x1: def.w * 2, z1: def.h * 2 };
  G.cam.userZoom = 1; G.cam.zoom = 1.9; G.cam.snap(p.x, p.z);
  G.sfx?.('door');
  G.msg(def.title, 1.8);
  return true;
}

export function exitBuilding() {
  const S = G.interior; if (!S) return;
  const p = G.player;
  p.x = S.ret.x; p.z = S.ret.z; p.ang = Math.PI / 2; p.vx = p.vz = 0;
  G.cam.bounds = null; G.cam.userZoom = S.camPrev.user; G.cam.zoom = 1.25; G.cam.snap(p.x, p.z);
  G.interior = null; G.sfx?.('door');
  G.onExitBuilding?.();
}

const solidAt = (S, x, z) => { const d = S.def, c = Math.floor(x), r = Math.floor(z); if (c < 0 || r < 0 || c >= d.sw || r >= d.sh) return true; return d.solid[r * d.sw + c] === 1; };
const pred = S => (x, z) => solidAt(S, x, z);

export function updateInterior(dt) {
  const S = G.interior, p = G.player; if (!S) return;
  S.t += dt; advanceAnim(p, dt);
  if (S.fadeIn > 0) S.fadeIn -= dt;
  const pr = pred(S);
  let dx = (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0), dz = (down('KeyS', 'ArrowDown') ? 1 : 0) - (down('KeyW', 'ArrowUp') ? 1 : 0);
  const len = Math.hypot(dx, dz); if (len) { dx /= len; dz /= len; }
  p.run = down('ShiftLeft', 'ShiftRight') && len > 0;
  const spd = (p.run ? 5.2 : 2.8) * (state.character?.speedMul || 1) * speedMul();
  p.vx = smooth(p.vx, dx * spd, dt, 14); p.vz = smooth(p.vz, dz * spd, dt, 14);
  const ox = p.x, oz = p.z; moveSlide(p, p.vx * dt, p.vz * dt, pr);
  p.speed = Math.hypot(p.x - ox, p.z - oz) / dt; if (!len && p.speed < 0.6) p.speed = 0;
  if (len > 0) p.ang = turnToward(p.ang, Math.atan2(dz, dx), 14 * dt);
  // NPC внутри
  for (const n of S.npcs) {
    advanceAnim(n, dt); n.timer -= dt;
    let sp = 0;
    if (n.wander) {
      if (n.mode === 'idle' && n.timer <= 0) { n.mode = 'walk'; n.timer = 2 + Math.random() * 4; n.dirA = Math.random() * 6.28; }
      else if (n.mode === 'walk') {
        sp = 1.0; n.ang = turnToward(n.ang, n.dirA, 4 * dt); const ox2 = n.x, oz2 = n.z;
        moveSlide(n, Math.cos(n.ang) * sp * dt, Math.sin(n.ang) * sp * dt, pr);
        if (Math.abs(n.x - ox2) + Math.abs(n.z - oz2) < sp * dt * 0.3) n.dirA += 1.5 + Math.random();
        if (n.timer <= 0) { n.mode = 'idle'; n.timer = 2 + Math.random() * 6; }
      }
    } else if (n.role === 'seller' || n.role === 'teller' || n.role === 'nurse' || n.role === 'officer' || n.role === 'mechanic') {
      const d = Math.hypot(p.x - n.x, p.z - n.z); if (d < 6) n.ang = turnToward(n.ang, Math.atan2(p.z - n.z, p.x - n.x), 5 * dt);
    }
    n.speed = sp;
  }
  // Взаимодействие
  let best = null, bd = 1e9;
  for (const a of S.def.acts) { const d = Math.hypot(p.x - a.x, p.z - a.z); if (d < a.r && d < bd) { bd = d; best = a; } }
  const dEx = Math.hypot(p.x - S.def.exit.x, p.z - S.def.exit.z);
  S.near = best; S.nearExit = dEx < 2.6;
  S.hint = best ? 'E — ' + best.label : S.nearExit ? 'E — выйти из здания' : null;
  if (hit('KeyE')) { if (best) G.onInteriorAct?.(best, S); else if (S.nearExit) exitBuilding(); }
  if (dEx < 1.0 && p.vz > 0.5) exitBuilding();   // выход шагом через дверь
  if (hit('KeyH')) G.quickHeal?.();
  if (hit('KeyI')) G.openInventory?.();
}

export function renderInterior(ctx, cam, dt, time) {
  const S = G.interior, p = G.player, def = S.def, k = cam.ppm / 16;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0c0d12'; ctx.fillRect(0, 0, cam.w, cam.h);
  const x0 = cam.sx(0), z0 = cam.sz(0);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(S.canvas, x0, z0, def.w * 2 * cam.ppm, def.h * 2 * cam.ppm);
  const all = [...S.npcs, p].sort((a, b) => a.z - b.z);
  for (const q of all) drawPersonShadow(ctx, cam, q, 0.25);
  for (const q of all) { if (q === p) { const f = G.outfitFilter?.(); if (f) ctx.filter = f; drawPerson(ctx, cam, q); ctx.filter = 'none'; } else drawPerson(ctx, cam, q); }
  // подсказка у точки взаимодействия
  if (S.near) { const x = cam.sx(S.near.x), z = cam.sz(S.near.z) - 1.2 * cam.ppm; ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x - 12, z - 12, 24, 22); ctx.fillStyle = '#ffd400'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.fillText('E', x, z + 5); }
  // виньетка
  const g = ctx.createRadialGradient(cam.w / 2, cam.h / 2, Math.min(cam.w, cam.h) * 0.35, cam.w / 2, cam.h / 2, Math.max(cam.w, cam.h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, cam.w, cam.h);
  if (S.fadeIn > 0) { ctx.fillStyle = `rgba(0,0,0,${S.fadeIn / 0.35})`; ctx.fillRect(0, 0, cam.w, cam.h); }
}
