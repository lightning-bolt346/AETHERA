'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';

const SYNTH_NOTES = [
  { note: 'C3', key: 'z', freq: 130.81 },
  { note: 'D3', key: 'x', freq: 146.83 },
  { note: 'E3', key: 'c', freq: 164.81 },
  { note: 'F3', key: 'v', freq: 174.61 },
  { note: 'G3', key: 'b', freq: 196.00 },
  { note: 'A3', key: 'n', freq: 220.00 },
  { note: 'B3', key: 'm', freq: 246.94 },
  { note: 'C4', key: 'a', freq: 261.63 },
  { note: 'D4', key: 's', freq: 293.66 },
  { note: 'E4', key: 'd', freq: 329.63 },
  { note: 'F4', key: 'f', freq: 349.23 },
  { note: 'G4', key: 'g', freq: 392.00 },
] as const;

const WAVEFORMS: OscillatorType[] = ['sawtooth', 'square', 'sine', 'triangle'];
const WAVEFORM_LABELS = ['SAW', 'SQR', 'SIN', 'TRI'];

interface SynthInstrumentProps {
  volume?: number;
  onNotePlay?: (note: string) => void;
}

export default function SynthInstrument({ volume = 80, onNotePlay }: SynthInstrumentProps) {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [waveform, setWaveform] = useState<OscillatorType>('sawtooth');
  const [attack, setAttack] = useState(0.05);
  const [decay, setDecay] = useState(0.1);
  const [sustain, setSustain] = useState(0.7);
  const [release, setRelease] = useState(0.3);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscsRef = useRef<Map<string, { osc: OscillatorNode; gain: GainNode }>>(new Map());

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

        osc.type = waveform;
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 2;

        const vol = (volume / 100) * 0.35;
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + attack);
        gain.gain.linearRampToValueAtTime(vol * sustain, now + attack + decay);

        osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        osc.start();

        activeOscsRef.current.set(noteId, { osc, gain });
        setActiveNotes((prev) => new Set([...prev, noteId]));
        onNotePlay?.(noteId);
      } catch (err) {
        console.warn('Synth note failed:', err);
      }
    },
    [waveform, volume, attack, decay, sustain, getCtx, onNotePlay]
  );

  const stopNote = useCallback(
    (noteId: string) => {
      const entry = activeOscsRef.current.get(noteId);
      if (!entry) return;
      const { osc, gain } = entry;
      const ctx = getCtx();
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + release);
      osc.stop(now + release + 0.05);
      activeOscsRef.current.delete(noteId);
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
    },
    [release, getCtx]
  );

  useEffect(() => {
    const keyMap = Object.fromEntries(SYNTH_NOTES.map((n) => [n.key, n]));
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
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [startNote, stopNote]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '700px' }}>
      {/* Waveform selector */}
      <GlassCard accent="synth" size="sm" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-mist)', alignSelf: 'center', marginRight: '4px' }}>Wave</span>
        {WAVEFORMS.map((w, i) => (
          <GlowButton
            key={w}
            variant={waveform === w ? 'primary' : 'ghost'}
            accentColor="var(--color-cyber-cyan)"
            size="sm"
            onClick={() => setWaveform(w)}
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
          >
            {WAVEFORM_LABELS[i]}
          </GlowButton>
        ))}
      </GlassCard>

      {/* ADSR controls */}
      <GlassCard accent="synth" size="sm" style={{ width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'ATK', value: attack, min: 0.001, max: 2, setter: setAttack },
            { label: 'DEC', value: decay, min: 0.001, max: 2, setter: setDecay },
            { label: 'SUS', value: sustain, min: 0, max: 1, setter: setSustain },
            { label: 'REL', value: release, min: 0.001, max: 3, setter: setRelease },
          ].map(({ label, value, min, max, setter }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-cyber-cyan)' }}>
                {label}
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={(max - min) / 100}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                style={{ color: 'var(--color-cyber-cyan)', accentColor: 'var(--color-cyber-cyan)', width: '100%' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-mist)' }}>
                {value.toFixed(2)}s
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Note grid */}
      <GlassCard accent="synth" size="md">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {SYNTH_NOTES.map((note) => {
            const isActive = activeNotes.has(note.note);
            return (
              <button
                key={note.note}
                onMouseDown={() => startNote(note.note, note.freq)}
                onMouseUp={() => stopNote(note.note)}
                onMouseLeave={() => stopNote(note.note)}
                onTouchStart={(e) => { e.preventDefault(); startNote(note.note, note.freq); }}
                onTouchEnd={() => stopNote(note.note)}
                style={{
                  width: '54px',
                  height: '80px',
                  background: isActive
                    ? 'color-mix(in srgb, var(--color-cyber-cyan) 25%, transparent)'
                    : 'var(--glass-surface)',
                  border: `1px solid ${isActive ? 'var(--color-cyber-cyan)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 60ms ease',
                  boxShadow: isActive ? 'var(--glow-synth)' : 'none',
                  transform: isActive ? 'scale(0.95)' : 'scale(1)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.05em', color: isActive ? 'var(--color-cyber-cyan)' : 'var(--color-starfield)', fontWeight: 500 }}>
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
        Z X C V B N M / A S D F G — Hold for sustain
      </p>
    </div>
  );
}
