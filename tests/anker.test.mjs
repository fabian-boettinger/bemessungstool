// Tests Rechenkern anker/index.html – Aufruf: node tests/anker.test.mjs
// Lädt <script id="kern"> aus der HTML-Datei und führt ihn ohne DOM aus (node:vm).
// Jeder Testfall: Quelle der Sollwerte und Toleranz. Handrechnungen stehen ausgeschrieben im Kommentar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../anker/index.html", import.meta.url), "utf8");
const m = html.match(/<script id="kern">([\s\S]*?)<\/script>/);
assert.ok(m, "Block <script id=\"kern\"> nicht gefunden");
const ctx = {}; vm.createContext(ctx); vm.runInContext(m[1], ctx);
const A = ctx.ANKER;

const TOL = 5e-4;   // relativ, sofern nicht anders angegeben
function nah(ist, soll, was, tol = TOL) {
  const ok = Math.abs(ist - soll) <= tol * Math.max(Math.abs(soll), 1e-3);
  assert.ok(ok, `${was}: ist ${ist}, soll ${soll} (Toleranz ${tol} relativ)`);
}
const kopie = o => JSON.parse(JSON.stringify(o));

// Grundeingabe: mechanischer Dübel, d = 12, hef = 80, h = 200, C25/30 gerissen
const basis = () => ({
  modus: "starr", druck: "ablehnen", interaktion: "7.55",
  geo: { h: 200, hef: 80, d: 12, dnom: 12, beton: "C25/30", zustand: "gerissen", typ: "mechanisch", raender: [], lochspiel: "ohne" },
  mindest: { smin: 60, cmin: 60, hmin: 160 },
});

// ---------------------------------------------------------------------------------------------- Fall 1
// Quelle: Handrechnung. Einzelanker, zentrischer Zug N = 12 kN, keine Querlast.
//   N_Rd,s  = 30/1,5  = 20,000 kN  → β = 12/20     = 0,6000
//   N_Rd,p  = 25/1,5  = 16,667 kN  → β = 12/16,667 = 0,7200   (mechanisch: N^h, Tab. 7.1 Z. 3)
//   N_Rd,c  = 27/1,5  = 18,000 kN  → β = 12/18     = 0,6667
//   N_Rd,sp = 15,0 kN (Bemessungswert direkt) → β = 0,8000  maßgebend
//   Interaktion Stahl (7.54): 0,6² = 0,3600; Beton (7.55): 0,8^1,5 = 0,71554
test("Fall 1: Einzelanker unter zentrischem Zug", () => {
  const e = { ...basis(), anker: [{ x: 0, y: 0 }], lastfaelle: [{ name: "LK1", N: 12 }],
    widerstand: { Ns: { art: "k", Rk: 30, gM: 1.5 }, Np: { art: "k", Rk: 25, gM: 1.5 }, Nc: { art: "k", Rk: 27, gM: 1.5 }, Nsp: { art: "d", Rd: 15 } } };
  const r = A.nachweis(e);
  assert.deepEqual([...r.fehler], []);
  const L = r.lf[0];
  nah(L.beta.Ns, 0.6, "β N,s"); nah(L.beta.Np, 0.72, "β N,p"); nah(L.beta.Nc, 12 / 18, "β N,c"); nah(L.beta.Nsp, 0.8, "β N,sp");
  nah(L.int.s, 0.36, "Interaktion Stahl"); nah(L.int.c, 0.715542, "Interaktion Beton");
  nah(r.etaMax, 0.8, "η max"); assert.equal(L.massgebend, "Nsp"); assert.equal(r.ok, true);
});

// ---------------------------------------------------------------------------------------------- Fall 2
// Quelle: Handrechnung. Zweiergruppe x = ±50 mm (s = 100), Rand +y mit c₁ = 80 mm, Lochspiel nach Tab. 6.1
// (d_f = 14 mm ≤ 14 mm). Lasten am Gruppenschwerpunkt: N = 10 kN, M_y = 0,2 kNm, V_y = 6 kN (zum Rand), T = 0,15 kNm.
//   Σx² = 2·50² = 5000 mm²
//   N_i = N/2 + M_y·x_i/Σx² = 5 ± 200·50/5000 = 5 ± 2  → N₁ = 3, N₂ = 7 kN; N^h = 7, N^g = 10
//   e_N = (7·50 − 3·50)/10 = 20 mm
//   V_i,y = V_y/2 + T·x_i/Σr² = 3 ± 150·50/5000 = 3 ± 1,5 → V₁ = 1,5, V₂ = 4,5 kN; V^h = 4,5, V^g = 6; e_V = 150/6 = 25 mm
//   Torsion → alle Anker wirksam beim Kantenbruch (6.2.2.2 (1) a) 3)) → V_E = 6 kN
//   N_Rd,s = 30/1,5 = 20 → 7/20 = 0,3500;  N_Rd,p = 25/1,5 = 16,667 → 7/16,667 = 0,4200
//   N_Rd,c = 21/1,5 = 14 → 10/14 = 0,71429;  N_Rd,sp = 18 → 10/18 = 0,55556
//   V_Rd,s = 18/1,25 = 14,4 → 4,5/14,4 = 0,3125;  V_Rd,cp = 30/1,5 = 20 → 6/20 = 0,3000;  V_Rd,c = 18/1,5 = 12 → 6/12 = 0,5000
//   Stahl (7.54) Anker 2: 0,35² + 0,3125² = 0,22016 (Anker 1: 0,15² + 0,10417² = 0,03335)
//   Beton (7.55): β_N = 0,71429, β_V = 0,5 → 0,71429^1,5 + 0,5^1,5 = 0,60368 + 0,35355 = 0,95724  maßgebend
const fall2 = () => ({ ...basis(),
  anker: [{ x: -50, y: 0 }, { x: 50, y: 0 }],
  geo: { ...basis().geo, raender: [{ richtung: "+y", c: 80 }], lochspiel: "tab61", df: 14 },
  lastfaelle: [{ name: "LK1", N: 10, My: 0.2, Vy: 6, T: 0.15 }],
  widerstand: { Ns: { art: "k", Rk: 30, gM: 1.5 }, Np: { art: "k", Rk: 25, gM: 1.5 }, Nc: { art: "k", Rk: 21, gM: 1.5 }, Nsp: { art: "d", Rd: 18 },
    Vs: { art: "k", Rk: 18, gM: 1.25 }, Vcp: { art: "k", Rk: 30, gM: 1.5 }, Vc: [{ art: "k", Rk: 18, gM: 1.5 }] } });

test("Fall 2: Zweiergruppe am Rand mit Zug, Querkraft und Torsion", () => {
  const r = A.nachweis(fall2());
  assert.deepEqual([...r.fehler], []);
  const L = r.lf[0], G = L.G;
  nah(L.N[0], 3, "N₁"); nah(L.N[1], 7, "N₂"); nah(G.Nh, 7, "N^h"); nah(G.Ng, 10, "N^g"); nah(G.eN.x, 20, "e_N,x");
  nah(L.V[0][1], 1.5, "V₁,y"); nah(L.V[1][1], 4.5, "V₂,y"); nah(Math.abs(L.V[0][0]) + Math.abs(L.V[1][0]) + 1, 1, "V_x = 0");
  nah(G.Vh, 4.5, "V^h"); nah(G.Vg, 6, "V^g"); nah(G.eV, 25, "e_V");
  assert.equal(L.kante[0].alleWirksam, true); nah(L.kante[0].VE, 6, "V_E Kante");
  nah(L.beta.Ns, 0.35, "β N,s"); nah(L.beta.Np, 0.42, "β N,p"); nah(L.beta.Nc, 10 / 14, "β N,c"); nah(L.beta.Nsp, 10 / 18, "β N,sp");
  nah(L.beta.Vs, 0.3125, "β V,s"); nah(L.beta.Vcp, 0.3, "β V,cp"); nah(L.beta.Vc, 0.5, "β V,c");
  nah(L.int.s, 0.220156, "Interaktion Stahl"); assert.equal(L.int.sAnker, 2);
  nah(L.int.c, 0.957235, "Interaktion Beton"); assert.equal(L.massgebend, "intC"); assert.equal(r.ok, true);
  assert.ok(r.ungeprueft.some(u => u.key === "bild12"), "randnahe Gruppe mit Lochspiel als ungeprüft gekennzeichnet");
});

// Fall 2b – Quelle: Handrechnung. Wie Fall 2, ohne Rand, Stahl mit Hebelarm:
//   d_nom = 12 → a₃ = 6 mm, e₁ = 20 mm → l_a = 26 mm (Gl. 6.2); M⁰_Rk,s = 250 Nm, α_M = 1, γ_Ms = 1,25
//   Anker 2: M_Rk,s = 250·(1 − 7/20) = 162,5 (Gl. 7.38); V_Rk,s,M = 162,5/26 = 6,250 kN (Gl. 7.37); V_Rd = 5,000 → 4,5/5 = 0,9000
//   Anker 1: M_Rk,s = 250·(1 − 3/20) = 212,5; V_Rk,s,M = 8,1731; V_Rd = 6,5385 → 1,5/6,5385 = 0,22941
//   Stahl-Interaktion entfällt (Tab. 7.3, Fußnote a). Beton: 0,71429^1,5 + 0,3^1,5 = 0,60368 + 0,16432 = 0,76800
//   η max = 0,9000 (Stahl mit Hebelarm)
test("Fall 2b: Zweiergruppe, Stahl mit Hebelarm", () => {
  const e = fall2(); e.geo.raender = []; e.widerstand.Vc = []; delete e.widerstand.Vs;
  e.hebel = { mit: true, M0Rks: 250, alphaM: 1, gMs: 1.25, e1: 20 };
  const r = A.nachweis(e);
  assert.deepEqual([...r.fehler], []);
  const L = r.lf[0];
  nah(L.anker[1].VRksM, 6.25, "V_Rk,s,M Anker 2"); nah(L.anker[0].VRdsM, 6.538462, "V_Rd,s,M Anker 1");
  nah(L.beta.Vs, 0.9, "β V,s,M"); assert.equal(L.int.s, null);
  nah(L.int.c, 0.767999, "Interaktion Beton"); nah(r.etaMax, 0.9, "η max"); assert.equal(L.massgebend, "VsM");
});

// ---------------------------------------------------------------------------------------------- Fall 3
// Quelle: Handrechnung. Einzelanker, N = 10 kN, V_x = 5 kN zum Rand +x (c = 100 mm), ohne Lochspiel.
//   N_Rd,s = 50 → 0,2;  N_Rd,p = 60/1,5 = 40 → 0,25;  N_Rd,c = 18/1,5 = 12 → 0,83333;  Spalten entfällt (Begründung)
//   V_Rd,s = 40 → 0,125;  V_Rd,cp = 30 → 0,16667;  V_Rd,c = 12,5 → 0,4
//   Einzelnachweise alle ≤ 1; Beton (7.55): 0,83333^1,5 + 0,4^1,5 = 0,76073 + 0,25298 = 1,01371 > 1 → nicht erfüllt
//   Alternative (7.56): (0,83333 + 0,4)/1,2 = 1,02778 > 1
const fall3 = () => ({ ...basis(), anker: [{ x: 0, y: 0 }],
  geo: { ...basis().geo, raender: [{ richtung: "+x", c: 100 }] },
  lastfaelle: [{ name: "LK1", N: 10, Vx: 5 }],
  widerstand: { Ns: { art: "d", Rd: 50 }, Np: { art: "k", Rk: 60, gM: 1.5 }, Nc: { art: "k", Rk: 18, gM: 1.5 },
    Nsp: { art: "entfaellt", grund: "Testfall" }, Vs: { art: "d", Rd: 40 }, Vcp: { art: "d", Rd: 30 }, Vc: [{ art: "d", Rd: 12.5 }] } });

test("Fall 3: knapp über η = 1 (Interaktion Beton)", () => {
  const r = A.nachweis(fall3());
  assert.deepEqual([...r.fehler], []);
  const L = r.lf[0];
  for (const k of ["Ns", "Np", "Nc", "Nsp", "Vs", "Vcp", "Vc"]) assert.ok(L.beta[k] <= 1, `Einzelnachweis ${k} ≤ 1`);
  nah(L.beta.Nc, 10 / 12, "β N,c"); assert.equal(L.beta.Nsp, 0); nah(L.beta.Vc, 0.4, "β V,c");
  nah(L.int.c, 1.013708, "Interaktion Beton (7.55)"); assert.equal(L.massgebend, "intC");
  assert.equal(L.ok, false); assert.equal(r.ok, false); nah(r.etaMax, 1.013708, "η max");
  const r2 = A.nachweis({ ...fall3(), interaktion: "7.56" });
  nah(r2.lf[0].int.c, 1.027778, "Interaktion Beton (7.56)"); assert.equal(r2.ok, false);
});

test("Fall 3: „entfällt“ ohne Begründung wird abgelehnt", () => {
  const e = fall3(); e.widerstand.Nsp = { art: "entfaellt", grund: " " };
  const r = A.nachweis(e);
  assert.ok(r.fehler.some(t => t.includes("Begründung"))); assert.equal(r.etaMax, null);
});

// ---------------------------------------------------------------------------------------------- Fall 4
// Quelle: Handrechnung. Drei Anker x = −100, 0, 100 mm; N = 6 kN, M_y = 1,2 kNm.
//   elastisch: N_i = 2 + 1200·x/20000 = 2 ± 6 → −4 / 2 / 8 kN → Anker 1 gedrückt
//   Neuverteilung: Druck C an der äußeren gedrückten Reihe x_P = −100; u = 0 / 100 / 200 mm
//   Σ N_i·u_i = M_y − N·x_P = 1200 + 600 = 1800 kN·mm; N_i = b·u_i → b = 1800/(100² + 200²) = 0,036
//   → N = 0 / 3,6 / 7,2 kN; C = 3,6 + 7,2 − 6 = 4,8 kN
//   Kontrolle Momente um Schwerpunkt: 7,2·100 − 4,8·(−100) = 1200 kN·mm ✓
test("Fall 4: Neuverteilung bei gedrückten Ankern", () => {
  const anker = [{ x: -100, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 0 }];
  const lf = { N: 6, My: 1.2 };
  const ab = A.aufteilen(anker, lf, { druck: "ablehnen" });
  assert.ok(ab.fehler.some(t => t.includes("gedrückt")), "Vorgabe: Fall wird abgelehnt");
  nah(ab.elastisch[0], -4, "elastisch N₁"); nah(ab.elastisch[2], 8, "elastisch N₃");
  const r = A.aufteilen(anker, lf, { druck: "neuverteilen" });
  assert.deepEqual([...r.fehler], []);
  nah(r.N[0] + 1, 1, "N₁ = 0"); nah(r.N[1], 3.6, "N₂"); nah(r.N[2], 7.2, "N₃"); nah(r.druck.C, 4.8, "C");
  nah(r.druck.P.x, -100, "x_P"); assert.deepEqual([...r.druck.reihe], [1]);
  assert.ok(r.ungeprueft.includes("druck"));
});

// Fall 4b – Quelle: Handrechnung. 2×2-Gruppe (±50, ±40), N = 0, M_y = 1,0 kNm. Elastisch ±5 kN → Reihe x = −50 gedrückt.
//   P = (−50, 0); Zuganker u = 100 mm: Σ N·u = 1000 → b = 1000/(2·100²) = 0,05 → N = 5 kN je Zuganker; C = 10 kN.
//   Symmetrie: beide gedrückten Anker gehören zur Reihe, keine Verdrehung um x.
test("Fall 4b: Neuverteilung, gedrückte Reihe aus zwei Ankern", () => {
  const anker = [{ x: -50, y: -40 }, { x: -50, y: 40 }, { x: 50, y: -40 }, { x: 50, y: 40 }];
  const r = A.aufteilen(anker, { N: 0, My: 1.0 }, { druck: "neuverteilen" });
  assert.deepEqual([...r.fehler], []);
  nah(r.N[0] + 1, 1, "N₁"); nah(r.N[1] + 1, 1, "N₂"); nah(r.N[2], 5, "N₃"); nah(r.N[3], 5, "N₄"); nah(r.druck.C, 10, "C");
  assert.deepEqual([...r.druck.reihe], [1, 2]); assert.ok(!r.ungeprueft.includes("druck2d"));
});

test("Fall 4c: Neuverteilung im Gesamtnachweis (N^g, N^h)", () => {
  const e = { ...basis(), druck: "neuverteilen", anker: [{ x: -100, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 0 }], lastfaelle: [{ name: "LK1", N: 6, My: 1.2 }],
    widerstand: { Ns: { art: "d", Rd: 20 }, Np: { art: "d", Rd: 20 }, Nc: { art: "d", Rd: 20 }, Nsp: { art: "d", Rd: 20 } } };
  const r = A.nachweis(e);
  assert.deepEqual([...r.fehler], []);
  nah(r.lf[0].G.Ng, 10.8, "N^g"); nah(r.lf[0].G.Nh, 7.2, "N^h"); nah(r.etaMax, 10.8 / 20, "η max");
  const ab = A.nachweis({ ...e, druck: "ablehnen" });
  assert.ok(ab.fehler.some(t => t.includes("gedrückt"))); assert.equal(ab.etaMax, null);
});

// ---------------------------------------------------------------------------------------------- Grenzen
test("Mindestwerte: Unterschreitung wird abgelehnt", () => {
  const e = fall2(); e.mindest = { smin: 120, cmin: 100, hmin: 250 };
  const r = A.nachweis(e);
  assert.equal(r.etaMax, null);
  assert.ok(r.fehler.some(t => t.startsWith("Achsabstand")) && r.fehler.some(t => t.startsWith("Randabstand")) && r.fehler.some(t => t.startsWith("Bauteildicke")));
  assert.ok(A.nachweis({ ...fall2(), mindest: {} }).fehler.some(t => t.includes("Mindestwerte")));
});

test("Gültigkeit: Hebelarm am Rand, Lochspiel, e₁ ohne Hebelarm, Anwendungsbereich", () => {
  // Kantenbruch mit Hebelarm nur für c > max{10·hef; 60·d} = 800 mm (7.2.2.5 (1))
  const e = fall2(); e.hebel = { mit: true, M0Rks: 250, alphaM: 1, gMs: 1.25, e1: 20 };
  assert.ok(A.nachweis(e).fehler.some(t => t.includes("7.2.2.5 (1)")));
  // d_f = 15 > 14 mm nach Tab. 6.1
  const e2 = fall2(); e2.geo.df = 15;
  assert.ok(A.nachweis(e2).fehler.some(t => t.includes("Tab. 6.1")));
  // Zwischenschicht ohne Hebelarm
  const e3 = fall2(); e3.hebel = { mit: false, e1: 10 };
  assert.ok(A.nachweis(e3).fehler.some(t => t.includes("6.2.2.3 (1)")));
  // hef < 40 mm, Verbunddübel hef > 20 d
  const e4 = fall3(); e4.geo.hef = 35;
  assert.ok(A.nachweis(e4).fehler.some(t => t.includes("1.3 (2)")));
  const e5 = fall3(); e5.geo.typ = "verbund"; e5.geo.hef = 250; e5.geo.h = 400; e5.mindest.hmin = 300;
  assert.ok(A.nachweis(e5).fehler.some(t => t.includes("20·d")));
});

// Quelle: Vorgabe Nutzer (14.11.2026): d_f,max laut ETA hat Vorrang vor Tab. 6.1; Ablehnung nur ohne beide Werte.
//   d = 12: Tab. 6.1 → 14 mm. Mit ETA-Wert 16 mm ist d_f = 15 mm zulässig, ohne ETA-Wert nicht.
//   d = 7 (nicht in Tab. 6.1): ohne ETA-Wert abgelehnt, mit ETA-Wert 8 mm und d_f = 8 mm zulässig.
test("Lochspiel: d_f,max aus ETA hat Vorrang vor Tab. 6.1", () => {
  const e = fall2(); e.geo.df = 15;
  assert.ok(A.nachweis(e).fehler.some(t => t.includes("Tab. 6.1")));
  e.geo.dfETA = 16;
  const r = A.nachweis(e);
  assert.deepEqual([...r.fehler], []); assert.equal(r.loch.quelle, "ETA"); assert.equal(r.loch.dm, 16);
  const e2 = fall2(); e2.geo.d = 7; e2.geo.dnom = 7; e2.geo.df = 8;
  assert.ok(A.nachweis(e2).fehler.some(t => t.includes("Weder ETA")));
  e2.geo.dfETA = 8;
  assert.deepEqual([...A.nachweis(e2).fehler], []);
});

test("Geometrieänderung nach Eingabe der Betonwiderstände wird gemeldet", () => {
  const e = fall2(); e.geoSchluessel = A.geoSchluessel(e);
  assert.equal(A.nachweis(e).geoAbweichung, undefined);
  e.geo.raender[0].c = 90;
  const r = A.nachweis(e);
  assert.equal(r.geoAbweichung, true); assert.ok(r.warn.some(t => t.includes("andere Geometrie")));
});

// Quelle: DIN EN 1992-4, Tab. 4.1 und Gl. (6.2). Toleranz 1e-9.
//   5.8: f_uk = 500, f_yk = 400 → γMs,N = max(1,2·1,25; 1,4) = 1,5; γMs,V = max(1,25; 1,25) = 1,25
//   10.9: f_uk = 1000 > 800 → 1,5 / 1,5;  γMc = 1,5·1,2 = 1,8;  l_a = 0,5·12 + 11,5 = 17,5 mm
test("Teilsicherheitsbeiwerte Tab. 4.1 und Hebelarm Gl. (6.2)", () => {
  nah(A.gammaMsN(500, 400), 1.5, "γMs,N 5.8", 1e-9); nah(A.gammaMsV(500, 400), 1.25, "γMs,V 5.8", 1e-9);
  nah(A.gammaMsN(1000, 900), 1.5, "γMs,N 10.9", 1e-9); nah(A.gammaMsV(1000, 900), 1.5, "γMs,V 10.9", 1e-9);
  nah(A.gammaMc(1.2), 1.8, "γMc", 1e-9);
  nah(A.hebelarm(12, A.e1AusZwischenschicht(10, 3)).la, 17.5, "l_a", 1e-9);
  nah(A.hebelarm(12, 10, true).la, 10, "l_a mit a₃ = 0", 1e-9);
  assert.equal(A.dfMax(12), 14); assert.equal(A.dfMax(36), 39); assert.equal(A.dfMax(7), null);
});

// ---------------------------------------------------------------------------------------------- Übergabe je Anker
// Quelle: Handrechnung. Lochbild TCN240 x = 39 / 201 mm (Schwerpunkt 120).
//   LK3: N = 2 / 1 kN, V = (0;1) / (0;3) kN → N^g = 3, N^h = 2; Resultierende bei x = (2·39 + 1·201)/3 = 93 → e_N = −27 mm
//   V^g = 4 kN; T = (−81)·1 + 81·3 = 162 kN·mm → e_V = 40,5 mm
test("Hash-Übergabe je Anker und Gruppengrößen", () => {
  const h = "#von=rb&prod=titann&typ=TCN240&n=2&xy=39,0;201,0&hb=10&pos=108.101&lc=LK1~1.5,3,0;1.5,3,0|LK3~2,0,1;1,0,3";
  const q = A.leseHash(h);
  assert.deepEqual([...q.fehler], []);
  assert.equal(q.n, 2); assert.equal(q.anker[1].x, 201); assert.equal(q.hb, 10); assert.equal(q.pos, "108.101"); assert.equal(q.lastfaelle.length, 2);
  const e = { ...basis(), modus: "jeAnker", anker: q.anker, lastfaelle: q.lastfaelle,
    widerstand: { Ns: { art: "d", Rd: 20 }, Np: { art: "d", Rd: 20 }, Nc: { art: "d", Rd: 20 }, Nsp: { art: "d", Rd: 20 }, Vs: { art: "d", Rd: 20 }, Vcp: { art: "d", Rd: 20 } } };
  const r = A.nachweis(e);
  assert.deepEqual([...r.fehler], []);
  const L = r.lf[1];
  assert.equal(L.weg, "jeAnker");
  nah(L.G.Ng, 3, "N^g"); nah(L.G.Nh, 2, "N^h"); nah(L.G.eN.x, -27, "e_N,x"); nah(L.G.Vg, 4, "V^g"); nah(L.G.eV, 40.5, "e_V");
  assert.ok(A.leseHash("#von=rb&n=3&xy=0,0;10,0&lc=A~1,0,0;1,0,0").fehler.length > 0, "n passt nicht zum Lochbild");
  assert.equal(A.leseHash("#lib"), null);
});
