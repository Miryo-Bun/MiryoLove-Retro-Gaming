// Автомобиль: аркадная физика с боковым скольжением, столкновения с тайлами, отрисовка спрайтом сверху.
import { A, vehicleSprite } from '../engine/assets.js';
import { CAR_BY_ID, CAR_ECON } from '../data.js';
import { clamp } from '../engine/util.js';
import { G } from '../state.js';
import { drawDamage } from '../systems/fx.js';

let NEXT_ID = 1;
export class Vehicle {
  constructor(typeId, x, z, ang, colorIdx = 0) {
    this.id = NEXT_ID++;
    this.type = typeId; this.stats = CAR_BY_ID[typeId];
    this.x = x; this.z = z; this.ang = ang; this.vx = 0; this.vz = 0; this.speed = 0;
    this.colorIdx = colorIdx; this.hp = this.stats.hp; this.maxHp = this.stats.hp;
    this.driver = null;          // null | 'player' | 'npc' | 'cop'
    this.ai = null; this.wreck = false; this.braking = false; this.steerVis = 0;
    this.siren = false; this.smokeT = 0; this.bonus = 1; this.life = 0; this.parked = false;
    this.hitCool = 0; this.stuckT = 0;
    this.fuelCap = CAR_ECON[typeId]?.fuel ?? 50; this.fuel = this.fuelCap; this.ownedId = null;
    const l = this.stats.l * 0.47, w = this.stats.w * 0.46;
    this.pts = [[l, w], [l, -w], [-l, w], [-l, -w], [l, 0], [-l, 0], [0, w], [0, -w]];
    this.sprite = vehicleSprite(typeId, colorIdx);
  }
  get fwd() { return [Math.cos(this.ang), Math.sin(this.ang)]; }
  collides(x, z, ang) {
    const fx = Math.cos(ang), fz = Math.sin(ang), rx = -fz, rz = fx, w = G.world;
    for (const [a, b] of this.pts) if (w.solidAt(x + fx * a + rx * b, z + fz * a + rz * b)) return true;
    return false;
  }
  circles() {
    const s = this.stats, r = Math.max(0.35, s.w * 0.47), n = Math.max(2, Math.round(s.l / (s.w * 1.05)));
    const half = s.l / 2 - r, fx = Math.cos(this.ang), fz = Math.sin(this.ang), out = [];
    for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : -half + (2 * half * i) / (n - 1); out.push([this.x + fx * t, this.z + fz * t, r]); }
    return out;
  }
  // Точка внутри прямоугольника машины (с запасом)
  inside(px, pz, m = 0) {
    const fx = Math.cos(this.ang), fz = Math.sin(this.ang), dx = px - this.x, dz = pz - this.z;
    return Math.abs(dx * fx + dz * fz) < this.stats.l / 2 + m && Math.abs(-dx * fz + dz * fx) < this.stats.w / 2 + m;
  }
  doorPos(side = -1) {   // side=-1 левая дверь водителя
    const fx = Math.cos(this.ang), fz = Math.sin(this.ang), rx = -fz, rz = fx, off = this.stats.w / 2 + 0.55;
    return { x: this.x + fx * this.stats.l * 0.08 - rx * off * -side, z: this.z + fz * this.stats.l * 0.08 - rz * off * -side };
  }
  step(dt, inp) {
    const s = this.stats;
    if (this.wreck) inp = { throttle: 0, steer: 0, brake: 0.6, hand: false };
    else if (this.driver === 'player' && this.fuel <= 0) inp = { throttle: 0, steer: inp.steer || 0, brake: 0.15, hand: inp.hand };
    const maxSpd = s.speed * (this.bonus || 1);
    let fx = Math.cos(this.ang), fz = Math.sin(this.ang), rx = -fz, rz = fx;
    let vf = this.vx * fx + this.vz * fz, vl = this.vx * rx + this.vz * rz;
    const th = inp.throttle || 0;
    if (th > 0) vf += s.accel * th * dt * (1.15 - clamp(vf / maxSpd, 0, 1));
    else if (th < 0) { if (vf > 0.5) vf -= 26 * -th * dt; else vf -= s.accel * 0.6 * -th * dt * (1.1 - clamp(-vf / (maxSpd * 0.35), 0, 1)); }
    if (inp.brake) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 30 * inp.brake * dt);
    if (!th && !inp.brake) vf -= Math.sign(vf) * Math.min(Math.abs(vf), (1.5 + Math.abs(vf) * 0.12) * dt);
    vf = clamp(vf, -maxSpd * 0.35, maxSpd);
    // Руление
    const sp = Math.abs(vf);
    let turn = (inp.steer || 0) * s.turn * (s.pivot ? 1 : clamp(sp / 5, 0, 1)) * (1 - 0.4 * clamp(sp / maxSpd, 0, 1));
    if (vf < -0.3) turn = -turn;
    if (s.pivot && sp < 1.5) turn = (inp.steer || 0) * s.turn * 0.6;
    this.ang += turn * dt;
    this.steerVis = inp.steer || 0;
    // Боковое сцепление: ручник даёт занос
    vl *= Math.exp(-(inp.hand ? 1.4 : 8.5) * dt);
    if (inp.hand) vf *= Math.exp(-0.5 * dt);
    fx = Math.cos(this.ang); fz = Math.sin(this.ang); rx = -fz; rz = fx;
    this.vx = fx * vf + rx * vl; this.vz = fz * vf + rz * vl;
    if (this.driver === 'player' && this.fuel > 0) this.fuel = Math.max(0, this.fuel - (Math.abs(vf) * dt * 0.0028 * (0.6 + 0.4 * Math.abs(th)) + 0.0015 * dt));
    this.speed = vf; this.braking = !!inp.brake || (th < 0 && vf > 0.5);
    this.move(dt);
  }
  move(dt) {
    let nx = this.x + this.vx * dt, nz = this.z + this.vz * dt, imp = 0;
    if (this.collides(nx, this.z, this.ang)) { imp = Math.max(imp, Math.abs(this.vx)); this.vx *= -0.28; this.vz *= 0.85; nx = this.x; }
    this.x = nx;
    if (this.collides(this.x, nz, this.ang)) { imp = Math.max(imp, Math.abs(this.vz)); this.vz *= -0.28; this.vx *= 0.85; nz = this.z; }
    this.z = nz;
    if (this.collides(this.x, this.z, this.ang)) this.unstick();
    if (imp > 5) this.damage((imp - 5) * 2.6 / Math.sqrt(this.stats.mass), 'wall', imp);
    this.speed = this.vx * Math.cos(this.ang) + this.vz * Math.sin(this.ang);
  }
  unstick() {
    for (let r = 0.25; r < 3; r += 0.25) for (let a = 0; a < 6.28; a += 0.785) {
      const x = this.x + Math.cos(a) * r, z = this.z + Math.sin(a) * r;
      if (!this.collides(x, z, this.ang)) { this.x = x; this.z = z; return; }
    }
  }
  damage(amount, src, imp, byPlayer) {
    if (this.wreck || this.hitCool > 0 && src !== 'bullet' && src !== 'blast') return;
    if (byPlayer) this.lastHitBy = 'player';
    this.hp -= amount; if (src !== 'bullet' && src !== 'blast') this.hitCool = 0.25;
    if (imp > 8 && G.cam) G.cam.shake = Math.min(1, imp / 25);
    if (this.hp <= 0) { this.wreck = true; this.hp = 0; this.onWreck?.(this); }
  }
  draw(ctx, cam) {
    const sp = this.sprite, [sx, sy, sw, sh] = sp.rect, k = cam.ppm / A.m.vehicles.ppu;
    ctx.save(); ctx.translate(cam.sx(this.x), cam.sz(this.z)); ctx.rotate(this.ang);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(A.veh, sx, sy, sw, sh, -sw * k / 2, -sh * k / 2, sw * k, sh * k);
    drawDamage(ctx, this, cam.ppm);
    ctx.restore();
  }
  drawShadow(ctx, cam) {
    const k = cam.ppm, s = this.stats;
    ctx.save(); ctx.translate(cam.sx(this.x) + 0.3 * k, cam.sz(this.z) + 0.25 * k); ctx.rotate(this.ang);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    const l = s.l * k, w = s.w * k, r = Math.min(w * 0.3, 10);
    ctx.beginPath(); ctx.roundRect(-l / 2, -w / 2, l, w, r); ctx.fill(); ctx.restore();
  }
}
