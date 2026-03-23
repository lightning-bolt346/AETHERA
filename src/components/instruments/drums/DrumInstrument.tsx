'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  memo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SprayParticles, { type SprayParticlesHandle } from './SprayParticles';
import { useAudio } from '@/hooks/useAudio';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useInstrumentStore, DRUM_PAD_IDS, type DrumPadId, type StepCount } from '@/stores/instrumentStore';
import { DRUM_KEY_MAP } from '@/lib/note-mappings';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';
import type { Sequence, Gain } from 'tone';

const PAD_CONFIG: Record<DrumPadId, { label: string; color: string; subLabel: string }> = {
  kick:     { label: 'Kick',     color: '#FF6B8A', subLabel: 'J' },
  snare:    { label: 'Snare',    color: '#FFAA40', subLabel: 'K' },
  hhClosed: { label: 'Hi-Hat',   color: '#00FFD1', subLabel: 'S' },
  hhOpen:   { label: 'Open HH',  color: '#22D3EE', subLabel: 'D' },
  crash:    { label: 'Crash',    color: '#A78BFA', subLabel: 'F' },
  ride:     { label: 'Ride',     color: '#F59E0B', subLabel: 'G' },
  tomHi:    { label: 'Tom Hi',   color: '#FB923C', subLabel: 'H' },
  tomFloor: { label: 'Tom Flo',  color: '#34D399', subLabel: 'L' },
};

async function synthesizeDrum(padId: DrumPadId, velocity: number, channel: Gain): Promise<void> {
  const Tone = await import('tone');
  const ctx = Tone.getContext().rawContext as AudioContext;
  const now = ctx.currentTime;
  const vol = velocity * 0.8;

  const connectGain = (gain: GainNode) => {
    gain.connect(channel.input as unknown as AudioNode);
  };

  switch (padId) {
    case 'kick': {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.45);
      g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(g); connectGain(g); osc.start(now); osc.stop(now + 0.45); break;
    }
    case 'snare': {
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.22), ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 800;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.65, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      src.connect(filt); filt.connect(g); connectGain(g); src.start(now); break;
    }
    case 'hhClosed': {
      const dur = 0.055;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 7000;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.45, now); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filt); filt.connect(g); connectGain(g); src.start(now); break;
    }
    case 'hhOpen': {
      const dur = 0.35;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 5500;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.38, now); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filt); filt.connect(g); connectGain(g); src.start(now); break;
    }
    case 'crash': case 'ride': {
      const dur = padId === 'crash' ? 0.9 : 0.6;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 4500; filt.Q.value = 0.4;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.32, now); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filt); filt.connect(g); connectGain(g); src.start(now); break;
    }
    case 'tomHi': case 'tomFloor': {
      const freq = padId === 'tomHi' ? 180 : 100;
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
      g.gain.setValueAtTime(vol * 0.55, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(g); connectGain(g); osc.start(now); osc.stop(now + 0.3); break;
    }
  }
}

const DrumPad = memo(function DrumPad({
  padId, isActive, sprayRef, padRef, onTrigger, isMobile,
}: {
  padId: DrumPadId;
  isActive: boolean;
  sprayRef: React.RefObject<SprayParticlesHandle | null>;
  padRef: React.RefObject<HTMLDivElement | null>;
  onTrigger: (padId: DrumPadId) => void;
  isMobile: boolean;
}) {
  const cfg = PAD_CONFIG[padId];

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    onTrigger(padId);
    if (sprayRef.current && padRef.current) {
      const r = padRef.current.getBoundingClientRect();
      const container = padRef.current.closest('[data-drum-container]') as HTMLElement | null;
      if (container) {
        const cr = container.getBoundingClientRect();
        sprayRef.current.burst(r.left - cr.left + r.width / 2, r.top - cr.top + r.height / 2, cfg.color);
      }
    }
  }, [padId, onTrigger, sprayRef, padRef, cfg.color]);

  return (
    <motion.div
      ref={padRef}
      role="button"
      aria-label={`${cfg.label} drum pad`}
      aria-pressed={isActive}
      data-testid={`drum-pad-${padId}`}
      onPointerDown={handlePointerDown}
      animate={isActive ? { scaleY: 0.86, scaleX: 0.97 } : { scaleY: 1, scaleX: 1 }}
      transition={{ duration: 0.07, ease: [0.2, 0, 0, 1] }}
      style={{
        width: '100%',
        minHeight: isMobile ? '80px' : '100px',
        background: isActive ? `color-mix(in srgb, ${cfg.color} 22%, transparent)` : 'var(--glass-surface)',
        border: `1px solid ${isActive ? cfg.color : `${cfg.color}33`}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        boxShadow: isActive ? `0 0 24px ${cfg.color}99, 0 0 48px ${cfg.color}33` : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      <span style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 'var(--text-base)' : 'var(--text-sm)', fontWeight: 500, color: isActive ? cfg.color : 'var(--color-starfield)' }}>
        {cfg.label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: isActive ? cfg.color : 'var(--color-mist)', border: `1px solid ${isActive ? cfg.color + '66' : 'var(--glass-border)'}`, borderRadius: 'var(--radius-sm)', padding: '2px 6px' }}>
        {cfg.subLabel}
      </span>
    </motion.div>
  );
});

const DrumSequencer = memo(function DrumSequencer({ isMobile }: { isMobile: boolean }) {
  const drumGrid = useInstrumentStore((s) => s.drumGrid);
  const stepCount = useInstrumentStore((s) => s.drumStepCount);
  const currentStep = useInstrumentStore((s) => s.drumCurrentStep);
  const isPlaying = useInstrumentStore((s) => s.drumsPlaying);
  const bpm = useInstrumentStore((s) => s.drumBpm);
  const toggleCell = useInstrumentStore((s) => s.toggleDrumCell);
  const setDrumStepCount = useInstrumentStore((s) => s.setDrumStepCount);
  const setDrumBpm = useInstrumentStore((s) => s.setDrumBpm);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {([8, 16, 32] as StepCount[]).map((count) => (
            <GlowButton key={count} variant={stepCount === count ? 'primary' : 'ghost'} accentColor="var(--color-coral-bloom)" size="sm"
              onClick={() => setDrumStepCount(count)} style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', minHeight: 36, minWidth: 36 }}>
              {count}
            </GlowButton>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 120 }}>
          <span className="label-mono" style={{ color: 'var(--color-mist)', whiteSpace: 'nowrap' }}>BPM</span>
          <input type="range" min={40} max={200} value={bpm} onChange={(e) => setDrumBpm(Number(e.target.value))} aria-label="BPM" style={{ color: 'var(--color-coral-bloom)', accentColor: 'var(--color-coral-bloom)', flex: 1 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-coral-bloom)', minWidth: 28 }}>{bpm}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="scroll-x">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: stepCount * (isMobile ? 28 : 34) }}>
          {DRUM_PAD_IDS.map((padId) => {
            const cfg = PAD_CONFIG[padId];
            return (
              <div key={padId} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <span className="label-mono" style={{ color: cfg.color, width: isMobile ? 40 : 52, flexShrink: 0, textAlign: 'right', paddingRight: 6, fontSize: '8px' }}>
                  {isMobile ? cfg.subLabel : cfg.label}
                </span>
                {Array.from({ length: stepCount }, (_, step) => {
                  const isOn = drumGrid[padId][step] ?? false;
                  const isCurrent = isPlaying && step === currentStep;
                  return (
                    <button key={step} onClick={() => toggleCell(padId, step)}
                      aria-label={`${cfg.label} step ${step + 1}`}
                      style={{
                        width: isMobile ? 26 : 32, height: isMobile ? 26 : 32,
                        background: isOn ? `${cfg.color}66` : isCurrent ? 'rgba(255,255,255,0.08)' : 'var(--glass-surface)',
                        border: `1px solid ${isOn ? cfg.color : isCurrent ? 'rgba(255,255,255,0.2)' : 'var(--glass-border)'}`,
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer', flexShrink: 0,
                        transition: 'background 80ms', outline: isCurrent ? `1px solid ${cfg.color}` : 'none', outlineOffset: 1,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export interface DrumInstrumentProps {
  onHit?: (padId: string) => void;
}

export default function DrumInstrument({ onHit }: DrumInstrumentProps) {
  const { ensureInitialized, getOrCreateChannel } = useAudio();
  const { isMobile } = useBreakpoint();
  const drumGrid = useInstrumentStore((s) => s.drumGrid);
  const stepCount = useInstrumentStore((s) => s.drumStepCount);
  const bpm = useInstrumentStore((s) => s.drumBpm);
  const drumsPlaying = useInstrumentStore((s) => s.drumsPlaying);
  const setDrumStep = useInstrumentStore((s) => s.setDrumStep);
  const setDrumsPlaying = useInstrumentStore((s) => s.setDrumsPlaying);
  const [activePads, setActivePads] = useState<Set<DrumPadId>>(new Set());
  const [showSequencer, setShowSequencer] = useState(false);

  const channelRef = useRef<Gain | null>(null);
  const sequenceRef = useRef<Sequence<number> | null>(null);
  const sprayRef = useRef<SprayParticlesHandle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const padRefs = useRef<Record<DrumPadId, React.RefObject<HTMLDivElement | null>>>(
    Object.fromEntries(DRUM_PAD_IDS.map((id) => [id, React.createRef<HTMLDivElement>()])) as Record<DrumPadId, React.RefObject<HTMLDivElement | null>>
  );
  const lastHitTimes = useRef<Partial<Record<DrumPadId, number>>>({});

  useEffect(() => {
    let disposed = false;
    ensureInitialized().then(async () => {
      if (disposed) return;
      const channel = await getOrCreateChannel('drums');
      channelRef.current = channel;
    });
    return () => { disposed = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!channelRef.current) return;
    const setup = async () => {
      const Tone = await import('tone');
      const transport = Tone.getTransport();
      transport.bpm.value = bpm;
      sequenceRef.current?.dispose();
      const channel = channelRef.current;
      if (!channel) return;

      const seq = new Tone.Sequence<number>((time, step) => {
        Tone.getDraw().schedule(() => setDrumStep(step % stepCount), time);
        for (const padId of DRUM_PAD_IDS) {
          if (drumGrid[padId][step % stepCount]) {
            synthesizeDrum(padId, 0.8, channel);
            Tone.getDraw().schedule(() => {
              setActivePads((prev) => new Set([...prev, padId]));
              setTimeout(() => setActivePads((prev) => { const n = new Set(prev); n.delete(padId); return n; }), 120);
            }, time);
          }
        }
      }, Array.from({ length: stepCount }, (_, i) => i), '16n');

      sequenceRef.current = seq;
      if (drumsPlaying) { seq.start(0); transport.start(); }
    };
    setup();
    return () => { sequenceRef.current?.dispose(); };
  }, [bpm, stepCount, drumsPlaying, drumGrid, setDrumStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerPad = useCallback(async (padId: DrumPadId) => {
    await ensureInitialized();
    const channel = channelRef.current;
    if (!channel) return;
    const now = Date.now();
    const last = lastHitTimes.current[padId];
    const vel = last !== undefined ? Math.max(0.3, Math.min(1.0, 1 - (now - last) / 300)) : 0.8;
    lastHitTimes.current[padId] = now;
    if (padId === 'hhClosed') setActivePads((prev) => { const n = new Set(prev); n.delete('hhOpen'); return n; });
    synthesizeDrum(padId, vel, channel);
    onHit?.(padId);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(20);
    setActivePads((prev) => new Set([...prev, padId]));
    setTimeout(() => setActivePads((prev) => { const n = new Set(prev); n.delete(padId); return n; }), 150);
  }, [ensureInitialized, onHit]);

  const toggleTransport = useCallback(async () => {
    await ensureInitialized();
    const Tone = await import('tone');
    const transport = Tone.getTransport();
    if (drumsPlaying) { transport.stop(); setDrumsPlaying(false); setDrumStep(0); }
    else { sequenceRef.current?.start(0); transport.start(); setDrumsPlaying(true); }
  }, [drumsPlaying, setDrumsPlaying, setDrumStep, ensureInitialized]);

  useKeyboard(
    (key) => {
      const padId = DRUM_KEY_MAP[key];
      if (padId) {
        triggerPad(padId as DrumPadId);
        const padRef = padRefs.current[padId as DrumPadId];
        if (sprayRef.current && padRef?.current && containerRef.current) {
          const r = padRef.current.getBoundingClientRect();
          const cr = containerRef.current.getBoundingClientRect();
          sprayRef.current.burst(r.left - cr.left + r.width / 2, r.top - cr.top + r.height / 2, PAD_CONFIG[padId as DrumPadId].color);
        }
      }
    },
    () => {}
  );

  const containerW = isMobile ? 380 : 540;
  const containerH = isMobile ? 320 : 230;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', width: '100%', maxWidth: isMobile ? '100%' : 680 }}>
      {/* Transport controls */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
        <GlowButton variant="primary" accentColor="var(--color-coral-bloom)" onClick={toggleTransport} data-testid="drum-transport-toggle" style={{ minHeight: 44 }}>
          {drumsPlaying ? '■ Stop' : '▶ Play'}
        </GlowButton>
        <GlowButton variant="ghost" accentColor="var(--color-coral-bloom)" onClick={() => setShowSequencer(!showSequencer)} style={{ minHeight: 44 }}>
          {showSequencer ? 'Hide Seq' : 'Sequencer'}
        </GlowButton>
      </div>

      {/* Pad grid with spray particles */}
      <div
        ref={containerRef}
        data-drum-container
        style={{ position: 'relative', width: '100%', maxWidth: containerW }}
      >
        <SprayParticles ref={sprayRef} width={containerW} height={containerH} />
        <div
          className="drum-pad-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gridTemplateRows: isMobile ? 'repeat(4, auto)' : 'repeat(2, auto)',
            gap: 'var(--space-3)',
          }}
        >
          {DRUM_PAD_IDS.map((padId) => (
            <DrumPad
              key={padId}
              padId={padId}
              isActive={activePads.has(padId)}
              sprayRef={sprayRef}
              padRef={padRefs.current[padId]}
              onTrigger={triggerPad}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>

      {/* Sequencer panel */}
      <AnimatePresence>
        {showSequencer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden', width: '100%' }}
          >
            <GlassCard accent="drums" size="md">
              <DrumSequencer isMobile={isMobile} />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {!isMobile && (
        <div className="label-mono" style={{ color: 'var(--color-mist)', textAlign: 'center' }}>
          J=Kick · K=Snare · S=HH · D=OpenHH · F=Crash · G=Ride · H=Tom · L=Floor
        </div>
      )}
    </div>
  );
}
