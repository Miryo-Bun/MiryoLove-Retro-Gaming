// Экономика: каталог товаров, магазины, инвентарь, покупка и использование предметов.
import { G, state } from './state.js';
import { WEAPONS } from './data.js';

// type: consumable (лечит/баффы), gear (ремкомплект, канистра), weapon, ammo, outfit (одежда), armor
export const ITEMS = {
  sandwich: { name: 'Бутерброд', desc: '+12 здоровья', price: 180, cat: 'Еда', type: 'consumable', heal: 12 },
  burger: { name: 'Бургер', desc: '+22 здоровья', price: 320, cat: 'Еда', type: 'consumable', heal: 22 },
  pizza: { name: 'Кусок пиццы', desc: '+28 здоровья', price: 390, cat: 'Еда', type: 'consumable', heal: 28 },
  salad: { name: 'Салат', desc: '+10 здоровья', price: 270, cat: 'Еда', type: 'consumable', heal: 10 },
  water: { name: 'Вода', desc: '+3 здоровья', price: 80, cat: 'Напитки', type: 'consumable', heal: 3 },
  cola: { name: 'Кола', desc: '+5 здоровья, небольшой разгон 20 с', price: 120, cat: 'Напитки', type: 'consumable', heal: 5, buff: { speed: 1.1, sec: 20 } },
  energy: { name: 'Энергетик', desc: 'Скорость ×1.25 на 60 с', price: 220, cat: 'Напитки', type: 'consumable', heal: 0, buff: { speed: 1.25, sec: 60 } },
  coffee: { name: 'Кофе', desc: '+8 здоровья', price: 160, cat: 'Напитки', type: 'consumable', heal: 8 },
  bandage: { name: 'Бинты', desc: '+25 здоровья', price: 320, cat: 'Медицина', type: 'consumable', heal: 25 },
  medkit: { name: 'Аптечка', desc: '+60 здоровья', price: 950, cat: 'Медицина', type: 'consumable', heal: 60 },
  painkillers: { name: 'Обезболивающее', desc: 'Урон −25% на 90 с, +10 здоровья', price: 480, cat: 'Медицина', type: 'consumable', heal: 10, buff: { armor: 0.75, sec: 90 } },
  cap: { name: 'Кепка', desc: 'Образ: яркий оттенок', price: 700, cat: 'Одежда', type: 'outfit', filter: 'hue-rotate(40deg) saturate(1.2)' },
  jacket_red: { name: 'Красная куртка', desc: 'Образ: красные тона', price: 2400, cat: 'Одежда', type: 'outfit', filter: 'hue-rotate(-30deg) saturate(1.6)' },
  jacket_blue: { name: 'Синяя куртка', desc: 'Образ: синие тона', price: 2400, cat: 'Одежда', type: 'outfit', filter: 'hue-rotate(170deg) saturate(1.3)' },
  jacket_green: { name: 'Зелёная куртка', desc: 'Образ: зелёные тона', price: 2400, cat: 'Одежда', type: 'outfit', filter: 'hue-rotate(90deg) saturate(1.3)' },
  jacket_black: { name: 'Чёрная куртка', desc: 'Образ: тёмный стиль', price: 3200, cat: 'Одежда', type: 'outfit', filter: 'brightness(0.55) saturate(0.7)' },
  sneakers: { name: 'Кроссовки', desc: 'Постоянно: скорость +6%', price: 3800, cat: 'Одежда', type: 'gear', perm: { speed: 1.06 } },
  vest: { name: 'Бронежилет', desc: 'Поглощает 60 урона', price: 12500, cat: 'Защита', type: 'armor', armor: 60 },
  bat: { name: 'Бита', desc: 'Оружие ближнего боя', price: 1400, cat: 'Оружие', type: 'weapon', weapon: 'bat' },
  pistol: { name: 'Аркадный пистолет', desc: 'Оружие + 24 патрона', price: 9800, cat: 'Оружие', type: 'weapon', weapon: 'pistol', ammo: 24 },
  smg: { name: 'Автомат', desc: 'Оружие + 45 патронов', price: 28000, cat: 'Оружие', type: 'weapon', weapon: 'smg', ammo: 45 },
  shotgun: { name: 'Дробовик', desc: 'Оружие + 12 патронов', price: 35000, cat: 'Оружие', type: 'weapon', weapon: 'shotgun', ammo: 12 },
  special: { name: 'Импульсный излучатель', desc: 'Оружие + 6 зарядов', price: 95000, cat: 'Оружие', type: 'weapon', weapon: 'special', ammo: 6 },
  ammo_pistol: { name: 'Патроны (пистолет) ×24', desc: '+24 патрона', price: 900, cat: 'Боеприпасы', type: 'ammo', weapon: 'pistol', ammo: 24 },
  ammo_smg: { name: 'Патроны (автомат) ×45', desc: '+45 патронов', price: 2300, cat: 'Боеприпасы', type: 'ammo', weapon: 'smg', ammo: 45 },
  ammo_shotgun: { name: 'Патроны (дробовик) ×12', desc: '+12 патронов', price: 1800, cat: 'Боеприпасы', type: 'ammo', weapon: 'shotgun', ammo: 12 },
  ammo_special: { name: 'Заряды излучателя ×6', desc: '+6 зарядов', price: 8600, cat: 'Боеприпасы', type: 'ammo', weapon: 'special', ammo: 6 },
  repairkit: { name: 'Ремкомплект', desc: 'Чинит транспорт на 50%', price: 2200, cat: 'Оборудование', type: 'gear', use: 'repair' },
  jerrycan: { name: 'Канистра', desc: '+25 л топлива в бак', price: 900, cat: 'Оборудование', type: 'gear', use: 'fuel' },
  meal_pizza: { name: 'Пицца целая', desc: '+40 здоровья (съесть сразу)', price: 650, cat: 'Меню', type: 'consumable', heal: 40, instant: true },
  meal_burger: { name: 'Бургер-комбо', desc: '+35 здоровья', price: 520, cat: 'Меню', type: 'consumable', heal: 35, instant: true },
  meal_steak: { name: 'Стейк', desc: '+60 здоровья', price: 980, cat: 'Меню', type: 'consumable', heal: 60, instant: true },
  drink_juice: { name: 'Сок', desc: '+8 здоровья', price: 180, cat: 'Меню', type: 'consumable', heal: 8, instant: true },
  drink_coffee: { name: 'Кофе', desc: '+8 здоровья, разгон 30 с', price: 160, cat: 'Меню', type: 'consumable', heal: 8, instant: true, buff: { speed: 1.1, sec: 30 } },
};
export const SHOPS = {
  grocery: { name: 'Продукты', items: ['sandwich', 'burger', 'pizza', 'salad', 'water', 'cola', 'energy', 'coffee'] },
  pharmacy: { name: 'Аптека', items: ['bandage', 'medkit', 'painkillers', 'water', 'vest'] },
  clothes: { name: 'Одежда', items: ['cap', 'jacket_red', 'jacket_blue', 'jacket_green', 'jacket_black', 'sneakers', 'vest'] },
  guns: { name: 'Оружейный магазин', items: ['pistol', 'smg', 'shotgun', 'special', 'ammo_pistol', 'ammo_smg', 'ammo_shotgun', 'ammo_special', 'vest'] },
  hardware: { name: 'Хозтовары', items: ['bat', 'repairkit', 'jerrycan', 'energy', 'bandage'] },
  gas: { name: 'АЗС-магазин', items: ['sandwich', 'water', 'cola', 'energy', 'coffee', 'jerrycan', 'repairkit'] },
  restaurant: { name: 'Меню', items: ['meal_pizza', 'meal_burger', 'meal_steak', 'drink_juice', 'drink_coffee'] },
};

export function invInit() { state.inventory = state.inventory || {}; state.outfit = state.outfit || null; state.armor = state.armor || 0; state.bank = state.bank || 0; state.perm = state.perm || {}; state.buffs = state.buffs || {}; }
export const invCount = id => (state.inventory?.[id] || 0);
export function invAdd(id, n = 1) { invInit(); state.inventory[id] = (state.inventory[id] || 0) + n; if (state.inventory[id] <= 0) delete state.inventory[id]; }

// Множители состояния (бонусы/баффы)
export function speedMul() {
  let m = 1; const now = G.time;
  for (const [k, b] of Object.entries(state.buffs || {})) if (b.speed && b.until > now) m *= b.speed;
  for (const v of Object.values(state.perm || {})) if (v.speed) m *= v.speed;
  return m;
}
export function damageMul() { let m = 1; const now = G.time; for (const b of Object.values(state.buffs || {})) if (b.armor && b.until > now) m *= b.armor; return m; }
export function activeBuffs() { const now = G.time; return Object.entries(state.buffs || {}).filter(([k, b]) => b.until > now); }

function applyConsumable(it) {
  state.health = Math.min(state.maxHealth, state.health + (it.heal || 0));
  if (it.buff) { state.buffs[it.name] = { ...it.buff, until: G.time + it.buff.sec }; }
}

// Покупка. Возвращает {ok, msg}
export function buy(id) {
  invInit(); const it = ITEMS[id]; if (!it) return { ok: false, msg: 'Нет такого товара' };
  if (state.money < it.price) return { ok: false, msg: 'Недостаточно денег' };
  if (it.type === 'weapon' && state.ownedWeapons.includes(it.weapon) && !it.ammo) return { ok: false, msg: 'Уже есть' };
  if (it.type === 'gear' && it.perm && state.perm[id]) return { ok: false, msg: 'Уже куплено' };
  state.money -= it.price;
  if (it.instant) { applyConsumable(it); return { ok: true, msg: 'Съедено: ' + it.name }; }
  if (it.type === 'weapon') {
    if (!state.ownedWeapons.includes(it.weapon)) state.ownedWeapons.push(it.weapon);
    if (it.ammo) state.ammo[it.weapon] = (state.ammo[it.weapon] || 0) + it.ammo;
    G.updateWeaponHUD?.(); return { ok: true, msg: 'Куплено: ' + it.name };
  }
  if (it.type === 'ammo') { state.ammo[it.weapon] = (state.ammo[it.weapon] || 0) + it.ammo; G.updateWeaponHUD?.(); return { ok: true, msg: '+ патроны' }; }
  if (it.type === 'armor') { state.armor = Math.min(100, (state.armor || 0) + it.armor); return { ok: true, msg: 'Бронежилет надет (' + state.armor + ')' }; }
  if (it.type === 'gear' && it.perm) { state.perm[id] = it.perm; return { ok: true, msg: 'Куплено: ' + it.name }; }
  invAdd(id, 1); return { ok: true, msg: 'В инвентаре: ' + it.name };
}

// Использование предмета из инвентаря. Возвращает {ok,msg}
export function useItem(id) {
  const it = ITEMS[id]; if (!it || invCount(id) <= 0) return { ok: false, msg: 'Нет предмета' };
  if (it.type === 'consumable') {
    if (it.heal && state.health >= state.maxHealth && !it.buff) return { ok: false, msg: 'Здоровье полное' };
    applyConsumable(it); invAdd(id, -1); return { ok: true, msg: it.name + ' использовано' };
  }
  if (it.type === 'outfit') { state.outfit = id; return { ok: true, msg: 'Образ: ' + it.name }; }
  if (it.use === 'repair') {
    const v = G.player.inVehicle || G.cars.find(c => !c.wreck && Math.hypot(c.x - G.player.x, c.z - G.player.z) < 5);
    if (!v) return { ok: false, msg: 'Рядом нет машины' };
    if (v.hp >= v.maxHp) return { ok: false, msg: 'Машина цела' };
    v.hp = Math.min(v.maxHp, v.hp + v.maxHp * 0.5); v.wreck = false; invAdd(id, -1); return { ok: true, msg: 'Машина отремонтирована' };
  }
  if (it.use === 'fuel') {
    const v = G.player.inVehicle || G.cars.find(c => !c.wreck && Math.hypot(c.x - G.player.x, c.z - G.player.z) < 5);
    if (!v) return { ok: false, msg: 'Рядом нет машины' };
    if (v.fuel >= v.fuelCap - 1) return { ok: false, msg: 'Бак полон' };
    v.fuel = Math.min(v.fuelCap, v.fuel + 25); invAdd(id, -1); return { ok: true, msg: 'Заправлено +25 л' };
  }
  return { ok: false, msg: 'Нельзя использовать' };
}
// Быстрое лечение (клавиша H): сначала аптечка, затем бинты
export function quickHeal() {
  for (const id of ['medkit', 'bandage', 'painkillers']) if (invCount(id) > 0) return useItem(id);
  return { ok: false, msg: 'Нет аптечек (магазин: аптека)' };
}
export function outfitFilter() { return state.outfit ? ITEMS[state.outfit]?.filter : null; }
export function pruneBuffs() { const now = G.time; for (const k of Object.keys(state.buffs || {})) if (state.buffs[k].until <= now) delete state.buffs[k]; }
