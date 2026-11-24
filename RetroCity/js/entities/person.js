// Человек: герой, прохожий или полицейский. Рисуется спрайтом сверху (кадры 64 px = 3 м).
import { A, heroFrame, npcFrame, heroFrames, npcFrames, FRAME } from '../engine/assets.js';
import { G } from '../state.js';

let NEXT_ID = 1;
export class Person {
  constructor(o) {
    this.id = NEXT_ID++;
    this.kind = o.kind;            // 'hero' | 'npc' | 'cop'
    this.heroId = o.heroId || null; this.variant = o.variant ?? 0;
    this.x = o.x; this.z = o.z; this.ang = o.ang ?? 0;
    this.vx = 0; this.vz = 0; this.speed = 0;
    this.phase = Math.random() * 8; this.t = 0;
    this.hp = o.hp ?? 40; this.maxHp = this.hp;
    this.dead = false; this.deadT = 0; this.r = 0.42;
    this.run = false; this.atk = 0; this.aimT = 0; this.crouch = 0;
    this.scale = o.scale ?? 1; this.mode = 'walk'; this.timer = 0;
    this.pers = o.pers || 'stroller';
  }
}

export function personFrame(p) {
  const hero = p.kind === 'hero';
  if (p.dead) return hero ? heroFrame(p.heroId, 'dead', 0) : npcFrame(p.variant, 'dead', 0);
  if (hero) {
    if (p.atk > 0) { const n = heroFrames(p.heroId, 'punch'); return heroFrame(p.heroId, 'punch', Math.min(n - 1, (1 - p.atk / p.atkDur) * n)); }
    if (p.aimT > 0) return heroFrame(p.heroId, 'aim', p.shotFlash > 0 ? 1 : 0);
    if (p.speed > 0.4) return heroFrame(p.heroId, p.run ? 'run' : 'walk', p.phase);
    return heroFrame(p.heroId, 'idle', p.t * 3);
  }
  if (p.speed > 0.4) return npcFrame(p.variant, p.run ? 'run' : 'walk', p.phase);
  return npcFrame(p.variant, 'idle', 0);
}

export function advanceAnim(p, dt) {
  p.t += dt;
  if (p.speed > 0.4) {
    const n = p.kind === 'hero' ? heroFrames(p.heroId, p.run ? 'run' : 'walk') : npcFrames(p.run ? 'run' : 'walk');
    const stride = p.run ? (p.kind === 'hero' ? 3.6 : 3.0) : (p.kind === 'hero' ? 1.9 : 1.3);
    p.phase += p.speed * dt * n / stride;
  }
  if (p.atk > 0) p.atk = Math.max(0, p.atk - dt);
  if (p.aimT > 0) p.aimT = Math.max(0, p.aimT - dt);
  if (p.shotFlash > 0) p.shotFlash -= dt;
}

export function drawPersonShadow(ctx, cam, p, alpha = 0.28) {
  const k = cam.ppm;
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.beginPath(); ctx.ellipse(cam.sx(p.x) + 0.18 * k, cam.sz(p.z) + 0.14 * k, 0.5 * k * p.scale, 0.38 * k * p.scale, p.ang, 0, 7); ctx.fill();
}

export function drawPerson(ctx, cam, p, opt = {}) {
  const [img, sx, sy] = personFrame(p);
  const s = cam.ppm * 3 / FRAME * p.scale * (opt.scale ?? 1);
  const x = opt.sx ?? cam.sx(p.x), y = opt.sy ?? cam.sz(p.z);
  ctx.save(); ctx.translate(x, y); ctx.rotate(p.dead ? p.deadAng ?? p.ang : p.ang);
  if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
  ctx.imageSmoothingEnabled = true;
  if (p.crouch > 0) { ctx.scale(1 - 0.18 * p.crouch, 1 - 0.1 * p.crouch); }
  ctx.drawImage(img, sx, sy, FRAME, FRAME, -FRAME * s / 2, -FRAME * s / 2, FRAME * s, FRAME * s);
  ctx.restore();
}

// Столкновение круга с непроходимыми клетками (скольжение по осям)
export function blockedCircle(pred, x, z, r) {
  return pred(x - r, z - r) || pred(x + r, z - r) || pred(x - r, z + r) || pred(x + r, z + r);
}
export function moveSlide(p, dx, dz, pred) {
  const r = p.r;
  if (dx && !blockedCircle(pred, p.x + dx, p.z, r)) p.x += dx; else if (dx) p.vx = 0;
  if (dz && !blockedCircle(pred, p.x, p.z + dz, r)) p.z += dz; else if (dz) p.vz = 0;
}
export const solidPred = (x, z) => G.world.solidAt(x, z);
export const walkPred = (x, z) => !G.world.walkAt(x, z);
