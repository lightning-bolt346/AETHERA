'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { InstrumentConfig } from '@/types';

interface InstrumentOrbProps {
  instrument: InstrumentConfig;
  delay?: number;
}

const INSTRUMENT_ICONS: Record<string, React.ReactNode> = {
  piano: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="32" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="8" y="10" width="5" height="13" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="16" y="10" width="5" height="13" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="27" y="10" width="5" height="13" rx="1" fill="currentColor" opacity="0.9"/>
      <line x1="12" y1="23" x2="12" y2="32" stroke="currentColor" strokeWidth="1"/>
      <line x1="20" y1="23" x2="20" y2="32" stroke="currentColor" strokeWidth="1"/>
      <line x1="28" y1="23" x2="28" y2="32" stroke="currentColor" strokeWidth="1"/>
    </svg>
  ),
  trumpet: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 24 L18 20 L26 20 L30 16 L36 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="36" cy="20" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M4 24 C2 26, 2 28, 4 28 L10 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="22" y1="16" x2="22" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  drums: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="18" rx="14" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M6 18 L6 28 Q6 34 20 34 Q34 34 34 28 L34 18" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="20" y1="8" x2="28" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="26" y1="14" x2="34" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  guitar: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="28" rx="8" ry="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="20" cy="28" r="3" stroke="currentColor" strokeWidth="1" fill="none"/>
      <line x1="20" y1="6" x2="20" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="16" y="5" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
      <line x1="16" y1="20" x2="24" y2="20" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  violin: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6 C20 6 24 10 24 16 C24 19 22 20 20 20 C18 20 16 19 16 16 C16 10 20 6 20 6Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M16 16 C14 17 13 19 13 22 C13 27 16 32 20 34 C24 32 27 27 27 22 C27 19 26 17 24 16" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="20" y1="20" x2="20" y2="34" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2"/>
      <line x1="4" y1="20" x2="8" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  synth: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="12" width="32" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="20" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="22" cy="20" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="28" y1="16" x2="28" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="17" x2="32" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="8" y="26" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="14" y="26" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="20" y="26" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
    </svg>
  ),
};

export default function InstrumentOrb({ instrument, delay = 0 }: InstrumentOrbProps) {
  const router = useRouter();
  const orbRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isCracking, setIsCracking] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!orbRef.current) return;
    const rect = orbRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * 12, y: -dx * 12 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  const handleClick = useCallback(() => {
    if (isCracking) return;
    setIsCracking(true);
    setTimeout(() => {
      router.push(`/instruments/${instrument.id}`);
    }, 500);
  }, [isCracking, instrument.id, router]);

  const orbSize = 120;
  const ringOffset = 6;

  return (
    <div
      style={{
        position: 'absolute',
        left: instrument.position.x,
        top: instrument.position.y,
        transform: 'translate(-50%, -50%)',
        opacity: isVisible ? 1 : 0,
        transition: `opacity 800ms ease ${delay}ms`,
        zIndex: 20,
      }}
    >
      {/* Label above orb */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: isHovered ? instrument.color : 'var(--color-mist)',
          transition: `color var(--duration-base) var(--ease-smooth)`,
        }}
      >
        {instrument.label}
      </div>

      {/* Orb container */}
      <div
        ref={orbRef}
        style={{
          position: 'relative',
          width: orbSize,
          height: orbSize,
          cursor: 'pointer',
          perspective: '400px',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {/* Rotating outer ring */}
        <div
          style={{
            position: 'absolute',
            inset: -ringOffset,
            borderRadius: '50%',
            background: `conic-gradient(
              from 0deg,
              transparent 0deg,
              ${instrument.color} 60deg,
              transparent 120deg,
              transparent 180deg,
              ${instrument.color}88 240deg,
              transparent 300deg
            )`,
            animation: `rotate-slow ${isHovered ? '1.5s' : '4s'} linear infinite`,
            transition: 'animation-duration var(--duration-slow)',
            opacity: isHovered ? 0.9 : 0.4,
          }}
        />

        {/* Inner orb — top half (crack animation) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            overflow: 'hidden',
            transform: isCracking ? 'translateY(-60%)' : 'translateY(0)',
            transition: isCracking ? 'transform 500ms cubic-bezier(0.4, 0, 1, 1)' : 'none',
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(
                ellipse at 35% 35%,
                color-mix(in srgb, ${instrument.color} 60%, white) 0%,
                ${instrument.color} 30%,
                color-mix(in srgb, ${instrument.color} 40%, #07070F) 60%,
                #07070F 100%
              )`,
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered && !isCracking ? 1.08 : 1})`,
              transition: `transform var(--duration-base) var(--ease-smooth)`,
              animation: `pulse-ambient 3s ease-in-out infinite`,
              boxShadow: isHovered ? instrument.glow : 'none',
            }}
          />
        </div>

        {/* Inner orb — bottom half */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            overflow: 'hidden',
            transform: isCracking ? 'translateY(60%)' : 'translateY(0)',
            transition: isCracking ? 'transform 500ms cubic-bezier(0.4, 0, 1, 1)' : 'none',
            clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(
                ellipse at 35% 35%,
                color-mix(in srgb, ${instrument.color} 60%, white) 0%,
                ${instrument.color} 30%,
                color-mix(in srgb, ${instrument.color} 40%, #07070F) 60%,
                #07070F 100%
              )`,
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered && !isCracking ? 1.08 : 1})`,
              transition: `transform var(--duration-base) var(--ease-smooth)`,
              animation: `pulse-ambient 3s ease-in-out infinite`,
            }}
          />
        </div>

        {/* Center icon */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.9)',
            zIndex: 10,
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.1 : 1})`,
            transition: `transform var(--duration-base) var(--ease-smooth)`,
            width: 44,
            height: 44,
            margin: 'auto',
            top: '50%',
            left: '50%',
            marginTop: -22,
            marginLeft: -22,
          }}
        >
          {INSTRUMENT_ICONS[instrument.id]}
        </div>

        {/* Ambient glow pulse ring */}
        <div
          style={{
            position: 'absolute',
            inset: -20,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${instrument.color}20 0%, transparent 70%)`,
            opacity: isHovered ? 1 : 0.3,
            animation: `pulse-ambient 3s ease-in-out infinite`,
            transition: `opacity var(--duration-base) var(--ease-smooth)`,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Instrument name below orb */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '10px',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-base)',
          fontWeight: 500,
          color: isHovered ? instrument.color : 'var(--color-starfield)',
          transition: `color var(--duration-base) var(--ease-smooth)`,
          textShadow: isHovered ? `0 0 20px ${instrument.color}` : 'none',
        }}
      >
        {instrument.name}
      </div>
    </div>
  );
}
