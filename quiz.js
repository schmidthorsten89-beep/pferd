// Quiz-Ablauf ohne Oberfläche: 5 zufällige Teile einer Schicht, beliebig viele Versuche,
// ab dem 3. Fehlversuch hilft die App (das richtige Teil blinkt).

export const FRAGEN_PRO_RUNDE = 5;
export const FEHLER_BIS_HILFE = 3;

export function neuesQuiz(teilIds, anzahl = FRAGEN_PRO_RUNDE, zufall = Math.random) {
  const gemischt = [...teilIds];
  for (let i = gemischt.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [gemischt[i], gemischt[j]] = [gemischt[j], gemischt[i]];
  }
  return { fragen: gemischt.slice(0, Math.min(anzahl, gemischt.length)), index: 0, fehler: 0, fehlerGesamt: 0 };
}

export function aktuellesTeil(quiz) {
  return quiz.fragen[quiz.index];
}

export function istFertig(quiz) {
  return quiz.index >= quiz.fragen.length;
}

// teilId: angetipptes Teil (oder null für ein Nebenteil). Ändert das Quiz und liefert das Ergebnis.
export function antworte(quiz, teilId) {
  if (istFertig(quiz)) return { ergebnis: 'fertig' };
  if (teilId === aktuellesTeil(quiz)) {
    quiz.index++;
    quiz.fehler = 0;
    return { ergebnis: 'richtig', fertig: istFertig(quiz) };
  }
  quiz.fehler++;
  quiz.fehlerGesamt++;
  return { ergebnis: quiz.fehler >= FEHLER_BIS_HILFE ? 'hilfe' : 'falsch' };
}

export function sterne(quiz) {
  if (quiz.fehlerGesamt <= 2) return 3;
  if (quiz.fehlerGesamt <= 6) return 2;
  return 1;
}
