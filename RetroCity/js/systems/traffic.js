// Городской транспорт: езда по полосам, повороты на перекрёстках, светофоры, переезд, появление/исчезновение.
import { G, state } from '../state.js';
import { Vehicle } from '../entities/vehicle.js';
import { CAR_TYPES } from '../data.js';
import { T, LANE_DIR, W, colOf, rowOf, tileX, tileZ, RAIL_R0 } from '../world/map.js';
import { clamp, angDiff, TAU } from '../engine/util.js';
import { A } from '../engine/assets.js';
import { updateVehicleFire } from './fx.js';

// ---- Светофоры: цикл 26 с. ось 0 — север/юг, ось 1 — запад/восток ----
export function lightState(axis, t = G.time) {
  const p = t % 26, a = axis === 0 ? p : (p + 13) % 26;
  return a < 10 ? 'g' : a < 12 ? 'y' : 'r';
}
// Шлагбаумы на переездах (арт. дороги k=2,8,14: столбцы 27-28, 99-100, 171-172)
export function initGates() {
  G.gates = G.world.crossings.map(cr => ({ x: cr.x, z: tileZ(RAIL_R0) + 2, c: cr.c, closed: false, arm: 0 }));
}
export const gateAt = x => G.gates.find(g => Math.abs(g.x - x) < 6);

export function randomRoadTile(cx, cz, minR, maxR, tries = 40) {
  const w = G.world;
  for (let t = 0; t < tries; t++) {
    const a = Math.random() * TAU, d = minR + Math.random() * (maxR - minR);
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, i = w.tileAt(x, z);
    if (i < 0) continue;
    const rd = w.rd[i], ty = w.type[i];
    if (rd >= 1 && rd <= 4 && (ty === T.ROAD || ty === T.BRIDGE_ROAD) && !w.xw[i]) return { i, c: i % W, r: Math.floor(i / W), rd };
  }
  return null;
}

function pickType() {
  let sum = 0; for (const c of CAR_TYPES) sum += c.weight;
  let r = Math.random() * sum; for (const c of CAR_TYPES) { r -= c.weight; if (r <= 0) return c.id; }
  return 'sedan';
}
export function spawnCar(type, x, z, ang, o = {}) {
  const sprites = A.m.vehicles.types[type].colors.length;
  const v = new Vehicle(type, x, z, ang, o.color ?? Math.floor(Math.random() * sprites));
  v.driver = o.driver ?? null; v.ai = o.ai ?? null;
  G.cars.push(v); return v;
}
export function spawnTrafficCar(inView = false) {
  const p = G.player, cam = G.cam, R = activeRadius();
  const t = randomRoadTile(p.x, p.z, inView ? 20 : cam.halfDiag() + 12, R);
  if (!t) return null;
  const w = G.world, dir = LANE_DIR[t.rd], d = [[1, 0], [0, 1], [-1, 0], [0, -1]][dir];
  const x = tileX(t.c) + d[0] * (Math.random() - 0.5) * 3, z = tileZ(t.r) + d[1] * (Math.random() - 0.5) * 3;
  for (const o of G.cars) if (Math.abs(o.x - x) < 11 && Math.abs(o.z - z) < 11) return null;
  if (!inView && cam.visible(x, z, 8)) return null;
  const type = pickType();
  const v = spawnCar(type, x, z, dir * Math.PI / 2, { driver: 'npc', ai: { kind: 'civ', dir, wp: null, lane: dir % 2 === 0 ? tileZ(t.r) : tileX(t.c), cruise: CAR_TYPES.find(c => c.id === type).speed * (0.38 + Math.random() * 0.14), passed: false, stuck: 0, wait: 0 } });
  const sp = v.ai.cruise * 0.7; v.vx = Math.cos(v.ang) * sp; v.vz = Math.sin(v.ang) * sp; v.speed = sp;
  return v;
}
export const activeRadius = () => G.cam.halfDiag() + 58;

export function spawnParked() {
  for (const s of G.world.parkedSpots) {
    const types = ['sedan', 'sedan', 'compact', 'suv', 'muscle', 'van', 'taxi', 'truck'];
    const type = types[Math.floor(Math.random() * types.length)];
    const v = spawnCar(type, s.x, s.z, s.ang + (Math.random() - 0.5) * 0.12);
    v.parked = true; if (v.collides(v.x, v.z, v.ang)) { v.collides(v.x, v.z, v.ang); G.cars.pop(); }
  }
}

// ---- Управление ИИ гражданской машины ----
function chooseExit(v, c, r) {
  const w = G.world, ai = v.ai, i = r * W + c;
  const a = w.rd[i - 1] === 5 ? c - 1 : c, b = w.rd[i - W] === 5 ? r - 1 : r;
  const opts = [[ai.dir, 0.62], [(ai.dir + 1) % 4, 0.19], [(ai.dir + 3) % 4, 0.19]];
  const exits = [
    () => (w.rd[(b + 1) * W + a + 2] === 4 ? { x: tileX(a + 2), z: tileZ(b + 1) } : null),
    () => (w.rd[(b + 2) * W + a] === 1 ? { x: tileX(a), z: tileZ(b + 2) } : null),
    () => (w.rd[b * W + a - 1] === 3 ? { x: tileX(a - 1), z: tileZ(b) } : null),
    () => (w.rd[(b - 1) * W + a + 1] === 2 ? { x: tileX(a + 1), z: tileZ(b - 1) } : null),
  ];
  const valid = opts.map(([d, wt]) => ({ d, wt, p: exits[d]() })).filter(o => o.p);
  if (!valid.length) { ai.wp = null; return; }
  let sum = 0; valid.forEach(o => (sum += o.wt)); let rr = Math.random() * sum, pick = valid[0];
  for (const o of valid) { rr -= o.wt; if (rr <= 0) { pick = o; break; } }
  ai.dir = pick.d; ai.wp = pick.p; ai.wpT = 0;
}

function obstacleAhead(v, look, halfW) {
  const fx = Math.cos(v.ang), fz = Math.sin(v.ang), rx = -fz, rz = fx;
  let best = 1e9;
  const test = (o, rad) => {
    const dx = o.x - v.x, dz = o.z - v.z, f = dx * fx + dz * fz, l = dx * rx + dz * rz;
    if (f > 0.3 && f < look && Math.abs(l) < halfW + rad) { const fd = f - rad - v.stats.l / 2; if (fd < best) best = fd; }
  };
  for (const o of G.gridCars.query(v.x + fx * look / 2, v.z + fz * look / 2, look / 2 + 5)) { if (o !== v) test(o, o.stats.w * 0.45 + (o.stats.l / 2) * Math.abs(Math.cos(angDiff(v.ang, o.ang)))); }
  for (const o of G.gridPeds.query(v.x + fx * look / 2, v.z + fz * look / 2, look / 2 + 2)) if (!o.dead) test(o, 0.35);
  const p = G.player; if (p && !p.inVehicle && !p.dead) test(p, 0.35);
  return best;
}

function civInput(v, dt) {
  const ai = v.ai, w = G.world, s = v.stats;
  const i = w.tileAt(v.x, v.z); if (i < 0) { v.remove = true; return { throttle: 0, brake: 1 }; }
  const c = i % W, r = Math.floor(i / W), rdv = w.rd[i];
  const horiz = ai.dir % 2 === 0;
  if (horiz && (rdv === 3 || rdv === 4)) ai.lane = ai.dir === 0 ? tileZ((rdv === 3 ? r : r - 1) + 1) : tileZ(rdv === 3 ? r : r - 1);
  if (!horiz && (rdv === 1 || rdv === 2)) ai.lane = ai.dir === 1 ? tileX(rdv === 1 ? c : c - 1) : tileX((rdv === 1 ? c : c - 1) + 1);
  if (rdv === 5) { if (!ai.passed && !ai.wp) { chooseExit(v, c, r); ai.passed = true; } } else if (!ai.wp) ai.passed = false;
  if (ai.wp) { ai.wpT += dt; if (Math.hypot(ai.wp.x - v.x, ai.wp.z - v.z) < 3.2 || ai.wpT > 8) ai.wp = null; }
  // Точка цели (pure pursuit)
  const L = clamp(3.5 + Math.abs(v.speed) * 0.3, 4, 11), D = [[1, 0], [0, 1], [-1, 0], [0, -1]][ai.dir];
  const tx = ai.wp ? ai.wp.x : horiz ? v.x + D[0] * L : ai.lane;
  const tz = ai.wp ? ai.wp.z : horiz ? ai.lane : v.z + D[1] * L;
  const err = angDiff(v.ang, Math.atan2(tz - v.z, tx - v.x));
  const steer = clamp(err * 2.0, -1, 1);
  // Целевая скорость
  let target = ai.cruise * (ai.wp ? 0.55 : 1) * (1 - 0.5 * Math.min(1, Math.abs(err)));
  const halfW = s.w / 2 + 0.35, look = 6 + Math.abs(v.speed) * 1.3;
  const od = obstacleAhead(v, look, halfW);
  if (od < 1e8) target = Math.min(target, Math.max(0, (od - 1.2) * 1.4));
  // Светофор / переезд впереди
  const fx = Math.cos(v.ang), fz = Math.sin(v.ang);
  if (!ai.wp && rdv !== 5) for (let d = 2; d <= 17; d += 1) {
    const j = w.tileAt(v.x + fx * d, v.z + fz * d); if (j < 0) break;
    const ty = w.type[j];
    if (w.rd[j] === 5) {
      const st = lightState(horiz ? 1 : 0), distStop = d - 4.6 - s.l / 2 + 1.6;
      if (st === 'r' || (st === 'y' && distStop > v.speed * v.speed / 8)) target = Math.min(target, Math.sqrt(Math.max(0, 2 * 4.2 * Math.max(0, distStop))));
      break;
    }
    if (ty === T.CROSSING && !horiz) {
      const g = gateAt(v.x); if (g && g.closed) { target = Math.min(target, Math.sqrt(Math.max(0, 2 * 4.5 * Math.max(0, d - 3.5 - s.l / 2)))); }
      break;
    }
  }
  ai.wait = target < 0.4 ? ai.wait + dt : 0;
  if (Math.abs(v.speed) < 0.4 && target > 2 && od > 5) ai.stuck += dt; else ai.stuck = Math.max(0, ai.stuck - dt);
  if (ai.stuck > 7) v.remove = true;
  const e = target - v.speed;
  return { throttle: e > 0.3 ? clamp(e * 0.5, 0, 1) : 0, brake: e < -1.2 ? clamp(-e * 0.2, 0.2, 1) : 0, steer, hand: false };
}

export function updateTraffic(dt) {
  for (const g of G.gates) g.arm += ((g.closed ? 1 : 0) - g.arm) * Math.min(1, dt * 2.5);
  const p = G.player, R2 = (activeRadius() * 1.3) ** 2;
  for (const v of G.cars) {
    if (v.hitCool > 0) v.hitCool -= dt;
    v.life += dt;
    if (v.driver === 'player') continue;
    if (v.ai) {
      const inp = v.ai.kind === 'police' ? G.policeInput(v, dt) : civInput(v, dt);
      v.step(dt, inp);
    } else if (Math.abs(v.vx) + Math.abs(v.vz) > 0.05) {
      const d2 = (v.x - p.x) ** 2 + (v.z - p.z) ** 2;
      if (d2 < 160000) v.step(dt, { throttle: 0, brake: 0.35 }); else { v.vx = v.vz = 0; }
    }
    if (v.wreck && !v._wrecked) { v._wrecked = true; if (v.driver === 'npc' || v.driver === 'cop') { G.ejectWreckDriver?.(v); } }
    if (v.wreck) updateVehicleFire(v, dt);
    if (v.wreck) { v.smokeT -= dt; if (v.smokeT <= 0) { v.smokeT = 0.12; G.fx.push({ k: 'smoke', x: v.x, z: v.z, vx: (Math.random() - 0.5) * 0.8, vz: -0.8 - Math.random(), t: 0, life: 1.6, r: 0.6 }); } }
    else if (v.hp < v.maxHp * 0.3) { v.smokeT -= dt; if (v.smokeT <= 0) { v.smokeT = 0.25; G.fx.push({ k: 'smoke', x: v.x, z: v.z, vx: 0, vz: -0.7, t: 0, life: 1.0, r: 0.4 }); } }
  }
  // Удаление далёких и застрявших
  const cam = G.cam;
  for (let i = G.cars.length - 1; i >= 0; i--) {
    const v = G.cars[i];
    if (v.driver === 'player' || v.keep) continue;
    const far = (v.x - p.x) ** 2 + (v.z - p.z) ** 2 > R2;
    if (v.ai && (far || v.remove) && !cam.visible(v.x, v.z, 10)) { G.cars.splice(i, 1); continue; }
    if (v.ai?.kind === 'police' && v.ai.gone && !cam.visible(v.x, v.z, 10)) G.cars.splice(i, 1);
  }
  // Пополнение трафика до целевого количества
  let civ = 0; for (const v of G.cars) if (v.ai?.kind === 'civ') civ++;
  if (civ < G.quality.carTarget) for (let k = 0; k < 2; k++) spawnTrafficCar(false);
}

export function populateTraffic() {
  for (let i = 0; i < G.quality.carTarget * 3 && G.cars.filter(c => c.ai).length < G.quality.carTarget; i++) spawnTrafficCar(true);
}
