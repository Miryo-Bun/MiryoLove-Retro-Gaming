// Гараж игрока: купленные машины, хранение, ремонт, покраска, продажа, заправка.
import { G, state } from './state.js';
import { CAR_ECON, CAR_BY_ID } from './data.js';
import { A } from './engine/assets.js';
import { spawnCar } from './systems/traffic.js';

export function garageInit() { state.garage = state.garage || []; }
const colorsOf = type => A.m.vehicles.types[type].colors.length;
export function addCar(type, color) {
  garageInit();
  const e = { id: 'g' + Date.now().toString(36) + Math.floor(Math.random() * 1e4), type, color: color % colorsOf(type), hp: CAR_BY_ID[type].hp, fuel: CAR_ECON[type]?.fuel ?? 50, out: false };
  state.garage.push(e); return e;
}
export const worldCar = e => G.cars.find(c => c.ownedId === e.id);
export function entryState(e) { const v = worldCar(e); return v ? { hp: v.hp, fuel: v.fuel, color: v.colorIdx } : { hp: e.hp, fuel: e.fuel, color: e.color }; }
export const hpFrac = e => { const s = entryState(e); return Math.max(0, Math.min(1, s.hp / CAR_BY_ID[e.type].hp)); };
export const sellValue = e => Math.round((CAR_ECON[e.type]?.price || 1000) * 0.55 * (0.45 + 0.55 * hpFrac(e)));
export const repairCost = e => Math.round((1 - hpFrac(e)) * (CAR_ECON[e.type]?.price || 100000) * 0.12 + ((1 - hpFrac(e)) > 0 ? 1500 : 0));
export const fuelCost = e => { const s = entryState(e), cap = CAR_ECON[e.type]?.fuel ?? 50; return Math.ceil((cap - s.fuel) * 65); };

export function spawnOut(e, x, z, ang = 0) {
  if (e.out) return worldCar(e) || null;
  const v = spawnCar(e.type, x, z, ang, { color: e.color }); v.keep = true; v.parked = true; v.ownedId = e.id; v.hp = e.hp; v.fuel = e.fuel; v.maxHp = CAR_BY_ID[e.type].hp;
  e.out = true; return v;
}
export function storeVehicle(v) {
  const e = state.garage.find(g => g.id === v.ownedId); if (!e) return false;
  e.hp = v.hp; e.fuel = v.fuel; e.color = v.colorIdx; e.out = false; v.wreck = false;
  const i = G.cars.indexOf(v); if (i >= 0) G.cars.splice(i, 1); return true;
}
export function repair(e) {
  const c = repairCost(e); if (c <= 0) return { ok: false, msg: 'Машина в порядке' }; if (state.money < c) return { ok: false, msg: 'Недостаточно денег' };
  state.money -= c; const v = worldCar(e); if (v) { v.hp = v.maxHp; v.wreck = false; v.fire = 0; v.burn = 0; } e.hp = CAR_BY_ID[e.type].hp; return { ok: true, msg: 'Ремонт выполнен: −₽' + c };
}
export function refuel(e) {
  const c = fuelCost(e); if (c <= 0) return { ok: false, msg: 'Бак полон' }; if (state.money < c) return { ok: false, msg: 'Недостаточно денег' };
  state.money -= c; const v = worldCar(e); if (v) v.fuel = v.fuelCap; e.fuel = CAR_ECON[e.type]?.fuel ?? 50; return { ok: true, msg: 'Заправлено: −₽' + c };
}
export function paint(e) {
  if (state.money < 3500) return { ok: false, msg: 'Покраска стоит 3500 ₽' };
  state.money -= 3500; const n = colorsOf(e.type), nc = (entryState(e).color + 1) % n; e.color = nc;
  const v = worldCar(e); if (v) { v.colorIdx = nc; v.sprite = (A.m && v.sprite) ? { ...v.sprite, rect: A.m.vehicles.types[e.type].colors[nc].rect } : v.sprite; }
  return { ok: true, msg: 'Перекрашено: цвет ' + A.m.vehicles.types[e.type].colors[nc].name + ' (−3500 ₽)' };
}
export function sell(e) {
  const v = worldCar(e); if (v?.driver === 'player') return { ok: false, msg: 'Сначала выйдите из машины' };
  const val = sellValue(e); state.money += val; if (v) { const i = G.cars.indexOf(v); if (i >= 0) G.cars.splice(i, 1); }
  state.garage.splice(state.garage.indexOf(e), 1); return { ok: true, msg: 'Продано за ₽' + val };
}
