// Розыск и полиция: преступления -> "жар" (heat) -> звёзды; патрульные машины преследуют, полицейские стреляют.
import { G, state } from '../state.js';
import { Person, advanceAnim, moveSlide, solidPred } from '../entities/person.js';
import { spawnCar, randomRoadTile, activeRadius } from './traffic.js';
import { shootRay, makeNoise } from './combat.js';
import { clamp, angDiff, turnToward, TAU } from '../engine/util.js';
import { LANE_DIR, tileX, tileZ } from '../world/map.js';
import { resetEscalation } from './escalation.js';

const GAIN = { assault: 0.5, kill: 1.0, runover: 1.0, carjack: 0.85, carjack_cop: 1.8, ram_cop: 0.5, hurt_cop: 1.3, kill_cop: 2.4, shot_fired: 0.12 };
let seenT = 99, quietT = 0, lastStars = 0;
let policeIntel = { known: false, x: 0, z: 0, age: 999, confidence: 0, searchUntil: 0 };
export function getPoliceIntel() { return { ...policeIntel }; }

export function crime(kind, x, z) {
  let g = GAIN[kind] ?? 0.5;
  let witness = false;
  for (const p of G.peds) if (p.kind === 'cop' && !p.dead && Math.hypot(p.x - x, p.z - z) < 80) { witness = true; break; }
  if (!witness) for (const v of G.cars) if (v.ai?.kind === 'police' && Math.hypot(v.x - x, v.z - z) < 90) { witness = true; break; }
  if (!witness) { let n = 0; for (const p of G.peds) if (p.kind === 'npc' && !p.dead && Math.hypot(p.x - x, p.z - z) < 20) n++; witness = n > 0; if (!witness) g *= 0.2; }
  if (witness) {
    policeIntel = { known: true, x: x + (Math.random() - 0.5) * 5, z: z + (Math.random() - 0.5) * 5, age: 0, confidence: 0.55, searchUntil: G.time + 18 };
  }
  state.heat = clamp(state.heat + g, 0, 6.99);
  seenT = Math.min(seenT, 2);
}
G.crime = crime;
G.onPedKilled = (p, byPlayer) => { if (!byPlayer) return; crime(p.kind === 'cop' ? 'kill_cop' : 'kill', p.x, p.z); };
G.onPedHurt = (p, byPlayer) => { if (!byPlayer) return; crime(p.kind === 'cop' ? 'hurt_cop' : 'assault', p.x, p.z); };
G.onShot = p => crime('shot_fired', p.x, p.z);

export function resetPolice() { state.heat = Math.max(state.heat, state.wanted); state.wanted = Math.floor(state.heat); seenT = state.wanted > 0 ? 0 : 99; quietT = 0; lastStars = state.wanted; }
export function clearPolice() { for (let i = G.cars.length - 1; i >= 0; i--) if (G.cars[i].ai?.kind === 'police') G.cars.splice(i, 1); for (let i = G.peds.length - 1; i >= 0; i--) if (G.peds[i].kind === 'cop') G.peds.splice(i, 1); state.heat = 0; state.wanted = 0; lastStars = 0; resetEscalation(); }

function spawnPolice() {
  const p = G.player, cam = G.cam;
  const t = randomRoadTile(p.x, p.z, cam.halfDiag() + 10, activeRadius() + 30, 60);
  if (!t) return;
  const dir = LANE_DIR[t.rd], x = tileX(t.c), z = tileZ(t.r);
  if (cam.visible(x, z, 6)) return;
  for (const o of G.cars) if (Math.abs(o.x - x) < 9 && Math.abs(o.z - z) < 9) return;
  const v = spawnCar('police', x, z, dir * Math.PI / 2, { driver: 'cop', ai: { kind: 'police', stuckT: 0, rev: 0, ejected: false } });
  v.siren = true; v.keep = true;
}
function spawnCopOnFoot(v) {
  for (const off of [1, -1]) {
    const d = v.doorPos(off), c = new Person({ kind: 'cop', variant: 40 + Math.floor(Math.random() * 2), x: d.x, z: d.z, hp: 60 });
    if (G.world.solidAt(c.x, c.z)) continue;
    c.mode = 'chase'; c.shootT = 0.6 + Math.random(); c.run = true; c.ang = Math.random() * TAU; G.peds.push(c);
  }
}

export function policeInput(v, dt) {
  const ai = v.ai, p = G.player;
  const seenDirect = Math.hypot(v.x - p.x, v.z - p.z) < (p.inVehicle ? 72 : 55);
  const tgt = seenDirect ? (p.inVehicle || p) : { x: policeIntel.x, z: policeIntel.z, vx: 0, vz: 0 };
  if (ai.gone || state.wanted === 0) return { throttle: 0.15, brake: v.speed > 4 ? 0.5 : 0, steer: 0 };
  const tx = tgt.x + (tgt.vx || 0) * 0.5, tz = tgt.z + (tgt.vz || 0) * 0.5, dx = tx - v.x, dz = tz - v.z, dist = Math.hypot(dx, dz);
  // Игрок пешком рядом — выставить полицейских
  if (!p.inVehicle && dist < 14) {
    if (!ai.ejected) { ai.ejected = true; spawnCopOnFoot(v); }
    return { throttle: 0, brake: 1, steer: 0 };
  }
  const base = Math.atan2(dz, dx), w = G.world;
  const clear = (a, d) => { const fx = Math.cos(a), fz = Math.sin(a); for (let k = 3; k <= d; k += 2.5) if (w.solidAt(v.x + fx * k, v.z + fz * k)) return false; return true; };
  let want = base;
  for (const off of [0, 0.55, -0.55, 1.1, -1.1, 1.7, -1.7]) { if (clear(base + off, 9)) { want = base + off; break; } }
  let steer = clamp(angDiff(v.ang, want) * 2.4, -1, 1), throttle = 1, brake = 0;
  if (ai.rev > 0) { ai.rev -= dt; return { throttle: -1, steer: -steer, brake: 0 }; }
  if (Math.abs(v.speed) < 1.0) ai.stuckT += dt; else ai.stuckT = 0;
  if (ai.stuckT > 1.5) { ai.rev = 1.1; ai.stuckT = 0; }
  const tmax = v.stats.speed * 0.95;
  if (Math.abs(angDiff(v.ang, want)) > 1.1 && v.speed > 9) { throttle = 0; brake = 0.5; }
  if (dist < 10 && p.inVehicle) throttle = 1;
  return { throttle, brake, steer, hand: false };
}
G.policeInput = policeInput;

function copUpdate(c, dt) {
  const p = G.player;
  if (c.dead) return;
  const tgt = p.inVehicle || p, dx = tgt.x - c.x, dz = tgt.z - c.z, d = Math.hypot(dx, dz);
  c.run = d > 4; c.timer -= dt; c.shootT -= dt;
  const want = Math.atan2(dz, dx);
  c.ang = turnToward(c.ang, want, 7 * dt);
  const far = p.inVehicle && Math.abs(p.inVehicle.speed) > 10;
  let spd = 0;
  const holdDist = state.wanted >= 2 ? 9 : 1.4;
  if (d > holdDist && !far) spd = d > 25 ? 5.6 : 4.4;
  if (spd) {
    const ox = c.x, oz = c.z; moveSlide(c, Math.cos(c.ang) * spd * dt, Math.sin(c.ang) * spd * dt, solidPred);
    if (Math.abs(c.x - ox) + Math.abs(c.z - oz) < spd * dt * 0.3) { c.ang += (Math.random() < 0.5 ? 1 : -1) * 1.1; moveSlide(c, Math.cos(c.ang) * spd * dt, Math.sin(c.ang) * spd * dt, solidPred); }
  }
  c.speed = spd; advanceAnim(c, dt);
  if (state.wanted >= 2 && d < 20 && c.shootT <= 0 && !p.dead) {
    c.shootT = 1.1 + Math.random() * 0.8;
    shootRay(c, c.x + Math.cos(c.ang) * 0.9, c.z + Math.sin(c.ang) * 0.9, want + (Math.random() - 0.5) * 0.4, 24, 2.5 + state.wanted * 0.6, { col: '#ffb070' });
    G.fx.push({ k: 'flash', x: c.x + Math.cos(c.ang) * 0.9, z: c.z + Math.sin(c.ang) * 0.9, ang: c.ang, t: 0, life: 0.06 });
    makeNoise(c.x, c.z, 'shot', 30);
  } else if (d < 1.7 && c.shootT <= 0 && !p.dead && !p.inVehicle) { c.shootT = 0.9; G.hurtPlayer(5, 'baton'); }
}

export function updatePolice(dt) {
  const p = G.player;
  policeIntel.age += dt;
  if (state.wanted === 0) policeIntel = { known: false, x: 0, z: 0, age: 999, confidence: 0, searchUntil: 0 };
  state.wanted = Math.floor(state.heat);
  if (state.wanted !== lastStars) { if (state.wanted > lastStars) G.msg('Розыск: ' + '★'.repeat(state.wanted), 2); else if (state.wanted === 0) G.msg('Вы оторвались от полиции', 2.5); lastStars = state.wanted; }
  // Видят ли игрока
  let seen = false, cops = 0, cars = 0;
  for (const c of G.peds) if (c.kind === 'cop' && !c.dead) { cops++; if (Math.hypot(c.x - p.x, c.z - p.z) < 55) seen = true; }
  for (const v of G.cars) if (v.ai?.kind === 'police' && !v.wreck) { cars++; if (Math.hypot(v.x - p.x, v.z - p.z) < 60) seen = true; }
  if (seen) {
    seenT = 0;
    policeIntel = { known: true, x: p.x, z: p.z, age: 0, confidence: 1, searchUntil: G.time + 24 };
  } else {
    seenT += dt;
    if (policeIntel.known && policeIntel.age > 8) policeIntel.confidence = Math.max(0.25, policeIntel.confidence - dt * 0.012);
  }
  if (state.heat > 0 && seenT > 9) state.heat = Math.max(0, state.heat - dt * 0.09 * (state.character?.wantedDecay || 1));
  // Состав полиции
  if (state.wanted > 0) {
    quietT = 0;
    const wantCars = Math.min(5, state.wanted + (state.wanted >= 4 ? 1 : 0));
    if (cars < wantCars && Math.random() < dt * 0.8) spawnPolice();
    for (const v of G.cars) if (v.ai?.kind === 'police') v.ai.gone = false;
  } else {
    quietT += dt;
    for (const v of G.cars) if (v.ai?.kind === 'police' && quietT > 5) v.ai.gone = true;
  }
  for (const c of G.peds) if (c.kind === 'cop') { if (state.wanted > 0) copUpdate(c, dt); else { quietT > 3 && (c.fade = (c.fade ?? 1) - dt * 0.4); c.speed = 0; } }
  for (let i = G.peds.length - 1; i >= 0; i--) { const c = G.peds[i]; if (c.kind === 'cop' && (c.fade !== undefined && c.fade <= 0 || (c.dead && c.deadT > 18))) G.peds.splice(i, 1); }
  for (let i = G.cars.length - 1; i >= 0; i--) { const v = G.cars[i]; if (v.ai?.kind === 'police' && v.ai.gone && quietT > 9 && !G.cam.visible(v.x, v.z, 8)) G.cars.splice(i, 1); else if (v.ai?.kind === 'police' && Math.hypot(v.x - p.x, v.z - p.z) > 320) G.cars.splice(i, 1); }
}
