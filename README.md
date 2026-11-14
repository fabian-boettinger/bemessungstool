# bemessungstool
Bemessungswerkzeuge für die Tragwerksplanung nach Eurocode und ETA: Verbindungsmittel (Rothoblaas-Winkel u. a.), Brettsperrholz und weitere Nachweise. Läuft im Browser, ohne Installation. Ungeprüft, keine Gewähr.

Online (nach Einschalten von GitHub Pages): https://fabian-boettinger.github.io/bemessungstool/

## Aufbau

- `index.html` – Übersicht aller Nachweise als Kacheln, gruppiert nach Kategorie, mit Suche
- `rothoblaas/` – Rothoblaas Verbinder: NINO, TITAN N/S/F/V (auch mit XYLOFON PLATE), WHT PLATE C/T, ALUMINI/ALUMIDI/ALUMAXI, ALUMEGA
- `bsp/` – BSP-Schraubenverbindungen Würth / Rothoblaas: Wand–Decke, stumpfer Deckenstoß, Verbindungsmittel-Bibliothek
- `anker/` – Verankerung in Beton nach DIN EN 1992-4 mit NA (Betonseite der Holz–Beton-Anschlüsse): Ankergruppen mit Rändern,
  Widerstände je Versagensart aus ETA bzw. Herstellersoftware (Version 1), Interaktion nach Tab. 7.3, Ankerbibliothek
- `tests/` – Tests der Rechenkerne mit Node (`node tests/anker.test.mjs`), Sollwerte mit Quelle und Toleranz

Jedes Werkzeug ist eine eigenständige HTML-Datei in einem eigenen Ordner.

Aufbau von `anker/index.html`: `<script id="kern">` Rechenkern (reine Funktionen, ohne DOM), `<script id="zustand">`
Zustand, Projektdatei und Direktlink (ebenfalls ohne DOM), `<script id="app">` Oberfläche. Die Tests laden die beiden
ersten Blöcke direkt aus der HTML-Datei. Unsichere Annahmen sind im Code mit `// PRÜFEN` markiert und erscheinen in
Oberfläche und Protokoll als „ungeprüft“.

## Direktlinks

- `rothoblaas/index.html#produkt=<id>` wählt das Produkt, z. B. `titann`, `titansx` (mit XYLOFON), `whtc`, `alumega`;
  `&a=hh` bzw. `&a=hb` wählt zusätzlich Holz–Holz oder Holz–Beton
- `bsp/index.html#wd`, `#ds`, `#lib` öffnen den jeweiligen Reiter
- `anker/index.html#lib` öffnet die Ankerbibliothek. Eingaben über den Link beginnen eine neue Position:
  - `pos=…`, `bez=…` Positionsnummer und Bezeichnung
  - `xy=x1,y1;x2,y2;…` Lochbild in mm (optional `n=` Ankeranzahl zur Kontrolle)
  - `lc=LK1~N1,V1x,V1y;N2,V2x,V2y|LK2~…` Kräfte je Anker in kN (Zug positiv) **oder**
    `lcg=LK1~N,Vx,Vy,Mx,My,T|…` Schnittgrößen am Gruppenschwerpunkt in kN bzw. kNm
  - `hb=` Zwischenschicht H<sub>B</sub> in mm (Querlast mit Hebelarm, e₁ = H<sub>B</sub> + t<sub>fix</sub>/2), `tfix=` Blechdicke in mm
  - `von=rb&prod=…&typ=…` Herkunft (Rothoblaas-Werkzeug), erscheint im Protokoll

  Betonwiderstände kommen nie über den Link; sie gehören zur Position und werden geleert. Ist eine Projektdatei geladen
  oder gibt es ungespeicherte Änderungen, fragt das Werkzeug vor dem Überschreiben.
  Beispiel: `anker/index.html#pos=108.101&xy=-75,0;75,0&lcg=LK1~10,0,6,0,0.2,0.15`

Links immer mit `index.html` schreiben: Beim Öffnen per Doppelklick (file://) lädt der Browser für einen Ordner keine index.html.

Neuer Nachweis: Werkzeug in eigenem Ordner ablegen und in `index.html` in der Liste `GRUPPEN` eintragen.
Die Kennwerte auf den Kacheln sind von Hand aus den Datentabellen der Werkzeuge übernommen; bei Datenänderungen mitziehen.

Lizenz: keine. © Fabian Böttinger, alle Rechte vorbehalten.
