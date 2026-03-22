'use client';

import React, { useEffect, useRef } from 'react';

interface RippleInstance {
  id: number;
  x: number;
  y: number;
  color: string;
  size: 'sm' | 'md' | 'lg';
}

interface RippleEffectProps {
  ripples: RippleInstance[];
  onComplete: (id: number) => void;
}

const SIZE_MAP = {
  sm:  [30, 60, 100],
  md:  [60, 120, 200],
  lg:  [100, 180, 280],
};

function SingleRipple({
  ripple,
  onComplete,
}: {
  ripple: RippleInstance;
  onComplete: (id: number) => void;
}) {
  const radii = SIZE_MAP[ripple.size];

  useEffect(() => {
    const timer = setTimeout(() => onComplete(ripple.id), 800);
    return () => clearTimeout(timer);
  }, [ripple.id, onComplete]);

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9000,
        overflow: 'visible',
      }}
    >
      {radii.map((maxR, i) => (
        <circle
          key={i}
          cx={ripple.x}
          cy={ripple.y}
          r={0}
          fill="none"
          stroke={ripple.color}
          strokeWidth={1.5}
          style={{
            animation: `ripple-out 600ms ease-out ${i * 100}ms both`,
            transformOrigin: `${ripple.x}px ${ripple.y}px`,
            transform: `scale(0)`,
          }}
        >
          <animate
            attributeName="r"
            from="0"
            to={maxR}
            dur="600ms"
            begin={`${i * 100}ms`}
            fill="freeze"
          />
          <animate
            attributeName="opacity"
            from="1"
            to="0"
            dur="600ms"
            begin={`${i * 100}ms`}
            fill="freeze"
          />
        </circle>
      ))}
    </svg>
  );
}

export default function RippleEffect({ ripples, onComplete }: RippleEffectProps) {
  return (
    <>
      {ripples.map((ripple) => (
        <SingleRipple key={ripple.id} ripple={ripple} onComplete={onComplete} />
      ))}
    </>
  );
}

export function useRipple() {
  const [ripples, setRipples] = React.useState<RippleInstance[]>([]);
  const counterRef = useRef(0);

  const trigger = React.useCallback(
    (x: number, y: number, color: string, size: 'sm' | 'md' | 'lg' = 'md') => {
      const id = ++counterRef.current;
      setRipples((prev) => [...prev, { id, x, y, color, size }]);
    },
    []
  );

  const remove = React.useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { ripples, trigger, remove };
}
