'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarfieldCanvas from '@/components/canvas/StarfieldCanvas';
import GlowButton from './GlowButton';

interface ComingSoonProps {
  title: string;
  subtitle: string;
  accentColor?: string;
}

export default function ComingSoon({
  title,
  subtitle,
  accentColor = 'var(--color-lume-teal)',
}: ComingSoonProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-void)',
        overflow: 'hidden',
      }}
    >
      <StarfieldCanvas count={400} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-6)',
          textAlign: 'center',
          padding: 'var(--space-8)',
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: accentColor,
          }}
        >
          Coming Soon
        </span>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 8vw, 96px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--color-starfield)',
            margin: 0,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            fontWeight: 300,
            color: 'var(--color-mist)',
            maxWidth: '480px',
            margin: 0,
          }}
        >
          {subtitle}
        </p>

        <Link href="/" style={{ textDecoration: 'none' }}>
          <GlowButton accentColor={accentColor} variant="primary">
            ← Back to AETHERA
          </GlowButton>
        </Link>
      </motion.div>
    </div>
  );
}
