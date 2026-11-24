// Загрузка PNG-ресурсов и доступ к спрайтам
export const A = { m: null, tiles: null, props: null, veh: null, npcs: null, interior: null, heroes: {}, roofPat: {}, loaded: false };

function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Не загружен ' + src)); i.src = src; });
}

export async function loadAssets(progress) {
  const m = await (await fetch('assets/manifest.json')).json();
  A.m = m;
  const jobs = [
    ['tiles', m.tiles.file], ['props', m.props.file], ['veh', m.vehicles.file], ['npcs', m.npcs.file], ['interior', m.interior.file],
    ...Object.entries(m.heroes).map(([id, h]) => ['hero:' + id, h.file]),
  ];
  let done = 0;
  await Promise.all(jobs.map(async ([key, file]) => {
    const img = await loadImg('assets/' + file);
    if (key.startsWith('hero:')) A.heroes[key.slice(5)] = img; else A[key] = img;
    progress?.(++done / jobs.length, file);
  }));
  // Узоры крыш из тайлов
  const t = m.tiles, S = t.size;
  for (const name of Object.keys(t.index)) {
    if (!name.startsWith('roof_')) continue;
    const idx = t.index[name], c = document.createElement('canvas'); c.width = c.height = S;
    c.getContext('2d').drawImage(A.tiles, (idx % t.cols) * S, Math.floor(idx / t.cols) * S, S, S, 0, 0, S, S);
    A.roofPat[name] = c;
  }
  A.loaded = true;
}

export function tileSrc(name) {
  const t = A.m.tiles, i = t.index[name];
  return [(i % t.cols) * t.size, Math.floor(i / t.cols) * t.size, t.size, t.size];
}
export const propRect = name => A.m.props.items[name].rect;

// Кадры людей: 64x64, спрайты смотрят вправо (угол 0 = восток)
export const FRAME = 64;
export function heroFrame(id, anim, i) {
  const [row, n] = A.m.heroes[id].rows[anim];
  return [A.heroes[id], (Math.floor(i) % n) * FRAME, row * FRAME];
}
export function npcFrame(variant, anim, i) {
  const [col, n] = A.m.npcs.layout[anim];
  return [A.npcs, (col + (Math.floor(i) % n)) * FRAME, variant * FRAME];
}
export const heroFrames = (id, anim) => A.m.heroes[id].rows[anim][1];
export const npcFrames = anim => A.m.npcs.layout[anim][1];

export function vehicleSprite(type, colorIdx) {
  const t = A.m.vehicles.types[type];
  const c = t.colors[colorIdx % t.colors.length];
  return { rect: c.rect, name: c.name, info: t, count: t.colors.length };
}
