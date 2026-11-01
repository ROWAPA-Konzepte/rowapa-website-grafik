/* Methoden: Scroll-Geschichte «Fünf Methoden» der Seite Performance-Analyse (ab 1.19.0).
   Am Element mit den drei Spalten (Liste · Linien · Ergebnis, Klasse methode_layout) steht data-grafik="methoden".
   Ab 992 px bleibt die Grafik beim Scrollen stehen; Methode für Methode leuchtet auf, ihre Linie zeichnet sich mit
   einem Punkt zum Ergebnis, die zugehörigen Punkte im Ergebnis füllen sich (Attribut data-punkte an der Zeile,
   z. B. "2,3" = zweiter und dritter Punkt). Am Ende «Fünf Quellen, ein Bild». Darüberfahren färbt die Linie Plum.
   Unter 992 px und bei «Bewegung reduzieren» bleibt alles stehen, wie im Designer.
   Einstellungen: data-schritt (Scrollweg je Methode in px, Standard 190), data-text-schritt («Methode {n} von {N}»),
   data-text-fertig («Fünf Quellen, ein Bild»). Texte und Inhalte bleiben normale Webflow-Elemente.

   Ab 1.23.0 (Entwurf Runde 76): data-grafik="methoden-klapp" macht daraus aufklappbare Methoden (nach dem Muster der
   Lösungen bei Tresmares): Immer eine Methode ist offen (zu Beginn die erste), ein Klick auf eine andere wechselt, ein
   Klick auf die offene schliesst sie. Im Ergebnis leuchten die Punkte der offenen Methode (data-punkte), ihre Linie ist
   Plum. Kein Stehenbleiben beim Scrollen, auf allen Breiten. Im Designer bleibt alles offen und direkt bearbeitbar.
   Kopf = methode_kopf (der Titel wird zur Schaltfläche), Inhalt = alles in der Zeile nach dem Kopf.

   Ab 1.24.0 (Entscheid 394): data-oeffnen="hover" am Behälter öffnet eine Methode auch, wenn die Maus darüberfährt
   (nur mit Maus, nicht auf Touch). Die vorher offene schliesst sich. Kleine Verzögerung (180 ms) und nur bei echter
   Mausbewegung; beim Zuklappen weiter oben bleibt die neu geöffnete Methode unter der Maus stehen, damit nichts springt.
   Das Attribut wird laufend gelesen und lässt sich ein- und ausschalten. Klick funktioniert weiterhin.

   Ab 1.25.0 (Entscheid 395): data-ergebnis="marke" am Behälter lässt im Ergebnis-Kasten alle Punkte voll sichtbar;
   nur die Marke (methode_panel-marke) der Punkte der offenen Methode wird Plum. Auch die feste Plum-Marke (is-plum) ist
   dann nur Plum, wenn ihre Methode offen ist. Ohne das Attribut wie bisher: Punkte der übrigen Methoden treten zurück. */
import { clamp, zahl, takt } from './util.js';

const CSS = `
[data-grafik^="methoden"].rg-m .methode_zeile{transition:opacity .28s,box-shadow .28s,transform .28s,border-color .28s}
[data-grafik^="methoden"].rg-m .methode_zeile:not(.rg-an){opacity:.38}
[data-grafik^="methoden"].rg-m .methode_zeile.rg-jetzt{box-shadow:0 12px 32px rgba(29,49,73,.16);transform:translateX(8px);border-left-color:#AA1351}
[data-grafik^="methoden"].rg-m .methode_panel-punkt{transition:opacity .3s,transform .3s}
[data-grafik^="methoden"].rg-m .methode_panel-punkt:not(.rg-an){opacity:.22;transform:translateX(10px)}
[data-grafik^="methoden"].rg-m .methode_panel{transition:box-shadow 1s}
[data-grafik^="methoden"].rg-m.rg-fertig .methode_panel{box-shadow:0 0 0 3px rgba(170,19,81,.55),0 18px 48px rgba(29,49,73,.25)}
[data-grafik^="methoden"].rg-m .methode_panel-bild{transition:opacity .7s}
[data-grafik^="methoden"].rg-m.rg-fertig .methode_panel-bild{opacity:.6}
.rg-m-linien{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.rg-m-linien path{fill:none;stroke:#A0C4DF;stroke-width:2;transition:stroke .2s,stroke-width .2s}
.rg-m-linien path.rg-otj{stroke:#AA1351}
.rg-m-linien path.rg-hl{stroke:#AA1351;stroke-width:3}
.rg-m-linien path.rg-pfeil{stroke:#486EA3;stroke-width:2}
.rg-m-linien circle{fill:#AA1351;transition:opacity .2s}
.rg-m-schritt{position:absolute;right:0;top:-2.25rem;font-family:var(--_typo---font-accent,inherit);font-weight:800;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:#AA1351}
`;

let cssDa = false;
function css() {
  if (cssDa) return;
  cssDa = true;
  const s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function methoden(el, art) {
  if ((art || '').toLowerCase() === 'methoden-klapp') { klapp(el); return; }
  if (innerWidth < 992) return;
  const zeilen = [...el.querySelectorAll('.methode_zeile')];
  const punkte = [...el.querySelectorAll('.methode_panel-punkt')];
  const linien = el.querySelector('.methode_linien');
  const panel = el.querySelector('.methode_panel');
  if (!zeilen.length || !linien || !panel) return;
  css();

  const N = zeilen.length;
  const STEP = clamp(zahl(el, 'data-schritt', 190), 80, 600);
  const textSchritt = el.getAttribute('data-text-schritt') || 'Methode {n} von {N}';
  const textFertig = el.getAttribute('data-text-fertig') || 'Fünf Quellen, ein Bild';
  const karte = zeilen.map(z => (z.getAttribute('data-punkte') || '').split(',').map(s => parseInt(s, 10) - 1).filter(i => i >= 0 && i < punkte.length));

  /* Stehenbleiben: Hülle mit zusätzlichem Scrollweg, innen klebt die Grafik */
  const huelle = document.createElement('div');
  const innen = document.createElement('div');
  huelle.style.position = 'relative';
  innen.style.position = 'sticky';
  el.parentNode.insertBefore(huelle, el);
  innen.appendChild(el);
  huelle.appendChild(innen);
  el.classList.add('rg-m');

  const schritt = document.createElement('div');
  schritt.className = 'rg-m-schritt';
  schritt.setAttribute('aria-hidden', 'true');
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.appendChild(schritt);

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'rg-m-linien');
  svg.setAttribute('aria-hidden', 'true');
  linien.appendChild(svg);
  let pfade = [], laengen = [], dots = [];

  function zeichneLinien() {
    const wr = linien.getBoundingClientRect();
    if (!wr.width) return;
    const pr = panel.getBoundingClientRect();
    const ty = pr.top + pr.height / 2 - wr.top, w = wr.width;
    svg.setAttribute('viewBox', `0 0 ${w} ${wr.height}`);
    let h = '';
    zeilen.forEach((z, k) => {
      const b = z.getBoundingClientRect(), y = b.top + b.height / 2 - wr.top;
      const otj = z.classList.contains('is-otj') ? ' rg-otj' : '';
      h += `<path class="rg-w${otj}" d="M0,${y} C${w * 0.55},${y} ${w * 0.45},${ty} ${w - 2},${ty}"/>`;
    });
    h += `<path class="rg-pfeil" d="M${w - 10},${ty - 6} L${w - 2},${ty} L${w - 10},${ty + 6}"/>`;
    zeilen.forEach(() => { h += '<circle r="4.5" cx="-30" cy="-30" style="opacity:0"/>'; });
    svg.innerHTML = h;
    pfade = [...svg.querySelectorAll('path.rg-w')];
    dots = [...svg.querySelectorAll('circle')];
    laengen = pfade.map(p => p.getTotalLength());
    pfade.forEach((p, k) => { p.style.strokeDasharray = laengen[k]; p.style.strokeDashoffset = laengen[k]; });
  }

  function layout() {
    const h = innen.offsetHeight;
    innen.style.top = `max(96px, calc(50vh - ${h / 2}px + 36px))`;
    huelle.style.height = h + STEP * (N + 1) + 'px';
    zeichneLinien();
    update();
  }

  function update() {
    const top = huelle.getBoundingClientRect().top;
    const start = parseFloat(getComputedStyle(innen).top) || 0;
    const prog = Math.max(0, start - top) / STEP;
    let jetzt = -1;
    const an = new Set();
    zeilen.forEach((z, k) => {
      const lp = clamp(prog - k, 0, 1);
      z.classList.toggle('rg-an', lp > 0.02);
      z.classList.toggle('rg-jetzt', lp > 0.02 && lp < 1);
      if (lp > 0.02 && lp < 1) jetzt = k;
      const p = pfade[k], d = dots[k];
      if (p) {
        p.style.strokeDashoffset = laengen[k] * (1 - lp);
        if (lp > 0.02 && lp < 0.98) {
          const pt = p.getPointAtLength(laengen[k] * lp);
          d.setAttribute('cx', pt.x); d.setAttribute('cy', pt.y); d.style.opacity = 1;
        } else d.style.opacity = 0;
      }
      if (lp >= 0.95) karte[k].forEach(i => an.add(i));
    });
    const fertig = prog >= N;
    punkte.forEach((l, i) => l.classList.toggle('rg-an', fertig || an.has(i)));
    el.classList.toggle('rg-fertig', fertig);
    schritt.textContent = fertig ? textFertig : jetzt >= 0 ? textSchritt.replace('{n}', jetzt + 1).replace('{N}', N) : '';
  }

  zeilen.forEach((z, k) => {
    z.addEventListener('mouseenter', () => pfade[k] && pfade[k].classList.add('rg-hl'));
    z.addEventListener('mouseleave', () => pfade[k] && pfade[k].classList.remove('rg-hl'));
  });

  /* Scrollen: höchstens einmal pro Bild rechnen */
  let offen = false;
  addEventListener('scroll', () => {
    if (offen) return;
    offen = true;
    takt(() => { offen = false; update(); return false; });
  }, { passive: true });
  addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();
}


/* ---------- Aufklappbare Methoden (methoden-klapp) ---------- */
const CSS_KLAPP = `
.rg-mk .methode_kopf{cursor:pointer;position:relative;padding-right:2.5rem}
.rg-mk-knopf{all:unset;cursor:pointer;display:inline;font:inherit;color:inherit;letter-spacing:inherit}
.rg-mk-knopf:focus-visible{outline:2px solid #AA1351;outline-offset:4px;border-radius:2px}
.rg-mk-plus{position:absolute;right:0;top:50%;width:1rem;height:1rem;margin-top:-.5rem;pointer-events:none}
.rg-mk-plus::before,.rg-mk-plus::after{content:"";position:absolute;left:0;top:50%;width:100%;height:2px;margin-top:-1px;background:currentColor;transition:transform .45s cubic-bezier(.37,0,.63,1)}
.rg-mk-plus::after{transform:rotate(90deg)}
.rg-mk .rg-offen .rg-mk-plus::after{transform:rotate(0deg)}
.rg-mk-inhalt{overflow:hidden;transition:height .55s cubic-bezier(.37,0,.63,1),opacity .45s ease}
.rg-mk .methode_zeile:not(.rg-offen) .rg-mk-inhalt{opacity:0}
.rg-mk .methode_zeile{transition:border-color .3s,background-color .3s}
.rg-mk .methode_zeile.rg-offen{border-left-color:#AA1351}
.rg-mk .methode_panel-punkt{transition:opacity .35s}
.rg-mk .methode_panel-punkt:not(.rg-an){opacity:.3}
[data-ergebnis="marke"].rg-mk .methode_panel-punkt:not(.rg-an){opacity:1}
[data-ergebnis="marke"].rg-mk .methode_panel-marke{background-color:#A0C4DF;transition:background-color .3s,transform .3s}
[data-ergebnis="marke"].rg-mk:not(.rg-mk-zu) .methode_panel-punkt.rg-an .methode_panel-marke{background-color:#AA1351;transform:scale(1.25)}
@media (prefers-reduced-motion:reduce){.rg-mk-inhalt,.rg-mk-plus::before,.rg-mk-plus::after,.methode_panel-marke{transition:none}}
`;

function klapp(el) {
  const zeilen = [...el.querySelectorAll('.methode_zeile')];
  const punkte = [...el.querySelectorAll('.methode_panel-punkt')];
  const linien = el.querySelector('.methode_linien');
  const panel = el.querySelector('.methode_panel');
  if (!zeilen.length || el.classList.contains('rg-mk')) return;
  const s = document.createElement('style');
  s.textContent = CSS + CSS_KLAPP;
  document.head.appendChild(s);
  el.classList.add('rg-mk');
  const karte = zeilen.map(z => (z.getAttribute('data-punkte') || '').split(',').map(t => parseInt(t, 10) - 1).filter(i => i >= 0 && i < punkte.length));
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Aufbau zur Laufzeit: Inhalt in eine Hülle, Titel in eine Schaltfläche, Plus-Zeichen */
  const teile = zeilen.map((z, k) => {
    const kopf = z.querySelector('.methode_kopf');
    const huelle = document.createElement('div');
    huelle.className = 'rg-mk-inhalt';
    huelle.id = 'rg-mk-' + k;
    [...z.children].filter(c => c !== kopf).forEach(c => huelle.appendChild(c));
    z.appendChild(huelle);
    const titel = kopf && kopf.querySelector('h1,h2,h3,h4,h5,h6');
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'rg-mk-knopf';
    knopf.setAttribute('aria-controls', huelle.id);
    if (titel) { while (titel.firstChild) knopf.appendChild(titel.firstChild); titel.appendChild(knopf); }
    const plus = document.createElement('span');
    plus.className = 'rg-mk-plus';
    plus.setAttribute('aria-hidden', 'true');
    if (kopf) kopf.appendChild(plus);
    return { z, kopf, huelle, knopf };
  });

  /* Linien von jeder Methode zum Ergebnis (nur wo die Spalte sichtbar ist) */
  const svgNS = 'http://www.w3.org/2000/svg';
  let svg = null, pfade = [];
  if (linien && panel) {
    svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'rg-m-linien');
    svg.setAttribute('aria-hidden', 'true');
    linien.appendChild(svg);
  }
  let offenK = -1;
  function zeichnen() {
    if (!svg) return;
    const wr = linien.getBoundingClientRect();
    if (!wr.width) { svg.innerHTML = ''; return; }
    const pr = panel.getBoundingClientRect();
    const ty = pr.top + pr.height / 2 - wr.top, w = wr.width;
    svg.setAttribute('viewBox', `0 0 ${w} ${wr.height}`);
    let h = '';
    teile.forEach(({ z, kopf }) => {
      const b = (kopf || z).getBoundingClientRect(), y = b.top + b.height / 2 - wr.top;
      const otj = z.classList.contains('is-otj') ? ' rg-otj' : '';
      h += `<path class="rg-w${otj}" d="M0,${y} C${w * 0.55},${y} ${w * 0.45},${ty} ${w - 2},${ty}"/>`;
    });
    h += `<path class="rg-pfeil" d="M${w - 10},${ty - 6} L${w - 2},${ty} L${w - 10},${ty + 6}"/>`;
    svg.innerHTML = h;
    pfade = [...svg.querySelectorAll('path.rg-w')];
    pfade.forEach((p, k) => p.classList.toggle('rg-hl', k === offenK));
  }
  /* während des Auf- und Zuklappens die Linien mitführen; bei Öffnen per Maus die Zeile unter der Maus halten */
  let bis = 0, anker = null;
  function mitfuehren() {
    if (anker) {
      const d = anker.el.getBoundingClientRect().top - anker.top;
      if (Math.abs(d) >= 1) scrollBy(0, d);
    }
    zeichnen();
    if (performance.now() < bis) requestAnimationFrame(mitfuehren);
    else anker = null;
  }

  function setzen(k, halten) {
    el.classList.toggle('rg-mk-zu', k < 0);
    anker = halten && teile[k] ? { el: teile[k].kopf || teile[k].z, top: (teile[k].kopf || teile[k].z).getBoundingClientRect().top } : null;
    offenK = k;
    teile.forEach((t, i) => {
      const auf = i === k;
      const war = t.z.classList.contains('rg-offen');
      t.z.classList.toggle('rg-offen', auf);
      t.knopf.setAttribute('aria-expanded', auf ? 'true' : 'false');
      if (auf === war && t.huelle.style.height !== '') return;
      if (ruhig) { t.huelle.style.height = auf ? 'auto' : '0px'; return; }
      const h = t.huelle.scrollHeight;
      if (auf) {
        t.huelle.style.height = t.huelle.offsetHeight + 'px';
        requestAnimationFrame(() => { t.huelle.style.height = h + 'px'; });
        const fertig = e => { if (e.propertyName === 'height' && t.z.classList.contains('rg-offen')) t.huelle.style.height = 'auto'; t.huelle.removeEventListener('transitionend', fertig); };
        t.huelle.addEventListener('transitionend', fertig);
      } else {
        t.huelle.style.height = t.huelle.offsetHeight + 'px';
        void t.huelle.offsetHeight;
        requestAnimationFrame(() => { t.huelle.style.height = '0px'; });
      }
    });
    const an = new Set(k >= 0 ? karte[k] : []);
    punkte.forEach((p, i) => p.classList.toggle('rg-an', k < 0 || an.has(i)));
    bis = performance.now() + 700;
    requestAnimationFrame(mitfuehren);
  }

  teile.forEach((t, k) => {
    t.knopf.addEventListener('click', e => { e.stopPropagation(); setzen(offenK === k ? -1 : k); });
    if (t.kopf) t.kopf.addEventListener('click', () => t.knopf.click());
    t.z.addEventListener('mouseenter', () => pfade[k] && pfade[k].classList.add('rg-hl'));
    t.z.addEventListener('mouseleave', () => pfade[k] && k !== offenK && pfade[k].classList.remove('rg-hl'));
  });

  /* Öffnen beim Darüberfahren (data-oeffnen="hover") */
  const maus = matchMedia('(hover: hover) and (pointer: fine)');
  let wartet = 0, zuletzt = null;
  teile.forEach((t, k) => {
    t.z.addEventListener('mousemove', e => {
      if (!maus.matches || (el.getAttribute('data-oeffnen') || '').toLowerCase() !== 'hover') return;
      if (zuletzt && Math.abs(e.clientX - zuletzt.x) + Math.abs(e.clientY - zuletzt.y) < 3) return;
      zuletzt = { x: e.clientX, y: e.clientY };
      clearTimeout(wartet);
      if (k === offenK || performance.now() < bis) return;
      wartet = setTimeout(() => { if (t.z.matches(':hover') && offenK !== k) setzen(k, true); }, 180);
    });
  });
  el.addEventListener('mouseleave', () => clearTimeout(wartet));

  /* Start: alle zu ohne Bewegung, dann die erste offen */
  teile.forEach(t => { t.huelle.style.height = '0px'; });
  ruhigStart();
  function ruhigStart() {
    const t = teile[0];
    offenK = 0;
    teile.forEach((x, i) => { x.z.classList.toggle('rg-offen', i === 0); x.knopf.setAttribute('aria-expanded', i === 0 ? 'true' : 'false'); });
    t.huelle.style.height = 'auto';
    const an = new Set(karte[0]);
    punkte.forEach((p, i) => p.classList.toggle('rg-an', an.has(i)));
    zeichnen();
  }
  addEventListener('resize', zeichnen);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(zeichnen);
}
