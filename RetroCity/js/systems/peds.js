// Городские пешеходы: разные модели и характеры, тротуары, переходы, реакция на опасность, обход препятствий.
import { G } from '../state.js';
import { A } from '../engine/assets.js';
import { Person, advanceAnim, moveSlide, solidPred, walkPred } from '../entities/person.js';
import { T, DIRS } from '../world/map.js';
import { clamp, turnToward, TAU } from '../engine/util.js';
import { activeRadius } from './traffic.js';

const PERS = [['stroller', 50], ['hurry', 14], ['loiterer', 14], ['jogger', 7], ['phone', 15]];
const DENS = { downtown: 1, shopping: 1, residential: 0.8, suburb: 0.5, rich: 0.45, industrial: 0.25, port: 0.25, airport: 0.25, military: 0.04, rural: 0.07, yard: 0.05, river: 0.1, bay: 0.05 };
const SPAWN_T = new Set([T.SIDEWALK, T.PLAZA, T.PARK, T.BRIDGE_WALK, T.PLATFORM, T.CONCRETE]);

function pickPers() { let r = Math.random() * 100; for (const [n, w] of PERS) { r -= w; if (r <= 0) return n; } return 'stroller'; }
const dirAng = d => d * Math.PI / 2;

export function spawnNpc(initial = false) {
  const p0 = G.player, cam = G.cam, w = G.world, R = activeRadius(), hd = cam.halfDiag();
  for (let t = 0; t < 30; t++) {
    const a = Math.random() * TAU, d = initial ? 5 + Math.random() * R : hd + 6 + Math.random() * Math.max(10, R - hd - 6);
    const x = p0.x + Math.cos(a) * d, z = p0.z + Math.sin(a) * d, i = w.tileAt(x, z);
    if (i < 0 || !w.walk[i] || w.xw[i] || !SPAWN_T.has(w.type[i])) continue;
    if (Math.random() > (DENS[w.districtAt(x, z)] ?? 0.2)) continue;
    if (!initial && cam.visible(x, z, 3)) continue;
    let ok = true;
    for (const o of G.peds) if (Math.abs(o.x - x) < 1.6 && Math.abs(o.z - z) < 1.6) { ok = false; break; }
    if (!ok) continue;
    const variant = Math.floor(Math.random() * 40), info = A.m.npcs.variants[variant];
    const pers = pickPers(), p = new Person({ kind: 'npc', variant, x, z, hp: 30 + Math.random() * 25, scale: info.scale, pers });
    let sp = { stroller: 1.35, hurry: 2.3, loiterer: 1.2, jogger: 3.4, phone: 1.1 }[pers] * (0.88 + Math.random() * 0.25);
    if (info.age === 'senior') sp *= 0.72; else if (info.age === 'young') sp *= 1.08;
    p.base = sp; p.run = pers === 'jogger'; p.dir = Math.floor(Math.random() * 4); p.ang = dirAng(p.dir) + (Math.random() - 0.5) * 0.4;
    p.mode = Math.random() < (pers === 'loiterer' || pers === 'phone' ? 0.5 : 0.1) ? 'idle' : 'walk'; p.timer = 1 + Math.random() * 8;
    pickDir(p, false);
    G.peds.push(p); return p;
  }
  return null;
}

const ok = (x, z) => G.world.walkAt(x, z);
function pickDir(p, noReverse) {
  const opts = [];
  for (let d = 0; d < 4; d++) {
    if (noReverse && d === (p.dir + 2) % 4) continue;
    if (ok(p.x + DIRS[d][0] * 1.8, p.z + DIRS[d][1] * 1.8) && ok(p.x + DIRS[d][0] * 0.8 + DIRS[d][1] * 0.4, p.z + DIRS[d][1] * 0.8 + DIRS[d][0] * 0.4)) opts.push([d, d === p.dir ? 5 : 1.2]);
  }
  if (!opts.length) { p.dir = (p.dir + 2) % 4; return false; }
  let sum = 0; for (const o of opts) sum += o[1]; let r = Math.random() * sum;
  for (const o of opts) { r -= o[1]; if (r <= 0) { p.dir = o[0]; return true; } }
  p.dir = opts[0][0]; return true;
}

function crosswalkDanger(x, z) {
  for (const v of G.gridCars.query(x, z, 26)) {
    const sp = Math.hypot(v.vx, v.vz); if (sp < 1.2) continue;
    const dx = x - v.x, dz = z - v.z, dist = Math.hypot(dx, dz);
    if (dist > 9 + sp * 1.7) continue;
    if ((dx * v.vx + dz * v.vz) / (dist * sp + 1e-6) > 0.5) return true;
  }
  return false;
}

export function flee(p, fromX, fromZ, time = 5) {
  if (p.dead || p.kind !== 'npc') return;
  p.mode = 'flee'; p.timer = time * (0.7 + Math.random() * 0.6); p.fleeAng = Math.atan2(p.z - fromZ, p.x - fromX) + (Math.random() - 0.5) * 0.8; p.run = true;
}

G.ejectWreckDriver = v => {
  const door = v.doorPos(-1), cop = v.driver === 'cop';
  const n = new Person({ kind: cop ? 'cop' : 'npc', variant: cop ? 40 : Math.floor(Math.random() * 40), x: door.x, z: door.z, hp: cop ? 60 : 35 });
  if (G.world.solidAt(n.x, n.z)) { n.x = v.x; n.z = v.z; }
  n.base = 1.5; n.ang = v.ang; n.pers = 'stroller'; v.driver = null;
  if (cop) { n.mode = 'chase'; n.shootT = 1; n.run = true; n.hp -= 15; } else { n.hp -= 20; flee(n, v.x, v.z, 9); }
  G.peds.push(n);
};
export function killPed(p, byPlayer) {
  if (p.dead) return; p.dead = true; p.deadT = 0; p.speed = 0; p.deadAng = Math.random() * TAU; p.mode = 'dead';
  if (p.kind === 'npc' && Math.random() < 0.3) G.pickups.push({ kind: 'cash', x: p.x, z: p.z, value: 20 + Math.floor(Math.random() * 130), t: 0, once: true });
  G.onPedKilled?.(p, byPlayer);
}
export function damagePed(p, amount, byPlayer, srcX, srcZ) {
  if (p.dead) return;
  p.hp -= amount;
  if (p.hp <= 0) { killPed(p, byPlayer); return; }
  if (p.kind === 'npc') flee(p, srcX ?? G.player.x, srcZ ?? G.player.z, 6);
  G.onPedHurt?.(p, byPlayer);
}

export function updatePeds(dt) {
  const w = G.world, pl = G.player, now = G.time;
  for (let n = G.peds.length - 1; n >= 0; n--) {
    const p = G.peds[n];
    if (p.dead) { p.deadT += dt; if (p.deadT > 18) G.peds.splice(n, 1); continue; }
    if (p.kind === 'cop') continue;   // полицейские — в police.js
    p.timer -= dt;
    // --- Реакции на шум и транспорт ---
    if (p.mode !== 'flee' && (p.react = (p.react || 0) - dt) <= 0) {
      p.react = 0.2;
      for (const e of G.noise) {
        if (e.id === p.lastNoise) continue;
        const d = Math.hypot(e.x - p.x, e.z - p.z);
        if (d < e.r) { p.lastNoise = e.id; flee(p, e.x, e.z, e.kind === 'shot' ? 8 : 5); break; }
      }
      if (p.mode !== 'flee') for (const v of G.gridCars.query(p.x, p.z, 7)) {
        const sp = Math.hypot(v.vx, v.vz); if (sp < 6) continue;
        const dx = p.x - v.x, dz = p.z - v.z, d = Math.hypot(dx, dz);
        if (d < 3 + sp * 0.5 && (dx * v.vx + dz * v.vz) / (d * sp + 1e-6) > 0.7) { flee(p, v.x, v.z, 3); p.fleeAng = Math.atan2(dz, dx) + (Math.random() < 0.5 ? 1.2 : -1.2); break; }
      }
    }
    let spd = 0;
    if (p.mode === 'flee') {
      spd = 5.0; p.ang = turnToward(p.ang, p.fleeAng, 9 * dt);
      const dx = Math.cos(p.ang) * spd * dt, dz = Math.sin(p.ang) * spd * dt, ox = p.x, oz = p.z;
      moveSlide(p, dx, dz, solidPred);
      if (Math.abs(p.x - ox) + Math.abs(p.z - oz) < spd * dt * 0.3) p.fleeAng += 1.4;
      if (p.timer <= 0) { p.mode = 'walk'; p.run = p.pers === 'jogger'; p.timer = 2; p.dir = Math.round(((p.ang % TAU) + TAU) % TAU / (Math.PI / 2)) % 4; if (!ok(p.x, p.z)) { const q = w.nearestWalk(p.x, p.z, 6); p.x = q.x; p.z = q.z; } pickDir(p, false); }
    } else if (p.mode === 'idle' || p.mode === 'wait') {
      spd = 0;
      if (p.mode === 'idle' && Math.random() < 0.004) p.ang += (Math.random() - 0.5) * 1.6;
      if (p.mode === 'wait') { const ti = w.tileAt(p.x + DIRS[p.dir][0] * 1.8, p.z + DIRS[p.dir][1] * 1.8); const c = G.cam; if (p.timer <= 0 || ti < 0 || !crosswalkDanger(p.x + DIRS[p.dir][0] * 3, p.z + DIRS[p.dir][1] * 3)) { p.mode = 'cross'; p.timer = 0; } }
      else if (p.timer <= 0) { p.mode = 'walk'; p.timer = 4 + Math.random() * 12; pickDir(p, false); }
    } else {
      // walk / cross
      spd = p.base * (p.mode === 'cross' ? 1.25 : 1);
      const target = dirAng(p.dir);
      p.ang = turnToward(p.ang, target, 5 * dt);
      const fx = Math.cos(p.ang), fz = Math.sin(p.ang);
      const here = w.tileAt(p.x, p.z), onX = here >= 0 && w.xw[here];
      const ahead = w.tileAt(p.x + fx * 1.9, p.z + fz * 1.9);
      if (p.mode === 'walk' && !onX && ahead >= 0 && w.xw[ahead]) {
        const cx = p.x + fx * 4, cz = p.z + fz * 4;
        if (crosswalkDanger(cx, cz)) { p.mode = 'wait'; p.timer = 9; spd = 0; } else p.mode = 'cross';
      }
      if (p.mode === 'cross' && !onX && p.timer < -1) p.mode = 'walk';
      if (p.mode === 'cross') { p.timer = p.timer > 0 ? 0 : p.timer; if (!onX && ahead >= 0 && !w.xw[ahead]) p.mode = 'walk'; }
      if (p.mode === 'walk') {
        // впереди тупик — выбрать другое направление
        if (!ok(p.x + fx * 1.4, p.z + fz * 1.4) || (ahead >= 0 && !w.walk[ahead])) { if (!pickDir(p, true)) pickDir(p, false); p.timer -= 0.2; spd *= 0.4; }
        else if (p.timer <= 0) {
          p.timer = 3 + Math.random() * 9;
          if (p.pers === 'loiterer' || p.pers === 'phone') { if (Math.random() < 0.55) { p.mode = 'idle'; p.timer = 3 + Math.random() * 14; } }
          if (Math.random() < 0.35) pickDir(p, true);
        }
      }
      const dx = fx * spd * dt, dz = fz * spd * dt, ox = p.x, oz = p.z;
      moveSlide(p, dx, dz, walkPred);
      if (spd > 0 && Math.abs(p.x - ox) + Math.abs(p.z - oz) < spd * dt * 0.25) { p.stuck = (p.stuck || 0) + dt; if (p.stuck > 0.4) { pickDir(p, false); p.stuck = 0; } } else p.stuck = 0;
    }
    p.speed = spd; advanceAnim(p, dt);
    // Расталкивание (без наложения друг на друга)
    for (const o of G.gridPeds.query(p.x, p.z, 1.0)) {
      if (o === p || o.dead) continue;
      const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz);
      if (d < 0.85) { const k = (0.85 - d) * 0.5, nx = d > 0.001 ? dx / d : Math.random() - 0.5, nz = d > 0.001 ? dz / d : Math.random() - 0.5; moveSlide(p, nx * k, nz * k, p.mode === 'flee' ? solidPred : walkPred); }
    }
    if (pl && !pl.inVehicle) { const dx = p.x - pl.x, dz = p.z - pl.z, d = Math.hypot(dx, dz); if (d < 0.8 && d > 0.001) moveSlide(p, dx / d * (0.8 - d) * 0.6, dz / d * (0.8 - d) * 0.6, p.mode === 'flee' ? solidPred : walkPred); }
  }
  // Пополнение и удаление
  const R2 = (activeRadius() * 1.25) ** 2, cam = G.cam;
  for (let i = G.peds.length - 1; i >= 0; i--) {
    const p = G.peds[i]; if (p.kind === 'cop') continue;
    if ((p.x - pl.x) ** 2 + (p.z - pl.z) ** 2 > R2 && !cam.visible(p.x, p.z, 4)) G.peds.splice(i, 1);
  }
  let civ = 0; for (const p of G.peds) if (p.kind === 'npc' && !p.dead) civ++;
  if (civ > G.quality.pedTarget * 1.05) { for (let i = G.peds.length - 1; i >= 0 && civ > G.quality.pedTarget; i--) { const p = G.peds[i]; if (p.kind === 'npc' && !p.dead && !cam.visible(p.x, p.z, 4)) { G.peds.splice(i, 1); civ--; } } }
  else for (let k = 0; k < 3 && civ < G.quality.pedTarget; k++) if (spawnNpc(false)) civ++;
}

export function populatePeds() { for (let i = 0; i < G.quality.pedTarget * 4 && G.peds.filter(p => p.kind === 'npc').length < G.quality.pedTarget; i++) spawnNpc(true); }
