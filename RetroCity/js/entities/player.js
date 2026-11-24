// Игрок: ходьба/бег, посадка и выход из машины (с анимацией), управление транспортом, оружие.
import { G, state } from '../state.js';
import { Person, advanceAnim, moveSlide, solidPred, blockedCircle } from './person.js';
import { input, down, hit } from '../engine/input.js';
import { clamp, turnToward, angDiff, smooth } from '../engine/util.js';
import { playerFire, currentWeapon } from '../systems/combat.js';
import { spawnNpc, flee } from '../systems/peds.js';
import { WEAPONS, CAR_ECON } from '../data.js';
import { speedMul } from '../economy.js';
import { enterBuilding, openNow, openHoursText } from '../interior/scene.js';
import { state as ST } from '../state.js';

export function createPlayer(char, x, z) {
  const p = new Person({ kind: 'hero', heroId: char.id, x, z, hp: 100 });
  p.r = 0.42; p.inVehicle = null; p.inHelicopter = null; p.enter = null; p.exit = null; p.nextFire = 0; p.aimAng = null; p.run = false; p.ang = Math.PI / 2;
  return p;
}

export function nearestDoor(p) {
  const w = G.world; let best = null, bd = 4;
  for (const b of w.doors) { const d = Math.hypot(b.door.px - p.x, b.door.pz - p.z); if (d < bd && p.z > b.door.z - 0.5) { bd = d; best = b; } }
  return best;
}
export function nearestPump(p) { let best = null, bd = 5; for (const q of G.world.pois.pumps) { const d = Math.hypot(q.x - p.x, q.z - p.z); if (d < bd) { bd = d; best = q; } } return best; }
export function nearestVehicle(p) {
  let best = null, bd = 1e9;
  for (const v of G.cars) {
    if (v.wreck) continue;
    const d = Math.hypot(v.x - p.x, v.z - p.z) - v.stats.l / 2;
    const near = v.inside(p.x, p.z, 2.4);
    if (near && d < bd) { bd = d; best = v; }
  }
  return best;
}

export function nearestHelicopter(p) {
  let best = null, bd = 5;
  for (const h of G.helicopters || []) {
    if (h.wreck) continue;
    const d = Math.hypot(h.x - p.x, h.z - p.z);
    if (d < bd && h.altitude <= 2.5) { bd = d; best = h; }
  }
  return best;
}

function enterHelicopter(p, h) {
  h.driver = 'player'; h.parked = false; h.owned = h.owned || h.ownedId != null;
  p.inHelicopter = h; p.speed = 0;
  G.msg('Вертолёт: управление вертикальным и горизонтальным полётом', 3);
}

function exitHelicopter(p) {
  const h = p.inHelicopter;
  if (!h || h.altitude > 2.5) { G.msg('Нужно приземлиться для посадки', 2); return false; }
  h.driver = null; h.parked = true;
  p.inHelicopter = null;
  p.x = h.x + 2; p.z = h.z + 2;
  G.msg('Высадка с вертолёта', 1.5);
  return true;
}

function ejectDriver(v) {
  const door = v.doorPos(-1), n = new Person({ kind: 'npc', variant: Math.floor(Math.random() * 40), x: door.x, z: door.z, hp: 35 });
  n.base = 1.4; n.ang = v.ang - Math.PI / 2; n.pers = 'stroller';
  if (G.world.solidAt(n.x, n.z)) { n.x = v.x; n.z = v.z; }
  G.peds.push(n); flee(n, G.player.x, G.player.z, 8);
  v.driver = null; v.ai = null;
  G.crime?.('carjack', v.x, v.z);
}

export function startEnter(p, v) {
  if (v.driver && v.driver !== 'player') { if (v.driver === 'cop') G.crime?.('carjack_cop', v.x, v.z); ejectDriver(v); }
  const door = v.doorPos(-1);
  p.enter = { v, t: 0, dur: 0.55, fx: p.x, fz: p.z, tx: door.x, tz: door.z };
  p.speed = 0;
}
function startExit(p) {
  const v = p.inVehicle;
  if (Math.abs(v.speed) > 9) { G.msg('Слишком быстро, чтобы выйти', 1.2); return; }
  const cands = [v.doorPos(-1), v.doorPos(1)];
  const rear = { x: v.x - Math.cos(v.ang) * (v.stats.l / 2 + 1.2), z: v.z - Math.sin(v.ang) * (v.stats.l / 2 + 1.2) };
  cands.push(rear);
  let spot = cands.find(c => !blockedCircle(solidPred, c.x, c.z, 0.45)) || G.world.nearestWalk(v.x, v.z, 6);
  p.exit = { v, t: 0, dur: 0.45, fx: v.x, fz: v.z, tx: spot.x, tz: spot.z };
  v.driver = null; v.ai = null; p.crouch = 1;
  p.ang = Math.atan2(spot.z - v.z, spot.x - v.x);
}

export function forceExit(p) {   // выброс при уничтожении машины
  const v = p.inVehicle; if (!v) return;
  p.inVehicle = null; v.driver = null;
  const s = G.world.nearestWalk(v.x + Math.cos(v.ang + 1.57) * 3, v.z + Math.sin(v.ang + 1.57) * 3, 6);
  p.x = s.x; p.z = s.z; p.crouch = 0; p.exit = null; p.enter = null;
}

export function updatePlayer(dt) {
  const p = G.player, ch = state.character;
  advanceAnim(p, dt);
  // Оружие: смена и подсказки
  if (hit('KeyQ')) { state.weaponIndex = (state.weaponIndex + state.ownedWeapons.length - 1) % state.ownedWeapons.length; G.updateWeaponHUD?.(); }
  if (hit('KeyR')) { state.weaponIndex = (state.weaponIndex + 1) % state.ownedWeapons.length; G.updateWeaponHUD?.(); }
  for (let i = 1; i <= 6; i++) if (hit('Digit' + i) && state.ownedWeapons[i - 1]) { state.weaponIndex = i - 1; G.updateWeaponHUD?.(); }

  // Анимация посадки
  if (p.enter) {
    const e = p.enter; e.t += dt; const k = clamp(e.t / e.dur, 0, 1);
    p.x = e.fx + (e.tx - e.fx) * Math.min(1, k * 1.5); p.z = e.fz + (e.tz - e.fz) * Math.min(1, k * 1.5);
    p.ang = turnToward(p.ang, Math.atan2(e.v.z - p.z, e.v.x - p.x), 9 * dt);
    p.crouch = k; p.speed = k < 0.6 ? 1.6 : 0;
    if (k >= 1) { p.inVehicle = e.v; e.v.driver = 'player'; e.v.ai = null; e.v.parked = false; e.v.bonus = ch?.vehicleBonus || 1; p.enter = null; p.crouch = 0; G.msg('Вы сели в ' + e.v.stats.name); G.onEnterVehicle?.(e.v); }
    return;
  }
  if (p.exit) {
    const e = p.exit; e.t += dt; const k = clamp(e.t / e.dur, 0, 1);
    p.x = e.fx + (e.tx - e.fx) * k; p.z = e.fz + (e.tz - e.fz) * k; p.inVehicle = k < 0.35 ? e.v : null;
    p.crouch = 1 - k; p.speed = k < 1 ? 1.6 : 0;
    if (k >= 1) { p.exit = null; p.crouch = 0; p.inVehicle = null; G.msg('Вы вышли из машины', 1.5); }
    return;
  }

  if (p.inHelicopter) {
    const h = p.inHelicopter;
    const forward = down('KeyW', 'ArrowUp') ? 1 : down('KeyS', 'ArrowDown') ? -1 : 0;
    const steer = (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0);
    const turn = (down('KeyE') ? 0 : 0) + (down('KeyQ') ? -1 : 0) + (down('KeyR') ? 1 : 0);
    const vertical = down('ShiftLeft', 'ShiftRight') ? 1 : down('KeyX') ? -1 : 0;
    h.step(dt, { throttle: forward, steer, turn, vertical });
    p.x = h.x; p.z = h.z; p.ang = h.ang; p.speed = h.speed;
    if (hit('KeyE')) exitHelicopter(p);
    if (hit('KeyI')) G.openInventory?.();
    return;
  }

  if (p.inVehicle) {
    const v = p.inVehicle;
    const throttle = down('KeyW', 'ArrowUp') ? 1 : down('KeyS', 'ArrowDown') ? -1 : 0;
    const steer = (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0);
    v.step(dt, { throttle, steer, brake: 0, hand: down('Space') });
    p.x = v.x; p.z = v.z; p.ang = v.ang; p.speed = 0; v.braking = v.braking || down('Space');
    if (hit('KeyE')) startExit(p);
    if (hit('KeyF')) { const pump = nearestPump(v); if (pump) { const need = v.fuelCap - v.fuel, price = 65, cost = Math.ceil(need * price); if (need < 1) G.msg('Бак полон', 1.5); else if (ST.money < price) G.msg('Недостаточно денег', 1.5); else { const lit = Math.min(need, ST.money / price); v.fuel += lit; ST.money -= Math.ceil(lit * price); G.msg('Заправлено ' + Math.round(lit) + ' л (−₽' + Math.ceil(lit * price) + ')', 2); G.sfx?.('cash'); } } else G.msg('Рядом нет колонки', 1.2); }
    if (hit('KeyI')) G.openInventory?.();
    if (hit('KeyH')) G.quickHeal?.();
    return;
  }

  // Пешком
  let dx = (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0);
  let dz = (down('KeyS', 'ArrowDown') ? 1 : 0) - (down('KeyW', 'ArrowUp') ? 1 : 0);
  const len = Math.hypot(dx, dz); if (len) { dx /= len; dz /= len; }
  p.run = down('ShiftLeft', 'ShiftRight') && len > 0;
  const spd = (p.run ? 6.2 : 3.0) * (ch?.speedMul || 1) * speedMul();
  const tvx = dx * spd, tvz = dz * spd;
  p.vx = smooth(p.vx, tvx, dt, 14); p.vz = smooth(p.vz, tvz, dt, 14);
  const prevX = p.x, prevZ = p.z;
  moveSlide(p, p.vx * dt, p.vz * dt, solidPred);
  p.speed = Math.hypot(p.x - prevX, p.z - prevZ) / dt; if (!len && p.speed < 0.6) p.speed = 0;
  // Прицел по курсору
  const mwx = G.cam.wx(input.mouse.x), mwz = G.cam.wz(input.mouse.y);
  const wp = currentWeapon(), firing = input.mouse.down || down('Space');
  p.aimAng = input.mouse.inside ? Math.atan2(mwz - p.z, mwx - p.x) : p.ang;
  if (firing && !wp.melee && (input.mouse.down)) { p.ang = turnToward(p.ang, p.aimAng, 20 * dt); }
  else if (len > 0) p.ang = turnToward(p.ang, Math.atan2(dz, dx), 14 * dt);
  if (firing) { if (!(wp.melee === false && !input.mouse.down)) p.aimAng = input.mouse.down ? p.aimAng : p.ang; playerFire(p); }
  if (hit('KeyE')) {
    const h = nearestHelicopter(p);
    const v = nearestVehicle(p);
    if (h) enterHelicopter(p, h);
    else if (v) startEnter(p, v);
    else { const b = nearestDoor(p); if (b) enterBuilding(b); }
  }
  if (hit('KeyI')) G.openInventory?.();
  if (hit('KeyH')) G.quickHeal?.();
}
