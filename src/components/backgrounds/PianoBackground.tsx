'use client';

import React, { useRef, useEffect } from 'react';

function BubbleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Array<{ x: number; y: number; size: number; opacity: number; speed: number; wobble: number; phase: number }>>([]);

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

    bubblesRef.current = Array.from({ length: 200 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight + window.innerHeight,
      size: Math.random() * 3 + 0.5,
      opacity: Math.random() * 0.3 + 0.1,
      speed: Math.random() * 0.2 + 0.1,
      wobble: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    let animId: number;

    const draw = () => {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame += 1;

      for (const b of bubblesRef.current) {
        b.y -= b.speed;
        b.x += Math.sin(frame * 0.02 + b.phase) * b.wobble;

        if (b.y < -10) {
          b.y = canvas.height + 10;
          b.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity})`;
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

export default function PianoBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Base gradient — abyssal ocean */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 100%, #001a2e 0%, #001226 25%, #07070F 60%)',
        }}
      />

      {/* Caustic light patterns */}
      {[
        { top: '20%', left: '30%', size: '40vw', delay: '0s', dur: '8s' },
        { top: '50%', left: '60%', size: '35vw', delay: '-3s', dur: '12s' },
        { top: '70%', left: '20%', size: '30vw', delay: '-6s', dur: '10s' },
      ].map((blob, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: blob.top,
            left: blob.left,
            width: blob.size,
            height: blob.size,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(0,255,209,0.04) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(30px)',
            animation: `pulse-ambient ${blob.dur} ease-in-out infinite`,
            animationDelay: blob.delay,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Bubble particles */}
      <BubbleCanvas />

      {/* Seaweed silhouettes at bottom */}
      <svg
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '180px',
          pointerEvents: 'none',
        }}
        viewBox="0 0 1440 180"
        preserveAspectRatio="xMidYMax meet"
      >
        {[0, 120, 240, 360, 500, 640, 780, 920, 1060, 1200, 1320].map((x, i) => (
          <path
            key={i}
            d={`M${x + 20},180 C${x + 10},120 ${x + 40},90 ${x + 20},40 C${x},10 ${x + 50},0 ${x + 30},30`}
            stroke="rgba(0,255,209,0.15)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            style={{
              animation: `${i % 2 === 0 ? 'seaweed-sway-l' : 'seaweed-sway-r'} ${3 + i * 0.4}s ease-in-out infinite alternate`,
              transformOrigin: `${x + 20}px 180px`,
            }}
          />
        ))}
      </svg>

      {/* Floor glow */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '30vh',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(0,255,209,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <style>{`
        @keyframes seaweed-sway-l {
          0%   { transform: rotate(-3deg) scaleX(0.95); }
          100% { transform: rotate(3deg)  scaleX(1.05); }
        }
        @keyframes seaweed-sway-r {
          0%   { transform: rotate(3deg)  scaleX(1.05); }
          100% { transform: rotate(-3deg) scaleX(0.95); }
        }
      `}</style>
    </div>
  );
}
