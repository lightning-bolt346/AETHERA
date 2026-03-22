/**
 * AETHERA Note Mappings
 * All frequency, keyboard, and note definitions for all 6 instruments.
 */

// ─── Piano keyboard layout (no conflicting keys) ──────────────────────────────
// Lower white row: A S D F G H J K L ;  → C4–E5
// Lower black row: W E _ T Y U _ I O _  → C#4–D#5
// Upper white row: same keys + octave +1 when holding Shift variant

export const PIANO_KEY_TO_NOTE: Record<string, string> = {
  // White keys — C4 octave base
  a: 'C',
  s: 'D',
  d: 'E',
  f: 'F',
  g: 'G',
  h: 'A',
  j: 'B',
  // White keys — C5 octave
  k: 'C',
  l: 'D',
  ';': 'E',
  // Black keys — sharps
  w: 'C#',
  e: 'D#',
  t: 'F#',
  y: 'G#',
  u: 'A#',
  // Black keys — C5 sharps
  i: 'C#',
  o: 'D#',
};

// Keys that belong to the C4 octave (versus C5 octave)
export const PIANO_LOWER_OCTAVE_KEYS = new Set(['a', 's', 'd', 'f', 'g', 'h', 'j', 'w', 'e', 't', 'y', 'u']);
export const PIANO_UPPER_OCTAVE_KEYS = new Set(['k', 'l', ';', 'i', 'o']);

// Full note list for building the visual keyboard (2 octaves)
export type PianoKeyDef = {
  note: string;   // e.g. "C4"
  key: string;    // keyboard shortcut
  label: string;  // display label
  type: 'white' | 'black';
  octaveIndex: number; // 0 or 1 (for 2-octave span)
};

export function buildPianoKeys(baseOctave: number): PianoKeyDef[] {
  const defs: PianoKeyDef[] = [
    { note: `C${baseOctave}`,     key: 'a', label: 'A', type: 'white',  octaveIndex: 0 },
    { note: `C#${baseOctave}`,    key: 'w', label: 'W', type: 'black',  octaveIndex: 0 },
    { note: `D${baseOctave}`,     key: 's', label: 'S', type: 'white',  octaveIndex: 0 },
    { note: `D#${baseOctave}`,    key: 'e', label: 'E', type: 'black',  octaveIndex: 0 },
    { note: `E${baseOctave}`,     key: 'd', label: 'D', type: 'white',  octaveIndex: 0 },
    { note: `F${baseOctave}`,     key: 'f', label: 'F', type: 'white',  octaveIndex: 0 },
    { note: `F#${baseOctave}`,    key: 't', label: 'T', type: 'black',  octaveIndex: 0 },
    { note: `G${baseOctave}`,     key: 'g', label: 'G', type: 'white',  octaveIndex: 0 },
    { note: `G#${baseOctave}`,    key: 'y', label: 'Y', type: 'black',  octaveIndex: 0 },
    { note: `A${baseOctave}`,     key: 'h', label: 'H', type: 'white',  octaveIndex: 0 },
    { note: `A#${baseOctave}`,    key: 'u', label: 'U', type: 'black',  octaveIndex: 0 },
    { note: `B${baseOctave}`,     key: 'j', label: 'J', type: 'white',  octaveIndex: 0 },
    { note: `C${baseOctave + 1}`, key: 'k', label: 'K', type: 'white',  octaveIndex: 1 },
    { note: `C#${baseOctave + 1}`,key: 'i', label: 'I', type: 'black',  octaveIndex: 1 },
    { note: `D${baseOctave + 1}`, key: 'l', label: 'L', type: 'white',  octaveIndex: 1 },
    { note: `D#${baseOctave + 1}`,key: 'o', label: 'O', type: 'black',  octaveIndex: 1 },
    { note: `E${baseOctave + 1}`, key: ';', label: ';', type: 'white',  octaveIndex: 1 },
  ];
  return defs;
}

// ─── Trumpet valve combinations → note ────────────────────────────────────────
// Valve state encoded as "v1v2v3" booleans (0=open, 1=pressed)

export const TRUMPET_VALVE_NOTES: Record<string, string> = {
  '000': 'Bb4', // Open
  '010': 'A4',  // Valve 2
  '100': 'Ab4', // Valve 1
  '110': 'G4',  // Valves 1+2
  '011': 'F#4', // Valves 2+3
  '101': 'F4',  // Valves 1+3
  '111': 'E4',  // All valves
  '001': 'Eb4', // Valve 3
};

export function valvesToNote(valves: [boolean, boolean, boolean]): string {
  const key = valves.map((v) => (v ? '1' : '0')).join('');
  return TRUMPET_VALVE_NOTES[key] ?? 'Bb4';
}

// ─── Guitar note matrix ───────────────────────────────────────────────────────
// EADGBE standard tuning, 6 strings × 13 frets (0–12)
export const GUITAR_OPEN_STRINGS = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] as const;
export type GuitarString = 0 | 1 | 2 | 3 | 4 | 5;

// Pre-computed note matrix [string][fret]
export const GUITAR_NOTE_MATRIX: string[][] = [
  // String 6 (low E)
  ['E2','F2','F#2','G2','G#2','A2','A#2','B2','C3','C#3','D3','D#3','E3'],
  // String 5 (A)
  ['A2','A#2','B2','C3','C#3','D3','D#3','E3','F3','F#3','G3','G#3','A3'],
  // String 4 (D)
  ['D3','D#3','E3','F3','F#3','G3','G#3','A3','A#3','B3','C4','C#4','D4'],
  // String 3 (G)
  ['G3','G#3','A3','A#3','B3','C4','C#4','D4','D#4','E4','F4','F#4','G4'],
  // String 2 (B)
  ['B3','C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4'],
  // String 1 (high E)
  ['E4','F4','F#4','G4','G#4','A4','A#4','B4','C5','C#5','D5','D#5','E5'],
];

// ─── Violin string ranges ─────────────────────────────────────────────────────
export const VIOLIN_STRINGS = [
  { open: 'G3', label: 'G', color: 'var(--color-indigo-aurora)' },
  { open: 'D4', label: 'D', color: 'var(--color-indigo-aurora)' },
  { open: 'A4', label: 'A', color: 'var(--color-cyber-cyan)' },
  { open: 'E5', label: 'E', color: 'var(--color-lume-teal)' },
] as const;

// Map Y position [0,1] within a string lane → semitones above open (0–12)
export function violinYToSemitones(normalizedY: number): number {
  return Math.round(normalizedY * 12);
}

// ─── Drum pad key mappings ─────────────────────────────────────────────────────
export const DRUM_KEY_MAP: Record<string, string> = {
  j: 'kick',
  k: 'snare',
  s: 'hhClosed',
  d: 'hhOpen',
  f: 'crash',
  g: 'ride',
  h: 'tomHi',
  l: 'tomFloor',
};

// ─── Synth key mappings ────────────────────────────────────────────────────────
// Same layout as piano lower row, maps to C3 octave for synth bass range
export const SYNTH_KEY_NOTES: Record<string, string> = {
  a: 'C3',
  w: 'C#3',
  s: 'D3',
  e: 'D#3',
  d: 'E3',
  f: 'F3',
  t: 'F#3',
  g: 'G3',
  y: 'G#3',
  h: 'A3',
  u: 'A#3',
  j: 'B3',
  k: 'C4',
  i: 'C#4',
  l: 'D4',
  o: 'D#4',
  ';': 'E4',
};
