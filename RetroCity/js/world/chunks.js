// Рендер статичного мира кусками 8x8 тайлов (кэш холстов, 16 px/м).
import { A, tileSrc, propRect } from '../engine/assets.js';
import { T, TS, OX, OZ, W, H, CHUNK, CW, CH, shadowLen } from './map.js';
import { hash2 } from '../engine/util.js';
import { BKIND } from './buildings.js';

const PX = 16, TP = TS * PX, CP = CHUNK * TP; // px на метр, на тайл, на чанк
const ASPHALT = new Set([T.ROAD, T.BRIDGE_ROAD, T.CROSSING]);
const WHITE = '#e6e4d6';

function hull(pts) {
  pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of pts.slice().reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

export class WorldRenderer {
  constructor(world) { this.world = world; this.cache = new Map(); this.limit = 90; this.pat = {}; this.stats = { built: 0 }; }

  groundName(i) {
    const w = this.world, t = w.type[i];
    switch (t) {
      case T.GRASS: return hash2(i, 3) < 0.3 ? 'grass2' : 'grass';
      case T.PARK: return 'grass2';
      case T.SIDEWALK: case T.BRIDGE_WALK: return 'sidewalk';
      case T.PLAZA: return 'plaza';
      case T.PARKING: return 'parking';
      case T.CONCRETE: case T.PLATFORM: case T.BUILDING: return 'concrete';
      case T.DIRT: return 'dirt';
      case T.BALLAST: case T.RAIL: return 'ballast';
      case T.WATER: return 'water';
      case T.DEEP: return 'water_deep'; case T.FIELD1: return 'field_green'; case T.FIELD2: return 'field_gold'; case T.FIELD3: return 'field_plow';
      case T.LAWN: return 'lawn_rich'; case T.RUNWAY: return 'runway'; case T.APRON: return 'apron'; case T.SAND: return 'sand'; case T.QUAY: return 'quay';
      case T.POOL: return 'pool'; case T.MILPAD: return 'military_pad'; case T.BRICK: return 'brick'; case T.MALL: return 'tile_mall'; case T.DIRTROAD: return 'dirt_road';
      case T.RAIL_BRIDGE: return 'concrete';
      default: return ASPHALT.has(t) ? 'asphalt' : 'grass';
    }
  }

  chunk(ci, cj) {
    const key = cj * CW + ci, hit = this.cache.get(key);
    if (hit) { this.cache.delete(key); this.cache.set(key, hit); return hit; }
    const cv = document.createElement('canvas'); cv.width = cv.height = CP;
    this.render(cv.getContext('2d'), ci, cj);
    this.cache.set(key, cv); this.stats.built++;
    if (this.cache.size > this.limit) this.cache.delete(this.cache.keys().next().value);
    return cv;
  }

  render(g, ci, cj) {
    const w = this.world, c0 = ci * CHUNK, r0 = cj * CHUNK;
    g.imageSmoothingEnabled = false;
    // Земля
    for (let r = 0; r < CHUNK; r++) for (let c = 0; c < CHUNK; c++) {
      const cc = c0 + c, rr = r0 + r; if (cc >= W || rr >= H) continue;
      const i = rr * W + cc, [sx, sy, sw, sh] = tileSrc(this.groundName(i));
      g.drawImage(A.tiles, sx, sy, sw, sh, c * TP, r * TP, TP, TP);
      this.overlay(g, i, cc, rr, c * TP, r * TP);
    }
    // Тени и крыши
    const objs = w.chunks[cj * CW + ci], ox = OX + c0 * TS, oz = OZ + r0 * TS;
    g.save(); g.scale(PX, PX); g.translate(-ox, -oz);
    for (const b of objs.b) {
      const s = shadowLen(b), x0 = b.x, z0 = b.z, x1 = b.x + b.wm, z1 = b.z + b.dm;
      const pts = hull([[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0 + s.x, z0 + s.z], [x1 + s.x, z0 + s.z], [x1 + s.x, z1 + s.z], [x0 + s.x, z1 + s.z]]);
      g.fillStyle = 'rgba(10,12,20,0.32)'; g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
    }
    for (const b of objs.b) this.roof(g, b);
    g.restore();
    // Декор
    g.save(); g.scale(PX, PX); g.translate(-ox, -oz);
    for (const d of objs.d) {
      if (d.broken) { g.fillStyle = 'rgba(30,24,20,0.5)'; g.beginPath(); g.ellipse(d.x, d.z, 0.5, 0.35, 0, 0, 7); g.fill(); continue; }
      if (d.name[0] === '@') { this.special(g, d); continue; }
      const [sx, sy, sw, sh] = propRect(d.name); const m = d.s || 1;
      g.save(); g.translate(d.x, d.z); g.rotate(d.rot || 0); g.imageSmoothingEnabled = true; g.drawImage(A.props, sx, sy, sw, sh, -sw / PX / 2 * m, -sh / PX / 2 * m, sw / PX * m, sh / PX * m); g.restore();
    }
    g.restore();
  }

  special(g, d) {
    if (d.name === '@canopy') {
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(d.x + 0.8, d.z + 0.8, d.w, d.d);
      g.fillStyle = d.color; g.globalAlpha = 0.82; g.fillRect(d.x, d.z, d.w, d.d); g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(d.x, d.z, d.w, 0.5); g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.12; g.strokeRect(d.x, d.z, d.w, d.d);
      g.fillStyle = '#e8e8e8'; g.fillRect(d.x, d.z + d.d / 2 - 0.2, d.w, 0.4);
    } else if (d.name === '@runway') {
      g.fillStyle = '#e8e8e0';
      for (let x = d.x + 40; x < d.x + d.w - 40; x += 30) g.fillRect(x, d.z + d.d / 2 - 0.35, 16, 0.7);          // осевая
      for (let k = 0; k < 8; k++) { g.fillRect(d.x + 4, d.z + 2 + k * 3.4, 12, 1.4); g.fillRect(d.x + d.w - 16, d.z + 2 + k * 3.4, 12, 1.4); }   // пороги
      g.fillRect(d.x, d.z + 0.6, d.w, 0.35); g.fillRect(d.x, d.z + d.d - 0.95, d.w, 0.35);
      g.fillRect(d.x + 24, d.z + d.d / 2 - 3, 2, 6); g.fillRect(d.x + 28, d.z + d.d / 2 - 3, 2, 6);
    }
  }

  invalidate(x, z) {
    const c0 = Math.floor((x - 10 - OX) / TS / CHUNK), c1 = Math.floor((x + 10 - OX) / TS / CHUNK), r0 = Math.floor((z - 10 - OZ) / TS / CHUNK), r1 = Math.floor((z + 10 - OZ) / TS / CHUNK);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) this.cache.delete(r * CW + c);
  }

  roofPattern(g, name) {
    if (!this.pat[name]) this.pat[name] = g.createPattern(A.roofPat[name] || A.roofPat.roof_tar, 'repeat');
    return this.pat[name];
  }

  roof(g, b) {
    g.imageSmoothingEnabled = true;
    if (b.sprite) {
      const [sx, sy, sw, sh] = propRect(b.sprite);
      if (b.kind === 'silo') { g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(b.x + b.wm / 2 + 1.5, b.z + b.dm / 2 + 1.2, b.wm / 2, b.dm / 2, 0, 0, 7); g.fill(); g.drawImage(A.props, sx, sy, sw, sh, b.x - 0.2, b.z - 0.2, b.wm + 0.4, b.dm + 0.4); }
      else if (b.kind === 'plane') {
        const k = Math.min(b.wm / (sw / PX), b.dm / (sh / PX)), dw = sw / PX * k, dh = sh / PX * k, cx = b.x + b.wm / 2, cz = b.z + b.dm / 2;
        g.save(); g.globalAlpha = 0.22; g.fillStyle = '#000'; g.beginPath(); g.ellipse(cx + 2.2, cz + 1.6, dw * 0.42, dh * 0.12, 0, 0, 7); g.fill(); g.restore();
        g.drawImage(A.props, sx, sy, sw, sh, cx - dw / 2, cz - dh / 2, dw, dh);
      } else g.drawImage(A.props, sx, sy, sw, sh, b.x + 0.2, b.z + 0.3, b.wm - 0.4, b.dm - 0.6);
      g.imageSmoothingEnabled = false; return;
    }
    const x = b.x, z = b.z, w = b.wm, band = b.band || 0, d = b.dm - band, e = 0.55;   // d — высота крыши без фасадной полосы
    g.fillStyle = '#2a2d33'; g.fillRect(x, z, w, d);
    g.save(); g.beginPath(); g.rect(x + e, z + e, w - 2 * e, d - 2 * e); g.clip();
    g.translate(x, z); g.scale(1 / PX, 1 / PX); g.fillStyle = this.roofPattern(g, b.roof); g.fillRect(0, 0, w * PX, d * PX);
    g.restore();
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(x + e, z + e, w - 2 * e, 0.3); g.fillRect(x + e, z + e, 0.3, d - 2 * e);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + e, z + d - e - 0.35, w - 2 * e, 0.35); g.fillRect(x + w - e - 0.35, z + e, 0.35, d - 2 * e);
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.12; g.strokeRect(x, z, w, d);
    if (b.kind === 'house' || b.kind === 'farmhouse' || b.kind === 'mansion') {   // двускатная крыша
      const along = w >= d;
      g.fillStyle = 'rgba(0,0,0,0.18)'; if (along) g.fillRect(x + e, z + d / 2, w - 2 * e, d / 2 - e); else g.fillRect(x + w / 2, z + e, w / 2 - e, d - 2 * e);
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.15; g.beginPath(); if (along) { g.moveTo(x + e, z + d / 2); g.lineTo(x + w - e, z + d / 2); } else { g.moveTo(x + w / 2, z + e); g.lineTo(x + w / 2, z + d - e); } g.stroke();
    } else if (['tower', 'office', 'bank', 'hospital', 'mall'].includes(b.kind) && w > 12 && d > 10) {  // уступ верхнего этажа
      const m = 2.2; g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + m + 0.5, z + m + 0.6, w - 2 * m, d - 2 * m);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + m, z + m, w - 2 * m, d - 2 * m);
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.12; g.strokeRect(x + m, z + m, w - 2 * m, d - 2 * m);
    }
    if (b.kind === 'hospital') { const cx = x + w / 2, cz = z + d / 2; g.fillStyle = '#f4f4f4'; g.fillRect(cx - 2.4, cz - 2.4, 4.8, 4.8); g.fillStyle = '#d02a32'; g.fillRect(cx - 0.8, cz - 2, 1.6, 4); g.fillRect(cx - 2, cz - 0.8, 4, 1.6); }
    if (b.kind === 'police') { const cx = x + w / 2, cz = z + d / 2; g.fillStyle = '#20407c'; g.beginPath(); g.arc(cx, cz, 2.4, 0, 7); g.fill(); g.strokeStyle = '#e8d46a'; g.lineWidth = 0.25; g.stroke(); g.fillStyle = '#e8d46a'; g.beginPath(); g.arc(cx, cz, 0.8, 0, 7); g.fill(); }
    const cx = x + w / 2, cz = z + d / 2;
    for (const p of b.props) {
      const [sx, sy, sw, sh] = propRect(p.name), pw = sw / PX, ph = sh / PX;
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(cx + p.x - pw / 2 + 0.35, cz + p.z - ph / 2 + 0.35, pw, ph);
      g.drawImage(A.props, sx, sy, sw, sh, cx + p.x - pw / 2, cz + p.z - ph / 2, pw, ph);
    }
    if (band > 0) this.facade(g, b);
    g.imageSmoothingEnabled = false;
  }

  // Фасад: полоса южной стены с окнами, дверью, навесом, вывеской и балконами (камера по-прежнему строго сверху)
  facade(g, b) {
    const meta = BKIND[b.kind] || {}, x = b.x, h = b.band, z = b.z + b.dm - h, w = b.wm;
    g.fillStyle = b.wall || '#999'; g.fillRect(x, z, w, h);
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(x, z, w, 0.22);
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x, z + h - 0.35, w, 0.35);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, z + h * 0.55, w, h * 0.45);
    const dx = b.door ? b.door.x : -1e9, dw = 1.7;
    if (meta.roll) {   // рулонные ворота
      const gw = Math.min(w - 2, 5), gx = b.door ? dx - gw / 2 : x + (w - gw) / 2;
      g.fillStyle = '#6c6e70'; g.fillRect(gx, z + 0.3, gw, h - 0.5);
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.1; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(gx, z + 0.3 + (h - 0.5) * k / 6); g.lineTo(gx + gw, z + 0.3 + (h - 0.5) * k / 6); g.stroke(); }
    }
    // окна
    const step = b.kind === 'house' || b.kind === 'farmhouse' ? 2.6 : b.kind === 'block' ? 2.2 : 2.0, n = Math.max(1, Math.floor((w - 1.2) / step));
    const wh = Math.min(h * 0.46, 1.1), wy = z + h * 0.18;
    if (['shop', 'restaurant', 'mall', 'dealer', 'gas', 'carwash', 'bank'].includes(b.kind)) {
      const sw = Math.max(1, w - 1.2);
      g.fillStyle = b.win; g.fillRect(x + 0.6, wy + 0.1, sw, h * 0.52); g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(x + 0.6, wy + 0.1, sw, 0.18);
      g.strokeStyle = 'rgba(30,30,40,0.5)'; g.lineWidth = 0.1; for (let k = 1; k < Math.floor(sw / 1.6); k++) { g.beginPath(); g.moveTo(x + 0.6 + k * 1.6, wy + 0.1); g.lineTo(x + 0.6 + k * 1.6, wy + 0.1 + h * 0.52); g.stroke(); }
    } else if (!meta.roll) {
      for (let k = 0; k < n; k++) {
        const wx = x + 0.6 + (w - 1.2) * (k + 0.5) / n - 0.5;
        if (Math.abs(wx + 0.5 - dx) < dw * 0.9) continue;
        g.fillStyle = b.win; g.fillRect(wx, wy, 1.0, wh); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(wx, wy + wh - 0.12, 1.0, 0.12); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(wx, wy, 1.0, 0.14);
        if (meta.balcony && h > 2) { g.fillStyle = '#c4bcb0'; g.fillRect(wx - 0.15, wy + wh + 0.05, 1.3, 0.4); g.strokeStyle = '#6a645c'; g.lineWidth = 0.08; g.strokeRect(wx - 0.15, wy + wh + 0.05, 1.3, 0.4); }
      }
    }
    if (meta.columns) { g.fillStyle = '#efe9db'; for (let cxx = x + 0.4; cxx < x + w - 0.3; cxx += Math.max(2.4, w / 6)) g.fillRect(cxx, z + 0.2, 0.4, h - 0.3); }
    if (meta.awning) { for (let k = 0, xx = x + 0.2; xx < x + w - 0.4; xx += 0.9, k++) { g.fillStyle = k % 2 ? '#f2eee6' : (b.signColor || '#b03030'); g.fillRect(xx, z + 0.05, Math.min(0.9, x + w - 0.2 - xx), 0.55); } }
    // дверь
    if (b.door) {
      g.fillStyle = '#2a2d33'; g.fillRect(dx - dw / 2, z + h * 0.2, dw, h * 0.8);
      g.fillStyle = 'rgba(150,200,230,0.75)'; g.fillRect(dx - dw / 2 + 0.12, z + h * 0.2 + 0.1, dw / 2 - 0.16, h * 0.8 - 0.1); g.fillRect(dx + 0.04, z + h * 0.2 + 0.1, dw / 2 - 0.16, h * 0.8 - 0.1);
      g.fillStyle = 'rgba(255,214,0,0.85)'; g.fillRect(dx - 0.18, z + h - 0.28, 0.36, 0.2);
    }
    // вывеска
    if (b.sign && w >= 5) {
      const txt = b.sign, fs = Math.min(9, 8 + (w > 14 ? 1 : 0)), tw = Math.min(w - 1, txt.length * 0.62 + 1.2);
      g.fillStyle = b.signColor || '#444'; g.fillRect(x + w / 2 - tw / 2 + (b.door ? Math.max(-w / 2 + tw / 2 + 0.3, Math.min(w / 2 - tw / 2 - 0.3, dx - (x + w / 2))) : 0), z - 0.55, tw, 0.85);
      g.save(); g.translate(x + w / 2 + (b.door ? Math.max(-w / 2 + tw / 2 + 0.3, Math.min(w / 2 - tw / 2 - 0.3, dx - (x + w / 2))) : 0), z - 0.12); g.scale(1 / PX, 1 / PX);
      g.font = `bold ${fs}px monospace`; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(txt, 0, 3); g.restore();
    }
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.1; g.strokeRect(x, z, w, h);
  }

  overlay(g, i, c, r, px, py) {
    const w = this.world, t = w.type[i], rd = w.rd[i], xw = w.xw[i];
    const fx = v => (v === T.DEEP ? T.WATER : v);
    const N = r > 0 ? fx(w.type[i - W]) : T.WATER, S = r < H - 1 ? fx(w.type[i + W]) : T.WATER, Wt = c > 0 ? fx(w.type[i - 1]) : T.WATER, E = c < W - 1 ? fx(w.type[i + 1]) : T.WATER;
    g.save(); g.translate(px, py);
    if (ASPHALT.has(t) && rd >= 1 && rd <= 4) {
      g.fillStyle = WHITE;
      if (!xw && t !== T.CROSSING || t === T.CROSSING) {
        if (rd === 1) for (const y of [4, 36]) g.fillRect(TP - 2, y, 2, 22);
        else if (rd === 2) for (const y of [4, 36]) g.fillRect(0, y, 2, 22);
        else if (rd === 3) for (const x of [4, 36]) g.fillRect(x, TP - 2, 22, 2);
        else for (const x of [4, 36]) g.fillRect(x, 0, 22, 2);
      }
      if (xw === 1) { g.fillStyle = WHITE; for (let k = 0; k < 4; k++) g.fillRect(4 + k * 14, 9, 8, TP - 18);
        const SW = r < H - 1 ? w.rd[i + W] : 0, NW = r > 0 ? w.rd[i - W] : 0;
        if (rd === 1 && SW === 5) g.fillRect(0, 0, TP, 5); if (rd === 2 && NW === 5) g.fillRect(0, TP - 5, TP, 5); }
      if (xw === 2) { g.fillStyle = WHITE; for (let k = 0; k < 4; k++) g.fillRect(9, 4 + k * 14, TP - 18, 8);
        const EW = c < W - 1 ? w.rd[i + 1] : 0, WW = c > 0 ? w.rd[i - 1] : 0;
        if (rd === 3 && WW === 5) g.fillRect(TP - 5, 0, 5, TP); if (rd === 4 && EW === 5) g.fillRect(0, 0, 5, TP); }
    }
    if (t === T.SIDEWALK || t === T.BRIDGE_WALK || t === T.PLAZA) {
      const curb = (nt, nxw, rect) => { if (ASPHALT.has(nt) && !nxw) { g.fillStyle = '#c3c1b7'; g.fillRect(...rect[0]); g.fillStyle = '#5d5c58'; g.fillRect(...rect[1]); } };
      curb(N, r > 0 && w.xw[i - W], [[0, 0, TP, 4], [0, 0, TP, 1.5]]); curb(S, r < H - 1 && w.xw[i + W], [[0, TP - 4, TP, 4], [0, TP - 1.5, TP, 1.5]]);
      curb(Wt, c > 0 && w.xw[i - 1], [[0, 0, 4, TP], [0, 0, 1.5, TP]]); curb(E, c < W - 1 && w.xw[i + 1], [[TP - 4, 0, 4, TP], [TP - 1.5, 0, 1.5, TP]]);
    }
    // Набережные и перила у воды
    if (t !== T.WATER && t !== T.DEEP && t !== T.BRIDGE_ROAD && t !== T.RAIL_BRIDGE && t !== T.QUAY) {
      const rail = (nt, rect) => {
        if (nt !== T.WATER) return;
        const walkway = t === T.SIDEWALK || t === T.BRIDGE_WALK;
        g.fillStyle = walkway ? '#4c535b' : '#2f4a35'; g.fillRect(...rect);
        if (walkway) { g.fillStyle = '#9aa3ac'; const [x, y, ww, hh] = rect; if (ww > hh) for (let k = 0; k < 4; k++) g.fillRect(x + k * 16 + 6, y - 1, 3, hh + 2); else for (let k = 0; k < 4; k++) g.fillRect(x - 1, y + k * 16 + 6, ww + 2, 3); }
      };
      rail(N, [0, 0, TP, 3]); rail(S, [0, TP - 3, TP, 3]); rail(Wt, [0, 0, 3, TP]); rail(E, [TP - 3, 0, 3, TP]);
    }
    if (t === T.WATER || t === T.DEEP) {   // тень от моста
      g.fillStyle = 'rgba(0,10,25,0.35)';
      if (N === T.BRIDGE_WALK || N === T.RAIL_BRIDGE) g.fillRect(0, 0, TP, 9); if (S === T.BRIDGE_WALK || S === T.RAIL_BRIDGE) g.fillRect(0, TP - 9, TP, 9);
    }
    if (t === T.BRIDGE_ROAD) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, 0, TP, TP); }
    if (t === T.RAIL || t === T.RAIL_BRIDGE || t === T.CROSSING) {
      if (t === T.RAIL_BRIDGE) { g.fillStyle = '#3d444c'; g.fillRect(0, 0, TP, TP); g.fillStyle = '#2b3036'; g.fillRect(0, 0, TP, 3); g.fillRect(0, TP - 3, TP, 3); for (let x = 8; x < TP; x += 32) g.fillRect(x, 0, 2, TP); }
      if (t !== T.CROSSING) { g.fillStyle = '#4b3a28'; for (let x = 0; x < TP; x += 12) g.fillRect(x + 3, 5, 6, TP - 10); }
      else { g.fillStyle = '#6c5b46'; g.fillRect(0, 12, TP, 8); g.fillRect(0, 44, TP, 8); }
      g.fillStyle = '#1d1f22'; g.fillRect(0, 17, TP, 5); g.fillRect(0, 42, TP, 5);
      g.fillStyle = '#b4bac1'; g.fillRect(0, 18, TP, 2); g.fillRect(0, 43, TP, 2);
    }
    if (t === T.PLATFORM) {
      g.fillStyle = '#e1c12a'; if (S === T.RAIL || S === T.BALLAST) g.fillRect(0, TP - 6, TP, 4); if (N === T.RAIL || N === T.BALLAST) g.fillRect(0, 2, TP, 4);
    }
    g.restore();
  }

  // Видимые чанки на экран
  drawGround(ctx, cam) {
    const ppm = cam.ppm, x0 = cam.wx(0), z0 = cam.wz(0), x1 = cam.wx(cam.w), z1 = cam.wz(cam.h);
    const c0 = Math.max(0, Math.floor((x0 - OX) / TS / CHUNK)), c1 = Math.min(CW - 1, Math.floor((x1 - OX) / TS / CHUNK));
    const r0 = Math.max(0, Math.floor((z0 - OZ) / TS / CHUNK)), r1 = Math.min(CH - 1, Math.floor((z1 - OZ) / TS / CHUNK));
    ctx.imageSmoothingEnabled = ppm / PX < 0.999 || Math.abs(ppm / PX - Math.round(ppm / PX)) > 0.01;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const cv = this.chunk(c, r), sx = cam.sx(OX + c * CHUNK * TS), sz = cam.sz(OZ + r * CHUNK * TS);
      const ex = cam.sx(OX + (c + 1) * CHUNK * TS), ez = cam.sz(OZ + (r + 1) * CHUNK * TS);
      ctx.drawImage(cv, sx, sz, ex - sx, ez - sz);
    }
    // Мерцание воды
    const t = performance.now() / 1000, rip = tileSrc('ripple');
    const tc0 = Math.max(0, Math.floor((x0 - OX) / TS)), tc1 = Math.min(W - 1, Math.floor((x1 - OX) / TS)), tr0 = Math.max(0, Math.floor((z0 - OZ) / TS)), tr1 = Math.min(H - 1, Math.floor((z1 - OZ) / TS));
    ctx.globalAlpha = 0.5; const ty = this.world.type;
    for (let r = tr0; r <= tr1; r++) for (let c = tc0; c <= tc1; c++) {
      const tt = ty[r * W + c]; if (tt !== T.WATER && tt !== T.DEEP) continue;
      if (hash2(c + Math.floor(t * 0.8), r - Math.floor(t * 0.6)) < 0.5) continue;
      const sx = cam.sx(OX + c * TS), sz = cam.sz(OZ + r * TS), ex = cam.sx(OX + (c + 1) * TS), ez = cam.sz(OZ + (r + 1) * TS);
      ctx.drawImage(A.tiles, rip[0], rip[1], rip[2], rip[3], sx, sz, ex - sx, ez - sz);
    }
    ctx.globalAlpha = 1;
  }
}
