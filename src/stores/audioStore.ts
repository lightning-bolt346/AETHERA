import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface AudioStoreState {
  isInitialized: boolean;
  isContextRunning: boolean;
  masterVolume: number;
  globalReverb: number;
  globalBpm: number;
}

interface AudioStoreActions {
  initialize: () => Promise<void>;
  setMasterVolume: (volume: number) => void;
  setGlobalReverb: (wet: number) => void;
  setGlobalBpm: (bpm: number) => void;
}

type AudioStore = AudioStoreState & AudioStoreActions;

export const useAudioStore = create<AudioStore>()(
  subscribeWithSelector((set, get) => ({
    isInitialized: false,
    isContextRunning: false,
    masterVolume: 0.8,
    globalReverb: 0.2,
    globalBpm: 120,

    initialize: async () => {
      if (get().isInitialized) return;
      const { start, getContext } = await import('tone');
      await start();
      await getContext().resume();
      set({ isInitialized: true, isContextRunning: true });
    },

    setMasterVolume: (volume) => {
      set({ masterVolume: volume });
      import('tone').then(({ getDestination }) => {
        const db = volume > 0 ? 20 * Math.log10(volume) : -Infinity;
        getDestination().volume.rampTo(db, 0.05);
      });
    },

    setGlobalReverb: (wet) => set({ globalReverb: wet }),

    setGlobalBpm: (bpm) => {
      set({ globalBpm: bpm });
      import('tone').then(({ getTransport }) => {
        getTransport().bpm.value = bpm;
      });
    },
  }))
);
