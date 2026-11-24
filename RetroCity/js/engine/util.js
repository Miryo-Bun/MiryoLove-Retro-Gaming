// Общие утилиты RetroCity
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, dt, k) => a + (b - a) * (1 - Math.exp(-k * dt));
export function angNorm(a) { a %= TAU; if (a > Math.PI) a -= TAU; if (a < -Math.PI) a += TAU; return a; }
export const angDiff = (a, b) => angNorm(b - a);
export function turnToward(a, target, maxStep) {
  const d = angDiff(a, target);
  return Math.abs(d) <= maxStep ? target : a + Math.sign(d) * maxStep;
}
// Детерминированный ГПСЧ (mulberry32)
export function rng(seed) {
  let s = seed >>> 0;
  const f = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.int = (a, b) => a + Math.floor(f() * (b - a + 1));
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.chance = p => f() < p;
  return f;
}
export const hash2 = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const dist2 = (ax, az, bx, bz) => (ax - bx) ** 2 + (az - bz) ** 2;

// Равномерная сетка для быстрых запросов "кто рядом"
export class Grid {
  constructor(cell = 8) { this.cell = cell; this.map = new Map(); }
  clear() { this.map.clear(); }
  _k(cx, cz) { return cx * 73856093 ^ cz * 19349663; }
  add(e) {
    const k = this._k(Math.floor(e.x / this.cell), Math.floor(e.z / this.cell));
    let a = this.map.get(k); if (!a) { a = []; this.map.set(k, a); }
    a.push(e);
  }
  query(x, z, r, out = []) {
    out.length = 0;
    const c = this.cell, x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c), z0 = Math.floor((z - r) / c), z1 = Math.floor((z + r) / c);
    for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) {
      const a = this.map.get(this._k(i, j)); if (a) for (const e of a) out.push(e);
    }
    return out;
  }
}
