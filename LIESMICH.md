# ROWAPA Grafik

Ein einziges Skript für alle Punkte-Grafiken und kleinen Bewegungen der ROWAPA-Website. Es bündelt eine einzige Bibliothek, Lenis 1.3.26 (MIT-Lizenz, weiches Scrollen, nur auf Seiten mit den Themenlinien aktiv), insgesamt rund 67 KB, komprimiert rund 25 KB.
Ohne das Skript, bei «Bewegung reduzieren» oder wenn der Browser kein WebGL kann, bleiben überall die Standbilder stehen. Die Pfeile der Insights-Reihe und der Knopf «Nach oben» funktionieren auch bei «Bewegung reduzieren».

## Was es heute kann

| Attribut `data-grafik` | Wo | Was passiert |
|---|---|---|
| `punktemeer` | Header (`hero_grafik`) | welliges Punktfeld (WebGL), Kräuseln unter der Maus, ruhig. Ab 1.14.0 mit **Netz** (seit 1.15.0 Standard im Header aller Seiten, seit 1.16.0 kräftiger: Licht addiert sich auf dem dunklen Grund, bis drei Impulse gleichzeitig, Ring beim Ankommen; Entscheid ROWAPA): wenige Plum-Knoten schwingen auf der Welle mit, feine Linien verbinden Nachbarn und blenden langsam ein und aus, alle paar Sekunden läuft ein Impuls von Knoten zu Knoten (Attribut `data-netz`, siehe unten). Mit Netz bleiben die Wellenkämme weiss, Plum gehört dann nur den Knoten |
| `punktemeer-footer` | Footer (`footer_grafik`) | dasselbe Feld, flacher, hinter der Wortmarke |
| `punktfigur…` (z. B. `punktfigur`, `punktfigur-vertrieb`) | Themenkarten, Karte Vertriebsperformance | die Figur baut sich einmal aus dem Standbild auf und ruht dann; beim Darüberfahren zieht sie sich leicht zusammen |
| `methoden` | Performance-Analyse, «Fünf Methoden» (`methode_layout`, ab 1.19.0) | ab 992 px steht die Grafik beim Scrollen; Methode für Methode leuchtet auf, Linie mit Punkt zum Ergebnis, Ergebnis-Punkte füllen sich (`data-punkte` an `methode_zeile`, z. B. `2,3`), am Ende «Fünf Quellen, ein Bild». `data-schritt` (Scrollweg je Methode, Standard 190), `data-text-schritt`, `data-text-fertig`. Tablet, Handy, «Bewegung reduzieren»: steht wie im Designer |
| `aufbau` | Grafiken in Reitern (`auswertung_grafik`, ab 1.19.0) | das Bild wird beim ersten Erscheinen und bei jedem Öffnen des Reiters schrittweise freigegeben; `data-richtung` = `links` (Standard), `mitte`, `oben`; `data-dauer` (Standard 0.9 s) |
| `diagramm` | Musterauswertungen der Performance-Analyse als Diagramme aus Webflow-Elementen (`auswertung_grafik`, ab 1.21.0) | baut sich beim ersten Erscheinen und bei jedem Öffnen des Reiters auf: Balken wachsen (`data-art="breite"`), Marken gleiten an ihre Stelle (`"lage"`), Abstände zeichnen sich Plum (`"spanne"` mit `data-von`/`data-bis`), Zellen färben sich von Plum (tief) bis Sea Cliff (hoch) (`"farbe"`), Zahlen zählen hoch (`"zahl"`, `data-stellen`, `data-vorzeichen="ja"`), Schritte blenden nacheinander ein (`"folge"`), Kreise füllen sich Plum (`"fuellen"`). Werte mit `data-wert`; Reihenfolge `data-takt`. Am Behälter `data-min`/`data-max` (Skala), `data-dauer`, `data-farbe-von`/`-bis`, `data-spalten`. Läuft auch bei «Bewegung reduzieren» (setzt dann alle Werte sofort). Ab 1.24.0 mit `data-hinweis="ja"` am Behälter ein Hinweis auf die auffälligste Stelle (grösster Unterschied Eigen-/Fremdsicht, grösster Abstand zum Soll oder zur Referenz, tiefster Wert der Wärmetabelle; eigener Text mit `data-hinweis-text`); beim Darüberfahren treten die übrigen Zeilen zurück |
| `auswertung` | Performance-Analyse, Beispielauswertungen (Webflow Tabs, Klasse `auswertung_tabs`, ab 1.32.0, Entscheid 406) | jeder Reiter baut sich beim ersten Erscheinen und bei jedem Öffnen in vier Schritten auf: 1 Diagramm, 2 Abweichung (auffälligste Stelle Plum Tint mit Plum-Linie, übrige Zeilen treten leicht zurück), 3 Einordnung (Text unten links erscheint), 4 Empfehlungen (unten rechts). Die Schrittleiste darüber setzt das Skript (nur Anzeige). `data-schritte` (Beschriftung, mit «|» getrennt), `data-takt` (Schritt 2–4 in ms, Standard `1400,2000,2600`). Designer, ohne Skript, «Bewegung reduzieren»: alles steht sofort da |
| `kopfleiste` | Navigation beim Scrollen (Element in der Navigation, `navbar_container`, ab 1.22.0, Entscheid 390) | blendet die Navigation beim Runterscrollen aus (0,6 s) und beim Hochscrollen wieder ein, nach `data-kopfleiste-zurueck` px (Standard 200) oder am Seitenanfang; erst ab `data-kopfleiste-ab` px (Standard 200). Bleibt sichtbar, solange ein Menü offen ist. Elemente mit `data-kopfleiste-folgt` rücken mit. Bewegt ab 1.23.0 die Eigenschaft `translate` und verträgt sich so mit der Themen-Bühne der Startseite. Bei «Bewegung reduzieren» ohne Gleiten |
| `methoden-klapp` | Aufklappbare «Fünf Perspektiven» (`methode_layout`, ab 1.23.0, Entwurf Runde 76) | eine Methode ist offen (zu Beginn die erste), Klick auf eine andere wechselt, Klick auf die offene schliesst; die Punkte der offenen Methode leuchten im Ergebnis (`data-punkte`), ihre Linie ist Plum. Titel wird zur Schaltfläche (Tastatur, `aria-expanded`). Im Designer bleibt alles offen. Bei «Bewegung reduzieren» bleibt alles offen wie im Designer. Ab 1.24.0 mit `data-oeffnen="hover"` am Behälter auch beim Darüberfahren mit der Maus (180 ms Verzögerung; die neu geöffnete Methode bleibt unter der Maus stehen). Ab 1.25.0 mit `data-ergebnis="marke"`: im Ergebnis-Kasten bleiben alle Punkte voll sichtbar, nur die Marke der Punkte der offenen Methode wird Plum. Ab 1.26.0 mit `data-linien="laufen"`: die Linien zum Kasten laufen dauernd als Punktlinie, die Linie der offenen Methode ist Plum |
| `zaehler` | Kennzahlen (`stat_number`) | zählt einmal von 0 bis zum Wert, sobald die Zahl ins Bild kommt; Vorsatz und Zusatz («%», «CHF») bleiben |
| `treppe` | Unser Vorgehen (`vorgehen_media`) | die vier Stufen bauen sich nacheinander auf, die Phase in der Liste (`.step_item`) leuchtet mit; danach Phase 01. Darüberfahren/Klick auf eine Phase oder Klick auf eine Stufe hebt sie hervor (Klasse `is-aktiv` auf `step_item` und `step_number`) |
| `orbit` | ROWAPA Digital (`digital_visual`) | Kugel (`.orbit_kugel`) dreht sich (24 s), Kacheln (`.orbit_tile`) ziehen auf der Bahn (`.orbit_bahn`, 45 s) und halten nur, solange die Maus über den Karten ist; Karte im `.tools_grid` ↔ Kachel gleicher Position: Kachel `is-aktiv`, feine Linie zur Kugel. Klick auf eine Kachel: die passende Karte hebt sich kurz an (Klasse `is-angetippt`, 1,4 s) und wird ins Bild geholt, falls nötig; den Link zur Unterseite trägt die Karte. Handy: Kacheln stehen |
| `reihe` | Insights (`insights_reihe`) | Pfeile `[data-reihe="zurueck"]` / `[data-reihe="weiter"]` blättern um eine Karte, `[data-reihe="balken"]` zeigt den Stand (falls vorhanden); der Scrollbalken des Browsers ist ausgeblendet, wischen und Trackpad gehen weiter |
| `nachoben` | Footer (Komponente, Link mit Klasse `nach-oben`) | Knopf erscheint, sobald man gut eine Bildschirmhöhe gescrollt hat (Klasse `is-sichtbar`), Klick führt an den Seitenanfang. Da er im Footer liegt, ist er auf jeder Seite |
| `zeiger` | ein beliebiges (verstecktes) Element der Seite | Mauszeiger als Punkt (Plum) mit feinem Ring (ab 1.10.1 auch auf Geräten mit Touchscreen; meldet der Browser keine Maus, schaltet er sich ab 1.11.1 bei der ersten Mausbewegung ein, ebenso Hover-Videos und Hover-Effekte; bei Berührung mit dem Finger ausgeblendet), der Ring steht immer im Kontrast zum Grund (dunkel auf hell, hell auf dunkel und auf Fotos); `data-zeiger="a"` (Standard) schlicht, `"b"` Ring wächst zusätzlich auf Links und Karten (Text aus `data-zeiger-text`, sonst «Öffnen»). Ab 1.20.0 läuft der Ring 1:1 mit der Maus (kein Nachziehen); Nachlauf wieder einschalten mit `data-zeiger-nachlauf="0.8"` (0 = direkt bis 0.95 = stark verzögert). Heute an der Navigation gesetzt. Nur mit Maus; in Formularfeldern normaler Cursor |
| `vorschau` | Megamenü | Links `[data-vorschau="x"]` zeigen beim Darüberfahren die Karte `[data-vorschau-karte="x"]` (Klasse `is-aktiv`) |
| `themen` | Themenlinien «Lösungen für Unternehmen» (`section_themen`, ab 1.7.0 Szene nach dem Vorbild Tresmares, 1.8.0 Form zerfällt in Ruhe, 1.9.0 Einrasten in Scrollrichtung) | ab 992 px: Vollbild-Bühne steht beim Scrollen, je Thema eine Fensterhöhe Scrollweg. Alles hängt am Scroll-Fortschritt: Vorhang von unten (oder diagonal 45°), das alte Thema dunkelt ab (Manganese), Figur −20 % und Text −30 % der Fensterhöhe nach oben, das neue kommt von unten nach; der alte Titel blendet im ersten Viertel aus, der neue im letzten Viertel ein; die Plum-Form (45°-Bänder, `data-form`) zeigt sich ab 1.8.0 nur im Wechsel: Sie setzt sich aus kleinen Quadraten zusammen, schrumpft zu vier kleinen Quadraten, wächst zur nächsten Form und zerfällt wieder, während der neue Titel erscheint; in Ruhe ist nur die Schrift zu sehen. Die Figur ist im Wechsel kräftig und tritt zurück (Deckkraft 40 %, Attribut `data-figur-ruhe` an der Section), sobald das Thema ganz offen ist (ab 1.9.0). Weiches Scrollen mit Lenis; Einrasten ab 1.9.0 in Scrollrichtung 150 ms nach dem letzten Mausrad-Schritt (wer ein Stück weiterscrollt, kommt zum nächsten Thema, zurück zum vorherigen; nur Bewegungen unter 4 % laufen zurück), die Fahrt (1,3 s) beginnt mit dem Tempo des Scrollens und ist gegen weitere Rad-Schritte gesperrt; Klick in der Liste 1 s. Anordnung zum Vergleichen (ab 1.10.0): `?anordnung=diagonal` in der Adresse oder `data-anordnung="diagonal"` an der Section setzt die Zusatzklasse `is-diagonal` (Kernbotschaft unten links, Satz und Link oben rechts; Stile in Webflow). Navigation und «Nach oben» sind ausgeblendet, solange die Bühne steht. Tablet und Handy: Blöcke untereinander mit stehender Leiste, Titel ausserhalb des Blicks blass (35 %), der ausscheidende Block dunkelt leicht ab, die Form liegt auf der Figur, solange der Block hereinkommt, und zerfällt, bis die Figur in der Fenstermitte steht. «Bewegung reduzieren»: Blöcke untereinander, nur die Markierung, keine Form |

Die Kacheln im Orbit stehen in gleichen Abständen entlang der Bahn (gleiche Weglänge); die letzte Kachel startet oben. Die Treppe baut sich auf, sobald sie in der Bildmitte steht. Sie kennt `data-modus`: `folge` (Standard: Stufen bauen nacheinander auf, Phasen leuchten mit), `ruhig` (baut einmal auf, wechselt nur bei Darüberfahren oder Klick) und `tabs` (Reiter `[data-phase-tab]` schalten Tafeln `[data-phase]`).

`zeiger`, `vorschau`, `reihe`, `nachoben` und `diagramm` laufen auch bei «Bewegung reduzieren» (`diagramm` setzt dann die Werte ohne Bewegung). `themen` zeigt bei «Bewegung reduzieren» die Karten untereinander und markiert nur das Thema im Bild.

**Themenlinien einstellen** (Attribute auf der Section `section_themen`): `data-uebergang` = `unten` (Standard) oder `diagonal`; zum Vergleichen ohne Änderung in Webflow die Adresse mit `?uebergang=diagonal` bzw. `?uebergang=unten` öffnen. `data-schritt` = Scrollweg je Thema als Anteil der Bildschirmhöhe (Standard `1`). Je Panel `data-form` = `band`, `doppel`, `winkel`, `trichter` oder `raster` (Plum-Form aus 45°-Bändern bzw. Quadraten). Ein Thema mehr oder weniger: Panel `themen_panel` (mit eigener ID, z. B. `thema-neu`) duplizieren bzw. löschen und in der Liste einen `themen_link` mit Link «Section» auf dieses Panel; das Skript zählt selbst.

Einrasten der Themen-Szene: seit 1.12.0 ist das Wisch-Einrasten Standard (ein Wisch oder Rad-Stoss = sofort ein Thema, Nachlauf des Trackpads wird übergangen); das frühere Einrasten 150 ms nach dem letzten Rad-Schritt zum Vergleichen mit `?einrasten=rad` (oder `data-einrasten="rad"` an `section_themen`). `?diagnose` – kleine Anzeige unten links: Skript-Fassung, Startzeit, Maus/Touch laut Browser, «Bewegung reduzieren», Zeiger, Hover-Videos, Themen-Szene. Netz im Punktemeer (seit 1.14.0): `?netz=ruhig`, `?netz=mehr`, `?netz=aus`; die Diagnose zeigt die Stufe. Plum-Form im Themenwechsel (seit 1.13.0): Standard an; ohne Form mit `?plumform=aus` in der Adresse oder dauerhaft mit `data-plumform="aus"` an `section_themen` (Figuren, Vorhang, Titel und Einrasten bleiben gleich). Alles lässt sich kombinieren (`?einrasten=rad&plumform=aus&diagnose`).

Start: nach dem Laden der Seite, spätestens 5 s nach ihrem Aufbau (ab 1.11.0), falls eine Datei hängt.

Zusätzlich: Hover-Videos der Karten (`<video data-hover-video>`), früher eigenes Skript «ROWAPAHoverVideo».

## Einstellungen ohne Code

In Webflow: Element auswählen › Zahnrad (Settings) › **Custom attributes**.

| Attribut | Wirkung | Standard |
|---|---|---|
| `data-tempo` | Geschwindigkeit (0.5 = halb so schnell, 2 = doppelt) | `1` |
| `data-dichte` | Anzahl Punkte (0.5 = halb so viele) | `1` |
| `data-hoehe` | Wellenhöhe beim Punktemeer | `1` |
| `data-kraeuseln` | `aus` schaltet das Kräuseln unter der Maus ab | an |
| `data-verzoegerung` | Sekunden bis zum Aufbau einer Figur | automatisch gestaffelt |
| `data-farbe-1`, `data-farbe-2`, `data-farbe-3` | Farben des Punktemeers als Hex (z. B. `#486EA3`) | CI-Variablen |
| `data-hintergrund` | `aus` lässt beim Header-Punktemeer den Verlauf weg | an |
| `data-netz` | Netz im Header-Punktemeer: `an` = Standard = `stark` (24 Knoten, Handy 12, kräftiges Leuchten, bis drei Impulse), `mehr` (22 Knoten, ein Impuls), `ruhig` (14 Knoten, Handy 7, wie 1.14.0), `aus`. Das Netz zeichnet höchstens mit 1,5-facher Auflösung. Darf am Punktemeer oder an einem umgebenden Element stehen (z. B. `main-wrapper` der Seite, weil der Header eine Komponente ist). Zum Vergleichen ohne Änderung in Webflow: `?netz=an`, `?netz=mehr`, `?netz=aus` in der Adresse. Der Footer bekommt das Netz nur mit eigenem Attribut | Header an (seit 1.15.0), Footer aus |
| `data-spalten` | Treppe: drei Spaltengrenzen als Anteile der Bildbreite, z. B. `0.26,0.5,0.75` (nur bei einem anderen Bild nötig) | passend zum mitgelieferten Bild |

**Figuren tauschen:** Das Standbild ist die Vorlage. Neues PNG mit transparentem Hintergrund hochladen und im Bildfeld der Karte («Grafik») auswählen; die Animation entsteht daraus von selbst: Die Figur setzt sich aus kleinen Ausschnitten genau dieses Bildes zusammen. Das Bild wird dafür weder ein zweites Mal geladen noch ausgelesen. JPG-Bilder bleiben als Standbild stehen (keine Animation).

**Treppe und Kugel tauschen:** Die Vorlagen entstehen mit `figuren/treppe.js` und `figuren/kugel.mjs` (siehe `figuren/LIESMICH.md`). Die Treppe ist ein PNG mit den Stufen im Ruhezustand; die Plum-Hervorhebung färbt das Skript selbst ein. Das Kugel-Standbild ist mit genau der Zeichnung des Skripts erzeugt, damit der Übergang nahtlos ist.

**Farben:** Das Punktemeer nimmt die Webflow-Variablen der Sammlung «Farben» (Great Serpent, White, Plum Perfect). Die Figuren nehmen die Farben aus ihrem Standbild. Der Verlauf hinter der Treppe bei Vertriebsperformance ist eine Gestaltung der Klasse `card_featured_grafik` (Style-Panel), nicht Teil des Bildes.

## Einbindung

Site settings › Custom code ist leer. Das Skript ist über die Webflow-Schnittstelle als «ROWAPAGrafik» registriert und site-weit im Footer eingebunden, geladen von jsDelivr aus diesem Repository (`ROWAPA-Konzepte/rowapa-website-grafik`, ab 1.24.0; bis 1.23.0 aus `ROWAPA-Website-2027-Automation/tools/grafik`) mit fester Commit-Kennung und SRI-Prüfsumme (`dist/sri.txt`). Jede Fassung bleibt dadurch unverändert und lässt sich zurückholen. Das Repository muss öffentlich bleiben, solange die Website das Skript lädt.

## Neue Fassung

```
npm install
npm run build          # schreibt dist/rowapa-grafik.min.js und dist/sri.txt
```

Danach committen und pushen, in Webflow die neue Commit-Kennung und Prüfsumme als neue Skript-Version registrieren und anwenden.

Prüfwerkzeuge: `pruefung/messen.js` (Ladezeit, Datenmenge), `pruefung/rechenlast.js` (Bilder pro Sekunde der Kugel).

## Leitlinien

- Jede Grafik baut sich einmal auf und ruht dann. Dauerhaft bewegt sind nur das Punktemeer (Header, Footer) und die Kugel mit den Kacheln, alle langsam und nie gleichzeitig im Bild.
- Kein Scroll-Halt und kein Farbfluss. Ausnahme Themenlinien (Entscheid ROWAPA, Runde 20): Auf Seiten mit dieser Section scrollt die Seite ab 992 px weich (Lenis) und rastet in der Section auf die Themen ein, wie die Referenz. Bei «Bewegung reduzieren» und auf Tablet und Handy bleibt das Scrollen normal. Zweite Ausnahme (Entscheid 368, ab 1.19.0): «Fünf Methoden» der Performance-Analyse steht ab 992 px für fünf kurze Schritte (je 190 px), ohne Lenis.
- Die einzige Einblendung der Startseite ist die Farbfläche im Blickpunkt (CAS); sie ist eine native Webflow-Interaction, nicht Teil dieses Skripts. Ebenso nativ: Titel-Strich und Team-Kacheln nacheinander.
- Start erst nach dem Laden der Seite; jede Grafik rechnet nur, solange sie sichtbar ist. Ab 1.27.0 warten die Grafiken zusätzlich, solange die Seite im Hintergrund vorgeladen wird oder beim Seitenwechsel noch einfährt (`html[data-rg-wechsel]`, gesetzt vom Kopf-Skript «ROWAPASeitenwechsel» ab 1.1.0, ab 1.2.0 bei jedem Seitenwechsel); bis dahin stehen die Standbilder.
- Werkzeuge zum Neuerzeugen der Standbilder (Punktfiguren, Treppe, Kugel, Symbole): Ordner [`figuren/`](figuren/LIESMICH.md).

## 1.36.0 (10.11.2026)

- `punktfigur`: `data-aufbau="scroll"` koppelt den Aufbau an die Scrollposition (Wunsch ROWAPA, Runde 108: Hebel-Karten). Die Figur ist leer, wenn sie unten ins Bild kommt, und vollständig, wenn ihre Oberkante bei 35 % der Fensterhöhe steht; beim Zurückscrollen löst sie sich wieder auf. Ohne Attribut wie bisher.

## 1.35.0 (10.11.2026)

- `punktfigur`: `data-wiederholen="ja"` baut die Figur bei jedem neuen Hineinscrollen wieder aus Punkten auf (Wunsch ROWAPA, Runde 106: Hebel-Karten). Ist die Figur ganz aus dem Bild, wird sie zurückgesetzt; ist sie wieder zu 30 % sichtbar, baut sie sich neu auf. Ohne Attribut wie bisher einmal.

## 1.34.0 (10.11.2026)

- `punktemeer`: ruhiges Meer für die Unterseiten (Runde 105, Wunsch ROWAPA: Startseite bleibt, Folgeseiten ruhiger). `data-meer="ruhig"` am Element oder an einem Eltern-Element (z. B. Section oder Body) halbiert die Wellenhöhe, nimmt das Tempo auf 70 % und lässt das Netz weg. Zum Vergleichen übersteuert die Adresse `?meer=ruhig` oder `?meer=voll`. Ohne Angabe bleibt alles wie bisher. `ROWAPAGrafik.meer` zeigt den Modus.

## 1.33.1 (02.11.2026)

- `punktbild`, Form `produkt`: Kasten innen frei, damit die Beschriftung «Produkt» lesbar bleibt.

## 1.33.0 (02.11.2026)

- Neues Modul `punktbild` (Runde 99, Entwurf Vertriebsperformance): Einzelne Punkte erhalten einen Zusammenhang. Ein Punktfeld verwandelt sich in 0,75 s in eine Form und bleibt dann stehen (keine Dauerbewegung, schematische Illustration). `data-grafik="punktbild"`, `data-form` = `ordnen` (Informationen → Richtung), `verbinden` (Gesprächsmomente → Weg mit nächstem Schritt), `buendeln` (drei Kanäle → ein Kreis), `kreislauf` (Impulse → wiederkehrende Anwendung), `produkt` (Gespräch läuft auf das Produkt zu), `kunde` (vom Produkt-Ablauf zu vier Phasen rund um den Kunden). `data-start` `vorher`/`nachher`, `data-ausloesen` `klick` (Standard) oder `sichtbar`, `data-dauer`. Knopf mit `data-punktbild-ausloeser` im selben Reiter oder `data-punktbild-bereich` schaltet um (`aria-pressed`); jedes Öffnen des Reiters beginnt beim Start. Farben aus den CI-Variablen, auf dunklem Grund Sea Cliff und helles Plum. Bei «Bewegung reduzieren» ohne Bewegung. Beschriftungen bleiben Webflow-Elemente.

## 1.32.0 (02.11.2026)

- Neues Modul `auswertung` (Entscheid 406): Beispielauswertungen der Performance-Analyse bauen sich je Reiter Schritt für Schritt auf (Diagramm, Abweichung, Einordnung, Empfehlungen), mit Schrittleiste über dem Inhalt. Ersetzt die Umschaltleiste der Entwurfsseite; Raster, Fragenspalte in Manganese, «Einordnung» und «Empfehlungen» sind Webflow-Klassen und -Elemente.

## 1.31.0 (02.11.2026)

- `themen` mit `data-nachoben="mitlaufen"` an der Section: Der Knopf «Nach oben» bleibt auf der Bühne der Themenlinien unten rechts stehen (bisher ausgeblendet, solange die Bühne steht), damit man ohne Durchscrollen an den Seitenanfang und zur Navigation kommt (Entscheid 405).

## 1.30.0 (01.11.2026)

- **Kopf gemeinsam einblenden** (Entscheid 404, zuerst nur auf den Entwurfsseiten): Steht am `html`-Element `data-rg-kopf` mit der Einblendzeit in Sekunden (z. B. `0.8`), startet das Wellenmeer im ersten Bildschirm sofort, nicht erst nach dem Laden und auch während eines Seitenwechsels, und blendet in genau dieser Zeit ein. Mit seinem ersten Bild setzt das Skript `html.rg-kopf-an`; daran hängt das CSS, das den übrigen Inhalt des Headers gleich lang einblendet (Kopf-Skript «ROWAPAEntwurfKopf» der Entwurfsseiten). Ohne WebGL, ohne Wellenmeer oder bei «Bewegung reduzieren» kommen `rg-kopf-an` und `rg-kopf-standbild` sofort.
- `punktemeer(box, art, opt)`: neue Optionen `opt.dauer` (Einblendzeit, Standard 1,4 s) und `opt.bereit(live)`.

## 1.29.1 (01.11.2026)

- Eigener Zeiger: Klick-Zustand auch über Elementen mit `data-zeiger-klick` (ganzes Feld einer zugeklappten Methode).

## 1.29.0 (01.11.2026)

- `methoden-klapp` mit `data-start="zu"`: alle Methoden beginnen zugeklappt (Entscheid 403); ein Klick irgendwo in das Feld öffnet.

## 1.28.0 (01.11.2026)

- `punktfigur` mit `data-start="sofort"` (Lupe im Header der Unterseiten): Kommt die Seite über den Seitenwechsel (`html[data-rg-angekommen]`, Kopf-Skript ab 1.2.0), bleibt die Figur als Standbild stehen und baut sich nicht erneut auf. Beim direkten Aufruf der Seite baut sie sich wie bisher auf. Entscheid 398: Seitenwechsel in alle Richtungen gleich.

## 1.27.0 (01.11.2026)

- Start wartet auf das Ende des Seitenwechsels (`data-rg-wechsel` und Ereignis `rg-wechsel-fertig`, längstens 2,5 s) und bei vorgeladenen Seiten auf das Anzeigen (`document.prerendering`). Ohne das Attribut startet alles wie bisher. Entscheid 397: Seitenwechsel ohne Ruckeln.
- Ordner `figuren/` aus dem Website-Repository übernommen (vorher `tools/grafik/figuren`).

## 1.26.0 (01.11.2026)

- `methoden-klapp`: `data-linien="laufen"` (laufende Punktlinien zum Ergebnis-Kasten, Entscheid 396). Pfade werden nur noch einmal angelegt und danach verschoben.

## 1.25.0 (01.11.2026)

- `methoden-klapp`: `data-ergebnis="marke"` lässt alle Punkte im Ergebnis-Kasten sichtbar und färbt nur die Marke der offenen Methode Plum (Entscheid 395).

## 1.24.0 (01.11.2026)

- Umzug in das eigene Repository `ROWAPA-Konzepte/rowapa-website-grafik` (Entscheid 391). Lädt dadurch klein und zuverlässig über jsDelivr.
- `diagramm`: Hinweis auf die auffälligste Stelle mit `data-hinweis="ja"` (Entscheid 394).
- `methoden-klapp`: Öffnen beim Darüberfahren mit `data-oeffnen="hover"` (Entwurf, Entscheid 394).

## 1.23.0 (01.11.2026)

- `kopfleiste` bewegt die Navigation über die Eigenschaft `translate` (Web Animations) statt `transform`; so kommt es auf der Startseite nicht mit der Themen-Bühne in Konflikt. Der Fokus hält die Navigation nur noch bei Tastaturbedienung sichtbar.
- `methoden` mit `data-grafik="methoden-klapp"`: aufklappbare Methoden statt Stehenbleiben beim Scrollen (Entwurf Runde 76).

## 1.22.0 (01.11.2026)

- Neues Modul `kopfleiste` (Entwurf Runde 75): Navigation blendet beim Runterscrollen aus und beim Hochscrollen ein. Vorerst nur in der Entwurfs-Navigation «Navbar · Bühne (Entwurf Bewegung)» eingeschaltet; ohne das Attribut ändert sich nichts.

## 1.21.0 (01.11.2026)

- Neues Modul `diagramm` (Entscheid 384): Die Reiter-Grafiken der Performance-Analyse sind keine Bilder mehr, sondern Webflow-Elemente mit Werten in Attributen; sie bauen sich farbig auf (Balken, Marken, Abstände in Plum, Wärmetabelle, Zähler, Musterbericht Schritt für Schritt).

## 1.20.0 (31.10.2026)

- Mauszeiger: Der Ring läuft 1:1 mit der Maus und zieht nicht mehr nach (Entscheid 383, gilt auf allen Seiten). Einstellbar mit `data-zeiger-nachlauf` am Element mit `data-grafik="zeiger"`.

## 1.19.0 (31.10.2026)

- Neue Module `methoden` und `aufbau` (Seite Performance-Analyse, Runde 64).
- `punktfigur` mit `data-start="sofort"`: baut sich auch im ersten Bildschirm auf (Lupe im Header der Unterseiten). Gegen ein kurzes Aufblitzen blendet das Inline-Skript «ROWAPAGrafikVorbereitung» im Seitenkopf das Bild vorher aus (und nach spätestens 4 s wieder ein).
- Einblendungen beim Scrollen sind nicht Teil des Skripts, sondern native Interactions über das Attribut `data-einblenden` (0–3).

## 1.18.0 (28.10.2026)

- Treppe «Unser Vorgehen»: Wischt man auf dem Handy durch die Phasen-Karten, wird die vorne stehende Karte aktiv (Plum-Nummer und Stufe laufen mit). Am Desktop unverändert.

## 1.17.0 (28.10.2026)

- Themen auf dem Handy: Jeder Block steht (CSS `position: sticky` in Webflow) und wird vom nächsten von unten zugedeckt; das Skript setzt je Block die stehende Lage so, dass auch ein Block, der höher ist als der freie Platz, zuerst ganz sichtbar wird. Kein Einrasten.
- Sprung über die Leiste rechnet mit stehenden Blöcken.
- Variantenumschalter (`varianten`) entfernt, die Vergleichsseiten gibt es nicht mehr.
- Reihe (`data-grafik="reihe"`) jetzt auch für «Unser Vorgehen» auf dem Handy (Linie zeigt, wo man steht).
