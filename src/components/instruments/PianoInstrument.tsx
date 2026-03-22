'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import GlassCard from '@/components/ui/GlassCard';

const NOTES = [
  { note: 'C4',  key: 'a', label: 'A', type: 'white' },
  { note: 'C#4', key: 'w', label: 'W', type: 'black' },
  { note: 'D4',  key: 's', label: 'S', type: 'white' },
  { note: 'D#4', key: 'e', label: 'E', type: 'black' },
  { note: 'E4',  key: 'd', label: 'D', type: 'white' },
  { note: 'F4',  key: 'f', label: 'F', type: 'white' },
  { note: 'F#4', key: 't', label: 'T', type: 'black' },
  { note: 'G4',  key: 'g', label: 'G', type: 'white' },
  { note: 'G#4', key: 'y', label: 'Y', type: 'black' },
  { note: 'A4',  key: 'h', label: 'H', type: 'white' },
  { note: 'A#4', key: 'u', label: 'U', type: 'black' },
  { note: 'B4',  key: 'j', label: 'J', type: 'white' },
  { note: 'C5',  key: 'k', label: 'K', type: 'white' },
  { note: 'C#5', key: 'o', label: 'O', type: 'black' },
  { note: 'D5',  key: 'l', label: 'L', type: 'white' },
] as const;

const WHITE_KEYS = NOTES.filter((n) => n.type === 'white');
const BLACK_KEYS = NOTES.filter((n) => n.type === 'black');

const NOTE_FREQS: Record<string, number> = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33,
};

interface PianoInstrumentProps {
  volume?: number;
  reverb?: number;
  onNotePlay?: (note: string) => void;
}

export default function PianoInstrument({ volume = 80, reverb = 20, onNotePlay }: PianoInstrumentProps) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playNote = useCallback(
    (noteName: string) => {
      const freq = NOTE_FREQS[noteName];
      if (!freq) return;

      try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.999, ctx.currentTime + 1.5);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000 + freq * 2, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);

        const vol = (volume / 100) * 0.4;
        gainNode.gain.setValueAtTime(vol, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(vol * 0.6, ctx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 2.0);

        onNotePlay?.(noteName);
      } catch (err) {
        console.warn('Audio play failed:', err);
      }
    },
    [volume, getAudioCtx, onNotePlay]
  );

  const handleKeyDown = useCallback(
    (note: (typeof NOTES)[number]) => {
      const noteStr = note.note;
      if (activeKeys.has(noteStr)) return;
      setActiveKeys((prev) => new Set([...prev, noteStr]));
      playNote(noteStr);
    },
    [activeKeys, playNote]
  );

  const handleKeyUp = useCallback((note: (typeof NOTES)[number]) => {
    const noteStr = note.note;
    setActiveKeys((prev) => {
      const next = new Set(prev);
      next.delete(noteStr);
      return next;
    });
  }, []);

  useEffect(() => {
    const keyNoteMap = Object.fromEntries(
      NOTES.map((n) => [n.key, n] as [string, typeof n])
    );

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const note = keyNoteMap[e.key.toLowerCase()];
      if (note) handleKeyDown(note);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const note = keyNoteMap[e.key.toLowerCase()];
      if (note) handleKeyUp(note);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const WHITE_KEY_W = 56;
  const WHITE_KEY_H = 200;
  const BLACK_KEY_W = 36;
  const BLACK_KEY_H = 130;
  const totalWidth = WHITE_KEYS.length * WHITE_KEY_W;

  const getBlackKeyX = (noteName: string): number => {
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseNote = noteName.replace(/\d/, '');
    const whitesBefore = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const offsets: Record<string, number> = {
      'C#': 0.6, 'D#': 1.6, 'F#': 3.6, 'G#': 4.6, 'A#': 5.6,
      'C#5': 7.6,
    };
    const oct = noteName.slice(-1);
    const key = baseNote + (baseNote === 'C#' && oct === '5' ? '5' : '');
    return (offsets[key] ?? 0) * WHITE_KEY_W + (WHITE_KEY_W - BLACK_KEY_W) / 2;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      <GlassCard accent="piano" size="lg" style={{ padding: '32px 40px' }}>
        {/* Piano keyboard */}
        <div
          style={{
            position: 'relative',
            width: totalWidth,
            height: WHITE_KEY_H + 16,
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {/* White keys */}
          {WHITE_KEYS.map((note, i) => {
            const noteStr = note.note;
            const isActive = activeKeys.has(noteStr);
            return (
              <div
                key={noteStr}
                onMouseDown={() => handleKeyDown(note)}
                onMouseUp={() => handleKeyUp(note)}
                onMouseLeave={() => handleKeyUp(note)}
                onTouchStart={(e) => { e.preventDefault(); handleKeyDown(note); }}
                onTouchEnd={() => handleKeyUp(note)}
                style={{
                  position: 'absolute',
                  left: i * WHITE_KEY_W,
                  top: 0,
                  width: WHITE_KEY_W - 2,
                  height: WHITE_KEY_H,
                  background: isActive
                    ? 'linear-gradient(180deg, rgba(0,255,209,0.3) 0%, rgba(0,255,209,0.1) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderTop: isActive ? '1px solid var(--color-lume-teal)' : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '0 0 6px 6px',
                  cursor: 'pointer',
                  transition: 'background var(--duration-fast) var(--ease-smooth)',
                  boxShadow: isActive
                    ? '0 0 20px rgba(0,255,209,0.3), inset 0 -4px 8px rgba(0,255,209,0.1)'
                    : '0 2px 8px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: '10px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    letterSpacing: '0.05em',
                    color: isActive ? 'var(--color-lume-teal)' : 'rgba(184,192,224,0.4)',
                    textTransform: 'uppercase',
                    transition: 'color var(--duration-fast)',
                  }}
                >
                  {note.label}
                </span>
              </div>
            );
          })}

          {/* Black keys */}
          {[
            { note: 'C#4', key: 'w', label: 'W', offset: 0.6 },
            { note: 'D#4', key: 'e', label: 'E', offset: 1.6 },
            { note: 'F#4', key: 't', label: 'T', offset: 3.6 },
            { note: 'G#4', key: 'y', label: 'Y', offset: 4.6 },
            { note: 'A#4', key: 'u', label: 'U', offset: 5.6 },
            { note: 'C#5', key: 'o', label: 'O', offset: 7.6 },
          ].map(({ note, key, label, offset }) => {
            const isActive = activeKeys.has(note);
            const noteObj = NOTES.find(n => n.note === note);
            return (
              <div
                key={note}
                onMouseDown={() => noteObj && handleKeyDown(noteObj)}
                onMouseUp={() => noteObj && handleKeyUp(noteObj)}
                onMouseLeave={() => noteObj && handleKeyUp(noteObj)}
                onTouchStart={(e) => { e.preventDefault(); noteObj && handleKeyDown(noteObj); }}
                onTouchEnd={() => noteObj && handleKeyUp(noteObj)}
                style={{
                  position: 'absolute',
                  left: offset * WHITE_KEY_W + (WHITE_KEY_W - BLACK_KEY_W) / 2,
                  top: 0,
                  width: BLACK_KEY_W,
                  height: BLACK_KEY_H,
                  background: isActive
                    ? 'linear-gradient(180deg, rgba(0,255,209,0.4) 0%, rgba(0,100,80,0.6) 100%)'
                    : 'linear-gradient(180deg, rgba(10,10,20,0.95) 0%, rgba(5,5,15,0.98) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderTop: isActive ? '2px solid var(--color-lume-teal)' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '0 0 4px 4px',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'background var(--duration-fast)',
                  boxShadow: isActive
                    ? '0 0 16px rgba(0,255,209,0.5)'
                    : '2px 4px 12px rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    color: isActive ? 'var(--color-lume-teal)' : 'rgba(107,114,128,0.5)',
                    textTransform: 'uppercase',
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Hint text */}
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-mist)',
          textAlign: 'center',
        }}
      >
        Click keys or use keyboard — A S D F G H J K L
      </p>
    </div>
  );
}
