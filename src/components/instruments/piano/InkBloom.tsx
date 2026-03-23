'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface BloomParticle {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

interface InkBloomProps {
  width: number;
  height: number;
}

export interface InkBloomHandle {
  spawn: (x: number, y: number, octave: number, isLowNote: boolean) => void;
}

const InkBloom = React.forwardRef<InkBloomHandle, InkBloomProps>(
  ({ width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bloomsRef = useRef<BloomParticle[]>([]);
    const animRef = useRef<number>(0);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        animRef.current = requestAnimationFrame(draw);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        bloomsRef.current = bloomsRef.current.filter((b) => b.alpha > 0);

        for (const b of bloomsRef.current) {
          b.radius += 4;
          b.alpha -= 0.018;
          if (b.alpha <= 0) continue;

          const r = parseInt(b.color.slice(1, 3), 16);
          const g = parseInt(b.color.slice(3, 5), 16);
          const bl = parseInt(b.color.slice(5, 7), 16);

          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${bl}, ${Math.max(0, b.alpha)})`;
          ctx.fill();
        }
      };

      animRef.current = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(animRef.current);
    }, []);

    React.useImperativeHandle(ref, () => ({
      spawn: (x: number, y: number, octave: number, isLowNote: boolean) => {
        const maxRadius = 80 + octave * 20;
        const color = isLowNote ? '#00FFD1' : '#FF6B8A';
        bloomsRef.current.push({ x, y, radius: 0, maxRadius, color, alpha: 0.6 });
        // Cap to prevent accumulation
        if (bloomsRef.current.length > 40) {
          bloomsRef.current.splice(0, bloomsRef.current.length - 40);
        }
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
    );
  }
);

InkBloom.displayName = 'InkBloom';
export default InkBloom;
