'use client';

import React, { useRef, useEffect, useState } from 'react';

interface WaveformDisplayProps {
  color?: string;
  height?: number;
  width?: number;
  fftSize?: 256 | 512 | 1024;
  isPlaying?: boolean;
  className?: string;
}

export default function WaveformDisplay({
  color = 'var(--color-lume-teal)',
  height = 60,
  width = 300,
  fftSize = 256,
  isPlaying = false,
  className = '',
}: WaveformDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const polylineRef = useRef<SVGPolylineElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    let ctx: AudioContext | null = null;

    const setupAnalyser = async () => {
      try {
        if (typeof window === 'undefined') return;
        ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;
        dataArrayRef.current = new Float32Array(analyser.frequencyBinCount);
      } catch {
        // Web Audio not available, use synthetic waveform
      }
    };

    setupAnalyser();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ctx?.close();
    };
  }, [fftSize]);

  useEffect(() => {
    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);

      if (!polylineRef.current) return;

      const points: string[] = [];
      const segments = fftSize / 2;
      phaseRef.current += isPlaying ? 0.08 : 0.015;

      for (let i = 0; i < segments; i++) {
        const x = (i / (segments - 1)) * width;
        let y: number;

        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
          y = height / 2 + dataArrayRef.current[i] * height * 0.4;
        } else {
          // Synthetic ambient waveform
          const t = (i / segments) * Math.PI * 4;
          const amplitude = isPlaying ? 0.35 : 0.08;
          y =
            height / 2 +
            Math.sin(t + phaseRef.current) * height * amplitude * 0.8 +
            Math.sin(t * 2.3 + phaseRef.current * 1.5) * height * amplitude * 0.3 +
            Math.sin(t * 0.7 + phaseRef.current * 0.5) * height * amplitude * 0.2;
        }

        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }

      polylineRef.current.setAttribute('points', points.join(' '));
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [fftSize, height, width, isPlaying]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className={className}
      style={{
        overflow: 'visible',
        opacity: isPlaying ? 1 : 0.5,
        transition: 'opacity var(--duration-base) var(--ease-smooth)',
        filter: `drop-shadow(0 0 4px ${color})`,
      }}
    >
      <polyline
        ref={polylineRef}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
