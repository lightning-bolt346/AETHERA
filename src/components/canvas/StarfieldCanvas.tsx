'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  parallaxFactor: number;
}

interface StarfieldCanvasProps {
  count?: number;
  parallaxFactor?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function StarfieldCanvas({
  count = 800,
  parallaxFactor = 0.02,
  className = '',
  style,
}: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  const initStars = useCallback(() => {
    starsRef.current = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.8 + 0.3,
      opacity: Math.random() * 0.7 + 0.1,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
      parallaxFactor: Math.random() * parallaxFactor,
    }));
  }, [count, parallaxFactor]);

  useEffect(() => {
    initStars();
  }, [initStars]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      timeRef.current += 1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const offsetX = (mouseRef.current.x - 0.5) * canvas.width;
      const offsetY = (mouseRef.current.y - 0.5) * canvas.height;

      for (const star of starsRef.current) {
        const twinkle = Math.sin(timeRef.current * star.twinkleSpeed + star.twinklePhase);
        const currentOpacity = star.opacity * (0.7 + twinkle * 0.3);

        const px = (star.x * canvas.width + offsetX * star.parallaxFactor) % canvas.width;
        const py = (star.y * canvas.height + offsetY * star.parallaxFactor) % canvas.height;

        const x = ((px % canvas.width) + canvas.width) % canvas.width;
        const y = ((py % canvas.height) + canvas.height) % canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(184, 192, 224, ${currentOpacity})`;
        ctx.fill();
      }
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
