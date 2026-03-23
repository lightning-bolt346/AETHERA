'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/hooks/useAudio';
import { useBreakpoint, useContainerWidth } from '@/hooks/useBreakpoint';
import { useInstrumentStore } from '@/stores/instrumentStore';
import { GUITAR_NOTE_MATRIX, GUITAR_OPEN_STRINGS } from '@/lib/note-mappings';
import { detectChord } from '@/lib/chord-dictionary';
import { GUITAR_SAMPLE_URLS, GUITAR_BASE_URL } from '@/lib/sample-loader';
import GlassCard from '@/components/ui/GlassCard';
import type { Sampler, Gain } from 'tone';

const NUM_STRINGS = 6;
const NUM_FRETS = 12;
const FRET_DOT_POSITIONS = [3, 5, 7, 9, 12];

interface StringWave {
  stringIndex: number;
  startTime: number;
}

export interface GuitarInstrumentProps {
  onNotePlay?: (note: string) => void;
}

export default function GuitarInstrument({ onNotePlay }: GuitarInstrumentProps) {
  const { ensureInitialized, getOrCreateChannel } = useAudio();
  const { isMobile, isTablet } = useBreakpoint();
  const guitarFrets = useInstrumentStore((s) => s.guitarFrets);
  const setGuitarFret = useInstrumentStore((s) => s.setGuitarFret);
  const setDetectedChord = useInstrumentStore((s) => s.setDetectedChord);
  const detectedChord = useInstrumentStore((s) => s.detectedChord);

  const samplerRef = useRef<Sampler | null>(null);
  const channelRef = useRef<Gain | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fretboardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stringWavesRef = useRef<StringWave[]>([]);
  const containerWidth = useContainerWidth(wrapperRef, 700);

  const [isLoaded, setIsLoaded] = useState(false);
  const [strumPointerDown, setStrumPointerDown] = useState(false);
  const strumLastY = useRef(0);

  // Responsive canvas dimensions
  const CANVAS_W = isMobile
    ? Math.max(containerWidth - 8, 300)
    : isTablet
    ? Math.max(containerWidth - 8, 500)
    : 700;
  const CANVAS_H = isMobile ? 280 : isTablet ? 320 : 400;
  // On mobile: full-half strum zone
  const STRUM_W = isMobile ? Math.floor(CANVAS_W * 0.45) : 80;
  const FRET_AREA_W = CANVAS_W - STRUM_W;
  const STRING_SPACING = CANVAS_H / (NUM_STRINGS + 1);
  const FRET_SPACING = (FRET_AREA_W - 50) / NUM_FRETS;
  const NUT_X = 50;

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
      const sampler = new Tone.Sampler({ urls: GUITAR_SAMPLE_URLS, baseUrl: GUITAR_BASE_URL, release: 1.5, onload: () => { if (!disposed) setIsLoaded(true); }, onerror: () => { if (!disposed) setIsLoaded(true); } });
      sampler.connect(reverb); reverb.connect(channel);
      samplerRef.current = sampler;
    };
    setup();
    return () => { disposed = true; samplerRef.current?.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const chord = detectChord(guitarFrets);
    setDetectedChord(chord);
  }, [guitarFrets, setDetectedChord]);

  const pluckString = useCallback(async (stringIndex: number, fret: number | null, velocity = 0.8) => {
    const activeFret = fret ?? guitarFrets[stringIndex] ?? 0;
    const noteIdx = activeFret < 0 ? 0 : activeFret;
    const note = GUITAR_NOTE_MATRIX[stringIndex]?.[noteIdx];
    if (!note) return;
    await ensureInitialized();
    const sampler = samplerRef.current;
    if (sampler?.loaded) {
      sampler.triggerAttackRelease(note, '2n', undefined, velocity);
    } else {
      const Tone = await import('tone');
      const channel = channelRef.current;
      const osc = new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.005, decay: 0.15, sustain: 0.5, release: 1.5 } });
      if (channel) osc.connect(channel);
      osc.triggerAttackRelease(note, '2n', Tone.now(), velocity);
      setTimeout(() => osc.dispose(), 3000);
    }
    stringWavesRef.current.push({ stringIndex, startTime: Date.now() });
    if (stringWavesRef.current.length > 20) stringWavesRef.current.splice(0, 1);
    onNotePlay?.(note);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15);
  }, [guitarFrets, ensureInitialized, onNotePlay]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Frets
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
      for (let fret = 0; fret <= NUM_FRETS; fret++) {
        const x = NUT_X + fret * FRET_SPACING;
        ctx.beginPath(); ctx.moveTo(x, STRING_SPACING * 0.5); ctx.lineTo(x, STRING_SPACING * (NUM_STRINGS + 0.5)); ctx.stroke();
      }

      // Nut
      ctx.strokeStyle = 'rgba(245,158,11,0.4)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(NUT_X, STRING_SPACING * 0.5); ctx.lineTo(NUT_X, STRING_SPACING * (NUM_STRINGS + 0.5)); ctx.stroke();

      // Dot markers
      for (const dotFret of FRET_DOT_POSITIONS) {
        const x = NUT_X + (dotFret - 0.5) * FRET_SPACING;
        const isDbl = dotFret === 12;
        if (isDbl) {
          [2.5, 4.5].forEach((dy) => {
            ctx.beginPath(); ctx.arc(x, dy * STRING_SPACING, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(245,158,11,0.25)'; ctx.fill();
          });
        } else {
          ctx.beginPath(); ctx.arc(x, 3.5 * STRING_SPACING, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245,158,11,0.25)'; ctx.fill();
        }
      }

      // Strings with wave animation
      const now = Date.now();
      for (let s = 0; s < NUM_STRINGS; s++) {
        const y = (s + 1) * STRING_SPACING;
        const thickness = [3, 2.5, 2, 1.5, 1.2, 1][s] ?? 1;
        const wave = stringWavesRef.current.find((w) => w.stringIndex === s);
        const elapsed = wave ? (now - wave.startTime) / 1000 : 1;
        const dampening = Math.max(0, 1 - elapsed / 0.8);
        const amplitude = 4 * dampening;

        ctx.beginPath(); ctx.lineWidth = thickness;
        ctx.strokeStyle = `rgba(245,158,11,${0.6 + dampening * 0.4})`;
        ctx.shadowColor = dampening > 0.01 ? 'rgba(245,158,11,0.5)' : 'transparent';
        ctx.shadowBlur = dampening > 0.01 ? 4 * dampening : 0;

        ctx.moveTo(NUT_X, y);
        for (let px = NUT_X; px <= FRET_AREA_W; px += 2) {
          const nx = (px - NUT_X) / (FRET_AREA_W - NUT_X);
          const waveY = amplitude * Math.sin(8 * nx * Math.PI + elapsed * 20) * Math.sin(nx * Math.PI);
          ctx.lineTo(px, y + waveY);
        }
        ctx.stroke(); ctx.shadowBlur = 0;
      }

      // Pressed fret circles
      for (let s = 0; s < NUM_STRINGS; s++) {
        const fret = guitarFrets[s];
        if (!fret || fret <= 0) continue;
        const x = NUT_X + (fret - 0.5) * FRET_SPACING;
        const y = (s + 1) * STRING_SPACING;
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245,158,11,0.85)';
        ctx.shadowColor = 'rgba(245,158,11,0.6)'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
      }

      // Strum zone indicator
      ctx.fillStyle = 'rgba(245,158,11,0.03)';
      ctx.fillRect(FRET_AREA_W, 0, STRUM_W, CANVAS_H);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [guitarFrets, CANVAS_W, CANVAS_H, STRING_SPACING, FRET_SPACING, NUT_X, FRET_AREA_W, STRUM_W]);

  const handleFretboardClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = fretboardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Ignore clicks in strum zone
    if (x > FRET_AREA_W) return;
    const stringIndex = Math.round(y / STRING_SPACING) - 1;
    const fretIndex = Math.floor((x - NUT_X) / FRET_SPACING) + 1;
    if (stringIndex < 0 || stringIndex >= NUM_STRINGS) return;
    if (fretIndex < 0 || fretIndex > NUM_FRETS) return;
    const current = guitarFrets[stringIndex];
    setGuitarFret(stringIndex, current === fretIndex ? 0 : fretIndex);
  }, [guitarFrets, FRET_AREA_W, FRET_SPACING, NUT_X, STRING_SPACING, setGuitarFret]);

  const handleStrumDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setStrumPointerDown(true);
    strumLastY.current = e.clientY;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const handleStrumMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!strumPointerDown) return;
    const deltaY = e.clientY - strumLastY.current;
    const speed = Math.abs(deltaY) / 16;
    if (Math.abs(deltaY) > 8) {
      const velocity = Math.min(1.0, speed / 5);
      const staggerDelay = speed > 3 ? 20 : 60;
      const isDown = deltaY > 0;
      const stringsToPlay = isDown ? Array.from({ length: NUM_STRINGS }, (_, i) => i) : Array.from({ length: NUM_STRINGS }, (_, i) => NUM_STRINGS - 1 - i);
      stringsToPlay.forEach((s, i) => setTimeout(() => pluckString(s, null, velocity), i * staggerDelay));
      strumLastY.current = e.clientY;
    }
  }, [strumPointerDown, pluckString]);

  const handleStrumUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setStrumPointerDown(false);
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', width: '100%', maxWidth: CANVAS_W + 20 }}
    >
      {/* Chord display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minHeight: 40 }}>
        <AnimatePresence mode="wait">
          {detectedChord && (
            <motion.div key={detectedChord} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 700, color: 'var(--color-iris-gold)', letterSpacing: '-0.02em', textShadow: 'var(--glow-guitar)' }}>
              {detectedChord}
            </motion.div>
          )}
        </AnimatePresence>
        {!isLoaded && (
          <span className="label-mono" style={{ color: 'var(--color-mist)', animation: 'pulse-ambient 1.5s ease-in-out infinite' }}>Loading…</span>
        )}
      </div>

      {/* Fretboard */}
      <GlassCard accent="guitar" size="sm" style={{ padding: 0, overflow: 'hidden', width: '100%' }}>
        <div
          ref={fretboardRef}
          style={{ position: 'relative', cursor: 'pointer', overflowX: isMobile ? 'auto' : 'visible' }}
          className={isMobile ? 'guitar-fretboard-scroll' : undefined}
          onClick={handleFretboardClick}
        >
          {/* Canvas + strum zone side-by-side */}
          <div
            className="guitar-wrapper"
            style={{ display: 'flex', alignItems: 'stretch' }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                style={{ display: 'block' }}
                aria-label="Guitar fretboard"
              />
              {/* String labels */}
              {Array.from({ length: NUM_STRINGS }, (_, s) => (
                <div key={s} style={{ position: 'absolute', left: 6, top: (s + 1) * STRING_SPACING - 8, fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(245,158,11,0.5)', pointerEvents: 'none', letterSpacing: '0.05em' }}>
                  {GUITAR_OPEN_STRINGS[s]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Strum zone — below fretboard on mobile, right side on desktop */}
      <div
        className="guitar-strum-zone"
        style={{
          width: isMobile ? '100%' : '80px',
          height: isMobile ? 64 : CANVAS_H,
          background: 'rgba(245,158,11,0.04)',
          border: `1px solid rgba(245,158,11,0.15)`,
          borderRadius: 'var(--radius-md)',
          cursor: 'ew-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onPointerDown={handleStrumDown}
        onPointerMove={handleStrumMove}
        onPointerUp={handleStrumUp}
        onPointerCancel={handleStrumUp}
        aria-label="Strum zone"
        role="button"
      >
        <span className="label-mono" style={{ color: 'rgba(245,158,11,0.4)' }}>
          {isMobile ? '← Swipe to Strum →' : '↕ Strum'}
        </span>
      </div>

      {/* Open string tap buttons (mobile-friendly) */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {Array.from({ length: NUM_STRINGS }, (_, s) => (
          <button
            key={s}
            onClick={() => pluckString(s, 0)}
            style={{ minWidth: 52, minHeight: 44, background: 'var(--glass-surface)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
            aria-label={`Pluck ${GUITAR_OPEN_STRINGS[s]} string open`}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-iris-gold)', letterSpacing: '0.06em' }}>{GUITAR_OPEN_STRINGS[s]}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--color-mist)' }}>str{s + 1}</span>
          </button>
        ))}
      </div>

      <div className="label-mono" style={{ color: 'var(--color-mist)', textAlign: 'center' }}>
        {isMobile ? 'Tap frets to press · Swipe strum zone' : 'Click fretboard to press frets · Drag strum zone up/down'}
      </div>
    </div>
  );
}
