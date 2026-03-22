import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type DrumPadId =
  | 'kick'
  | 'snare'
  | 'hhClosed'
  | 'hhOpen'
  | 'crash'
  | 'ride'
  | 'tomHi'
  | 'tomFloor';
export type StepCount = 8 | 16 | 32;

export const DRUM_PAD_IDS: DrumPadId[] = [
  'kick', 'snare', 'hhClosed', 'hhOpen',
  'crash', 'ride', 'tomHi', 'tomFloor',
];

export interface SynthParams {
  oscillatorType: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterFreq: number;
  filterQ: number;
  lfoFreq: number;
  lfoDepth: number;
  delayWet: number;
  reverbWet: number;
}

const DEFAULT_SYNTH_PARAMS: SynthParams = {
  oscillatorType: 'sawtooth',
  attack: 0.05,
  decay: 0.1,
  sustain: 0.7,
  release: 0.5,
  filterFreq: 2000,
  filterQ: 2,
  lfoFreq: 2,
  lfoDepth: 0.3,
  delayWet: 0.2,
  reverbWet: 0.3,
};

function emptyDrumGrid(): Record<DrumPadId, boolean[]> {
  const grid = {} as Record<DrumPadId, boolean[]>;
  for (const pad of DRUM_PAD_IDS) {
    grid[pad] = Array(32).fill(false) as boolean[];
  }
  return grid;
}

interface InstrumentStoreState {
  activeNotes: string[];
  pianoOctave: number;
  isSustainPedal: boolean;
  sustainedNotes: string[];
  drumGrid: Record<DrumPadId, boolean[]>;
  drumStepCount: StepCount;
  drumCurrentStep: number;
  drumsPlaying: boolean;
  drumBpm: number;
  guitarFrets: (number | null)[];
  detectedChord: string | null;
  bowSpeeds: [number, number, number, number];
  violinActiveStrings: [boolean, boolean, boolean, boolean];
  valves: [boolean, boolean, boolean];
  isBlowing: boolean;
  synthParams: SynthParams;
}

interface InstrumentStoreActions {
  addActiveNote: (note: string) => void;
  removeActiveNote: (note: string) => void;
  clearActiveNotes: () => void;
  setPianoOctave: (octave: number) => void;
  setSustainPedal: (active: boolean) => void;
  addSustainedNote: (note: string) => void;
  clearSustainedNotes: () => void;
  toggleDrumCell: (pad: DrumPadId, step: number) => void;
  setDrumStep: (step: number) => void;
  setDrumsPlaying: (playing: boolean) => void;
  setDrumBpm: (bpm: number) => void;
  setDrumStepCount: (count: StepCount) => void;
  setGuitarFret: (stringIndex: number, fret: number | null) => void;
  setDetectedChord: (chord: string | null) => void;
  setBowSpeed: (stringIndex: number, speed: number) => void;
  setViolinStringActive: (stringIndex: number, active: boolean) => void;
  setValve: (index: 0 | 1 | 2, active: boolean) => void;
  setBlowing: (active: boolean) => void;
  setSynthParam: <K extends keyof SynthParams>(key: K, value: SynthParams[K]) => void;
}

type InstrumentStore = InstrumentStoreState & InstrumentStoreActions;

export const useInstrumentStore = create<InstrumentStore>()(
  subscribeWithSelector((set, get) => ({
    activeNotes: [],
    pianoOctave: 4,
    isSustainPedal: false,
    sustainedNotes: [],
    drumGrid: emptyDrumGrid(),
    drumStepCount: 16,
    drumCurrentStep: 0,
    drumsPlaying: false,
    drumBpm: 90,
    guitarFrets: [null, null, null, null, null, null],
    detectedChord: null,
    bowSpeeds: [0, 0, 0, 0],
    violinActiveStrings: [false, false, false, false],
    valves: [false, false, false],
    isBlowing: false,
    synthParams: DEFAULT_SYNTH_PARAMS,

    addActiveNote: (note) =>
      set((s) => ({ activeNotes: s.activeNotes.includes(note) ? s.activeNotes : [...s.activeNotes, note] })),

    removeActiveNote: (note) =>
      set((s) => ({ activeNotes: s.activeNotes.filter((n) => n !== note) })),

    clearActiveNotes: () => set({ activeNotes: [] }),

    setPianoOctave: (octave) => set({ pianoOctave: Math.max(1, Math.min(7, octave)) }),

    setSustainPedal: (active) => {
      set({ isSustainPedal: active });
      if (!active) set({ sustainedNotes: [] });
    },

    addSustainedNote: (note) =>
      set((s) => ({
        sustainedNotes: s.sustainedNotes.includes(note) ? s.sustainedNotes : [...s.sustainedNotes, note],
      })),

    clearSustainedNotes: () => set({ sustainedNotes: [] }),

    toggleDrumCell: (pad, step) =>
      set((s) => {
        const grid = { ...s.drumGrid };
        const row = [...grid[pad]];
        row[step] = !row[step];
        grid[pad] = row;
        return { drumGrid: grid };
      }),

    setDrumStep: (step) => set({ drumCurrentStep: step }),

    setDrumsPlaying: (playing) => set({ drumsPlaying: playing }),

    setDrumBpm: (bpm) => set({ drumBpm: Math.max(40, Math.min(240, bpm)) }),

    setDrumStepCount: (count) => set({ drumStepCount: count }),

    setGuitarFret: (stringIndex, fret) =>
      set((s) => {
        const frets = [...s.guitarFrets];
        frets[stringIndex] = fret;
        return { guitarFrets: frets };
      }),

    setDetectedChord: (chord) => set({ detectedChord: chord }),

    setBowSpeed: (stringIndex, speed) =>
      set((s) => {
        const speeds: [number, number, number, number] = [...s.bowSpeeds] as [number, number, number, number];
        speeds[stringIndex] = speed;
        return { bowSpeeds: speeds };
      }),

    setViolinStringActive: (stringIndex, active) =>
      set((s) => {
        const strings: [boolean, boolean, boolean, boolean] = [...s.violinActiveStrings] as [boolean, boolean, boolean, boolean];
        strings[stringIndex] = active;
        return { violinActiveStrings: strings };
      }),

    setValve: (index, active) =>
      set((s) => {
        const valves: [boolean, boolean, boolean] = [...s.valves] as [boolean, boolean, boolean];
        valves[index] = active;
        return { valves };
      }),

    setBlowing: (active) => set({ isBlowing: active }),

    setSynthParam: (key, value) =>
      set((s) => ({ synthParams: { ...s.synthParams, [key]: value } })),
  }))
);
