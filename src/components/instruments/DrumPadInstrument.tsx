'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import GlassCard from '@/components/ui/GlassCard';

const PADS = [
  { id: 'kick',    key: 'q', label: 'Kick',    color: 'var(--color-coral-bloom)', freq: 60,  type: 'kick' },
  { id: 'snare',   key: 'w', label: 'Snare',   color: 'var(--color-coral-bloom)', freq: 200, type: 'snare' },
  { id: 'hihat',   key: 'e', label: 'Hi-Hat',  color: 'var(--color-amber-pulse)', freq: 800, type: 'hihat' },
  { id: 'openhat', key: 'r', label: 'Open Hat', color: 'var(--color-amber-pulse)', freq: 600, type: 'openhat' },
  { id: 'tom1',    key: 'a', label: 'Tom 1',   color: 'var(--color-indigo-aurora)', freq: 120, type: 'tom' },
  { id: 'tom2',    key: 's', label: 'Tom 2',   color: 'var(--color-indigo-aurora)', freq: 100, type: 'tom' },
  { id: 'crash',   key: 'd', label: 'Crash',   color: 'var(--color-cyber-cyan)', freq: 500, type: 'crash' },
  { id: 'clap',    key: 'f', label: 'Clap',    color: 'var(--color-iris-gold)', freq: 300, type: 'clap' },
] as const;

interface DrumPadInstrumentProps {
  volume?: number;
  onHit?: (padId: string) => void;
}

export default function DrumPadInstrument({ volume = 80, onHit }: DrumPadInstrumentProps) {
  const [activePads, setActivePads] = useState<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playDrum = useCallback(
    (pad: (typeof PADS)[number]) => {
      try {
        const ctx = getCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const vol = (volume / 100) * 0.7;

        switch (pad.type) {
          case 'kick': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.4);
            break;
          }
          case 'snare': {
            const bufferSize = ctx.sampleRate * 0.2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 800;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(vol * 0.7, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            source.start();
            break;
          }
          case 'hihat': {
            const bufferSize = ctx.sampleRate * 0.05;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 7000;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(vol * 0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            source.start();
            break;
          }
          case 'openhat': {
            const bufferSize = ctx.sampleRate * 0.3;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 6000;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(vol * 0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            source.start();
            break;
          }
          case 'tom': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(pad.freq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(vol * 0.6, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
            break;
          }
          case 'crash': {
            const bufferSize = ctx.sampleRate * 0.8;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 5000;
            filter.Q.value = 0.5;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(vol * 0.35, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            source.start();
            break;
          }
          case 'clap': {
            for (let i = 0; i < 3; i++) {
              const bufferSize = ctx.sampleRate * 0.04;
              const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
              const data = buffer.getChannelData(0);
              for (let j = 0; j < bufferSize; j++) data[j] = Math.random() * 2 - 1;
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              const filter = ctx.createBiquadFilter();
              filter.type = 'bandpass';
              filter.frequency.value = 1200;
              const gain = ctx.createGain();
              gain.gain.setValueAtTime(vol * 0.5, ctx.currentTime + i * 0.01);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.01 + 0.04);
              source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
              source.start(ctx.currentTime + i * 0.01);
            }
            break;
          }
        }

        onHit?.(pad.id);
      } catch (err) {
        console.warn('Drum play failed:', err);
      }
    },
    [volume, getCtx, onHit]
  );

  const triggerPad = useCallback(
    (pad: (typeof PADS)[number]) => {
      setActivePads((prev) => new Set([...prev, pad.id]));
      playDrum(pad);
      setTimeout(() => {
        setActivePads((prev) => {
          const next = new Set(prev);
          next.delete(pad.id);
          return next;
        });
      }, 150);
    },
    [playDrum]
  );

  useEffect(() => {
    const keyMap = Object.fromEntries(PADS.map((p) => [p.key, p]));
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const pad = keyMap[e.key.toLowerCase()];
      if (pad) triggerPad(pad);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerPad]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      <GlassCard accent="drums" size="lg">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            padding: '8px',
          }}
        >
          {PADS.map((pad) => {
            const isActive = activePads.has(pad.id);
            return (
              <button
                key={pad.id}
                onMouseDown={() => triggerPad(pad)}
                onTouchStart={(e) => { e.preventDefault(); triggerPad(pad); }}
                style={{
                  width: '120px',
                  height: '100px',
                  background: isActive
                    ? `color-mix(in srgb, ${pad.color} 30%, transparent)`
                    : 'var(--glass-surface)',
                  border: `1px solid ${isActive ? pad.color : 'var(--glass-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 80ms ease',
                  boxShadow: isActive
                    ? `0 0 20px color-mix(in srgb, ${pad.color} 50%, transparent), 0 0 40px color-mix(in srgb, ${pad.color} 20%, transparent)`
                    : 'none',
                  transform: isActive ? 'scale(0.94)' : 'scale(1)',
                  color: pad.color,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: isActive ? pad.color : 'var(--color-starfield)',
                    transition: 'color 80ms',
                  }}
                >
                  {pad.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: isActive ? pad.color : 'var(--color-mist)',
                    border: `1px solid ${isActive ? pad.color + '60' : 'var(--glass-border)'}`,
                    borderRadius: '4px',
                    padding: '2px 6px',
                    transition: 'all 80ms',
                  }}
                >
                  {pad.key.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </GlassCard>

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
        Click pads or press Q W E R / A S D F
      </p>
    </div>
  );
}
