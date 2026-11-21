// Alle anklickbaren Teile des Pferdes, sortiert nach Schicht.
// name: Überschrift auf der Karte, text: wird vorgelesen, fakt: „Wusstest du?“, frage: für das Quiz.

export const SCHICHTEN = [
  { id: 'aussen', name: 'Außen', symbol: '🐴' },
  { id: 'muskeln', name: 'Muskeln', symbol: '💪' },
  { id: 'skelett', name: 'Skelett', symbol: '🦴' },
];

export const TEILE = {
  // ---------- Außen ----------
  maehne: {
    schicht: 'aussen', name: 'Mähne', frage: 'Wo ist die Mähne?',
    text: 'Die Mähne sind die langen Haare oben am Hals. Sie schützt den Hals vor Regen, Kälte und Fliegen.',
    fakt: 'Für Turniere bekommen manche Pferde viele kleine Zöpfe in die Mähne geflochten.',
  },
  schweif: {
    schicht: 'aussen', name: 'Schweif', frage: 'Wo ist der Schweif?',
    text: 'Der Schweif ist der Pferdeschwanz mit den langen Haaren. Damit verscheucht das Pferd lästige Fliegen.',
    fakt: 'Am Schweif sieht man, wie sich ein Pferd fühlt: Schlägt es wild damit, ist es oft genervt.',
  },
  ohren: {
    schicht: 'aussen', name: 'Ohren', frage: 'Wo sind die Ohren?',
    text: 'Pferde können jedes Ohr für sich in viele Richtungen drehen. So hören sie, was rundherum passiert.',
    fakt: 'Legt ein Pferd beide Ohren flach nach hinten, ist es wütend. Dann lieber Abstand halten!',
  },
  augen: {
    schicht: 'aussen', name: 'Augen', frage: 'Wo sind die Augen?',
    text: 'Die großen Augen sitzen an den Seiten vom Kopf. Damit sieht das Pferd fast alles rundherum, ohne den Kopf zu drehen.',
    fakt: 'Pferde haben mit die größten Augen von allen Tieren, die an Land leben.',
  },
  nuestern: {
    schicht: 'aussen', name: 'Nüstern', frage: 'Wo sind die Nüstern?',
    text: 'Die Nüstern sind die Nasenlöcher. Pferde atmen nur durch die Nase, nicht durch das Maul.',
    fakt: 'Pferde begrüßen sich, indem sie sich gegenseitig sanft in die Nüstern pusten.',
  },
  maul: {
    schicht: 'aussen', name: 'Maul', frage: 'Wo ist das Maul?',
    text: 'Mit dem Maul frisst das Pferd Gras und Heu. Mit den weichen Lippen sucht es sich die besten Halme aus.',
    fakt: 'In der Natur fressen Pferde bis zu 16 Stunden am Tag.',
  },
  schopf: {
    schicht: 'aussen', name: 'Schopf', frage: 'Wo ist der Schopf?',
    text: 'Der Schopf sind die Haare, die zwischen den Ohren nach vorne auf die Stirn fallen. Wie ein Pony-Haarschnitt!',
    fakt: 'Der Schopf schützt die Augen ein bisschen vor Sonne und Fliegen.',
  },
  hals: {
    schicht: 'aussen', name: 'Hals', frage: 'Wo ist der Hals?',
    text: 'Mit dem langen Hals kommt das Pferd mit dem Maul bis zum Gras auf dem Boden. Er hilft auch beim Gleichgewicht.',
    fakt: 'Im Hals hat ein Pferd genauso viele Knochen wie du: sieben Halswirbel.',
  },
  ruecken: {
    schicht: 'aussen', name: 'Rücken', frage: 'Wo ist der Rücken?',
    text: 'Auf dem Rücken liegt der Sattel, wenn jemand reitet. Dafür muss der Rücken stark sein.',
    fakt: 'Die höchste Stelle am Rücken, kurz hinter dem Hals, heißt Widerrist. Dort misst man, wie groß ein Pferd ist.',
  },
  bauch: {
    schicht: 'aussen', name: 'Bauch', frage: 'Wo ist der Bauch?',
    text: 'Im Bauch sind Magen und Darm. Dort wird das Futter verdaut.',
    fakt: 'Der Darm eines Pferdes ist ungefähr 25 bis 30 Meter lang. Das ist länger als zwei Busse hintereinander!',
  },
  hufe: {
    schicht: 'aussen', name: 'Hufe', frage: 'Wo sind die Hufe?',
    text: 'Die Hufe sind die Füße des Pferdes. Sie sind aus hartem Horn, so wie deine Fingernägel.',
    fakt: 'Hufe wachsen immer weiter. Darum kommt alle paar Wochen der Hufschmied und schneidet sie.',
  },

  // ---------- Muskeln ----------
  kaumuskel: {
    schicht: 'muskeln', name: 'Kaumuskel', frage: 'Wo ist der Kaumuskel?',
    text: 'Der Kaumuskel sitzt an der Backe. Mit ihm kaut das Pferd sein Futter ganz klein.',
    fakt: 'Für ein Kilo Heu kaut ein Pferd ungefähr dreitausend Mal!',
  },
  halsmuskel: {
    schicht: 'muskeln', name: 'Halsmuskel', frage: 'Wo ist der Halsmuskel?',
    text: 'Der Halsmuskel hebt und senkt den Kopf und bewegt den Hals nach links und rechts.',
    fakt: 'Ein Pferdekopf ist ungefähr so schwer wie ein Kind im Kindergarten. Den muss der Hals den ganzen Tag tragen!',
  },
  schultermuskel: {
    schicht: 'muskeln', name: 'Schultermuskel', frage: 'Wo ist der Schultermuskel?',
    text: 'Der Schultermuskel bewegt das Vorderbein nach vorne und nach hinten.',
    fakt: 'Die Vorderbeine tragen mehr als die Hälfte vom Gewicht des Pferdes. Darum braucht die Schulter starke Muskeln.',
  },
  rueckenmuskel: {
    schicht: 'muskeln', name: 'Rückenmuskel', frage: 'Wo ist der Rückenmuskel?',
    text: 'Der lange Rückenmuskel geht vom Widerrist bis zur Kruppe. Er trägt den Reiter und hilft beim Springen.',
    fakt: 'Er ist einer der längsten Muskeln im ganzen Pferdekörper.',
  },
  bauchmuskel: {
    schicht: 'muskeln', name: 'Bauchmuskel', frage: 'Wo ist der Bauchmuskel?',
    text: 'Die Bauchmuskeln halten den Bauch zusammen wie ein breiter Gürtel. Sie helfen auch beim Atmen.',
    fakt: 'Wenn ein Pferd hustet oder kräftig ausatmet, sieht man die Bauchmuskeln arbeiten.',
  },
  kruppenmuskel: {
    schicht: 'muskeln', name: 'Kruppenmuskel', frage: 'Wo ist der Kruppenmuskel?',
    text: 'Der Kruppenmuskel ist der große, runde Muskel am Po. Er ist der Motor des Pferdes.',
    fakt: 'Mit diesem Muskel schiebt sich das Pferd kräftig nach vorne, wenn es galoppiert oder springt.',
  },
  oberschenkelmuskel: {
    schicht: 'muskeln', name: 'Oberschenkelmuskel', frage: 'Wo ist der Oberschenkelmuskel?',
    text: 'Der Oberschenkelmuskel liegt am Hinterbein. Er streckt das Bein und gibt Kraft beim Rennen.',
    fakt: 'Im Galopp kann ein Pferd so schnell laufen wie ein Auto in der Stadt: etwa 50 Kilometer pro Stunde.',
  },
  unterarmmuskel: {
    schicht: 'muskeln', name: 'Unterarmmuskel', frage: 'Wo ist der Unterarmmuskel?',
    text: 'Der Unterarmmuskel sitzt oben am Vorderbein. Er beugt und streckt das Bein.',
    fakt: 'Unten am Bein haben Pferde gar keine Muskeln, nur Sehnen. Darum sind die Beine dort so dünn.',
  },

  // ---------- Skelett ----------
  schaedel: {
    schicht: 'skelett', name: 'Schädel', frage: 'Wo ist der Schädel?',
    text: 'Der Schädel ist der Kopfknochen. Er schützt das Gehirn und die Augen und hält die Zähne fest.',
    fakt: 'Ein erwachsenes Pferd hat 36 bis 44 Zähne.',
  },
  halswirbel: {
    schicht: 'skelett', name: 'Halswirbel', frage: 'Wo sind die Halswirbel?',
    text: 'Die Halswirbel sind die Knochen im Hals. Sie sind aufgereiht wie Perlen an einer Kette.',
    fakt: 'Ein Pferd hat sieben Halswirbel. Genauso viele wie du und sogar wie eine Giraffe!',
  },
  wirbelsaeule: {
    schicht: 'skelett', name: 'Wirbelsäule', frage: 'Wo ist die Wirbelsäule?',
    text: 'Die Wirbelsäule ist das Rückgrat. Sie geht vom Hals über den Rücken bis in den Schweif.',
    fakt: 'Sogar im Schweif sind Knochen: ungefähr achtzehn kleine Schweifwirbel.',
  },
  rippen: {
    schicht: 'skelett', name: 'Rippen', frage: 'Wo sind die Rippen?',
    text: 'Die Rippen sind wie ein Käfig um Herz und Lunge. Sie schützen diese wichtigen Organe.',
    fakt: 'Ein Pferd hat 18 Rippen auf jeder Seite. Du hast nur 12.',
  },
  schulterblatt: {
    schicht: 'skelett', name: 'Schulterblatt', frage: 'Wo ist das Schulterblatt?',
    text: 'Das Schulterblatt ist ein großer, flacher Knochen an der Schulter. Daran hängt das Vorderbein.',
    fakt: 'Pferde haben kein Schlüsselbein. Das Schulterblatt wird nur von Muskeln am Körper gehalten.',
  },
  becken: {
    schicht: 'skelett', name: 'Becken', frage: 'Wo ist das Becken?',
    text: 'Das Becken ist ein großer Knochen hinten am Körper. Dort sind die Hinterbeine festgemacht.',
    fakt: 'Die Hinterbeine schieben das Pferd an. Das Becken gibt diese Kraft an den ganzen Körper weiter.',
  },
  oberschenkelknochen: {
    schicht: 'skelett', name: 'Oberschenkelknochen', frage: 'Wo ist der Oberschenkelknochen?',
    text: 'Der Oberschenkelknochen ist der dickste Knochen im Hinterbein. Er ist sehr stark.',
    fakt: 'Das Knie vom Pferd sitzt viel weiter oben, als man denkt: ganz nah am Bauch!',
  },
  roehrbein: {
    schicht: 'skelett', name: 'Röhrbein', frage: 'Wo ist das Röhrbein?',
    text: 'Das Röhrbein ist der lange, gerade Knochen unten am Bein. Es sieht aus wie eine Röhre.',
    fakt: 'Was am Vorderbein wie ein Knie aussieht, ist eigentlich das Handgelenk des Pferdes!',
  },
  hufbein: {
    schicht: 'skelett', name: 'Hufbein', frage: 'Wo ist das Hufbein?',
    text: 'Das Hufbein ist der unterste Knochen. Es steckt ganz unten im Huf.',
    fakt: 'Ein Pferd läuft eigentlich auf Zehenspitzen, und zwar auf nur einem einzigen Zeh pro Bein!',
  },
};

// Teile, die man sieht, die aber keine eigene Karte haben. Beim Antippen gibt es nur einen kurzen Hinweis.
export const NEBENTEILE = {
  kopf: 'Das ist der Kopf.',
  bein: 'Das ist ein Bein.',
  brust: 'Das ist die Brust.',
  po: 'Das ist der Po vom Pferd.',
  muskel: 'Das sind auch Muskeln. Tippe auf einen hellen Muskel!',
  knochen: 'Das ist auch ein Knochen. Tippe auf einen anderen!',
};

export function teileDerSchicht(schicht) {
  return Object.keys(TEILE).filter((id) => TEILE[id].schicht === schicht);
}
