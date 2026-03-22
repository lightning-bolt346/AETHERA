'use client';

import React, { useRef, useEffect } from 'react';

function AuroraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const RIBBONS = [
      { color: '#A78BFA', baseY: 0.3, amplitude: 0.08, freq: 0.002, speed: 0.0008, phase: 0, opacity: 0.25 },
      { color: '#6366F1', baseY: 0.4, amplitude: 0.10, freq: 0.0015, speed: 0.0006, phase: 2.1, opacity: 0.18 },
      { color: '#818CF8', baseY: 0.25, amplitude: 0.06, freq: 0.0025, speed: 0.001, phase: 4.2, opacity: 0.20 },
      { color: '#C4B5FD', baseY: 0.45, amplitude: 0.12, freq: 0.0012, speed: 0.0005, phase: 1.0, opacity: 0.15 },
    ];

    let time = 0;
    let animId: number;

    const draw = () => {
      animId = requestAnimationFrame(draw);
      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const r of RIBBONS) {
        const points: Array<{ x: number; y: number }> = [];
        const segments = 80;

        for (let i = 0; i <= segments; i++) {
          const px = (i / segments) * canvas.width;
          const baseY = r.baseY * canvas.height;
          const wave =
            Math.sin(i * r.freq * canvas.width + time * r.speed * 1000 + r.phase) * r.amplitude * canvas.height +
            Math.sin(i * r.freq * 1.5 * canvas.width + time * r.speed * 800 + r.phase + 1) * r.amplitude * 0.4 * canvas.height;
          points.push({ x: px, y: baseY + wave });
        }

        // Draw ribbon with gradient thickness
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y - 20);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y - 20);
        }
        for (let i = points.length - 1; i >= 0; i--) {
          ctx.lineTo(points[i].x, points[i].y + 20);
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
        grad.addColorStop(0, `${r.color}00`);
        grad.addColorStop(0.2, `${r.color}${Math.floor(r.opacity * 255).toString(16).padStart(2,'0')}`);
        grad.addColorStop(0.8, `${r.color}${Math.floor(r.opacity * 255).toString(16).padStart(2,'0')}`);
        grad.addColorStop(1, `${r.color}00`);
        ctx.fillStyle = grad;
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

function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 600 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.7 + 0.1,
      twinkleSpeed: Math.random() * 0.03 + 0.005,
      phase: Math.random() * Math.PI * 2,
    }));

    let time = 0;
    let animId: number;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        const t = Math.sin(time * s.twinkleSpeed + s.phase);
        const op = s.opacity * (0.6 + t * 0.4);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(184,192,224,${op})`;
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

export default function ViolinBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Base gradient — aurora sanctum */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, #0d0033 0%, #080020 30%, #07070F 60%)',
        }}
      />

      {/* Star field */}
      <StarField />

      {/* Aurora ribbons */}
      <AuroraCanvas />

      {/* Top glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '40vh',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
