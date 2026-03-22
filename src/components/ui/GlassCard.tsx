'use client';

import React, { forwardRef } from 'react';
import { type InstrumentId } from '@/types';
import { cn } from '@/lib/utils';

const ACCENT_COLORS: Record<InstrumentId, string> = {
  piano:   'var(--color-lume-teal)',
  trumpet: 'var(--color-amber-pulse)',
  drums:   'var(--color-coral-bloom)',
  guitar:  'var(--color-iris-gold)',
  violin:  'var(--color-indigo-aurora)',
  synth:   'var(--color-cyber-cyan)',
};

const GLOW_VARS: Record<InstrumentId, string> = {
  piano:   'var(--glow-piano)',
  trumpet: 'var(--glow-trumpet)',
  drums:   'var(--glow-drums)',
  guitar:  'var(--glow-guitar)',
  violin:  'var(--glow-violin)',
  synth:   'var(--glow-synth)',
};

const SIZE_STYLES = {
  sm: { padding: 'var(--space-4)' },
  md: { padding: 'var(--space-6)' },
  lg: { padding: 'var(--space-8)' },
};

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: InstrumentId;
  glow?: boolean;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  children: React.ReactNode;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      accent,
      glow = false,
      size = 'md',
      interactive = false,
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const accentColor = accent ? ACCENT_COLORS[accent] : undefined;
    const glowShadow = accent ? GLOW_VARS[accent] : undefined;

    const baseStyle: React.CSSProperties = {
      background: 'var(--glass-surface)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-lg)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      padding: SIZE_STYLES[size].padding,
      transition: `all var(--duration-base) var(--ease-smooth)`,
      ...(glow && glowShadow ? { boxShadow: glowShadow } : {}),
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(
          interactive && 'glass-card-interactive',
          className
        )}
        style={baseStyle}
        data-accent={accent}
        {...props}
      >
        {children}

        {interactive && accentColor && (
          <style>{`
            [data-accent="${accent}"].glass-card-interactive:hover {
              background: var(--glass-hover) !important;
              border-color: color-mix(in srgb, ${accentColor} 30%, transparent) !important;
              box-shadow: ${glowShadow} !important;
              transform: translateY(-2px);
            }
          `}</style>
        )}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
export default GlassCard;
