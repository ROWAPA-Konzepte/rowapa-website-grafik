/* Kopfleiste: Die Navigation blendet beim Runterscrollen aus und beim Hochscrollen wieder ein (ab 1.22.0, Entscheid 390,
   nach dem Muster von Tresmares: 0,6 s, ein nach 200 px Hochscrollen oder am Seitenanfang).
   Webflow-Interaktionen kennen über die Schnittstelle keinen Auslöser «Scrollrichtung», darum dieses kleine Modul.

   Einschalten: ein Element in der Navigation mit data-grafik="kopfleiste" (navbar_container). Bewegt wird die ganze
   Navigation (.navbar_component).
     data-kopfleiste-ab="200"       erst ab dieser Scrolltiefe in px blendet sie aus (Standard 200)
     data-kopfleiste-zurueck="200"  so viele px Hochscrollen holen sie zurück (Standard 200; 0 = sofort)
   Elemente mit data-kopfleiste-folgt (z. B. eine klebende Leiste unter der Navigation) rücken mit nach oben.
   Bleibt sichtbar: am Seitenanfang (unter 10 px), solange ein Menü offen ist oder die Navigation den Tastatur-Fokus hat.
   Bei «Bewegung reduzieren» ohne Gleiten.

   Ab 1.23.0 bewegt das Modul die CSS-Eigenschaft «translate» (Web Animations), nicht «transform». So bleibt es unabhängig
   von der Themen-Bühne der Startseite, die die Navigation über «transform» ausblendet. Nach dem Einblenden ist die
   Eigenschaft wieder leer, damit fixierte Elemente in der Navigation sich auf das Fenster beziehen. */
import { reduziert, zahl } from './util.js';

const KURVE = 'cubic-bezier(.33,1,.68,1)'; /* power2.out */

export function kopfleiste(el) {
  const nav = el.closest('.navbar_component') || el.closest('nav');
  if (!nav || nav.dataset.kopfleisteAktiv) return;
  nav.dataset.kopfleisteAktiv = 'ja';
  const ab = zahl(el, 'data-kopfleiste-ab', 200);
  const zurueck = Math.max(0, zahl(el, 'data-kopfleiste-zurueck', 200));
  const folger = () => [...document.querySelectorAll('[data-kopfleiste-folgt]')];
  const laufend = new Map();

  let versteckt = false, letzte = scrollY, wende = scrollY, richtung = 0, wartet = false;

  const offen = () => !!nav.querySelector('.w--open, :focus-visible');

  /* ein Element von seiner jetzigen Lage nach «bis» bewegen; bis = null heisst zurück in die Ruhelage */
  function bewegen(e, bis) {
    const alt = laufend.get(e);
    const jetzt = getComputedStyle(e).translate;
    if (alt) { alt.cancel(); laufend.delete(e); }
    e.style.translate = '';
    if (reduziert() || !e.animate) {
      if (bis) e.style.translate = bis;
      return;
    }
    const von = !jetzt || jetzt === 'none' ? '0px 0px' : jetzt;
    const a = e.animate([{ translate: von }, { translate: bis || '0px 0px' }], { duration: 600, easing: KURVE, fill: 'forwards' });
    laufend.set(e, a);
    a.onfinish = () => {
      if (laufend.get(e) !== a) return;
      laufend.delete(e);
      if (bis) e.style.translate = bis;
      a.cancel();
    };
  }

  function zeigen(an) {
    if (an === !versteckt) return;
    versteckt = !an;
    const hoehe = nav.offsetHeight;
    bewegen(nav, an ? null : '0px -100%');
    folger().forEach(f => bewegen(f, an ? null : `0px ${-hoehe}px`));
  }

  function pruefen() {
    wartet = false;
    const y = scrollY;
    const r = Math.sign(y - letzte);
    if (r && r !== richtung) { richtung = r; wende = letzte; }
    letzte = y;
    if (y < 10 || offen()) { zeigen(true); return; }
    if (richtung > 0 && y > ab) zeigen(false);
    else if (richtung < 0 && wende - y >= zurueck) zeigen(true);
  }

  addEventListener('scroll', () => {
    if (!wartet) { wartet = true; requestAnimationFrame(pruefen); }
  }, { passive: true });
  nav.addEventListener('focusin', () => { if (nav.querySelector(':focus-visible')) zeigen(true); });
  /* für Prüfungen von Hand: ROWAPAGrafik.kopfleiste.zeigen(true|false) */
  if (window.ROWAPAGrafik) window.ROWAPAGrafik.kopfleiste = { zeigen };
}
