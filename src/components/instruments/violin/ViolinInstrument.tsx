'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  memo,
} from 'react';
import { useAudio } from '@/hooks/useAudio';
import { useInstrumentStore } from '@/stores/instrumentStore';
import { VIOLIN_STRINGS, violinYToSemitones } from '@/lib/note-mappings';
import { VIOLIN_SAMPLE_URLS, VIOLIN_BASE_URL } from '@/lib/sample-loader';
import GlassCard from '@/components/ui/GlassCard';
import type { Sampler, Vibrato, Gain } from 'tone';

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function transposeNote(openNote: string, semitones: number): string {
  const match = openNote.match(/^([A-G]#?)(\d)$/);
  if (!match) return openNote;
  const baseName = match[1]!;
  const octave = parseInt(match[2]!);
  const idx = NOTE_NAMES.indexOf(baseName);
  if (idx === -1) return openNote;
  const newIdx = (idx + semitones) % 12;
  const newOctave = octave + Math.floor((idx + semitones) / 12);
  return `${NOTE_NAMES[newIdx]}${newOctave}`;
}

const LANE_HEIGHT = 90;
const LANE_GAP = 12;

// Per-string bow state
interface BowState {
  isActive: boolean;
  note: string;
  bowSpeed: number;
  lastX: number;
  lastTime: number;
  deltaXHistory: number[];
}

export interface ViolinInstrumentProps {
  onNotePlay?: (note: string) => void;
}

export default function ViolinInstrument({ onNotePlay }: ViolinInstrumentProps) {
  const { ensureInitialized, getOrCreateChannel } = useAudio();
  const violinActiveStrings = useInstrumentStore((s) => s.violinActiveStrings);
  const setBowSpeed = useInstrumentStore((s) => s.setBowSpeed);
  const setViolinStringActive = useInstrumentStore((s) => s.setViolinStringActive);

  const samplerRef = useRef<Sampler | null>(null);
  const vibratoRef = useRef<Vibrato | null>(null);
  const channelRef = useRef<Gain | null>(null);
  const bowStates = useRef<BowState[]>(
    VIOLIN_STRINGS.map((s) => ({
      isActive: false,
      note: s.open,
      bowSpeed: 0,
      lastX: 0,
      lastTime: 0,
      deltaXHistory: [],
    }))
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let disposed = false;
    const setup = async () => {
      await ensureInitialized();
      if (disposed) return;
      const Tone = await import('tone');
      const channel = await getOrCreateChannel('violin');
      channelRef.current = channel;

      const vibrato = new Tone.Vibrato({ frequency: 5, depth: 0.08, wet: 0 });
      vibratoRef.current = vibrato;

      const reverb = new Tone.Reverb({ decay: 4, wet: 0.35 });
      await reverb.ready;

      const sampler = new Tone.Sampler({
        urls: VIOLIN_SAMPLE_URLS,
        baseUrl: VIOLIN_BASE_URL,
        release: 0.5,
        onload: () => { if (!disposed) setIsLoaded(true); },
        onerror: () => { if (!disposed) setIsLoaded(true); },
      });

      sampler.connect(vibrato);
      vibrato.connect(reverb);
      reverb.connect(channel);
      samplerRef.current = sampler;
    };
    setup();
    return () => {
      disposed = true;
      samplerRef.current?.dispose();
      vibratoRef.current?.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const detectVibrato = useCallback((history: number[]): boolean => {
    if (history.length < 10) return false;
    // Count zero-crossings in the last 20 deltaX values
    let crossings = 0;
    for (let i = 1; i < history.length; i++) {
      if ((history[i]! > 0) !== (history[i - 1]! > 0)) crossings++;
    }
    // If 3–8 crossings in ~300ms window ≈ 3–8 Hz
    return crossings >= 3 && crossings <= 12;
  }, []);

  const startBowing = useCallback(
    async (stringIndex: number, normalizedY: number, clientX: number, time: number) => {
      await ensureInitialized();
      const stringDef = VIOLIN_STRINGS[stringIndex];
      if (!stringDef) return;
      const semitones = violinYToSemitones(normalizedY);
      const note = transposeNote(stringDef.open, semitones);

      const state = bowStates.current[stringIndex]!;
      state.isActive = true;
      state.note = note;
      state.lastX = clientX;
      state.lastTime = time;
      state.deltaXHistory = [];

      samplerRef.current?.triggerAttack(note, undefined, 0.6);
      setViolinStringActive(stringIndex, true);
      onNotePlay?.(note);
    },
    [ensureInitialized, setViolinStringActive, onNotePlay]
  );

  const updateBowing = useCallback(
    (stringIndex: number, normalizedY: number, clientX: number, time: number) => {
      const state = bowStates.current[stringIndex];
      if (!state?.isActive) return;

      const dt = Math.max(1, time - state.lastTime);
      const deltaX = clientX - state.lastX;
      const speed = Math.abs(deltaX) / dt; // px per ms

      // Update history for vibrato detection
      state.deltaXHistory.push(deltaX);
      if (state.deltaXHistory.length > 20) state.deltaXHistory.shift();

      // Bow speed → volume
      const bowVelocity = Math.max(0.1, Math.min(1.0, speed / 8));
      state.bowSpeed = bowVelocity;
      state.lastX = clientX;
      state.lastTime = time;

      // Update note pitch from Y position
      const stringDef = VIOLIN_STRINGS[stringIndex];
      if (!stringDef) return;
      const semitones = violinYToSemitones(normalizedY);
      const newNote = transposeNote(stringDef.open, semitones);

      if (newNote !== state.note) {
        samplerRef.current?.triggerRelease(state.note);
        samplerRef.current?.triggerAttack(newNote, undefined, bowVelocity);
        state.note = newNote;
      }

      setBowSpeed(stringIndex, bowVelocity);

      // Vibrato detection
      if (detectVibrato(state.deltaXHistory)) {
        vibratoRef.current?.wet.rampTo(0.7, 0.2);
      } else {
        vibratoRef.current?.wet.rampTo(0, 0.15);
      }
    },
    [setBowSpeed, detectVibrato]
  );

  const stopBowing = useCallback(
    (stringIndex: number) => {
      const state = bowStates.current[stringIndex];
      if (!state?.isActive) return;
      samplerRef.current?.triggerRelease(state.note, undefined);
      state.isActive = false;
      state.bowSpeed = 0;
      setViolinStringActive(stringIndex, false);
      setBowSpeed(stringIndex, 0);
      vibratoRef.current?.wet.rampTo(0, 0.15);
    },
    [setViolinStringActive, setBowSpeed]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', width: '100%', maxWidth: 700 }}>
      {!isLoaded && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)', letterSpacing: '0.08em', textTransform: 'uppercase', animation: 'pulse-ambient 1.5s ease-in-out infinite' }}>
          Loading samples…
        </span>
      )}

      {/* String lanes */}
      <GlassCard accent="violin" size="lg" style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: LANE_GAP }}>
          {VIOLIN_STRINGS.map((stringDef, sIdx) => {
            const isActive = violinActiveStrings[sIdx] ?? false;
            const bowSpeed = bowStates.current[sIdx]?.bowSpeed ?? 0;

            return (
              <ViolinStringLane
                key={stringDef.open}
                stringDef={stringDef}
                stringIndex={sIdx}
                isActive={isActive}
                bowSpeed={bowSpeed}
                onBowStart={startBowing}
                onBowMove={updateBowing}
                onBowEnd={stopBowing}
              />
            );
          })}
        </div>
      </GlassCard>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-mist)', textAlign: 'center' }}>
        Press and drag horizontally to bow · Y position controls pitch · Oscillate for vibrato
      </div>
    </div>
  );
}

// Individual string lane component
const ViolinStringLane = memo(function ViolinStringLane({
  stringDef,
  stringIndex,
  isActive,
  bowSpeed,
  onBowStart,
  onBowMove,
  onBowEnd,
}: {
  stringDef: { open: string; label: string; color: string };
  stringIndex: number;
  isActive: boolean;
  bowSpeed: number;
  onBowStart: (si: number, y: number, x: number, t: number) => void;
  onBowMove: (si: number, y: number, x: number, t: number) => void;
  onBowEnd: (si: number) => void;
}) {
  const laneRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const getNormalizedY = (clientY: number): number => {
    const rect = laneRef.current?.getBoundingClientRect();
    if (!rect) return 0.5;
    return Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    onBowStart(stringIndex, getNormalizedY(e.clientY), e.clientX, e.timeStamp);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    onBowMove(stringIndex, getNormalizedY(e.clientY), e.clientX, e.timeStamp);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    onBowEnd(stringIndex);
  };

  return (
    <div
      ref={laneRef}
      role="button"
      aria-label={`Violin string ${stringDef.label}`}
      style={{
        height: LANE_HEIGHT,
        background: isActive ? 'rgba(167,139,250,0.05)' : 'transparent',
        borderRadius: 'var(--radius-md)',
        position: 'relative',
        cursor: 'crosshair',
        border: `1px solid ${isActive ? 'rgba(167,139,250,0.2)' : 'transparent'}`,
        transition: 'background var(--duration-fast), border-color var(--duration-fast)',
        touchAction: 'none',
        userSelect: 'none',
        overflow: 'hidden',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* String label */}
      <span style={{
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-lg)',
        fontWeight: 700,
        color: isActive ? 'var(--color-indigo-aurora)' : 'rgba(167,139,250,0.4)',
        transition: 'color var(--duration-fast)',
        letterSpacing: '-0.02em',
        pointerEvents: 'none',
      }}>
        {stringDef.label}
      </span>
      <span style={{
        position: 'absolute',
        left: 40,
        top: '50%',
        transform: 'translateY(-50%)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-mist)',
        letterSpacing: '0.05em',
        pointerEvents: 'none',
      }}>
        {stringDef.open}
      </span>

      {/* The string line */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="50%"
          stroke={isActive ? 'var(--color-indigo-aurora)' : 'rgba(167,139,250,0.5)'}
          strokeWidth={isActive ? '2.5' : '1.5'}
          style={{
            filter: isActive ? 'drop-shadow(0 0 8px var(--color-indigo-aurora))' : 'none',
            transition: 'stroke var(--duration-fast), stroke-width var(--duration-fast)',
          }}
        />
      </svg>

      {/* Bow speed indicator */}
      {isActive && (
        <div style={{
          position: 'absolute',
          bottom: 8,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          color: 'rgba(167,139,250,0.7)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 60,
            height: 3,
            background: 'var(--glass-border)',
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${bowSpeed * 100}%`,
              background: 'var(--color-indigo-aurora)',
              transition: 'width 60ms',
            }} />
          </div>
          Bow
        </div>
      )}
    </div>
  );
});
