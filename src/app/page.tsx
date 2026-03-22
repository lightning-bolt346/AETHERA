'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import StarfieldCanvas from '@/components/canvas/StarfieldCanvas';
import NebulaBlobs from '@/components/canvas/NebulaBlobs';
import InstrumentOrb from '@/components/ui/InstrumentOrb';
import { INSTRUMENTS } from '@/types';

const INSTRUMENT_LIST = Object.values(INSTRUMENTS);

function ScrollHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.8 }}
      style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-mist)',
        }}
      >
        Explore
      </span>
      <svg
        width="20"
        height="32"
        viewBox="0 0 20 32"
        fill="none"
        style={{ animation: 'chevron-bounce 2s ease-in-out infinite' }}
      >
        <rect
          x="1"
          y="1"
          width="18"
          height="26"
          rx="9"
          stroke="rgba(107,114,128,0.5)"
          strokeWidth="1.5"
        />
        <rect
          x="9"
          y="6"
          width="2"
          height="8"
          rx="1"
          fill="rgba(107,114,128,0.6)"
        />
      </svg>
    </motion.div>
  );
}

function CoreSphere() {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        textAlign: 'center',
      }}
    >
      {/* Central pulsing sphere */}
      <div
        style={{
          position: 'relative',
          width: '160px',
          height: '160px',
          marginBottom: '8px',
        }}
      >
        {/* Outer glow ring */}
        <div
          style={{
            position: 'absolute',
            inset: '-24px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(0,255,209,0.08) 0%, rgba(167,139,250,0.05) 50%, transparent 70%)',
            animation: 'pulse-ambient 4s ease-in-out infinite',
          }}
        />
        {/* Rotating conic ring */}
        <div
          style={{
            position: 'absolute',
            inset: '-8px',
            borderRadius: '50%',
            background:
              'conic-gradient(from 0deg, transparent, var(--color-lume-teal) 60deg, transparent 120deg, transparent 180deg, var(--color-indigo-aurora) 240deg, transparent 300deg)',
            animation: 'rotate-slow 6s linear infinite',
            opacity: 0.5,
          }}
        />
        {/* Core sphere */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at 35% 30%, rgba(0,255,209,0.3) 0%, rgba(167,139,250,0.2) 40%, rgba(7,7,15,0.95) 80%)',
            border: '1px solid rgba(0,255,209,0.15)',
            animation: 'pulse-ambient 3s ease-in-out infinite',
            boxShadow:
              '0 0 40px rgba(0,255,209,0.15), 0 0 80px rgba(167,139,250,0.08), inset 0 0 30px rgba(0,255,209,0.05)',
          }}
        />
        {/* Inner glow */}
        <div
          style={{
            position: 'absolute',
            inset: '20%',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(0,255,209,0.15) 0%, transparent 70%)',
            animation: 'pulse-ambient 2s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* AETHERA wordmark */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 8vw, 96px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          background:
            'linear-gradient(135deg, var(--color-starfield) 0%, #ffffff 40%, var(--color-lume-teal) 70%, var(--color-indigo-aurora) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
          lineHeight: 0.9,
        }}
      >
        AETHERA
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(18px, 3vw, 28px)',
          fontWeight: 300,
          color: 'var(--color-mist)',
          letterSpacing: '-0.01em',
          margin: 0,
        }}
      >
        Play the Universe
      </motion.p>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(107,114,128,0.6)',
          margin: 0,
          marginTop: '4px',
        }}
      >
        6 Instruments · Infinite Possibilities
      </motion.p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--color-void)',
      }}
    >
      {/* z-0: Star field */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <StarfieldCanvas count={800} parallaxFactor={0.02} />
      </div>

      {/* z-1: Nebula blobs */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <NebulaBlobs />
      </div>

      {/* z-2: Instrument Orbs */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
        }}
      >
        {INSTRUMENT_LIST.map((instrument, i) => (
          <InstrumentOrb
            key={instrument.id}
            instrument={instrument}
            delay={300 + i * 120}
          />
        ))}
      </div>

      {/* z-3: Center Core */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
        <CoreSphere />
      </div>

      {/* z-5: Scroll hint */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
        <ScrollHint />
      </div>
    </div>
  );
}
