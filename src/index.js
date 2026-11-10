/* ROWAPA Grafik: Punkte-Grafiken und kleine Bewegungen der ROWAPA-Website.
   Gesteuert über Attribute in Webflow (Settings › Custom attributes), siehe LIESMICH.md.
   Ohne dieses Skript bleiben überall die Standbilder stehen. */
import { reduziert } from './util.js';
import { punktemeer } from './punktemeer.js';
import { figur } from './figur.js';
import { zaehler } from './zaehler.js';
import { treppe } from './treppe.js';
import { orbit } from './orbit.js';
import { reihe } from './reihe.js';
import { zeiger } from './zeiger.js';
import { vorschau } from './vorschau.js';
import { hoverVideos } from './hovervideo.js';
import { nachoben } from './nachoben.js';
import { themen } from './themen.js';
import { diagnose } from './diagnose.js';
import { methoden } from './methoden.js';
import { aufbau } from './aufbau.js';
import { diagramm } from './diagramm.js';
import { kopfleiste } from './kopfleiste.js';
import { auswertung } from './auswertung.js';
import { punktbild } from './punktbild.js';
import { punktwandel } from './punktwandel.js';

const VERSION = '__VERSION__';

/* Bedienung (immer) und Bewegung (nur ohne «Bewegung reduzieren»); themen, diagramm und kopfleiste prüfen «Bewegung reduzieren» selbst
   (diagramm muss immer laufen, weil es die Werte überhaupt erst setzt; punktbild zeichnet auch ohne Bewegung den Zustand) */
const BEDIENUNG = { reihe, zeiger, vorschau, nachoben, themen, diagramm, kopfleiste, punktbild, punktwandel };
const BEWEGUNG = { punktemeer, punktfigur: figur, zaehler, treppe, orbit, methoden, aufbau, auswertung };

const info = (window.ROWAPAGrafik = { version: VERSION });
let gestartet = false;

function start() {
  if (gestartet) return;
  gestartet = true;
  info.gestartet = performance.now();
  hoverVideos(info);
  const ruhig = reduziert();
  document.querySelectorAll('[data-grafik]').forEach(el => {
    if (el.hasAttribute('data-rg-kopf-laeuft')) return; /* schon mit dem Kopf gestartet (1.30.0) */
    const art = (el.getAttribute('data-grafik') || '').trim().toLowerCase();
    const name = art.split('-')[0];
    const f = BEDIENUNG[name] || (!ruhig && BEWEGUNG[name]);
    try {
      if (f) f(el, art);
    } catch (e) {
      /* Fehler in einer Grafik lässt deren Standbild stehen */
    }
  });
}

/* Seitenwechsel (Kopf-Skript «ROWAPASeitenwechsel» ab 1.1.0; ab 1.2.0 immer): Solange die Seite im Hintergrund
   vorgeladen wird (document.prerendering) oder beim Seitenwechsel noch einfährt (html[data-rg-wechsel]), warten die Grafiken;
   bis dahin stehen die Standbilder. So muss der Browser während des Einfahrens nichts anderes rechnen. Ohne dieses Attribut
   (direkter Aufruf, Seitenwechsel 1.0.0) startet alles wie bisher. */
function nachWechsel(f) {
  if (document.prerendering) {
    let weiter = false;
    const w = () => { if (!weiter) { weiter = true; setTimeout(() => nachWechsel(f), 0); } };
    document.addEventListener('prerenderingchange', () => { addEventListener('pagereveal', w, { once: true }); setTimeout(w, 400); }, { once: true });
    return;
  }
  if (!document.documentElement.hasAttribute('data-rg-wechsel')) { f(); return; }
  let los = false;
  const g = () => { if (!los) { los = true; f(); } };
  addEventListener('rg-wechsel-fertig', g, { once: true });
  setTimeout(g, 2500);
}

/* Ab 1.30.0: Kopf gemeinsam einblenden. Steht am html-Element data-rg-kopf (Einblendzeit in Sekunden, z. B. "0.8"), startet
   das Wellenmeer im ersten Bildschirm sofort, nicht erst nach dem Laden und auch während eines Seitenwechsels, und blendet in
   genau dieser Zeit ein. Mit seinem ersten Bild setzt das Skript html.rg-kopf-an; daran hängt das CSS, das den übrigen Inhalt
   des Headers gleich lang einblendet (heute im Kopf-Skript der Entwurfsseiten). Ohne WebGL, ohne Wellenmeer oder bei
   «Bewegung reduzieren» kommen rg-kopf-an und rg-kopf-standbild sofort: Der Header steht mit dem Standbild da. */
function kopf() {
  const H = document.documentElement;
  const d = parseFloat(H.getAttribute('data-rg-kopf'));
  if (!(d > 0)) return;
  info.kopf = d;
  const an = live => {
    if (!live) H.classList.add('rg-kopf-standbild');
    if (!H.classList.contains('rg-kopf-an')) { H.classList.add('rg-kopf-an'); info.kopfAn = performance.now(); }
  };
  if (reduziert()) { an(false); return; }
  const box = [...document.querySelectorAll('[data-grafik="punktemeer"]')].find(e => e.getBoundingClientRect().top < innerHeight);
  if (!box) { an(false); return; }
  box.setAttribute('data-rg-kopf-laeuft', '');
  try { punktemeer(box, 'punktemeer', { dauer: d, bereit: an }); } catch (e) { an(false); }
}

diagnose(info);
kopf();
/* erst nach dem Laden der Seite, damit der erste Bildaufbau nicht verzögert wird; hängt eine Datei (langsames Netz),
   startet alles spätestens 5 s nach dem Aufbau der Seite */
if (document.readyState === 'complete') nachWechsel(() => setTimeout(start, 0));
else {
  addEventListener('load', () => nachWechsel(() => setTimeout(start, 0)), { once: true });
  const spaetestens = () => setTimeout(() => nachWechsel(start), 5000);
  if (document.readyState === 'interactive') spaetestens();
  else document.addEventListener('DOMContentLoaded', spaetestens, { once: true });
}
