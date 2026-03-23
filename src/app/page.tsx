'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import StarfieldCanvas from '@/components/canvas/StarfieldCanvas';
import NebulaBlobs from '@/components/canvas/NebulaBlobs';
import InstrumentOrb from '@/components/ui/InstrumentOrb';
import { INSTRUMENTS } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';

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
        bottom: 'max(40px, calc(var(--safe-bottom) + 24px))',
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
      <span className="label-mono" style={{ color: 'var(--color-mist)' }}>
        Choose an instrument
      </span>
      <svg
        width="20"
        height="32"
        viewBox="0 0 20 32"
        fill="none"
        style={{ animation: 'chevron-bounce 2s ease-in-out infinite' }}
      >
        <rect x="1" y="1" width="18" height="26" rx="9" stroke="rgba(107,114,128,0.5)" strokeWidth="1.5" />
        <rect x="9" y="6" width="2" height="8" rx="1" fill="rgba(107,114,128,0.6)" />
      </svg>
    </motion.div>
  );
}

function CoreSphere({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      style={{
        position: isMobile ? 'relative' : 'absolute',
        left: isMobile ? undefined : '50%',
        top: isMobile ? undefined : '50%',
        transform: isMobile ? undefined : 'translate(-50%, -50%)',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        textAlign: 'center',
        padding: isMobile ? 'var(--space-6) var(--space-4) var(--space-4)' : undefined,
      }}
    >
      {/* Pulsing sphere */}
      <div style={{ position: 'relative', width: isMobile ? '100px' : '140px', height: isMobile ? '100px' : '140px', marginBottom: '4px' }}>
        <div
          style={{
            position: 'absolute',
            inset: '-16px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,209,0.08) 0%, rgba(167,139,250,0.05) 50%, transparent 70%)',
            animation: 'pulse-ambient 4s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, transparent, var(--color-lume-teal) 60deg, transparent 120deg, transparent 180deg, var(--color-indigo-aurora) 240deg, transparent 300deg)',
            animation: 'rotate-slow 6s linear infinite',
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 35% 30%, rgba(0,255,209,0.3) 0%, rgba(167,139,250,0.2) 40%, rgba(7,7,15,0.95) 80%)',
            border: '1px solid rgba(0,255,209,0.15)',
            animation: 'pulse-ambient 3s ease-in-out infinite',
            boxShadow: '0 0 40px rgba(0,255,209,0.15), 0 0 80px rgba(167,139,250,0.08)',
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
          fontSize: 'clamp(40px, 10vw, 96px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, var(--color-starfield) 0%, #ffffff 40%, var(--color-lume-teal) 70%, var(--color-indigo-aurora) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
          lineHeight: 0.9,
        }}
      >
        AETHERA
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(16px, 3vw, 28px)',
          fontWeight: 300,
          color: 'var(--color-mist)',
          letterSpacing: '-0.01em',
          margin: 0,
        }}
      >
        Play the Universe
      </motion.p>

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
        }}
      >
        6 Instruments · Infinite Possibilities
      </motion.p>
    </div>
  );
}

/* Mobile card-style orb grid item */
function MobileOrbCard({ instrument, index }: { instrument: (typeof INSTRUMENTS)[keyof typeof INSTRUMENTS]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.08, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <Link href={`/instruments/${instrument.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{
            background: 'var(--glass-surface)',
            border: `1px solid color-mix(in srgb, ${instrument.color} 20%, transparent)`,
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4) var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            transition: 'all var(--duration-base) var(--ease-smooth)',
            cursor: 'pointer',
            minHeight: '100px',
            justifyContent: 'center',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          // Hover effect via JS since we're using inline styles
          onPointerEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = `color-mix(in srgb, ${instrument.color} 10%, transparent)`;
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = instrument.glow;
          }}
          onPointerLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'var(--glass-surface)';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}
        >
          {/* Color dot */}
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: instrument.color,
              boxShadow: `0 0 8px ${instrument.color}`,
              animation: 'pulse-ambient 3s ease-in-out infinite',
            }}
          />
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-base)',
              fontWeight: 500,
              color: instrument.color,
              lineHeight: 1.2,
              textAlign: 'center',
            }}
          >
            {instrument.name}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-mist)',
            }}
          >
            {instrument.description}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const { isMobile, isTablet } = useBreakpoint();

  if (isMobile) {
    // Mobile: vertical scroll layout
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-void)',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
        }}
      >
        {/* Background */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <StarfieldCanvas count={300} parallaxFactor={0.005} />
          <NebulaBlobs />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* Header */}
          <CoreSphere isMobile={true} />

          {/* Instrument grid */}
          <div
            style={{
              padding: 'var(--space-4) var(--space-4) calc(var(--space-16) + var(--safe-bottom, 0px))',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-3)',
            }}
          >
            {INSTRUMENT_LIST.map((instrument, i) => (
              <MobileOrbCard key={instrument.id} instrument={instrument} index={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isTablet) {
    // Tablet: 2×3 orb grid with title above
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-void)',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <StarfieldCanvas count={500} parallaxFactor={0.01} />
          <NebulaBlobs />
        </div>

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
          {/* Title section */}
          <div style={{ padding: 'calc(80px + var(--safe-top, 0px)) var(--space-8) var(--space-8)', textAlign: 'center', width: '100%' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto var(--space-4)' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(ellipse at 35% 30%, rgba(0,255,209,0.3) 0%, rgba(167,139,250,0.2) 40%, rgba(7,7,15,0.95) 80%)', border: '1px solid rgba(0,255,209,0.15)', animation: 'pulse-ambient 3s ease-in-out infinite' }} />
            </div>
            <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 10vw, 72px)', fontWeight: 700, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, var(--color-starfield) 0%, #ffffff 40%, var(--color-lume-teal) 70%, var(--color-indigo-aurora) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }}>
              AETHERA
            </motion.h1>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 300, color: 'var(--color-mist)', margin: 'var(--space-2) 0 0' }}>
              Play the Universe
            </p>
          </div>

          {/* 2×3 orb grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-4)',
              padding: '0 var(--space-6) calc(var(--space-12) + var(--safe-bottom, 0px))',
              width: '100%',
              maxWidth: 800,
            }}
          >
            {INSTRUMENT_LIST.map((instrument, i) => (
              <MobileOrbCard key={instrument.id} instrument={instrument} index={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop: original orbital layout
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
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <StarfieldCanvas count={800} parallaxFactor={0.02} />
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
        <NebulaBlobs />
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {INSTRUMENT_LIST.map((instrument, i) => (
          <InstrumentOrb key={instrument.id} instrument={instrument} delay={300 + i * 120} />
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
        <CoreSphere isMobile={false} />
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
        <ScrollHint />
      </div>
    </div>
  );
}
