import { state } from '../state.js';

const CONDITIONS = [
  { kind: 'sun', name: 'Солнечно', intensity: 0 },
  { kind: 'cloud', name: 'Облачность', intensity: 0.08 },
  { kind: 'rain', name: 'Дождь', intensity: 0.55 },
  { kind: 'storm', name: 'Гроза', intensity: 0.9 },
  { kind: 'fog', name: 'Туман', intensity: 0.35 },
  { kind: 'snow', name: 'Снег', intensity: 0.5 },
];

let particles = [];
let currentIndex = 0;
let nextIndex = 0;
let transitionT = 1;
let thunderT = 3;

export function initWeather(saved) {
  if (saved?.weather) {
    state.weather = { ...state.weather, ...saved.weather };
    currentIndex = Math.max(0, CONDITIONS.findIndex(c => c.kind === state.weather.kind));
  }
  nextIndex = currentIndex;
  particles = Array.from({ length: 180 }, () => ({ x: Math.random(), y: Math.random(), v: 0.2 + Math.random() * 0.8 }));
}

export function updateWeather(dt) {
  state.weather.until -= dt;
  if (state.weather.until <= 0) {
    let candidate = (currentIndex + 1 + Math.floor(Math.random() * 3)) % CONDITIONS.length;
    nextIndex = candidate;
    transitionT = 0;
    state.weather.until = 120 + Math.random() * 240;
  }
  if (transitionT < 1) {
    transitionT = Math.min(1, transitionT + dt * 0.035);
    if (transitionT >= 1) currentIndex = nextIndex;
  }
  const a = CONDITIONS[currentIndex], b = CONDITIONS[nextIndex];
  const intensity = a.intensity * (1 - transitionT) + b.intensity * transitionT;
  state.weather = {
    ...state.weather,
    name: transitionT >= 1 ? b.name : `${a.name} → ${b.name}`,
    kind: transitionT >= 1 ? b.kind : a.kind,
    intensity,
    transition: transitionT,
  };
  thunderT -= dt;
  if (state.weather.kind === 'storm' && thunderT <= 0) thunderT = 3 + Math.random() * 7;
  for (const p of particles) {
    p.y += dt * p.v * (state.weather.kind === 'snow' ? 0.12 : 0.75);
    p.x += dt * (state.weather.kind === 'snow' ? 0.025 : 0.015);
    if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); }
    if (p.x > 1.05) p.x = -0.05;
  }
  const accumulation = state.weather.accumulation ?? 0;
  if (state.weather.kind === 'rain' || state.weather.kind === 'storm') {
    state.weather.accumulation = Math.min(1, accumulation + dt * 0.0015 * state.weather.intensity);
  } else if (state.weather.kind === 'snow') {
    state.weather.accumulation = Math.min(1, accumulation + dt * 0.0012 * state.weather.intensity);
  } else {
    state.weather.accumulation = Math.max(0, accumulation - dt * 0.00035);
  }
}

export function renderWeather(ctx, cam) {
  const kind = state.weather.kind;
  const intensity = state.weather.intensity;
  const accumulation = state.weather.accumulation ?? 0;
  if (accumulation > 0.05) {
    ctx.save();
    if (kind === 'snow') {
      ctx.fillStyle = `rgba(232,238,238,${0.12 * accumulation})`; ctx.fillRect(0, 0, cam.w, cam.h);
    } else if (kind === 'rain' || kind === 'storm') {
      ctx.fillStyle = `rgba(120,150,170,${0.08 * accumulation})`;
      for (let i = 0; i < 14; i++) {
        const x = ((i * 137 + 41) % 1010) / 1010 * cam.w;
        const y = ((i * 283 + 73) % 707) / 707 * cam.h;
        ctx.beginPath(); ctx.ellipse(x, y, 16 + i % 5 * 4, 4 + i % 3 * 2, 0, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  }
  if (kind === 'rain' || kind === 'storm') {
    ctx.save();
    ctx.strokeStyle = kind === 'storm' ? 'rgba(180,210,255,0.48)' : 'rgba(170,205,235,0.38)';
    ctx.lineWidth = 1;
    for (const p of particles) {
      if (Math.random() > intensity * 1.2) continue;
      const x = p.x * cam.w, y = p.y * cam.h;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 11 + intensity * 8); ctx.stroke();
    }
    if (kind === 'storm' && thunderT < 0.12) { ctx.fillStyle = 'rgba(230,240,255,0.22)'; ctx.fillRect(0, 0, cam.w, cam.h); }
    ctx.restore();
  } else if (kind === 'snow') {
    ctx.save(); ctx.fillStyle = 'rgba(245,248,255,0.78)';
    for (const p of particles) { const r = 1 + p.v * 1.8; ctx.beginPath(); ctx.arc(p.x * cam.w, p.y * cam.h, r, 0, 7); ctx.fill(); }
    ctx.restore();
  } else if (kind === 'fog') {
    ctx.save(); ctx.fillStyle = `rgba(210,220,220,${0.12 + intensity * 0.22})`; ctx.fillRect(0, 0, cam.w, cam.h); ctx.restore();
  }
}
