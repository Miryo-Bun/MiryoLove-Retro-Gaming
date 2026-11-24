// HUD (DOM) и мини-карта (холст). Мини-карта: север сверху, окно вокруг игрока, радиус переключается клавишей N.
import { G, state } from '../state.js';
import { WEAPONS, CAR_BY_ID } from '../data.js';
import { DISTRICTS } from '../world/layout.js';
import { A } from '../engine/assets.js';
import { T, W, H, OX, OZ, TS } from '../world/map.js';
import { missionTarget } from '../render.js';

export const $ = id => document.getElementById(id);
let msgT = 0, bitmap = null;
const MINI_PX = 3;   // пикселей на тайл в битмапе
let miniR = 120;

export function msg(text, sec = 3) {
  const e = $('hud-msg'); e.textContent = text; e.classList.remove('hidden'); msgT = sec;
}
G.msg = msg;
export function setHUD(on) { $('hud').classList.toggle('hidden', !on); }
export function toggleMiniZoom() { miniR = miniR === 120 ? 300 : 120; }

export function updateWeaponHUD() {
  const id = state.ownedWeapons[state.weaponIndex] || 'fists', w = WEAPONS.find(x => x.id === id);
  const txt = w.name + ' [' + (w.ammo == null ? '∞' : (state.ammo[id] ?? 0)) + ']  ' + (state.ownedWeapons.length > 1 ? 'Q/R смена' : '');
  const el = $('hud-weapon');
  if (el.dataset.txt !== txt) { el.dataset.txt = txt; el.innerHTML = `<img src="assets/ui/w_${id}.png" alt="" style="height:28px;vertical-align:middle;margin-right:8px;image-rendering:pixelated"><span></span>`; el.lastChild.textContent = txt; }
}
G.updateWeaponHUD = updateWeaponHUD;

export function districtName(x, z) {
  return DISTRICTS[G.world.districtAt(x, z)]?.name || 'Окраина';
}

export function updateHUD(dt, nearVehicle, extraHint = null) {
  const p = G.player;
  if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('hud-msg').classList.add('hidden'); }
  $('hud-money').textContent = Math.floor(state.money);
  $('minimap').style.display = G.interior ? 'none' : '';
  $('hud-hp').style.width = Math.max(0, state.health / state.maxHealth * 100) + '%';
  const stars = $('hud-stars'); const n = state.wanted;
  const blink = n > 0 && Math.floor(performance.now() / 350) % 2 === 0;
  stars.innerHTML = Array.from({ length: 6 }, (_, i) => `<span class="${i < n ? 'on' + (blink ? ' blink' : '') : ''}">★</span>`).join('');
  $('hud-district').textContent = districtName(p.x, p.z);
  const mm = state.missionMgr?.current;
  if (mm) {
    $('hud-mission').classList.remove('hidden'); $('mission-title').textContent = 'МИССИЯ ' + mm.id + ': ' + mm.name;
    let obj = mm.desc;
    if (mm.type === 'race') obj = 'Контрольная точка ' + (state.missionMgr.stage + 1) + ' / ' + mm.targets.length;
    else if (mm.type === 'wanted') obj = state.missionMgr.stage === 0 ? 'Набери розыск ★' + (mm.minWanted || 2) + ' (текущий: ' + state.wanted + ')' : 'Уйди от полиции: сбрось розыск до нуля';
    else if (mm.type === 'deliver_car') obj = mm.desc + (p.inVehicle ? '' : ' (нужна машина!)');
    const t = missionTarget(); if (t) obj += '  · ' + Math.round(Math.hypot(t.x - p.x, t.z - p.z)) + ' м';
    $('mission-obj').textContent = obj;
  } else $('hud-mission').classList.add('hidden');
  const hint = $('hud-hint');
  let h = '';
  if (G.interior) h = G.interior.hint || '';
  else if (extraHint) h = extraHint;
  else if (p.dead) h = '';
  else if (p.inVehicle) h = 'E — выйти · W/S газ/тормоз · A/D руль · ПРОБЕЛ — ручник';
  else if (nearVehicle) h = 'E — сесть: ' + nearVehicle.stats.name;
  else if (state.playTime < 25) h = 'WASD — ходьба · SHIFT — бег · ПРОБЕЛ/ЛКМ — удар/выстрел · колесо — масштаб';
  if (p.inHelicopter) h = 'W/S — газ/тормоз · A/D — бок · Q/R — поворот · SHIFT/X — высота · E — высадка';
  if (h) { hint.textContent = h; hint.classList.remove('hidden'); } else hint.classList.add('hidden');
  const hh = Math.floor(state.dayTime), mm2 = Math.floor((state.dayTime % 1) * 60);
  $('hud-clock').textContent = String(hh).padStart(2, '0') + ':' + String(mm2).padStart(2, '0') + ' · ' + (state.weather?.name || 'Солнечно');
  const v = p.inVehicle, helicopter = p.inHelicopter, vb = $('hud-veh');
  if (helicopter && !G.interior) { vb.classList.remove('hidden'); $('veh-name').textContent = helicopter.stats.name + '  ' + Math.round(helicopter.speed * 3.6) + ' км/ч · высота ' + Math.round(helicopter.altitude) + ' м'; $('veh-hp').style.width = Math.max(0, helicopter.hp / helicopter.maxHp * 100) + '%'; $('veh-fuel').style.width = Math.max(0, helicopter.fuel / helicopter.fuelCap * 100) + '%'; }
  else if (v && !G.interior) { vb.classList.remove('hidden'); $('veh-name').textContent = v.stats.name + '  ' + Math.round(Math.abs(v.speed) * 3.6) + ' км/ч'; $('veh-hp').style.width = Math.max(0, v.hp / v.maxHp * 100) + '%'; $('veh-hp').style.background = v.hp / v.maxHp > 0.5 ? '#4c4' : v.hp / v.maxHp > 0.25 ? '#ec3' : '#e33'; $('veh-fuel').style.width = Math.max(0, v.fuel / v.fuelCap * 100) + '%'; } else vb.classList.add('hidden');
  const inv = state.inventory || {}; $('hud-inv').textContent = 'Аптечки: ' + ((inv.medkit || 0) + (inv.bandage || 0)) + (state.armor > 0 ? '  ·  Броня: ' + Math.round(state.armor) : '') + (state.outfit ? '  ·  образ' : '');
  if (!G.interior) drawMinimap();
}

export function buildMinimap(world) {
  const c = document.createElement('canvas'); c.width = W * MINI_PX; c.height = H * MINI_PX;
  const g = c.getContext('2d'), col = {
    [T.GRASS]: '#3f7b3a', [T.PARK]: '#357436', [T.ROAD]: '#3a3c43', [T.SIDEWALK]: '#8e8d85', [T.PLAZA]: '#c0b48f', [T.WATER]: '#2b5f90', [T.BRIDGE_ROAD]: '#45474f',
    [T.BRIDGE_WALK]: '#8e8d85', [T.RAIL]: '#6d5e4b', [T.RAIL_BRIDGE]: '#4d545c', [T.CROSSING]: '#5a5a58', [T.BUILDING]: '#7a7f8c', [T.CONCRETE]: '#7f7f7a',
    [T.PARKING]: '#585a60', [T.DIRT]: '#7a5c3a', [T.BALLAST]: '#7d7467', [T.PLATFORM]: '#b0aca0',
    [T.FIELD1]: '#6a9a48', [T.FIELD2]: '#c8a850', [T.FIELD3]: '#7a5a3a', [T.LAWN]: '#5ea044', [T.RUNWAY]: '#35373b', [T.APRON]: '#a0a098', [T.SAND]: '#c8b27c', [T.QUAY]: '#7a8086',
    [T.POOL]: '#4aa0cc', [T.MILPAD]: '#5c6450', [T.BRICK]: '#96543e', [T.MALL]: '#d0ccc0', [T.DEEP]: '#1b4a7a', [T.DIRTROAD]: '#8c7050',
  };
  for (let r = 0; r < H; r++) for (let cc = 0; cc < W; cc++) { g.fillStyle = col[world.type[r * W + cc]] || '#000'; g.fillRect(cc * MINI_PX, r * MINI_PX, MINI_PX, MINI_PX); }
  const avg = {}; const tmp = document.createElement('canvas'); tmp.width = tmp.height = 1; const tg = tmp.getContext('2d');
  for (const [n, cv] of Object.entries(A.roofPat)) { tg.clearRect(0, 0, 1, 1); tg.drawImage(cv, 0, 0, 1, 1); const d = tg.getImageData(0, 0, 1, 1).data; avg[n] = `rgb(${d[0]},${d[1]},${d[2]})`; }
  const sc = MINI_PX / TS;
  for (const b of world.buildings) { g.fillStyle = b.sprite ? '#6b7078' : (avg[b.roof] || '#777'); g.fillRect((b.x - OX) * sc, (b.z - OZ) * sc, b.wm * sc, b.dm * sc); }
  g.fillStyle = '#2a6a2c'; for (const t of world.trees) { g.beginPath(); g.arc((t.x - OX) * sc, (t.z - OZ) * sc, 1.7, 0, 7); g.fill(); }
  bitmap = c;
}

function drawMinimap() {
  const cv = $('minimap-c'), g = cv.getContext('2d'), S = cv.width, p = G.player;
  g.save(); g.fillStyle = '#05070b'; g.fillRect(0, 0, S, S);
  const s = S / 2 / miniR; // px на метр
  g.imageSmoothingEnabled = true;
  g.translate(S / 2 - (p.x - OX) * s, S / 2 - (p.z - OZ) * s); g.scale(s / (MINI_PX / TS), s / (MINI_PX / TS));
  if (bitmap) g.drawImage(bitmap, 0, 0);
  g.restore();
  g.save();
  const toM = (x, z) => [S / 2 + (x - p.x) * s, S / 2 + (z - p.z) * s];
  g.fillStyle = 'rgba(0,0,0,0.5)';
  for (const [id, rects] of Object.entries(G.world.districtRects)) if (!state.unlocked.has(id) && id !== 'river' && id !== 'bay' && id !== 'yard') for (const d of rects) { const x = S / 2 + (d.x - p.x) * s, z = S / 2 + (d.z - p.z) * s; if (x > -d.w * s && z > -d.d * s && x < S && z < S) g.fillRect(x, z, d.w * s + 0.5, d.d * s + 0.5); }
  // цель миссии
  const t = missionTarget();
  if (t) {
    let [x, z] = toM(t.x, t.z); const m = 8; let edge = false;
    if (x < m || x > S - m || z < m || z > S - m) { edge = true; x = Math.min(S - m, Math.max(m, x)); z = Math.min(S - m, Math.max(m, z)); }
    g.fillStyle = '#ffd400'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, z - 6); g.lineTo(x + 6, z); g.lineTo(x, z + 6); g.lineTo(x - 6, z); g.closePath(); g.stroke(); g.fill();
  }
  const flash = Math.floor(performance.now() / 300) % 2;
  for (const v of G.cars) if (v.ai?.kind === 'police' && !v.wreck) { const [x, z] = toM(v.x, v.z); if (x > 0 && z > 0 && x < S && z < S) { g.fillStyle = flash ? '#ff3030' : '#3a6bff'; g.fillRect(x - 3, z - 3, 6, 6); } }
  for (const c of G.peds) if (c.kind === 'cop' && !c.dead) { const [x, z] = toM(c.x, c.z); if (x > 0 && z > 0 && x < S && z < S) { g.fillStyle = flash ? '#3a6bff' : '#ff3030'; g.fillRect(x - 2, z - 2, 4, 4); } }
  g.translate(S / 2, S / 2); g.rotate(p.ang);
  g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.moveTo(7, 0); g.lineTo(-5, -5); g.lineTo(-2, 0); g.lineTo(-5, 5); g.closePath(); g.stroke(); g.fill();
  g.restore();
}
