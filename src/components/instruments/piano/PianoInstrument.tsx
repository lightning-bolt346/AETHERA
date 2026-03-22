'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InkBloom, { type InkBloomHandle } from './InkBloom';
import { useAudio } from '@/hooks/useAudio';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useInstrumentStore } from '@/stores/instrumentStore';
import { buildPianoKeys, type PianoKeyDef } from '@/lib/note-mappings';
import {
  PIANO_SAMPLE_URLS,
  PIANO_BASE_URL,
} from '@/lib/sample-loader';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';
import type { Sampler, Reverb, Gain } from 'tone';

const WHITE_KEY_W = 56;
const WHITE_KEY_H = 180;
const BLACK_KEY_W = 34;
const BLACK_KEY_H = 110;

// Black key X offsets relative to the start of each white key group
const BLACK_KEY_OFFSET_MAP: Record<string, number> = {
  'C#': 0.65,
  'D#': 1.65,
  'F#': 3.65,
  'G#': 4.65,
  'A#': 5.65,
};

function getBlackKeyLeft(note: string, whiteCount: number): number {
  const pitchClass = note.replace(/\d/g, '');
  const octaveStart = parseInt(note.match(/\d+/)?.[0] ?? '4');
  // Find offset within octave
  const baseOffset = Object.keys(BLACK_KEY_OFFSET_MAP).indexOf(pitchClass);
  if (baseOffset === -1) return -1;
  const offset = BLACK_KEY_OFFSET_MAP[pitchClass] ?? 0;
  // Each octave is 7 white keys wide
  const octaveOffset = (octaveStart % 2) * 7;
  return (offset + octaveOffset) * WHITE_KEY_W;
}

export interface PianoInstrumentProps {
  onNotePlay?: (note: string) => void;
  volume?: number;
}

export default function PianoInstrument({ onNotePlay, volume = 80 }: PianoInstrumentProps) {
  const { ensureInitialized, getOrCreateChannel } = useAudio();
  const pianoOctave = useInstrumentStore((s) => s.pianoOctave);
  const setPianoOctave = useInstrumentStore((s) => s.setPianoOctave);
  const isSustainPedal = useInstrumentStore((s) => s.isSustainPedal);
  const setSustainPedal = useInstrumentStore((s) => s.setSustainPedal);
  const addActiveNote = useInstrumentStore((s) => s.addActiveNote);
  const removeActiveNote = useInstrumentStore((s) => s.removeActiveNote);
  const addSustainedNote = useInstrumentStore((s) => s.addSustainedNote);
  const activeNotes = useInstrumentStore((s) => s.activeNotes);
  const sustainedNotes = useInstrumentStore((s) => s.sustainedNotes);

  const samplerRef = useRef<Sampler | null>(null);
  const reverbRef = useRef<Reverb | null>(null);
  const channelRef = useRef<Gain | null>(null);
  const bloomRef = useRef<InkBloomHandle>(null);
  const keyboardContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const keys = useMemo(() => buildPianoKeys(pianoOctave), [pianoOctave]);
  const whiteKeys = keys.filter((k) => k.type === 'white');
  const blackKeys = keys.filter((k) => k.type === 'black');
  const totalWidth = whiteKeys.length * WHITE_KEY_W;

  // Initialize Tone.js sampler
  useEffect(() => {
    let disposed = false;

    const setup = async () => {
      try {
        await ensureInitialized();
        const Tone = await import('tone');
        const channel = await getOrCreateChannel('piano');
        channelRef.current = channel;

        const reverb = new Tone.Reverb({ decay: 3.5, wet: 0.25 });
        await reverb.ready;
        reverbRef.current = reverb;

        const sampler = new Tone.Sampler({
          urls: PIANO_SAMPLE_URLS,
          baseUrl: PIANO_BASE_URL,
          release: 1.2,
          onload: () => {
            if (!disposed) setIsLoaded(true);
          },
          onerror: () => {
            if (!disposed) {
              setLoadError(true);
              setIsLoaded(true); // allow play via synth fallback
            }
          },
        });

        sampler.connect(reverb);
        reverb.connect(channel);
        samplerRef.current = sampler;
      } catch {
        if (!disposed) setLoadError(true);
      }
    };

    setup();

    return () => {
      disposed = true;
      samplerRef.current?.dispose();
      reverbRef.current?.dispose();
      samplerRef.current = null;
      reverbRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const playNote = useCallback(
    async (note: string, velocity = 0.8) => {
      if (!samplerRef.current) {
        // Fallback synthesis
        await ensureInitialized();
        const Tone = await import('tone');
        const channel = channelRef.current;
        const osc = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 1.2 },
        });
        if (channel) osc.connect(channel);
        osc.triggerAttackRelease(note, '2n', Tone.now(), velocity);
        setTimeout(() => osc.dispose(), 3000);
        return;
      }

      const sampler = samplerRef.current;
      if (sampler.loaded) {
        sampler.triggerAttack(note, undefined, velocity);
      }

      addActiveNote(note);
      if (isSustainPedal) addSustainedNote(note);
      onNotePlay?.(note);

      // Spawn ink bloom at key position
      const keyEl = keyboardContainerRef.current?.querySelector(
        `[data-note="${note}"]`
      ) as HTMLElement | null;
      if (keyEl && bloomRef.current) {
        const rect = keyEl.getBoundingClientRect();
        const containerRect = keyboardContainerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const x = rect.left - containerRect.left + rect.width / 2;
          const y = rect.top - containerRect.top + rect.height * 0.3;
          const octave = parseInt(note.match(/\d+/)?.[0] ?? '4');
          const isLowNote = ['C', 'D', 'E'].some((n) => note.startsWith(n));
          bloomRef.current.spawn(x, y, octave, isLowNote);
        }
      }
    },
    [ensureInitialized, isSustainPedal, addActiveNote, addSustainedNote, onNotePlay]
  );

  const releaseNote = useCallback(
    (note: string) => {
      removeActiveNote(note);
      if (isSustainPedal) return; // sustain pedal holds the note
      samplerRef.current?.triggerRelease(note);
    },
    [removeActiveNote, isSustainPedal]
  );

  // Key → note mapping from current octave
  const keyNoteMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const k of keys) map[k.key] = k.note;
    return map;
  }, [keys]);

  useKeyboard(
    (key, e) => {
      if (key === ' ') {
        e.preventDefault();
        setSustainPedal(true);
        if (samplerRef.current) {
          samplerRef.current.set({ release: 4.0 });
        }
        return;
      }
      if (key === 'z') { setPianoOctave(pianoOctave - 1); return; }
      if (key === 'x') { setPianoOctave(pianoOctave + 1); return; }
      const note = keyNoteMap[key];
      if (note && !activeNotes.includes(note)) {
        playNote(note, 0.8);
      }
    },
    (key) => {
      if (key === ' ') {
        setSustainPedal(false);
        samplerRef.current?.set({ release: 1.2 });
        // Release all active notes not in sustained list
        const Tone = import('tone');
        Tone.then(({ now }) => {
          activeNotes.forEach((n) => {
            if (!sustainedNotes.includes(n)) {
              samplerRef.current?.triggerRelease(n, now());
            }
          });
        });
        return;
      }
      const note = keyNoteMap[key];
      if (note) releaseNote(note);
    },
    { ignoreKeys: ['tab', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'] }
  );

  const isActive = useCallback(
    (note: string) => activeNotes.includes(note) || sustainedNotes.includes(note),
    [activeNotes, sustainedNotes]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
      {/* Control row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Octave control */}
        <GlassCard accent="piano" size="sm">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <GlowButton
              variant="icon"
              accentColor="var(--color-lume-teal)"
              size="sm"
              onClick={() => setPianoOctave(pianoOctave - 1)}
              aria-label="Octave down"
            >
              −
            </GlowButton>
            <div style={{ textAlign: 'center', minWidth: 56 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-mist)' }}>
                Octave
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', color: 'var(--color-lume-teal)', fontWeight: 500 }}>
                {pianoOctave}
              </div>
            </div>
            <GlowButton
              variant="icon"
              accentColor="var(--color-lume-teal)"
              size="sm"
              onClick={() => setPianoOctave(pianoOctave + 1)}
              aria-label="Octave up"
            >
              +
            </GlowButton>
          </div>
        </GlassCard>

        {/* Sustain indicator */}
        <GlassCard accent="piano" size="sm">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isSustainPedal ? 'var(--color-lume-teal)' : 'var(--color-mist)',
                boxShadow: isSustainPedal ? 'var(--glow-piano)' : 'none',
                transition: 'all var(--duration-fast) var(--ease-smooth)',
              }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase', color: isSustainPedal ? 'var(--color-lume-teal)' : 'var(--color-mist)' }}>
              Sustain
            </span>
          </div>
        </GlassCard>

        {/* Load status */}
        {!isLoaded && !loadError && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', color: 'var(--color-mist)', animation: 'pulse-ambient 1.5s ease-in-out infinite' }}>
            Loading samples…
          </div>
        )}
        {loadError && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', color: 'var(--color-amber-pulse)' }}>
            Synth fallback active
          </div>
        )}
      </div>

      {/* Keyboard */}
      <div
        ref={keyboardContainerRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'auto',
          overflowY: 'visible',
        }}
        className="no-scrollbar"
      >
        <div style={{ position: 'relative', width: totalWidth, height: WHITE_KEY_H + 20, margin: '0 auto' }}>
          {/* Ink bloom canvas */}
          <InkBloom ref={bloomRef} width={totalWidth} height={WHITE_KEY_H + 20} />

          {/* White keys */}
          {whiteKeys.map((keyDef, i) => {
            const active = isActive(keyDef.note);
            return (
              <div
                key={keyDef.note}
                data-note={keyDef.note}
                role="button"
                aria-label={keyDef.note}
                aria-pressed={active}
                onPointerDown={(e) => { e.preventDefault(); playNote(keyDef.note); }}
                onPointerUp={() => releaseNote(keyDef.note)}
                onPointerLeave={() => releaseNote(keyDef.note)}
                style={{
                  position: 'absolute',
                  left: i * WHITE_KEY_W,
                  top: 0,
                  width: WHITE_KEY_W - 2,
                  height: WHITE_KEY_H,
                  background: active
                    ? 'linear-gradient(180deg, rgba(0,255,209,0.25) 0%, rgba(0,255,209,0.08) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderBottom: active ? '2px solid var(--color-lume-teal)' : '1px solid rgba(0,255,209,0.15)',
                  borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background var(--duration-fast) var(--ease-snap)',
                  boxShadow: active ? 'var(--glow-piano), inset 0 -4px 10px rgba(0,255,209,0.12)' : '0 2px 6px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 'var(--space-2)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'none',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.05em', textTransform: 'uppercase', color: active ? 'var(--color-lume-teal)' : 'rgba(184,192,224,0.3)' }}>
                  {keyDef.label}
                </span>
              </div>
            );
          })}

          {/* Black keys */}
          {blackKeys.map((keyDef) => {
            const active = isActive(keyDef.note);
            const pitchClass = keyDef.note.replace(/\d/g, '');
            const octave = parseInt(keyDef.note.match(/\d+/)?.[0] ?? '4');
            const octaveOffset = (octave - pianoOctave) * 7 * WHITE_KEY_W;
            const baseOffset = (BLACK_KEY_OFFSET_MAP[pitchClass] ?? 0) * WHITE_KEY_W;
            const leftPos = octaveOffset + baseOffset;

            if (leftPos < 0) return null;

            return (
              <div
                key={keyDef.note}
                data-note={keyDef.note}
                role="button"
                aria-label={keyDef.note}
                aria-pressed={active}
                onPointerDown={(e) => { e.preventDefault(); playNote(keyDef.note, 0.75); }}
                onPointerUp={() => releaseNote(keyDef.note)}
                onPointerLeave={() => releaseNote(keyDef.note)}
                style={{
                  position: 'absolute',
                  left: leftPos,
                  top: 0,
                  width: BLACK_KEY_W,
                  height: BLACK_KEY_H,
                  background: active
                    ? 'linear-gradient(180deg, rgba(0,255,209,0.35) 0%, rgba(0,80,60,0.7) 100%)'
                    : 'linear-gradient(180deg, #1a1a2e 0%, #07070F 100%)',
                  border: `1px solid ${active ? 'var(--color-lume-teal)' : 'rgba(255,255,255,0.08)'}`,
                  borderTop: active ? '2px solid var(--color-lume-teal)' : '1px solid rgba(0,255,209,0.15)',
                  borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'background var(--duration-fast) var(--ease-snap)',
                  boxShadow: active ? 'var(--glow-piano)' : '2px 4px 10px rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 'var(--space-2)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'none',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', color: active ? 'var(--color-lume-teal)' : 'rgba(107,114,128,0.5)' }}>
                  {keyDef.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint bar */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-mist)', textAlign: 'center' }}>
        A–; = white keys · W E T Y U I O = black keys · Z/X = octave · Space = sustain
      </div>
    </div>
  );
}
