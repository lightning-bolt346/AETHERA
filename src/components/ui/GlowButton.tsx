'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'icon';
  accentColor?: string;
  glowColor?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const SIZE_MAP = {
  sm: { padding: '6px 14px', fontSize: 'var(--text-sm)' },
  md: { padding: '10px 24px', fontSize: 'var(--text-base)' },
  lg: { padding: '14px 32px', fontSize: 'var(--text-lg)' },
};

const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    {
      variant = 'primary',
      accentColor = 'var(--color-lume-teal)',
      glowColor,
      size = 'md',
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const resolvedGlow = glowColor ?? accentColor;
    const uid = Math.random().toString(36).slice(2, 7);

    const baseShared: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-2)',
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      borderRadius: variant === 'icon' ? 'var(--radius-pill)' : 'var(--radius-md)',
      cursor: 'pointer',
      transition: `all var(--duration-fast) var(--ease-spring)`,
      userSelect: 'none',
      WebkitUserSelect: 'none',
      border: 'none',
      outline: 'none',
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        ...baseShared,
        background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accentColor} 40%, transparent)`,
        color: accentColor,
        ...SIZE_MAP[size],
      },
      ghost: {
        ...baseShared,
        background: 'transparent',
        border: '1px solid transparent',
        color: 'var(--color-starfield)',
        ...SIZE_MAP[size],
      },
      icon: {
        ...baseShared,
        background: 'var(--glass-surface)',
        border: '1px solid var(--glass-border)',
        color: accentColor,
        width: size === 'sm' ? '32px' : size === 'lg' ? '48px' : '40px',
        height: size === 'sm' ? '32px' : size === 'lg' ? '48px' : '40px',
        padding: '0',
        borderRadius: 'var(--radius-pill)',
      },
    };

    return (
      <>
        <button
          ref={ref}
          className={cn(`glow-btn-${uid}`, className)}
          style={{ ...variantStyles[variant], ...style }}
          {...props}
        >
          {children}
        </button>
        <style>{`
          .glow-btn-${uid}:hover {
            background: color-mix(in srgb, ${accentColor} 25%, transparent) !important;
            border-color: color-mix(in srgb, ${accentColor} 60%, transparent) !important;
            box-shadow: 0 0 16px color-mix(in srgb, ${resolvedGlow} 40%, transparent),
                        0 0 40px color-mix(in srgb, ${resolvedGlow} 15%, transparent) !important;
            transform: translateY(-1px) !important;
          }
          .glow-btn-${uid}:active {
            transform: translateY(0) scale(0.97) !important;
            box-shadow: 0 0 8px color-mix(in srgb, ${resolvedGlow} 30%, transparent) !important;
          }
          ${variant === 'ghost' ? `
          .glow-btn-${uid}:hover {
            background: var(--glass-hover) !important;
            border-color: var(--glass-border) !important;
            color: ${accentColor} !important;
          }
          ` : ''}
          ${variant === 'icon' ? `
          .glow-btn-${uid}:hover {
            background: color-mix(in srgb, ${accentColor} 12%, transparent) !important;
            border-color: color-mix(in srgb, ${accentColor} 40%, transparent) !important;
          }
          ` : ''}
        `}</style>
      </>
    );
  }
);

GlowButton.displayName = 'GlowButton';
export default GlowButton;
