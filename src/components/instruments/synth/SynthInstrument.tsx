'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  memo,
} from 'react';
import KnobControl from './KnobControl';
import XYPad from './XYPad';
import { useOscilloscope } from '@/hooks/useAnalyser';
import { useAudio } from '@/hooks/useAudio';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useBreakpoint, useContainerWidth } from '@/hooks/useBreakpoint';
import { useInstrumentStore, type OscillatorType } from '@/stores/instrumentStore';
import { SYNTH_KEY_NOTES } from '@/lib/note-mappings';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';
import type { PolySynth, Synth, Filter, LFO, FeedbackDelay, Reverb, Gain, Pattern } from 'tone';

const OSCILLOSCOPE_COLORS: Record<OscillatorType, { stroke: string; glow: string }> = {
  sine:     { stroke: 'rgba(34,211,238,0.9)',  glow: '#22D3EE' },
  square:   { stroke: 'rgba(132,204,22,0.9)',  glow: '#84cc16' },
  sawtooth: { stroke: 'rgba(255,170,64,0.9)',  glow: '#FFAA40' },
  triangle: { stroke: 'rgba(167,139,250,0.9)', glow: '#A78BFA' },
};

const WAVEFORM_SVGS: Record<OscillatorType, React.ReactNode> = {
  sine: (<svg viewBox="0 0 40 20" width={40} height={20} fill="none"><path d="M0,10 C5,0 15,0 20,10 C25,20 35,20 40,10" stroke="currentColor" strokeWidth={1.5}/></svg>),
  square: (<svg viewBox="0 0 40 20" width={40} height={20} fill="none"><path d="M0,15 L0,5 L20,5 L20,15 L40,15 L40,5" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/></svg>),
  sawtooth: (<svg viewBox="0 0 40 20" width={40} height={20} fill="none"><path d="M0,15 L20,5 L20,15 L40,5" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/></svg>),
  triangle: (<svg viewBox="0 0 40 20" width={40} height={20} fill="none"><path d="M0,15 L10,5 L30,15 L40,5" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/></svg>),
};

interface SynthRefs {
  polySynth: PolySynth<Synth> | null;
  filter: Filter | null;
  lfo: LFO | null;
  delay: FeedbackDelay | null;
  reverb: Reverb | null;
  channel: Gain | null;
  arpPattern: Pattern<string> | null;
}

export interface SynthInstrumentProps {
  onNotePlay?: (note: string) => void;
}

export default function SynthInstrument({ onNotePlay }: SynthInstrumentProps) {
  const { ensureInitialized, getOrCreateChannel } = useAudio();
  const { isMobile, isTablet } = useBreakpoint();
  const synthParams = useInstrumentStore((s) => s.synthParams);
  const setSynthParam = useInstrumentStore((s) => s.setSynthParam);
  const activeNotes = useInstrumentStore((s) => s.activeNotes);
  const addActiveNote = useInstrumentStore((s) => s.addActiveNote);
  const removeActiveNote = useInstrumentStore((s) => s.removeActiveNote);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef, 720);

  const [xyPos, setXyPos] = useState({ x: 0.5, y: 0.2 });
  const refs = useRef<SynthRefs>({ polySynth: null, filter: null, lfo: null, delay: null, reverb: null, channel: null, arpPattern: null });

  const oscColors = OSCILLOSCOPE_COLORS[synthParams.oscillatorType];
  const oscilloscopeRef = useOscilloscope(oscColors.stroke, oscColors.glow);

  useEffect(() => {
    let disposed = false;
    const setup = async () => {
      await ensureInitialized();
      if (disposed) return;
      const Tone = await import('tone');
      const channel = await getOrCreateChannel('synth');
      refs.current.channel = channel;

      const filter = new Tone.Filter({ type: 'lowpass', frequency: synthParams.filterFreq, Q: synthParams.filterQ, rolloff: -24 });
      refs.current.filter = filter;

      const lfo = new Tone.LFO({ type: 'sine', frequency: synthParams.lfoFreq, min: synthParams.filterFreq * (1 - synthParams.lfoDepth), max: synthParams.filterFreq * (1 + synthParams.lfoDepth) });
      lfo.connect(filter.frequency); lfo.start();
      refs.current.lfo = lfo;

      const delay = new Tone.FeedbackDelay('8n', 0.3);
      delay.wet.value = synthParams.delayWet;
      refs.current.delay = delay;

      const reverb = new Tone.Reverb({ decay: 4, wet: synthParams.reverbWet });
      await reverb.ready;
      refs.current.reverb = reverb;

      const polySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: synthParams.oscillatorType },
        envelope: { attack: synthParams.attack, decay: synthParams.decay, sustain: synthParams.sustain, release: synthParams.release },
        volume: -6,
      });

      polySynth.connect(filter); filter.connect(delay); delay.connect(reverb); reverb.connect(channel);
      refs.current.polySynth = polySynth;
    };
    setup();
    return () => {
      disposed = true;
      refs.current.lfo?.stop();
      refs.current.arpPattern?.dispose();
      refs.current.polySynth?.dispose();
      refs.current.filter?.dispose();
      refs.current.lfo?.dispose();
      refs.current.delay?.dispose();
      refs.current.reverb?.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const r = refs.current;
    if (!r.polySynth) return;
    r.polySynth.set({ oscillator: { type: synthParams.oscillatorType }, envelope: { attack: synthParams.attack, decay: synthParams.decay, sustain: synthParams.sustain, release: synthParams.release } });
    r.filter?.frequency.rampTo(synthParams.filterFreq, 0.016);
    r.filter?.Q.rampTo(synthParams.filterQ, 0.016);
    r.lfo?.frequency.rampTo(synthParams.lfoFreq, 0.1);
    if (r.delay) r.delay.wet.rampTo(synthParams.delayWet, 0.1);
    if (r.reverb) r.reverb.wet.rampTo(synthParams.reverbWet, 0.1);
  }, [synthParams]);

  const handleXYChange = useCallback((x: number, y: number) => {
    setXyPos({ x, y });
    const freq = 200 * Math.pow(40, x);
    const q = 0.5 + y * 19.5;
    refs.current.filter?.frequency.rampTo(freq, 0.016);
    refs.current.filter?.Q.rampTo(q, 0.016);
    setSynthParam('filterFreq', freq);
    setSynthParam('filterQ', q);
  }, [setSynthParam]);

  const noteOn = useCallback(async (note: string) => {
    await ensureInitialized();
    const synth = refs.current.polySynth;
    if (!synth) return;
    synth.triggerAttack(note);
    addActiveNote(note);
    onNotePlay?.(note);
  }, [ensureInitialized, addActiveNote, onNotePlay]);

  const noteOff = useCallback((note: string) => {
    refs.current.polySynth?.triggerRelease(note);
    removeActiveNote(note);
  }, [removeActiveNote]);

  useEffect(() => {
    if (!refs.current.polySynth) return;
    refs.current.arpPattern?.dispose();
    refs.current.arpPattern = null;
    if (activeNotes.length >= 3) {
      import('tone').then((Tone) => {
        const pattern = new Tone.Pattern<string>((time, note) => {
          if (!note) return;
          refs.current.polySynth?.triggerAttackRelease(note, '16n', time);
        }, [...activeNotes], 'upDown');
        pattern.interval = '8n';
        pattern.start(0);
        Tone.getTransport().start();
        refs.current.arpPattern = pattern;
      });
    }
  }, [activeNotes]);

  useKeyboard(
    (key) => { const note = SYNTH_KEY_NOTES[key]; if (note && !activeNotes.includes(note)) noteOn(note); },
    (key) => { const note = SYNTH_KEY_NOTES[key]; if (note) noteOff(note); }
  );

  const noteKeys = Object.entries(SYNTH_KEY_NOTES).slice(0, isMobile ? 8 : 13);
  const xyPadSize = isMobile
    ? { width: Math.min(containerWidth - 32, 280), height: 140 }
    : { width: 260, height: 160 };

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', width: '100%', maxWidth: 720 }}
    >
      {/* Oscilloscope */}
      <GlassCard accent="synth" size="sm" style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: 'var(--space-3)', overflow: 'hidden' }}>
        <canvas
          ref={oscilloscopeRef}
          width={isMobile ? Math.min(containerWidth - 40, 340) : 600}
          height={isMobile ? 70 : 100}
          style={{ maxWidth: '100%', display: 'block' }}
          aria-label="Oscilloscope waveform display"
        />
      </GlassCard>

      {/* Controls — stack vertically on mobile */}
      <div
        className="synth-controls-row"
        style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', width: '100%' }}
      >
        {/* Oscillator selector */}
        <GlassCard accent="synth" size="sm" style={{ flex: isMobile ? '1 1 100%' : undefined }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span className="label-mono" style={{ color: 'var(--color-mist)' }}>Oscillator</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
              {(['sine', 'square', 'sawtooth', 'triangle'] as OscillatorType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSynthParam('oscillatorType', type)}
                  aria-label={`${type} waveform`}
                  aria-pressed={synthParams.oscillatorType === type}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)',
                    padding: 'var(--space-2) var(--space-3)',
                    background: synthParams.oscillatorType === type ? 'color-mix(in srgb, var(--color-cyber-cyan) 15%, transparent)' : 'transparent',
                    border: `1px solid ${synthParams.oscillatorType === type ? 'var(--color-cyber-cyan)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    color: synthParams.oscillatorType === type ? 'var(--color-cyber-cyan)' : 'var(--color-mist)',
                    boxShadow: synthParams.oscillatorType === type ? 'var(--glow-synth)' : 'none',
                    transition: 'all var(--duration-fast) var(--ease-smooth)',
                    minWidth: 44, minHeight: 44,
                  }}
                >
                  {WAVEFORM_SVGS[type]}
                  <span className="label-mono" style={{ color: 'inherit', fontSize: '8px' }}>{type.slice(0, 3).toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* ADSR knobs — horizontal scroll on mobile */}
        <GlassCard accent="synth" size="sm" style={{ flex: isMobile ? '1 1 100%' : undefined }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span className="label-mono" style={{ color: 'var(--color-mist)' }}>Envelope</span>
            <div
              className="synth-knob-row"
              style={{ display: 'flex', gap: 'var(--space-4)', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? 'var(--space-2)' : 0, width: '100%', justifyContent: isMobile ? 'flex-start' : 'center' }}
            >
              <KnobControl label="Atk" value={synthParams.attack}  min={0.01} max={2}   step={0.01} color="var(--color-cyber-cyan)" formatValue={(v) => `${v.toFixed(2)}s`} onChange={(v) => setSynthParam('attack', v)} />
              <KnobControl label="Dec" value={synthParams.decay}   min={0.01} max={2}   step={0.01} color="var(--color-cyber-cyan)" formatValue={(v) => `${v.toFixed(2)}s`} onChange={(v) => setSynthParam('decay', v)} />
              <KnobControl label="Sus" value={synthParams.sustain} min={0}    max={1}   step={0.01} color="var(--color-cyber-cyan)" formatValue={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setSynthParam('sustain', v)} />
              <KnobControl label="Rel" value={synthParams.release} min={0.1}  max={4}   step={0.01} color="var(--color-cyber-cyan)" formatValue={(v) => `${v.toFixed(2)}s`} onChange={(v) => setSynthParam('release', v)} />
            </div>
          </div>
        </GlassCard>

        {/* XY pad */}
        <GlassCard accent="synth" size="sm" className="synth-xy-pad" style={{ flex: isMobile ? '1 1 100%' : undefined }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span className="label-mono" style={{ color: 'var(--color-mist)' }}>Filter XY</span>
            <XYPad x={xyPos.x} y={xyPos.y} xLabel="Cutoff" yLabel="Res" {...xyPadSize} onChange={handleXYChange} />
          </div>
        </GlassCard>

        {/* FX knobs */}
        <GlassCard accent="synth" size="sm" style={{ flex: isMobile ? '1 1 100%' : undefined }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span className="label-mono" style={{ color: 'var(--color-mist)' }}>FX</span>
            <div
              className="synth-knob-row"
              style={{ display: 'flex', gap: 'var(--space-4)', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? 'var(--space-2)' : 0 }}
            >
              <KnobControl label="LFO"   value={synthParams.lfoFreq}   min={0.1} max={10} step={0.1}  color="var(--color-cyber-cyan)" formatValue={(v) => `${v.toFixed(1)}Hz`} onChange={(v) => setSynthParam('lfoFreq', v)} />
              <KnobControl label="Delay" value={synthParams.delayWet}  min={0}   max={1}  step={0.01} color="var(--color-cyber-cyan)" formatValue={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setSynthParam('delayWet', v)} />
              <KnobControl label="Verb"  value={synthParams.reverbWet} min={0}   max={1}  step={0.01} color="var(--color-cyber-cyan)" formatValue={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setSynthParam('reverbWet', v)} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Note grid — horizontal scroll on mobile */}
      <GlassCard accent="synth" size="md" style={{ width: '100%', overflowX: isMobile ? 'auto' : 'visible' }}>
        <div
          style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: isMobile ? 'nowrap' : 'wrap', justifyContent: isMobile ? 'flex-start' : 'center', paddingBottom: isMobile ? 'var(--space-2)' : 0 }}
          className={isMobile ? 'scroll-x' : undefined}
        >
          {noteKeys.map(([key, note]) => {
            const isActive = activeNotes.includes(note);
            return (
              <button
                key={note}
                data-testid={`synth-key-${key}`}
                onPointerDown={(e) => { e.preventDefault(); noteOn(note); }}
                onPointerUp={() => noteOff(note)}
                onPointerLeave={() => noteOff(note)}
                aria-label={`Synth note ${note}`}
                aria-pressed={isActive}
                style={{
                  width: isMobile ? 52 : 56,
                  minWidth: isMobile ? 52 : 56,
                  height: isMobile ? 70 : 80,
                  minHeight: 44,
                  background: isActive ? 'color-mix(in srgb, var(--color-cyber-cyan) 22%, transparent)' : 'var(--glass-surface)',
                  border: `1px solid ${isActive ? 'var(--color-cyber-cyan)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)',
                  transition: 'all 60ms ease',
                  boxShadow: isActive ? 'var(--glow-synth)' : 'none',
                  transform: isActive ? 'scale(0.94)' : 'scale(1)',
                  touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', flexShrink: 0,
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 500, color: isActive ? 'var(--color-cyber-cyan)' : 'var(--color-starfield)' }}>{note}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-mist)', border: '1px solid var(--glass-border)', borderRadius: '3px', padding: '1px 3px', textTransform: 'uppercase' }}>{key}</span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {!isMobile && (
        <div className="label-mono" style={{ color: 'var(--color-mist)', textAlign: 'center' }}>
          Hold 3+ notes to engage arpeggiator · Drag knobs vertically
        </div>
      )}
    </div>
  );
}
