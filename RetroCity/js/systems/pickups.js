// Подбираемые предметы: оружие, аптечки, наличные
import { G, state } from '../state.js';
import { WEAPONS } from '../data.js';
import { A, propRect } from '../engine/assets.js';

const SPOTS = [
  ['bat', -14, 12], ['pistol', 22, 10], ['health', 6, -12], ['smg', -64, -36], ['shotgun', 62, 52], ['health', -40, 60], ['pistol', 180, -90],
  ['health', 150, -150], ['smg', 230, -30], ['special', -188, 292], ['health', -110, 190], ['shotgun', -60, 230], ['bat', 40, -100], ['health', 20, 80], ['pistol', -150, -120],
];
export function initPickups() {
  G.pickups.length = 0;
  for (const [kind, x, z] of SPOTS) { const q = G.world.nearestWalk(x, z, 10); G.pickups.push({ kind, x: q.x, z: q.z, t: Math.random() * 6, wait: 0 }); }
}
export function updatePickups(dt) {
  const p = G.player;
  for (let i = G.pickups.length - 1; i >= 0; i--) {
    const k = G.pickups[i]; k.t += dt;
    if (k.wait > 0) { k.wait -= dt; continue; }
    if (p.inVehicle || p.dead || Math.hypot(k.x - p.x, k.z - p.z) > 1.5) continue;
    if (k.kind === 'cash') { state.money += k.value; G.msg('+₽' + k.value, 1.2); G.pickups.splice(i, 1); continue; }
    if (k.kind === 'health') {
      if (state.health >= state.maxHealth) continue;
      state.health = Math.min(state.maxHealth, state.health + 40); G.msg('Аптечка +40', 1.4); k.wait = 90; continue;
    }
    const w = WEAPONS.find(x => x.id === k.kind);
    if (!state.ownedWeapons.includes(k.kind)) { state.ownedWeapons.push(k.kind); G.msg('Получено: ' + w.name, 2.2); }
    else if (w.pickup) G.msg('Патроны: ' + w.name + ' +' + w.pickup, 1.6);
    if (w.pickup) state.ammo[w.id] = (state.ammo[w.id] || 0) + w.pickup;
    G.updateWeaponHUD?.(); k.wait = 120;
  }
}
export function drawPickups(ctx, cam, time) {
  ctx.imageSmoothingEnabled = true;
  for (const k of G.pickups) {
    if (k.wait > 0 || !cam.visible(k.x, k.z, 4)) continue;
    const name = k.kind === 'cash' ? 'pk_cash' : k.kind === 'health' ? 'pk_health' : 'pk_' + k.kind;
    const [sx, sy, sw, sh] = propRect(name), bob = Math.sin(k.t * 3) * 0.12, s = cam.ppm / 16 * 0.9;
    const x = cam.sx(k.x), y = cam.sz(k.z + bob);
    const [gx, gy, gw, gh] = propRect('pk_glow');
    ctx.globalAlpha = 0.55 + Math.sin(k.t * 4) * 0.2; ctx.drawImage(A.props, gx, gy, gw, gh, x - gw * s * 0.55, y - gh * s * 0.55, gw * s * 1.1, gh * s * 1.1); ctx.globalAlpha = 1;
    ctx.drawImage(A.props, sx, sy, sw, sh, x - sw * s / 2, y - sh * s / 2, sw * s, sh * s);
  }
}
