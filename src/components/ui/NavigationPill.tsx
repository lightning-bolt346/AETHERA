'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Jam', href: '/jam' },
  { label: 'Record', href: '/record' },
  { label: 'Gallery', href: '/gallery' },
];

export default function NavigationPill() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current + 20) {
        setVisible(false);
      } else if (currentY < lastScrollY.current - 20 || currentY < 80) {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -20 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed',
          top: 'var(--space-6)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        {/* Desktop pill */}
        <div
          className="hidden-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '6px 8px',
            background: 'rgba(13,13,26,0.85)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-pill)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          {/* Logo mark */}
          <Link href="/" style={{ textDecoration: 'none', marginRight: 'var(--space-2)' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, var(--color-lume-teal), var(--color-indigo-aurora), var(--color-amber-pulse), var(--color-lume-teal))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 'var(--space-2)',
                animation: 'rotate-slow 8s linear infinite',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--color-void-mid)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '7px',
                    letterSpacing: '0.05em',
                    color: 'var(--color-lume-teal)',
                    fontWeight: 500,
                  }}
                >
                  Æ
                </span>
              </div>
            </div>
          </Link>

          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: 'none' }}
                data-cursor-accent="var(--color-lume-teal)"
                data-interactive
              >
                <div
                  style={{
                    position: 'relative',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: active ? 500 : 400,
                    color: active ? 'var(--color-lume-teal)' : 'var(--color-starfield)',
                    background: active ? 'rgba(0,255,209,0.08)' : 'transparent',
                    transition: 'all var(--duration-fast) var(--ease-smooth)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 2,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: 'var(--color-lume-teal)',
                        boxShadow: '0 0 6px var(--color-lume-teal)',
                      }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <div
          className="mobile-only"
          style={{
            display: 'none',
            padding: '10px 16px',
            background: 'rgba(13,13,26,0.85)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-pill)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-starfield)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              padding: 0,
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: 'block',
                  width: '22px',
                  height: '1.5px',
                  background: 'var(--color-starfield)',
                  borderRadius: 'var(--radius-pill)',
                  transition: 'transform var(--duration-fast) var(--ease-spring)',
                }}
              />
            ))}
          </button>
        </div>
      </motion.nav>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(7,7,15,0.97)',
              backdropFilter: 'blur(20px)',
              zIndex: 49,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-8)',
            }}
          >
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                background: 'none',
                border: 'none',
                color: 'var(--color-starfield)',
                fontSize: 24,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            {NAV_ITEMS.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-3xl)',
                    fontWeight: 300,
                    color: isActive(item.href) ? 'var(--color-lume-teal)' : 'var(--color-starfield)',
                    textDecoration: 'none',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .mobile-only { display: block !important; }
        }
        @media (min-width: 641px) {
          .mobile-only { display: none !important; }
          .hidden-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
