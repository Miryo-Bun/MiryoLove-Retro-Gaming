// Столкновения: машина–человек (сбитие), машина–машина, выталкивание людей из машин.
import { G, state } from '../state.js';
import { damagePed } from './peds.js';
import { makeNoise } from './combat.js';

export function updateCollisions(dt) {
  const pl = G.player, cars = G.cars;
  for (const v of cars) {
    const sp = Math.hypot(v.vx, v.vz), cx = v.x, cz = v.z, R = v.stats.l / 2 + 2;
    // --- люди ---
    const near = G.gridPeds.query(cx, cz, R);
    for (const p of near) {
      if (p.dead || !v.inside(p.x, p.z, p.r * 0.8)) continue;
      if (sp > 2.6) {
        const by = v.driver === 'player';
        damagePed(p, Math.min(120, sp * 7), by, v.x, v.z);
        if (by) G.crime?.(p.dead ? 'runover' : 'assault', p.x, p.z);
        p.x += v.vx * 0.04; p.z += v.vz * 0.04;
        if (p.dead) { p.deadAng = Math.atan2(v.vz, v.vx) + 1.57; makeNoise(p.x, p.z, 'crash', 14); }
        v.vx *= 0.97; v.vz *= 0.97;
      } else pushOut(p, v);
    }
    if (!pl.inVehicle && !pl.enter && !pl.exit && !pl.dead && v.inside(pl.x, pl.z, pl.r * 0.8)) {
      if (sp > 4 && v.driver !== 'player') { G.hurtPlayer(sp * 3.2, 'car'); pl.x += v.vx * 0.05; pl.z += v.vz * 0.05; v.vx *= 0.9; v.vz *= 0.9; }
      else pushOut(pl, v);
    }
  }
  // --- машина–машина (круги вдоль корпуса) ---
  for (const a of cars) {
    const ca = a.circles();
    for (const b of G.gridCars.query(a.x, a.z, a.stats.l / 2 + 6)) {
      if (b.id <= a.id) continue;
      const cb = b.circles();
      let hit = false;
      for (const [ax, az, ar] of ca) {
        for (const [bx, bz, br] of cb) {
          const dx = bx - ax, dz = bz - az, d2 = dx * dx + dz * dz, rr = ar + br;
          if (d2 >= rr * rr) continue;
          const d = Math.sqrt(d2) || 0.01, nx = dx / d, nz = dz / d, pen = rr - d;
          const ia = 1 / a.stats.mass, ib = 1 / b.stats.mass, tot = ia + ib;
          const fa = a.driver || Math.abs(a.vx) + Math.abs(a.vz) > 0.3 || !a.parked ? ia / tot : ia / tot, fb = ib / tot;
          if (!a.collides(a.x - nx * pen * fa, a.z - nz * pen * fa, a.ang)) { a.x -= nx * pen * fa; a.z -= nz * pen * fa; }
          if (!b.collides(b.x + nx * pen * fb, b.z + nz * pen * fb, b.ang)) { b.x += nx * pen * fb; b.z += nz * pen * fb; }
          const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
          if (rv < 0) {
            const j = -(1.25) * rv / tot;
            a.vx -= j * ia * nx; a.vz -= j * ia * nz; b.vx += j * ib * nx; b.vz += j * ib * nz;
            const imp = -rv;
            if (imp > 3.5 && !hit) {
              hit = true;
              a.damage((imp - 3) * 2.6 * b.stats.mass / (a.stats.mass + 0.5) / Math.max(1, a.stats.mass * 0.6), 'car', imp);
              b.damage((imp - 3) * 2.6 * a.stats.mass / (b.stats.mass + 0.5) / Math.max(1, b.stats.mass * 0.6), 'car', imp);
              if (imp > 6) makeNoise((a.x + b.x) / 2, (a.z + b.z) / 2, 'crash', 16);
              const player = a.driver === 'player' ? b : b.driver === 'player' ? a : null;
              if (player) { G.hurtPlayer(Math.max(0, imp - 9) * 0.9, 'crash'); if (player.ai?.kind === 'police') G.crime?.('ram_cop', player.x, player.z); }
            }
          }
          break;
        }
      }
    }
  }
}

function pushOut(p, v) {
  const fx = Math.cos(v.ang), fz = Math.sin(v.ang), dx = p.x - v.x, dz = p.z - v.z;
  const lx = dx * fx + dz * fz, lz = -dx * fz + dz * fx, hl = v.stats.l / 2 + p.r, hw = v.stats.w / 2 + p.r;
  const pushL = hl - Math.abs(lx), pushW = hw - Math.abs(lz);
  let ox, oz;
  if (pushW < pushL) { const s = Math.sign(lz) || 1; ox = -fz * s * pushW; oz = fx * s * pushW; }
  else { const s = Math.sign(lx) || 1; ox = fx * s * pushL; oz = fz * s * pushL; }
  if (!G.world.solidAt(p.x + ox, p.z + oz)) { p.x += ox; p.z += oz; }
}
