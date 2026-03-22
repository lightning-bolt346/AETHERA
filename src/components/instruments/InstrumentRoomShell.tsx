'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import WaveformDisplay from '@/components/ui/WaveformDisplay';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';
import type { InstrumentId } from '@/types';
import { INSTRUMENTS } from '@/types';

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
}: {
  instrument: (typeof INSTRUMENTS)[InstrumentId];
  controls: ControlConfig;
  onControlChange: (key: keyof ControlConfig, value: number) => void;
  isOpen: boolean;
  onToggle: () => void;
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
    { key: 'volume', label: 'Volume', min: 0, max: 100, step: 1, format: (v) => `${v}%` },
    { key: 'reverb', label: 'Reverb', min: 0, max: 100, step: 1, format: (v) => `${v}%` },
    { key: 'bpm', label: 'BPM', min: 40, max: 240, step: 1, format: (v) => `${v}` },
    { key: 'octave', label: 'Octave', min: 1, max: 7, step: 1, format: (v) => `${v}` },
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
    >
      {/* Toggle handle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '4px',
        }}
      >
        <button
          onClick={onToggle}
          style={{
            background: 'rgba(13,13,26,0.9)',
            border: `1px solid ${color}30`,
            borderBottom: 'none',
            borderRadius: '10px 10px 0 0',
            padding: '6px 24px 4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: color,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Controls
          </span>
          <span
            style={{
              display: 'inline-block',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--duration-fast) var(--ease-smooth)',
              fontSize: '10px',
            }}
          >
            ▲
          </span>
        </button>
      </div>

      {/* Tray panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                background: 'rgba(7,7,15,0.95)',
                borderTop: `1px solid ${color}20`,
                backdropFilter: 'blur(20px)',
                padding: 'var(--space-4) var(--space-6)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 'var(--space-6)',
                alignItems: 'center',
              }}
            >
              {sliders.map((slider) => (
                <div key={slider.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--color-mist)',
                      }}
                    >
                      {slider.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: color,
                        minWidth: '36px',
                        textAlign: 'right',
                      }}
                    >
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
                    style={{
                      color: color,
                      accentColor: color,
                      width: '100%',
                    }}
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
  const [controlsOpen, setControlsOpen] = useState(false);
  const [internalControls, setInternalControls] = useState<ControlConfig>({
    volume: 80,
    reverb: 20,
    bpm: 120,
    octave: 4,
  });

  const controls = externalControls ?? internalControls;
  const handleControlChange = (key: keyof ControlConfig, value: number) => {
    if (externalOnControlChange) {
      externalOnControlChange(key, value);
    } else {
      setInternalControls((prev) => ({ ...prev, [key]: value }));
    }
  };

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
      {/* Room background (fixed, behind everything) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
        }}
      >
        {background}
      </div>

      {/* Room title — top left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{
          position: 'fixed',
          top: '88px',
          left: 'var(--space-8)',
          zIndex: 30,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-mist)',
            marginBottom: '4px',
          }}
        >
          {instrument.label} / {instrument.description}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6vw, 64px)',
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
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          position: 'fixed',
          top: '88px',
          right: 'var(--space-8)',
          zIndex: 30,
        }}
      >
        <WaveformDisplay
          color={instrument.color}
          height={60}
          width={300}
          isPlaying={isPlaying}
        />
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-mist)',
            textAlign: 'right',
            marginTop: '4px',
          }}
        >
          {isPlaying ? '● Live' : '○ Idle'}
        </div>
      </motion.div>

      {/* Back button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          position: 'fixed',
          top: '88px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <GlowButton
            variant="ghost"
            accentColor={instrument.color}
            size="sm"
          >
            ← Back
          </GlowButton>
        </Link>
      </motion.div>

      {/* Content zone */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '140px',
          paddingBottom: controlsOpen ? '180px' : '80px',
          transition: 'padding-bottom var(--duration-base) var(--ease-smooth)',
        }}
      >
        {children}
      </div>

      {/* Keyboard hint bar */}
      {keyboardHints.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: controlsOpen ? '160px' : '48px',
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
          {keyboardHints.map((hint) => (
            <div
              key={hint.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'rgba(107,114,128,0.5)',
                letterSpacing: '0.05em',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  border: '1px solid rgba(107,114,128,0.2)',
                  borderRadius: '4px',
                  fontSize: '9px',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
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
      />
    </div>
  );
}
