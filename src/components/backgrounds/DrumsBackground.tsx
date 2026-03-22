'use client';

import React, { useRef, useEffect } from 'react';

function StaticNoiseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 200;

    let count = 0;
    let animId: number;

    const drawNoise = () => {
      animId = requestAnimationFrame(drawNoise);
      count++;
      if (count % 3 !== 0) return;

      const imageData = ctx.createImageData(200, 200);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() < 0.05 ? 255 : 0;
        data[i] = v; data[i+1] = v; data[i+2] = v;
        data[i+3] = Math.random() < 0.05 ? Math.floor(Math.random() * 20) : 0;
      }
      ctx.putImageData(imageData, 0, 0);
    };

    animId = requestAnimationFrame(drawNoise);
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
        opacity: 0.05,
        imageRendering: 'pixelated',
        pointerEvents: 'none',
      }}
    />
  );
}

export default function DrumsBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0A0A0A' }}>
      {/* Grid lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          pointerEvents: 'none',
        }}
      />

      {/* Concrete texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          pointerEvents: 'none',
          opacity: 0.4,
        }}
      />

      {/* Static noise canvas */}
      <StaticNoiseCanvas />

      {/* Spray paint splatters */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Coral bloom splatter — bottom right */}
        <g opacity="0.35">
          {Array.from({ length: 30 }, (_, i) => {
            const cx = 1200 + Math.sin(i * 0.7) * 120;
            const cy = 700 + Math.cos(i * 0.8) * 100;
            const r = Math.random() * 15 + 3;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="var(--color-coral-bloom)"
                opacity={0.1 + Math.random() * 0.25}
              />
            );
          })}
          <circle cx="1180" cy="680" r="60" fill="var(--color-coral-bloom)" opacity="0.08"/>
        </g>

        {/* Amber pulse splatter — top left */}
        <g opacity="0.3">
          {Array.from({ length: 20 }, (_, i) => {
            const cx = 80 + Math.sin(i * 1.2) * 90;
            const cy = 120 + Math.cos(i * 0.9) * 80;
            const r = Math.random() * 12 + 2;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="var(--color-amber-pulse)"
                opacity={0.08 + Math.random() * 0.2}
              />
            );
          })}
        </g>

        {/* Cyber cyan drip — right side */}
        <path
          d="M1380,200 C1390,220 1400,240 1385,260 C1370,280 1390,300 1380,320"
          stroke="var(--color-cyber-cyan)"
          strokeWidth="3"
          fill="none"
          opacity="0.25"
        />
        <circle cx="1381" cy="330" r="8" fill="var(--color-cyber-cyan)" opacity="0.2"/>

        {/* Neon tube — top left corner */}
        <g>
          <rect
            x="20"
            y="30"
            width="180"
            height="8"
            rx="4"
            fill="none"
            stroke="var(--color-coral-bloom)"
            strokeWidth="2"
            style={{ animation: 'neon-flicker 5s ease-in-out infinite' }}
          />
          <rect
            x="20"
            y="30"
            width="180"
            height="8"
            rx="4"
            fill="none"
            stroke="var(--color-coral-bloom)"
            strokeWidth="8"
            opacity="0.1"
            filter="blur(4px)"
            style={{ animation: 'neon-flicker 5s ease-in-out infinite' }}
          />
          <text
            x="30"
            y="24"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--color-coral-bloom)"
            opacity="0.6"
            letterSpacing="2"
            style={{ animation: 'neon-flicker 5s ease-in-out infinite' }}
          >
            DRUM MACHINE
          </text>
        </g>
      </svg>
    </div>
  );
}
