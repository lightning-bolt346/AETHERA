'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Home',    href: '/' },
  { label: 'Jam',     href: '/jam' },
  { label: 'Record',  href: '/record' },
  { label: 'Gallery', href: '/gallery' },
];

export default function NavigationPill() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current + 20) setVisible(false);
      else if (currentY < lastScrollY.current - 20 || currentY < 80) setVisible(true);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const pillStyle: React.CSSProperties = {
    background: 'rgba(13,13,26,0.90)',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  };

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -20 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed',
          top: 'max(var(--space-6), calc(var(--safe-top) + 12px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          pointerEvents: visible ? 'auto' : 'none',
        }}
        aria-label="Main navigation"
      >
        {/* ── Desktop pill ── */}
        <div
          style={{
            ...pillStyle,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '6px 8px',
            borderRadius: 'var(--radius-pill)',
          }}
          className="hide-mobile"
        >
          {/* Logo mark */}
          <Link href="/" style={{ textDecoration: 'none', marginRight: 'var(--space-2)' }} aria-label="AETHERA home">
            <div
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'conic-gradient(from 0deg, var(--color-lume-teal), var(--color-indigo-aurora), var(--color-amber-pulse), var(--color-lume-teal))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: 'var(--space-2)',
                animation: 'rotate-slow 8s linear infinite',
                flexShrink: 0,
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-void-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', letterSpacing: '0.05em', color: 'var(--color-lume-teal)', fontWeight: 500 }}>Æ</span>
              </div>
            </div>
          </Link>

          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} data-interactive>
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
                    minHeight: 32,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {item.label}
                  {active && (
                    <span style={{
                      position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: '50%',
                      background: 'var(--color-lume-teal)',
                      boxShadow: '0 0 6px var(--color-lume-teal)',
                    }} />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Mobile pill with hamburger ── */}
        <div
          style={{ ...pillStyle, padding: '8px 16px', borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}
          className="show-mobile"
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }} aria-label="AETHERA home">
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'conic-gradient(from 0deg, var(--color-lume-teal), var(--color-indigo-aurora), var(--color-amber-pulse), var(--color-lume-teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'rotate-slow 8s linear infinite', flexShrink: 0 }}>
              <div style={{ width: 17, height: 17, borderRadius: '50%', background: 'var(--color-void-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '6px', color: 'var(--color-lume-teal)', fontWeight: 500 }}>Æ</span>
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-starfield)' }}>
              AETHERA
            </span>
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: '5px', padding: '4px',
              minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center',
            }}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ display: 'block', width: '22px', height: '1.5px', background: 'var(--color-starfield)', borderRadius: 'var(--radius-pill)' }} />
            ))}
          </button>
        </div>
      </motion.nav>

      {/* Mobile full-screen overlay menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(7,7,15,0.97)',
              backdropFilter: 'blur(24px)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-8)',
              paddingTop: 'var(--safe-top)',
              paddingBottom: 'var(--safe-bottom)',
            }}
            role="dialog"
            aria-label="Navigation menu"
          >
            {/* Close button */}
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation menu"
              style={{
                position: 'absolute',
                top: 'max(24px, calc(var(--safe-top) + 12px))',
                right: 24,
                background: 'var(--glass-surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--color-starfield)',
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              ✕
            </button>

            {/* Nav items */}
            {NAV_ITEMS.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(36px, 10vw, 56px)',
                    fontWeight: 300,
                    color: isActive(item.href) ? 'var(--color-lume-teal)' : 'var(--color-starfield)',
                    textDecoration: 'none',
                    letterSpacing: '-0.02em',
                    display: 'block',
                    padding: 'var(--space-2) var(--space-6)',
                    textAlign: 'center',
                  }}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}

            {/* Divider + instrument links */}
            <div style={{ width: '80%', height: 1, background: 'var(--glass-border)' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-3)', maxWidth: 360 }}>
              {Object.values(INSTRUMENTS).map((inst) => (
                <Link
                  key={inst.id}
                  href={`/instruments/${inst.id}`}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: inst.color,
                    textDecoration: 'none',
                    padding: 'var(--space-2) var(--space-3)',
                    border: `1px solid color-mix(in srgb, ${inst.color} 30%, transparent)`,
                    borderRadius: 'var(--radius-pill)',
                    background: `color-mix(in srgb, ${inst.color} 8%, transparent)`,
                  }}
                >
                  {inst.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { INSTRUMENTS } from '@/types';
