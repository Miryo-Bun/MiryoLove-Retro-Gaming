// Отрисовка кадра: вид строго сверху, ортографическая камера, слои от земли к кронам.
import { G, state } from './state.js';
import { A, propRect } from './engine/assets.js';
import { drawPerson, drawPersonShadow } from './entities/person.js';
import { drawPickups } from './systems/pickups.js';
import { drawTrains, drawGates } from './systems/trains.js';
import { lightState } from './systems/traffic.js';
import { CHUNK, CW, CH, OX, OZ, TS } from './world/map.js';
import { clamp, hash2 } from './engine/util.js';

export function nightFactor(t = state.dayTime) {
  if (t >= 6 && t <= 18) return 0;
  if (t > 18 && t < 20.5) return (t - 18) / 2.5;
  if (t >= 20.5 || t < 4) return 1;
  return 1 - (t - 4) / 2;   // 4..6 рассвет
}
export function missionTarget() {
  const m = state.missionMgr?.current; if (!m) return null;
  if (m.type === 'race') return m.targets[Math.min(state.missionMgr.stage, m.targets.length - 1)];
  return m.target || null;
}

function visibleChunks(cam) {
  const c0 = Math.max(0, Math.floor((cam.wx(0) - OX) / TS / CHUNK) - 0), c1 = Math.min(CW - 1, Math.floor((cam.wx(cam.w) - OX) / TS / CHUNK));
  const r0 = Math.max(0, Math.floor((cam.wz(0) - OZ) / TS / CHUNK)), r1 = Math.min(CH - 1, Math.floor((cam.wz(cam.h) - OZ) / TS / CHUNK));
  const out = []; for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push(G.world.chunks[r * CW + c]);
  return out;
}

function drawDoor(ctx, cam, v, open) {
  const s = v.stats, k = cam.ppm;
  ctx.save(); ctx.translate(cam.sx(v.x), cam.sz(v.z)); ctx.rotate(v.ang);
  ctx.translate((s.l * 0.08 + 0.55) * k, -s.w / 2 * k);
  ctx.rotate(open * 1.15);
  ctx.fillStyle = '#1b1e24'; ctx.fillRect(-1.25 * k, -0.07 * k, 1.25 * k, 0.16 * k);
  ctx.fillStyle = 'rgba(180,200,230,0.55)'; ctx.fillRect(-1.0 * k, -0.04 * k, 0.8 * k, 0.1 * k);
  ctx.restore();
}

export function renderFrame(ctx, cam, dt, time) {
  const w = G.world, p = G.player, k = cam.ppm;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0a0d14'; ctx.fillRect(0, 0, cam.w, cam.h);
  ctx.save();
  if (cam.shake > 0) ctx.translate((Math.random() - 0.5) * cam.shake * 8, (Math.random() - 0.5) * cam.shake * 8);
  G.renderer.drawGround(ctx, cam);
  const chunks = visibleChunks(cam);

  // Метка миссии под сущностями
  const tg = missionTarget();
  if (tg && cam.visible(tg.x, tg.z, 14)) {
    const pulse = 1 + Math.sin(time * 4) * 0.04, r = 12 * k * pulse, x = cam.sx(tg.x), z = cam.sz(tg.z);
    ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.arc(x, z, r, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -time * 20; ctx.beginPath(); ctx.arc(x, z, r, 0, 7); ctx.stroke(); ctx.restore();
  }

  // Следы взрывов (гарь)
  for (const dc of G.decals || []) {
    if (!cam.visible(dc.x, dc.z, dc.r + 2)) continue;
    const x = cam.sx(dc.x), z = cam.sz(dc.z), rr = dc.r * k, gr = ctx.createRadialGradient(x, z, rr * 0.1, x, z, rr);
    gr.addColorStop(0, 'rgba(8,6,5,0.62)'); gr.addColorStop(0.7, 'rgba(15,12,10,0.38)'); gr.addColorStop(1, 'rgba(15,12,10,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, z, rr, 0, 7); ctx.fill();
  }
  // Тени (деревья, люди, машины)
  ctx.imageSmoothingEnabled = true;
  for (const ch of chunks) for (const t of ch.t) {
    if (t._f === G.frame) continue; t._f = G.frame;
    const [sx, sy, sw, sh] = propRect(t.kind), s = k / 16 * t.s;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(cam.sx(t.x) + 0.9 * k, cam.sz(t.z) + 0.8 * k, sw * s * 0.42, sh * s * 0.4, 0, 0, 7); ctx.fill();
  }
  for (const v of G.cars) if (cam.visible(v.x, v.z, v.stats.l)) v.drawShadow(ctx, cam);
  for (const h of G.helicopters || []) if (cam.visible(h.x, h.z, 8)) h.draw(ctx, cam);
  for (const q of G.peds) if (!q.dead && cam.visible(q.x, q.z, 2)) drawPersonShadow(ctx, cam, q);
  if (!p.inVehicle && !p.dead && !p.hidden) {
    drawPersonShadow(ctx, cam, p);
    ctx.strokeStyle = 'rgba(255,214,0,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cam.sx(p.x), cam.sz(p.z), 0.9 * k, 0.9 * k, 0, 0, 7); ctx.stroke();   // метка игрока
  }

  drawPickups(ctx, cam, time);
  // Тела
  for (const q of G.peds) if (q.dead && cam.visible(q.x, q.z, 2)) drawPerson(ctx, cam, q, { alpha: clamp((18 - q.deadT) / 4, 0, 1) });
  // Машины
  for (const v of G.cars) {
    if (!cam.visible(v.x, v.z, v.stats.l)) continue;
    if (v.fade !== undefined) ctx.globalAlpha = Math.max(0, v.fade);
    v.draw(ctx, cam); ctx.globalAlpha = 1;
    if (v.braking && !v.wreck) { ctx.save(); ctx.translate(cam.sx(v.x), cam.sz(v.z)); ctx.rotate(v.ang); ctx.fillStyle = 'rgba(255,40,30,0.9)'; const rx = -v.stats.l / 2 * k + 1, ry = v.stats.w * 0.36 * k; ctx.fillRect(rx, -ry - 3, 4, 6); ctx.fillRect(rx, ry - 3, 4, 6); ctx.restore(); }
    if (p.enter?.v === v) drawDoor(ctx, cam, v, Math.sin(Math.min(1, p.enter.t / p.enter.dur) * Math.PI) * 1.0);
    if (p.exit?.v === v) drawDoor(ctx, cam, v, Math.sin(Math.min(1, p.exit.t / p.exit.dur) * Math.PI) * 1.0);
    if (p.inVehicle === v && v.type === 'moto') drawPerson(ctx, cam, p, { sx: cam.sx(v.x), sy: cam.sz(v.z), scale: 0.85 });
  }
  // Люди
  for (const q of G.peds) {
    if (q.dead || !cam.visible(q.x, q.z, 2)) continue;
    drawPerson(ctx, cam, q, q.fade !== undefined ? { alpha: Math.max(0, q.fade) } : {});
  }
  if (!p.hidden && (!p.inVehicle || p.exit)) { if (!(p.inVehicle && !p.exit)) { const of = G.outfitFilter?.(); if (of) ctx.filter = of; drawPerson(ctx, cam, p, p.enter ? { alpha: 1 - p.crouch * 0.9 } : {}); ctx.filter = 'none'; } }
  drawTrains(ctx, cam);

  // Эффекты
  for (const f of G.fx) {
    const a = 1 - f.t / f.life;
    if (f.k === 'tracer') { ctx.strokeStyle = f.col; ctx.globalAlpha = a; ctx.lineWidth = f.w; ctx.beginPath(); ctx.moveTo(cam.sx(f.x1), cam.sz(f.z1)); ctx.lineTo(cam.sx(f.x2), cam.sz(f.z2)); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (f.k === 'flash') { const g = ctx.createRadialGradient(cam.sx(f.x), cam.sz(f.z), 0, cam.sx(f.x), cam.sz(f.z), 1.1 * k); g.addColorStop(0, 'rgba(255,240,170,' + a + ')'); g.addColorStop(1, 'rgba(255,160,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cam.sx(f.x), cam.sz(f.z), 1.1 * k, 0, 7); ctx.fill(); }
    else if (f.k === 'smoke') { ctx.fillStyle = 'rgba(60,60,60,' + 0.45 * a + ')'; ctx.beginPath(); ctx.arc(cam.sx(f.x), cam.sz(f.z), (f.r + f.t * 0.9) * k, 0, 7); ctx.fill(); }
    else if (f.k === 'ring') { const q = f.t / f.life; ctx.strokeStyle = `rgba(255,${Math.round(220 - 120 * q)},80,${(1 - q) * 0.8})`; ctx.lineWidth = 4 * (1 - q) + 1; ctx.beginPath(); ctx.arc(cam.sx(f.x), cam.sz(f.z), f.r * (0.3 + q * 0.9) * k, 0, 7); ctx.stroke(); }
    else if (f.k === 'blast') { const q = f.t / f.life, rr = f.r * (0.35 + 0.5 * q) * k, gr = ctx.createRadialGradient(cam.sx(f.x), cam.sz(f.z), 0, cam.sx(f.x), cam.sz(f.z), rr); gr.addColorStop(0, `rgba(255,250,200,${1 - q})`); gr.addColorStop(0.5, `rgba(255,150,40,${0.85 * (1 - q)})`); gr.addColorStop(1, 'rgba(200,60,20,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cam.sx(f.x), cam.sz(f.z), rr, 0, 7); ctx.fill(); }
    else if (f.k === 'fire') { const q = f.t / f.life, rr = f.size * (1 - q * 0.6) * k * 0.6, x = cam.sx(f.x), z = cam.sz(f.z), gr = ctx.createRadialGradient(x, z, 0, x, z, rr); gr.addColorStop(0, `rgba(255,240,150,${1 - q})`); gr.addColorStop(0.5, `rgba(255,130,30,${0.8 * (1 - q)})`); gr.addColorStop(1, 'rgba(160,30,10,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, z, rr, 0, 7); ctx.fill(); }
    else if (f.k === 'debris') { ctx.save(); ctx.translate(cam.sx(f.x), cam.sz(f.z)); ctx.rotate(f.rot + f.vr * f.t); ctx.globalAlpha = Math.min(1, a * 2); ctx.fillStyle = f.col; ctx.fillRect(-f.size * k / 2, -f.size * k / 3, f.size * k, f.size * k * 0.66); ctx.restore(); }
    else if (f.k === 'water') { ctx.fillStyle = `rgba(150,200,240,${a * 0.8})`; ctx.beginPath(); ctx.arc(cam.sx(f.x), cam.sz(f.z), f.size * k, 0, 7); ctx.fill(); }
    else if (f.k === 'spark') { ctx.fillStyle = 'rgba(255,220,120,' + a + ')'; ctx.beginPath(); ctx.arc(cam.sx(f.x), cam.sz(f.z), 0.25 * k, 0, 7); ctx.fill(); }
  }

  // Верхний слой: кроны деревьев
  ctx.imageSmoothingEnabled = true;
  for (const ch of chunks) for (const t of ch.t) {
    if (t._g === G.frame) continue; t._g = G.frame;
    const [sx, sy, sw, sh] = propRect(t.kind), s = k / 16 * t.s;
    ctx.save(); ctx.translate(cam.sx(t.x), cam.sz(t.z)); ctx.rotate(t.rot); ctx.drawImage(A.props, sx, sy, sw, sh, -sw * s / 2, -sh * s / 2, sw * s, sh * s); ctx.restore();
  }
  drawGates(ctx, cam, time);
  // Светофоры
  for (const it of w.intersections) {
    if (!cam.visible(it.x, it.z, 8)) continue;
    const ns = lightState(0), ew = lightState(1);
    for (const [dx, dz, st] of [[-5.3, -5.3, ns], [5.3, 5.3, ns], [5.3, -5.3, ew], [-5.3, 5.3, ew]]) {
      const x = cam.sx(it.x + dx), z = cam.sz(it.z + dz);
      ctx.fillStyle = '#1a1c20'; ctx.beginPath(); ctx.arc(x, z, 0.55 * k, 0, 7); ctx.fill();
      ctx.fillStyle = st === 'g' ? '#3cff6a' : st === 'y' ? '#ffd23c' : '#ff3b30'; ctx.beginPath(); ctx.arc(x, z, 0.32 * k, 0, 7); ctx.fill();
    }
  }
  // Подписи ориентиров
  ctx.font = `bold ${Math.round(clamp(k * 0.75, 10, 18))}px "Press Start 2P", monospace`; ctx.textAlign = 'center';
  for (const l of w.labels) {
    if (!cam.visible(l.x, l.z, 20)) continue;
    const x = cam.sx(l.x), z = cam.sz(l.z);
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; const tw = ctx.measureText(l.text).width; ctx.fillRect(x - tw / 2 - 5, z - 13, tw + 10, 20);
    ctx.fillStyle = '#ffe9a0'; ctx.fillText(l.text, x, z + 2);
  }
  ctx.restore();

  // Ночь и свет
  const n = nightFactor();
  if (n > 0.02) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const lerp = (a, b) => Math.round(a + (b - a) * n);
    ctx.fillStyle = `rgb(${lerp(255, 58)},${lerp(255, 72)},${lerp(255, 118)})`; ctx.fillRect(0, 0, cam.w, cam.h);
    ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
    const [gx, gy, gw, gh] = propRect('pk_glow');
    for (const l of w.lamps) {
      if (l.broken || !cam.visible(l.x, l.z, 8)) continue;
      const s = 13 * k / gw; ctx.globalAlpha = 0.95 * n; ctx.drawImage(A.props, gx, gy, gw, gh, cam.sx(l.x) - gw * s / 2, cam.sz(l.z) - gh * s / 2, gw * s, gh * s);
    }
    for (const v of G.cars) {
      if (!v.driver || v.wreck || !cam.visible(v.x, v.z, 14)) continue;
      const fx = Math.cos(v.ang), fz = Math.sin(v.ang), s = 11 * k / gw; ctx.globalAlpha = 0.7 * n;
      for (const off of [-0.55, 0.55]) { const hx = v.x + fx * (v.stats.l * 0.5 + 3) - fz * off * v.stats.w, hz = v.z + fz * (v.stats.l * 0.5 + 3) + fx * off * v.stats.w; ctx.drawImage(A.props, gx, gy, gw, gh, cam.sx(hx) - gw * s / 2, cam.sz(hz) - gh * s / 2, gw * s, gh * s); }
    }
    ctx.restore();
  }
  // Мигалки полиции (всегда)
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
  for (const v of G.cars) {
    if (!v.siren || v.wreck || !cam.visible(v.x, v.z, 14)) continue;
    const red = Math.floor(time * 5 + v.id) % 2 === 0, [gx, gy, gw, gh] = propRect(red ? 'pk_glow_red' : 'pk_glow_blue'), s = 7 * k / gw;
    const fx = Math.cos(v.ang), fz = Math.sin(v.ang), side = red ? -0.5 : 0.5, hx = v.x - fz * side * 0.9, hz = v.z + fx * side * 0.9;
    ctx.globalAlpha = 0.9; ctx.drawImage(A.props, gx, gy, gw, gh, cam.sx(hx) - gw * s / 2, cam.sz(hz) - gh * s / 2, gw * s, gh * s);
  }
  ctx.restore();

  // Стрелка к цели миссии за пределами экрана
  if (tg && !cam.visible(tg.x, tg.z, 0)) {
    const a = Math.atan2(tg.z - cam.z, tg.x - cam.x), cx = cam.w / 2, cy = cam.h / 2;
    const m = 46, ex = clamp(cx + Math.cos(a) * 9999, m, cam.w - m), ey = clamp(cy + Math.sin(a) * 9999, m + 40, cam.h - m);
    const t = Math.min((ex - cx) / (Math.cos(a) || 1e-6), (ey - cy) / (Math.sin(a) || 1e-6));
    const px = cx + Math.cos(a) * Math.abs(t), py = cy + Math.sin(a) * Math.abs(t);
    ctx.save(); ctx.translate(clamp(px, m, cam.w - m), clamp(py, m + 40, cam.h - m)); ctx.rotate(a);
    ctx.fillStyle = '#ffd400'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -13); ctx.lineTo(-4, 0); ctx.lineTo(-10, 13); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
    const d = Math.round(Math.hypot(tg.x - p.x, tg.z - p.z));
    ctx.font = '10px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(d + ' м', clamp(px, m, cam.w - m) + 1, clamp(py, m + 40, cam.h - m) + 29); ctx.fillStyle = '#ffd400'; ctx.fillText(d + ' м', clamp(px, m, cam.w - m), clamp(py, m + 40, cam.h - m) + 28);
  }
}
