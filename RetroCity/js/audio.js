// Звук: процедурные эффекты и музыка через WebAudio (без внешних файлов — своя /оригинальная озвучка).
import { state } from './state.js';

let ctx = null, master, musicGain, sfxGain, musicNodes = [], started = false;
function ensure() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.connect(ctx.destination);
  musicGain = ctx.createGain(); musicGain.connect(master);
  sfxGain = ctx.createGain(); sfxGain.connect(master);
  applyVolumes();
  return ctx;
}
export function applyVolumes() { if (!ctx) return; musicGain.gain.value = (state.settings.musicVol ?? 0.5) * 0.5; sfxGain.gain.value = state.settings.sfxVol ?? 0.7; }
export function unlockAudio() { const c = ensure(); if (c.state === 'suspended') c.resume(); if (!started) { started = true; startMusic(); } }

function osc(freq, dur, type = 'sine', gain = 0.2, dest = sfxGain, detune = 0) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
  g.gain.value = gain; g.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + dur);
  o.connect(g); g.connect(dest); o.start(); o.stop(ctx.currentTime + dur);
}
function noise(dur, gain = 0.2, dest = sfxGain, filterFreq = 1200) {
  const n = ctx.createBufferSource(), buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  n.buffer = buf; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq;
  const g = ctx.createGain(); g.gain.value = gain; n.connect(f); f.connect(g); g.connect(dest); n.start();
}
const SFX = {
  punch: () => { noise(0.08, 0.3, sfxGain, 900); osc(120, 0.08, 'square', 0.12); },
  shot: () => { noise(0.1, 0.35, sfxGain, 2600); osc(90, 0.08, 'sawtooth', 0.15); },
  shotgun: () => { noise(0.18, 0.4, sfxGain, 1800); osc(70, 0.14, 'sawtooth', 0.2); },
  reload: () => { osc(300, 0.05, 'square', 0.08); setTimeout(() => ctx && osc(420, 0.05, 'square', 0.08), 90); },
  deny: () => { osc(180, 0.12, 'square', 0.1); },
  hit: () => { noise(0.06, 0.25, sfxGain, 700); },
  crash_small: () => { noise(0.14, 0.3, sfxGain, 1400); osc(140, 0.1, 'square', 0.1); },
  crash: () => { noise(0.3, 0.45, sfxGain, 900); osc(70, 0.3, 'sawtooth', 0.22); },
  explosion: (dist = 0) => { const g = Math.max(0.08, 0.6 - dist / 300); noise(0.5, g, sfxGain, 450); osc(55, 0.5, 'sawtooth', g * 0.6); },
  siren: () => { for (let i = 0; i < 2; i++) setTimeout(() => ctx && osc(i ? 880 : 660, 0.18, 'sine', 0.06), i * 190); },
  cash: () => { osc(880, 0.06, 'square', 0.1); setTimeout(() => ctx && osc(1320, 0.08, 'square', 0.1), 70); },
  ui: () => { osc(520, 0.05, 'triangle', 0.08); },
  door: () => { noise(0.12, 0.18, sfxGain, 500); },
  horn: () => { osc(220, 0.3, 'sawtooth', 0.12); },
  step: () => { noise(0.04, 0.08, sfxGain, 600); },
  enter_car: () => { noise(0.08, 0.15, sfxGain, 700); },
  engine_start: () => { osc(90, 0.25, 'sawtooth', 0.12); },
  cutscene: () => { osc(220, 0.3, 'sine', 0.1); setTimeout(() => ctx && osc(165, 0.4, 'sine', 0.1), 150); },
  hurt: () => { noise(0.1, 0.2, sfxGain, 600); osc(160, 0.12, 'square', 0.1); },
};
export function sfx(name, arg) { if (!(state.settings.sfxVol > 0)) return; ensure(); if (SFX[name]) SFX[name](arg); }

// Минималистичная фоновая музыка: редкие приглушённые арпеджио по кругу, не навязчивая
const SCALE = [0, 3, 5, 7, 10, 12, 15];
let musicT = null;
export function startMusic() {
  if (!ctx || musicT) return;
  const root = 55;
  const tick = () => {
    if (!(state.settings.musicVol > 0)) { musicT = setTimeout(tick, 4000); return; }
    const n = SCALE[Math.floor(Math.random() * SCALE.length)], freq = root * Math.pow(2, n / 12);
    osc(freq, 2.2, 'sine', 0.05, musicGain); osc(freq * 2, 1.6, 'triangle', 0.02, musicGain);
    musicT = setTimeout(tick, 1400 + Math.random() * 900);
  };
  tick();
}
export function stopMusic() { if (musicT) clearTimeout(musicT); musicT = null; }
