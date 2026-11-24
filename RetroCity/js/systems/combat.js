// Бой: ближний бой, стрельба (hitscan), урон людям и машинам, шум для реакции пешеходов.
import { G, state } from '../state.js';
import { WEAPONS } from '../data.js';
import { damagePed } from './peds.js';
import { angDiff } from '../engine/util.js';

let NOISE_ID = 1;
export function makeNoise(x, z, kind, r) { G.noise.push({ id: NOISE_ID++, x, z, kind, r, t: 0 }); }
export const currentWeapon = () => WEAPONS.find(w => w.id === (state.ownedWeapons[state.weaponIndex] || 'fists'));

// Луч: возвращает точку остановки. owner — кто стреляет (исключается из попаданий)
export function shootRay(owner, x, z, ang, range, dmg, opts = {}) {
  const dx = Math.cos(ang), dz = Math.sin(ang), step = 0.5, w = G.world;
  let px = x, pz = z, len = 0, hits = 0;
  const peds = G.peds.filter(p => !p.dead && p !== owner && (p.x - x) ** 2 + (p.z - z) ** 2 < (range + 3) ** 2);
  if (owner !== G.player && !G.player.inVehicle && !G.player.dead) peds.push(G.player);
  const cars = G.cars.filter(c => c !== owner?.inVehicle && (c.x - x) ** 2 + (c.z - z) ** 2 < (range + 8) ** 2);
  const done = new Set();
  while (len < range) {
    px += dx * step; pz += dz * step; len += step;
    if (w.solidAt(px, pz) && w.type[w.tileAt(px, pz)] !== 4) break;
    let stop = false;
    for (const p of peds) {
      if (done.has(p) || (p.x - px) ** 2 + (p.z - pz) ** 2 > 0.3) continue;
      done.add(p); hits++;
      if (p === G.player) G.hurtPlayer(dmg, 'shot'); else damagePed(p, dmg, owner === G.player, x, z);
      if (!opts.pierce) { stop = true; break; }
    }
    if (!stop) for (const c of cars) {
      if (done.has(c) || !c.inside(px, pz, 0.05)) continue;
      done.add(c); hits++; c.damage(dmg * 0.8, 'bullet', 0, owner === G.player);
      if (c.driver === 'player' && owner !== G.player) G.hurtPlayer(dmg * 0.3, 'shot');
      if (!opts.pierce) { stop = true; break; }
    }
    if (stop) break;
  }
  G.fx.push({ k: 'tracer', x1: x, z1: z, x2: px, z2: pz, t: 0, life: opts.pierce ? 0.18 : 0.07, col: opts.col || '#ffe9a0', w: opts.pierce ? 3 : 1.4 });
  if (hits === 0 && len < range) G.fx.push({ k: 'spark', x: px, z: pz, t: 0, life: 0.18 });
  return { x: px, z: pz, hits };
}

export function playerFire(p) {
  const wp = currentWeapon(), now = G.time;
  if (p.nextFire > now) return;
  p.nextFire = now + wp.cooldown;
  const aim = p.aimAng ?? p.ang;
  if (wp.melee) {
    p.atk = p.atkDur = Math.min(0.32, wp.cooldown * 0.8); p.ang = aim;
    makeNoise(p.x, p.z, 'melee', 9);
    let best = null, bd = 1e9;
    for (const q of G.peds) {
      if (q.dead) continue;
      const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz);
      if (d < wp.range * 0.62 + 0.6 && Math.abs(angDiff(aim, Math.atan2(dz, dx))) < 1.1 && d < bd) { bd = d; best = q; }
    }
    if (best) damagePed(best, wp.damage * (state.character?.meleeMul || 1), true, p.x, p.z);
    return;
  }
  const ammo = state.ammo[wp.id] || 0;
  if (ammo <= 0) { G.msg('Нет патронов — Q/R смена оружия', 1.4); p.nextFire = now + 0.4; return; }
  state.ammo[wp.id] = ammo - 1; p.aimT = 0.35; p.shotFlash = 0.07; p.ang = aim;
  const mx = p.x + Math.cos(aim) * 0.9, mz = p.z + Math.sin(aim) * 0.9;
  for (let i = 0; i < (wp.pellets || 1); i++) shootRay(p, mx, mz, aim + (Math.random() - 0.5) * (wp.spread || 0.02) * 2, wp.range, wp.damage, { pierce: wp.pierce, col: wp.pierce ? '#7fe9ff' : '#ffe9a0' });
  G.fx.push({ k: 'flash', x: mx, z: mz, ang: aim, t: 0, life: 0.06 });
  makeNoise(p.x, p.z, 'shot', 38);
  G.onShot?.(p);
}
