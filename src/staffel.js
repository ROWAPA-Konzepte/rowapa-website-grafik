/* Staffel (ab 1.49.0): Kinder eines Behälters erscheinen nacheinander.
   Am Behälter: data-grafik="staffel". Kinder: data-kinder (CSS-Auswahl, Standard: direkte Kinder).
   data-staffel="scroll" (Standard): Fortschritt folgt dem Scrollen. data-start (Anteil Fensterhöhe, Standard 0.95),
     data-laenge (Standard 0.6), data-versatz (je Kind, Standard 0.16), data-dauer (Anteil, Standard 0.36).
   data-staffel="einmal": jedes Kind blendet einmal ein, sobald es ins Bild kommt (Handy-Karten, Entscheid 440).
   data-staffel-handy (ab 1.50.0): eigener Modus bis 767 px Breite, z. B. «einmal» (Herausforderungen, Entscheid 440).
   data-nur="handy": nur bis 767 px Breite aktiv. data-weg: Weg in rem beim Einblenden (Standard 1.5), data-richtung
   "y" (Standard) oder "x". Bei «Bewegung reduzieren» läuft das Modul nicht, alles steht sichtbar. */
import { clamp, zahl, takt } from './util.js';

export function staffel(el) {
  const nur = (el.getAttribute('data-nur') || '').trim();
  if (nur === 'handy' && !matchMedia('(max-width: 767px)').matches) return;
  const sel = el.getAttribute('data-kinder');
  const kinder = sel ? [...el.querySelectorAll(sel)] : [...el.children];
  if (!kinder.length) return;
  const weg = zahl(el, 'data-weg', 1.5), x = (el.getAttribute('data-richtung') || 'y') === 'x';
  const setze = (k, e) => {
    k.style.opacity = e.toFixed(3);
    k.style.transform = e >= 1 ? '' : (x ? `translateX(${(-(1 - e) * weg).toFixed(3)}rem)` : `translateY(${((1 - e) * weg).toFixed(3)}rem)`);
  };
  const handy = matchMedia('(max-width: 767px)').matches;
  const modus = ((handy && el.getAttribute('data-staffel-handy')) || el.getAttribute('data-staffel') || 'scroll').trim();
  if (modus === 'einmal') {
    kinder.forEach(k => { setze(k, 0); k.style.transition = 'opacity .6s ease, transform .7s cubic-bezier(.33,1,.68,1)'; });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { setze(e.target, 1); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    kinder.forEach(k => io.observe(k));
    return;
  }
  const start = zahl(el, 'data-start', 0.95), laenge = zahl(el, 'data-laenge', 0.6), versatz = zahl(el, 'data-versatz', 0.16), dauer = zahl(el, 'data-dauer', 0.36);
  let altP = -1;
  takt(() => {
    const vh = innerHeight, r = el.getBoundingClientRect();
    const p = clamp((vh * start - r.top) / (vh * laenge), 0, 1);
    if (p === altP) return;
    altP = p;
    kinder.forEach((k, i) => setze(k, clamp((p - i * versatz) / dauer, 0, 1)));
  });
}
