/**
 * AETHERA Chord Dictionary
 * 70+ guitar chord definitions for chord detection.
 * Each entry: fret per string [string6, string5, string4, string3, string2, string1]
 * null = muted string, -1 = open string
 */

export type FretPosition = number | null; // null = muted
export type ChordFrets = [FretPosition, FretPosition, FretPosition, FretPosition, FretPosition, FretPosition];

export interface ChordDef {
  name: string;
  frets: ChordFrets;
}

export const CHORD_DICTIONARY: ChordDef[] = [
  // ── Open chords ─────────────────────────────────────────────────────────────
  { name: 'E',    frets: [0, 2, 2, 1, 0, 0] },
  { name: 'Em',   frets: [0, 2, 2, 0, 0, 0] },
  { name: 'E7',   frets: [0, 2, 0, 1, 0, 0] },
  { name: 'A',    frets: [null, 0, 2, 2, 2, 0] },
  { name: 'Am',   frets: [null, 0, 2, 2, 1, 0] },
  { name: 'A7',   frets: [null, 0, 2, 0, 2, 0] },
  { name: 'Asus2',frets: [null, 0, 2, 2, 0, 0] },
  { name: 'Asus4',frets: [null, 0, 2, 2, 3, 0] },
  { name: 'D',    frets: [null, null, 0, 2, 3, 2] },
  { name: 'Dm',   frets: [null, null, 0, 2, 3, 1] },
  { name: 'D7',   frets: [null, null, 0, 2, 1, 2] },
  { name: 'Dsus2',frets: [null, null, 0, 2, 3, 0] },
  { name: 'Dsus4',frets: [null, null, 0, 2, 3, 3] },
  { name: 'G',    frets: [3, 2, 0, 0, 0, 3] },
  { name: 'Gm',   frets: [3, 5, 5, 3, 3, 3] },
  { name: 'G7',   frets: [3, 2, 0, 0, 0, 1] },
  { name: 'C',    frets: [null, 3, 2, 0, 1, 0] },
  { name: 'Cm',   frets: [null, 3, 5, 5, 4, 3] },
  { name: 'C7',   frets: [null, 3, 2, 3, 1, 0] },
  { name: 'Cmaj7',frets: [null, 3, 2, 0, 0, 0] },
  { name: 'B',    frets: [null, 2, 4, 4, 4, 2] },
  { name: 'Bm',   frets: [null, 2, 4, 4, 3, 2] },
  { name: 'B7',   frets: [null, 2, 1, 2, 0, 2] },
  { name: 'F',    frets: [1, 1, 2, 3, 3, 1] },
  { name: 'Fm',   frets: [1, 1, 3, 3, 2, 1] },
  { name: 'F7',   frets: [1, 1, 2, 1, 3, 1] },
  { name: 'Fmaj7',frets: [null, null, 3, 2, 1, 0] },

  // ── Barre chords (A shape) ───────────────────────────────────────────────────
  { name: 'Ab',   frets: [4, 4, 6, 6, 6, 4] },
  { name: 'Abm',  frets: [4, 4, 6, 6, 5, 4] },
  { name: 'Bb',   frets: [null, 1, 3, 3, 3, 1] },
  { name: 'Bbm',  frets: [null, 1, 3, 3, 2, 1] },
  { name: 'Db',   frets: [null, 4, 6, 6, 6, 4] },
  { name: 'Dbm',  frets: [null, 4, 6, 6, 5, 4] },
  { name: 'Eb',   frets: [null, 6, 8, 8, 8, 6] },
  { name: 'Ebm',  frets: [null, 6, 8, 8, 7, 6] },
  { name: 'F#',   frets: [2, 4, 4, 3, 2, 2] },
  { name: 'F#m',  frets: [2, 4, 4, 2, 2, 2] },
  { name: 'G#',   frets: [4, 4, 6, 6, 6, 4] },
  { name: 'G#m',  frets: [4, 4, 6, 6, 5, 4] },

  // ── 7th chords ───────────────────────────────────────────────────────────────
  { name: 'Amaj7', frets: [null, 0, 2, 1, 2, 0] },
  { name: 'Dmaj7', frets: [null, null, 0, 2, 2, 2] },
  { name: 'Emaj7', frets: [0, 2, 1, 1, 0, 0] },
  { name: 'Gmaj7', frets: [3, 2, 0, 0, 0, 2] },

  // Minor 7ths
  { name: 'Am7',   frets: [null, 0, 2, 0, 1, 0] },
  { name: 'Em7',   frets: [0, 2, 2, 0, 3, 0] },
  { name: 'Dm7',   frets: [null, null, 0, 2, 1, 1] },
  { name: 'Bm7',   frets: [null, 2, 4, 2, 3, 2] },

  // Dominant 9ths
  { name: 'A9',    frets: [null, 0, 2, 4, 2, 3] },
  { name: 'D9',    frets: [null, null, 0, 2, 1, 0] },
  { name: 'E9',    frets: [0, 2, 0, 1, 3, 2] },
  { name: 'G9',    frets: [3, 0, 0, 0, 0, 1] },

  // ── Diminished / Augmented ───────────────────────────────────────────────────
  { name: 'Bdim',  frets: [null, 2, 3, 4, 3, 2] },
  { name: 'Edim',  frets: [0, 1, 2, 3, 2, 0] },
  { name: 'Adim',  frets: [null, 0, 1, 2, 1, 0] },
  { name: 'Eaug',  frets: [0, 3, 2, 1, 1, 0] },
  { name: 'Aaug',  frets: [null, 0, 3, 2, 2, 1] },
  { name: 'Caug',  frets: [null, 3, 2, 1, 1, 0] },

  // ── Sus chords ───────────────────────────────────────────────────────────────
  { name: 'Esus4', frets: [0, 2, 2, 2, 0, 0] },
  { name: 'Esus2', frets: [0, 2, 4, 4, 0, 0] },
  { name: 'Gsus4', frets: [3, 2, 0, 0, 1, 3] },
  { name: 'Csus2', frets: [null, 3, 5, 5, 3, 3] },
  { name: 'Csus4', frets: [null, 3, 3, 0, 1, 1] },

  // ── Power chords (5) ─────────────────────────────────────────────────────────
  { name: 'E5',    frets: [0, 2, 2, null, null, null] },
  { name: 'A5',    frets: [null, 0, 2, 2, null, null] },
  { name: 'D5',    frets: [null, null, 0, 2, 3, null] },
  { name: 'G5',    frets: [3, 5, 5, null, null, null] },
  { name: 'B5',    frets: [null, 2, 4, 4, null, null] },
  { name: 'F5',    frets: [1, 3, 3, null, null, null] },
  { name: 'C5',    frets: [null, 3, 5, 5, null, null] },
];

/**
 * Detect the chord closest to the given fret pattern.
 * Uses a weighted distance metric favoring null (muted) matches.
 * Returns null if no reasonable match is found (score > threshold).
 */
export function detectChord(frets: (number | null)[]): string | null {
  // Need at least 2 non-null/non-zero frets to attempt detection
  const activeFrets = frets.filter((f) => f !== null && f !== 0);
  if (activeFrets.length < 2) return null;

  let bestMatch: ChordDef | null = null;
  let bestScore = Infinity;

  for (const chord of CHORD_DICTIONARY) {
    let score = 0;
    for (let s = 0; s < 6; s++) {
      const actual = frets[s] ?? null;
      const expected = chord.frets[s];

      if (actual === null && expected === null) continue; // both muted, perfect
      if (actual === null && expected !== null) { score += 1; continue; }
      if (actual !== null && expected === null) { score += 2; continue; }
      if (actual !== null && expected !== null) {
        score += Math.abs(actual - expected) * 2;
      }
    }

    if (score < bestScore) {
      bestScore = score;
      bestMatch = chord;
    }
  }

  // Only return a match if it's close enough
  return bestScore <= 6 && bestMatch ? bestMatch.name : null;
}
