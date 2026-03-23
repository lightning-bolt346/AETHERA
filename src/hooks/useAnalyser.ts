'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getAudioEngine } from '@/lib/audio-engine';
import { useAudioStore } from '@/stores/audioStore';

/**
 * Hook that provides access to the global Waveform analyser data.
 * Returns a stable getter function that reads current waveform values.
 * All drawing should happen inside requestAnimationFrame loops, not React state.
 */
export function useAnalyser() {
  const isInitialized = useAudioStore((s) => s.isInitialized);

  const getWaveformData = useCallback((): Float32Array => {
    if (!isInitialized) return new Float32Array(1024);
    const waveform = getAudioEngine().getWaveform();
    if (!waveform) return new Float32Array(1024);
    const values = waveform.getValue();
    // Tone.js Waveform.getValue() returns Float32Array | number
    if (values instanceof Float32Array) return values;
    // fallback if it returns a single number
    const arr = new Float32Array(1024);
    arr.fill(values as number);
    return arr;
  }, [isInitialized]);

  return { getWaveformData };
}

/**
 * Attach a canvas-based oscilloscope drawing loop.
 * Returns a ref to attach to your <canvas> element.
 */
export function useOscilloscope(color = 'rgba(34,211,238,0.9)', glowColor = '#22D3EE') {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getWaveformData } = useAnalyser();
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const { width, height } = canvas;

      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const data = getWaveformData();
      const len = data.length;

      for (let i = 0; i < len; i++) {
        const x = (i / (len - 1)) * width;
        const y = ((data[i] + 1) / 2) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [color, glowColor, getWaveformData]);

  return canvasRef;
}
