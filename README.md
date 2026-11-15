# bemessungstool
Bemessungswerkzeuge für die Tragwerksplanung nach Eurocode und ETA: Verbindungsmittel (Rothoblaas-Winkel u. a.), Brettsperrholz und weitere Nachweise. Läuft im Browser, ohne Installation. Ungeprüft, keine Gewähr.

Online (nach Einschalten von GitHub Pages): https://fabian-boettinger.github.io/bemessungstool/

## Aufbau

- `index.html` – Übersicht aller Nachweise als Kacheln, gruppiert nach Kategorie, mit Suche
- `rothoblaas/` – Rothoblaas Verbinder: NINO, TITAN N/S/F/V (auch mit XYLOFON PLATE), WHT PLATE C/T, ALUMINI/ALUMIDI/ALUMAXI, ALUMEGA
- `bsp/` – BSP-Schraubenverbindungen Würth / Rothoblaas: Wand–Decke, stumpfer Deckenstoß, Verbindungsmittel-Bibliothek

Jedes Werkzeug ist eine eigenständige HTML-Datei in einem eigenen Ordner.

## Direktlinks

- `rothoblaas/index.html#produkt=<id>` wählt das Produkt, z. B. `titann`, `titansx` (mit XYLOFON), `whtc`, `alumega`;
  `&a=hh` bzw. `&a=hb` wählt zusätzlich Holz–Holz oder Holz–Beton
- `bsp/index.html#wd`, `#ds`, `#lib` öffnen den jeweiligen Reiter

Links immer mit `index.html` schreiben: Beim Öffnen per Doppelklick (file://) lädt der Browser für einen Ordner keine index.html.

Neuer Nachweis: Werkzeug in eigenem Ordner ablegen und in `index.html` in der Liste `GRUPPEN` eintragen.
Die Kennwerte auf den Kacheln sind von Hand aus den Datentabellen der Werkzeuge übernommen; bei Datenänderungen mitziehen.

Lizenz: keine. © Fabian Böttinger, alle Rechte vorbehalten.
