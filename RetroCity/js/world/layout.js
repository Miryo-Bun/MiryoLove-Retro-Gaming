// Схема районов расширенной карты. Сетка кварталов NK x NJ (квартал 12x12 тайлов = 48 м), дороги — на линиях решётки.
// Старая карта (центр, жилой, промзона, река, железная дорога) сохранена как есть и сдвинута на 8 кварталов вправо и 6 вниз,
// поэтому все мировые координаты (миссии, ориентиры) прежние.
export const NK = 36, NJ = 34;
export const DISTRICTS = {
  downtown:    { name: 'Центр города', color: '#5b6b8c' },
  residential: { name: 'Жилые кварталы', color: '#8a6a4c' },
  industrial:  { name: 'Промышленный район', color: '#6d6f73' },
  shopping:    { name: 'Торговый район', color: '#b0567a' },
  rich:        { name: 'Район особняков', color: '#4f9a5a' },
  suburb:      { name: 'Пригород', color: '#7aa05a' },
  airport:     { name: 'Аэропорт', color: '#8f9aa8' },
  port:        { name: 'Порт', color: '#4a7a9a' },
  military:    { name: 'Военная территория', color: '#6a7a4a' },
  rural:       { name: 'Сельская местность', color: '#8a9a4a' },
  yard:        { name: 'Железная дорога', color: '#7d7467' },
  river:       { name: 'Река', color: '#2b5f90' },
  bay:         { name: 'Залив', color: '#1f5080' },
};
export const URBAN = new Set(['downtown', 'residential', 'industrial', 'shopping', 'rich', 'suburb', 'airport', 'port', 'military']);
export const CLOSED = new Set(['airport', 'military']);   // внутри нет решётки улиц
export const ARTERIAL = [1, 3, 10, 16, 22, 31, 35];       // вертикальные линии, пересекающие железную дорогу
export const BRIDGES = [3, 10, 14, 18, 22, 27];           // горизонтальные линии с мостами через реку
export const RAIL_BLOCK_ROW = 16;

export function districtOfBlock(k, j) {
  if (k < 0 || j < 0 || k >= NK || j >= NJ) return 'rural';
  if (k >= 14 && k <= 22 && j >= 29) return 'bay';
  if (k === 18) return 'river';
  if (j === RAIL_BLOCK_ROW) return 'yard';
  if (k <= 7) return j >= 6 && j <= 15 ? 'shopping' : j >= 17 && j <= 25 ? 'suburb' : 'rural';
  if (k <= 17) return j <= 15 ? 'downtown' : j <= 25 ? 'industrial' : 'port';
  if (k <= 27) {
    if (j <= 15) return 'residential';
    if (j <= 25) return k <= 26 ? 'industrial' : 'rural';
    return k <= 22 ? 'port' : 'military';
  }
  if (j <= 5) return 'rural';
  if (j <= 15) return 'rich';
  if (j <= 25) return 'airport';
  return k <= 31 ? 'military' : 'rural';
}
export const blockOf = v => Math.floor((v - 5) / 12);

// Существует ли дорога на линии между двумя соседними кварталами
export function roadBetween(a, b) {
  if (a === 'bay' && b === 'bay') return false;
  if (a === 'river' && b === 'river') return false;
  if (CLOSED.has(a) && a === b) return false;
  if (a === 'yard' && b === 'yard') return false;
  if (a === 'bay' || b === 'bay') return URBAN.has(a) || URBAN.has(b);
  return URBAN.has(a) || URBAN.has(b);
}
