'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
}

export interface SprayParticlesHandle {
  burst: (x: number, y: number, color: string, count?: number) => void;
}

const SprayParticles = forwardRef<SprayParticlesHandle, { width: number; height: number }>(
  ({ width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const poolRef = useRef<Particle[]>([]);
    const animRef = useRef<number>(0);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        animRef.current = requestAnimationFrame(draw);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        poolRef.current = poolRef.current.filter((p) => p.alpha > 0);

        for (const p of poolRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15; // gravity
          p.alpha -= 0.022;
          p.life++;
          if (p.alpha <= 0) continue;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          const r = parseInt(p.color.slice(1, 3), 16);
          const g = parseInt(p.color.slice(3, 5), 16);
          const b = parseInt(p.color.slice(5, 7), 16);
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.max(0, p.alpha)})`;
          ctx.fill();
        }
      };

      animRef.current = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(animRef.current);
    }, []);

    useImperativeHandle(ref, () => ({
      burst: (x: number, y: number, color: string, count = 16) => {
        const hexColor = color.startsWith('#') ? color : '#FF6B8A';
        for (let i = 0; i < count; i++) {
          const angle = (Math.random() * Math.PI * 2);
          const speed = 2 + Math.random() * 6;
          // Cap particle pool at 200 total
          if (poolRef.current.length >= 200) {
            poolRef.current.splice(0, count);
          }
          poolRef.current.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: 3 + Math.random() * 3,
            color: hexColor,
            alpha: 1,
            life: 0,
          });
        }
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}
      />
    );
  }
);

SprayParticles.displayName = 'SprayParticles';
export default SprayParticles;
