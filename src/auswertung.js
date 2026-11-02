/* Auswertung: Beispielauswertungen der Seite Performance-Analyse Schritt für Schritt (ab 1.32.0, Entscheide 405, 406).
   Am Reiter-Element (Webflow Tabs, Klasse auswertung_tabs) steht data-grafik="auswertung".
   Jeder Reiter baut sich in vier Schritten auf, beim ersten Erscheinen und bei jedem Öffnen eines Reiters:
     1 Diagramm     das Modul diagramm zeichnet die Werte
     2 Abweichung   die auffälligste Stelle wird hervorgehoben (Zeile Plum Tint mit Plum-Linie), die übrigen treten leicht zurück
     3 Einordnung   der Text unten links erscheint (quote_content)
     4 Empfehlungen die Empfehlungen unten rechts erscheinen (auswertung_massnahme)
   Die Schrittleiste über dem Inhalt setzt das Skript selbst (nur Anzeige, für Vorleseprogramme ausgeblendet).
   Einstellungen am Reiter-Element (Element anklicken › Einstellungen › Attribute):
     data-schritte  Beschriftung der Schritte, getrennt mit «|» (Standard «1 Diagramm|2 Abweichung|3 Einordnung|4 Empfehlungen»)
     data-takt      Zeitpunkte von Schritt 2, 3 und 4 in Millisekunden nach dem Start, mit Komma (Standard 1400,2000,2600)
   Raster, Fragenspalte, Schriften und Farben sind Webflow-Klassen (auswertung_…, quote_…). Im Designer, ohne das Skript und bei
   «Bewegung reduzieren» steht alles sofort da (das Modul läuft dann nicht). */

const STANDARD = '1 Diagramm|2 Abweichung|3 Einordnung|4 Empfehlungen';
const TAKT = [1400, 2000, 2600];
const S = '[data-grafik="auswertung"]';
const J = ':is([data-schritt="2"],[data-schritt="3"],[data-schritt="4"])';
const SOFT = 'var(--_farben---manganese-soft-text,#4A5A70)';

const CSS = `
${S} .rg-aw-schritte{grid-column:2;grid-row:1;display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1.5rem;padding:1.5rem 2rem 0;font-size:.75rem;line-height:1.3;color:${SOFT}}
${S} .rg-aw-schritt{display:inline-flex;align-items:center;gap:.5rem;transition:color .2s}
${S} .rg-aw-schritt::before{content:"";flex:none;width:6px;height:6px;border-radius:50%;background:rgba(29,49,73,.22);transition:background-color .2s}
${S} .rg-aw-schritt.an{color:#AA1351}
${S} .rg-aw-schritt.an::before{background:#AA1351}
${S} .dia_zeile,${S} .bericht_schritt:last-child{margin-left:-1rem;margin-right:-1rem;padding-left:1rem;padding-right:1rem}
${S} .dia_zeile,${S} .dia_zelle,${S} .bericht_schritt,${S} .dia-hinweis{transition:opacity .4s,background-color .4s,box-shadow .4s}
${S} [data-schritt="1"] .dia-hinweis{opacity:0}
${S} [data-schritt="1"] .dia-hinweis-zelle{outline-color:transparent}
${S} ${J} .dia_zeile:not(.dia-hinweis-zeile){opacity:.84}
${S} ${J} .dia-hinweis-zeile{background-color:#FBEEF3;box-shadow:inset 3px 0 0 #AA1351}
${S} ${J} .dia_zelle:not(.dia-hinweis-zelle){opacity:.88}
${S} ${J} .bericht_schritt:not(:last-child){opacity:.84}
${S} ${J} .bericht_schritt:last-child{background-color:#FBEEF3;box-shadow:inset 3px 0 0 #AA1351}
${S} .quote_content,${S} .auswertung_massnahme{transition:opacity .45s,transform .45s}
${S} :is([data-schritt="1"],[data-schritt="2"]) .quote_content{opacity:0;transform:translateY(8px)}
${S} :is([data-schritt="1"],[data-schritt="2"],[data-schritt="3"]) .auswertung_massnahme{opacity:0;transform:translateY(8px)}
@media (max-width:991px){${S} .rg-aw-schritte{grid-column:1;grid-row:2;padding:1rem 1.5rem 0;gap:.5rem 1rem}}
@media (max-width:479px){${S} .rg-aw-schritte{display:grid;grid-template-columns:repeat(2,max-content);gap:.5rem 1.5rem}}
`;

let cssDa = false;
function css() {
  if (cssDa) return;
  cssDa = true;
  const s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function auswertung(el) {
  if (el.classList.contains('rg-aw')) return;
  const panes = [...el.querySelectorAll('.w-tab-pane')];
  if (!panes.length) return;
  el.classList.add('rg-aw');
  css();

  const namen = (el.getAttribute('data-schritte') || STANDARD).split('|').map(s => s.trim()).filter(Boolean).slice(0, 4);
  const t = (el.getAttribute('data-takt') || '').split(',').map(s => parseFloat(s)).filter(n => n >= 0);
  const takt = t.length === 3 ? t : TAKT;

  const leiste = document.createElement('div');
  leiste.className = 'rg-aw-schritte';
  leiste.setAttribute('aria-hidden', 'true');
  namen.forEach(n => {
    const s = document.createElement('span');
    s.className = 'rg-aw-schritt';
    s.textContent = n;
    leiste.appendChild(s);
  });
  el.insertBefore(leiste, el.firstChild);
  const punkte = [...leiste.children];

  let timer = [];
  let gestartet = false;
  const aktiv = p => p.classList.contains('w--tab-active');
  const setze = (p, n) => {
    p.setAttribute('data-schritt', String(n));
    if (aktiv(p)) punkte.forEach((c, i) => c.classList.toggle('an', i < n));
  };
  const lauf = p => {
    timer.forEach(clearTimeout);
    timer = [];
    setze(p, 1);
    takt.forEach((ms, i) => timer.push(setTimeout(() => setze(p, i + 2), ms)));
  };

  panes.forEach(p => {
    setze(p, 1);
    let war = aktiv(p);
    new MutationObserver(() => {
      const jetzt = aktiv(p);
      if (jetzt && !war) {
        if (gestartet) lauf(p);
        else setze(p, parseInt(p.getAttribute('data-schritt'), 10) || 1);
      }
      war = jetzt;
    }).observe(p, { attributes: true, attributeFilter: ['class'] });
  });

  const io = new IntersectionObserver(e => {
    if (!e[0].isIntersecting || gestartet) return;
    gestartet = true;
    io.disconnect();
    const p = panes.find(aktiv);
    if (p) lauf(p);
  }, { rootMargin: '0px 0px -15% 0px' });
  io.observe(el);
}
