// Панели интерфейса: магазин, инвентарь, банк, больница, участок, автосалон, гараж, кровать.
import { G, state } from '../state.js';
import { ITEMS, SHOPS, buy, useItem, invCount, quickHeal, outfitFilter, activeBuffs, invInit } from '../economy.js';
import { WEAPONS, CAR_ECON, CAR_BY_ID, REAL_ESTATE } from '../data.js';
import * as GA from '../garage.js';
import { A } from '../engine/assets.js';
import { $ } from './hud.js';

let cur = null, prevMode = 'playing';
export const panelOpen = () => !!cur;
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

export function openPanel(title, render, opts = {}) {
  cur = { title, render, opts }; if (state.mode !== 'ui') prevMode = state.mode; state.mode = 'ui';
  $('panel').classList.remove('hidden'); redraw();
}
export function closePanel() {
  if (!cur) return; cur = null; $('panel').classList.add('hidden'); state.mode = prevMode === 'ui' ? 'playing' : prevMode; G.sfx?.('ui');
}
function redraw() {
  if (!cur) return;
  const body = $('panel-body'); body.innerHTML = '';
  const head = el('div', 'p-head'); head.append(el('h2', null, cur.title), el('div', 'p-money', '₽' + Math.floor(state.money).toLocaleString('ru-RU') + (state.bank ? '  ·  счёт ₽' + Math.floor(state.bank).toLocaleString('ru-RU') : '')));
  body.append(head);
  const msg = el('div', 'p-msg', cur.msg || ''); body.append(msg);
  cur.render(body, redraw, m => { cur.msg = m; msg.textContent = m; });
  const foot = el('div', 'p-foot'); const b = el('button', 'btn small', 'Закрыть (Esc)'); b.onclick = closePanel; foot.append(b); body.append(foot);
}
const say = m => { if (cur) { cur.msg = m; } };
function row(body, { name, desc, price, btn = 'Купить', onClick, disabled, extra }) {
  const r = el('div', 'p-row'); const l = el('div', 'p-name'); l.append(el('b', null, name)); if (desc) l.append(el('small', null, desc)); r.append(l);
  if (extra) r.append(extra);
  if (price != null) r.append(el('span', 'p-price', price.toLocaleString('ru-RU') + ' ₽'));
  if (btn) { const b = el('button', 'btn small', btn); if (disabled) b.disabled = true; b.onclick = () => { onClick(); redraw(); }; r.append(b); }
  body.append(r); return r;
}

// ---------- Магазин ----------
export function openShop(kind) {
  const shop = SHOPS[kind] || SHOPS.grocery; let tab = null;
  openPanel(shop.name, (body) => {
    const cats = [...new Set(shop.items.map(id => ITEMS[id].cat))]; if (!tab || !cats.includes(tab)) tab = cats[0];
    const tabs = el('div', 'p-tabs'); for (const c of cats) { const t = el('button', 'btn small' + (c === tab ? ' on' : ''), c); t.onclick = () => { tab = c; redraw(); }; tabs.append(t); } body.append(tabs);
    for (const id of shop.items.filter(i => ITEMS[i].cat === tab)) {
      const it = ITEMS[id]; const owned = it.type === 'weapon' && state.ownedWeapons.includes(it.weapon) && !it.ammo || (it.perm && state.perm?.[id]);
      row(body, { name: it.name + (invCount(id) ? `  (в сумке: ${invCount(id)})` : ''), desc: it.desc + (it.type === 'weapon' && state.ownedWeapons.includes(it.weapon) ? ' · уже есть' : ''), price: it.price, disabled: state.money < it.price || owned, btn: owned ? 'Есть' : 'Купить',
        onClick: () => { const r = buy(id); say(r.msg); G.sfx?.(r.ok ? 'cash' : 'deny'); } });
    }
  });
}

// ---------- Инвентарь ----------
export function openInventory() {
  invInit();
  openPanel('Инвентарь', (body) => {
    const sec = t => body.append(el('div', 'p-sec', t));
    sec('Оружие');
    state.ownedWeapons.forEach((id, i) => { const w = WEAPONS.find(x => x.id === id); row(body, { name: w.name, desc: w.ammo == null ? 'без патронов' : 'патроны: ' + (state.ammo[id] || 0), btn: i === state.weaponIndex ? 'В руках' : 'Взять', disabled: i === state.weaponIndex, onClick: () => { state.weaponIndex = i; G.updateWeaponHUD?.(); } }); });
    sec('Предметы');
    const ids = Object.keys(state.inventory || {}); if (!ids.length) body.append(el('div', 'p-empty', 'Пусто. Магазины: продукты, аптека, одежда, оружие, хозтовары.'));
    for (const id of ids) { const it = ITEMS[id]; row(body, { name: `${it.name} ×${state.inventory[id]}`, desc: it.desc, btn: it.type === 'outfit' ? (state.outfit === id ? 'Надето' : 'Надеть') : 'Использовать', disabled: state.outfit === id, onClick: () => { const r = useItem(id); say(r.msg); G.sfx?.(r.ok ? 'ui' : 'deny'); } }); }
    if (state.outfit) row(body, { name: 'Снять образ', desc: ITEMS[state.outfit].name, btn: 'Снять', onClick: () => { state.outfit = null; } });
    sec('Снаряжение');
    body.append(el('div', 'p-empty', `Броня: ${Math.round(state.armor || 0)}   ·   Постоянные бонусы: ${Object.keys(state.perm || {}).map(k => ITEMS[k]?.name).join(', ') || 'нет'}`));
    const b = activeBuffs(); if (b.length) body.append(el('div', 'p-empty', 'Эффекты: ' + b.map(([k, v]) => `${k} (${Math.ceil(v.until - G.time)} с)`).join(', ')));
  });
}

// ---------- Банк ----------
export function openBank() {
  openPanel('Банк', (body) => {
    body.append(el('div', 'p-empty', 'Деньги на счёте не теряются при задержании и в больнице.'));
    const mk = (label, fn) => { const b = el('button', 'btn small', label); b.onclick = () => { fn(); redraw(); }; return b; };
    const r1 = el('div', 'p-row'); r1.append(el('b', null, 'Положить на счёт:'));
    for (const a of [100, 1000, 'всё']) r1.append(mk(a === 'всё' ? 'Всё' : String(a) + ' ₽', () => { const v = a === 'всё' ? Math.floor(state.money) : a; if (state.money < v || v <= 0) { say('Недостаточно денег'); G.sfx?.('deny'); return; } state.money -= v; state.bank = (state.bank || 0) + v; say('Внесено ₽' + v.toLocaleString('ru-RU')); G.sfx?.('cash'); }));
    const r2 = el('div', 'p-row'); r2.append(el('b', null, 'Снять со счёта:'));
    for (const a of [100, 1000, 'всё']) r2.append(mk(a === 'всё' ? 'Всё' : String(a) + ' ₽', () => { const v = a === 'всё' ? Math.floor(state.bank || 0) : a; if ((state.bank || 0) < v || v <= 0) { say('На счёте нет столько'); G.sfx?.('deny'); return; } state.bank -= v; state.money += v; say('Снято ₽' + v.toLocaleString('ru-RU')); G.sfx?.('cash'); }));
    body.append(r1, r2);
  });
}

// ---------- Недвижимость ----------
export function openRealEstate() {
  state.realEstate = state.realEstate || {};
  openPanel('Недвижимость', (body) => {
    body.append(el('div', 'p-empty', 'Купленная недвижимость приносит пассивный доход за каждые 10 игровых минут.'));
    for (const property of REAL_ESTATE) {
      const owned = !!state.realEstate[property.id];
      row(body, {
        name: property.name,
        desc: owned ? 'Принадлежит вам · доход ' + property.income.toLocaleString('ru-RU') + ' ₽ / платеж' : 'Арендная ставка ' + property.rent.toLocaleString('ru-RU') + ' ₽ · район: ' + property.district,
        price: owned ? null : property.price,
        btn: owned ? 'Куплено' : 'Купить',
        disabled: owned || state.money < property.price,
        onClick: () => {
          if (state.money < property.price) { say('Недостаточно денег'); return; }
          state.money -= property.price;
          state.realEstate[property.id] = { purchasedAt: G.time, incomeClaimed: 0 };
          say('Недвижимость приобретена: ' + property.name);
          G.sfx?.('cash');
        },
      });
    }
  });
}

// ---------- Больница ----------
export function openHospital() {
  openPanel('Регистратура больницы', (body) => {
    const need = Math.ceil(state.maxHealth - state.health), cost = Math.ceil(need * 75);
    row(body, { name: 'Полное лечение', desc: need > 0 ? `Восстановить ${need} ед. здоровья` : 'Вы здоровы', price: cost, btn: 'Лечить', disabled: need <= 0 || state.money < cost, onClick: () => { state.money -= cost; state.health = state.maxHealth; say('Вы полностью здоровы'); G.sfx?.('cash'); } });
    row(body, { name: 'Аптечка', desc: ITEMS.medkit.desc, price: ITEMS.medkit.price, disabled: state.money < ITEMS.medkit.price, onClick: () => { const r = buy('medkit'); say(r.msg); G.sfx?.(r.ok ? 'cash' : 'deny'); } });
    row(body, { name: 'Бинты', desc: ITEMS.bandage.desc, price: ITEMS.bandage.price, disabled: state.money < ITEMS.bandage.price, onClick: () => { const r = buy('bandage'); say(r.msg); G.sfx?.(r.ok ? 'cash' : 'deny'); } });
  });
}

// ---------- Полицейский участок ----------
export function openPolice() {
  openPanel('Полицейский участок', (body) => {
    body.append(el('div', 'p-empty', 'Дежурный: «Законопослушных граждан здесь не задерживают. Помните: за правонарушения — штраф или кутузка.»'));
    const c = state.confiscated;
    if (c && (c.weapons?.length)) row(body, { name: 'Забрать конфискованное', desc: 'Оружие: ' + c.weapons.map(id => WEAPONS.find(w => w.id === id)?.name).join(', '), price: 5000, btn: 'Забрать', disabled: state.money < 5000, onClick: () => { state.money -= 5000; for (const id of c.weapons) if (!state.ownedWeapons.includes(id)) state.ownedWeapons.push(id); for (const [k, v] of Object.entries(c.ammo || {})) state.ammo[k] = (state.ammo[k] || 0) + v; state.confiscated = null; G.updateWeaponHUD?.(); say('Вещи возвращены'); G.sfx?.('cash'); } });
    else body.append(el('div', 'p-empty', 'Ваших вещей на хранении нет.'));
  });
}

// ---------- Кровать ----------
export function openBed() {
  openPanel('Кровать', (body) => {
    row(body, { name: 'Сохранить игру', desc: 'Запись в браузере (localStorage)', btn: 'Сохранить', onClick: () => { G.saveGame?.(); say('Игра сохранена'); G.sfx?.('ui'); } });
    row(body, { name: 'Поспать до утра', desc: 'Здоровье до максимума, время 07:00', btn: 'Спать', onClick: () => { state.dayTime = 7; state.health = state.maxHealth; say('Вы выспались'); G.sfx?.('ui'); } });
    row(body, { name: 'Вздремнуть час', desc: '+20 здоровья, +1 час', btn: 'Вздремнуть', onClick: () => { state.dayTime = (state.dayTime + 1) % 24; state.health = Math.min(state.maxHealth, state.health + 20); say('Час прошёл'); } });
  });
}

// ---------- Автосалон ----------
function carThumb(type, color, w = 170) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = 80; const g = cv.getContext('2d');
  const t = A.m.vehicles.types[type], c = t.colors[color % t.colors.length], [sx, sy, sw, sh] = c.rect, k = Math.min((w - 10) / sw, 70 / sh);
  g.imageSmoothingEnabled = true; g.drawImage(A.veh, sx, sy, sw, sh, (w - sw * k) / 2, (80 - sh * k) / 2, sw * k, sh * k); return cv;
}
export function openDealer(type) {
  let color = Math.floor(Math.random() * 8);
  openPanel('Автосалон', (body) => {
    const st = CAR_BY_ID[type], eco = CAR_ECON[type], n = A.m.vehicles.types[type].colors.length, cn = A.m.vehicles.types[type].colors[color % n].name;
    const r = el('div', 'p-car'); r.append(carThumb(type, color));
    const info = el('div', 'p-name'); info.append(el('b', null, st.name), el('small', null, `Макс. скорость ${Math.round(st.speed * 3.6)} км/ч · прочность ${st.hp} · бак ${eco.fuel} л · цвет: ${cn}`)); r.append(info); body.append(r);
    const c = el('button', 'btn small', 'Сменить цвет'); c.onclick = () => { color = (color + 1) % n; redraw(); }; body.append(c);
    row(body, { name: 'Купить автомобиль', desc: 'Попадёт в ваш гараж и будет ждать у входа', price: eco.price, disabled: state.money < eco.price, onClick: () => {
      state.money -= eco.price; const e = GA.addCar(type, color); G.pendingOwned = G.pendingOwned || []; G.pendingOwned.push(e); say('Куплено: ' + st.name + '! Машина ждёт на улице'); G.sfx?.('cash'); } });
  });
}

// ---------- Гараж ----------
export function openGarage(S) {
  GA.garageInit();
  openPanel('Гараж: мои машины', (body) => {
    if (!state.garage.length) body.append(el('div', 'p-empty', 'Гараж пуст. Купите машину в автосалоне.'));
    for (const e of state.garage) {
      const st = CAR_BY_ID[e.type], s = GA.entryState(e), cap = CAR_ECON[e.type]?.fuel ?? 50, wc = GA.worldCar(e);
      const wrap = el('div', 'p-car'); wrap.append(carThumb(e.type, s.color, 130));
      const info = el('div', 'p-name'); info.append(el('b', null, st.name), el('small', null, `${e.out ? 'на улице' : 'в гараже'} · состояние ${Math.round(GA.hpFrac(e) * 100)}% · топливо ${Math.round(s.fuel)}/${cap} л`)); wrap.append(info); body.append(wrap);
      const act = el('div', 'p-acts');
      const bt = (t, fn, dis) => { const b = el('button', 'btn small', t); if (dis) b.disabled = true; b.onclick = () => { fn(); redraw(); }; act.append(b); };
      if (!e.out) bt('Достать', () => { const sp = freeSpot(S?.ret || G.player); const v = GA.spawnOut(e, sp.x, sp.z, sp.ang); say(v ? 'Машина ждёт у входа' : 'Нет места'); G.sfx?.('ui'); });
      else if (wc && wc.driver !== 'player' && S && Math.hypot(wc.x - S.ret.x, wc.z - S.ret.z) < 80) bt('Сдать в гараж', () => { GA.storeVehicle(wc); say('Машина в гараже'); });
      bt(`Ремонт ${GA.repairCost(e).toLocaleString('ru-RU')} ₽`, () => say(GA.repair(e).msg), GA.repairCost(e) <= 0 || state.money < GA.repairCost(e));
      bt(`Заправка ${GA.fuelCost(e).toLocaleString('ru-RU')} ₽`, () => say(GA.refuel(e).msg), GA.fuelCost(e) <= 0 || state.money < GA.fuelCost(e));
      const ncol = A.m.vehicles.types[e.type].colors.length;
      bt(ncol > 1 ? 'Покраска 3500 ₽' : 'Цвет один', () => say(GA.paint(e).msg), state.money < 3500 || ncol <= 1);
      bt(`Продать ${GA.sellValue(e).toLocaleString('ru-RU')} ₽`, () => say(GA.sell(e).msg), !!wc && wc.driver === 'player');
      body.append(act);
    }
  });
}
// Свободная точка рядом со входом для появления машины
export function freeSpot(from) {
  const w = G.world;
  for (let r = 6; r <= 30; r += 3) for (let a = 0; a < 6.28; a += 0.5) {
    const x = from.x + Math.cos(a) * r, z = from.z + Math.sin(a) * r;
    if (w.solidAt(x, z) || w.solidAt(x + 2, z) || w.solidAt(x - 2, z) || w.solidAt(x, z + 2) || w.solidAt(x, z - 2)) continue;
    if (G.cars.some(c => Math.hypot(c.x - x, c.z - z) < 5)) continue;
    return { x, z, ang: Math.round(a / 1.57) * 1.57 };
  }
  return { x: from.x, z: from.z + 8, ang: 0 };
}

// ---------- Обработчик действий в интерьере ----------
G.onInteriorAct = (act, S) => {
  switch (act.type) {
    case 'shop': openShop(act.data.shop); break;
    case 'bank': case 'atm': openBank(); break;
    case 'hospital': openHospital(); break;
    case 'police': openPolice(); break;
    case 'bed': if (act.data.free) { state.health = state.maxHealth; G.msg('Вы отдохнули на койке', 2); G.sfx?.('ui'); } else openBed(); break;
    case 'buycar': openDealer(act.data.type); break;
    case 'garage': openGarage(S); break;
    case 'fridge': if (state.health >= state.maxHealth) G.msg('Вы не голодны', 1.5); else { state.health = Math.min(state.maxHealth, state.health + act.data.heal); G.msg('Вы перекусили (+' + act.data.heal + ')', 1.8); G.sfx?.('ui'); } break;
    case 'vending': { const r = buy(act.data.buy); G.msg(r.msg, 1.6); G.sfx?.(r.ok ? 'cash' : 'deny'); break; }
    default: if (act.data.msg) G.msg(act.data.msg, 3.5);
  }
};
G.openInventory = openInventory; G.openRealEstate = openRealEstate; G.quickHeal = () => { const r = quickHeal(); G.msg(r.msg, 1.8); G.sfx?.(r.ok ? 'ui' : 'deny'); };
G.outfitFilter = outfitFilter;
