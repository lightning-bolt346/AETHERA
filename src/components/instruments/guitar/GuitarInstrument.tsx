'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/hooks/useAudio';
import { useInstrumentStore } from '@/stores/instrumentStore';
import { GUITAR_NOTE_MATRIX, GUITAR_OPEN_STRINGS } from '@/lib/note-mappings';
import { detectChord } from '@/lib/chord-dictionary';
import {
  GUITAR_SAMPLE_URLS,
  GUITAR_BASE_URL,
} from '@/lib/sample-loader';
import GlassCard from '@/components/ui/GlassCard';
import type { Sampler, Gain } from 'tone';

const NUM_STRINGS = 6;
const NUM_FRETS = 12;
const STRING_HEIGHTS = [3, 2.5, 2, 1.5, 1.2, 1]; // px, string 6 (low) to 1 (high)
const FRET_DOT_POSITIONS = [3, 5, 7, 9, 12];
const STRING_COLORS = Array(6).fill('var(--color-iris-gold)');

interface StringWave {
  stringIndex: number;
  startTime: number;
  pluckY: number;
}

export interface GuitarInstrumentProps {
  onNotePlay?: (note: string) => void;
}

export default function GuitarInstrument({ onNotePlay }: GuitarInstrumentProps) {
  const { ensureInitialized, getOrCreateChannel } = useAudio();
  const guitarFrets = useInstrumentStore((s) => s.guitarFrets);
  const setGuitarFret = useInstrumentStore((s) => s.setGuitarFret);
  const setDetectedChord = useInstrumentStore((s) => s.setDetectedChord);
  const detectedChord = useInstrumentStore((s) => s.detectedChord);

  const samplerRef = useRef<Sampler | null>(null);
  const channelRef = useRef<Gain | null>(null);
  const fretboardRef = useRef<HTMLDivElement>(null);
  const stringWavesRef = useRef<StringWave[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const [isLoaded, setIsLoaded] = useState(false);
  const [strumStart, setStrumStart] = useState<number | null>(null);
  const [lastStrumY, setLastStrumY] = useState(0);

  // Canvas dimensions
  const CANVAS_W = 700;
  const CANVAS_H = 400;
  const STRING_SPACING = CANVAS_H / (NUM_STRINGS + 1);
  const FRET_SPACING = (CANVAS_W - 60) / NUM_FRETS;
  const NUT_X = 60;

  useEffect(() => {
    let disposed = false;
    const setup = async () => {
      await ensureInitialized();
      if (disposed) return;
      const Tone = await import('tone');
      const channel = await getOrCreateChannel('guitar');
      channelRef.current = channel;

      const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.15 });
      await reverb.ready;

      const sampler = new Tone.Sampler({
        urls: GUITAR_SAMPLE_URLS,
        baseUrl: GUITAR_BASE_URL,
        release: 1.5,
        onload: () => { if (!disposed) setIsLoaded(true); },
        onerror: () => { if (!disposed) setIsLoaded(true); },
      });
      sampler.connect(reverb);
      reverb.connect(channel);
      samplerRef.current = sampler;
    };
    setup();
    return () => {
      disposed = true;
      samplerRef.current?.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update chord detection when frets change
  useEffect(() => {
    const chord = detectChord(guitarFrets);
    setDetectedChord(chord);
  }, [guitarFrets, setDetectedChord]);

  const pluckString = useCallback(
    async (stringIndex: number, fret: number | null, velocity = 0.8) => {
      const activeFret = fret ?? guitarFrets[stringIndex] ?? 0;
      const noteIdx = activeFret < 0 ? 0 : activeFret;
      const note = GUITAR_NOTE_MATRIX[stringIndex]?.[noteIdx];
      if (!note) return;

      await ensureInitialized();
      const sampler = samplerRef.current;
      if (sampler?.loaded) {
        sampler.triggerAttackRelease(note, '2n', undefined, velocity);
      } else {
        // Fallback synthesis
        const Tone = await import('tone');
        const channel = channelRef.current;
        const osc = new Tone.Synth({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.005, decay: 0.15, sustain: 0.5, release: 1.5 },
        });
        if (channel) osc.connect(channel);
        osc.triggerAttackRelease(note, '2n', Tone.now(), velocity);
        setTimeout(() => osc.dispose(), 3000);
      }

      // Spawn string wave animation
      const y = (stringIndex + 1) * STRING_SPACING;
      stringWavesRef.current.push({ stringIndex, startTime: Date.now(), pluckY: y });
      if (stringWavesRef.current.length > 20) stringWavesRef.current.splice(0, 1);

      onNotePlay?.(note);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15);
    },
    [guitarFrets, ensureInitialized, onNotePlay]
  );

  // Canvas animation: string wave + fretboard drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Draw frets
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let fret = 0; fret <= NUM_FRETS; fret++) {
        const x = NUT_X + fret * FRET_SPACING;
        ctx.beginPath();
        ctx.moveTo(x, STRING_SPACING * 0.5);
        ctx.lineTo(x, STRING_SPACING * (NUM_STRINGS + 0.5));
        ctx.stroke();
      }

      // Nut
      ctx.strokeStyle = 'rgba(245,158,11,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(NUT_X, STRING_SPACING * 0.5);
      ctx.lineTo(NUT_X, STRING_SPACING * (NUM_STRINGS + 0.5));
      ctx.stroke();

      // Fret dot markers
      for (const dotFret of FRET_DOT_POSITIONS) {
        const x = NUT_X + (dotFret - 0.5) * FRET_SPACING;
        const y = STRING_SPACING * 3.5;
        const isDbl = dotFret === 12;
        if (isDbl) {
          [STRING_SPACING * 2.5, STRING_SPACING * 4.5].forEach((dy) => {
            ctx.beginPath();
            ctx.arc(x, dy, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(245,158,11,0.25)';
            ctx.fill();
          });
        } else {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245,158,11,0.25)';
          ctx.fill();
        }
      }

      // Draw strings with wave animation
      const now = Date.now();
      for (let s = 0; s < NUM_STRINGS; s++) {
        const y = (s + 1) * STRING_SPACING;
        const thickness = STRING_HEIGHTS[s] ?? 1;
        const wave = stringWavesRef.current.find((w) => w.stringIndex === s);
        const elapsed = wave ? (now - wave.startTime) / 1000 : 1000;
        const dampening = Math.max(0, 1 - elapsed / 0.8);
        const amplitude = 4 * dampening;
        const frequency = 8 + s * 2;

        ctx.beginPath();
        ctx.lineWidth = thickness;
        ctx.strokeStyle = dampening > 0.01
          ? `rgba(245,158,11,${0.6 + dampening * 0.4})`
          : 'rgba(245,158,11,0.6)';

        if (dampening > 0.01) {
          ctx.shadowColor = 'rgba(245,158,11,0.5)';
          ctx.shadowBlur = 4 * dampening;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.moveTo(NUT_X, y);
        for (let px = NUT_X; px <= CANVAS_W - 20; px += 2) {
          const normalizedX = (px - NUT_X) / (CANVAS_W - 20 - NUT_X);
          const waveY = amplitude * Math.sin(frequency * normalizedX * Math.PI + elapsed * 20) * Math.sin(normalizedX * Math.PI);
          ctx.lineTo(px, y + waveY);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw pressed frets
      for (let s = 0; s < NUM_STRINGS; s++) {
        const fret = guitarFrets[s];
        if (fret === null || fret === 0) continue;
        const x = NUT_X + (fret - 0.5) * FRET_SPACING;
        const y = (s + 1) * STRING_SPACING;

        // Glow circle at pressed fret
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245,158,11,0.85)';
        ctx.shadowColor = 'rgba(245,158,11,0.6)';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [guitarFrets]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFretboardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = fretboardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const stringIndex = Math.round(y / STRING_SPACING) - 1;
      const fretIndex = Math.floor((x - NUT_X) / FRET_SPACING) + 1;

      if (stringIndex < 0 || stringIndex >= NUM_STRINGS) return;
      if (fretIndex < 0 || fretIndex > NUM_FRETS) return;

      // Toggle fret: if same, reset to open (0)
      const current = guitarFrets[stringIndex];
      const newFret = current === fretIndex ? 0 : fretIndex;
      setGuitarFret(stringIndex, newFret);
    },
    [guitarFrets, setGuitarFret]
  );

  // Strum zone: rightmost 80px — pointer drag triggers strum
  const handleStrumPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setStrumStart(e.clientY);
      setLastStrumY(e.clientY);
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const handleStrumPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (strumStart === null) return;
      const deltaY = e.clientY - lastStrumY;
      const dt = 16;
      const speed = Math.abs(deltaY) / dt;

      if (Math.abs(deltaY) > 8) {
        const velocity = Math.min(1.0, speed / 5);
        const staggerDelay = speed > 3 ? 20 : 60;
        const isDownStrum = deltaY > 0;

        const stringsToPlay = isDownStrum
          ? Array.from({ length: NUM_STRINGS }, (_, i) => i)
          : Array.from({ length: NUM_STRINGS }, (_, i) => NUM_STRINGS - 1 - i);

        stringsToPlay.forEach((s, i) => {
          setTimeout(() => pluckString(s, null, velocity), i * staggerDelay);
        });
        setLastStrumY(e.clientY);
      }
    },
    [strumStart, lastStrumY, pluckString]
  );

  const handleStrumPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setStrumStart(null);
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    },
    []
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', width: '100%', maxWidth: CANVAS_W + 100 }}>
      {/* Chord display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <AnimatePresence mode="wait">
          {detectedChord && (
            <motion.div
              key={detectedChord}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--color-iris-gold)',
                letterSpacing: '-0.02em',
                textShadow: 'var(--glow-guitar)',
              }}
            >
              {detectedChord}
            </motion.div>
          )}
        </AnimatePresence>
        {!isLoaded && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)', letterSpacing: '0.08em', textTransform: 'uppercase', animation: 'pulse-ambient 1.5s ease-in-out infinite' }}>
            Loading samples…
          </span>
        )}
      </div>

      {/* Fretboard + strum zone */}
      <GlassCard accent="guitar" size="sm" style={{ padding: 0, overflow: 'hidden', display: 'flex' }}>
        {/* Fretboard */}
        <div
          ref={fretboardRef}
          style={{ position: 'relative', cursor: 'pointer' }}
          onClick={handleFretboardClick}
        >
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ display: 'block' }} aria-label="Guitar fretboard" />
          {/* String labels */}
          {Array.from({ length: NUM_STRINGS }, (_, s) => (
            <div
              key={s}
              style={{
                position: 'absolute',
                left: 8,
                top: (s + 1) * STRING_SPACING - 8,
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: 'rgba(245,158,11,0.5)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                pointerEvents: 'none',
              }}
            >
              {GUITAR_OPEN_STRINGS[s]}
            </div>
          ))}
        </div>

        {/* Strum zone */}
        <div
          style={{
            width: 80,
            background: 'rgba(245,158,11,0.04)',
            borderLeft: '1px solid rgba(245,158,11,0.15)',
            cursor: 'ew-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
            userSelect: 'none',
          }}
          onPointerDown={handleStrumPointerDown}
          onPointerMove={handleStrumPointerMove}
          onPointerUp={handleStrumPointerUp}
          onPointerCancel={handleStrumPointerUp}
          aria-label="Strum zone"
          role="button"
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,158,11,0.4)', writingMode: 'vertical-lr' }}>
            ↕ Strum
          </span>
        </div>
      </GlassCard>

      {/* Open string buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        {Array.from({ length: NUM_STRINGS }, (_, s) => (
          <GlassCard
            key={s}
            accent="guitar"
            size="sm"
            interactive
            style={{ cursor: 'pointer', padding: '8px 12px', textAlign: 'center' }}
            onClick={() => pluckString(s, 0)}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-iris-gold)', letterSpacing: '0.06em' }}>
              {GUITAR_OPEN_STRINGS[s]}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-mist)', letterSpacing: '0.05em', marginTop: 2 }}>
              str {s + 1}
            </div>
          </GlassCard>
        ))}
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-mist)', textAlign: 'center' }}>
        Click fretboard to press frets · Drag strum zone up/down to strum
      </div>
    </div>
  );
}
