# bemessungstool
Bemessungswerkzeuge für die Tragwerksplanung nach Eurocode und ETA: Verbindungsmittel (Rothoblaas-Winkel u. a.), Brettsperrholz und weitere Nachweise. Läuft im Browser, ohne Installation. Ungeprüft, keine Gewähr.

Online (nach Einschalten von GitHub Pages): https://fabian-boettinger.github.io/bemessungstool/

## Aufbau

- `index.html` – Übersicht aller Nachweise als Kacheln, gruppiert nach Kategorie, mit Suche
- `rothoblaas/` – Rothoblaas Verbinder: NINO, TITAN N/S/F/V (auch mit XYLOFON PLATE), WHT PLATE C/T, ALUMINI/ALUMIDI/ALUMAXI, ALUMEGA
- `bsp/` – BSP-Schraubenverbindungen Würth / Rothoblaas: Wand–Decke, stumpfer Deckenstoß, Verbindungsmittel-Bibliothek
- `anker/` – Verankerung in Beton nach DIN EN 1992-4 mit NA (Betonseite der Holz–Beton-Anschlüsse): Ankergruppen mit Rändern,
  Betonwiderstände nach 7.2.1.4–7.2.1.7 und 7.2.2.4–7.2.2.5 aus ETA-Kennwerten berechnet oder je Versagensart eingegeben
  (Version 2), Interaktion nach Tab. 7.3, Isometrie, Ankerbibliothek mit schreibgeschützten Einträgen aus den ETAs
  (Hilti HIT-HY 200, HST3, HUS4; Würth WIT-VM 250, WIT-PE 1000, W-FAZ, W-FAZ PRO, W-BS; Fundstelle je Eintrag)
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
  - `wy=` Lage der Wand bzw. des Winkelschenkels (y in mm) für die Isometrie
  - `ue=` Überstand des Anbauteils über den äußersten Anker in mm (Anker in einer Reihe: vereinfachte Neuverteilung bei gedrückten Ankern)
  - `hb=` Zwischenschicht unter dem Anbauteil in mm (Querlast mit Hebelarm), `zw=moertel|sonstige`, `tfix=` Blechdicke in mm;
    e₁ = H<sub>B</sub> + t<sub>fix</sub>/2, bei Mörtelbett e₁ = t<sub>fix</sub>/2 (Bild 6.6)
  - `von=rb&prod=…&typ=…&ausg=…` Herkunft (Rothoblaas-Werkzeug, Datenblatt-Ausgabe), erscheint im Protokoll

  Betonwiderstände kommen nie über den Link; sie gehören zur Position und werden geleert. Ist eine Projektdatei geladen
  oder gibt es ungespeicherte Änderungen, fragt das Werkzeug vor dem Überschreiben.
  Beispiel: `anker/index.html#pos=108.101&xy=-75,0;75,0&lcg=LK1~10,0,6,0,0.2,0.15`
- Im Rothoblaas-Werkzeug öffnet bei Holz–Beton (TITAN N/S/F, NINO) der Knopf „Betonseite nachweisen“ das Anker-Werkzeug mit
  Lochbild und den Schnittgrößen der Ankergruppe je Winkel nach den Datenblättern („Prüfung der Anker“: N<sub>Sd,z</sub> mit k<sub>t</sub>,
  V<sub>Sd,x</sub>, V<sub>Sd,y</sub>, M<sub>Sd,z</sub>, M<sub>Sd,y</sub>). Die Kopplungsfunktionen stehen zwischen `ANKER-KOPPLUNG-START` und `-ENDE`
  und werden in `tests/anker.test.mjs` geprüft.

Links immer mit `index.html` schreiben: Beim Öffnen per Doppelklick (file://) lädt der Browser für einen Ordner keine index.html.

Neuer Nachweis: Werkzeug in eigenem Ordner ablegen und in `index.html` in der Liste `GRUPPEN` eintragen.
Die Kennwerte auf den Kacheln sind von Hand aus den Datentabellen der Werkzeuge übernommen; bei Datenänderungen mitziehen.

Lizenz: keine. © Fabian Böttinger, alle Rechte vorbehalten.
