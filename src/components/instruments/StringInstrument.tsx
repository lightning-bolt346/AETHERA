'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import type { InstrumentId } from '@/types';
import { INSTRUMENTS } from '@/types';

interface StringNote {
  note: string;
  key: string;
  freq: number;
  string: number;
  fret: number;
}

const GUITAR_NOTES: StringNote[] = [
  { note: 'E2', key: 'z', freq: 82.41,  string: 6, fret: 0 },
  { note: 'A2', key: 'x', freq: 110.00, string: 5, fret: 0 },
  { note: 'D3', key: 'c', freq: 146.83, string: 4, fret: 0 },
  { note: 'G3', key: 'v', freq: 196.00, string: 3, fret: 0 },
  { note: 'B3', key: 'b', freq: 246.94, string: 2, fret: 0 },
  { note: 'E4', key: 'n', freq: 329.63, string: 1, fret: 0 },
  { note: 'A3', key: 'a', freq: 220.00, string: 5, fret: 2 },
  { note: 'D4', key: 's', freq: 293.66, string: 4, fret: 2 },
  { note: 'G4', key: 'd', freq: 392.00, string: 3, fret: 2 },
  { note: 'B4', key: 'f', freq: 493.88, string: 2, fret: 2 },
  { note: 'E5', key: 'g', freq: 659.25, string: 1, fret: 2 },
  { note: 'F#4',key: 'h', freq: 369.99, string: 1, fret: 2 },
];

const VIOLIN_NOTES: StringNote[] = [
  { note: 'G3', key: 'z', freq: 196.00, string: 4, fret: 0 },
  { note: 'D4', key: 'x', freq: 293.66, string: 3, fret: 0 },
  { note: 'A4', key: 'c', freq: 440.00, string: 2, fret: 0 },
  { note: 'E5', key: 'v', freq: 659.25, string: 1, fret: 0 },
  { note: 'A3', key: 'a', freq: 220.00, string: 4, fret: 2 },
  { note: 'E4', key: 's', freq: 329.63, string: 3, fret: 2 },
  { note: 'B4', key: 'd', freq: 493.88, string: 2, fret: 2 },
  { note: 'F#5',key: 'f', freq: 739.99, string: 1, fret: 2 },
  { note: 'B3', key: 'g', freq: 246.94, string: 4, fret: 3 },
  { note: 'F#4',key: 'h', freq: 369.99, string: 3, fret: 3 },
];

const TRUMPET_NOTES: StringNote[] = [
  { note: 'F#3', key: 'z', freq: 185.00, string: 1, fret: 0 },
  { note: 'G3',  key: 'x', freq: 196.00, string: 1, fret: 1 },
  { note: 'Ab3', key: 'c', freq: 207.65, string: 1, fret: 2 },
  { note: 'A3',  key: 'v', freq: 220.00, string: 1, fret: 3 },
  { note: 'Bb3', key: 'b', freq: 233.08, string: 1, fret: 4 },
  { note: 'B3',  key: 'n', freq: 246.94, string: 1, fret: 5 },
  { note: 'C4',  key: 'a', freq: 261.63, string: 2, fret: 0 },
  { note: 'D4',  key: 's', freq: 293.66, string: 2, fret: 1 },
  { note: 'Eb4', key: 'd', freq: 311.13, string: 2, fret: 2 },
  { note: 'E4',  key: 'f', freq: 329.63, string: 2, fret: 3 },
  { note: 'F4',  key: 'g', freq: 349.23, string: 2, fret: 4 },
  { note: 'G4',  key: 'h', freq: 392.00, string: 2, fret: 5 },
];

function getNotesForInstrument(id: InstrumentId): StringNote[] {
  switch (id) {
    case 'guitar': return GUITAR_NOTES;
    case 'violin': return VIOLIN_NOTES;
    case 'trumpet': return TRUMPET_NOTES;
    default: return GUITAR_NOTES;
  }
}

function getOscType(id: InstrumentId): OscillatorType {
  switch (id) {
    case 'guitar': return 'sawtooth';
    case 'violin': return 'sawtooth';
    case 'trumpet': return 'square';
    default: return 'sawtooth';
  }
}

interface StringInstrumentProps {
  instrumentId: InstrumentId;
  volume?: number;
  onNotePlay?: (note: string) => void;
}

export default function StringInstrument({ instrumentId, volume = 80, onNotePlay }: StringInstrumentProps) {
  const instrument = INSTRUMENTS[instrumentId];
  const notes = getNotesForInstrument(instrumentId);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscsRef = useRef<Map<string, { osc: OscillatorNode; gain: GainNode }>>( new Map());

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const startNote = useCallback(
    (noteId: string, freq: number) => {
      if (activeOscsRef.current.has(noteId)) return;
      try {
        const ctx = getCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = getOscType(instrumentId);
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = instrumentId === 'trumpet' ? 3000 : 2000;
        filter.Q.value = instrumentId === 'violin' ? 5 : 2;

        const vol = (volume / 100) * 0.3;
        const now = ctx.currentTime;
        const atk = instrumentId === 'guitar' ? 0.01 : 0.05;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + atk);
        if (instrumentId === 'guitar') {
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        }

        osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        osc.start();
        if (instrumentId === 'guitar') osc.stop(now + 1.5);

        activeOscsRef.current.set(noteId, { osc, gain });
        setActiveNotes((prev) => new Set([...prev, noteId]));
        onNotePlay?.(noteId);

        if (instrumentId === 'guitar') {
          setTimeout(() => {
            setActiveNotes((prev) => { const next = new Set(prev); next.delete(noteId); return next; });
            activeOscsRef.current.delete(noteId);
          }, 1500);
        }
      } catch (err) {
        console.warn('Note failed:', err);
      }
    },
    [instrumentId, volume, getCtx, onNotePlay]
  );

  const stopNote = useCallback(
    (noteId: string) => {
      if (instrumentId === 'guitar') return;
      const entry = activeOscsRef.current.get(noteId);
      if (!entry) return;
      const { osc, gain } = entry;
      const ctx = getCtx();
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.stop(now + 0.25);
      activeOscsRef.current.delete(noteId);
      setActiveNotes((prev) => { const next = new Set(prev); next.delete(noteId); return next; });
    },
    [instrumentId, getCtx]
  );

  useEffect(() => {
    const keyMap = Object.fromEntries(notes.map((n) => [n.key, n]));
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const note = keyMap[e.key.toLowerCase()];
      if (note) startNote(note.note, note.freq);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const note = keyMap[e.key.toLowerCase()];
      if (note) stopNote(note.note);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [notes, startNote, stopNote]);

  const gridCols = instrumentId === 'guitar' || instrumentId === 'violin' ? 6 : 6;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '600px' }}>
      <GlassCard accent={instrumentId} size="md">
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: '8px' }}>
          {notes.map((note) => {
            const isActive = activeNotes.has(note.note);
            return (
              <button
                key={note.note + note.key}
                onMouseDown={() => startNote(note.note, note.freq)}
                onMouseUp={() => stopNote(note.note)}
                onMouseLeave={() => stopNote(note.note)}
                onTouchStart={(e) => { e.preventDefault(); startNote(note.note, note.freq); }}
                onTouchEnd={() => stopNote(note.note)}
                style={{
                  width: '72px',
                  height: '72px',
                  background: isActive
                    ? `color-mix(in srgb, ${instrument.color} 25%, transparent)`
                    : 'var(--glass-surface)',
                  border: `1px solid ${isActive ? instrument.color : 'var(--glass-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 80ms ease',
                  boxShadow: isActive ? instrument.glow : 'none',
                  transform: isActive ? 'scale(0.94)' : 'scale(1)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', fontWeight: 500, color: isActive ? instrument.color : 'var(--color-starfield)' }}>
                  {note.note}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-mist)', border: '1px solid var(--glass-border)', borderRadius: '3px', padding: '1px 4px', textTransform: 'uppercase' }}>
                  {note.key}
                </span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-mist)', textAlign: 'center' }}>
        {instrumentId === 'guitar' ? 'Click to pluck — Z X C V B N / A S D F G H' :
         instrumentId === 'violin' ? 'Hold to bow — Z X C V / A S D F G H' :
         'Hold to play — Z X C V B N / A S D F G H'}
      </p>
    </div>
  );
}
