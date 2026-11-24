// Игровые константы (оригинальные значения RetroCity сохранены; добавлены параметры физики)
export const CITY = {
  downtown:   { x: -400, z: -400, w: 500, d: 500, unlock: 0, name: 'Центральный район', color: 0x4455aa },
  residential:{ x: 150, z: -400, w: 450, d: 500, unlock: 1000000, name: 'Жилой район', color: 0x886644 },
  industrial: { x: -400, z: 150, w: 900, d: 400, unlock: 3000000, name: 'Промышленный район', color: 0x555555 },
};

export const WEAPONS = [
  { id: 'fists', name: 'Кулаки', damage: 8, range: 3, cooldown: 0.4, ammo: null, melee: true },
  { id: 'bat', name: 'Бита', damage: 18, range: 4, cooldown: 0.55, ammo: null, melee: true },
  { id: 'pistol', name: 'Аркадный пистолет', damage: 22, range: 40, cooldown: 0.35, ammo: 48, pickup: 24 },
  { id: 'smg', name: 'Автомат', damage: 12, range: 35, cooldown: 0.12, ammo: 90, pickup: 45, spread: 0.06 },
  { id: 'shotgun', name: 'Дробовик', damage: 35, range: 20, cooldown: 0.9, ammo: 24, pickup: 12, pellets: 5, spread: 0.16 },
  { id: 'special', name: 'Импульсный излучатель', damage: 45, range: 50, cooldown: 1.2, ammo: 12, pickup: 6, pierce: true },
];

// speed — макс. скорость (м/с), accel — разгон, turn — поворот (рад/с), hp, mass
export const CAR_TYPES = [
  { id: 'sedan', name: 'Городской седан', color: 0x3366aa, speed: 28, w: 2.2, h: 1.4, l: 4.5, accel: 13, turn: 2.1, hp: 100, mass: 1.0, weight: 18 },
  { id: 'sport', name: 'Спортивное купе', color: 0xcc2222, speed: 38, w: 2.1, h: 1.2, l: 4.3, accel: 18, turn: 2.4, hp: 80, mass: 0.9, weight: 5 },
  { id: 'taxi', name: 'Такси', color: 0xeebb00, speed: 26, w: 2.2, h: 1.5, l: 4.6, accel: 13, turn: 2.0, hp: 110, mass: 1.0, weight: 9 },
  { id: 'van', name: 'Фургон', color: 0x556677, speed: 22, w: 2.3, h: 2.0, l: 5.2, accel: 10, turn: 1.7, hp: 140, mass: 1.6, weight: 6 },
  { id: 'truck', name: 'Грузовик', color: 0x667744, speed: 18, w: 2.5, h: 2.4, l: 7.0, accel: 8, turn: 1.4, hp: 220, mass: 3.0, weight: 3 },
  { id: 'police', name: 'Полицейский седан', color: 0x2244aa, speed: 32, w: 2.2, h: 1.5, l: 4.6, accel: 17, turn: 2.3, hp: 120, mass: 1.1, weight: 0 },
  { id: 'bus', name: 'Автобус', color: 0xcc6622, speed: 16, w: 2.6, h: 2.8, l: 9.0, accel: 7, turn: 1.2, hp: 300, mass: 4.0, weight: 2 },
  { id: 'suv', name: 'Внедорожник', color: 0x445533, speed: 25, w: 2.3, h: 1.8, l: 4.8, accel: 12, turn: 1.9, hp: 150, mass: 1.5, weight: 8 },
  { id: 'muscle', name: 'Маслкар', color: 0xaa3322, speed: 34, w: 2.2, h: 1.3, l: 4.7, accel: 17, turn: 2.2, hp: 100, mass: 1.2, weight: 4 },
  { id: 'compact', name: 'Малютка', color: 0x44aa88, speed: 24, w: 1.9, h: 1.4, l: 3.6, accel: 12, turn: 2.3, hp: 70, mass: 0.7, weight: 12 },
  { id: 'tank', name: 'Игровой танк', color: 0x556644, speed: 12, w: 3.2, h: 2.2, l: 6.5, accel: 6, turn: 1.2, hp: 900, mass: 10, weight: 0, pivot: true },
  { id: 'moto', name: 'Мотоцикл', color: 0x222222, speed: 36, w: 0.8, h: 1.2, l: 2.2, accel: 20, turn: 3.0, hp: 40, mass: 0.3, weight: 3 },
  { id: 'fire', name: 'Пожарная', color: 0xcc2200, speed: 22, w: 2.5, h: 2.5, l: 7.5, accel: 9, turn: 1.4, hp: 250, mass: 3.5, weight: 1 },
  { id: 'ambulance', name: 'Скорая помощь', color: 0xffffff, speed: 30, w: 2.3, h: 2.2, l: 5.5, accel: 12, turn: 1.8, hp: 130, mass: 1.6, weight: 1 },
  { id: 'pickup', name: 'Пикап', color: 0x8a3322, speed: 27, w: 2.2, h: 1.8, l: 5.0, accel: 12, turn: 1.9, hp: 140, mass: 1.6, weight: 6 },
  { id: 'limo', name: 'Лимузин', color: 0x111111, speed: 26, w: 2.1, h: 1.5, l: 6.2, accel: 11, turn: 1.6, hp: 110, mass: 1.5, weight: 0 },
  { id: 'swat', name: 'Бронефургон SWAT', color: 0x222222, speed: 30, w: 2.4, h: 2.2, l: 5.4, accel: 13, turn: 1.8, hp: 250, mass: 2.2, weight: 0 },
  { id: 'mailvan', name: 'Почтовый фургон', color: 0xeecc22, speed: 22, w: 2.2, h: 2.1, l: 4.8, accel: 10, turn: 1.8, hp: 120, mass: 1.4, weight: 2 },
  { id: 'jeep', name: 'Армейский джип', color: 0x556644, speed: 30, w: 2.0, h: 1.6, l: 4.1, accel: 15, turn: 2.2, hp: 180, mass: 1.3, weight: 0 },
  { id: 'mtruck', name: 'Армейский грузовик', color: 0x556644, speed: 20, w: 2.6, h: 2.6, l: 7.4, accel: 9, turn: 1.4, hp: 350, mass: 4, weight: 0 },
  { id: 'apc', name: 'Бронетранспортёр', color: 0x556644, speed: 22, w: 2.9, h: 2.4, l: 6.4, accel: 8, turn: 1.3, hp: 700, mass: 7, weight: 0 },
];

// Цена в салоне (₽; null — не продаётся), ёмкость бака (л)
export const CAR_ECON = {
  compact: { price: 450000, fuel: 35 }, sedan: { price: 780000, fuel: 50 }, taxi: { price: 820000, fuel: 55 }, van: { price: 980000, fuel: 70 }, suv: { price: 1450000, fuel: 70 },
  muscle: { price: 2100000, fuel: 60 }, sport: { price: 3100000, fuel: 55 }, pickup: { price: 1250000, fuel: 75 }, truck: { price: 2400000, fuel: 120 }, moto: { price: 550000, fuel: 15 },
  limo: { price: 5200000, fuel: 80 }, mailvan: { price: 950000, fuel: 60 }, bus: { price: null, fuel: 150 }, police: { price: null, fuel: 55 }, fire: { price: null, fuel: 120 },
  ambulance: { price: null, fuel: 70 }, swat: { price: null, fuel: 80 }, jeep: { price: null, fuel: 60 }, mtruck: { price: null, fuel: 140 }, apc: { price: null, fuel: 160 }, tank: { price: null, fuel: 300 },
};

export const CAR_BY_ID = Object.fromEntries(CAR_TYPES.map(c => [c.id, c]));

// Вертолёты: параметры физики, топлива и стоимости сохранены в единой таблице.
export const HELICOPTER_TYPES = [
  { id: 'civil', name: 'Гражданский вертолёт', role: 'civil', maxSpeed: 54, acceleration: 18, turnRate: 1.15, climbRate: 11, hp: 180, fuelCap: 180, fuelBurn: 0.018, price: 3850000, color: '#9eb2c2' },
  { id: 'police', name: 'Полицейский вертолёт', role: 'police', maxSpeed: 62, acceleration: 20, turnRate: 1.28, climbRate: 12, hp: 220, fuelCap: 210, fuelBurn: 0.022, price: null, color: '#315ca8' },
  { id: 'service', name: 'Служебный вертолёт', role: 'service', maxSpeed: 58, acceleration: 19, turnRate: 1.22, climbRate: 12, hp: 200, fuelCap: 200, fuelBurn: 0.020, price: null, color: '#d6b96a' },
  { id: 'military', name: 'Военный вертолёт', role: 'military', maxSpeed: 66, acceleration: 21, turnRate: 1.34, climbRate: 13, hp: 320, fuelCap: 260, fuelBurn: 0.028, price: null, color: '#596849' },
  { id: 'transport', name: 'Транспортный вертолёт', role: 'transport', maxSpeed: 48, acceleration: 15, turnRate: 1.05, climbRate: 9, hp: 280, fuelCap: 300, fuelBurn: 0.026, price: 6200000, color: '#7d8b7a' },
];

export const HELICOPTER_BY_ID = Object.fromEntries(HELICOPTER_TYPES.map(h => [h.id, h]));

export const REAL_ESTATE = [
  { id: 'garage_flat', name: 'Квартира у центральной площади', district: 'downtown', price: 1850000, rent: 18000, income: 7500, pos: { x: 30, z: 30 } },
  { id: 'river_house', name: 'Дом у набережной', district: 'residential', price: 3200000, rent: 28000, income: 12000, pos: { x: 200, z: -100 } },
  { id: 'suburb_home', name: 'Пригородный коттедж', district: 'suburb', price: 2450000, rent: 22000, income: 9000, pos: { x: 500, z: 700 } },
  { id: 'mansion', name: 'Особняк в районе особняков', district: 'rich', price: 9800000, rent: 60000, income: 28000, pos: { x: -420, z: 520 } },
  { id: 'port_office', name: 'Офис в порту', district: 'port', price: 4600000, rent: 35000, income: 15000, pos: { x: 300, z: 260 } },
];
