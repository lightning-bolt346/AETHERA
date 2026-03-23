'use client';

import React, { useRef, useCallback, useEffect } from 'react';

interface XYPadProps {
  x: number; // normalized 0–1
  y: number; // normalized 0–1
  xLabel?: string;
  yLabel?: string;
  color?: string;
  width?: number;
  height?: number;
  onChange: (x: number, y: number) => void;
}

export default function XYPad({
  x,
  y,
  xLabel = 'Filter',
  yLabel = 'Resonance',
  color = 'var(--color-cyber-cyan)',
  width = 280,
  height = 180,
  onChange,
}: XYPadProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const animRef = useRef<number>(0);

  const getPos = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const rect = padRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0.5, y: 0.5 };
      return {
        x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height)),
      };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDragging.current = true;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      const pos = getPos(e.clientX, e.clientY);
      onChange(pos.x, pos.y);
    },
    [getPos, onChange]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      const pos = getPos(e.clientX, e.clientY);
      onChange(pos.x, pos.y);
    },
    [getPos, onChange]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  }, []);

  // Canvas drawing — grid + cursor dot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      const gridCount = 6;
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 1; i < gridCount; i++) {
        const xPos = (i / gridCount) * canvas.width;
        const yPos = (i / gridCount) * canvas.height;
        ctx.beginPath(); ctx.moveTo(xPos, 0); ctx.lineTo(xPos, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, yPos); ctx.lineTo(canvas.width, yPos); ctx.stroke();
      }

      // Crosshair lines
      const dotX = x * canvas.width;
      const dotY = (1 - y) * canvas.height;
      ctx.strokeStyle = 'rgba(34,211,238,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(dotX, 0); ctx.lineTo(dotX, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, dotY); ctx.lineTo(canvas.width, dotY); ctx.stroke();
      ctx.setLineDash([]);

      // Cursor dot with glow
      ctx.beginPath();
      ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34,211,238,0.9)';
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Outer ring
      ctx.beginPath();
      ctx.arc(dotX, dotY, 14, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34,211,238,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [x, y]);

  const freqHz = Math.round(200 * Math.pow(40, x));
  const qVal = (0.5 + y * 19.5).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'center' }}>
      <div
        ref={padRef}
        style={{
          position: 'relative',
          width,
          height,
          background: 'var(--glass-surface)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          cursor: 'crosshair',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-label="XY Filter Pad"
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
        {/* Axis labels */}
        <span style={{ position: 'absolute', bottom: 4, right: 8, fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(107,114,128,0.5)' }}>
          {xLabel} →
        </span>
        <span style={{ position: 'absolute', top: 4, left: 8, fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(107,114,128,0.5)', writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
          ↑ {yLabel}
        </span>
      </div>
      {/* Value readout */}
      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-cyber-cyan)' }}>
          {freqHz}Hz
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-cyber-cyan)' }}>
          Q {qVal}
        </span>
      </div>
    </div>
  );
}
