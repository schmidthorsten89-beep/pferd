// Baut das Pferd aus einfachen Formen: drei Gruppen (außen, muskeln, skelett).
// Jedes anklickbare Mesh trägt userData.teilId (siehe teile.js) oder userData.neben (kurzer Hinweis).
// Koordinaten: Pferd schaut nach +x, Boden bei y = 0, Widerrist etwa 1,6 hoch.
import * as THREE from 'three';

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const ACHSE_X = V(1, 0, 0);
const ACHSE_Z = V(0, 0, 1);

// Eine Röhre entlang einer Kurve, deren Dicke sich ändern darf (Hals, Beine, Haarsträhnen …).
// radien werden gleichmäßig über die Kurve verteilt, zFaktor macht den Querschnitt flacher.
export class Form {
  constructor(punkte, radien, { zFaktor = 1, bezug = ACHSE_Z } = {}) {
    this.kurve = new THREE.CatmullRomCurve3(punkte.map((p) => (p.isVector3 ? p.clone() : V(...p))));
    this.radien = radien;
    this.zFaktor = zFaktor;
    this.bezug = bezug;
  }

  radius(t) {
    const r = this.radien;
    if (r.length === 1) return r[0];
    const f = Math.min(Math.max(t, 0), 1) * (r.length - 1);
    const i = Math.min(Math.floor(f), r.length - 2);
    const a = f - i;
    return r[i] * (1 - a) + r[i + 1] * a;
  }

  // Mittelpunkt c, Richtung T, „oben“ n (Winkel 0) und „Seite“ b (Winkel π/2).
  rahmen(t) {
    const c = this.kurve.getPointAt(t);
    const T = this.kurve.getTangentAt(t).normalize();
    const n = new THREE.Vector3().crossVectors(this.bezug, T).normalize();
    const b = new THREE.Vector3().crossVectors(T, n).normalize();
    return { c, T, n, b };
  }

  punkt(t, winkel, aussen = 0) {
    const { c, n, b } = this.rahmen(t);
    const r = this.radius(t) + aussen;
    return c.addScaledVector(n, r * Math.cos(winkel)).addScaledVector(b, r * this.zFaktor * Math.sin(winkel));
  }

  normale(t, winkel) {
    const { n, b } = this.rahmen(t);
    return n.clone().multiplyScalar(this.zFaktor * Math.cos(winkel)).addScaledVector(b, Math.sin(winkel)).normalize();
  }

  geometrie({ seg = 40, rad = 28, winkelVon = 0, winkelBis = Math.PI * 2, kappen = true, kappenLaenge = 1 } = {}) {
    const voll = Math.abs(winkelBis - winkelVon - Math.PI * 2) < 1e-6;
    const proRing = voll ? rad : rad + 1;
    const pos = [];
    const ringStart = [];
    const ring = (c, n, b, r) => {
      ringStart.push(pos.length / 3);
      for (let j = 0; j < proRing; j++) {
        const w = winkelVon + ((winkelBis - winkelVon) * j) / rad;
        const cw = r * Math.cos(w);
        const sw = r * this.zFaktor * Math.sin(w);
        pos.push(c.x + n.x * cw + b.x * sw, c.y + n.y * cw + b.y * sw, c.z + n.z * cw + b.z * sw);
      }
    };
    const stufen = 6;
    const a = this.rahmen(0);
    const e = this.rahmen(1);
    const ra = this.radius(0);
    const re = this.radius(1);
    if (kappen) {
      for (let k = stufen - 1; k >= 1; k--) {
        const phi = (k / stufen) * Math.PI / 2;
        ring(a.c.clone().addScaledVector(a.T, -ra * Math.sin(phi) * kappenLaenge), a.n, a.b, ra * Math.cos(phi));
      }
    }
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      const f = this.rahmen(t);
      ring(f.c, f.n, f.b, this.radius(t));
    }
    if (kappen) {
      for (let k = 1; k < stufen; k++) {
        const phi = (k / stufen) * Math.PI / 2;
        ring(e.c.clone().addScaledVector(e.T, re * Math.sin(phi) * kappenLaenge), e.n, e.b, re * Math.cos(phi));
      }
    }
    const idx = [];
    const weiter = (j) => (voll ? (j + 1) % rad : j + 1);
    for (let i = 0; i < ringStart.length - 1; i++) {
      for (let j = 0; j < rad; j++) {
        const A = ringStart[i] + j;
        const B = ringStart[i] + weiter(j);
        const C = ringStart[i + 1] + j;
        const D = ringStart[i + 1] + weiter(j);
        idx.push(A, B, C, B, D, C);
      }
    }
    if (kappen) {
      const s = pos.length / 3;
      const ps = a.c.clone().addScaledVector(a.T, -ra * kappenLaenge);
      pos.push(ps.x, ps.y, ps.z);
      const r0 = ringStart[0];
      for (let j = 0; j < rad; j++) idx.push(s, r0 + weiter(j), r0 + j);
      const ei = pos.length / 3;
      const pe = e.c.clone().addScaledVector(e.T, re * kappenLaenge);
      pos.push(pe.x, pe.y, pe.z);
      const rl = ringStart[ringStart.length - 1];
      for (let j = 0; j < rad; j++) idx.push(ei, rl + j, rl + weiter(j));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }
}

// ---------- Fellfarben ----------
export const FELLFARBEN = {
  fuchs: { name: 'Fuchs', fell: 0xb4622a, haar: 0xd28c4e, huf: 0x5a4a3c },
  brauner: { name: 'Brauner', fell: 0x7b4a2c, haar: 0x231c18, huf: 0x2e2824 },
  rappe: { name: 'Rappe', fell: 0x2e2825, haar: 0x151212, huf: 0x2a2624 },
  schimmel: { name: 'Schimmel', fell: 0xe9e5dd, haar: 0xd6cfc3, huf: 0x8a8580 },
};

// ---------- Grundformen, die alle Schichten teilen ----------
function grundformen() {
  const beinVorne = (z) => new Form(
    [[0.5, 1.0, z], [0.52, 0.72, z], [0.5, 0.45, z], [0.5, 0.22, z], [0.53, 0.1, z]],
    [0.13, 0.1, 0.07, 0.055, 0.05, 0.05], { zFaktor: 0.9 });
  const beinHinten = (z) => new Form(
    [[-0.55, 1.12, z], [-0.62, 0.8, z], [-0.7, 0.52, z], [-0.64, 0.3, z], [-0.6, 0.1, z]],
    [0.17, 0.12, 0.075, 0.06, 0.055, 0.05], { zFaktor: 0.85 });
  return {
    rumpf: new Form([[-0.55, 1.22], [-0.2, 1.18], [0.2, 1.18], [0.5, 1.22]], [0.38, 0.41, 0.42, 0.4, 0.37], { zFaktor: 0.8 }),
    brust: new Form([[0.35, 1.15], [0.62, 1.18]], [0.36, 0.3], { zFaktor: 0.85 }),
    po: new Form([[-0.4, 1.27], [-0.68, 1.25]], [0.38, 0.32], { zFaktor: 0.95 }),
    hals: new Form([[0.5, 1.32], [0.72, 1.68], [0.92, 1.95], [1.04, 2.08]], [0.3, 0.22, 0.17, 0.15], { zFaktor: 0.7 }),
    kopf: new Form([[1.0, 2.12], [1.18, 1.95], [1.36, 1.72], [1.44, 1.6]], [0.14, 0.13, 0.1, 0.09], { zFaktor: 0.78 }),
    beine: [
      { form: beinVorne(0.17), vorne: true, z: 0.17 },
      { form: beinVorne(-0.17), vorne: true, z: -0.17 },
      { form: beinHinten(0.16), vorne: false, z: 0.16 },
      { form: beinHinten(-0.16), vorne: false, z: -0.16 },
    ],
  };
}

const SCHWEIF_DREHPUNKT = V(-0.92, 1.45, 0);

// ---------- Bausatz: Materialien je Teil, damit man ein Teil einzeln aufleuchten lassen kann ----------
class Bausatz {
  constructor() {
    this.materialien = new Map();
    this.rollen = { fell: [], haar: [], huf: [] };
    this.teilMeshes = new Map();
    this.fleckGeo = new THREE.SphereGeometry(1, 32, 20).rotateZ(Math.PI / 2);
    this.faserTextur = faserTextur();
  }

  material(schluessel, art) {
    if (this.materialien.has(schluessel)) return this.materialien.get(schluessel);
    let m;
    switch (art) {
      case 'geist':
        m = new THREE.MeshStandardMaterial({ color: 0xa9c7e0, transparent: true, opacity: 0.16, depthWrite: false, roughness: 1 });
        break;
      case 'knochen':
        m = new THREE.MeshStandardMaterial({ color: 0xf2e8cf, roughness: 0.55 });
        break;
      case 'muskel':
        m = new THREE.MeshStandardMaterial({ color: 0x9c3a33, roughness: 0.7 });
        break;
      case 'muskelHell':
        m = new THREE.MeshStandardMaterial({ color: 0xec7a68, roughness: 0.55, map: this.faserTextur });
        break;
      case 'auge':
        m = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.15 });
        break;
      case 'glanz':
        m = new THREE.MeshBasicMaterial({ color: 0xffffff });
        break;
      case 'dunkel':
        m = new THREE.MeshStandardMaterial({ color: 0x2b1d1a, roughness: 0.8 });
        break;
      case 'maul':
        m = new THREE.MeshStandardMaterial({ color: 0x5b4642, roughness: 0.6 });
        break;
      default: // fell, haar, huf
        m = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: art === 'huf' ? 0.5 : 0.8 });
        this.rollen[art].push(m);
    }
    this.materialien.set(schluessel, m);
    return m;
  }

  // Legt ein Mesh in die Gruppe. ziel: { teilId } oder { neben }, art: Materialart.
  mesh(gruppe, geo, schicht, ziel, art) {
    const schluessel = `${schicht}:${ziel.teilId || 'neben'}:${art}`;
    const m = new THREE.Mesh(geo, this.material(schluessel, art));
    if (ziel.teilId) {
      m.userData.teilId = ziel.teilId;
      if (!this.teilMeshes.has(ziel.teilId)) this.teilMeshes.set(ziel.teilId, []);
      this.teilMeshes.get(ziel.teilId).push(m);
    } else if (ziel.neben) {
      m.userData.neben = ziel.neben;
    } else {
      m.raycast = () => {}; // Durchsichtige Hülle: nicht anklickbar
    }
    gruppe.add(m);
    return m;
  }

  // Ein flaches Ei, das auf der Oberfläche einer Form liegt (Muskeln, Nüstern …).
  fleck(gruppe, form, t, winkel, { laenge, breite, dicke, einsinken = 0.35, drehung = 0 }, schicht, ziel, art) {
    const { T } = form.rahmen(t);
    const p = form.punkt(t, winkel);
    const R = form.normale(t, winkel);
    let X = T.clone().addScaledVector(R, -T.dot(R)).normalize();
    let Y = new THREE.Vector3().crossVectors(R, X);
    if (drehung) {
      const d = Y.y < 0 ? -drehung : drehung;
      X = X.clone().multiplyScalar(Math.cos(d)).addScaledVector(Y, Math.sin(d)).normalize();
      Y = new THREE.Vector3().crossVectors(R, X);
    }
    const m = this.mesh(gruppe, this.fleckGeo, schicht, ziel, art);
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, R));
    m.scale.set(laenge, breite, dicke);
    m.position.copy(p).addScaledVector(R, -dicke * einsinken);
    return m;
  }
}

function faserTextur() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 16;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  for (let x = 0; x < c.width; x += 8) {
    g.fillStyle = 'rgba(150, 40, 30, 0.35)';
    g.fillRect(x, 0, 2, c.height);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

// Hilfsfunktion: Zylinder/Kapsel zwischen zwei Punkten ausrichten.
function zwischen(mesh, a, b) {
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}

// ---------- Schicht: Außen ----------
function baueAussen(bs, F) {
  const g = new THREE.Group();
  const S = 'aussen';
  const RUECKEN = 1.15; // Grenze zwischen Rücken und Bauch (Winkel von oben)

  bs.mesh(g, F.rumpf.geometrie({ winkelVon: -RUECKEN, winkelBis: RUECKEN, kappenLaenge: 0.9 }), S, { teilId: 'ruecken' }, 'fell');
  bs.mesh(g, F.rumpf.geometrie({ winkelVon: RUECKEN, winkelBis: Math.PI * 2 - RUECKEN, kappenLaenge: 0.9 }), S, { teilId: 'bauch' }, 'fell');
  bs.mesh(g, F.brust.geometrie(), S, { neben: 'brust' }, 'fell');
  bs.mesh(g, F.po.geometrie(), S, { neben: 'po' }, 'fell');
  bs.mesh(g, F.hals.geometrie(), S, { teilId: 'hals' }, 'fell');
  bs.mesh(g, F.kopf.geometrie({ kappenLaenge: 0.9 }), S, { neben: 'kopf' }, 'fell');

  for (const bein of F.beine) {
    bs.mesh(g, bein.form.geometrie({ seg: 30, rad: 20 }), S, { neben: 'bein' }, 'fell');
    const ende = bein.form.kurve.getPointAt(1);
    const huf = bs.mesh(g, new THREE.CylinderGeometry(0.056, 0.072, 0.1, 22), S, { teilId: 'hufe' }, 'huf');
    huf.position.set(ende.x + 0.01, 0.05, ende.z);
  }

  // Ohren
  for (const s of [1, -1]) {
    const ohr = bs.mesh(g, new THREE.ConeGeometry(0.048, 0.18, 14), S, { teilId: 'ohren' }, 'fell');
    ohr.scale.set(1, 1, 0.6);
    ohr.position.set(1.0, 2.29, 0.065 * s);
    ohr.rotation.set(0.25 * s, 0, 0.3);
  }

  // Augen mit kleinem Glanzpunkt
  for (const s of [1, -1]) {
    const p = F.kopf.punkt(0.2, 1.15 * s, -0.012);
    const auge = bs.mesh(g, new THREE.SphereGeometry(0.036, 20, 14), S, { teilId: 'augen' }, 'auge');
    auge.position.copy(p);
    const glanz = bs.mesh(g, new THREE.SphereGeometry(0.009, 8, 6), S, { teilId: 'augen' }, 'glanz');
    glanz.position.copy(p).add(V(0.012, 0.014, 0.03 * s));
  }

  // Nüstern und Maul
  for (const s of [1, -1]) {
    bs.fleck(g, F.kopf, 0.98, 0.75 * s, { laenge: 0.04, breite: 0.024, dicke: 0.02, einsinken: 0.5 }, S, { teilId: 'nuestern' }, 'dunkel');
  }
  bs.fleck(g, F.kopf, 0.9, Math.PI, { laenge: 0.1, breite: 0.075, dicke: 0.03, einsinken: 0.4 }, S, { teilId: 'maul' }, 'maul');

  // Mähne: Strähnen, die vom Mähnenkamm zur Seite fallen
  for (let i = 0; i < 17; i++) {
    const t = 0.06 + i * 0.056;
    const zacken = (i % 2) * 0.02;
    const punkte = [
      F.hals.punkt(t, -0.15, 0.03),
      F.hals.punkt(t - 0.015, 0.25, 0.06 + zacken),
      F.hals.punkt(t - 0.03, 0.75, 0.045 + zacken),
      F.hals.punkt(t - 0.045, 1.15, 0.012),
    ];
    const strang = new Form(punkte, [0.045, 0.05, 0.035, 0.01]);
    bs.mesh(g, strang.geometrie({ seg: 12, rad: 10 }), S, { teilId: 'maehne' }, 'haar');
  }

  // Schopf: drei Strähnen zwischen den Ohren auf die Stirn
  for (const w of [-0.3, 0, 0.3]) {
    const punkte = [0.0, 0.07, 0.14, 0.22].map((t, k) => F.kopf.punkt(t, w, 0.03 - k * 0.006));
    punkte[0].add(V(-0.04, 0.03, 0));
    const strang = new Form(punkte, [0.03, 0.035, 0.026, 0.008]);
    bs.mesh(g, strang.geometrie({ seg: 12, rad: 10 }), S, { teilId: 'schopf' }, 'haar');
  }

  // Schweif in eigener Gruppe, damit er wedeln kann
  const schweif = new THREE.Group();
  schweif.position.copy(SCHWEIF_DREHPUNKT);
  const rel = (x, y, z = 0) => V(x, y, z).sub(SCHWEIF_DREHPUNKT);
  bs.mesh(schweif, new Form([rel(-0.9, 1.47), rel(-1.0, 1.4), rel(-1.05, 1.28)], [0.075, 0.065, 0.055]).geometrie({ seg: 12, rad: 14 }),
    S, { teilId: 'schweif' }, 'haar');
  for (let i = 0; i < 7; i++) {
    const z = (i - 3) * 0.025;
    const lauf = (i % 3) * 0.03;
    const strang = new Form(
      [rel(-1.02, 1.36, z * 0.5), rel(-1.1 - lauf, 1.15, z), rel(-1.12 - lauf, 0.88, z * 1.3), rel(-1.08 - lauf, 0.62 + (i % 2) * 0.06, z * 1.5)],
      [0.05, 0.06, 0.048, 0.012]);
    bs.mesh(schweif, strang.geometrie({ seg: 16, rad: 10 }), S, { teilId: 'schweif' }, 'haar');
  }
  g.add(schweif);

  return { gruppe: g, schweif };
}

// ---------- Schicht: Muskeln ----------
function baueMuskeln(bs, F) {
  const g = new THREE.Group();
  const S = 'muskeln';
  const neben = { neben: 'muskel' };

  bs.mesh(g, F.rumpf.geometrie({ kappenLaenge: 0.9 }), S, neben, 'muskel');
  bs.mesh(g, F.brust.geometrie(), S, neben, 'muskel');
  bs.mesh(g, F.po.geometrie(), S, neben, 'muskel');
  bs.mesh(g, F.hals.geometrie(), S, neben, 'muskel');
  bs.mesh(g, F.kopf.geometrie({ kappenLaenge: 0.9 }), S, neben, 'muskel');
  for (const bein of F.beine) {
    bs.mesh(g, bein.form.geometrie({ seg: 30, rad: 20 }), S, neben, 'muskel');
    const ende = bein.form.kurve.getPointAt(1);
    const huf = bs.mesh(g, new THREE.CylinderGeometry(0.056, 0.072, 0.1, 22), S, { neben: 'bein' }, 'huf');
    huf.position.set(ende.x + 0.01, 0.05, ende.z);
  }
  for (const s of [1, -1]) {
    const auge = bs.mesh(g, new THREE.SphereGeometry(0.034, 16, 12), S, { neben: 'kopf' }, 'auge');
    auge.position.copy(F.kopf.punkt(0.2, 1.15 * s, -0.012));
  }

  const hell = 'muskelHell';
  for (const s of [1, -1]) {
    const flach = { einsinken: 0.6 };
    bs.fleck(g, F.kopf, 0.32, 1.75 * s, { ...flach, laenge: 0.14, breite: 0.09, dicke: 0.03 }, S, { teilId: 'kaumuskel' }, hell);
    bs.fleck(g, F.hals, 0.45, 1.05 * s, { ...flach, laenge: 0.42, breite: 0.08, dicke: 0.04 }, S, { teilId: 'halsmuskel' }, hell);
    bs.fleck(g, F.hals, 0.4, 2.1 * s, { ...flach, laenge: 0.48, breite: 0.08, dicke: 0.04 }, S, { teilId: 'halsmuskel' }, hell);
    bs.fleck(g, F.brust, 0.45, 1.3 * s, { ...flach, laenge: 0.34, breite: 0.13, dicke: 0.05, drehung: -1.1 }, S, { teilId: 'schultermuskel' }, hell);
    bs.fleck(g, F.rumpf, 0.5, 0.5 * s, { ...flach, laenge: 0.78, breite: 0.1, dicke: 0.04 }, S, { teilId: 'rueckenmuskel' }, hell);
    bs.fleck(g, F.rumpf, 0.5, 2.15 * s, { ...flach, laenge: 0.6, breite: 0.18, dicke: 0.045 }, S, { teilId: 'bauchmuskel' }, hell);
    bs.fleck(g, F.po, 0.45, 0.8 * s, { ...flach, laenge: 0.34, breite: 0.22, dicke: 0.055 }, S, { teilId: 'kruppenmuskel' }, hell);
  }
  for (const bein of F.beine) {
    const s = Math.sign(bein.z);
    if (bein.vorne) {
      bs.fleck(g, bein.form, 0.3, (Math.PI / 2) * s, { einsinken: 0.6, laenge: 0.24, breite: 0.07, dicke: 0.035 }, S, { teilId: 'unterarmmuskel' }, hell);
    } else {
      bs.fleck(g, bein.form, 0.15, (Math.PI / 2 + 0.25) * s, { einsinken: 0.6, laenge: 0.34, breite: 0.13, dicke: 0.05 }, S, { teilId: 'oberschenkelmuskel' }, hell);
    }
  }

  return { gruppe: g };
}

// ---------- Schicht: Skelett ----------
function baueSkelett(bs, F) {
  const g = new THREE.Group();
  const S = 'skelett';
  const hulle = {};
  const kn = 'knochen';

  // Durchsichtige Hülle, damit man sieht, wo die Knochen im Pferd liegen
  bs.mesh(g, F.rumpf.geometrie({ kappenLaenge: 0.9 }), S, hulle, 'geist');
  bs.mesh(g, F.brust.geometrie(), S, hulle, 'geist');
  bs.mesh(g, F.po.geometrie(), S, hulle, 'geist');
  bs.mesh(g, F.hals.geometrie(), S, hulle, 'geist');
  bs.mesh(g, F.kopf.geometrie({ kappenLaenge: 0.9 }), S, hulle, 'geist');
  for (const bein of F.beine) {
    bs.mesh(g, bein.form.geometrie({ seg: 30, rad: 20 }), S, hulle, 'geist');
    const ende = bein.form.kurve.getPointAt(1);
    const huf = bs.mesh(g, new THREE.CylinderGeometry(0.056, 0.072, 0.1, 22), S, hulle, 'geist');
    huf.position.set(ende.x + 0.01, 0.05, ende.z);
  }

  // Schädel mit Augenhöhlen
  const schaedel = new Form(F.kopf.kurve.points, [0.12, 0.11, 0.08, 0.07], { zFaktor: 0.72 });
  bs.mesh(g, schaedel.geometrie({ kappenLaenge: 0.9 }), S, { teilId: 'schaedel' }, kn);
  for (const s of [1, -1]) {
    const p = schaedel.punkt(0.2, 1.15 * s, -0.008);
    const hoehle = bs.mesh(g, new THREE.SphereGeometry(0.034, 16, 12), S, { teilId: 'schaedel' }, 'dunkel');
    hoehle.position.copy(p);
    const rand = bs.mesh(g, new THREE.TorusGeometry(0.038, 0.011, 8, 20), S, { teilId: 'schaedel' }, kn);
    rand.position.copy(p);
    rand.lookAt(p.clone().add(schaedel.normale(0.2, 1.15 * s)));
  }

  // Halswirbel (7)
  const hwKurve = new THREE.CatmullRomCurve3([V(0.98, 2.06), V(0.88, 1.9), V(0.74, 1.66), V(0.62, 1.44), V(0.53, 1.41)]);
  for (let k = 0; k < 7; k++) {
    const a = hwKurve.getPointAt(k / 7 + 0.01);
    const b = hwKurve.getPointAt((k + 1) / 7 - 0.01);
    const lang = a.distanceTo(b);
    bs.mesh(g, new THREE.CapsuleGeometry(0.04, Math.max(lang - 0.07, 0.01), 4, 12), S, { teilId: 'halswirbel' }, kn);
    zwischen(g.children[g.children.length - 1], a, b);
  }

  // Wirbelsäule: Rücken mit Dornfortsätzen …
  const wsKurve = new THREE.CatmullRomCurve3([V(0.5, 1.42), V(0.2, 1.47), V(-0.2, 1.47), V(-0.55, 1.47), V(-0.86, 1.42)]);
  const wirbel = 20;
  for (let k = 0; k < wirbel; k++) {
    const t = (k + 0.5) / wirbel;
    const p = wsKurve.getPointAt(t);
    const T = wsKurve.getTangentAt(t);
    const w = bs.mesh(g, new THREE.CapsuleGeometry(0.032, 0.03, 3, 10), S, { teilId: 'wirbelsaeule' }, kn);
    w.position.copy(p);
    w.quaternion.setFromUnitVectors(V(0, 1, 0), T);
    const hoehe = t < 0.3 ? 0.17 - t * 0.25 : 0.08;
    const dorn = bs.mesh(g, new THREE.BoxGeometry(0.022, hoehe, 0.024), S, { teilId: 'wirbelsaeule' }, kn);
    dorn.position.copy(p).add(V(-0.01, hoehe / 2, 0));
    dorn.rotation.z = 0.2;
  }

  // Rippen
  const RIPPEN = 9;
  for (let k = 0; k < RIPPEN; k++) {
    const x = 0.42 - k * 0.1;
    const breit = 0.82 + 0.18 * Math.sin((k / (RIPPEN - 1)) * Math.PI);
    const kurz = k > 5; // hintere Rippen enden höher
    for (const s of [1, -1]) {
      const punkte = [
        V(x + 0.02, 1.46, 0.03 * s),
        V(x, 1.45, 0.17 * s * breit),
        V(x - 0.04, 1.3, 0.27 * s * breit),
        V(x - 0.07, 1.06, 0.28 * s * breit),
      ];
      if (kurz) punkte.push(V(x - 0.08, 0.92, 0.22 * s * breit));
      else punkte.push(V(x - 0.06, 0.86, 0.17 * s * breit), V(x - 0.04, 0.82, 0.04 * s));
      const rippe = new Form(punkte, [0.018, 0.02, 0.02, 0.016], { bezug: ACHSE_X });
      bs.mesh(g, rippe.geometrie({ seg: 24, rad: 8 }), S, { teilId: 'rippen' }, kn);
    }
  }
  // Brustbein
  bs.mesh(g, new Form([[0.62, 0.98], [0.35, 0.84], [-0.05, 0.8]], [0.03, 0.035, 0.02]).geometrie({ seg: 16, rad: 10 }), S, { neben: 'knochen' }, kn);

  // Schulterblätter
  for (const s of [1, -1]) {
    const sb = bs.mesh(g, new THREE.SphereGeometry(1, 24, 16), S, { teilId: 'schulterblatt' }, kn);
    sb.scale.set(0.075, 0.24, 0.022);
    sb.position.set(0.5, 1.35, 0.25 * s);
    sb.rotation.set(0, -0.25 * s, 0.46);
  }

  // Becken: je Seite ein Bügel plus Querverbindung
  for (const s of [1, -1]) {
    const buegel = new Form([[-0.34, 1.48, 0.27 * s], [-0.62, 1.28, 0.2 * s], [-0.93, 1.33, 0.12 * s]], [0.065, 0.045, 0.05], { zFaktor: 0.55 });
    bs.mesh(g, buegel.geometrie({ seg: 20, rad: 12 }), S, { teilId: 'becken' }, kn);
  }
  bs.mesh(g, new Form([[-0.66, 1.2, -0.17], [-0.68, 1.15, 0], [-0.66, 1.2, 0.17]], [0.03], { bezug: ACHSE_X }).geometrie({ seg: 12, rad: 10 }),
    S, { teilId: 'becken' }, kn);

  // Beinknochen
  for (const bein of F.beine) {
    const z = bein.z;
    const ende = bein.form.kurve.getPointAt(1);
    const roehre = (pkt, r, ziel) => bs.mesh(g, new Form(pkt.map(([x, y]) => [x, y, z]), r).geometrie({ seg: 16, rad: 12 }), S, ziel, kn);
    if (bein.vorne) {
      roehre([[0.62, 1.12], [0.52, 1.0], [0.46, 0.92]], [0.045, 0.035, 0.042], { neben: 'knochen' }); // Oberarm
      roehre([[0.46, 0.92], [0.5, 0.68], [0.5, 0.46]], [0.04, 0.032, 0.036], { neben: 'knochen' }); // Unterarm
      roehre([[0.5, 0.43], [0.5, 0.2]], [0.032, 0.027, 0.032], { teilId: 'roehrbein' });
      roehre([[0.5, 0.17], [0.53, 0.085]], [0.026, 0.024], { neben: 'knochen' }); // Fesselbein
    } else {
      roehre([[-0.66, 1.26], [-0.6, 1.05], [-0.52, 0.86]], [0.055, 0.04, 0.05], { teilId: 'oberschenkelknochen' });
      roehre([[-0.53, 0.83], [-0.62, 0.66], [-0.7, 0.52]], [0.042, 0.032, 0.036], { neben: 'knochen' }); // Unterschenkel
      roehre([[-0.7, 0.49], [-0.62, 0.2]], [0.032, 0.027, 0.032], { teilId: 'roehrbein' });
      roehre([[-0.62, 0.17], [-0.6, 0.085]], [0.026, 0.024], { neben: 'knochen' }); // Fesselbein
    }
    const hb = bs.mesh(g, new THREE.CylinderGeometry(0.03, 0.055, 0.045, 16), S, { teilId: 'hufbein' }, kn);
    hb.position.set(ende.x + 0.01, 0.04, ende.z);
  }

  // Schweifwirbel wedeln mit
  const schweif = new THREE.Group();
  schweif.position.copy(SCHWEIF_DREHPUNKT);
  const swKurve = new THREE.CatmullRomCurve3([V(-0.9, 1.45), V(-1.0, 1.39), V(-1.06, 1.26), V(-1.08, 1.12)].map((p) => p.sub(SCHWEIF_DREHPUNKT)));
  for (let k = 0; k < 9; k++) {
    const t = (k + 0.5) / 9;
    const w = bs.mesh(schweif, new THREE.SphereGeometry(0.03 - k * 0.0018, 10, 8), S, { teilId: 'wirbelsaeule' }, kn);
    w.position.copy(swKurve.getPointAt(t));
    w.scale.set(1, 1.3, 1);
  }
  g.add(schweif);

  return { gruppe: g, schweif };
}

// ---------- Boden mit weichem Schatten ----------
function baueBoden() {
  const g = new THREE.Group();
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const k = c.getContext('2d');
  const verlauf = k.createRadialGradient(64, 64, 0, 64, 64, 64);
  verlauf.addColorStop(0, 'rgba(0,0,0,0.35)');
  verlauf.addColorStop(1, 'rgba(0,0,0,0)');
  k.fillStyle = verlauf;
  k.fillRect(0, 0, 128, 128);
  const schatten = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.0),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  schatten.rotation.x = -Math.PI / 2;
  schatten.position.set(-0.05, 0.002, 0);
  schatten.raycast = () => {};
  g.add(schatten);

  const wiese = new THREE.Mesh(
    new THREE.CircleGeometry(2.4, 64),
    new THREE.MeshStandardMaterial({ color: 0x8fcf6b, roughness: 1 }));
  wiese.rotation.x = -Math.PI / 2;
  wiese.raycast = () => {};
  g.add(wiese);
  return g;
}

export function bauePferd() {
  const bs = new Bausatz();
  const F = grundformen();
  const aussen = baueAussen(bs, F);
  const muskeln = baueMuskeln(bs, F);
  const skelett = baueSkelett(bs, F);

  return {
    gruppen: { aussen: aussen.gruppe, muskeln: muskeln.gruppe, skelett: skelett.gruppe },
    boden: baueBoden(),
    teilMeshes: bs.teilMeshes,
    schweife: [aussen.schweif, skelett.schweif],
    setzeFell(schluessel) {
      const f = FELLFARBEN[schluessel] || FELLFARBEN.fuchs;
      for (const m of bs.rollen.fell) m.color.setHex(f.fell);
      for (const m of bs.rollen.haar) m.color.setHex(f.haar);
      for (const m of bs.rollen.huf) m.color.setHex(f.huf);
    },
  };
}
