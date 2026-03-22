'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';

interface KnobControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  color?: string;
  size?: number;
  formatValue?: (v: number) => string;
  onChange: (value: number) => void;
}

export default function KnobControl({
  label,
  value,
  min,
  max,
  step = 0.01,
  color = 'var(--color-cyber-cyan)',
  size = 56,
  formatValue,
  onChange,
}: KnobControlProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ startY: number; startVal: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const startAngle = 135; // degrees
  const endAngle = 405;   // degrees (135 + 270)
  const range = endAngle - startAngle;

  const normalized = (value - min) / (max - min);
  const currentAngle = startAngle + normalized * range;

  const polarToXY = (angle: number, r: number): { x: number; y: number } => {
    const rad = (angle - 90) * (Math.PI / 180);
    const cx = size / 2;
    const cy = size / 2;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (from: number, to: number, r: number): string => {
    const s = polarToXY(from, r);
    const e = polarToXY(to, r);
    const largeArc = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      dragRef.current = { startY: e.clientY, startVal: value };
      setIsDragging(true);
      svgRef.current?.setPointerCapture(e.pointerId);
    },
    [value]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragRef.current) return;
      const deltaY = dragRef.current.startY - e.clientY;
      const dragRange = max - min;
      const delta = (deltaY / 150) * dragRange;
      const next = Math.min(max, Math.max(min, dragRef.current.startVal + delta));
      const stepped = Math.round(next / step) * step;
      onChange(parseFloat(stepped.toFixed(6)));
    },
    [min, max, step, onChange]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const displayValue = formatValue
    ? formatValue(value)
    : value < 1
    ? value.toFixed(2)
    : Math.round(value).toString();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-1)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Value readout above */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: isDragging ? color : 'var(--color-starfield)',
          letterSpacing: '0.05em',
          transition: 'color var(--duration-fast)',
        }}
      >
        {displayValue}
      </div>

      {/* SVG knob */}
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          filter: isDragging ? `drop-shadow(0 0 6px ${color})` : 'none',
          transition: 'filter var(--duration-fast)',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
      >
        {/* Track arc (full range) */}
        <path
          d={describeArc(startAngle, endAngle, r)}
          fill="none"
          stroke="var(--glass-border)"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Active arc (value range) */}
        {normalized > 0 && (
          <path
            d={describeArc(startAngle, currentAngle, r)}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {/* Knob body */}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--color-void-lift)" stroke="var(--glass-border)" strokeWidth={1} />

        {/* Indicator dot */}
        {(() => {
          const dotPos = polarToXY(currentAngle, r * 0.42);
          return (
            <circle cx={dotPos.x} cy={dotPos.y} r={2.5} fill={color} />
          );
        })()}
      </svg>

      {/* Label below */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-mist)',
        }}
      >
        {label}
      </div>
    </div>
  );
}
