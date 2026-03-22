'use client';

import { useCallback, useRef } from 'react';

export interface PointerState {
  x: number;
  y: number;
  isDown: boolean;
  deltaX: number;
  deltaY: number;
  speed: number; // px per ms
}

interface UsePointerOptions {
  onDown?: (state: PointerState, event: PointerEvent) => void;
  onMove?: (state: PointerState, event: PointerEvent) => void;
  onUp?: (state: PointerState, event: PointerEvent) => void;
}

/**
 * Unified Pointer API hook (covers mouse + touch).
 * Returns ref-based bindings to attach to DOM elements.
 */
export function usePointer(options: UsePointerOptions = {}) {
  const stateRef = useRef<PointerState>({
    x: 0, y: 0, isDown: false, deltaX: 0, deltaY: 0, speed: 0,
  });
  const lastTimeRef = useRef(0);
  const { onDown, onMove, onUp } = options;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      stateRef.current = { x, y, isDown: true, deltaX: 0, deltaY: 0, speed: 0 };
      lastTimeRef.current = e.timeStamp;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      onDown?.(stateRef.current, e.nativeEvent);
    },
    [onDown]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!stateRef.current.isDown) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dt = Math.max(1, e.timeStamp - lastTimeRef.current);
      const deltaX = x - stateRef.current.x;
      const deltaY = y - stateRef.current.y;
      const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / dt;

      stateRef.current = { x, y, isDown: true, deltaX, deltaY, speed };
      lastTimeRef.current = e.timeStamp;
      onMove?.(stateRef.current, e.nativeEvent);
    },
    [onMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      stateRef.current = { ...stateRef.current, isDown: false, deltaX: 0, deltaY: 0, speed: 0 };
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      onUp?.(stateRef.current, e.nativeEvent);
    },
    [onUp]
  );

  return {
    stateRef,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  };
}

// Need to import React for PointerEvent handler types
import type React from 'react';
