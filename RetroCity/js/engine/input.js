// Ввод: клавиатура, мышь (прицел по курсору), колесо — масштаб.
export const input = { keys: {}, pressed: {}, mouse: { x: 0, y: 0, down: false, inside: false }, wheel: 0 };
export function bindInput(canvas) {
  window.addEventListener('keydown', e => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    if (!e.repeat) input.pressed[e.code] = true;
    input.keys[e.code] = true;
  });
  window.addEventListener('keyup', e => { input.keys[e.code] = false; });
  window.addEventListener('blur', () => { input.keys = {}; input.mouse.down = false; });
  canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); input.mouse.x = e.clientX - r.left; input.mouse.y = e.clientY - r.top; input.mouse.inside = true; });
  canvas.addEventListener('mouseleave', () => { input.mouse.inside = false; });
  canvas.addEventListener('mousedown', e => { if (e.button === 0) input.mouse.down = true; });
  window.addEventListener('mouseup', e => { if (e.button === 0) input.mouse.down = false; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); input.wheel += Math.sign(e.deltaY); }, { passive: false });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
}
export const down = (...codes) => codes.some(c => input.keys[c]);
export const hit = code => !!input.pressed[code];
export function endFrame() { input.pressed = {}; input.wheel = 0; }
