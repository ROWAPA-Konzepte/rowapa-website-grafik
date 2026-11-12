/* Laufband (ab 1.49.0, Entscheide 433, 434): Logos laufen ohne Ende von links nach rechts, auf jeder Breite lückenlos.
   Aufbau in Webflow: ein Behälter mit data-grafik="laufband" (overflow hidden), darin die Spur (erstes Kind, Flex-Reihe),
   darin die Logos, z. B. eine Collection-Liste aus «Unternehmen & Partner». Das Modul setzt so viele Kopien der Logos
   hintereinander, dass die Spur breiter ist als Fenster plus ein Satz, und verschiebt sie um genau einen Satz.
   data-tempo: Pixel pro Sekunde (Standard 40). data-bildklasse (ab 1.51.0): Klasse(n) der laufenden Logos statt der
   Klassen der Vorlage, z. B. wenn die Logos aus der Komponente «Logo-Leiste» kommen und im Band kleiner stehen. Bei «Bewegung reduzieren» läuft das Modul nicht, die Logos stehen. */
import { clamp, zahl } from './util.js';

export function laufband(el) {
  const spur = el.firstElementChild;
  if (!spur) return;
  /* die Logos selbst: Bilder in der Spur, auch in einer Collection-Liste */
  const vorlage = [...spur.querySelectorAll('img')];
  if (!vorlage.length) return;
  const tempo = clamp(zahl(el, 'data-tempo', 40), 5, 200);
  /* flache Spur: alle Bilder direkt in die Spur, Collection-Hüllen bleiben leer stehen und werden ausgeblendet */
  const huellen = [...spur.children];
  const klasse = (el.getAttribute('data-bildklasse') || '').trim();
  const satz = vorlage.map(img => { const c = img.cloneNode(true); c.removeAttribute('loading'); if (klasse) c.className = klasse; return c; });
  huellen.forEach(h => { h.style.display = 'none'; h.setAttribute('aria-hidden', 'true'); });
  let n = 0;
  const kopie = () => {
    satz.forEach((img, i) => { const c = img.cloneNode(true); if (n > 0) c.alt = ''; if (n > 0) c.setAttribute('aria-hidden', 'true'); spur.appendChild(c); });
    n++;
  };
  kopie(); kopie();
  let anim = null, alteBreite = 0;
  const mass = () => {
    const k = [...spur.querySelectorAll(':scope > img')], m = satz.length;
    if (k.length < 2 * m) return;
    const breite = k[m].offsetLeft - k[0].offsetLeft;
    if (breite < 50) return;
    while (n < Math.ceil(document.documentElement.clientWidth / breite) + 1) kopie();
    if (breite === alteBreite && anim) return;
    alteBreite = breite;
    if (anim) anim.cancel();
    anim = spur.animate([{ transform: `translateX(${-breite}px)` }, { transform: 'translateX(0)' }], { duration: (breite / tempo) * 1000, iterations: Infinity, easing: 'linear' });
  };
  spur.querySelectorAll('img').forEach(i => { if (!i.complete) i.addEventListener('load', mass); });
  addEventListener('resize', mass);
  addEventListener('load', mass);
  mass();
}
