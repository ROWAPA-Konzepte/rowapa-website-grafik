# ROWAPA Website · Grafik-Skript

Ein einziges Skript für die Punkte-Grafiken und kleinen Bewegungen der ROWAPA-Website (Webflow). Die Website lädt es über jsDelivr mit fester Commit-Kennung und SRI-Prüfsumme. Darum muss dieses Repository **öffentlich** bleiben, solange die Website das Skript nutzt.

- Beschreibung aller Module, Einstellungen (Attribute in Webflow) und Änderungen: [`LIESMICH.md`](LIESMICH.md)
- Quelle: `src/`, Ergebnis: `dist/rowapa-grafik.min.js`, Prüfsumme: `dist/sri.txt`
- Projekt, Entscheide und Handbuch: Repository `ROWAPA-Konzepte/ROWAPA-Website-2027-Automation` (Ordner `exports/`)

## Neue Fassung

```
npm install
npm run build          # schreibt dist/rowapa-grafik.min.js und dist/sri.txt
```

1. Version in `package.json` erhöhen, Änderung in `LIESMICH.md` festhalten.
2. Bauen, committen, pushen.
3. In Webflow die neue Fassung registrieren: Adresse `https://cdn.jsdelivr.net/gh/ROWAPA-Konzepte/rowapa-website-grafik@<Commit>/dist/rowapa-grafik.min.js`, Prüfsumme aus `dist/sri.txt`. Danach auf der Testadresse prüfen und erst dann live veröffentlichen.

Keine Zugangsdaten in dieses Repository.
