'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import WaveformDisplay from '@/components/ui/WaveformDisplay';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';
import type { InstrumentId } from '@/types';
import { INSTRUMENTS } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface ControlConfig {
  volume: number;
  reverb: number;
  bpm: number;
  octave: number;
}

interface InstrumentRoomShellProps {
  instrumentId: InstrumentId;
  background: React.ReactNode;
  children: React.ReactNode;
  keyboardHints?: Array<{ key: string; label: string }>;
  isPlaying?: boolean;
  controls?: ControlConfig;
  onControlChange?: (key: keyof ControlConfig, value: number) => void;
}

function ControlTray({
  instrument,
  controls,
  onControlChange,
  isOpen,
  onToggle,
  isMobile,
}: {
  instrument: (typeof INSTRUMENTS)[InstrumentId];
  controls: ControlConfig;
  onControlChange: (key: keyof ControlConfig, value: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
}) {
  const color = instrument.color;

  const sliders: Array<{
    key: keyof ControlConfig;
    label: string;
    min: number;
    max: number;
    step: number;
    format: (v: number) => string;
  }> = [
    { key: 'volume', label: 'Vol',    min: 0,  max: 100, step: 1, format: (v) => `${v}%` },
    { key: 'reverb', label: 'Reverb', min: 0,  max: 100, step: 1, format: (v) => `${v}%` },
    { key: 'bpm',    label: 'BPM',    min: 40, max: 240, step: 1, format: (v) => `${v}` },
    { key: 'octave', label: 'Oct',    min: 1,  max: 7,   step: 1, format: (v) => `${v}` },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
      }}
      className="control-tray"
    >
      {/* Toggle handle */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '4px' }}>
        <button
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Hide controls' : 'Show controls'}
          style={{
            background: 'rgba(13,13,26,0.95)',
            border: `1px solid ${color}30`,
            borderBottom: 'none',
            borderRadius: '10px 10px 0 0',
            padding: '8px 24px 4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: color,
            minHeight: 40,
          }}
        >
          <span className="label-mono" style={{ color: color, letterSpacing: '0.08em' }}>Controls</span>
          <span style={{ display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform var(--duration-fast)' }}>▲</span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
            className="control-tray-panel"
          >
            <div
              style={{
                background: 'rgba(7,7,15,0.97)',
                borderTop: `1px solid ${color}20`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: `var(--space-4) var(--space-6) max(var(--space-4), var(--safe-bottom, 0px))`,
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? 'repeat(2, 1fr)'
                  : 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 'var(--space-4)',
                alignItems: 'center',
              }}
            >
              {sliders.map((slider) => (
                <div key={slider.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label-mono" style={{ color: 'var(--color-mist)' }}>{slider.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: color, minWidth: '32px', textAlign: 'right' }}>
                      {slider.format(controls[slider.key])}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={controls[slider.key]}
                    onChange={(e) => onControlChange(slider.key, Number(e.target.value))}
                    aria-label={slider.label}
                    style={{ color, accentColor: color, width: '100%', touchAction: 'none' }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function InstrumentRoomShell({
  instrumentId,
  background,
  children,
  keyboardHints = [],
  isPlaying = false,
  controls: externalControls,
  onControlChange: externalOnControlChange,
}: InstrumentRoomShellProps) {
  const instrument = INSTRUMENTS[instrumentId];
  const { isMobile, isTablet } = useBreakpoint();
  const [controlsOpen, setControlsOpen] = useState(false);
  const [internalControls, setInternalControls] = useState<ControlConfig>({
    volume: 80, reverb: 20, bpm: 120, octave: 4,
  });

  const controls = externalControls ?? internalControls;
  const handleControlChange = (key: keyof ControlConfig, value: number) => {
    if (externalOnControlChange) externalOnControlChange(key, value);
    else setInternalControls((prev) => ({ ...prev, [key]: value }));
  };

  const controlsTrayHeight = controlsOpen ? (isMobile ? 160 : 110) : 48;

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--color-void)',
      }}
      data-instrument-color={instrument.color}
    >
      {/* Room background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {background}
      </div>

      {/* Room title — top left (responsive) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{
          position: 'fixed',
          top: `max(80px, calc(var(--safe-top) + 72px))`,
          left: isMobile ? 'var(--space-4)' : 'var(--space-8)',
          zIndex: 30,
          maxWidth: isMobile ? 'calc(60vw)' : undefined,
        }}
      >
        <div className="label-mono" style={{ marginBottom: 4 }}>
          {instrument.label} / {instrument.description}
        </div>
        <h1
          className="room-title-name"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 6vw, 64px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: instrument.color,
            textShadow: instrument.glow,
            margin: 0,
            lineHeight: 1,
          }}
        >
          {instrument.name}
        </h1>
      </motion.div>

      {/* Waveform display — top right */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="waveform-display-container"
          style={{
            position: 'fixed',
            top: `max(80px, calc(var(--safe-top) + 72px))`,
            right: 'var(--space-8)',
            zIndex: 30,
          }}
        >
          <WaveformDisplay
            color={instrument.color}
            height={isTablet ? 40 : 60}
            width={isTablet ? 180 : 300}
            isPlaying={isPlaying}
          />
          <div className="label-mono" style={{ textAlign: 'right', marginTop: 4 }}>
            {isPlaying ? '● Live' : '○ Idle'}
          </div>
        </motion.div>
      )}

      {/* Back button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          position: 'fixed',
          top: `max(80px, calc(var(--safe-top) + 72px))`,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <GlowButton variant="ghost" accentColor={instrument.color} size="sm">
            ← Back
          </GlowButton>
        </Link>
      </motion.div>

      {/* Content zone */}
      <div
        className="instrument-content-zone"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: isMobile ? '110px' : '140px',
          paddingBottom: controlsOpen ? `${controlsTrayHeight + 20}px` : '60px',
          paddingLeft: isMobile ? 'var(--space-2)' : 'var(--space-4)',
          paddingRight: isMobile ? 'var(--space-2)' : 'var(--space-4)',
          transition: 'padding-bottom var(--duration-base) var(--ease-smooth)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {children}
      </div>

      {/* Keyboard hint bar — hidden on mobile (no keyboard) */}
      {!isMobile && keyboardHints.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: controlsOpen ? `${controlsTrayHeight + 8}px` : '52px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 35,
            display: 'flex',
            gap: 'var(--space-3)',
            transition: 'bottom var(--duration-base) var(--ease-smooth)',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: '90vw',
          }}
        >
          {keyboardHints.slice(0, 8).map((hint) => (
            <div
              key={hint.key}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'rgba(107,114,128,0.5)' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '20px', height: '20px', border: '1px solid rgba(107,114,128,0.2)', borderRadius: '4px', fontSize: '9px', background: 'rgba(255,255,255,0.02)', padding: '0 3px' }}>
                {hint.key}
              </span>
              <span>{hint.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Control tray */}
      <ControlTray
        instrument={instrument}
        controls={controls}
        onControlChange={handleControlChange}
        isOpen={controlsOpen}
        onToggle={() => setControlsOpen((v) => !v)}
        isMobile={isMobile}
      />
    </div>
  );
}
