import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { ladePferd, FELLFARBEN } from './modell-echt.js';
import { SCHICHTEN, TEILE, NEBENTEILE, teileDerSchicht } from './teile.js';
import { neuesQuiz, aktuellesTeil, antworte, sterne, FRAGEN_PRO_RUNDE } from './quiz.js';

// ---------- Einstellungen merken ----------
const speicher = {
  lies(schluessel, standard) {
    try { const w = localStorage.getItem('pferd.' + schluessel); return w === null ? standard : JSON.parse(w); } catch { return standard; }
  },
  schreib(schluessel, wert) {
    try { localStorage.setItem('pferd.' + schluessel, JSON.stringify(wert)); } catch { /* egal */ }
  },
};

const zustand = {
  schicht: 'aussen',
  modus: 'entdecken',
  ton: speicher.lies('ton', true),
  fell: speicher.lies('fell', 'brauner'),
  quiz: null,
  quizSperre: false,
  nutzerHatGedreht: false,
};
if (!FELLFARBEN[zustand.fell]) zustand.fell = 'brauner';

const $ = (sel) => document.querySelector(sel);
const leinwand = $('#buehne');
const karte = $('#karte');
const hinweis = $('#hinweis');

// ---------- 3D-Szene ----------
const renderer = new THREE.WebGLRenderer({ canvas: leinwand, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const szene = new THREE.Scene();
const kamera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
const ZIEL = new THREE.Vector3(0.3, 1.03, 0);
const BLICK = new THREE.Vector3(0.35, 0.2, 1).normalize();

szene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a60, 1.9));
const sonne = new THREE.DirectionalLight(0xffffff, 1.8);
sonne.position.set(3, 5, 4);
szene.add(sonne);
const gegenlicht = new THREE.DirectionalLight(0xdfe8ff, 0.7);
gegenlicht.position.set(-3, 2, -4);
szene.add(gegenlicht);

karte.innerHTML = '<div class="kopf"><h2>Das Pferd kommt gleich … 🐴</h2></div><p class="leise" id="ladestand">Wird geladen …</p>';
let modell;
try {
  modell = await ladePferd((anteil) => {
    const p = document.getElementById('ladestand');
    if (p) p.textContent = `Wird geladen … ${Math.round(anteil * 100)} %`;
  });
} catch (fehler) {
  karte.innerHTML = '<div class="kopf"><h2>Das Pferd konnte nicht laden 😢</h2></div><p class="leise">Bitte prüfe die Internetverbindung und lade die Seite neu.</p>';
  throw fehler;
}
szene.add(modell.boden);
for (const g of Object.values(modell.gruppen)) szene.add(g);
modell.setzeFell(zustand.fell);

const steuerung = new OrbitControls(kamera, leinwand);
steuerung.target.copy(ZIEL);
steuerung.enableDamping = true;
steuerung.dampingFactor = 0.1;
steuerung.enablePan = false;
steuerung.minDistance = 2;
steuerung.maxDistance = 16;
steuerung.maxPolarAngle = Math.PI * 0.62;
steuerung.addEventListener('start', () => { zustand.nutzerHatGedreht = true; });

// Freie Fläche zwischen Kopfleiste, Karte und Schicht-Knöpfen: dort soll das Pferd stehen.
function freieFlaeche() {
  const B = window.innerWidth;
  const H = window.innerHeight;
  const oben = $('.kopfleiste').getBoundingClientRect().bottom + 8;
  const schichten = $('.schichten').getBoundingClientRect();
  const quer = window.matchMedia('(orientation: landscape) and (max-height: 520px)').matches;
  if (quer) {
    const rechts = Math.min(B, karte.getBoundingClientRect().left || B) - 8;
    return { links: 0, rechts, oben, unten: schichten.top - 8, B, H };
  }
  // Platz für eine typische Karte freihalten, damit das Pferd nicht bei jedem Teil springt
  const unten = schichten.top - Math.min(235, H * 0.32);
  const links = listeFest() ? $('#teileliste').getBoundingClientRect().right + 8 : 0;
  return { links, rechts: B, oben, unten, B, H };
}

function passeKameraAn(abstandNeu) {
  const f = freieFlaeche();
  kamera.aspect = f.B / f.H;
  const mitteX = (f.links + f.rechts) / 2;
  const mitteY = (f.oben + f.unten) / 2;
  kamera.setViewOffset(f.B, f.H, f.B / 2 - mitteX, f.H / 2 - mitteY, f.B, f.H);
  kamera.updateProjectionMatrix();
  if (abstandNeu) {
    const tan = Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2));
    const breite = Math.max(f.rechts - f.links, 120);
    const hoehe = Math.max(f.unten - f.oben, 120);
    const abstand = Math.max((2.7 * f.H) / (2 * tan * breite), (2.25 * f.H) / (2 * tan * hoehe));
    kamera.position.copy(ZIEL).addScaledVector(BLICK, THREE.MathUtils.clamp(abstand, 3, 15));
    steuerung.target.copy(ZIEL);
    steuerung.update();
  }
}

function groesseAnpassen() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  passeKameraAn(!zustand.nutzerHatGedreht);
}
window.addEventListener('resize', groesseAnpassen);

// ---------- Aufleuchten ----------
const GELB = 0xffc400;
const GRUEN = 0x2fe070;
const ROT = 0xff3b2f;
const leuchten = new Map(); // teilId → { farbe, blinken, bis }

function setzeLeuchten(teilId, farbe, { blinken = false, dauer = 0 } = {}) {
  leuchten.set(teilId, { farbe, blinken, bis: dauer ? performance.now() + dauer : 0 });
}

function leuchtenAktualisieren(jetzt) {
  for (const [id, l] of leuchten) if (l.bis && jetzt > l.bis) leuchten.delete(id);
  const anzeigen = new Map();
  for (const [id, l] of leuchten) {
    anzeigen.set(id, { farbe: l.farbe, staerke: l.blinken ? 0.1 + 0.8 * (0.5 + 0.5 * Math.sin(jetzt / 120)) : 0.75 });
  }
  modell.zeigeLeuchten(zustand.schicht, anzeigen);
}

// ---------- Vorlesen ----------
let stimme = null;
function waehleStimme() {
  if (!('speechSynthesis' in window)) return;
  const alle = speechSynthesis.getVoices();
  const deutsch = alle.filter((v) => /^de([-_]|$)/i.test(v.lang));
  stimme = deutsch.find((v) => /google/i.test(v.name)) || deutsch.find((v) => v.localService) || deutsch[0] || null;
}
if ('speechSynthesis' in window) {
  waehleStimme();
  speechSynthesis.addEventListener?.('voiceschanged', waehleStimme);
}

function sprich(text) {
  if (!zustand.ton || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  // Chrome auf Android verschluckt manchmal ein speak() direkt nach cancel()
  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    if (stimme) u.voice = stimme;
    u.rate = 0.95;
    u.pitch = 1.1;
    speechSynthesis.speak(u);
  }, 60);
}

// ---------- Kurzer Hinweis ----------
let hinweisTimer = 0;
function zeigeHinweis(text, sprechen = true) {
  hinweis.textContent = text;
  hinweis.hidden = false;
  clearTimeout(hinweisTimer);
  hinweisTimer = setTimeout(() => { hinweis.hidden = true; }, 2400);
  if (sprechen) sprich(text);
}

// ---------- Karte: Entdecken ----------
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s).replace(/[&<>"]/g, (z) => ESC[z]);

const STARTTEXT = {
  aussen: ['Tippe auf das Pferd! 👆', 'Mit einem Finger drehst du das Pferd. Mit zwei Fingern machst du es größer oder kleiner.'],
  muskeln: ['Tippe auf einen hellen Muskel! 💪', 'Muskeln bewegen das Pferd. Die hellen Muskeln kannst du antippen.'],
  skelett: ['Tippe auf einen Knochen! 🦴', 'Das Skelett hält das Pferd zusammen. Tippe auf die Knochen.'],
};

function zeigeStartkarte() {
  const [titel, text] = STARTTEXT[zustand.schicht];
  karte.innerHTML = `<div class="kopf"><h2>${esc(titel)}</h2></div><p class="leise">${esc(text)}</p>${QUELLEN}`;
}

// Die 3D-Modelle stehen unter CC BY 4.0 und verlangen eine Namensnennung.
const QUELLEN = `<p class="quellen">3D-Modelle:
  <a href="https://sketchfab.com/3d-models/horse-2f4639623e684c44acb68922585d7a09" target="_blank" rel="noopener">„Horse“</a> von victorberdugo1,
  <a href="https://sketchfab.com/3d-models/horse-skeleton-e31cac68387d4d8e9d4eccdbc319ceab" target="_blank" rel="noopener">„Horse Skeleton“</a> von SA Anatomy,
  angepasst, Lizenz <a href="https://creativecommons.org/licenses/by/4.0/deed.de" target="_blank" rel="noopener">CC BY 4.0</a></p>`;

function zeigeTeil(id) {
  const teil = TEILE[id];
  leuchten.clear();
  setzeLeuchten(id, GELB);
  zustand.ausgewaehlt = id;
  const alleSchonDa = teileDerSchicht(teil.schicht).every((t) => entdeckt.has(t));
  entdeckt.add(id);
  speicher.schreib('entdeckt', [...entdeckt]);
  const jetztAlle = !alleSchonDa && teileDerSchicht(teil.schicht).every((t) => entdeckt.has(t));
  baueListe();
  karte.innerHTML = `
    <div class="kopf">
      <h2>${esc(teil.name)}</h2>
      <button class="klein-rund" id="nochmal-hoeren" type="button" aria-label="Nochmal vorlesen">🔊</button>
    </div>
    <p>${esc(teil.text)}</p>
    <button class="fakt-knopf" id="fakt-knopf" type="button">💡 Wusstest du?</button>`;
  $('#nochmal-hoeren').addEventListener('click', () => sprich(`${teil.name}. ${teil.text}`));
  $('#fakt-knopf').addEventListener('click', (e) => {
    const p = document.createElement('p');
    p.className = 'fakt';
    p.textContent = '💡 ' + teil.fakt;
    e.currentTarget.replaceWith(p);
    sprich(teil.fakt);
  });
  if (jetztAlle) {
    const lob = `Super! Du hast ${ALLE_ENTDECKT[teil.schicht]} entdeckt!`;
    zeigeHinweis('🎉 ' + lob, false);
    sprich(`${teil.name}. ${teil.text} ${lob}`);
  } else {
    sprich(`${teil.name}. ${teil.text}`);
  }
}

// ---------- Teile-Liste an der Seite ----------
const ALLE_ENTDECKT = { aussen: 'alle Teile außen', muskeln: 'alle Muskeln', skelett: 'alle Knochen' };
const entdeckt = new Set(speicher.lies('entdeckt', []));
const LISTE_FEST = window.matchMedia('(min-width: 900px) and (min-height: 560px)');
const listeFest = () => LISTE_FEST.matches && zustand.modus !== 'quiz';
const teileliste = $('#teileliste');

function baueListe() {
  const ids = teileDerSchicht(zustand.schicht).sort((a, b) => TEILE[a].name.localeCompare(TEILE[b].name, 'de'));
  const schicht = SCHICHTEN.find((s) => s.id === zustand.schicht);
  $('#liste-titel').textContent = `${schicht.symbol} ${schicht.name}`;
  $('#liste-zaehler').textContent = `${ids.filter((id) => entdeckt.has(id)).length} von ${ids.length} entdeckt`;
  $('#liste').innerHTML = ids.map((id) => {
    const ja = entdeckt.has(id);
    return `<li><button type="button" data-teil="${id}" class="${id === zustand.ausgewaehlt ? 'aktiv' : ''}"${id === zustand.ausgewaehlt ? ' aria-current="true"' : ''}>
      <span class="haken${ja ? ' ja' : ''}" aria-hidden="true">${ja ? '✓' : ''}</span>${esc(TEILE[id].name)}${ja ? '<span class="sr">(entdeckt)</span>' : ''}
    </button></li>`;
  }).join('');
}

function oeffneListe() {
  teileliste.classList.add('offen');
  $('#teile-lasche').setAttribute('aria-expanded', 'true');
}
function schliesseListe() {
  teileliste.classList.remove('offen');
  $('#teile-lasche').setAttribute('aria-expanded', 'false');
}

$('#liste').addEventListener('click', (e) => {
  const knopf = e.target.closest('[data-teil]');
  if (!knopf) return;
  zeigeTeil(knopf.dataset.teil);
  if (!LISTE_FEST.matches) schliesseListe();
});
$('#teile-lasche').addEventListener('click', () => {
  schliesseFarbwahl();
  if (teileliste.classList.contains('offen')) schliesseListe(); else oeffneListe();
});
$('#liste-zu').addEventListener('click', schliesseListe);
$('#haken-weg').addEventListener('click', () => {
  for (const id of teileDerSchicht(zustand.schicht)) entdeckt.delete(id);
  speicher.schreib('entdeckt', [...entdeckt]);
  baueListe();
});
LISTE_FEST.addEventListener?.('change', () => { schliesseListe(); groesseAnpassen(); });

// ---------- Karte: Quiz ----------
function fortschrittHtml() {
  const q = zustand.quiz;
  return `<div class="fortschritt" aria-label="Frage ${q.index + 1} von ${q.fragen.length}">${
    q.fragen.map((_, i) => `<span class="${i < q.index ? 'erledigt' : i === q.index ? 'jetzt' : ''}"></span>`).join('')
  }</div>`;
}

function starteQuiz() {
  leuchten.clear();
  zustand.quiz = neuesQuiz(teileDerSchicht(zustand.schicht), FRAGEN_PRO_RUNDE);
  zustand.quizSperre = false;
  stelleFrage();
}

function stelleFrage() {
  const teil = TEILE[aktuellesTeil(zustand.quiz)];
  karte.innerHTML = `
    ${fortschrittHtml()}
    <div class="kopf">
      <h2>${esc(teil.frage)}</h2>
      <button class="klein-rund" id="frage-hoeren" type="button" aria-label="Frage nochmal vorlesen">🔊</button>
    </div>
    <p class="rueckmeldung leise" id="rueckmeldung">Tippe auf das richtige Teil.</p>`;
  $('#frage-hoeren').addEventListener('click', () => sprich(teil.frage));
  sprich(teil.frage);
}

function quizAntwort(ziel) {
  if (zustand.quizSperre) return;
  const q = zustand.quiz;
  const gesucht = aktuellesTeil(q);
  const getippt = ziel.teilId || null;
  const { ergebnis, fertig } = antworte(q, getippt);
  const rueck = $('#rueckmeldung');

  if (ergebnis === 'richtig') {
    leuchten.clear();
    setzeLeuchten(gesucht, GRUEN);
    rueck.className = 'rueckmeldung gut';
    rueck.textContent = `Super! 🎉 Richtig: ${TEILE[gesucht].name}`;
    sprich('Super, richtig!');
    zustand.quizSperre = true;
    setTimeout(() => {
      zustand.quizSperre = false;
      leuchten.clear();
      if (zustand.modus !== 'quiz' || zustand.quiz !== q) return;
      if (fertig) zeigeQuizEnde(); else stelleFrage();
    }, 1700);
    return;
  }

  let text = getippt ? `Das ist: ${TEILE[getippt].name}. Versuch’s nochmal!` : 'Fast! Versuch’s nochmal!';
  if (getippt) setzeLeuchten(getippt, ROT, { dauer: 700 });
  if (ergebnis === 'hilfe') {
    setzeLeuchten(gesucht, GELB, { blinken: true });
    text += ' Schau mal, es blinkt!';
  }
  rueck.className = 'rueckmeldung nochmal';
  rueck.textContent = text;
  sprich(text.replace('Das ist:', 'Das ist'));
}

function zeigeQuizEnde() {
  const anzahl = sterne(zustand.quiz);
  const woerter = ['', 'einen Stern', 'zwei Sterne', 'drei Sterne'];
  karte.innerHTML = `
    <div class="kopf"><h2>Geschafft! 🎉</h2></div>
    <div class="sterne" aria-label="${anzahl} von 3 Sternen">${
      [1, 2, 3].map((i) => `<span class="${i <= anzahl ? '' : 'leer'}">⭐</span>`).join('')
    }</div>
    <p>Du hast ${woerter[anzahl]} bekommen.</p>
    <button class="gross-knopf" id="quiz-nochmal" type="button">🔁 Nochmal</button>
    <button class="gross-knopf zweit" id="quiz-entdecken" type="button">🔍 Entdecken</button>`;
  $('#quiz-nochmal').addEventListener('click', starteQuiz);
  $('#quiz-entdecken').addEventListener('click', () => setzeModus('entdecken'));
  sprich(`Geschafft! Du hast ${woerter[anzahl]} bekommen.`);
}

// ---------- Antippen ----------
const strahl = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function findeTeil(x, y) {
  const r = leinwand.getBoundingClientRect();
  ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  strahl.setFromCamera(ndc, kamera);
  const treffer = strahl.intersectObject(modell.gruppen[zustand.schicht], true)[0];
  return treffer ? modell.teilAn(zustand.schicht, treffer) : null;
}

function tippe(x, y) {
  schliesseFarbwahl();
  if (!LISTE_FEST.matches && teileliste.classList.contains('offen')) { schliesseListe(); return; }
  const ziel = findeTeil(x, y);
  if (!ziel) return;
  if (zustand.modus === 'quiz') { quizAntwort(ziel); return; }
  if (ziel.teilId) zeigeTeil(ziel.teilId);
  else zeigeHinweis(NEBENTEILE[ziel.neben]);
}

// Nur ein kurzes Tippen zählt, nicht das Drehen oder Zoomen
let tippKandidat = null;
const finger = new Set();
leinwand.addEventListener('pointerdown', (e) => {
  finger.add(e.pointerId);
  tippKandidat = finger.size === 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY } : null;
});
leinwand.addEventListener('pointermove', (e) => {
  if (tippKandidat && e.pointerId === tippKandidat.id && Math.hypot(e.clientX - tippKandidat.x, e.clientY - tippKandidat.y) > 10) tippKandidat = null;
});
leinwand.addEventListener('pointerup', (e) => {
  finger.delete(e.pointerId);
  if (tippKandidat && tippKandidat.id === e.pointerId) {
    tippKandidat = null;
    tippe(e.clientX, e.clientY);
  }
});
leinwand.addEventListener('pointercancel', (e) => { finger.delete(e.pointerId); tippKandidat = null; });

// ---------- Schichten und Modus ----------
function setzeSchicht(schicht) {
  zustand.schicht = schicht;
  for (const [id, g] of Object.entries(modell.gruppen)) g.visible = id === schicht;
  document.querySelectorAll('.schicht').forEach((k) => {
    const an = k.dataset.schicht === schicht;
    k.classList.toggle('aktiv', an);
    k.setAttribute('aria-pressed', String(an));
  });
  leuchten.clear();
  zustand.ausgewaehlt = null;
  baueListe();
  if (zustand.modus === 'quiz') starteQuiz();
  else {
    zeigeStartkarte();
    sprich(SCHICHTEN.find((s) => s.id === schicht).name);
  }
}

function setzeModus(modus) {
  zustand.modus = modus;
  $('#modus-entdecken').classList.toggle('aktiv', modus === 'entdecken');
  $('#modus-quiz').classList.toggle('aktiv', modus === 'quiz');
  $('#modus-entdecken').setAttribute('aria-pressed', String(modus === 'entdecken'));
  $('#modus-quiz').setAttribute('aria-pressed', String(modus === 'quiz'));
  leuchten.clear();
  zustand.ausgewaehlt = null;
  document.body.classList.toggle('im-quiz', modus === 'quiz');
  schliesseListe();
  baueListe();
  passeKameraAn(false); // Im Quiz ist die Liste weg, das Pferd rückt in die Mitte
  if (modus === 'quiz') starteQuiz();
  else { zustand.quiz = null; zeigeStartkarte(); }
}

document.querySelectorAll('.schicht').forEach((k) => k.addEventListener('click', () => setzeSchicht(k.dataset.schicht)));
$('#modus-entdecken').addEventListener('click', () => setzeModus('entdecken'));
$('#modus-quiz').addEventListener('click', () => setzeModus('quiz'));

// ---------- Werkzeuge ----------
const farbwahl = $('#farbwahl');
function schliesseFarbwahl() {
  farbwahl.hidden = true;
  $('#knopf-farbe').setAttribute('aria-expanded', 'false');
}
function baueFarbwahl() {
  farbwahl.innerHTML = Object.entries(FELLFARBEN).map(([id, f]) => `
    <button class="farbe${id === zustand.fell ? ' aktiv' : ''}" data-fell="${id}" type="button">
      <span class="klecks" style="background:#${f.farbe.toString(16).padStart(6, '0')}"></span>${esc(f.name)}
    </button>`).join('');
  farbwahl.querySelectorAll('.farbe').forEach((k) => k.addEventListener('click', () => {
    zustand.fell = k.dataset.fell;
    speicher.schreib('fell', zustand.fell);
    modell.setzeFell(zustand.fell);
    baueFarbwahl();
    schliesseFarbwahl();
    sprich(FELLFARBEN[zustand.fell].name);
  }));
}
$('#knopf-farbe').addEventListener('click', () => {
  const auf = farbwahl.hidden;
  if (auf) baueFarbwahl();
  farbwahl.hidden = !auf;
  $('#knopf-farbe').setAttribute('aria-expanded', String(auf));
});

function zeigeTon() {
  const k = $('#knopf-ton');
  k.textContent = zustand.ton ? '🔊' : '🔇';
  k.classList.toggle('aus', !zustand.ton);
  k.setAttribute('aria-label', zustand.ton ? 'Vorlesen ausschalten' : 'Vorlesen einschalten');
}
$('#knopf-ton').addEventListener('click', () => {
  zustand.ton = !zustand.ton;
  speicher.schreib('ton', zustand.ton);
  if (!zustand.ton && 'speechSynthesis' in window) speechSynthesis.cancel();
  zeigeTon();
  if (zustand.ton) sprich('Vorlesen ist an.');
});

$('#knopf-zurueck').addEventListener('click', () => {
  zustand.nutzerHatGedreht = false;
  passeKameraAn(true);
});

// ---------- Los geht's ----------
zeigeTon();
document.body.classList.add('bereit');
setzeModus('entdecken');
for (const [id, g] of Object.entries(modell.gruppen)) g.visible = id === zustand.schicht;
groesseAnpassen();

renderer.setAnimationLoop(() => {
  leuchtenAktualisieren(performance.now());
  steuerung.update();
  renderer.render(szene, kamera);
});

// Für Tests im Browser
window.pferdApp = { modell, zustand, kamera, steuerung, findeTeil, tippe, setzeSchicht, setzeModus, leuchten, setzeLeuchten };

if ('serviceWorker' in navigator) {
  // Ist schon eine ältere Version aktiv, wird nach einem Update einmal neu geladen.
  const hatteVersion = Boolean(navigator.serviceWorker.controller);
  let neuGeladen = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hatteVersion || neuGeladen) return;
    neuGeladen = true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js').then((anmeldung) => {
    // Die installierte App bleibt oft im Hintergrund offen; beim Zurückholen nach Updates schauen.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') anmeldung.update().catch(() => {});
    });
  }).catch(() => {});
}
