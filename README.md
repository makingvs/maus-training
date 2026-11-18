# Maus-Training

Training für die Computermaus für Kinder und Jugendliche von **6 bis 14 Jahren**, im Erscheinungsbild von **MINT2Go – MINT erleben**.
Läuft im Browser, ohne Server und ohne Laufzeit-Bibliotheken.

**Spielen:** https://makingvs.github.io/maus-training/

## Starten und bauen

```powershell
npm install        # einmalig
npm run dev        # Entwicklung, http://localhost:5180
npm test           # Tests (Vitest)
npm run build      # erzeugt dist/
```

`dist/index.html` läuft auch per **Doppelklick** (ohne Webserver), z. B. von einem USB-Stick oder Netzlaufwerk. Den ganzen Ordner `dist/` weitergeben.
Das Impressum (Regionalmanagement KUUSK) steht unten links auf Startseite und Übersicht (`src/impressum.ts`).
Jeder Push auf `main` baut die App und veröffentlicht sie automatisch auf GitHub Pages (`.github/workflows/pages.yml`).

## Aufbau des Spiels

5 Welten mit je 3 Levels, 1–3 Sterne je Level:

| Welt | Fertigkeit | Levels |
|---|---|---|
| Zeigen & Bewegen | Zeiger führen | Sterne sammeln · breiter Weg · schmaler Weg |
| Klicken | linke Taste | Ballons · Zielscheiben (Zeitdruck) · nur rote Äpfel |
| Doppelklick | schneller Doppelklick | Eier · Schatzkisten · Eins oder zwei? |
| Ziehen & Ablegen | Taste halten und ziehen | Formen sortieren · Puzzle · Größen |
| Mausrad | Mausrad drücken / drehen | Drücken = 90° · Drehen = 15° · Drehen und ziehen |

- **Stufen je Kind** (bei der Anlage wählbar, von der Lehrkraft änderbar):
  Starter (ab 6: große Ziele, ruhiges Tempo) · Fortgeschritten (ab 9) · Profi (ab 12: kleine Ziele, hohes Tempo).
- Sterne: wenige Fehler = 3, mehr = 2, geschafft = immer mindestens 1. Level ohne mögliche Fehler (1, 13, 14) werten die Zeit.
  Niemand scheitert, Fehler kosten nur Sterne.
- Jede Welt ergibt eine druckbare **Urkunde** (A4 quer), nach allen 5 Welten die Maus-Profi-Urkunde.

## Lehrkraft-Bereich

Das **Logo 1,5 Sekunden gedrückt halten**, dann das Passwort eingeben.
Dort: Stufe je Kind ändern, Sterne zurücksetzen, Profil löschen, großer Mauszeiger, alle Levels freischalten.
Alle Daten liegen je Gerät/Browser im `localStorage` (Schlüssel `maus-training.v1`).

> Das Passwort steht im Quelltext (`src/auth.ts`), weil das Spiel komplett im Browser läuft. Es hält Kinder vom Lehrkraft-Bereich fern, ist aber kein Schutz gegen technisch versierte Personen. Die gespeicherten Daten enthalten nur Vornamen, Farben, Stufen und Sterne.

## Technik

- TypeScript + Vite (nur Entwicklung), Ausgabe als IIFE-Bündel (`scripts/post-build.mjs` macht daraus ein `defer`-Script).
- Feste Bühne 1280×720, wird auf das Fenster skaliert. Alle Spielbilder sind selbst gezeichnete SVG (`src/art.ts`).
- Doppelklick = `dblclick` des Browsers, es gilt also die Doppelklick-Geschwindigkeit der Windows-Mauseinstellung.
- Mausrad drücken = Maustaste 1 (Autoscroll des Browsers wird unterdrückt), Rad drehen = `wheel`.
- Reine Logik (Geometrie, Fortschritt, Speicher, Drop-Entscheidung, Passwort) ist getestet (`tests/`), Spiele in `src/games/`.

## Marke, Schrift, Lizenzen

- Logo und Farben: MINT2Go (Grün #98C227, Orange #F0A030, Pink #E01070, Hellblau #38B8E8, Dunkelblau #3757A9, Schiefer #4D597C). Das Logo (`public/mint2go-logo.png`) gehört MINT2Go und steht nicht unter einer freien Lizenz.
- Schrift **Jost**, © 2020 The Jost Project Authors, SIL Open Font License 1.1 (`public/licenses/font-jost-OFL.txt`), als Datei eingebettet.
- Der Programmcode hat noch keine Lizenzdatei.

## Bekannte Grenzen

- Nur mit **Maus** sinnvoll: Die Mausrad-Welt braucht ein Rad mit Klick (Touchpad und Tablet gehen nicht).
- Keine Töne, kein Vorlesen.
- Nicht auf echter Schulhardware, mit Kindern und mit einem Drucker erprobt.
