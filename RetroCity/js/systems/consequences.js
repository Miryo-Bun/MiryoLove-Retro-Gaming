// Задержание и больница как игровые исходы: конфискация части имущества, штраф, перемещение, кат-сцена.
import { G, state } from '../state.js';
import { forceExit } from '../entities/player.js';
import { clearPolice } from './police.js';
import { resetEscalation } from './escalation.js';
import { playCutscene } from '../cutscene.js';
import { WEAPONS } from '../data.js';

let lastOutcomeT = -999;
export async function sendToHospital() {
  const p = G.player;
  await playCutscene([{ who: 'Скорая помощь', text: 'Вас подобрали без сознания и доставили в больницу...', heroId: state.character?.id }], { perLine: 2.2 });
  const fine = Math.round(Math.min(state.money * 0.12, 60000));
  state.money = Math.max(0, state.money - fine); state.health = state.maxHealth;
  if (p.inVehicle) { p.inVehicle.driver = null; forceExit(p); }
  const h = G.world.pois.hospitals[0] || { x: 6, z: 6 };
  const q = G.world.nearestWalk(h.x, h.z + 6, 10); p.x = q.x; p.z = q.z; p.dead = false; p.vx = p.vz = 0;
  clearPolice(); resetEscalation();
  G.msg(`Счёт за лечение: −₽${fine}`, 3.5);
}
export async function sendToJail() {
  const p = G.player;
  await playCutscene([{ who: 'Полиция', text: 'Вы задержаны. Оружие и часть денег конфискованы до освобождения...', heroId: state.character?.id }], { perLine: 2.4 });
  const fine = Math.round(Math.min(state.money * 0.25, 15000));
  state.confiscated = { weapons: state.ownedWeapons.filter(w => w !== 'fists'), ammo: { ...state.ammo } };
  state.ownedWeapons = ['fists']; state.ammo = { pistol: 0, smg: 0, shotgun: 0, special: 0 }; state.weaponIndex = 0;
  state.money = Math.max(0, state.money - fine); state.health = state.maxHealth;
  if (p.inVehicle) { p.inVehicle.driver = null; forceExit(p); }
  const j = G.world.pois.police[0] || { x: 6, z: 6 };
  const q = G.world.nearestWalk(j.x, j.z + 6, 10); p.x = q.x; p.z = q.z; p.dead = false; p.vx = p.vz = 0;
  clearPolice(); resetEscalation();
  G.msg(`Штраф: −₽${fine}. Вещи можно забрать в участке`, 4);
  G.updateWeaponHUD?.();
}
