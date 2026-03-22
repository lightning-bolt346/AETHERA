'use client';

import React, { useRef, useEffect } from 'react';

function DustMoteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const motes = Array.from({ length: 40 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.3 + 0.05,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      phase: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    let animId: number;

    const draw = () => {
      animId = requestAnimationFrame(draw);
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const m of motes) {
        m.x += m.vx + Math.sin(frame * 0.008 + m.phase) * 0.1;
        m.y += m.vy + Math.cos(frame * 0.006 + m.phase) * 0.08;

        if (m.x < 0) m.x = canvas.width;
        if (m.x > canvas.width) m.x = 0;
        if (m.y < 0) m.y = canvas.height;
        if (m.y > canvas.height) m.y = 0;

        const pulse = (Math.sin(frame * 0.02 + m.phase) + 1) * 0.5;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 230, 180, ${m.opacity * (0.6 + pulse * 0.4)})`;
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

export default function GuitarBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Base gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, #1a0f00 0%, #0f0800 30%, #07070F 70%)',
        }}
      />

      {/* Oil-slick animated overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse at 30% 50%, rgba(245,158,11,0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 40%, rgba(167,139,250,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(34,211,238,0.06) 0%, transparent 40%)
          `,
          animation: 'hue-drift 20s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Prismatic shimmer bands */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(
              125deg,
              transparent 0%,
              rgba(245,158,11,0.04) 20%,
              rgba(167,139,250,0.03) 40%,
              rgba(34,211,238,0.03) 60%,
              rgba(255,107,138,0.02) 80%,
              transparent 100%
            )
          `,
          animation: 'hue-drift 25s ease-in-out infinite reverse',
          pointerEvents: 'none',
        }}
      />

      {/* Dust motes */}
      <DustMoteCanvas />

      {/* Highlight beams */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.15,
        }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0"/>
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points="200,0 400,0 1440,900 1240,900" fill="url(#beam1)"/>
        <polygon points="600,0 680,0 1440,600 1360,600" fill="url(#beam1)" opacity="0.5"/>
      </svg>
    </div>
  );
}
