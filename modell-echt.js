// Lädt die echten 3D-Modelle (Pferd und Skelett) und macht sie antippbar.
// Weil die Modelle aus einem Stück sind, gibt es „Zonen“: Kapseln (Strecke a–b mit Radius r) im Modellraum.
// Ein Treffpunkt gehört zum ersten Teil, in dessen Zone er liegt. Zum Aufleuchten malt ein Shader die Zonen an.
import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';

export const FELLFARBEN = {
  brauner: { name: 'Brauner', farbe: 0x7b4a2c, modus: 0 },
  fuchs: { name: 'Fuchs', farbe: 0xb4622a, modus: 1 },
  rappe: { name: 'Rappe', farbe: 0x2e2825, modus: 2 },
  schimmel: { name: 'Schimmel', farbe: 0xe9e5dd, modus: 3 },
};
const MUSKEL_MODUS = 9;

// ---------- Zonen ----------
const kapsel = (a, b, r) => ({ a: new THREE.Vector3(...a), b: new THREE.Vector3(...(b || a)), r });
const spiegeln = ([x, y, z], mitte = 0) => [2 * mitte - x, y, z];
// Dieselbe Kapsel links und rechts (gespiegelt an x = mitte)
const paar = (a, b, r, mitte = 0) => [kapsel(a, b, r), kapsel(spiegeln(a, mitte), b ? spiegeln(b, mitte) : null, r)];
const KOPF_MITTE = 0.075; // Der Kopf des Modells ist leicht zur Seite gedreht
const kette = (punkte, r) => punkte.slice(1).map((p, i) => kapsel(punkte[i], p, r));

// Pferd (Modellraum: schaut nach +z, Boden bei y = 0). Reihenfolge = Vorrang beim Antippen.
const ZONEN_PFERD = [
  { teilId: 'augen', kapseln: [kapsel([0.205, 1.765, 1.415], null, 0.06), kapsel([-0.05, 1.748, 1.442], null, 0.06)] },
  { teilId: 'ohren', kapseln: paar([0.125, 1.97, 1.335], [0.15, 2.07, 1.31], 0.06, 0.056) },
  { teilId: 'nuestern', kapseln: paar([0.15, 1.48, 1.565], null, 0.062, 0.085) },
  { teilId: 'maul', kapseln: [kapsel([-0.04, 1.4, 1.5], [0.2, 1.4, 1.5], 0.075)] },
  { teilId: 'schopf', kapseln: [kapsel([KOPF_MITTE, 1.97, 1.43], [KOPF_MITTE, 1.88, 1.5], 0.075)] },
  { teilId: 'maehne', kapseln: kette([[0, 2.0, 1.32], [0, 1.9, 1.0], [0, 1.77, 0.72], [0, 1.66, 0.52]], 0.1) },
  { teilId: 'schweif', kapseln: kette([[0, 1.45, -0.72], [0, 1.0, -0.86], [0, 0.25, -0.88]], 0.14) },
  { teilId: 'hufe', kapseln: [kapsel([-0.32, 0.05, 0.77], [0.32, 0.05, 0.77], 0.09), kapsel([-0.32, 0.06, -0.51], [0.32, 0.06, -0.51], 0.09)] },
  { neben: 'kopf', kapseln: [kapsel([KOPF_MITTE, 1.8, 1.3], [KOPF_MITTE, 1.5, 1.48], 0.24)] },
  { teilId: 'hals', kapseln: [kapsel([0.03, 1.66, 1.04], [0, 1.4, 0.8], 0.25)] },
  { teilId: 'ruecken', kapseln: [kapsel([0, 1.58, 0.52], [0, 1.56, -0.4], 0.24)] },
  { teilId: 'bauch', kapseln: [kapsel([0, 0.84, 0.5], [0, 0.86, -0.18], 0.3)] },
  { neben: 'brust', kapseln: [kapsel([0, 1.15, 0.85], null, 0.32)] },
  { neben: 'po', kapseln: [kapsel([0, 1.3, -0.6], null, 0.33)] },
  { neben: 'bein', kapseln: [...paar([0.2, 0.95, 0.72], [0.2, 0.12, 0.76], 0.14), ...paar([0.2, 0.95, -0.5], [0.2, 0.12, -0.5], 0.16)] },
];

// Muskeln liegen auf derselben Pferdeform, je Seite eine Zone
const ZONEN_MUSKELN = [
  { teilId: 'kaumuskel', kapseln: paar([0.19, 1.62, 1.26], [0.19, 1.56, 1.32], 0.1, 0.07) },
  { teilId: 'unterarmmuskel', kapseln: paar([0.23, 0.95, 0.7], [0.23, 0.7, 0.7], 0.09) },
  { teilId: 'schultermuskel', kapseln: paar([0.24, 1.45, 0.68], [0.26, 1.18, 0.8], 0.12) },
  { teilId: 'halsmuskel', kapseln: paar([0.12, 1.64, 1.1], [0.16, 1.36, 0.86], 0.12) },
  { teilId: 'kruppenmuskel', kapseln: paar([0.2, 1.5, -0.35], [0.26, 1.38, -0.62], 0.15) },
  { teilId: 'oberschenkelmuskel', kapseln: paar([0.29, 1.15, -0.5], [0.25, 0.82, -0.52], 0.13) },
  { teilId: 'rueckenmuskel', kapseln: paar([0.13, 1.53, 0.45], [0.13, 1.52, -0.22], 0.1) },
  { teilId: 'bauchmuskel', kapseln: paar([0.24, 1.0, 0.45], [0.24, 1.0, -0.12], 0.15) },
];

// Skelett (eigener Modellraum, schaut ebenfalls nach +z)
const ZONEN_SKELETT = [
  { teilId: 'hufbein', kapseln: [...paar([0.13, 0.05, 0.48], null, 0.075), ...paar([0.146, 0.07, -0.665], null, 0.075)] },
  { teilId: 'roehrbein', kapseln: [...paar([0.155, 0.49, 0.43], [0.15, 0.2, 0.44], 0.045), ...paar([0.145, 0.46, -0.714], [0.145, 0.18, -0.69], 0.045)] },
  { teilId: 'schaedel', kapseln: [kapsel([0, 1.44, 1.05], [0, 1.12, 1.33], 0.14)] },
  { teilId: 'halswirbel', kapseln: kette([[0, 1.47, 0.98], [0, 1.36, 0.77], [0, 1.18, 0.56], [0, 1.12, 0.49]], 0.085) },
  { teilId: 'wirbelsaeule', kapseln: [
    ...kette([[0, 1.25, 0.44], [0, 1.36, 0.07], [0, 1.3, -0.45], [0, 1.27, -0.59]], 0.12),
    ...kette([[0, 1.24, -0.63], [0, 1.09, -0.82], [0, 0.9, -1.05]], 0.05),
  ] },
  { teilId: 'schulterblatt', kapseln: paar([0.12, 1.3, 0.38], [0.14, 0.98, 0.5], 0.09) },
  { teilId: 'oberschenkelknochen', kapseln: paar([0.17, 1.06, -0.63], [0.19, 0.79, -0.53], 0.075) },
  { teilId: 'becken', kapseln: [kapsel([0, 1.2, -0.47], [0, 1.12, -0.76], 0.17)] },
  { teilId: 'rippen', kapseln: [kapsel([0, 1.03, 0.36], [0, 1.03, -0.3], 0.27)] },
];

function liegtIn(k, p) {
  const ba = k.b.clone().sub(k.a);
  const t = THREE.MathUtils.clamp(p.clone().sub(k.a).dot(ba) / Math.max(ba.lengthSq(), 1e-9), 0, 1);
  return p.distanceTo(k.a.clone().addScaledVector(ba, t)) <= k.r;
}

// ---------- Shader: Zonen leuchten lassen, Fellfarbe und Muskel-Look ----------
const ZONEN_MAX = 40;

function zonenMaterial(material, fellModus) {
  const u = {
    uZahl: { value: 0 },
    uA: { value: Array.from({ length: ZONEN_MAX }, () => new THREE.Vector3()) },
    uB: { value: Array.from({ length: ZONEN_MAX }, () => new THREE.Vector4()) },
    uFarbe: { value: Array.from({ length: ZONEN_MAX }, () => new THREE.Vector4()) },
    uFell: { value: fellModus },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vZone;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvZone = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vZone;
uniform int uZahl;
uniform int uFell;
uniform vec3 uA[${ZONEN_MAX}];
uniform vec4 uB[${ZONEN_MAX}];
uniform vec4 uFarbe[${ZONEN_MAX}];
float zonenAnteil(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return 1.0 - smoothstep(r * 0.72, r, length(pa - ba * h));
}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec3 c = diffuseColor.rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  float abzeichen = smoothstep(0.25, 0.55, l);           // weiße Blesse und Socken bleiben
  if (uFell == 1) {                                       // Fuchs: rotbraun, Langhaar wie das Fell
    float langhaar = 1.0 - smoothstep(0.01, 0.05, l);
    c = mix(c * vec3(1.25, 0.95, 0.72), vec3(0.32, 0.1, 0.035) * (0.7 + 6.0 * l), langhaar);
  } else if (uFell == 2) {                                // Rappe: fast schwarz
    c = mix(vec3(0.007, 0.0065, 0.006) + vec3(l) * 0.25, c, abzeichen);
  } else if (uFell == 3) {                                // Schimmel: hellgrau bis weiß
    c = vec3(0.5, 0.5, 0.48) + vec3(1.6) * l;
    c = min(c, vec3(0.92, 0.91, 0.88));
  } else if (uFell == ${MUSKEL_MODUS}) {                  // Muskeln: rot, Form aus der Fell-Textur
    c = vec3(0.5, 0.045, 0.032) * (0.5 + 5.0 * min(l, 0.1));
    float faser = sin((vZone.y * 0.55 + vZone.z * 0.85 + vZone.x * 0.3) * 190.0);
    c *= 0.86 + 0.14 * faser;
  }
  diffuseColor.rgb = c;
}
// Zonen einfärben (Grundfarbe) und etwas leuchten lassen
vec3 zonenFarbe = vec3(0.0);
float zonenSumme = 0.0;
for (int i = 0; i < ${ZONEN_MAX}; i++) {
  if (i >= uZahl) break;
  float f = uFarbe[i].a * zonenAnteil(vZone, uA[i], uB[i].xyz, uB[i].w);
  zonenFarbe += uFarbe[i].rgb * f;
  zonenSumme += f;
}
if (zonenSumme > 0.0) diffuseColor.rgb = mix(diffuseColor.rgb, zonenFarbe / zonenSumme, clamp(zonenSumme, 0.0, 1.0) * 0.8);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += zonenFarbe * 0.3;`);
  };
  material.customProgramCacheKey = () => 'pferd-zonen';
  return u;
}

function schreibeZonen(u, eintraege) {
  let n = 0;
  for (const { kapseln, farbe, staerke } of eintraege) {
    for (const k of kapseln) {
      if (n >= ZONEN_MAX) break;
      u.uA.value[n].copy(k.a);
      u.uB.value[n].set(k.b.x, k.b.y, k.b.z, k.r);
      u.uFarbe.value[n].set(farbe.r, farbe.g, farbe.b, staerke);
      n++;
    }
  }
  u.uZahl.value = n;
}

// ---------- Boden ----------
function baueBoden() {
  const g = new THREE.Group();
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const k = c.getContext('2d');
  const verlauf = k.createRadialGradient(64, 64, 0, 64, 64, 64);
  verlauf.addColorStop(0, 'rgba(0,0,0,0.4)');
  verlauf.addColorStop(1, 'rgba(0,0,0,0)');
  k.fillStyle = verlauf;
  k.fillRect(0, 0, 128, 128);
  const schatten = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 1.1),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  schatten.rotation.x = -Math.PI / 2;
  schatten.position.set(0.3, 0.003, 0);
  schatten.raycast = () => {};
  g.add(schatten);
  const wiese = new THREE.Mesh(new THREE.CircleGeometry(2.4, 64), new THREE.MeshStandardMaterial({ color: 0x8fcf6b, roughness: 1 }));
  wiese.rotation.x = -Math.PI / 2;
  wiese.position.x = 0.3;
  wiese.raycast = () => {};
  g.add(wiese);
  return g;
}

// ---------- Laden ----------
export async function ladePferd(fortschritt = () => {}) {
  const lader = new GLTFLoader();
  const geladen = { pferd: 0, skelett: 0 };
  const melde = () => fortschritt((geladen.pferd * 5.6 + geladen.skelett * 1.9) / 7.5);
  const lade = (datei, schluessel) => lader.loadAsync(datei, (e) => {
    if (e.total) { geladen[schluessel] = e.loaded / e.total; melde(); }
  });
  const [pferdGltf, skelettGltf] = await Promise.all([lade('modelle/pferd.glb', 'pferd'), lade('modelle/skelett.glb', 'skelett')]);

  let pferdMeshes = [];
  pferdGltf.scene.traverse((o) => { if (o.isMesh) pferdMeshes.push(o); });
  let skelettMeshes = [];
  skelettGltf.scene.traverse((o) => { if (o.isMesh) skelettMeshes.push(o); });

  // Außen: Original-Material (Farb- und Normal-Textur), Fellfarbe per Shader
  const vorlage = pferdMeshes[0].material;
  const aussenMat = new THREE.MeshStandardMaterial({ map: vorlage.map, normalMap: vorlage.normalMap, roughness: 0.82, metalness: 0 });
  const uAussen = zonenMaterial(aussenMat, 0);
  const muskelMat = new THREE.MeshStandardMaterial({ map: vorlage.map, normalMap: vorlage.normalMap, roughness: 0.42, metalness: 0 });
  muskelMat.normalScale.set(1.3, 1.3);
  const uMuskel = zonenMaterial(muskelMat, MUSKEL_MODUS);
  const knochenMat = new THREE.MeshStandardMaterial({ color: 0xf1e7d0, roughness: 0.6, metalness: 0 });
  const uKnochen = zonenMaterial(knochenMat, -1);

  const schicht = (meshes, material) => {
    const aussenGruppe = new THREE.Group();
    aussenGruppe.rotation.y = Math.PI / 2; // Modell schaut nach +z, die App erwartet +x
    const innen = new THREE.Group();
    aussenGruppe.add(innen);
    for (const m of meshes) innen.add(new THREE.Mesh(m.geometry, material));
    return { aussenGruppe, innen };
  };
  const aussen = schicht(pferdMeshes, aussenMat);
  const muskeln = schicht(pferdMeshes, muskelMat);
  const skelett = schicht(skelettMeshes, knochenMat);
  // Das Skelett-Modell ist kleiner und kürzer: an die Pferdegröße anpassen (Hufe auf gleiche Höhe)
  skelett.innen.scale.setScalar(1.15);
  skelett.innen.position.z = 0.21;

  const ebenen = {
    aussen: { gruppe: aussen.aussenGruppe, zonen: ZONEN_PFERD, uniforms: uAussen, ersatz: 'koerper' },
    muskeln: { gruppe: muskeln.aussenGruppe, zonen: ZONEN_MUSKELN, uniforms: uMuskel, ersatz: 'muskel' },
    skelett: { gruppe: skelett.aussenGruppe, zonen: ZONEN_SKELETT, uniforms: uKnochen, ersatz: 'knochen' },
  };
  const MUSKEL_GRUND = new THREE.Color(0xff8a70);

  return {
    gruppen: { aussen: aussen.aussenGruppe, muskeln: muskeln.aussenGruppe, skelett: skelett.aussenGruppe },
    boden: baueBoden(),
    schweife: [],
    alleTeile: () => [...ZONEN_PFERD, ...ZONEN_MUSKELN, ...ZONEN_SKELETT].filter((z) => z.teilId).map((z) => z.teilId),

    // Treffer (aus dem Raycaster) → { teilId } oder { neben }
    teilAn(ebene, treffer) {
      const e = ebenen[ebene];
      const p = treffer.object.worldToLocal(treffer.point.clone());
      for (const z of e.zonen) {
        if (z.kapseln.some((k) => liegtIn(k, p))) return z.teilId ? { teilId: z.teilId } : { neben: z.neben };
      }
      return { neben: e.ersatz };
    },

    // Ein Punkt im Teil (Weltkoordinaten), z. B. für Tests
    punktVon(ebene, teilId) {
      const e = ebenen[ebene];
      const z = e.zonen.find((x) => x.teilId === teilId);
      if (!z) return null;
      const k = z.kapseln[0];
      const innen = e.gruppe.children[0];
      innen.updateMatrixWorld(true);
      return innen.localToWorld(k.a.clone().add(k.b).multiplyScalar(0.5));
    },

    // leuchten: Map teilId → { farbe (hex), staerke }
    zeigeLeuchten(ebene, leuchten) {
      const e = ebenen[ebene];
      const eintraege = [];
      for (const [id, l] of leuchten) {
        const z = e.zonen.find((x) => x.teilId === id);
        if (z) eintraege.push({ kapseln: z.kapseln, farbe: new THREE.Color(l.farbe), staerke: l.staerke });
      }
      if (ebene === 'muskeln') {
        // Die antippbaren Muskeln sind immer etwas heller
        for (const z of ZONEN_MUSKELN) if (!leuchten.has(z.teilId)) eintraege.push({ kapseln: z.kapseln, farbe: MUSKEL_GRUND, staerke: 0.3 });
      }
      schreibeZonen(e.uniforms, eintraege);
    },

    setzeFell(schluessel) {
      uAussen.uFell.value = (FELLFARBEN[schluessel] || FELLFARBEN.brauner).modus;
    },
  };
}
