// RetroCity — вид строго сверху (Canvas 2D). Главный модуль: загрузка, меню, игровой цикл, сохранения.
import { G, state } from './state.js';
import { CHARACTERS } from './characters.js';
import { MISSIONS, MissionManager } from './missions.js';
import { WEAPONS } from './data.js';
import { DISTRICTS } from './world/layout.js';
import { loadAssets, A, heroFrame } from './engine/assets.js';
import { input, bindInput, endFrame, hit } from './engine/input.js';
import { Camera } from './engine/camera.js';
import { generateWorld, tileX, tileZ, T } from './world/map.js';
import { WorldRenderer } from './world/chunks.js';
import { createPlayer, updatePlayer, nearestVehicle, nearestHelicopter, nearestDoor, nearestPump, forceExit } from './entities/player.js';
import { spawnCar, spawnParked, updateTraffic, populateTraffic, initGates } from './systems/traffic.js';
import { updatePeds, populatePeds } from './systems/peds.js';
import { updateCollisions } from './systems/collide.js';
import { updatePolice, resetPolice, clearPolice } from './systems/police.js';
import { updateEscalation, resetEscalation } from './systems/escalation.js';
import { initTrains, updateTrains } from './systems/trains.js';
import { initPickups, updatePickups } from './systems/pickups.js';
import { renderFrame } from './render.js';
import { updateDestruction, explode } from './systems/fx.js';
import { $, msg, setHUD, updateHUD, updateWeaponHUD, buildMinimap, toggleMiniZoom } from './ui/hud.js';
import { clamp, smooth } from './engine/util.js';
import { enterBuilding, exitBuilding, updateInterior, renderInterior, openHoursText } from './interior/scene.js';
import { panelOpen, closePanel, openInventory, freeSpot } from './ui/panels.js';
import { invInit, pruneBuffs, damageMul } from './economy.js';
import * as GA from './garage.js';
import { sfx, unlockAudio, applyVolumes, startMusic } from './audio.js';
import { playCutscene, updateCutscene, renderCutscene, isCutscene, skipCutscene } from './cutscene.js';
import { sendToHospital, sendToJail } from './systems/consequences.js';
import { initWeather, updateWeather, renderWeather } from './systems/weather.js';
import { Helicopter } from './entities/helicopter.js';
import { HELICOPTER_TYPES, HELICOPTER_BY_ID, REAL_ESTATE } from './data.js';

const SAVE_KEY = 'retrocity3d_save';   // ключ сохранён для совместимости со старыми сохранениями
const SAVE_FORMAT = 4;
const SAVE_CLEANUP_KEY = 'retrocity_save_cleanup_v4';
const QUALITY = { low: { ped: 70, car: 18, name: 'низкое' }, medium: { ped: 150, car: 32, name: 'среднее' }, high: { ped: 240, car: 48, name: 'высокое' } };
const canvas = $('c'), ctx = canvas.getContext('2d');
const cam = new Camera(); G.cam = cam; G.input = input;
let last = performance.now(), frameEMA = 16, perfT = 0, deadT = 0, demoT = 0, missionTimer = null, portraitT = 0, inCharSelect = false;

function resize() { canvas.width = innerWidth; canvas.height = innerHeight; cam.resize(canvas.width, canvas.height); }
addEventListener('resize', resize); resize(); bindInput(canvas);
canvas.addEventListener('wheel', () => { /* масштаб обрабатывается в цикле */ });
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, unlockAudio, { once: false }));
G.sfx = sfx;

// ---------- Инициализация мира ----------
function collectTargets() {
  const t = []; for (const m of MISSIONS) { if (m.target) t.push(m.target); if (m.targets) t.push(...m.targets); } return t;
}
function setQuality(q) {
  state.settings.quality = q; const c = QUALITY[q];
  G.quality.pedCap = c.ped; G.quality.carCap = c.car; G.quality.pedTarget = Math.round(c.ped * 0.85); G.quality.carTarget = Math.round(c.car * 0.85);
  $('btn-settings').textContent = 'Качество: ' + c.name;
}
function resetEntities() { G.peds.length = 0; G.cars.length = 0; G.helicopters.length = 0; G.fx.length = 0; G.noise.length = 0; G.pickups.length = 0; }

function setupWorldEntities(heroChar, pos, saved) {
  resetEntities();
  G.player = createPlayer(heroChar, pos.x, pos.z);
  G.player.hidden = false;
  initGates(); initTrains(); initPickups();
  spawnParked();
  const airport = G.world.pois.planeSpots?.[0];
  if (airport) {
    G.helicopters.push(new Helicopter('civil', airport.x - 18, airport.z + 8, 0, 0));
  } else {
    G.helicopters.push(new Helicopter('civil', 520, 180, 0, 0));
  }
  G.helicopters.push(new Helicopter('police', -560, -420, 0, Math.PI));
  // Сюжетные машины
  const addCar = (type, x, z, ang, color) => { const v = spawnCar(type, x, z, ang, { color }); v.keep = true; v.parked = true; if (v.collides(v.x, v.z, v.ang)) G.cars.pop(); return v; };
  addCar('sedan', -2, 16, Math.PI / 2, 4); addCar('taxi', 2, -18, -Math.PI / 2, 0); addCar('van', -2.2, 40, Math.PI / 2, 0);
  addCar('sedan', 50, -80, -Math.PI / 2, 6);
  const tk = G.world.nearestWalk(-200, 280, 12); const tank = spawnCar('tank', tk.x, tk.z, 0, {}); tank.keep = true; tank.parked = true;
  if (saved?.vehicle) { const sv = saved.vehicle; const v = spawnCar(sv.type, sv.x, sv.z, sv.ang, { color: sv.color, driver: 'player' }); v.keep = true; G.player.inVehicle = v; v.hp = sv.hp ?? v.hp; v.bonus = heroChar.vehicleBonus || 1; }
  cam.snap(pos.x, pos.z);
}

async function boot() {
  try {
    purgeOldPlayerSaves();
    const bar = $('bar-fill'), txt = $('load-text');
    await loadAssets((p, f) => { bar.style.width = Math.round(p * 70) + '%'; txt.textContent = 'Графика: ' + f; });
    txt.textContent = 'Генерация города...'; await new Promise(r => setTimeout(r, 30));
    G.world = generateWorld(collectTargets());
    G.renderer = new WorldRenderer(G.world);
    buildMinimap(G.world); bar.style.width = '100%';
    setQuality('medium');
    state.character = CHARACTERS[0];
    startDemo();
    $('loading').classList.add('hidden');
    bindUI();
    requestAnimationFrame(loop);
    console.log('[RetroCity] Ready');
  } catch (e) { $('load-text').textContent = 'Ошибка: ' + e.message; console.error(e); }
}

// Фоновая демо-сцена за меню: живой город, камера плывёт по улицам
function startDemo() {
  state.mode = 'menu'; G.demo = true; state.wanted = 0; state.heat = 0;
  setupWorldEntities(CHARACTERS[0], { x: -20, z: 0 }, null);
  populateTraffic(); populatePeds(); demoT = 0;
}

// ---------- Сохранения ----------
function purgeOldPlayerSaves() {
  if (localStorage.getItem(SAVE_CLEANUP_KEY) === 'done') return;
  const audit = { localKeys: [], indexedDb: [], removed: 0, preservedSettings: [] };
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key) continue;
    const lower = key.toLowerCase();
    const isSave = lower === SAVE_KEY || lower === SAVE_KEY + '_backup' || lower.startsWith('retrocity_save') || lower.startsWith('retrocity3d_save') || lower.includes('save_slot') || (lower.includes('retrocity') && lower.includes('_save'));
    if (isSave && key !== SAVE_CLEANUP_KEY) {
      audit.localKeys.push(key); localStorage.removeItem(key); audit.removed++;
    } else if (lower.includes('retrocity') || lower.includes('retro_city')) {
      audit.preservedSettings.push(key);
    }
  }
  localStorage.setItem(SAVE_CLEANUP_KEY, 'done');
  G.saveAudit = audit;
  if (globalThis.indexedDB?.databases) {
    globalThis.indexedDB.databases().then(dbs => {
      for (const db of dbs) if (/retrocity|retro_city/i.test(db.name || '') && db.name) {
        audit.indexedDb.push(db.name);
        indexedDB.deleteDatabase(db.name);
      }
    }).catch(() => {});
  }
}

function saveGame() {
  const p = G.player, v = p.inVehicle, S = G.interior;
  const data = {
    version: SAVE_FORMAT, money: state.money, health: state.health, wanted: state.wanted, heat: state.heat,
    unlocked: [...state.unlocked], characterId: state.character?.id, weapons: state.ownedWeapons, weaponIndex: state.weaponIndex, ammo: state.ammo,
    pos: S ? { x: S.ret.x, z: S.ret.z } : { x: p.x, z: p.z }, heading: p.ang, dayTime: state.dayTime,
    vehicle: v && !S ? { type: v.type, color: v.colorIdx, x: v.x, z: v.z, ang: v.ang, hp: v.hp, fuel: v.fuel, ownedId: v.ownedId } : null,
    helicopter: p.inHelicopter ? { type: p.inHelicopter.type, x: p.inHelicopter.x, z: p.inHelicopter.z, altitude: p.inHelicopter.altitude, ang: p.inHelicopter.ang, hp: p.inHelicopter.hp, fuel: p.inHelicopter.fuel } : null,
    missions: state.missionMgr?.getSave?.(),
    inventory: state.inventory, outfit: state.outfit, armor: state.armor, bank: state.bank, perm: state.perm, garage: state.garage, confiscated: state.confiscated || null,
    realEstate: state.realEstate,
    ownedWorld: G.cars.filter(c => c.ownedId).map(c => ({ id: c.ownedId, x: c.x, z: c.z, ang: c.ang })),
    settings: state.settings, weather: state.weather,
  };
  try {
    const serialized = JSON.stringify(data);
    const previous = localStorage.getItem(SAVE_KEY);
    if (previous) localStorage.setItem(SAVE_KEY + '_backup', previous);
    localStorage.setItem(SAVE_KEY, serialized);
    msg('Игра сохранена');
  } catch (e) { msg('Не удалось сохранить: ' + e.message); }
}
function loadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || localStorage.getItem(SAVE_KEY + '_backup'));
    if (!raw) return null;
    if (raw.version !== SAVE_FORMAT) { G.saveAudit = { ...(G.saveAudit || {}), rejectedOldFormat: raw.version ?? 'missing' }; return null; }
    if (typeof raw.money !== 'number' || typeof raw.health !== 'number' || !raw.pos || typeof raw.pos.x !== 'number') { G.saveAudit = { ...(G.saveAudit || {}), rejectedCorruptSave: true }; return null; }
    raw.weather = raw.weather || { name: 'Солнечно', kind: 'sun', intensity: 0, transition: 1, until: 240 };
    raw.realEstate = raw.realEstate || {};
    raw.helicopter = raw.helicopter || null;
    return raw;
  } catch { return null; }
}

// ---------- Старт игры ----------
function startGame(saveData) {
  G.demo = false; clearPolice();
  const ch = saveData ? CHARACTERS.find(c => c.id === saveData.characterId) || CHARACTERS[0] : CHARACTERS[state.charIndex];
  state.character = ch; state.maxHealth = Math.round(100 * (ch.healthMul || 1)); state.playTime = 0;
  const pos = saveData?.pos || { x: 6, z: 6 };
  const sp = saveData ? pos : pos;
  setupWorldEntities(ch, sp, saveData);
  if (saveData?.helicopter) {
    const sh = saveData.helicopter;
    let h = G.helicopters.find(v => v.type === sh.type) || G.helicopters[0];
    if (h) { h.x = sh.x ?? h.x; h.z = sh.z ?? h.z; h.altitude = sh.altitude ?? 0; h.ang = sh.ang ?? h.ang; h.hp = sh.hp ?? h.hp; h.fuel = sh.fuel ?? h.fuel; h.driver = 'player'; h.parked = false; G.player.inHelicopter = h; }
  }
  if (saveData) {
    state.money = saveData.money ?? 5000; state.health = saveData.health ?? state.maxHealth; state.wanted = saveData.wanted ?? 0; state.heat = saveData.heat ?? state.wanted;
    state.unlocked = new Set(saveData.unlocked || ['downtown']); state.ownedWeapons = saveData.weapons || ['fists']; state.weaponIndex = Math.min(saveData.weaponIndex || 0, state.ownedWeapons.length - 1);
    state.ammo = saveData.ammo || state.ammo; state.dayTime = saveData.dayTime ?? 12; G.player.ang = saveData.heading ?? 0;
    state.inventory = saveData.inventory || {}; state.outfit = saveData.outfit || null; state.armor = saveData.armor || 0; state.bank = saveData.bank || 0; state.perm = saveData.perm || {}; state.garage = saveData.garage || []; state.confiscated = saveData.confiscated || null; state.realEstate = saveData.realEstate || {};
    if (saveData.settings) state.settings = { ...state.settings, ...saveData.settings };
  } else {
    state.money = 5000; state.health = state.maxHealth; state.wanted = 0; state.heat = 0; state.unlocked = new Set(['downtown']);
    state.ownedWeapons = ['fists']; state.weaponIndex = 0; state.ammo = { pistol: 0, smg: 0, shotgun: 0, special: 0 }; state.dayTime = 12;
    state.inventory = {}; state.outfit = null; state.armor = 0; state.bank = 0; state.perm = {}; state.garage = []; state.confiscated = null; state.realEstate = {};
  }
  invInit(); G.interior = null; G.cam.bounds = null; G.pendingOwned = [];
  if (saveData?.ownedWorld) for (const o of saveData.ownedWorld) { const e = state.garage.find(g => g.id === o.id); if (e) { e.out = false; const v = GA.spawnOut(e, o.x, o.z, o.ang); if (v) { v.hp = e.hp; v.fuel = e.fuel; } } }
  if (saveData?.vehicle?.ownedId) { const e = state.garage.find(g => g.id === saveData.vehicle.ownedId); if (e) { const pv = G.player.inVehicle; if (pv) { pv.ownedId = e.id; e.out = true; pv.fuel = saveData.vehicle.fuel ?? pv.fuel; } } }
  G.saveGame = saveGame;
  state.missionMgr = new MissionManager(); if (saveData?.missions) state.missionMgr.loadSave(saveData.missions);
  resetPolice(); resetEscalation(); populateTraffic(); populatePeds();
  initWeather(saveData);
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  setHUD(true); state.mode = 'playing'; updateWeaponHUD();
  $('vol-music').value = Math.round((state.settings.musicVol ?? 0.5) * 100); $('vol-sfx').value = Math.round((state.settings.sfxVol ?? 0.7) * 100); applyVolumes();
  if (!saveData) {
    state.mode = 'outcome';
    playCutscene([
      { who: 'RetroCity', text: 'Большой город на берегу реки. Здесь каждый ищет свой шанс...' },
      { who: ch.name + ' ' + ch.surname, text: ch.bio, heroId: ch.id },
      { who: ch.name, text: '«' + ch.trait + '. Пора заработать на новую жизнь.»', heroId: ch.id },
    ]).then(() => { state.mode = 'playing'; });
  } else msg('С возвращением, ' + ch.name + '!', 3);
  clearTimeout(missionTimer);
  if (!state.missionMgr.current) missionTimer = setTimeout(() => { if (state.mode === 'playing') offerMission(); }, 4500);
  else { const m = state.missionMgr.current; $('mission-title').textContent = m.name; }
}

function offerMission() {
  if (!state.missionMgr || state.missionMgr.current) return;
  const m = state.missionMgr.next; if (!m) { msg('Все сюжетные миссии пройдены!'); return; }
  state.missionMgr.start(m);
  if (m.dialogue) {
    const ch = state.character;
    let lines = m.dialogue.map((t, i) => ({
      who: ch.name + ' ' + ch.surname,
      text: t,
      heroId: ch.id,
      target: m.target ? { x: m.target.x, z: m.target.z } : null,
      zoom: i % 2 ? 1.45 : 1.85,
    }));
    if ([1, 11, 21, 31, 41, 50].includes(m.id)) {
      const chapterLines = {
        1: ['Город просыпается вместе с тобой.', 'Карта, дорога и имя — всё начинается здесь.'],
        11: ['Часть одиннадцать открывает городскую сеть.', 'Каждое решение теперь оставляет след.'],
        21: ['Деловой район знает больше, чем говорит.', 'Следующая сделка должна остаться вне протоколов.'],
        31: ['Команда собралась перед решающей переменой.', 'Поверить союзнику или действовать одному — выбор твой.'],
        41: ['Конфликт выходит на новый уровень.', 'Звёзды полицейского периметра больше не пугают — они определяют план.'],
        50: ['RetroCity ждет рассвета.', 'Этот город помнит тех, кто не сдался.'],
      };
      lines = [
        { who: 'RetroCity', text: chapterLines[m.id][0], target: m.target ? { x: m.target.x, z: m.target.z } : null, zoom: 1.25, cameraSpeed: 0.8 },
        { who: ch.name + ' ' + ch.surname, text: chapterLines[m.id][1], heroId: ch.id, target: m.target ? { x: m.target.x, z: m.target.z } : null, zoom: 1.7, cameraSpeed: 1.2 },
        ...lines,
      ];
    }
    state.mode = 'outcome'; playCutscene(lines, { perLine: 3.2 }).then(() => { if (state.mode === 'outcome') state.mode = 'playing'; });
  }
}
function updateMissions() {
  const mm = state.missionMgr, p = G.player; if (!mm || p.dead) return;
  const r = mm.check(p, state.wanted, !!p.inVehicle);
  if (r === 'complete') {
    const completedId = mm.current?.id;
    let reward = mm.complete(); reward = Math.round(reward * (state.character?.moneyBonus || 1)); state.money += reward;
    msg('Миссия выполнена! +₽' + reward, 4); saveGame();
    if ([10, 20, 30, 40, 50].includes(completedId)) {
      const ch = state.character;
      state.mode = 'outcome';
      playCutscene([
        { who: 'RetroCity', text: 'Глава завершена. Город изменился, но история ещё не закончена.', zoom: 1.3 },
        { who: ch.name + ' ' + ch.surname, text: 'Следующая цель уже ждёт за пределами света фонарей.', heroId: ch.id, zoom: 1.65 },
      ], { perLine: 2.8 }).then(() => { if (state.mode === 'outcome') state.mode = 'playing'; });
    }
    clearTimeout(missionTimer); missionTimer = setTimeout(() => { if (state.mode === 'playing') offerMission(); }, 3500);
  } else if (r === 'stage') {
    msg(mm.current?.type === 'wanted' ? 'Розыск набран! Теперь оторвись от полиции' : 'Точка пройдена!', 2.5);
  }
}
function checkUnlocks() {
  const p = G.player, id = G.world.districtAt(p.x, p.z);
  if (!state.unlocked.has(id) && id !== 'river' && id !== 'bay' && id !== 'yard') { state.unlocked.add(id); msg('Новый район: ' + DISTRICTS[id].name + '!', 3.5); }
}

G.onExitBuilding = () => {
  const p = G.player;
  for (const e of (G.pendingOwned || []).splice(0)) { const sp = freeSpot(p); const v = GA.spawnOut(e, sp.x, sp.z, sp.ang); if (v) msg('Ваша машина ждёт рядом', 3); }
};
// ---------- Здоровье, смерть, задержание ----------
let outcomeBusy = false;
G.hurtPlayer = (amount, src) => {
  const p = G.player; if (p.dead || state.mode !== 'playing' || amount <= 0 || outcomeBusy) return;
  amount *= damageMul();
  if (state.armor > 0 && src !== 'train') { const ab = Math.min(state.armor, amount * 0.7); state.armor -= ab; amount -= ab; }
  state.health -= amount; const h = $('hurt'); h.classList.add('on'); setTimeout(() => h.classList.remove('on'), 180); sfx('hurt');
  if (state.health <= 0) { state.health = 0; die(src); }
};
async function die(src) {
  if (outcomeBusy) return; outcomeBusy = true;
  const p = G.player; p.dead = true; state.mode = 'outcome'; p.speed = 0;
  if (p.inVehicle) { p.inVehicle.driver = null; forceExit(p); }
  const arrested = src === 'baton' || (state.wanted > 0 && (src === 'shot' || src === 'crash'));
  if (arrested) await sendToJail(); else await sendToHospital();
  state.mode = 'playing'; cam.snap(p.x, p.z); outcomeBusy = false;
}

// ---------- UI ----------
function updateCharPreview() {
  const c = CHARACTERS[state.charIndex];
  $('char-name').textContent = c.name + ' ' + c.surname; $('char-trait').textContent = c.trait; $('char-bio').textContent = c.bio;
  const st = [`Скорость ×${c.speedMul}`, `Вождение ×${c.vehicleBonus}`]; if (c.healthMul) st.push(`Здоровье ×${c.healthMul}`); if (c.moneyBonus) st.push(`Доход ×${c.moneyBonus}`); if (c.wantedDecay) st.push(`Спад розыска ×${c.wantedDecay}`);
  $('char-stats').textContent = st.join('  ·  ');
}
function drawPortrait(t) {
  const cv = $('char-portrait'), g = cv.getContext('2d'), c = CHARACTERS[state.charIndex];
  g.fillStyle = '#5f635a'; g.fillRect(0, 0, 160, 160);
  g.strokeStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i < 160; i += 20) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 160); g.moveTo(0, i); g.lineTo(160, i); g.stroke(); }
  const [img, sx, sy] = heroFrame(c.id, 'walk', t * 7);
  g.save(); g.translate(80, 84); g.rotate(t * 0.8); g.imageSmoothingEnabled = false; g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(6, 5, 26, 20, 0, 0, 7); g.fill();
  g.drawImage(img, sx, sy, 64, 64, -88, -88, 176, 176); g.restore();
}
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  if (id) $(id).classList.remove('hidden'); inCharSelect = id === 'char-select';
}
function bindUI() {
  $('btn-new').onclick = () => { state.charIndex = 0; updateCharPreview(); showScreen('char-select'); };
  $('btn-continue').onclick = () => { const s = loadSave(); if (s) startGame(s); };
  $('btn-continue').disabled = !loadSave();
  $('char-prev').onclick = () => { state.charIndex = (state.charIndex + 5) % 6; updateCharPreview(); };
  $('char-next').onclick = () => { state.charIndex = (state.charIndex + 1) % 6; updateCharPreview(); };
  $('char-ok').onclick = () => startGame(null);
  $('char-back').onclick = () => showScreen('main-menu');
  $('btn-resume').onclick = () => { state.mode = 'playing'; showScreen(null); };
  $('btn-save').onclick = saveGame;
  $('btn-menu').onclick = () => { setHUD(false); startDemo(); showScreen('main-menu'); $('btn-continue').disabled = !loadSave(); };
  $('btn-settings').onclick = () => { const q = Object.keys(QUALITY); setQuality(q[(q.indexOf(state.settings.quality) + 1) % q.length]); };
  $('vol-music').oninput = e => { state.settings.musicVol = +e.target.value / 100; applyVolumes(); };
  $('vol-sfx').oninput = e => { state.settings.sfxVol = +e.target.value / 100; applyVolumes(); sfx('ui'); };
}

// ---------- Игровой цикл ----------
function updateWorld(dt) {
  G.time += dt; G.frame = (G.frame || 0) + 1;
  if (!G.realEstateTimer) G.realEstateTimer = 0;
  G.realEstateTimer += dt;
  if (G.realEstateTimer >= 600) {
    G.realEstateTimer = 0;
    let income = 0;
    for (const property of REAL_ESTATE) if (state.realEstate?.[property.id]) income += property.income;
    if (income > 0) { state.money += income; G.msg('Доход от недвижимости: +₽' + income.toLocaleString('ru-RU'), 4); }
  }
  G.gridPeds.clear(); for (const p of G.peds) if (!p.dead) G.gridPeds.add(p);
  G.gridCars.clear(); for (const v of G.cars) G.gridCars.add(v);
  updateTraffic(dt); updatePeds(dt); updateTrains(dt); updateCollisions(dt); updateDestruction(dt);
  for (const h of G.helicopters) {
    if (h.driver === 'player') continue;
    if (h.type === 'police' && state.wanted >= 4) {
      const p = G.player;
      h.ang = Math.atan2(p.z - h.z, p.x - h.x);
      h.altitude += (18 - h.altitude) * Math.min(1, dt * 0.18);
      h.step(dt, { throttle: 0.75, steer: 0, turn: 0, vertical: h.altitude > 2 ? 0 : 1 });
    } else if (h.type === 'police') {
      h.altitude = Math.max(0, h.altitude - dt * 2);
      h.step(dt, { throttle: 0, steer: 0, turn: 0, vertical: 0 });
    } else h.step(dt, { throttle: 0, steer: 0, turn: 0, vertical: 0 });
  }
  for (let i = G.fx.length - 1; i >= 0; i--) { const f = G.fx[i]; f.t += dt; if (f.vx !== undefined) { f.x += f.vx * dt; f.z += f.vz * dt; if (f.k === 'debris' || f.k === 'fire') { f.vx *= 0.96; f.vz *= 0.96; } } if (f.t > f.life) G.fx.splice(i, 1); }
  for (let i = G.noise.length - 1; i >= 0; i--) { G.noise[i].t += dt; if (G.noise[i].t > 1.2) G.noise.splice(i, 1); }
  for (let i = G.cars.length - 1; i >= 0; i--) if (G.cars[i].fade !== undefined && (G.cars[i].fade -= dt * 0.4) <= 0) G.cars.splice(i, 1);
}
function adaptPerformance(dt) {
  frameEMA += (dt * 1000 - frameEMA) * 0.05; perfT += dt;
  if (perfT < 1.5) return; perfT = 0;
  const q = G.quality;
  if (frameEMA > 24) { q.pedTarget = Math.max(24, Math.floor(q.pedTarget * 0.85)); q.carTarget = Math.max(8, Math.floor(q.carTarget * 0.88)); }
  else if (frameEMA < 15) { q.pedTarget = Math.min(q.pedCap, Math.ceil(q.pedTarget * 1.08) + 1); q.carTarget = Math.min(q.carCap, Math.ceil(q.carTarget * 1.06)); }
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  const p = G.player; if (!p) return;
  if (inCharSelect) { portraitT += dt; drawPortrait(portraitT); }
  if (state.mode === 'menu') {
    demoT += dt; p.x = -20 + 140 * Math.sin(demoT * 0.045); p.z = 10 + 90 * Math.sin(demoT * 0.031 + 1); p.hidden = true;
    updateWorld(dt); cam.zoom = 1.1; cam.x = p.x; cam.z = p.z; cam.clampToWorld(); adaptPerformance(dt);
    renderFrame(ctx, cam, dt, G.time); endFrame(); return;
  }
  if (state.mode === 'ui') {
    if (hit('Escape')) closePanel();
    if (G.interior) renderInterior(ctx, cam, dt, G.time); else renderFrame(ctx, cam, dt, G.time);
    updateHUD(0, null); endFrame(); return;
  }
  if (hit('Escape') && (state.mode === 'playing' || state.mode === 'pause')) {
    if (state.mode === 'playing') { state.mode = 'pause'; showScreen('pause'); } else { state.mode = 'playing'; showScreen(null); }
  }
  if (G.interior && state.mode === 'playing') {
    state.playTime += dt; G.time += dt; state.dayTime = (state.dayTime + dt * 0.02) % 24; pruneBuffs();
    updateInterior(dt); cam.x = smooth(cam.x, p.x, dt, 8); cam.z = smooth(cam.z, p.z, dt, 8); cam.zoom = smooth(cam.zoom, 1.9 * cam.userZoom, dt, 5); cam.clampToWorld();
    updateWeaponHUD(); updateHUD(dt, null); renderInterior(ctx, cam, dt, G.time); endFrame(); return;
  }
  if (state.mode === 'outcome') {
    updateCutscene(dt); renderFrame(ctx, cam, dt, G.time); renderCutscene(ctx, cam.w, cam.h);
    if (hit('Space') || hit('Enter')) skipCutscene();
    endFrame(); return;
  }
  if (state.mode === 'playing') {
    if (input.wheel) cam.addZoom(input.wheel);
    if (state.mode === 'playing') {
      state.playTime += dt;
      if (hit('KeyN')) toggleMiniZoom();
      if (hit('KeyM') && !state.missionMgr?.current) offerMission();
      if (hit('F5')) saveGame();
      const v = p.inVehicle, hp0 = v?.hp;
      updatePlayer(dt);
      if (v && v === p.inVehicle && hp0 > v.hp) { G.hurtPlayer((hp0 - v.hp) * 0.2, 'crash'); }
      if (p.inVehicle?.wreck) { const w = p.inVehicle; forceExit(p); msg('Машина разбита!', 2); G.hurtPlayer(15, 'crash'); }
    }
    updateWorld(dt); updatePickups(dt); updatePolice(dt); updateEscalation(dt);
    if (state.mode === 'playing') { updateMissions(); checkUnlocks(); state.dayTime = (state.dayTime + dt * 0.02) % 24; updateWeather(dt); }
    adaptPerformance(dt);
    const tgt = p.inHelicopter || p.inVehicle || p;
    cam.follow(tgt.x, tgt.z, p.inHelicopter ? p.inHelicopter.vx : (p.inVehicle ? p.inVehicle.vx : p.vx), p.inHelicopter ? p.inHelicopter.vz : (p.inVehicle ? p.inVehicle.vz : p.vz), dt, !!(p.inVehicle || p.inHelicopter), Math.abs(p.inHelicopter?.speed || p.inVehicle?.speed || 0));
    updateWeaponHUD(); pruneBuffs();
    let nv = null, hintD = null;
    if (!(p.inVehicle || p.inHelicopter || p.enter || p.exit)) { nv = nearestVehicle(p); const nh = nearestHelicopter(p); if (nh) hintD = 'E — сесть в вертолёт: ' + nh.stats.name; else if (!nv) { const d = nearestDoor(p); if (d) hintD = 'E — войти: ' + (d.interior.name || d.kind) + (d.interior.type && !['home', 'flat', 'mansion'].includes(d.interior.type) ? '  [' + openHoursText(d.interior.type) + ']' : ''); } }
    else if (p.inVehicle && !p.exit && nearestPump(p)) hintD = 'F — заправиться (65 ₽ / л)   ·   E — выйти';
    updateHUD(dt, nv, hintD);
  }
  if (state.mode === 'pause') { /* заморозка */ }
  renderFrame(ctx, cam, dt, G.time); renderWeather(ctx, cam);
  endFrame();
}

// Отладочный доступ (для автотестов)
window.RC = { explode, G, state, cam, saveGame, loadSave, startGame, CHARACTERS, MISSIONS, HELICOPTER_TYPES, HELICOPTER_BY_ID, Helicopter, enterBuilding, exitBuilding, GA, playCutscene, isCutscene, saveAudit: () => G.saveAudit };
boot();
