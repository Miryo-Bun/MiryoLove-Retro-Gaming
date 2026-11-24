// Ортографическая камера строго сверху: следит за целью, не выходит за границы мира.
import { clamp, smooth } from './util.js';
import { WORLD } from '../world/map.js';

export const BASE_PPM = 16; // пикселей на метр при zoom = 1 (масштаб тайлов)
export class Camera {
  constructor() { this.x = 0; this.z = 0; this.zoom = 1.25; this.target = 1.25; this.userZoom = 1; this.w = 800; this.h = 600; this.shake = 0; }
  get ppm() { return BASE_PPM * this.zoom; }
  resize(w, h) { this.w = w; this.h = h; }
  snap(x, z) { this.x = x; this.z = z; this.clampToWorld(); }
  follow(x, z, vx, vz, dt, driving, speed) {
    // Опережение по направлению движения; при езде камера отдаляется
    const look = driving ? 0.45 : 0.25;
    const tx = x + clamp(vx * look, -14, 14), tz = z + clamp(vz * look, -14, 14);
    this.x = smooth(this.x, tx, dt, 5); this.z = smooth(this.z, tz, dt, 5);
    const base = driving ? 0.95 - Math.min(0.28, speed / 120) : 1.25;
    this.target = base * this.userZoom;
    this.zoom = smooth(this.zoom, this.target, dt, 2.5);
    this.clampToWorld();
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3);
  }
  addZoom(d) { this.userZoom = clamp(this.userZoom * (d > 0 ? 0.9 : 1.1), 0.55, 1.8); }
  clampToWorld() {
    const hw = this.w / this.ppm / 2, hh = this.h / this.ppm / 2;
    const B = this.bounds || WORLD, mx = (B.x1 - B.x0) / 2, mz = (B.z1 - B.z0) / 2;
    this.x = hw >= mx ? (B.x0 + B.x1) / 2 : clamp(this.x, B.x0 + hw, B.x1 - hw);
    this.z = hh >= mz ? (B.z0 + B.z1) / 2 : clamp(this.z, B.z0 + hh, B.z1 - hh);
  }
  sx(x) { return Math.round((x - this.x) * this.ppm + this.w / 2); }
  sz(z) { return Math.round((z - this.z) * this.ppm + this.h / 2); }
  wx(px) { return (px - this.w / 2) / this.ppm + this.x; }
  wz(py) { return (py - this.h / 2) / this.ppm + this.z; }
  visible(x, z, r) {
    const hw = this.w / this.ppm / 2 + r, hh = this.h / this.ppm / 2 + r;
    return Math.abs(x - this.x) < hw && Math.abs(z - this.z) < hh;
  }
  halfDiag() { return Math.hypot(this.w, this.h) / 2 / this.ppm; }
}
