// Генерация города RetroCity (расширенная карта ~3x): тайлы 4 м, кварталы 12x12 тайлов, районы со своей архитектурой.
// Оси: x — восток, z — юг (вниз по экрану). Направления: 0=E, 1=S, 2=W, 3=N (угол = dir * 90°).
import { rng, hash2 } from '../engine/util.js';
import { NK, NJ, URBAN, CLOSED, ARTERIAL, BRIDGES, RAIL_BLOCK_ROW, districtOfBlock, blockOf, roadBetween } from './layout.js';
import { BKIND, SHOP_TYPES } from './buildings.js';

export const TS = 4, OX = -784, OZ = -688, W = 440, H = 416;
export const CHUNK = 8, CW = Math.ceil(W / CHUNK), CH = Math.ceil(H / CHUNK);
export const T = {
  GRASS: 0, ROAD: 1, SIDEWALK: 2, PLAZA: 3, WATER: 4, BRIDGE_ROAD: 5, BRIDGE_WALK: 6, RAIL: 7, RAIL_BRIDGE: 8, CROSSING: 9, BUILDING: 10, CONCRETE: 11,
  PARKING: 12, DIRT: 13, BALLAST: 14, PLATFORM: 15, PARK: 16, FIELD1: 17, FIELD2: 18, FIELD3: 19, LAWN: 20, RUNWAY: 21, APRON: 22, SAND: 23, QUAY: 24,
  POOL: 25, MILPAD: 26, BRICK: 27, MALL: 28, DEEP: 29, DIRTROAD: 30,
};
export const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
// rd: 0 нет, 1 верт. левая (юг), 2 верт. правая (север), 3 гор. верхняя (запад), 4 гор. нижняя (восток), 5 перекрёсток
export const LANE_DIR = [-1, 1, 3, 2, 0, -1];
export const WORLD = { x0: OX, z0: OZ, x1: OX + W * TS, z1: OZ + H * TS };
export const colOf = x => Math.floor((x - OX) / TS);
export const rowOf = z => Math.floor((z - OZ) / TS);
export const tileX = c => OX + (c + 0.5) * TS;
export const tileZ = r => OZ + (r + 0.5) * TS;
export const RAIL_R0 = 12 * RAIL_BLOCK_ROW + 9;     // верхний путь (ряд 201); нижний — следующий
export const RIVER_C0 = 12 * 18 + 6, RIVER_C1 = RIVER_C0 + 7;

export const LANDMARKS = [
  { x: 30, z: 30, text: 'ЦЕНТРАЛЬНАЯ ПЛОЩАДЬ', lot: 'plaza' }, { x: 80, z: 20, text: 'ГАРАЖ', lot: 'parking' },
  { x: -20, z: -40, text: 'КАФЕ «ВСТРЕЧА»', lot: 'plaza' }, { x: 50, z: -80, text: 'ПАРК', lot: 'park' },
  { x: 200, z: -100, text: 'ЖИЛОЙ РАЙОН', lot: 'park' }, { x: -100, z: 200, text: 'ПОРТ', lot: 'yard' },
  { x: -150, z: 250, text: 'СКЛАД №3', lot: 'yard' }, { x: -80, z: 180, text: 'ПРОМЗОНА', lot: 'yard' },
  { x: -200, z: 300, text: 'СВАЛКА', lot: 'yard' }, { x: 100, z: 100, text: 'НАБЕРЕЖНАЯ', lot: 'park' },
  { x: 120, z: 0, text: 'МОСТ' }, { x: 10, z: -60, text: 'БАНК' }, { x: -50, z: 107, text: 'ВОКЗАЛ' },
];
// Особые здания: [k, j] -> тип. Если квартал занят целью миссии, особое здание не строится.
const SPECIAL = [
  [13, 13, 'hospital'], [11, 13, 'police'], [12, 8, 'dealer'], [3, 9, 'dealer'], [31, 9, 'dealer'], [5, 8, 'mall'], [2, 12, 'mall'],
  [14, 3, 'bank2'], [21, 12, 'hospital'], [9, 12, 'police'], [24, 9, 'police'],
];

const ROOFS = {
  downtown: ['roof_slate', 'roof_light', 'roof_metal', 'roof_tar'], residential: ['roof_red', 'roof_brown', 'roof_slate', 'roof_green'],
  industrial: ['roof_tar', 'roof_metal', 'roof_light'], shopping: ['roof_light', 'roof_slate', 'roof_metal'], rich: ['roof_red', 'roof_brown', 'roof_slate'],
  suburb: ['roof_red', 'roof_brown', 'roof_slate'], port: ['roof_tar', 'roof_metal'], rural: ['roof_red', 'roof_brown', 'roof_metal'],
};

export function shadowLen(b) {
  const h = Math.min(b.height, 70) * 0.16 + 1;
  return { x: h * 0.8, z: h * 0.6 };
}

export function generateWorld(targets) {
  const R = rng(20261119);
  const N = W * H;
  const type = new Uint8Array(N), rd = new Uint8Array(N), xw = new Uint8Array(N), solid = new Uint8Array(N), walk = new Uint8Array(N);
  const buildings = [], trees = [], decor = [], lamps = [], labels = [], parkedSpots = [], intersections = [], lots = [], doors = [], markings = [];
  const pois = { shops: [], cafes: [], homes: [], works: [], busstops: [], parks: [], pumps: [], tables: [], milSpots: [], planeSpots: [], tankSpots: [], washes: [], garages: [], hospitals: [], police: [], dealers: [], gas: [] };
  const I = (c, r) => r * W + c;
  const inb = (c, r) => c >= 0 && r >= 0 && c < W && r < H;
  const near = (x, z, rad) => targets.some(t => Math.hypot(t.x - x, t.z - z) < rad);
  const setT = (c, r, t) => { if (inb(c, r)) { const i = I(c, r); type[i] = t; solid[i] = (t === T.WATER || t === T.DEEP || t === T.POOL) ? 1 : 0; } };
  const BD = new Array(NK * NJ); for (let j = 0; j < NJ; j++) for (let k = 0; k < NK; k++) BD[k + j * NK] = districtOfBlock(k, j);
  const dOf = (k, j) => (k < 0 || j < 0 || k >= NK || j >= NJ) ? 'rural' : BD[k + j * NK];
  const distAtTile = (c, r) => dOf(Math.max(0, Math.min(NK - 1, blockOf(c))), Math.max(0, Math.min(NJ - 1, blockOf(r))));
  const fill = (c, r, w, h, t) => { for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) setT(cc, rr, t); };

  // ---- Река, залив и набережные ----
  const BAY_C0 = 12 * 14 + 6, BAY_C1 = 12 * 22 + 13, BAY_R0 = 12 * 29 + 6;
  for (let r = 0; r < BAY_R0 - 1; r++) { for (let c = RIVER_C0; c <= RIVER_C1; c++) setT(c, r, T.WATER); setT(RIVER_C0 - 1, r, T.SIDEWALK); setT(RIVER_C1 + 1, r, T.SIDEWALK); }
  for (let r = BAY_R0 - 1; r < H; r++) for (let c = BAY_C0 - 1; c <= BAY_C1 + 1; c++) {
    const rim = r === BAY_R0 - 1 || c === BAY_C0 - 1 || c === BAY_C1 + 1;
    if (rim && !(r === BAY_R0 - 1 && c >= RIVER_C0 && c <= RIVER_C1)) setT(c, r, T.QUAY); else setT(c, r, r === BAY_R0 - 1 ? T.WATER : T.DEEP);
  }

  // ---- Дороги ----
  const roadTile = (c, r, v) => {
    if (!inb(c, r)) return; const i = I(c, r), cur = rd[i];
    if (cur && ((cur <= 2 && v >= 3) || (cur >= 3 && cur <= 4 && v <= 2))) rd[i] = 5; else if (!cur) rd[i] = v;
    type[i] = T.ROAD; solid[i] = 0;
  };
  const COUNTRY_H = [3], COUNTRY_V = [1, 35];
  for (let k = 0; k <= NK; k++) {
    const c = 12 * k + 3; if (c + 1 >= W) break;
    for (let j = 0; j < NJ; j++) {
      const a = dOf(k - 1, j), b = dOf(k, j);
      let road = roadBetween(a, b) || (ARTERIAL.includes(k) && j === RAIL_BLOCK_ROW) || (COUNTRY_V.includes(k) && a !== 'bay' && b !== 'bay');
      if (a === 'river' && b === 'river') road = false;
      if (!road) continue;
      for (let r = 12 * j + 3; r <= 12 * j + 14; r++) { roadTile(c, r, 1); roadTile(c + 1, r, 2); }
    }
  }
  for (let j = 0; j <= NJ; j++) {
    const r = 12 * j + 3; if (r + 1 >= H) break;
    for (let k = 0; k < NK; k++) {
      const a = dOf(k, j - 1), b = dOf(k, j);
      let road = roadBetween(a, b) || COUNTRY_H.includes(j) || (k === 18 && BRIDGES.includes(j));
      if (k === 18 && !BRIDGES.includes(j)) road = false;
      if (a === 'bay' && b === 'bay') road = false;
      if (!road) continue;
      for (let c = 12 * k + 3; c <= 12 * k + 14; c++) { roadTile(c, r, 3); roadTile(c, r + 1, 4); }
    }
  }
  // ---- Тротуары в городских районах ----
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const i = I(c, r); if (type[i] !== T.GRASS) continue;
    if (!URBAN.has(distAtTile(c, r))) continue;
    for (const [dx, dz] of DIRS) { const cc = c + dx, rr = r + dz; if (inb(cc, rr) && rd[I(cc, rr)]) { type[i] = T.SIDEWALK; break; } }
  }
  // ---- Мосты ----
  for (const j of BRIDGES) {
    const r0 = 12 * j + 3;
    for (let c = RIVER_C0; c <= RIVER_C1; c++) { setT(c, r0 - 1, T.BRIDGE_WALK); setT(c, r0, T.BRIDGE_ROAD); setT(c, r0 + 1, T.BRIDGE_ROAD); setT(c, r0 + 2, T.BRIDGE_WALK); }
  }
  // ---- Железная дорога на всю ширину карты ----
  const crossings = [];
  for (let c = 0; c < W; c++) {
    for (const r of [RAIL_R0, RAIL_R0 + 1]) {
      const i = I(c, r);
      if (rd[i]) type[i] = T.CROSSING; else if (c >= RIVER_C0 && c <= RIVER_C1) { type[i] = T.RAIL_BRIDGE; solid[i] = 0; } else type[i] = T.RAIL;
    }
    for (const r of [RAIL_R0 - 1, RAIL_R0 + 2]) { const i = I(c, r); if (!rd[i] && type[i] !== T.WATER) type[i] = T.BALLAST; }
  }
  for (const k of ARTERIAL) crossings.push({ c: 12 * k + 3, x: OX + (12 * k + 5) * TS });
  for (let c = 174; c <= 193; c++) for (const r of [RAIL_R0 - 1, RAIL_R0 + 2]) if (!rd[I(c, r)]) type[I(c, r)] = T.PLATFORM;
  for (let c = 176; c <= 191; c++) for (let r = RAIL_R0 - 3; r <= RAIL_R0 - 2; r++) type[I(c, r)] = T.PLAZA;

  // ---- Пешеходные переходы ----
  for (let r = 1; r < H - 2; r++) for (let c = 1; c < W - 2; c++) {
    if (rd[I(c, r)] !== 5 || rd[I(c - 1, r)] === 5 || rd[I(c, r - 1)] === 5) continue;
    intersections.push({ c, r, x: OX + (c + 1) * TS, z: OZ + (r + 1) * TS });
    const mark = (cc, rr, ok, v) => { if (inb(cc, rr) && ok(rd[I(cc, rr)]) && type[I(cc, rr)] === T.ROAD && URBAN.has(distAtTile(cc, rr))) xw[I(cc, rr)] = v; };
    for (let d = 0; d < 2; d++) {
      mark(c - 1, r + d, v => v === 3 || v === 4, 2); mark(c + 2, r + d, v => v === 3 || v === 4, 2);
      mark(c + d, r - 1, v => v === 1 || v === 2, 1); mark(c + d, r + 2, v => v === 1 || v === 2, 1);
    }
  }

  // ---- Здания и вспомогательные функции ----
  const treeOK = (c, r) => inb(c, r) && !solid[I(c, r)] && [T.GRASS, T.PARK, T.PLAZA, T.LAWN].includes(type[I(c, r)]) && !near(tileX(c), tileZ(r), 9);
  const addTree = (c, r, force) => {
    if (!force && !treeOK(c, r)) return; solid[I(c, r)] = 1;
    trees.push({ x: tileX(c) + (R() - 0.5) * 1.2, z: tileZ(r) + (R() - 0.5) * 1.2, kind: R.pick(['tree_oak', 'tree_oak2', 'tree_birch', 'tree_maple', 'tree_pine']), rot: R() * 6.28, s: 0.85 + R() * 0.4 });
  };
  const addDecor = (name, x, z, rot = 0, s = 1) => { const d = { name, x, z, rot, s }; decor.push(d); return d; };
  const PROPS = { ac: [2.25, 1.9], vent: [1, 1], skylight: [3.1, 2.1], watertank: [3.75, 3.75], solar: [6.2, 3.2], chimney: [2.2, 2.2], stack: [3.5, 3.5], helipad: [12.5, 12.5] };
  const DOOR_OK = [T.SIDEWALK, T.PLAZA, T.CONCRETE, T.PARKING, T.PARK, T.GRASS, T.LAWN, T.BRICK, T.MALL, T.APRON, T.MILPAD, T.DIRT];
  let BID = 1;
  function place(c, r, w, h, roof, height, kind, opts = {}) {
    for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) { if (!inb(cc, rr)) continue; type[I(cc, rr)] = T.BUILDING; solid[I(cc, rr)] = 1; }
    const meta = BKIND[kind] || {};
    const b = { id: BID++, c, r, w, h, x: OX + c * TS, z: OZ + r * TS, wm: w * TS, dm: h * TS, roof, height, kind, props: [], label: opts.label, sprite: opts.sprite, band: opts.sprite ? 0 : (meta.band ?? 1.4), wall: opts.wall || meta.wall, win: meta.win, sign: opts.sign, signColor: opts.signColor || meta.sign, district: opts.district };
    if (!opts.sprite) {
      const names = opts.props || (kind === 'house' ? ['chimney', 'vent'] : kind === 'factory' ? ['vent', 'skylight', 'stack', 'vent'] : kind === 'warehouse' || kind === 'hangar' ? ['solar', 'vent', 'skylight', 'ac'] : ['ac', 'vent', 'skylight', 'ac', 'watertank']);
      const cnt = Math.min(opts.maxProps ?? 6, Math.floor(w * h / 5) + R.int(0, 1));
      if (opts.helipad) b.props.push({ name: 'helipad', x: 0, z: 0 });
      else for (let t = 0; t < cnt * 3 && b.props.length < cnt; t++) {
        const name = R.pick(names), [pw, pd] = PROPS[name];
        const mx = b.wm / 2 - pw / 2 - 1.2, mz = (b.dm - b.band) / 2 - pd / 2 - 1.2; if (mx < 0 || mz < 0) continue;
        const x = (R() * 2 - 1) * mx, z = (R() * 2 - 1) * mz;
        if (b.props.every(p => Math.hypot(p.x - x, p.z - z) > 4.2)) b.props.push({ name, x, z });
      }
    }
    const itype = opts.interior ?? meta.interior;
    if (itype && !opts.sprite && opts.door !== false) {
      const dcx = c + Math.floor(w / 2) + (opts.doorOff || 0), dr = r + h;
      if (inb(dcx, dr) && DOOR_OK.includes(type[I(dcx, dr)]) && !solid[I(dcx, dr)]) {
        b.door = { x: OX + (dcx + 0.5) * TS, z: OZ + (r + h) * TS + 0.6, px: OX + (dcx + 0.5) * TS, pz: OZ + (dr + 0.5) * TS };
        b.interior = { type: itype, name: opts.name || b.label || meta.names?.[0] || kind, seed: b.id, shop: opts.shop };
        doors.push(b);
      }
    }
    buildings.push(b); return b;
  }
  const roofFor = d => R.pick(ROOFS[d] || ROOFS.downtown);
  const shopPick = () => { let s = 0; for (const t of SHOP_TYPES) s += t.w; let r = R() * s; for (const t of SHOP_TYPES) { r -= t.w; if (r <= 0) return t; } return SHOP_TYPES[0]; };
  function shop(c, r, w, h, d, height = 18) {
    const st = shopPick();
    const b = place(c, r, w, h, roofFor(d), height, 'shop', { sign: st.name, signColor: st.sign, name: st.name, interior: 'shop_' + st.id, shop: st.id, district: d });
    if (b.door) pois.shops.push({ x: b.door.px, z: b.door.pz, b }); return b;
  }
  function restaurant(c, r, w, h, d, height = 14) {
    const nm = R.pick(BKIND.restaurant.names);
    const b = place(c, r, w, h, roofFor(d), height, 'restaurant', { sign: nm, name: nm, district: d });
    if (b.door) { pois.cafes.push({ x: b.door.px, z: b.door.pz, b }); for (const ox of [-2.6, 2.6]) { const x = b.door.px + ox, z = b.door.pz + 0.3; addDecor('cafe_table', x, z); pois.tables.push({ x, z }); } }
    return b;
  }
  function special(c, r, w, h, kind, d, height, opts = {}) {
    const meta = BKIND[kind], nm = opts.name || meta.names?.[0] || kind;
    const b = place(c, r, w, h, roofFor(d), height, kind, { sign: nm, name: nm, district: d, ...opts });
    if (b.door) { const q = { x: b.door.px, z: b.door.pz, b }; if (kind === 'hospital') pois.hospitals.push(q); if (kind === 'police') pois.police.push(q); if (kind === 'dealer') pois.dealers.push(q); if (kind === 'garage') pois.garages.push(q); if (kind === 'gas') pois.gas.push(q); }
    return b;
  }
  function makeLot(kind, c0, r0) {
    const bx = OX + c0 * TS, bz = OZ + r0 * TS;
    if (kind === 'plaza') {
      fill(c0, r0, 8, 8, T.PLAZA);
      for (const [dc, dr] of [[0, 0], [7, 0], [0, 7], [7, 7]]) addTree(c0 + dc, r0 + dr);
      addDecor('flowers', bx + 16, bz + 16, 0, 1.4); addDecor('bench', bx + 8, bz + 4); addDecor('bench', bx + 24, bz + 28, Math.PI); addDecor('bench', bx + 4, bz + 22, Math.PI / 2);
      pois.parks.push({ x: bx + 16, z: bz + 16 });
    } else if (kind === 'park') {
      fill(c0, r0, 8, 8, T.PARK); fill(c0 + 3, r0, 2, 8, T.SIDEWALK); fill(c0, r0 + 3, 8, 2, T.SIDEWALK);
      for (let t = 0; t < 14; t++) addTree(c0 + R.int(0, 7), r0 + R.int(0, 7));
      addDecor('bench', bx + 10, bz + 14, Math.PI / 2); addDecor('bench', bx + 22, bz + 18, -Math.PI / 2); addDecor('flowers', bx + 6, bz + 6, 0, 1);
      pois.parks.push({ x: bx + 16, z: bz + 16 });
    } else if (kind === 'parking') {
      fill(c0, r0, 8, 8, T.PARKING);
      for (let i = 0; i < 6; i++) parkedSpots.push({ x: bx + 6 + i * 4.2, z: bz + 6, ang: Math.PI / 2 });
      for (let i = 0; i < 6; i++) if (R.chance(0.6)) parkedSpots.push({ x: bx + 6 + i * 4.2, z: bz + 26, ang: -Math.PI / 2 });
    } else {
      fill(c0, r0, 8, 8, T.CONCRETE);
      for (let t = 0; t < 7; t++) { const x = bx + 3 + R() * 26, z = bz + 3 + R() * 26; if (!near(x, z, 6)) addDecor(R.pick(['barrel', 'crate', 'cone']), x, z, R() * 6, 1); }
    }
  }
  function gasStation(c0, r0, d) {
    fill(c0, r0, 8, 8, T.PARKING);
    special(c0 + 5, r0, 3, 2, 'gas', d, 6, { name: 'АЗС' });
    const bx = OX + c0 * TS, bz = OZ + r0 * TS;
    for (let i = 0; i < 3; i++) { const x = bx + 6 + i * 6, z = bz + 14; addDecor('pump', x, z, 0, 1.2); pois.pumps.push({ x, z }); }
    decor.push({ name: '@canopy', x: bx + 4, z: bz + 11, w: 20, d: 7, color: '#d83a2e' });
    parkedSpots.push({ x: bx + 8, z: bz + 26, ang: 0 });
  }
  function carwash(c0, r0, d) {
    fill(c0, r0, 8, 8, T.CONCRETE);
    const bx = OX + c0 * TS, bz = OZ + r0 * TS;
    place(c0, r0 + 1, 8, 1, 'roof_metal', 5, 'carwash', { sign: 'АВТОМОЙКА', door: false, district: d }); place(c0, r0 + 5, 8, 1, 'roof_metal', 5, 'carwash', { sign: 'АВТОМОЙКА', door: false, district: d });
    decor.push({ name: '@canopy', x: bx + 2, z: bz + 8, w: 28, d: 16, color: '#1e78b4' });
    pois.washes.push({ x: bx + 16, z: bz + 16 });
  }
  const forcedBlock = (bx, bz) => targets.some(t => t.x > bx - 16 && t.x < bx + 48 && t.z > bz - 16 && t.z < bz + 48);
  const lotCars = (bx, bz) => { for (let i = 0; i < 4; i++) parkedSpots.push({ x: bx + 5 + i * 5, z: bz + 26, ang: Math.PI / 2 }); };

  // ---- Генераторы кварталов по районам ----
  function downtownBlock(c0, r0, d, roll) {
    if (roll < 0.26) { const m = R.int(0, 1); fill(c0, r0, 8, 8, T.CONCRETE); const nm = R.pick(BKIND.tower.names); place(c0 + m, r0 + m, 8 - 2 * m, 8 - 2 * m, roofFor(d), R.int(40, 110), 'tower', { helipad: R.chance(0.12) && m === 0, district: d, name: nm, sign: nm }); }
    else if (roll < 0.42) { fill(c0, r0, 8, 8, T.CONCRETE); place(c0, r0, 8, 4, roofFor(d), R.int(25, 60), 'office', { district: d, sign: R.pick(BKIND.office.names) }); place(c0, r0 + 5, 8, 3, roofFor(d), R.int(20, 50), 'office', { district: d, sign: R.pick(BKIND.office.names) }); }
    else if (roll < 0.62) { fill(c0, r0, 8, 8, T.CONCRETE); shop(c0, r0, 3, 3, d); restaurant(c0 + 4, r0, 4, 3, d); shop(c0, r0 + 4, 3, 4, d, 22); place(c0 + 4, r0 + 4, 4, 4, roofFor(d), 30, 'office', { district: d, sign: 'ОФИС' }); }
    else if (roll < 0.72) { fill(c0, r0, 8, 8, T.CONCRETE); place(c0, r0, 8, 3, roofFor(d), 28, 'block', { district: d }); place(c0, r0 + 4, 8, 4, roofFor(d), 32, 'block', { district: d }); }
    else if (roll < 0.8) makeLot('parking', c0, r0); else if (roll < 0.9) makeLot('plaza', c0, r0); else makeLot('park', c0, r0);
  }
  function residentialBlock(c0, r0, d, roll) {
    if (roll < 0.34) { fill(c0, r0, 8, 8, T.PARK); for (const [dc, dr] of [[0, 0], [4, 0], [0, 4], [4, 4]]) place(c0 + dc, r0 + dr, 3 + (R() < 0.3 ? 1 : 0), 3, roofFor(d), 7, 'house', { district: d }); for (let t = 0; t < 6; t++) addTree(c0 + R.int(0, 7), r0 + R.int(0, 7)); }
    else if (roll < 0.62) { fill(c0, r0, 8, 8, T.PARK); place(c0, r0, 8, 3, R.pick(['roof_light', 'roof_slate', 'roof_tar']), R.int(18, 32), 'block', { district: d }); place(c0, r0 + 5, 8, 3, R.pick(['roof_light', 'roof_slate', 'roof_tar']), R.int(18, 32), 'block', { district: d }); for (let t = 0; t < 5; t++) addTree(c0 + R.int(0, 7), r0 + 3 + R.int(0, 1)); }
    else if (roll < 0.72) { fill(c0, r0, 8, 8, T.PARK); place(c0 + 1, r0 + 1, 6, 6, R.pick(['roof_light', 'roof_slate']), R.int(22, 40), 'block', { district: d }); }
    else if (roll < 0.8) { fill(c0, r0, 8, 8, T.CONCRETE); shop(c0, r0, 4, 3, d, 10); restaurant(c0 + 4, r0, 4, 3, d, 10); place(c0, r0 + 4, 8, 4, roofFor(d), 24, 'block', { district: d }); }
    else if (roll < 0.9) makeLot('park', c0, r0); else if (roll < 0.96) makeLot('parking', c0, r0); else makeLot('plaza', c0, r0);
  }
  function industrialBlock(c0, r0, d, roll) {
    const bx = OX + c0 * TS, bz = OZ + r0 * TS;
    if (roll < 0.28) { fill(c0, r0, 8, 8, T.CONCRETE); const north = R.chance(0.5); place(c0, north ? r0 : r0 + 3, 8, 5, roofFor(d), 12, 'warehouse', { district: d }); addDecor('crate', bx + 6, bz + (north ? 26 : 6), 0, 1); parkedSpots.push({ x: bx + 22, z: bz + (north ? 27 : 5), ang: 0 }); }
    else if (roll < 0.5) { fill(c0, r0, 8, 8, T.CONCRETE); place(c0, r0, 6, 5, roofFor(d), 16, 'factory', { district: d }); place(c0 + 5, r0 + 5, 3, 3, 'roof_metal', 14, 'silo', { sprite: 'silo' }); }
    else if (roll < 0.68) { fill(c0, r0, 8, 8, T.CONCRETE); const cols = ['container_red', 'container_blue', 'container_green', 'container_orange', 'container_gray', 'container_yellow']; for (const rr of [1, 3, 5, 7]) for (const cc of [0, 3, 6]) if (R.chance(0.85)) place(c0 + cc, r0 + rr, 2, 1, 'roof_metal', 3, 'container', { sprite: R.pick(cols) }); }
    else if (roll < 0.75) { fill(c0, r0, 8, 8, T.CONCRETE); place(c0, r0, 3, 3, 'roof_metal', 14, 'silo', { sprite: 'silo' }); place(c0 + 5, r0 + 5, 3, 3, 'roof_metal', 14, 'silo', { sprite: 'silo' }); }
    else if (roll < 0.82) gasStation(c0, r0, d);
    else if (roll < 0.87) carwash(c0, r0, d);
    else if (roll < 0.93) makeLot('yard', c0, r0);
    else { fill(c0, r0, 8, 8, T.CONCRETE); place(c0, r0, 8, 8, 'roof_tar', 20, 'factory', { props: ['stack', 'vent', 'skylight'], maxProps: 5, district: d }); }
  }
  function shoppingBlock(c0, r0, d, roll) {
    const bx = OX + c0 * TS, bz = OZ + r0 * TS;
    if (roll < 0.22) { fill(c0, r0, 8, 8, T.PARKING); special(c0, r0, 8, 5, 'mall', d, 16, { name: 'ТОРГОВЫЙ ЦЕНТР', sign: 'ТОРГОВЫЙ ЦЕНТР' }); for (let i = 0; i < 6; i++) if (R.chance(0.7)) parkedSpots.push({ x: bx + 6 + i * 4.6, z: bz + 26.5, ang: Math.PI / 2 }); }
    else if (roll < 0.5) { fill(c0, r0, 8, 8, T.MALL); shop(c0, r0, 3, 3, d, 10); shop(c0 + 3, r0, 3, 3, d, 10); restaurant(c0 + 6, r0, 2, 3, d, 10); shop(c0, r0 + 5, 3, 3, d, 10); shop(c0 + 3, r0 + 5, 3, 3, d, 10); restaurant(c0 + 6, r0 + 5, 2, 3, d, 10); }
    else if (roll < 0.62) { fill(c0, r0, 8, 8, T.BRICK); restaurant(c0, r0, 4, 3, d, 10); restaurant(c0 + 4, r0, 4, 3, d, 10); addDecor('fountain', bx + 16, bz + 20, 0, 0.7); for (const [dc, dr] of [[0, 7], [7, 7]]) addTree(c0 + dc, r0 + dr); }
    else if (roll < 0.72) gasStation(c0, r0, d);
    else if (roll < 0.78) carwash(c0, r0, d);
    else if (roll < 0.9) { fill(c0, r0, 8, 8, T.CONCRETE); special(c0, r0, 5, 4, 'dealer', d, 8, { name: 'АВТОСАЛОН' }); lotCars(bx, bz); }
    else if (roll < 0.95) makeLot('parking', c0, r0); else makeLot('plaza', c0, r0);
  }
  function suburbBlock(c0, r0, d, roll) {
    if (roll < 0.62) { fill(c0, r0, 8, 8, T.LAWN); for (const [dc, dr] of [[0, 0], [4, 0], [0, 4], [4, 4]]) { place(c0 + dc, r0 + dr, 3, 3, roofFor(d), 6, 'house', { district: d }); } for (let t = 0; t < 7; t++) addTree(c0 + R.int(0, 7), r0 + R.int(0, 7)); }
    else if (roll < 0.76) { fill(c0, r0, 8, 8, T.LAWN); place(c0, r0, 8, 3, roofFor(d), 10, 'block', { district: d }); place(c0, r0 + 5, 8, 3, roofFor(d), 10, 'block', { district: d }); }
    else if (roll < 0.84) gasStation(c0, r0, d); else if (roll < 0.9) makeLot('park', c0, r0); else if (roll < 0.95) { fill(c0, r0, 8, 8, T.CONCRETE); shop(c0, r0, 4, 3, d, 8); restaurant(c0 + 4, r0, 4, 3, d, 8); } else makeLot('parking', c0, r0);
  }
  function richBlock(c0, r0, d, roll) {
    const bx = OX + c0 * TS, bz = OZ + r0 * TS;
    if (roll < 0.72) {
      fill(c0, r0, 8, 8, T.LAWN); place(c0 + 1, r0, 6, 4, R.pick(['roof_red', 'roof_slate', 'roof_brown']), 12, 'mansion', { district: d, maxProps: 2, props: ['chimney', 'vent'] });
      fill(c0 + 1, r0 + 5, 3, 2, T.POOL); addDecor('lounger', bx + 24, bz + 21, 0, 1); addDecor('lounger', bx + 24, bz + 24, 0, 1);
      for (let t = 0; t < 9; t++) addTree(c0 + R.int(0, 7), r0 + 4 + R.int(0, 3));
      for (let x = 0; x < 32; x += 4) addDecor('fence', bx + x + 2, bz + 31.5, 0, 1);
    } else if (roll < 0.86) { fill(c0, r0, 8, 8, T.LAWN); place(c0, r0, 4, 4, roofFor(d), 9, 'mansion', { district: d, maxProps: 1, props: ['chimney'] }); place(c0 + 4, r0 + 4, 4, 4, roofFor(d), 9, 'mansion', { district: d, maxProps: 1, props: ['chimney'] }); for (let t = 0; t < 8; t++) addTree(c0 + R.int(0, 7), r0 + R.int(0, 7)); }
    else makeLot('park', c0, r0);
  }
  function portBlock(c0, r0, d, roll) {
    const bx = OX + c0 * TS, bz = OZ + r0 * TS;
    if (roll < 0.5) { fill(c0, r0, 8, 8, T.CONCRETE); const cols = ['container_red', 'container_blue', 'container_green', 'container_orange', 'container_gray', 'container_yellow']; for (const rr of [0, 2, 4, 6]) for (const cc of [0, 3, 6]) if (R.chance(0.9)) place(c0 + cc, r0 + rr, 2, 1, 'roof_metal', 3, 'container', { sprite: R.pick(cols) }); }
    else if (roll < 0.75) { fill(c0, r0, 8, 8, T.CONCRETE); place(c0, r0, 8, 5, roofFor(d), 14, 'warehouse', { district: d }); parkedSpots.push({ x: bx + 22, z: bz + 27, ang: 0 }); }
    else if (roll < 0.88) { fill(c0, r0, 8, 8, T.CONCRETE); place(c0, r0, 6, 5, roofFor(d), 16, 'factory', { district: d }); place(c0 + 5, r0 + 5, 3, 3, 'roof_metal', 14, 'silo', { sprite: 'silo' }); }
    else makeLot('yard', c0, r0);
  }
  function ruralBlock(k, j, c0, r0) {
    const h = hash2(k, j), bx = OX + c0 * TS, bz = OZ + r0 * TS;
    const fieldT = [T.FIELD1, T.FIELD2, T.FIELD3][Math.floor(hash2(j, k + 9) * 3)];
    if (h < 0.34) { fill(c0 - 1, r0 - 1, 10, 10, fieldT); for (let i = 0; i < 3; i++) addDecor('hay', bx + 6 + R() * 20, bz + 6 + R() * 20, R() * 3, 1); }
    else if (h < 0.6) {
      fill(c0, r0, 8, 8, T.DIRT);
      place(c0 + 4, r0, 4, 3, 'roof_brown', 9, 'barn', { door: false, district: 'rural' }); place(c0, r0 + 2, 3, 3, 'roof_red', 6, 'farmhouse', { district: 'rural' }); place(c0 + 6, r0 + 5, 2, 2, 'roof_metal', 12, 'silo', { sprite: 'silo' });
      addDecor('windmill', bx + 24, bz + 28, 0, 0.8);
    } else if (h < 0.85) { for (let t = 0; t < 30; t++) addTree(c0 - 1 + R.int(0, 9), r0 - 1 + R.int(0, 9)); }
    else { for (let t = 0; t < 4; t++) addTree(c0 + R.int(0, 7), r0 + R.int(0, 7)); addDecor('hay', bx + 10, bz + 10, 0.4, 1); }
  }
  const specialAt = {};
  for (const [k, j, kind] of SPECIAL) specialAt[k + ',' + j] = kind;
  const builtSpecial = [];
  function buildSpecial(kind, c0, r0, d) {
    const bx = OX + c0 * TS, bz = OZ + r0 * TS;
    if (kind === 'hospital') { fill(c0, r0, 8, 8, T.CONCRETE); special(c0, r0, 7, 5, 'hospital', d, 24, { name: 'БОЛЬНИЦА', props: ['ac', 'vent'], maxProps: 3 }); addDecor('helipad', bx + 28, bz + 28, 0, 0.7); parkedSpots.push({ x: bx + 8, z: bz + 26.5, ang: 0 }); }
    else if (kind === 'police') { fill(c0, r0, 8, 8, T.CONCRETE); special(c0, r0, 7, 4, 'police', d, 14, { name: 'ПОЛИЦИЯ' }); parkedSpots.push({ x: bx + 8, z: bz + 22, ang: 0 }, { x: bx + 16, z: bz + 22, ang: 0 }); }
    else if (kind === 'dealer') { fill(c0, r0, 8, 8, T.CONCRETE); special(c0, r0, 6, 4, 'dealer', d, 8, { name: 'АВТОСАЛОН' }); lotCars(bx, bz); }
    else if (kind === 'mall') { fill(c0, r0, 8, 8, T.PARKING); special(c0, r0, 8, 5, 'mall', d, 16, { name: 'ТОРГОВЫЙ ЦЕНТР', sign: 'ТОРГОВЫЙ ЦЕНТР' }); for (let i = 0; i < 6; i++) if (R.chance(0.7)) parkedSpots.push({ x: bx + 6 + i * 4.6, z: bz + 26.5, ang: Math.PI / 2 }); }
    else if (kind === 'bank2') { fill(c0, r0, 8, 8, T.PLAZA); special(c0, r0, 8, 5, 'bank', d, 36, { name: 'БАНК', sign: 'БАНК' }); }
    builtSpecial.push(kind);
  }

  for (let j = 0; j < NJ; j++) for (let k = 0; k < NK; k++) {
    const d = dOf(k, j), c0 = 12 * k + 6, r0 = 12 * j + 6;
    if (!URBAN.has(d) && d !== 'rural') continue;
    if (c0 + 8 > W || r0 + 8 > H || CLOSED.has(d)) continue;
    const bx = OX + c0 * TS, bz = OZ + r0 * TS;
    if (d === 'rural') { ruralBlock(k, j, c0, r0); continue; }
    if (bx < 10 && bx + 32 > 10 && bz < -60 && bz + 32 > -60) {  // банк у старта
      fill(c0, r0, 8, 8, T.PLAZA); special(c0, r0, 8, 5, 'bank', d, 36, { name: 'БАНК', sign: 'БАНК' });
      addDecor('flowers', bx + 8, bz + 26, 0, 1); addDecor('flowers', bx + 24, bz + 26, 0, 1); addDecor('bench', bx + 16, bz + 29, Math.PI / 2); builtSpecial.push('bank'); continue;
    }
    if (forcedBlock(bx, bz)) {
      const lm = LANDMARKS.find(l => l.lot && l.x > bx - 16 && l.x < bx + 48 && l.z > bz - 16 && l.z < bz + 48);
      const kind = lm ? lm.lot : (d === 'downtown' ? 'plaza' : d === 'residential' ? 'park' : 'yard');
      makeLot(kind, c0, r0); lots.push({ x: bx + 16, z: bz + 16, kind });
      if (lm?.text === 'ГАРАЖ') { const g = special(c0, r0, 3, 2, 'garage', d, 6, { name: 'ГАРАЖ', sign: 'ГАРАЖ' }); pois.garages.push({ x: bx + 6, z: bz + 12, home: true, b: g }); builtSpecial.push('garage_home'); }
      continue;
    }
    const sp = specialAt[k + ',' + j];
    if (sp) { buildSpecial(sp, c0, r0, d); continue; }
    const roll = R();
    if (d === 'downtown') downtownBlock(c0, r0, d, roll); else if (d === 'residential') residentialBlock(c0, r0, d, roll); else if (d === 'industrial') industrialBlock(c0, r0, d, roll);
    else if (d === 'shopping') shoppingBlock(c0, r0, d, roll); else if (d === 'suburb') suburbBlock(c0, r0, d, roll); else if (d === 'rich') richBlock(c0, r0, d, roll); else if (d === 'port') portBlock(c0, r0, d, roll);
  }
  place(176, RAIL_R0 - 3, 16, 2, 'roof_light', 10, 'station', { label: 'ВОКЗАЛ', props: ['ac', 'vent'], maxProps: 4, sign: 'ВОКЗАЛ' });

  // ---- Аэропорт ----
  { const c0 = 12 * 28 + 5, r0 = 12 * 17 + 5, c1 = 12 * 35 + 14, r1 = 12 * 25 + 14;
    fill(c0, r0, c1 - c0 + 1, r1 - r0 + 1, T.APRON);
    const rr0 = 12 * 22;
    for (let r = rr0; r <= rr0 + 7; r++) for (let c = c0 + 3; c <= c1 - 1; c++) setT(c, r, T.RUNWAY);
    for (let r = rr0 - 8; r <= rr0 - 7; r++) for (let c = c0 + 3; c <= c1 - 1; c++) setT(c, r, T.RUNWAY);
    markings.push({ kind: 'runway', x: OX + (c0 + 3) * TS, z: OZ + rr0 * TS, w: (c1 - c0 - 3) * TS, d: 8 * TS });
    const T0 = place(c0 + 4, r0 + 6, 20, 8, 'roof_light', 18, 'terminal', { door: false, sign: 'АЭРОПОРТ', district: 'airport' });
    T0.door = { x: OX + (c0 + 14.5) * TS, z: OZ + (r0 + 14) * TS + 0.6, px: OX + (c0 + 14.5) * TS, pz: OZ + (r0 + 14.5) * TS }; T0.interior = { type: 'office', name: 'АЭРОПОРТ', seed: T0.id }; doors.push(T0);
    for (let i = 0; i < 3; i++) place(c0 + 30 + i * 18, r0 + 6, 14, 8, 'roof_metal', 14, 'hangar', { district: 'airport', door: false });
    place(c0 + 4, r0 + 18, 4, 4, 'roof_light', 24, 'office', { district: 'airport', door: false, sign: 'ДИСПЕТЧЕРСКАЯ' }); addDecor('radar', OX + (c0 + 6) * TS, OZ + (r0 + 26) * TS, 0, 0.6);
    for (let i = 0; i < 3; i++) place(c0 + 14 + i * 14, r0 + 20, 7, 6, 'roof_metal', 6, 'plane', { sprite: 'plane_jet', door: false, district: 'airport' });
    addDecor('plane_small', OX + (c0 + 70) * TS, OZ + (r0 + 24) * TS, 0, 1); addDecor('plane_small', OX + (c0 + 80) * TS, OZ + (r0 + 26) * TS, 0.2, 1); addDecor('heli', OX + (c0 + 20) * TS, OZ + (r0 + 36) * TS, 0, 0.7);
    for (let x = 0; x < (c1 - c0) * TS; x += 4) { addDecor('fence', OX + c0 * TS + x + 2, OZ + (r1 + 0.5) * TS, 0, 1); addDecor('fence', OX + c0 * TS + x + 2, OZ + (r0 - 0.4) * TS, 0, 1); }
    pois.planeSpots.push({ x: OX + (c0 + 22) * TS, z: OZ + (rr0 + 4) * TS });
  }
  // ---- Военная территория ----
  { const c0 = 12 * 23 + 5, r0 = 12 * 26 + 5, c1 = 12 * 31 + 14, r1 = 12 * 33 + 14;
    fill(c0, r0, c1 - c0 + 1, r1 - r0 + 1, T.MILPAD);
    for (let r = r0 + 40; r <= r0 + 41; r++) for (let c = c0; c <= c1; c++) setT(c, r, T.CONCRETE);
    for (let c = c0 + 40; c <= c0 + 41; c++) for (let r = r0; r <= r1; r++) setT(c, r, T.CONCRETE);
    for (let i = 0; i < 4; i++) place(c0 + 4 + i * 8, r0 + 4, 6, 3, 'roof_green', 5, 'barracks', { district: 'military', door: false });
    place(c0 + 4, r0 + 12, 8, 5, 'roof_metal', 8, 'hangar', { district: 'military', door: false }); place(c0 + 14, r0 + 12, 8, 5, 'roof_metal', 8, 'hangar', { district: 'military', door: false });
    place(c0 + 48, r0 + 6, 8, 6, 'roof_slate', 20, 'office', { district: 'military', door: false, sign: 'ШТАБ' });
    addDecor('radar', OX + (c0 + 70) * TS, OZ + (r0 + 10) * TS, 0, 1);
    for (let i = 0; i < 6; i++) addDecor('tent', OX + (c0 + 50 + (i % 3) * 6) * TS, OZ + (r0 + 20 + Math.floor(i / 3) * 5) * TS, 0, 1);
    addDecor('helipad', OX + (c0 + 60) * TS, OZ + (r0 + 55) * TS, 0, 1); addDecor('heli', OX + (c0 + 60) * TS, OZ + (r0 + 55) * TS, 0, 0.8);
    for (let x = 0; x <= (c1 - c0) * TS; x += 4) { addDecor('fence', OX + c0 * TS + x + 2, OZ + (r1 + 0.6) * TS, 0, 1); addDecor('fence', OX + c0 * TS + x + 2, OZ + (r0 - 0.5) * TS, 0, 1); }
    for (let z = 0; z <= (r1 - r0) * TS; z += 4) { addDecor('fence_v', OX + (c1 + 0.8) * TS, OZ + r0 * TS + z + 2, 0, 1); if (z < 50 || z > 78) addDecor('fence_v', OX + (c0 - 0.5) * TS, OZ + r0 * TS + z + 2, 0, 1); }
    for (let i = 0; i < 4; i++) addDecor('sandbags', OX + (c0 - 1) * TS + 3, OZ + (r0 + 12 + i * 2) * TS, 1.57, 1);
    addDecor('barrier', OX + (c0 - 0.5) * TS, OZ + (r0 + 14) * TS, 1.57, 1);
    pois.tankSpots.push({ x: OX + (c0 + 20) * TS, z: OZ + (r0 + 30) * TS }, { x: OX + (c0 + 26) * TS, z: OZ + (r0 + 30) * TS }, { x: OX + (c0 + 32) * TS, z: OZ + (r0 + 30) * TS });
    for (let i = 0; i < 6; i++) pois.milSpots.push({ x: OX + (c0 + 8 + i * 6) * TS, z: OZ + (r0 + 26) * TS, ang: 1.57 });
    pois.milGate = { x: OX + (c0 - 6) * TS, z: OZ + (r0 + 14) * TS };
  }
  // ---- Порт: краны и корабли у причала ----
  for (let c = BAY_C0 + 6; c < BAY_C1 - 12; c += 22) addDecor('crane', OX + c * TS, OZ + (BAY_R0 + 0.5) * TS, 1.57, 1.1);
  decor.push({ name: 'ship_cargo', x: OX + (BAY_C0 + 30) * TS, z: OZ + (BAY_R0 + 4) * TS, rot: 0, s: 1 }, { name: 'ship_cargo', x: OX + (BAY_C0 + 80) * TS, z: OZ + (BAY_R0 + 9) * TS, rot: 0, s: 1 }, { name: 'ship_small', x: OX + (BAY_C0 + 55) * TS, z: OZ + (BAY_R0 + 30) * TS, rot: 0.1, s: 1 });

  // ---- Деревья вне кварталов ----
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const i = I(c, r); if (type[i] !== T.GRASS || solid[i]) continue;
    const dk = distAtTile(c, r);
    const border = r < 2 || r > H - 4 || c < 2 || c > W - 6;
    const p = border ? 0.35 : dk === 'rural' ? 0.025 : dk === 'yard' ? 0.1 : 0.03;
    if (hash2(c, r) < p) addTree(c, r);
  }
  // ---- Проходимость ----
  const WALKABLE = new Set([T.SIDEWALK, T.PLAZA, T.BRIDGE_WALK, T.PARK, T.GRASS, T.CONCRETE, T.PARKING, T.DIRT, T.PLATFORM, T.FIELD1, T.FIELD2, T.FIELD3, T.LAWN, T.APRON, T.SAND, T.QUAY, T.MILPAD, T.BRICK, T.MALL, T.DIRTROAD, T.RUNWAY]);
  for (let i = 0; i < N; i++) { walk[i] = (WALKABLE.has(type[i]) && !solid[i]) || xw[i] ? 1 : 0; if (type[i] === T.BUILDING) { solid[i] = 1; walk[i] = 0; } }
  // ---- Декор вдоль улиц ----
  for (let r = 1; r < H - 1; r++) for (let c = 1; c < W - 1; c++) {
    const i = I(c, r); if (type[i] !== T.SIDEWALK) continue;
    let dx = 0, dz = 0;
    for (const [ax, az] of DIRS) if (rd[I(c + ax, r + az)] && type[I(c + ax, r + az)] === T.ROAD) { dx = ax; dz = az; break; }
    if (!dx && !dz) continue;
    const h = hash2(c * 3 + 1, r * 7 + 5);
    const x = tileX(c) + dx * 1.4, z = tileZ(r) + dz * 1.4;
    if (h < 0.07) { const lp = { x, z }; lamps.push(lp); addDecor('lamp', x, z).lampRef = lp; }
    else if (h < 0.088) addDecor('hydrant', x, z);
    else if (h < 0.106) addDecor('bin', tileX(c) - dx * 1.2, tileZ(r) - dz * 1.2);
    else if (h < 0.112 && ['downtown', 'shopping', 'residential'].includes(distAtTile(c, r)) && !xw[i] && walk[I(c - dz, r + dx)] && walk[I(c + dz, r - dx)]) { addDecor('busstop', tileX(c) + dx * 0.9, tileZ(r) + dz * 0.9, dx ? Math.PI / 2 : 0, 1); pois.busstops.push({ x: tileX(c), z: tileZ(r) }); }
  }
  for (let t = 0; t < 400; t++) { const c = R.int(5, W - 6), r = R.int(5, H - 6), i = I(c, r); if (type[i] === T.ROAD && rd[i] >= 1 && rd[i] <= 4) addDecor('manhole', tileX(c) + (R() - 0.5), tileZ(r) + (R() - 0.5)); }
  for (const b of doors) {
    if (['house', 'block', 'mansion', 'farmhouse'].includes(b.kind)) pois.homes.push({ x: b.door.px, z: b.door.pz, b });
    if (['office', 'tower', 'bank', 'mall', 'terminal'].includes(b.kind)) pois.works.push({ x: b.door.px, z: b.door.pz, b });
  }

  // ---- Метки и индекс по чанкам ----
  for (const l of LANDMARKS) labels.push({ x: l.x, z: l.z - 2, text: l.text });
  const chunks = Array.from({ length: CW * CH }, () => ({ b: [], d: [], t: [] }));
  const cidx = (x, z) => ({ c: Math.floor((x - OX) / TS / CHUNK), r: Math.floor((z - OZ) / TS / CHUNK) });
  const put = (list, x0, z0, x1, z1, obj) => {
    const a = cidx(x0, z0), b = cidx(x1, z1);
    for (let r = Math.max(0, a.r); r <= Math.min(CH - 1, b.r); r++) for (let c = Math.max(0, a.c); c <= Math.min(CW - 1, b.c); c++) chunks[r * CW + c][list].push(obj);
  };
  for (const b of buildings) { const sh = shadowLen(b); put('b', b.x - 1, b.z - 1, b.x + b.wm + sh.x + 1, b.z + b.dm + sh.z + 1, b); }
  for (const d of decor) { const hw = d.name === 'ship_cargo' ? 34 : 10; put('d', d.x - hw, d.z - hw, d.x + hw + (d.w || 0), d.z + hw + (d.d || 0), d); }
  for (const m of markings) { const o = { name: '@' + m.kind, ...m }; put('d', m.x, m.z, m.x + m.w, m.z + m.d, o); }
  for (const t of trees) put('t', t.x - 6, t.z - 6, t.x + 6, t.z + 6, t);

  const districtRects = {};
  for (let j = 0; j < NJ; j++) for (let k = 0; k < NK; k++) { const d = dOf(k, j); (districtRects[d] ||= []).push({ x: OX + (12 * k + 3) * TS, z: OZ + (12 * j + 3) * TS, w: 12 * TS, d: 12 * TS }); }

  const world = {
    W, H, NK, NJ, type, rd, xw, solid, walk, buildings, trees, decor, lamps, labels, parkedSpots, intersections, lots, chunks, doors, pois, crossings, markings, districtRects, BD, builtSpecial,
    idx: (c, r) => r * W + c,
    inb,
    tileAt: (x, z) => { const c = colOf(x), r = rowOf(z); return inb(c, r) ? r * W + c : -1; },
    typeAt(x, z) { const i = this.tileAt(x, z); return i < 0 ? T.WATER : type[i]; },
    solidAt(x, z) { const i = this.tileAt(x, z); return i < 0 || solid[i] === 1; },
    walkAt(x, z) { const i = this.tileAt(x, z); return i >= 0 && walk[i] === 1; },
    roadAt(x, z) { const i = this.tileAt(x, z); return i < 0 ? 0 : rd[i]; },
    districtAt(x, z) { return distAtTile(colOf(x), rowOf(z)); },
    nearestWalk(x, z, maxR = 12) {
      const c0 = colOf(x), r0 = rowOf(z);
      for (let rad = 0; rad <= maxR; rad++) for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== rad) continue;
        const c = c0 + dc, r = r0 + dr; if (inb(c, r) && walk[I(c, r)] && !xw[I(c, r)]) return { x: tileX(c), z: tileZ(r) };
      }
      return { x, z };
    },
  };
  return world;
}
