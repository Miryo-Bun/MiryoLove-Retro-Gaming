// Шаблоны интерьеров (вид сверху, клетка 2 м, коллизии 1 м). Координаты — в метрах внутри помещения.
import { A } from '../engine/assets.js';
import { rng } from '../engine/util.js';
import { CAR_ECON } from '../data.js';

export const isize = name => { const r = A.m.interior.items[name]; return [r[2] / 16, r[3] / 16]; };

class Room {
  constructor(w, h, floor, name) {
    this.w = w; this.h = h; this.name = name;
    this.cells = new Array(w * h).fill(floor); this.walls = new Uint8Array(w * h);
    this.sw = w * 2; this.sh = h * 2; this.solid = new Uint8Array(this.sw * this.sh);
    this.items = []; this.acts = []; this.npcs = []; this.wins = []; this.cars = [];
    const cx = Math.floor(w / 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x === 0 || y === 0 || x === w - 1 || y === h - 1) this.wall(x, y);
    this.walls[(h - 1) * w + cx] = 0; this.cells[(h - 1) * w + cx] = 'exit_mat'; this.unsolidCell(cx, h - 1);
    this.exit = { x: cx * 2 + 1, z: h * 2 - 1 };
    this.spawn = { x: cx * 2 + 1, z: h * 2 - 3 };
  }
  wall(cx, cy) { this.walls[cy * this.w + cx] = 1; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) this.solid[(cy * 2 + a) * this.sw + cx * 2 + b] = 1; }
  unsolidCell(cx, cy) { for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) this.solid[(cy * 2 + a) * this.sw + cx * 2 + b] = 0; }
  floor(cx, cy, cw, ch, name) { for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) if (!this.walls[y * this.w + x]) this.cells[y * this.w + x] = name; }
  line(x0, y0, x1, y1, gaps = []) { const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0); for (let x = x0, y = y0; ; x += dx, y += dy) { if (!gaps.includes(dx ? x : y)) this.wall(x, y); if (x === x1 && y === y1) break; } }
  win(cx) { this.wins.push(cx); }
  block(x0, z0, x1, z1) { for (let z = Math.floor(z0); z < Math.ceil(z1); z++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) if (x >= 0 && z >= 0 && x < this.sw && z < this.sh) this.solid[z * this.sw + x] = 1; }
  put(name, x, z, rot = 0, o = {}) {
    let [w, h] = isize(name); if (rot % 2) [w, h] = [h, w];
    this.items.push({ name, x, z, rot, w, h });
    if (o.solid !== false) this.block(x - w / 2 + 0.12, z - h / 2 + 0.12, x + w / 2 - 0.12, z + h / 2 - 0.12);
    return this;
  }
  act(type, x, z, label, data = {}, r = 2.2) { this.acts.push({ type, x, z, label, data, r }); return this; }
  npc(x, z, role, o = {}) { this.npcs.push({ x, z, role, ang: o.ang ?? Math.PI / 2, wander: !!o.wander, variant: o.variant, name: o.name }); return this; }
}

const BUYABLE = Object.keys(CAR_ECON).filter(k => CAR_ECON[k].price);

export function buildInterior(spec) {
  const type = spec.type, R = rng(spec.seed * 7919 + 13);
  let r;
  if (type === 'flat') r = flat(R); else if (type === 'home') r = home(R); else if (type === 'mansion') r = mansion(R);
  else if (type === 'office') r = office(R); else if (type.startsWith('shop_')) r = shop(type.slice(5), R); else if (type === 'mall') r = mall(R);
  else if (type === 'restaurant') r = restaurant(R); else if (type === 'hospital') r = hospital(R); else if (type === 'police') r = police(R);
  else if (type === 'bank') r = bank(R); else if (type === 'dealer') r = dealer(R, spec); else if (type === 'garage') r = garage(R); else if (type === 'gas') r = shop('gas', R, true);
  else r = shop('grocery', R);
  r.title = spec.name || type; r.type = type;
  return r;
}

function flat(R) {
  const r = new Room(12, 9, 'floor_wood', 'Квартира');
  r.floor(8, 1, 3, 4, 'floor_carpet_blue'); r.floor(8, 5, 3, 3, 'floor_kitchen');
  r.line(7, 1, 7, 5, [3]); r.line(7, 5, 10, 5, [9]);
  for (const c of [2, 4, 9]) r.win(c);
  r.put('tv', 7, 2.7); r.put('sofa', 7, 10.4, 2); r.put('rug', 7, 7.2, 0, { solid: false }); r.put('table_rect', 7, 7.3).put('armchair', 11.4, 7.4, 3).put('plant', 3, 3.2);
  r.put('bed_double', 19.5, 4.1).put('wardrobe', 21.4, 7.2, 1);
  r.put('fridge', 21.4, 11.1).put('stove', 19.5, 10.9).put('sink', 17.3, 10.9).put('table_round', 19.4, 14.2).put('chair', 17.7, 14.2, 3).put('chair', 21.2, 14.2, 1);
  r.act('bed', 19.5, 6.4, 'Кровать: отдохнуть и сохранить игру').act('fridge', 21.4, 12.6, 'Холодильник: перекусить', { heal: 10 });
  r.npc(8, 5.5, 'resident', { wander: false });
  return r;
}
function home(R) {
  const r = new Room(10, 8, 'floor_wood', 'Дом');
  r.floor(6, 1, 3, 3, 'floor_carpet_red'); r.floor(1, 4, 3, 3, 'floor_kitchen');
  for (const c of [2, 4, 7]) r.win(c);
  r.put('bed_double', 15.5, 4.2).put('wardrobe', 17.4, 8, 1).put('rug', 6.5, 8.5, 0, { solid: false }).put('sofa', 6.5, 10.6, 2).put('tv', 6.5, 8.5 - 3.4 + 0.9).put('plant', 3, 3.2);
  r.put('fridge', 3, 9.2).put('stove', 5.2, 9.0).put('table_round', 3.8, 12.2).put('chair', 5.6, 12.2, 1).put('chair', 2.0, 12.2, 3);
  r.act('bed', 15.5, 6.6, 'Кровать: отдохнуть и сохранить игру').act('fridge', 3, 10.6, 'Холодильник: перекусить', { heal: 10 });
  if (R() < 0.6) r.npc(10, 11, 'resident', { wander: true });
  return r;
}
function mansion(R) {
  const r = new Room(16, 11, 'floor_wood', 'Особняк');
  r.floor(10, 1, 5, 4, 'floor_carpet_red'); r.floor(1, 6, 6, 4, 'floor_marble'); r.floor(10, 6, 5, 4, 'floor_kitchen');
  r.line(9, 1, 9, 5, [3]); r.line(9, 6, 15, 6, [12]);
  for (const c of [2, 4, 6, 11, 13]) r.win(c);
  r.put('tv', 9, 2.8).put('sofa', 7, 8.8, 2).put('sofa', 3.5, 8.0, 3).put('rug', 7, 7.4, 0, { solid: false }).put('table_round', 7, 7.0).put('plant', 3, 3.2).put('plant', 14.5, 3.2).put('armchair', 12, 7.7, 1);
  r.put('bed_double', 25.5, 4.3).put('wardrobe', 28.8, 7, 1).put('wardrobe', 21.8, 2.9);
  r.put('fridge', 29, 14.5).put('stove', 26.7, 14.3).put('sink', 24.3, 14.3).put('table_rect', 7, 16.6).put('chair', 5, 16.6, 3).put('chair', 9, 16.6, 1).put('table_round', 26.5, 19.4);
  r.act('bed', 25.5, 6.6, 'Кровать: отдохнуть и сохранить игру').act('fridge', 29, 16, 'Холодильник: перекусить', { heal: 10 });
  r.npc(14, 14, 'resident', { wander: true }); if (R() < 0.5) r.npc(26, 18, 'resident');
  return r;
}
function office(R) {
  const r = new Room(14, 10, 'floor_carpet_blue', 'Офис');
  for (const c of [2, 4, 7, 9, 11]) r.win(c);
  r.put('reception', 14, 17.2);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = 5 + i * 7.5, z = 5.2 + j * 5; r.put('desk', x, z).put('office_chair', x - 0.4, z + 1.4); if (R() < 0.8) r.npc(x - 0.4, z + 1.4, 'worker', { ang: -Math.PI / 2 }); }
  r.put('plant', 2.8, 15).put('plant', 25.2, 15).put('vending', 25.6, 4.4).put('terminal', 22.4, 13.9);
  r.act('terminal', 22.4, 13.0, 'Терминал: посмотреть новости', { msg: 'Офисные новости: акции города растут.' });
  r.act('vending', 25.6, 5.6, 'Автомат: напиток (120 ₽)', { buy: 'cola' });
  return r;
}
function shop(kind, R, small = false) {
  const w = small ? 8 : 10, h = small ? 6 : 8, r = new Room(w, h, kind === 'pharmacy' ? 'floor_hospital' : kind === 'guns' ? 'floor_concrete' : 'floor_tile', 'Магазин');
  for (const c of [2, 4, 6].filter(c => c < w - 1)) r.win(c);
  const shelf = kind === 'pharmacy' ? 'shelf_med' : kind === 'clothes' ? 'rack_clothes' : kind === 'guns' ? 'rack_weapons' : kind === 'hardware' ? 'shelf_tools' : 'shelf_food';
  const W2 = w * 2;
  r.put('counter', W2 - 5, 5.4).put('register', W2 - 4.2, 5.0, 0, { solid: false }).npc(W2 - 5, 3.4, 'seller', { ang: Math.PI / 2 });
  r.put(shelf, 4.2, 2.8);
  if (!small) {
    r.put(shelf, 4.2, 8.0, 2).put(shelf, 4.2, 10.4);
    if (kind === 'grocery') r.put('shelf_drink', 10.5, 10.6, 2).put('shelf_food', 10.5, 8.2);
    if (kind === 'clothes') r.put('mannequin', 12, 9).put('mannequin', 14, 9.6).put('rack_clothes', 11, 12.2);
    if (kind === 'hardware') { r.put('crate_int', 14, 11.5).put('tires', 16.5, 12.5).put('oil_barrel', 17.5, 10.8); }
    if (kind === 'guns') r.put('rack_weapons', 10.5, 2.8);
    if (kind === 'pharmacy') r.put('med_cab', 9, 2.5);
  } else { r.put('shelf_drink', 4.2, 6.4, 2); }
  r.act('shop', W2 - 5, 6.9, 'Прилавок: открыть магазин', { shop: kind === 'gas' ? 'gas' : kind });
  r.npc(8 + R() * 6, 10 + R() * 2, 'customer', { wander: true });
  if (R() < 0.5 && !small) r.npc(12 + R() * 5, 12, 'customer', { wander: true });
  return r;
}
function mall(R) {
  const r = new Room(18, 12, 'floor_marble', 'Торговый центр');
  for (const c of [3, 6, 9, 12, 15]) r.win(c);
  const stalls = [['grocery', 'shelf_food'], ['clothes', 'rack_clothes'], ['pharmacy', 'shelf_med'], ['hardware', 'shelf_tools']];
  stalls.forEach(([k, sh], i) => { const x = 5.8 + i * 8.2; r.put('counter', x, 5.0).put(sh, x, 2.8).npc(x, 3.8, 'seller').act('shop', x, 6.6, 'Лавка: ' + ({ grocery: 'продукты', clothes: 'одежда', pharmacy: 'аптека', hardware: 'хозтовары' })[k], { shop: k }); });
  r.put('plant', 3.2, 12).put('plant', 32.8, 12).put('plant', 18, 12).put('vending', 33, 7.5, 1).put('atm', 3.2, 8.5);
  r.act('vending', 31.9, 7.5, 'Автомат: напиток (120 ₽)', { buy: 'cola' }, 1.6).act('atm', 4.4, 8.5, 'Банкомат', { atm: true }, 1.6);
  r.floor(7, 5, 4, 3, 'floor_checker');
  r.npc(14, 12, 'customer', { wander: true }); r.npc(24, 14, 'customer', { wander: true }); r.npc(10, 16, 'customer', { wander: true });
  return r;
}
function restaurant(R) {
  const r = new Room(14, 9, 'floor_wood', 'Ресторан');
  r.floor(1, 1, 14, 2, 'floor_kitchen');
  for (const c of [3, 5, 7, 9, 11]) r.win(c);
  r.put('bar_counter', 21, 6.1).put('kitchen_range', 8, 2.8).put('kitchen_range', 17, 2.8).npc(21, 4.4, 'seller').put('fridge', 25.2, 2.9);
  for (let i = 0; i < 4; i++) { r.put('stool', 17.6 + i * 2.6, 7.7); }
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = 5 + i * 5.5, z = 10.6 + j * 3.6; r.put('table_round', x, z); r.put('chair', x - 1.8, z, 3).put('chair', x + 1.8, z, 1); if (R() < 0.55) r.npc(x - 1.8, z, 'diner', { ang: 0 }); }
  r.put('booth', 24.5, 14.2).put('booth', 24.5, 10.8).put('plant', 26.6, 16);
  r.act('shop', 21, 7.6, 'Стойка: меню', { shop: 'restaurant' });
  return r;
}
function hospital(R) {
  const r = new Room(16, 10, 'floor_hospital', 'Больница');
  for (const c of [3, 5, 7, 9, 11, 13]) r.win(c);
  r.line(10, 1, 10, 5, [3]);
  r.put('reception', 9, 14.8).npc(9, 13.0, 'nurse');
  for (let i = 0; i < 3; i++) r.put('hosp_bed', 15.2 + i * 5.6, 5.4);
  r.put('hosp_bed', 25, 12, 1);
  r.put('med_cab', 3.5, 2.6).put('med_cab', 7, 2.6).put('plant', 29, 17).put('chair', 3, 12.6, 1).put('chair', 3, 14.2, 1).put('chair', 3, 15.8, 1);
  r.npc(20, 10, 'doctor', { wander: true }); r.npc(27, 6, 'patient', { ang: 0 });
  r.act('hospital', 9, 16.2, 'Регистратура: лечение', {}, 2.4);
  r.act('bed', 15.2, 7.7, 'Койка: отдохнуть (бесплатно, до 100% здоровья)', { free: true });
  r.recover = { x: 15.2 + 5.6, z: 7.6 };
  return r;
}
function police(R) {
  const r = new Room(16, 10, 'floor_concrete', 'Полицейский участок');
  for (const c of [3, 5, 7]) r.win(c);
  r.floor(9, 1, 6, 5, 'floor_tile');
  r.line(9, 1, 9, 5, [4]);
  r.put('cell_bars', 20, 7.6).put('bunk', 21.4, 4.6).put('bunk', 26.6, 4.6).put('cell_bars', 27.6, 7.6).put('toilet', 29.4, 3.4);
  r.put('reception', 10, 14.0).npc(10, 12.2, 'officer');
  r.put('desk', 6, 5.4).put('office_chair', 5.6, 6.8).put('desk', 13, 5.4).put('office_chair', 12.6, 6.8).put('plant', 3, 3.2).put('vending', 15.4, 3.2);
  r.npc(5.6, 6.8, 'officer', { ang: -Math.PI / 2 });
  r.act('police', 10, 15.3, 'Стойка: информация и штрафы', {}, 2.4);
  r.cell = { x: 24, z: 6 };
  return r;
}
function bank(R) {
  const r = new Room(14, 9, 'floor_marble', 'Банк');
  for (const c of [2, 4, 6, 8, 10]) r.win(c);
  r.put('vault', 24.2, 4.2).put('counter', 9, 6.6).put('counter', 16.5, 6.6).npc(9, 4.9, 'teller').npc(16.5, 4.9, 'teller');
  r.put('atm', 3.2, 4.4).put('atm', 5.4, 4.4).put('plant', 3, 15).put('plant', 25, 15).put('rug', 14, 12, 0, { solid: false });
  r.act('bank', 9, 8.3, 'Касса: банковский счёт', {}, 2.4).act('bank', 16.5, 8.3, 'Касса: банковский счёт', {}, 2.4).act('bank', 4.3, 5.9, 'Банкомат: счёт', {}, 1.8);
  r.npc(13, 12, 'customer', { wander: true });
  return r;
}
function dealer(R, spec) {
  const r = new Room(16, 10, 'floor_marble', 'Автосалон');
  for (const c of [2, 4, 6, 8, 10, 12, 14]) r.win(c);
  const rr = rng(spec.seed * 31 + 5), pool = [...BUYABLE]; const stock = [];
  const n = 4; while (stock.length < n && pool.length) stock.push(pool.splice(Math.floor(rr() * pool.length), 1)[0]);
  if (spec.rich) stock[0] = 'limo';
  stock.forEach((t, i) => {
    const x = 8 + (i % 2) * 15 + (i >= 2 ? 0 : 0), z = 7 + Math.floor(i / 2) * 6.4;
    r.put('platform', x, z, 0, { solid: false }); r.cars.push({ type: t, color: Math.floor(rr() * 8), x, z, ang: -0.45 + (i % 2) * 0.9 });
    r.block(x - 3.4, z - 2, x + 3.4, z + 2);
    r.act('buycar', x, z + 3.6, 'Купить: ' + t, { type: t }, 3.4);
  });
  r.put('counter', 25.2, 6.4, 1).npc(26.6, 6.4, 'seller', { ang: Math.PI }).put('plant', 3, 3.2).put('plant', 3, 17);
  r.act('info', 24, 8.5, 'Консультант', { msg: 'Продавец: «Берите любую — оформим за минуту. Старую можно сдать в гараже.»' }, 2.4);
  return r;
}
function garage(R) {
  const r = new Room(12, 9, 'floor_concrete', 'Гараж');
  for (const c of [3, 6, 9]) r.win(c);
  r.put('lift', 7, 6.4, 0, { solid: false }).put('lift', 16, 6.4, 0, { solid: false });
  r.put('bench_tools', 20, 3.2).put('tires', 3, 3.2).put('tires', 3.2, 5).put('oil_barrel', 22, 14).put('crate_int', 21.5, 11.5).put('terminal', 3.4, 12.8);
  r.npc(18.8, 5.4, 'mechanic', { ang: Math.PI });
  r.act('garage', 3.4, 11.6, 'Терминал гаража: мои машины, ремонт, покраска', {}, 2.2);
  return r;
}
