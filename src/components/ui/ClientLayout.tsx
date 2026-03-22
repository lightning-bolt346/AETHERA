'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import NavigationPill from './NavigationPill';
import CustomCursor from './CustomCursor';
import RippleEffect, { useRipple } from './RippleEffect';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ripples, trigger, remove } = useRipple();

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as Element;
      const instrumentEl = target.closest('[data-instrument-color]') as HTMLElement | null;
      if (instrumentEl) {
        const color = instrumentEl.dataset.instrumentColor || 'var(--color-lume-teal)';
        trigger(e.clientX, e.clientY, color, 'md');
      }
    },
    [trigger]
  );

  return (
    <div onClick={handleClick} style={{ position: 'relative', minHeight: '100vh' }}>
      <CustomCursor />
      <NavigationPill />

      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
          transition={{
            duration: 0.45,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          style={{ position: 'relative' }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <RippleEffect ripples={ripples} onComplete={remove} />
    </div>
  );
}
