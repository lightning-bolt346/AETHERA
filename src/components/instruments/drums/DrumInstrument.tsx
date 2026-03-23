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
import { useInstrumentStore, DRUM_PAD_IDS, type DrumPadId, type StepCount } from '@/stores/instrumentStore';
import { DRUM_KEY_MAP } from '@/lib/note-mappings';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';
import type { Player, Sequence, Gain } from 'tone';

// Drum pad visual config
const PAD_CONFIG: Record<DrumPadId, { label: string; color: string; subLabel: string }> = {
  kick:     { label: 'Kick',    color: '#FF6B8A', subLabel: 'J' },
  snare:    { label: 'Snare',   color: '#FFAA40', subLabel: 'K' },
  hhClosed: { label: 'Hi-Hat',  color: '#00FFD1', subLabel: 'S' },
  hhOpen:   { label: 'Open HH', color: '#22D3EE', subLabel: 'D' },
  crash:    { label: 'Crash',   color: '#A78BFA', subLabel: 'F' },
  ride:     { label: 'Ride',    color: '#F59E0B', subLabel: 'G' },
  tomHi:    { label: 'Tom Hi',  color: '#FB923C', subLabel: 'H' },
  tomFloor: { label: 'Tom Flo', color: '#34D399', subLabel: 'L' },
};

// Synthesize each drum sound using Web Audio API
async function synthesizeDrum(
  padId: DrumPadId,
  velocity: number,
  channel: Gain
): Promise<void> {
  const Tone = await import('tone');
  const ctx = Tone.getContext().rawContext as AudioContext;
  const now = ctx.currentTime;
  const vol = velocity * 0.8;

  switch (padId) {
    case 'kick': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.45);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      (gain as unknown as AudioNode).connect(channel.input as unknown as AudioNode);
      osc.start(now); osc.stop(now + 0.45);
      break;
    }
    case 'snare': {
      const bufSize = Math.floor(ctx.sampleRate * 0.22);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2) - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 800;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      src.connect(filt); filt.connect(gain);
      (gain as unknown as AudioNode).connect(channel.input as unknown as AudioNode);
      src.start(now);
      break;
    }
    case 'hhClosed': {
      const bufSize = Math.floor(ctx.sampleRate * 0.055);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2) - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type = 'highpass'; filt.frequency.value = 7000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
      src.connect(filt); filt.connect(gain);
      (gain as unknown as AudioNode).connect(channel.input as unknown as AudioNode);
      src.start(now);
      break;
    }
    case 'hhOpen': {
      const bufSize = Math.floor(ctx.sampleRate * 0.35);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2) - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type = 'highpass'; filt.frequency.value = 5500;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      src.connect(filt); filt.connect(gain);
      (gain as unknown as AudioNode).connect(channel.input as unknown as AudioNode);
      src.start(now);
      break;
    }
    case 'crash':
    case 'ride': {
      const dur = padId === 'crash' ? 0.9 : 0.6;
      const bufSize = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2) - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass'; filt.frequency.value = 4500; filt.Q.value = 0.4;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filt); filt.connect(gain);
      (gain as unknown as AudioNode).connect(channel.input as unknown as AudioNode);
      src.start(now);
      break;
    }
    case 'tomHi':
    case 'tomFloor': {
      const freq = padId === 'tomHi' ? 180 : 100;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
      gain.gain.setValueAtTime(vol * 0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      (gain as unknown as AudioNode).connect(channel.input as unknown as AudioNode);
      osc.start(now); osc.stop(now + 0.3);
      break;
    }
  }
}

// Individual drum pad component
const DrumPad = memo(function DrumPad({
  padId,
  isActive,
  sprayRef,
  padRef,
  onTrigger,
}: {
  padId: DrumPadId;
  isActive: boolean;
  sprayRef: React.RefObject<SprayParticlesHandle | null>;
  padRef: React.RefObject<HTMLDivElement | null>;
  onTrigger: (padId: DrumPadId, velocity?: number) => void;
}) {
  const cfg = PAD_CONFIG[padId];

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      onTrigger(padId);
      // Spawn spray at pad center
      if (sprayRef.current && padRef.current) {
        const r = padRef.current.getBoundingClientRect();
        const container = padRef.current.closest('[data-drum-container]') as HTMLElement | null;
        if (container) {
          const cr = container.getBoundingClientRect();
          sprayRef.current.burst(
            r.left - cr.left + r.width / 2,
            r.top - cr.top + r.height / 2,
            cfg.color
          );
        }
      }
    },
    [padId, onTrigger, sprayRef, padRef, cfg.color]
  );

  return (
    <motion.div
      ref={padRef}
      role="button"
      aria-label={`${cfg.label} drum pad`}
      aria-pressed={isActive}
      data-testid={`drum-pad-${padId}`}
      onPointerDown={handlePointerDown}
      animate={isActive ? { scaleY: 0.85, scaleX: 0.97 } : { scaleY: 1, scaleX: 1 }}
      transition={{ duration: 0.08, ease: [0.2, 0, 0, 1] }}
      style={{
        width: '120px',
        height: '100px',
        background: isActive
          ? `color-mix(in srgb, ${cfg.color} 22%, transparent)`
          : 'var(--glass-surface)',
        border: `1px solid ${isActive ? cfg.color : `${cfg.color}33`}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        boxShadow: isActive
          ? `0 0 30px ${cfg.color}99, 0 0 60px ${cfg.color}33`
          : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', fontWeight: 500, color: isActive ? cfg.color : 'var(--color-starfield)' }}>
        {cfg.label}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: isActive ? cfg.color : 'var(--color-mist)',
        border: `1px solid ${isActive ? cfg.color + '66' : 'var(--glass-border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '2px 6px',
      }}>
        {cfg.subLabel}
      </span>
    </motion.div>
  );
});

// Sequencer grid
const DrumSequencer = memo(function DrumSequencer() {
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
      {/* Sequencer header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {([8, 16, 32] as StepCount[]).map((count) => (
            <GlowButton
              key={count}
              variant={stepCount === count ? 'primary' : 'ghost'}
              accentColor="var(--color-coral-bloom)"
              size="sm"
              onClick={() => setDrumStepCount(count)}
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
            >
              {count}
            </GlowButton>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 160 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-mist)', whiteSpace: 'nowrap' }}>
            BPM
          </span>
          <input
            type="range"
            min={40}
            max={200}
            value={bpm}
            onChange={(e) => setDrumBpm(Number(e.target.value))}
            style={{ color: 'var(--color-coral-bloom)', accentColor: 'var(--color-coral-bloom)', flex: 1 }}
            aria-label="BPM"
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-coral-bloom)', minWidth: 28 }}>
            {bpm}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto' }} className="no-scrollbar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: stepCount * 34 }}>
          {DRUM_PAD_IDS.map((padId) => {
            const cfg = PAD_CONFIG[padId];
            return (
              <div key={padId} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.06em', textTransform: 'uppercase', color: cfg.color, width: 52, flexShrink: 0, textAlign: 'right', paddingRight: 8 }}>
                  {cfg.label}
                </span>
                {Array.from({ length: stepCount }, (_, step) => {
                  const isOn = drumGrid[padId][step] ?? false;
                  const isCurrent = isPlaying && step === currentStep;
                  return (
                    <button
                      key={step}
                      onClick={() => toggleCell(padId, step)}
                      aria-label={`${cfg.label} step ${step + 1} ${isOn ? 'on' : 'off'}`}
                      style={{
                        width: 32,
                        height: 32,
                        background: isOn
                          ? `${cfg.color}66`
                          : isCurrent
                          ? 'rgba(255,255,255,0.08)'
                          : 'var(--glass-surface)',
                        border: `1px solid ${isOn ? cfg.color : isCurrent ? 'rgba(255,255,255,0.2)' : 'var(--glass-border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'background 80ms, border-color 80ms',
                        outline: isCurrent ? `1px solid ${cfg.color}` : 'none',
                        outlineOffset: 1,
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

  // Last hit times for velocity detection
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

  // Sync sequencer with store state
  useEffect(() => {
    if (!channelRef.current) return;

    const setup = async () => {
      const Tone = await import('tone');
      const transport = Tone.getTransport();
      transport.bpm.value = bpm;

      // Clean up previous sequence
      sequenceRef.current?.dispose();

      const channel = channelRef.current;
      if (!channel) return;

      const seq = new Tone.Sequence<number>(
        (time, step) => {
          Tone.getDraw().schedule(() => {
            setDrumStep(step % stepCount);
          }, time);

          for (const padId of DRUM_PAD_IDS) {
            if (drumGrid[padId][step % stepCount]) {
              synthesizeDrum(padId, 0.8, channel);
              // Visual feedback
              Tone.getDraw().schedule(() => {
                setActivePads((prev) => {
                  const next = new Set(prev);
                  next.add(padId);
                  return next;
                });
                setTimeout(() => {
                  setActivePads((prev) => {
                    const next = new Set(prev);
                    next.delete(padId);
                    return next;
                  });
                }, 120);
              }, time);
            }
          }
        },
        Array.from({ length: stepCount }, (_, i) => i),
        '16n'
      );

      sequenceRef.current = seq;

      if (drumsPlaying) {
        seq.start(0);
        transport.start();
      }
    };

    setup();

    return () => {
      sequenceRef.current?.dispose();
    };
  }, [bpm, stepCount, drumsPlaying, drumGrid, setDrumStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerPad = useCallback(
    async (padId: DrumPadId, velocity?: number) => {
      await ensureInitialized();
      const channel = channelRef.current;
      if (!channel) return;

      // Velocity detection from time delta
      const now = Date.now();
      const last = lastHitTimes.current[padId];
      let vel = velocity ?? 0.8;
      if (last !== undefined) {
        const delta = now - last;
        vel = Math.max(0.3, Math.min(1.0, 1 - delta / 300));
      }
      lastHitTimes.current[padId] = now;

      // HH open/closed choke
      if (padId === 'hhClosed') {
        // Visual: deactivate hhOpen immediately
        setActivePads((prev) => {
          const next = new Set(prev);
          next.delete('hhOpen');
          return next;
        });
      }

      synthesizeDrum(padId, vel, channel);
      onHit?.(padId);

      // Visual hit flash
      setActivePads((prev) => new Set([...prev, padId]));
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(20);
      setTimeout(() => {
        setActivePads((prev) => {
          const next = new Set(prev);
          next.delete(padId);
          return next;
        });
      }, 150);
    },
    [ensureInitialized, onHit]
  );

  const toggleTransport = useCallback(async () => {
    await ensureInitialized();
    const Tone = await import('tone');
    const transport = Tone.getTransport();
    if (drumsPlaying) {
      transport.stop();
      setDrumsPlaying(false);
      setDrumStep(0);
    } else {
      sequenceRef.current?.start(0);
      transport.start();
      setDrumsPlaying(true);
    }
  }, [drumsPlaying, setDrumsPlaying, setDrumStep, ensureInitialized]);

  // Keyboard mapping
  useKeyboard(
    (key) => {
      const padId = DRUM_KEY_MAP[key];
      if (padId) {
        triggerPad(padId as DrumPadId);
        // Spray particles at pad
        const padRef = padRefs.current[padId as DrumPadId];
        if (sprayRef.current && padRef?.current && containerRef.current) {
          const r = padRef.current.getBoundingClientRect();
          const cr = containerRef.current.getBoundingClientRect();
          sprayRef.current.burst(
            r.left - cr.left + r.width / 2,
            r.top - cr.top + r.height / 2,
            PAD_CONFIG[padId as DrumPadId].color
          );
        }
      }
    },
    () => {}
  );

  const containerW = 540;
  const containerH = 300;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)', width: '100%', maxWidth: 680 }}>
      {/* Transport controls */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
        <GlowButton
          variant="primary"
          accentColor="var(--color-coral-bloom)"
          onClick={toggleTransport}
          data-testid="drum-transport-toggle"
        >
          {drumsPlaying ? '■ Stop' : '▶ Play'}
        </GlowButton>
        <GlowButton
          variant="ghost"
          accentColor="var(--color-coral-bloom)"
          onClick={() => setShowSequencer(!showSequencer)}
        >
          {showSequencer ? 'Hide Seq' : 'Sequencer'}
        </GlowButton>
      </div>

      {/* Pad grid with spray particles */}
      <div
        ref={containerRef}
        data-drum-container
        style={{ position: 'relative', width: containerW, height: containerH }}
      >
        <SprayParticles ref={sprayRef} width={containerW} height={containerH} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 120px)',
            gridTemplateRows: 'repeat(2, 100px)',
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
              <DrumSequencer />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-mist)', textAlign: 'center' }}>
        J=Kick · K=Snare · S=HH · D=OpenHH · F=Crash · G=Ride · H=Tom · L=Floor
      </div>
    </div>
  );
}
