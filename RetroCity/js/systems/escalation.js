// Эскалация розыска: на 4★ появляются блокпосты, на 5–6★ — военные патрули и бронетехника (комендантский час).
// Снимается постепенно вместе с розыском. Военные — не постоянные жители города, а временная реакция на тревогу.
import { G, state } from '../state.js';
import { spawnCar, randomRoadTile, activeRadius } from './traffic.js';
import { Person } from '../entities/person.js';
import { tileX, tileZ, LANE_DIR } from '../world/map.js';

let checkpoints = [], military = [], nextCpT = 0, nextMilT = 0;
export function resetEscalation() {
  for (const c of checkpoints) for (const v of c.cars) v.remove = true;
  checkpoints = []; military = []; state.martialLaw = false;
}
export function isMartialLaw() { return state.martialLaw; }

function placeCheckpoint() {
  const p = G.player, cam = G.cam;
  const t = randomRoadTile(p.x, p.z, cam.halfDiag() + 26, activeRadius() + 14, 50);
  if (!t) return;
  const dir = LANE_DIR[t.rd], horiz = dir % 2 === 0, x = tileX(t.c), z = tileZ(t.r);
  if (cam.visible(x, z, 10)) return;
  const perp = horiz ? Math.PI / 2 : 0;
  const cars = [];
  for (const s of [-2.6, 2.6]) {
    const cx = x + Math.cos(perp) * s, cz = z + Math.sin(perp) * s;
    const v = spawnCar('police', cx, cz, perp + Math.PI / 2, { driver: null, ai: null }); v.keep = true; v.parked = true; v.siren = true;
    if (v.collides(v.x, v.z, v.ang)) { G.cars.pop(); continue; }
    cars.push(v);
  }
  if (!cars.length) return;
  for (let i = 0; i < 2; i++) { const d = horiz ? { x: 0, z: 0 } : { x: 0, z: 0 }; const cp = new Person({ kind: 'cop', variant: 40 + (i % 2), x: x + (Math.random() - 0.5) * 3, z: z + 3 * (i ? 1 : -1), hp: 55 }); cp.mode = 'guard'; cp.cpId = cars; G.peds.push(cp); cars.push(cp); }
  checkpoints.push({ x, z, cars, t: 0 });
}
function placeMilitary() {
  const p = G.player, cam = G.cam, w = G.world;
  const spot = w.pois.milGate || w.pois.milSpots?.[0]; if (!spot) return;
  const d = Math.hypot(spot.x - p.x, spot.z - p.z);
  const t = randomRoadTile(p.x, p.z, cam.halfDiag() + 30, activeRadius() + 25, 50);
  if (!t) return;
  const x = tileX(t.c), z = tileZ(t.r);
  if (cam.visible(x, z, 10)) return;
  const dir = LANE_DIR[t.rd] * Math.PI / 2;
  const kind = state.wanted >= 6 && Math.random() < 0.35 ? 'apc' : Math.random() < 0.5 ? 'jeep' : 'mtruck';
  const v = spawnCar(kind, x, z, dir, { driver: 'cop', ai: { kind: 'police', stuckT: 0, rev: 0, ejected: false, military: true } });
  v.keep = true; v.siren = false; v.military = true; military.push(v);
}
function placeTank() {
  const w = G.world, spot = w.pois.tankSpots?.[Math.floor(Math.random() * (w.pois.tankSpots.length || 1))]; if (!spot) return;
  const v = spawnCar('tank', spot.x, spot.z, 0, { driver: 'cop', ai: { kind: 'police', stuckT: 0, rev: 0, ejected: false, military: true } });
  v.keep = true; v.military = true; v.siren = false; military.push(v);
}

export function updateEscalation(dt) {
  const was = state.martialLaw; state.martialLaw = state.wanted >= 5;
  if (state.martialLaw && !was) G.msg('Чрезвычайное положение: в город введены войска!', 3.5);
  if (!state.martialLaw && was) G.msg('Военные покидают город', 2.5);

  nextCpT -= dt; nextMilT -= dt;
  if (state.wanted >= 4) { if (checkpoints.filter(c => c.cars.some(x => !x.remove && !x.dead)).length < (state.wanted >= 5 ? 3 : 1) && nextCpT <= 0) { placeCheckpoint(); nextCpT = 3 + Math.random() * 4; } }
  if (state.martialLaw) {
    const alive = military.filter(v => !v.wreck && G.cars.includes(v)).length;
    if (alive < (state.wanted >= 6 ? 5 : 3) && nextMilT <= 0) { placeMilitary(); if (state.wanted >= 6 && Math.random() < 0.3) placeTank(); nextMilT = 2.5 + Math.random() * 3; }
  }
  // Чистка старых блокпостов, если розыск упал
  if (state.wanted < 3) for (const c of checkpoints) if (!c.cleared) { c.cleared = true; for (const v of c.cars) if (v.kind !== undefined) {} }
  checkpoints = checkpoints.filter(c => c.cars.some(x => G.cars.includes(x) || G.peds.includes(x)));
  military = military.filter(v => G.cars.includes(v));
}
