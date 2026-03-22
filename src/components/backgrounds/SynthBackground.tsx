'use client';

import React, { useRef, useEffect } from 'react';

function PhosphorNoiseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 300;

    let count = 0;
    let animId: number;

    const draw = () => {
      animId = requestAnimationFrame(draw);
      count++;
      if (count % 3 !== 0) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.02) {
          data[i] = 0; data[i+1] = 255; data[i+2] = 65;
          data[i+3] = Math.floor(Math.random() * 30 + 5);
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated',
        opacity: 0.06,
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}

export default function SynthBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#050510' }}>
      {/* Grid floor — perspective */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          width: '300vw',
          height: '60vh',
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          transformOrigin: 'bottom center',
          transform: 'translateX(-50%) perspective(600px) rotateX(55deg)',
          maskImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 30%, black 60%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 30%, black 60%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Phosphor bloom — screen center */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 45%, rgba(0,255,65,0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Static noise — phosphor dots */}
      <PhosphorNoiseCanvas />

      {/* CRT scanlines overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 1px,
            rgba(0,0,0,0.35) 1px,
            rgba(0,0,0,0.35) 2px
          )`,
          backgroundSize: '100% 2px',
          pointerEvents: 'none',
          zIndex: 20,
          animation: 'scanline-flicker 8s ease-in-out infinite',
        }}
      />

      {/* Corner terminal decorations */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 3,
        }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Top-left corner bracket */}
        <path
          d="M20,20 L20,80 M20,20 L80,20"
          stroke="rgba(34,211,238,0.3)"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
        {/* Top-right corner bracket */}
        <path
          d="M1420,20 L1420,80 M1420,20 L1360,20"
          stroke="rgba(34,211,238,0.3)"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
        {/* Bottom-left corner bracket */}
        <path
          d="M20,880 L20,820 M20,880 L80,880"
          stroke="rgba(34,211,238,0.2)"
          strokeWidth="1.5"
          strokeLinecap="square"
        />

        {/* Blinking cursor */}
        <rect
          x="30"
          y="860"
          width="10"
          height="2"
          fill="rgba(34,211,238,0.6)"
          style={{ animation: 'neon-flicker 1.2s step-start infinite' }}
        />

        {/* Status text */}
        <text
          x="30"
          y="50"
          fontFamily="'DM Mono', monospace"
          fontSize="10"
          fill="rgba(34,211,238,0.4)"
          letterSpacing="2"
        >
          AETHERA OS v1.0 // SYNTH MODULE LOADED
        </text>

        {/* Hex grid decoration top-right */}
        <g opacity="0.08">
          {Array.from({ length: 8 }, (_, row) =>
            Array.from({ length: 10 }, (_, col) => {
              const x = 1200 + col * 22 + (row % 2 === 0 ? 0 : 11);
              const y = 60 + row * 19;
              return (
                <polygon
                  key={`${row}-${col}`}
                  points={`${x},${y-10} ${x+9.5},${y-5} ${x+9.5},${y+5} ${x},${y+10} ${x-9.5},${y+5} ${x-9.5},${y-5}`}
                  fill="none"
                  stroke="rgba(34,211,238,0.6)"
                  strokeWidth="0.5"
                />
              );
            })
          )}
        </g>
      </svg>
    </div>
  );
}
