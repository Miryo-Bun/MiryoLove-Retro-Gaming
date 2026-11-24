// Общее игровое состояние и контекст
import { Grid } from './engine/util.js';

export const state = {
  mode: 'menu', // menu | playing | pause | dead
  character: null, charIndex: 0,
  money: 5000, health: 100, maxHealth: 100, wanted: 0, heat: 0,
  unlocked: new Set(['downtown']),
  weaponIndex: 0, ownedWeapons: ['fists'],
  ammo: { pistol: 48, smg: 90, shotgun: 24, special: 12 },
  mission: null, settings: { quality: 'medium', musicVol: 0.5, sfxVol: 0.7 }, missionMgr: null,
  dayTime: 12, cutscene: null, playTime: 0,
  weather: { name: 'Солнечно', kind: 'sun', intensity: 0, transition: 1, until: 240 },
};

export const G = {
  world: null, cam: null, renderer: null, player: null,
  peds: [], cars: [], helicopters: [], pickups: [], fx: [], trains: [], noise: [],
  gridPeds: new Grid(8), gridCars: new Grid(10),
  time: 0, quality: { pedTarget: 90, carTarget: 28, pedCap: 110, carCap: 30 },
  light: { phase: 0 }, gates: [], input: null, msg: () => {},
};
