'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '@/stores/audioStore';
import { initAudioEngine, getAudioEngine } from '@/lib/audio-engine';
import type { Gain } from 'tone';

/**
 * Hook that initializes the global Tone.js audio engine on first user gesture.
 * Returns helper to get/create instrument channels.
 */
export function useAudio() {
  const isInitialized = useAudioStore((s) => s.isInitialized);
  const initialize = useAudioStore((s) => s.initialize);
  const masterVolume = useAudioStore((s) => s.masterVolume);
  const globalBpm = useAudioStore((s) => s.globalBpm);

  // Sync BPM to Tone.Transport whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    import('tone').then(({ getTransport }) => {
      getTransport().bpm.value = globalBpm;
    });
  }, [globalBpm, isInitialized]);

  // Sync master volume
  useEffect(() => {
    if (!isInitialized) return;
    getAudioEngine().setMasterVolume(masterVolume);
  }, [masterVolume, isInitialized]);

  const ensureInitialized = useCallback(async (): Promise<void> => {
    if (!isInitialized) {
      await initAudioEngine();
      await initialize();
    }
  }, [isInitialized, initialize]);

  const getOrCreateChannel = useCallback(
    async (instrumentId: string): Promise<Gain> => {
      await ensureInitialized();
      return getAudioEngine().getOrCreateChannel(instrumentId);
    },
    [ensureInitialized]
  );

  return { isInitialized, ensureInitialized, getOrCreateChannel };
}
