> Seit 01.11.2026 (Runde 83) in diesem Repository. Vorher lag der Ordner unter `tools/grafik/figuren` im Website-Repository `ROWAPA-Konzepte/ROWAPA-Website-2027-Automation`. Befehle von hier aus im Repository-Ordner ausführen (z. B. `node figuren/treppe.js 3.4`); Playwright wird global vorausgesetzt.

# Punktfiguren erzeugen

Die Standbilder der Punktfiguren (Themenkarten, Vertriebsperformance) sind aus den Formdaten der ersten Fassung gerendert
(Repository `ROWAPA-Konzepte/rowapa-website`, `src/themen.js`, Funktion `makeShapes`), mit three.js r128 in Chromium.

```
# makeShapes aus rowapa-website/src/themen.js nach makeShapes.js kopieren (Funktion vollständig)
node render.js            # vier Themenfiguren: roh-potenzial/-fuehrung/-recruiting/-digital.png
node render.js vertrieb   # Treppe für Vertriebsperformance (helle Farben für dunklen Grund)
HELL=1 node render.js vertrieb   # dieselbe Treppe in den Farben der Themenfiguren (für hellen Grund): roh-vertrieb-hell.png
PLUM=1 node render.js            # Farbkonzept (Runde 33): Plum als Hauptfarbe, Sea Cliff und Mischblau untergeordnet: roh-…-plum.png
HELL=1 PLUM=1 node render.js vertrieb   # dasselbe für die Treppe: roh-vertrieb-hell-plum.png
```

**Grosse Fassungen für die Themenlinien (Runde 20):** `convert roh-NAME.png -trim +repage -bordercolor none -border 2%x2% -resize x1400 -colors 128 PNG8:grafik-thema-NAME-gross.png` (ImageMagick), in Webflow im Ordner der Grafiken.

Danach zuschneiden, auf 320 px (Themen) bzw. 760 px Höhe (Vertrieb) verkleinern und auf 128 bzw. 64 Farben reduzieren (PNG mit Transparenz).
Farben: Manganese, Great Serpent, Mischton Serpent/Sea Cliff, Plum (Themen); Weiss, Sea-Cliff-Töne, Plum hell (Vertrieb).

## Treppe «Unser Vorgehen»

Geometrie aus der ersten Fassung (`rowapa-website/src/vorgehen.js`), alle vier Stufen im Ruhezustand (Säulen gedämpft, Symbole in Serpent und Mischton). Die Plum-Hervorhebung erzeugt das Skript.

```
node figuren/treppe.js 3.4   # roh-treppe.png (Pixeldichte 3,4) und Spaltengrenzen als JSON
```

Danach auf den Inhalt zuschneiden (2,5 % Rand), auf 1200 px Breite verkleinern, auf 64 Farben reduzieren → `grafik-vorgehen-treppe.png`.
Die ausgegebenen Spaltengrenzen auf das zugeschnittene Bild umrechnen; sie stehen als Standard in `src/treppe.js` (`GRENZEN`, `LINIE`, `GRUND`).

## Kugel «Wissensplattform»

Das Standbild entsteht mit genau der Zeichnung des Skriptteils `orbit` (`src/kugel.js`), gleicher Zufallswert, Drehwinkel 0. So übernimmt die drehende Kugel ohne Sprung.

```
node figuren/kugel.mjs       # grafik-wissensplattform-kugel.png, 640 × 640 px
```

Danach auf 96 Farben reduzieren (PNG mit Transparenz, rund 55 KB).

## Symbole der Werkzeuge

`icons/icon-anker.svg`, `-kompass`, `-lotse`, `-segel`, `-logbuch`: Lucide-Symbole (ISC-Lizenz) wie in der ersten Fassung, Strich 1,5 px in Sea Cliff. In Webflow unter Assets › «02 Grafiken».

Playwright und esbuild: `kugel.mjs` lädt Playwright über `require` (globale Installation, ggf. `NODE_PATH` setzen).
