'use client';

import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Returns reactive breakpoint flags based on viewport width.
 * SSR-safe: defaults to 'lg' on the server.
 */
export function useBreakpoint() {
  const [width, setWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle, { passive: true });
    handle(); // capture accurate initial value after hydration
    return () => window.removeEventListener('resize', handle);
  }, []);

  return {
    width,
    // Mutually exclusive breakpoint flags
    isXs:      width < 480,           // Small phones
    isSm:      width >= 480 && width < 768,  // Large phones
    isMd:      width >= 768 && width < 1024, // Tablets
    isLg:      width >= 1024 && width < 1280, // Small desktops
    isXl:      width >= 1280,          // Large desktops

    // Compound helpers
    isMobile:  width < 768,            // phones (xs + sm)
    isTablet:  width >= 768 && width < 1024, // tablets
    isDesktop: width >= 1024,          // desktop and up
    isTouch:   typeof window !== 'undefined'
      ? window.matchMedia('(pointer: coarse)').matches
      : false,
  };
}

/**
 * Returns the width of a container element, updating on resize.
 * Use this instead of fixed px constants for responsive canvases.
 */
export function useContainerWidth(
  ref: React.RefObject<HTMLElement | null>,
  fallback = 700
): number {
  const [cw, setCw] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      if (entry) setCw(entry.contentRect.width);
    });
    ro.observe(el);
    setCw(el.getBoundingClientRect().width || fallback);
    return () => ro.disconnect();
  }, [fallback, ref]);

  return cw;
}

import type React from 'react';
