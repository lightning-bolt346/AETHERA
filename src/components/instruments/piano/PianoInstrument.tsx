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
import { useBreakpoint, useContainerWidth } from '@/hooks/useBreakpoint';
import { useInstrumentStore } from '@/stores/instrumentStore';
import { buildPianoKeys, type PianoKeyDef } from '@/lib/note-mappings';
import { PIANO_SAMPLE_URLS, PIANO_BASE_URL } from '@/lib/sample-loader';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';
import type { Sampler, Reverb, Gain } from 'tone';

// Desktop key sizes
const WHITE_KEY_W_DESKTOP = 56;
const WHITE_KEY_H_DESKTOP = 180;
const BLACK_KEY_W_DESKTOP = 34;
const BLACK_KEY_H_DESKTOP = 110;

// Mobile key sizes (1 octave fills full width)
const WHITE_KEYS_PER_OCTAVE = 7;

const BLACK_KEY_OFFSET_MAP: Record<string, number> = {
  'C#': 0.65,
  'D#': 1.65,
  'F#': 3.65,
  'G#': 4.65,
  'A#': 5.65,
};

export interface PianoInstrumentProps {
  onNotePlay?: (note: string) => void;
  volume?: number;
}

export default function PianoInstrument({ onNotePlay, volume = 80 }: PianoInstrumentProps) {
  const { ensureInitialized, getOrCreateChannel } = useAudio();
  const { isMobile, isTablet } = useBreakpoint();
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
  const containerRef = useRef<HTMLDivElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef, 700);

  // Swipe detection for mobile octave change
  const touchStartX = useRef<number | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Responsive key sizing
  const whiteKeyCount = isMobile ? WHITE_KEYS_PER_OCTAVE : WHITE_KEYS_PER_OCTAVE * 2 + 1;
  const whiteKeyW = isMobile || isTablet
    ? Math.floor(containerWidth / WHITE_KEYS_PER_OCTAVE)
    : WHITE_KEY_W_DESKTOP;
  const whiteKeyH = isMobile ? 140 : isTablet ? 160 : WHITE_KEY_H_DESKTOP;
  const blackKeyW = Math.floor(whiteKeyW * 0.6);
  const blackKeyH = Math.floor(whiteKeyH * 0.62);

  // On mobile: show only 1 octave; on tablet/desktop: show 2 octaves
  const keys = useMemo(() => buildPianoKeys(pianoOctave), [pianoOctave]);
  const visibleKeys = useMemo(() => {
    if (isMobile) {
      return keys.filter((k) => parseInt(k.note.match(/\d+/)?.[0] ?? '4') === pianoOctave);
    }
    return keys;
  }, [keys, isMobile, pianoOctave]);

  const whiteKeys = visibleKeys.filter((k) => k.type === 'white');
  const blackKeys = visibleKeys.filter((k) => k.type === 'black');
  const totalWidth = whiteKeys.length * whiteKeyW;

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
          onload: () => { if (!disposed) setIsLoaded(true); },
          onerror: () => { if (!disposed) { setLoadError(true); setIsLoaded(true); } },
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
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const playNote = useCallback(
    async (note: string, velocity = 0.8) => {
      await ensureInitialized();

      const sampler = samplerRef.current;
      if (sampler?.loaded) {
        sampler.triggerAttack(note, undefined, velocity);
      } else {
        const Tone = await import('tone');
        const channel = channelRef.current;
        const osc = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 1.2 } });
        if (channel) osc.connect(channel);
        osc.triggerAttackRelease(note, '2n', Tone.now(), velocity);
        setTimeout(() => osc.dispose(), 3000);
      }

      addActiveNote(note);
      if (isSustainPedal) addSustainedNote(note);
      onNotePlay?.(note);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && isMobile) {
        navigator.vibrate(15);
      }

      // Ink bloom
      const keyEl = keyboardRef.current?.querySelector(`[data-note="${note}"]`) as HTMLElement | null;
      if (keyEl && bloomRef.current && containerRef.current) {
        const rect = keyEl.getBoundingClientRect();
        const cRect = containerRef.current.getBoundingClientRect();
        const x = rect.left - cRect.left + rect.width / 2;
        const y = rect.top - cRect.top + rect.height * 0.3;
        const octave = parseInt(note.match(/\d+/)?.[0] ?? '4');
        bloomRef.current.spawn(x, y, octave, ['C', 'D', 'E'].some((n) => note.startsWith(n)));
      }
    },
    [ensureInitialized, isSustainPedal, addActiveNote, addSustainedNote, onNotePlay, isMobile]
  );

  const releaseNote = useCallback(
    (note: string) => {
      removeActiveNote(note);
      if (isSustainPedal) return;
      samplerRef.current?.triggerRelease(note);
    },
    [removeActiveNote, isSustainPedal]
  );

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
        if (samplerRef.current) samplerRef.current.set({ release: 4.0 });
        return;
      }
      if (key === 'z') { setPianoOctave(pianoOctave - 1); return; }
      if (key === 'x') { setPianoOctave(pianoOctave + 1); return; }
      const note = keyNoteMap[key];
      if (note && !activeNotes.includes(note)) playNote(note, 0.8);
    },
    (key) => {
      if (key === ' ') {
        setSustainPedal(false);
        samplerRef.current?.set({ release: 1.2 });
        import('tone').then(({ now }) => {
          activeNotes.forEach((n) => {
            if (!sustainedNotes.includes(n)) samplerRef.current?.triggerRelease(n, now());
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

  // Swipe to change octave on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(deltaX) > 60) {
      if (deltaX < 0) setPianoOctave(pianoOctave + 1);
      else setPianoOctave(pianoOctave - 1);
    }
    touchStartX.current = null;
  }, [pianoOctave, setPianoOctave]);

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', width: '100%' }}
    >
      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Octave control */}
        <GlassCard accent="piano" size="sm">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <GlowButton variant="icon" accentColor="var(--color-lume-teal)" size="sm" onClick={() => setPianoOctave(pianoOctave - 1)} aria-label="Octave down">−</GlowButton>
            <div style={{ textAlign: 'center', minWidth: 50 }}>
              <div className="label-mono" style={{ color: 'var(--color-mist)' }}>OCT</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', color: 'var(--color-lume-teal)', fontWeight: 500 }}>{pianoOctave}</div>
            </div>
            <GlowButton variant="icon" accentColor="var(--color-lume-teal)" size="sm" onClick={() => setPianoOctave(pianoOctave + 1)} aria-label="Octave up">+</GlowButton>
          </div>
        </GlassCard>

        {/* Sustain indicator */}
        <GlassCard accent="piano" size="sm">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: isSustainPedal ? 'var(--color-lume-teal)' : 'var(--color-mist)', boxShadow: isSustainPedal ? 'var(--glow-piano)' : 'none', transition: 'all var(--duration-fast)' }} />
            <span className="label-mono" style={{ color: isSustainPedal ? 'var(--color-lume-teal)' : 'var(--color-mist)' }}>Sustain</span>
          </div>
        </GlassCard>

        {!isLoaded && !loadError && (
          <span className="label-mono" style={{ color: 'var(--color-mist)', animation: 'pulse-ambient 1.5s ease-in-out infinite' }}>Loading…</span>
        )}
        {loadError && (
          <span className="label-mono" style={{ color: 'var(--color-amber-pulse)' }}>Synth mode</span>
        )}
      </div>

      {/* Mobile swipe hint */}
      {isMobile && (
        <div className="label-mono" style={{ color: 'rgba(107,114,128,0.5)', textAlign: 'center' }}>
          ← Swipe for octave →
        </div>
      )}

      {/* Keyboard container */}
      <div
        style={{ position: 'relative', width: '100%', overflowX: isMobile ? 'hidden' : 'auto', overflowY: 'visible' }}
        className="no-scrollbar"
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        <div
          ref={keyboardRef}
          style={{ position: 'relative', width: isMobile ? '100%' : totalWidth, height: whiteKeyH + 20, margin: '0 auto' }}
        >
          <InkBloom ref={bloomRef} width={isMobile ? (containerWidth || 400) : totalWidth} height={whiteKeyH + 20} />

          {/* White keys */}
          {whiteKeys.map((keyDef, i) => {
            const active = isActive(keyDef.note);
            const keyWidth = isMobile ? Math.floor((containerWidth - 4) / WHITE_KEYS_PER_OCTAVE) : whiteKeyW;
            return (
              <div
                key={keyDef.note}
                data-note={keyDef.note}
                role="button"
                aria-label={`Piano key ${keyDef.note}`}
                aria-pressed={active}
                className="piano-key-white"
                onPointerDown={(e) => { e.preventDefault(); playNote(keyDef.note); }}
                onPointerUp={() => releaseNote(keyDef.note)}
                onPointerLeave={() => releaseNote(keyDef.note)}
                style={{
                  position: 'absolute',
                  left: i * keyWidth,
                  top: 0,
                  width: keyWidth - 2,
                  height: whiteKeyH,
                  background: active ? 'linear-gradient(180deg, rgba(0,255,209,0.25) 0%, rgba(0,255,209,0.08) 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderBottom: active ? '2px solid var(--color-lume-teal)' : '1px solid rgba(0,255,209,0.15)',
                  borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background var(--duration-fast) var(--ease-snap)',
                  boxShadow: active ? 'var(--glow-piano)' : '0 2px 6px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 'var(--space-2)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'none',
                  minHeight: 44,
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.05em', textTransform: 'uppercase', color: active ? 'var(--color-lume-teal)' : 'rgba(184,192,224,0.3)' }}>
                  {isMobile ? keyDef.note : keyDef.label}
                </span>
              </div>
            );
          })}

          {/* Black keys */}
          {blackKeys.map((keyDef) => {
            const active = isActive(keyDef.note);
            const pitchClass = keyDef.note.replace(/\d/g, '');
            const octave = parseInt(keyDef.note.match(/\d+/)?.[0] ?? '4');
            const octaveOffset = (octave - pianoOctave) * WHITE_KEYS_PER_OCTAVE * whiteKeyW;
            const baseOffset = (BLACK_KEY_OFFSET_MAP[pitchClass] ?? 0) * whiteKeyW;
            const leftPos = octaveOffset + baseOffset;
            if (leftPos < 0) return null;

            return (
              <div
                key={keyDef.note}
                data-note={keyDef.note}
                role="button"
                aria-label={`Piano key ${keyDef.note}`}
                aria-pressed={active}
                className="piano-key-black"
                onPointerDown={(e) => { e.preventDefault(); playNote(keyDef.note, 0.75); }}
                onPointerUp={() => releaseNote(keyDef.note)}
                onPointerLeave={() => releaseNote(keyDef.note)}
                style={{
                  position: 'absolute',
                  left: leftPos,
                  top: 0,
                  width: blackKeyW,
                  height: blackKeyH,
                  background: active ? 'linear-gradient(180deg, rgba(0,255,209,0.35) 0%, rgba(0,80,60,0.7) 100%)' : 'linear-gradient(180deg, #1a1a2e 0%, #07070F 100%)',
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
                  paddingBottom: 'var(--space-1)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'none',
                  minHeight: 44,
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', color: active ? 'var(--color-lume-teal)' : 'rgba(107,114,128,0.5)' }}>
                  {isMobile ? '' : keyDef.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile sustain button */}
      {isMobile && (
        <GlowButton
          accentColor="var(--color-lume-teal)"
          variant={isSustainPedal ? 'primary' : 'ghost'}
          style={{ minWidth: 120, minHeight: 48 }}
          onPointerDown={(e) => { e.preventDefault(); setSustainPedal(true); samplerRef.current?.set({ release: 4.0 }); }}
          onPointerUp={() => { setSustainPedal(false); samplerRef.current?.set({ release: 1.2 }); }}
          aria-label="Sustain pedal"
          aria-pressed={isSustainPedal}
        >
          {isSustainPedal ? '● Sustain' : 'Sustain'}
        </GlowButton>
      )}

      {!isMobile && (
        <div className="label-mono" style={{ color: 'var(--color-mist)', textAlign: 'center' }}>
          A–; = white keys · W E T Y U I O = black keys · Z/X = octave · Space = sustain
        </div>
      )}
    </div>
  );
}
