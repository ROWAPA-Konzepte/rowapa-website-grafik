/* Hilfsfunktionen: Einstellungen lesen, CI-Farben, Sichtbarkeit, gemeinsamer Takt */

export const reduziert = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const istHandy = () => innerWidth < 700;
/* Gerät mit Maus oder Trackpad, auch wenn es zusätzlich einen Touchscreen hat (Chrome meldet solche Laptops sonst als Touch-Gerät) */
export const hatMaus = () => matchMedia('(any-hover: hover) and (any-pointer: fine)').matches;
/* Ruft f einmal auf, sobald eine Maus oder ein Trackpad benutzt wird: sofort, wenn der Browser eines meldet, sonst bei der
   ersten Mausbewegung. Manche Windows-Geräte mit Touchscreen melden auch mit angeschlossener Maus «nur Touch». */
export function beiMaus(f) {
  if (hatMaus()) { f(); return; }
  const pruefe = e => {
    if (e.pointerType !== 'mouse') return;
    removeEventListener('pointermove', pruefe);
    f();
  };
  addEventListener('pointermove', pruefe, { passive: true });
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = t => 1 - Math.pow(1 - t, 3);
export const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* Zahl aus einem Attribut, sonst Standard */
export function zahl(el, name, def) {
  const v = parseFloat(el.getAttribute(name));
  return isFinite(v) ? v : def;
}

/* Farbe als [r,g,b] 0–255 aus Hex oder rgb() */
export function rgb(s) {
  s = (s || '').trim();
  let m = s.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  }
  m = s.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

/* CI-Farbe aus den Webflow-Variablen (Sammlung «Farben»), sonst Ersatzwert */
export function ciFarbe(name, ersatz) {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--_farben---' + name);
  return rgb(v) || rgb(ersatz);
}

/* Attribut-Farbe (Hex) vor CI-Variable */
export function farbe(el, attr, ciName, ersatz) {
  return rgb(el.getAttribute(attr)) || ciFarbe(ciName, ersatz);
}

/* Beobachtet, ob ein Element im Bild ist; ruft cb(true/false) bei Wechsel */
export function sichtbar(el, cb, rand = '0px') {
  const io = new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting)), { rootMargin: rand });
  io.observe(el);
  return io;
}

/* Einmal auslösen, sobald das Element nahe am Bild ist */
export function sobaldNahe(el, cb, rand = '0px') {
  const io = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)) { io.disconnect(); cb(); }
  }, { rootMargin: rand });
  io.observe(el);
}

/* Gemeinsamer Takt für alle Animationen: läuft nur, solange jemand ihn braucht */
const nutzer = new Set();
let laeuft = false;
function schritt(t) {
  if (!nutzer.size || document.hidden) { laeuft = false; return; }
  nutzer.forEach(f => { if (f(t) === false) nutzer.delete(f); });
  requestAnimationFrame(schritt);
}
export function takt(f) {
  nutzer.add(f);
  if (!laeuft) { laeuft = true; requestAnimationFrame(schritt); }
  return () => nutzer.delete(f);
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && nutzer.size && !laeuft) { laeuft = true; requestAnimationFrame(schritt); }
});
