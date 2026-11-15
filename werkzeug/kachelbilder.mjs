// kachelbilder.mjs – Vorschaubilder für die Kacheln der Übersicht (index.html) nach bilder/ schreiben.
//
// Aufruf:  node werkzeug/kachelbilder.mjs [Name ...]        (ohne Namen: alle)
//
// Die Bilder sind die Zeichnungen der Werkzeuge selbst, nicht nachgezeichnet:
//  - Detailkatalog: z.vorschau("farbe") aus dem Rechenkern des Katalogs, wie die Kacheln der Katalogseite.
//    Ordner des Katalog-Repos: Umgebungsvariable DETAILKATALOG, sonst ../detailkatalog bzw. ../../detailkatalog.
//  - Rothoblaas, BSP, Anker: Werkzeug mit Standardwerten in Chrome/Edge (headless) öffnen, die Zeichnung
//    aus der Seite lesen, Texte und nicht belegte Kraftpfeile entfernen, auf den Inhalt zuschneiden.
//    Browser: Umgebungsvariable CHROME, sonst Chrome bzw. Edge am üblichen Ort.
// Nach Änderungen an den Zeichnungen der Werkzeuge oder am Katalog erneut ausführen.
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUS = path.join(WURZEL, "bilder");
const RB = "rothoblaas/index.html#produkt=", VIZ = { in: "viz", nr: 0 };

// name: Datei bilder/<name>.svg · url: Werkzeug mit Direktlink · in: id des Behälters bzw. des <svg> · nr: wievielte Zeichnung darin
const WERKZEUG = [
  ...["nino", "titann", "titans", "titanf"].flatMap((p) => [
    { name: `${p}-hh`, url: `${RB}${p}&a=hh`, ...VIZ }, { name: `${p}-hb`, url: `${RB}${p}&a=hb`, ...VIZ }]),
  ...["titanv", "ninox", "titannx", "whtc", "whtt", "alumini", "alumidi", "alumaxi", "alumega"].map((p) => ({ name: p, url: RB + p, ...VIZ })),
  { name: "bsp-wd", url: "bsp/index.html#wd", in: "wd_svg" },
  { name: "bsp-ds", url: "bsp/index.html#ds", in: "ds_svg" },
  { name: "anker", url: "anker/index.html", in: "viz", nr: 0 },
];

const auswahl = process.argv.slice(2);
const gewaehlt = (name) => !auswahl.length || auswahl.includes(name);
await mkdir(AUS, { recursive: true });
let fehler = 0;

// ---------------------------------------------------------------- Detailkatalog
const katalog = [process.env.DETAILKATALOG, path.join(WURZEL, "..", "detailkatalog"), path.join(WURZEL, "..", "..", "detailkatalog")]
  .find((p) => p && existsSync(path.join(p, "details", "index.js")));
if (!katalog) { console.log("Detailkatalog nicht gefunden (DETAILKATALOG setzen) – DK-Bilder übersprungen"); fehler++; }
else {
  const lade = (datei) => import(pathToFileURL(path.join(katalog, datei)).href);
  const [{ DETAILS }, { loese }, { ladeProfile }] = await Promise.all([lade("details/index.js"), lade("js/parameter.js"), lade("js/profile.js")]);
  const profile = await ladeProfile(async (datei) => JSON.parse(await readFile(path.join(katalog, "profile", datei), "utf-8")));
  for (const det of DETAILS) {
    const id = det.meta.id;
    if (!gewaehlt(id)) continue;
    const { p } = loese(det.parameter, {}, profile);
    await writeFile(path.join(AUS, `${id}.svg`), det.zeichne(p, {}).vorschau("farbe", det.meta.vorschau || {}), "utf-8");
    console.log(`${id}.svg  (Detailkatalog)`);
  }
}

// ---------------------------------------------------------------- Werkzeuge
const liste = WERKZEUG.filter((w) => gewaehlt(w.name));
if (liste.length) {
  const chrome = [process.env.CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => p && existsSync(p));
  if (!chrome) { console.log("Chrome/Edge nicht gefunden (CHROME setzen)"); process.exit(1); }
  const tmp = await mkdtemp(path.join(tmpdir(), "kachelbilder-"));
  // Eigenes, leeres Profil je Aufruf: die Werkzeuge starten mit Standardwerten (kein gespeicherter Stand)
  const dom = (url, nr) => new Promise((ok, nein) => execFile(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${path.join(tmp, "p" + nr)}`,
    "--window-size=1400,1000", "--virtual-time-budget=5000", "--dump-dom", url], { maxBuffer: 64e6 }, (e, out) => (e ? nein(e) : ok(out))));

  // Zeichnung aus der gerenderten Seite: erstes bzw. nr-tes <svg> im Element mit der id
  function zeichnung(html, w) {
    const i = html.indexOf(`id="${w.in}"`);
    if (i < 0) return null;
    const ab = html.lastIndexOf("<", i);
    const svgs = [...html.slice(ab).matchAll(/<svg[\s\S]*?<\/svg>/g)];
    return svgs[w.nr || 0] ? svgs[w.nr || 0][0] : null;
  }
  // Wie die Kacheln im Detailkatalog: nur Bauteile, keine Beschriftung; graue (nicht belegte) Kraftpfeile entfallen
  const bereinige = (svg) => svg
    .replace(/<g><line[^>]*stroke="#9aa3ab"[\s\S]*?<\/g>/g, "")
    .replace(/<text[\s\S]*?<\/text>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/^<svg[^>]*>/, (kopf) => {
      const vb = (kopf.match(/viewBox="([^"]*)"/) || [])[1] || "0 0 400 300";
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">`;
    });

  const roh = await Promise.all(liste.map(async (w, nr) => {
    const html = await dom(pathToFileURL(path.join(WURZEL, w.url.split("#")[0])).href + "#" + (w.url.split("#")[1] || ""), nr);
    const svg = zeichnung(html.slice(html.indexOf("<body")), w);
    if (!svg || svg.length < 400) { console.log(`  ! ${w.name}: keine Zeichnung in #${w.in} (${w.url})`); fehler++; return null; }
    return { name: w.name, svg: bereinige(svg) };
  }));

  // Zuschnitt auf den Inhalt: der Browser misst die Elemente (ohne über clip-path abgeschnittene Gruppen)
  const blatt = `<!doctype html><meta charset="utf-8"><body>${roh.filter(Boolean).map((r) => `<div data-name="${r.name}">${r.svg}</div>`).join("\n")}
<script>
for (const svg of document.querySelectorAll("svg")) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const nimm = (el) => {
    if (["defs", "clipPath", "marker", "pattern"].includes(el.tagName) || el.hasAttribute("clip-path")) return;
    if (el.tagName === "g") { for (const k of el.children) nimm(k); return; }
    const b = el.getBBox(); if (!b.width && !b.height) return;
    const s = parseFloat(el.getAttribute("stroke-width") || 1) / 2 || 0;
    x0 = Math.min(x0, b.x - s); y0 = Math.min(y0, b.y - s); x1 = Math.max(x1, b.x + b.width + s); y1 = Math.max(y1, b.y + b.height + s);
  };
  for (const k of svg.children) nimm(k);
  const r = 6, f = (v) => Math.round(v);
  if (x1 > x0) { svg.setAttribute("viewBox", [f(x0 - r), f(y0 - r), f(x1 - x0 + 2 * r), f(y1 - y0 + 2 * r)].join(" ")); svg.setAttribute("width", f(x1 - x0 + 2 * r)); svg.setAttribute("height", f(y1 - y0 + 2 * r)); }
}
</script>`;
  const datei = path.join(tmp, "blatt.html");
  await writeFile(datei, blatt, "utf-8");
  const fertig = await dom(pathToFileURL(datei).href, "blatt");
  for (const m of fertig.matchAll(/<div data-name="([^"]+)">(<svg[\s\S]*?<\/svg>)<\/div>/g)) {
    await writeFile(path.join(AUS, `${m[1]}.svg`), m[2].replace(/>\s+</g, "><") + "\n", "utf-8");
    console.log(`${m[1]}.svg  (${(m[2].match(/viewBox="([^"]*)"/) || [])[1]})`);
  }
  await rm(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => {});
}

if (fehler) { console.log(`\n${fehler} Fehler`); process.exit(1); }
console.log("\nalles in Ordnung");
