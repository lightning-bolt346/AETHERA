'use client';

import React, { useRef, useEffect } from 'react';

function EmberCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const embersRef = useRef<Array<{
    x: number; y: number; size: number; opacity: number;
    speedY: number; speedX: number; life: number; maxLife: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnEmber = () => ({
      x: Math.random() * canvas.width * 0.6 + canvas.width * 0.1,
      y: canvas.height * 0.85 + Math.random() * 40,
      size: Math.random() * 2.5 + 0.8,
      opacity: Math.random() * 0.8 + 0.2,
      speedY: -(Math.random() * 1.2 + 0.5),
      speedX: (Math.random() - 0.5) * 0.6,
      life: 0,
      maxLife: Math.random() * 120 + 60,
    });

    embersRef.current = Array.from({ length: 60 }, spawnEmber);

    let animId: number;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < embersRef.current.length; i++) {
        const e = embersRef.current[i];
        e.life += 1;
        e.y += e.speedY * (1 + e.life / e.maxLife);
        e.x += e.speedX;
        e.opacity = Math.max(0, 1 - e.life / e.maxLife);

        if (e.life >= e.maxLife || e.y < -20) {
          embersRef.current[i] = spawnEmber();
          continue;
        }

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        const r = Math.floor(255);
        const g = Math.floor(120 + (e.life / e.maxLife) * 50);
        ctx.fillStyle = `rgba(${r}, ${g}, 40, ${e.opacity})`;
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

export default function TrumpetBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Base gradient — molten forge */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 80%, #1a0800 0%, #0d0400 40%, #07070F 70%)',
        }}
      />

      {/* Forge floor glow */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          height: '40vh',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(255,120,20,0.15) 0%, rgba(255,80,0,0.05) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Heat shimmer layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,100,0,0.03) 60%, rgba(255,100,0,0.06) 100%)',
          animation: 'heat-shimmer 4s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Ember particles */}
      <EmberCanvas />

      {/* Hot coals / lava cracks at bottom */}
      <svg
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '120px',
          pointerEvents: 'none',
        }}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,60 C100,40 200,80 300,50 C400,20 500,70 600,45 C700,20 800,65 900,40 C1000,15 1100,55 1200,35 C1300,15 1380,45 1440,30 L1440,120 L0,120 Z"
          fill="rgba(80,20,0,0.6)"
        />
        {/* Glowing crack lines */}
        {[120, 280, 450, 600, 750, 900, 1050, 1200, 1350].map((x, i) => (
          <line
            key={i}
            x1={x}
            y1={60 + Math.sin(i) * 20}
            x2={x + 30}
            y2={120}
            stroke="rgba(255,100,20,0.4)"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      <style>{`
        @keyframes heat-shimmer {
          0%, 100% { filter: blur(0px); transform: scaleY(1); }
          25%  { filter: blur(0.3px); transform: scaleY(1.002); }
          50%  { filter: blur(0.6px); transform: scaleY(0.999); }
          75%  { filter: blur(0.2px); transform: scaleY(1.001); }
        }
      `}</style>
    </div>
  );
}
