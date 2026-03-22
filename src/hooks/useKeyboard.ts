'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseKeyboardOptions {
  enabled?: boolean;
  /** Keys to ignore (e.g. navigation keys that should scroll the page) */
  ignoreKeys?: string[];
}

/**
 * Global keyboard event hook with repeat prevention.
 * Ignores events when focus is in an input/textarea.
 */
export function useKeyboard(
  onKeyDown: (key: string, event: KeyboardEvent) => void,
  onKeyUp: (key: string, event: KeyboardEvent) => void,
  options: UseKeyboardOptions = {}
) {
  const { enabled = true, ignoreKeys = [] } = options;
  const pressedRef = useRef<Set<string>>(new Set());
  // Keep latest callbacks stable across renders
  const downRef = useRef(onKeyDown);
  const upRef = useRef(onKeyUp);
  downRef.current = onKeyDown;
  upRef.current = onKeyUp;

  useEffect(() => {
    if (!enabled) return;

    const handleDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      const key = e.key.toLowerCase();
      if (ignoreKeys.includes(key)) return;
      if (pressedRef.current.has(key)) return; // prevent key repeat

      pressedRef.current.add(key);
      downRef.current(key, e);
    };

    const handleUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!pressedRef.current.has(key)) return;
      pressedRef.current.delete(key);
      upRef.current(key, e);
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);

    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      pressedRef.current.clear();
    };
  }, [enabled, ignoreKeys]);
}

/**
 * Check if a key is currently pressed.
 * Returns a stable ref-based getter — safe to call from animation loops.
 */
export function usePressedKeys(): React.MutableRefObject<Set<string>> {
  const pressedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => pressedRef.current.add(e.key.toLowerCase());
    const handleUp = (e: KeyboardEvent) => pressedRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  return pressedRef;
}

// Need to import React for MutableRefObject type
import type React from 'react';
