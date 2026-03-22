'use client';

import { useEffect, useCallback } from 'react';
import { useAudio } from './useAudio';
import { useInstrumentStore } from '@/stores/instrumentStore';
import { useUIStore } from '@/stores/uiStore';
import { INSTRUMENTS } from '@/types';
import type { InstrumentId } from '@/types';

/**
 * Per-instrument setup hook.
 * Sets the active room in UIStore, and wires cursor accent color.
 * Also provides helpers for note-on/off events that update the store.
 */
export function useInstrument(instrumentId: InstrumentId) {
  const instrument = INSTRUMENTS[instrumentId];
  const { ensureInitialized } = useAudio();
  const setActiveRoom = useUIStore((s) => s.setActiveRoom);
  const setCursorAccent = useUIStore((s) => s.setCursorAccent);
  const addActiveNote = useInstrumentStore((s) => s.addActiveNote);
  const removeActiveNote = useInstrumentStore((s) => s.removeActiveNote);

  useEffect(() => {
    setActiveRoom(instrumentId);
    setCursorAccent(instrument.color);
    return () => {
      setActiveRoom(null);
    };
  }, [instrumentId, instrument.color, setActiveRoom, setCursorAccent]);

  const noteOn = useCallback(
    async (note: string) => {
      await ensureInitialized();
      addActiveNote(note);
    },
    [ensureInitialized, addActiveNote]
  );

  const noteOff = useCallback(
    (note: string) => {
      removeActiveNote(note);
    },
    [removeActiveNote]
  );

  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
  }, []);

  return { instrument, noteOn, noteOff, triggerHaptic };
}
