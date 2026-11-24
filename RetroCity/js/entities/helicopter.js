import { HELICOPTER_BY_ID } from '../data.js';
import { clamp } from '../engine/util.js';

export class Helicopter {
  constructor(typeId, x, z, altitude = 0, ang = 0) {
    const stats = HELICOPTER_BY_ID[typeId] || HELICOPTER_BY_ID.civil;
    Object.assign(this, {
      id: 'h' + Date.now().toString(36) + Math.floor(Math.random() * 10000),
      type: stats.id,
      stats,
      x, z, altitude, ang,
      vx: 0, vz: 0, verticalSpeed: 0, speed: 0,
      hp: stats.hp, maxHp: stats.hp,
      fuel: stats.fuelCap, fuelCap: stats.fuelCap,
      rotor: 0, rotorSpeed: 0, driver: null, owned: false, wreck: false, parked: true,
    });
  }

  step(dt, input) {
    if (this.wreck || this.fuel <= 0) {
      input = { throttle: 0, vertical: -1, steer: 0, turn: 0 };
    }
    const s = this.stats;
    const forward = input.throttle || 0;
    this.ang += (input.turn || 0) * s.turnRate * dt * clamp(this.speed / 8 + 0.3, 0.3, 1);
    const fx = Math.cos(this.ang), fz = Math.sin(this.ang);
    const rx = -fz, rz = fx;
    const side = input.steer || 0;
    const targetVx = fx * forward * s.maxSpeed + rx * side * s.maxSpeed * 0.55;
    const targetVz = fz * forward * s.maxSpeed + rz * side * s.maxSpeed * 0.55;
    this.vx += (targetVx - this.vx) * Math.min(1, s.acceleration * 0.035 * dt);
    this.vz += (targetVz - this.vz) * Math.min(1, s.acceleration * 0.035 * dt);
    this.verticalSpeed += ((input.vertical || 0) * s.climbRate - this.verticalSpeed) * Math.min(1, dt * 3.2);
    this.altitude = Math.max(0, this.altitude + this.verticalSpeed * dt);
    this.x += this.vx * dt;
    this.z += this.vz * dt;
    this.speed = Math.hypot(this.vx, this.vz);
    this.rotorSpeed += ((this.driver ? 1 : 0.12) - this.rotorSpeed) * Math.min(1, dt * 2);
    this.rotor += this.rotorSpeed * dt * 18;
    if (this.driver) this.fuel = Math.max(0, this.fuel - s.fuelBurn * dt * (0.5 + this.speed / s.maxSpeed + Math.abs(this.verticalSpeed) / s.climbRate));
  }

  damage(amount) {
    if (this.wreck) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) this.wreck = true;
  }

  draw(ctx, cam) {
    const x = cam.sx(this.x), z = cam.sz(this.z - this.altitude * 0.08);
    const k = cam.ppm, scale = clamp(k * 0.32, 0.65, 1.25);
    ctx.save();
    ctx.translate(x + this.altitude * 0.04 * k, z - this.altitude * k * 0.04);
    ctx.rotate(this.ang);
    ctx.globalAlpha = clamp(0.55 + this.altitude * 0.04, 0.55, 0.95);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(0, this.altitude * k * 0.04 + 4 * k, 2.2 * k, 0.9 * k, 0, 0, 7); ctx.fill();
    ctx.fillStyle = this.stats.color;
    ctx.strokeStyle = '#17202a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(-1.7 * k * scale, -0.65 * k * scale, 3.4 * k * scale, 1.3 * k * scale, 0.5 * k); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#86b1c8';
    ctx.beginPath(); ctx.ellipse(-0.9 * k * scale, 0, 0.8 * k * scale, 0.55 * k * scale, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillRect(1.25 * k * scale, -0.12 * k * scale, 2.4 * k * scale, 0.24 * k * scale);
    ctx.strokeStyle = '#dbe4e8'; ctx.lineWidth = 1.2 * k * scale;
    ctx.beginPath(); ctx.moveTo(-3.5 * k * scale, 0); ctx.lineTo(3.5 * k * scale, 0); ctx.moveTo(0, -3.2 * k * scale); ctx.lineTo(0, 3.2 * k * scale); ctx.stroke();
    ctx.restore();
  }
}
