'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CursorState {
  x: number;
  y: number;
  isHovering: boolean;
  accentColor: string;
}

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      const target = e.target as Element;
      const isInteractive =
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('.interactive') ||
        target.closest('[data-interactive]');

      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;

        if (isInteractive) {
          dotRef.current.style.width = '6px';
          dotRef.current.style.height = '6px';
          dotRef.current.style.opacity = '0.6';
        } else {
          dotRef.current.style.width = '8px';
          dotRef.current.style.height = '8px';
          dotRef.current.style.opacity = '0.8';
        }
      }
    };

    const smoothRing = () => {
      animFrameRef.current = requestAnimationFrame(smoothRing);
      if (!ringRef.current) return;

      ringPosRef.current.x += (posRef.current.x - ringPosRef.current.x) * 0.12;
      ringPosRef.current.y += (posRef.current.y - ringPosRef.current.y) * 0.12;

      ringRef.current.style.left = `${ringPosRef.current.x}px`;
      ringRef.current.style.top = `${ringPosRef.current.y}px`;
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as Element;
      const interactive = target.closest('[data-cursor-accent]') as HTMLElement | null;
      if (interactive && ringRef.current) {
        const color = interactive.dataset.cursorAccent || 'rgba(255,255,255,0.3)';
        ringRef.current.style.borderColor = color;
        ringRef.current.style.background = `${color}10`;
        ringRef.current.style.width = '40px';
        ringRef.current.style.height = '40px';
        ringRef.current.style.opacity = '1';
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest('[data-cursor-accent]') && ringRef.current) {
        ringRef.current.style.borderColor = 'rgba(255,255,255,0.3)';
        ringRef.current.style.background = 'transparent';
        ringRef.current.style.width = '32px';
        ringRef.current.style.height = '32px';
        ringRef.current.style.opacity = '0';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseEnter);
    document.addEventListener('mouseout', handleMouseLeave);
    animFrameRef.current = requestAnimationFrame(smoothRing);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          width: '8px',
          height: '8px',
          background: 'var(--color-starfield)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0.8,
          transform: 'translate(-50%, -50%)',
          transition: 'width 150ms var(--ease-spring), height 150ms var(--ease-spring), opacity 150ms',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          width: '32px',
          height: '32px',
          border: '1.5px solid rgba(255,255,255,0.3)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9998,
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          transition: 'width 200ms var(--ease-spring), height 200ms var(--ease-spring), opacity 200ms, border-color 200ms, background 200ms',
        }}
      />
    </>
  );
}
