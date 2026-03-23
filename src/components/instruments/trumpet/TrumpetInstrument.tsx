'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  Suspense,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/hooks/useAudio';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useInstrumentStore } from '@/stores/instrumentStore';
import { valvesToNote } from '@/lib/note-mappings';
import { TRUMPET_SAMPLE_URLS, TRUMPET_BASE_URL } from '@/lib/sample-loader';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';
import type { Sampler, Vibrato, Distortion, Gain } from 'tone';

// Procedural 3D trumpet
function TrumpetModel({ isPlaying, valves }: { isPlaying: boolean; valves: [boolean, boolean, boolean] }) {
  const groupRef = useRef<THREE.Group>(null);
  const shakeRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.4;
    if (isPlaying) {
      shakeRef.current += 0.3;
      groupRef.current.position.x = Math.sin(shakeRef.current * 10) * 0.04;
      groupRef.current.rotation.z = Math.PI * 0.05;
    } else {
      groupRef.current.position.x *= 0.85;
      groupRef.current.rotation.z *= 0.9;
    }
  });

  const brassMat = <meshStandardMaterial color="#B8860B" metalness={0.92} roughness={0.12} />;
  const silverMat = <meshStandardMaterial color="#C0C0C0" metalness={0.88} roughness={0.18} />;

  return (
    <group ref={groupRef} scale={0.7}>
      <mesh position={[-1.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.7, 1.2, 32]} />{brassMat}
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 3.2, 16]} />{brassMat}
      </mesh>
      <mesh position={[-1.2, 0.3, 0]}>
        <torusGeometry args={[0.28, 0.07, 12, 24, Math.PI * 0.5]} />{brassMat}
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.9, 16]} />{brassMat}
      </mesh>
      {([0.25, 0, -0.25] as const).map((xOff, i) => (
        <group key={i} position={[xOff, valves[i] ? 0.28 : 0.5, 0]}>
          <mesh><cylinderGeometry args={[0.12, 0.12, 0.35, 16]} />{silverMat}</mesh>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
            <meshStandardMaterial color={valves[i] ? '#FFAA40' : '#888888'} metalness={0.7} roughness={0.3}
              emissive={valves[i] ? new THREE.Color(0.4, 0.2, 0) : new THREE.Color(0, 0, 0)} />
          </mesh>
        </group>
      ))}
      <mesh position={[1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.4, 16]} />{brassMat}
      </mesh>
    </group>
  );
}

// Shockwave rings
interface ShockwaveRing { id: number; delay: number; maxSize: number; }

function ShockwaveRings({ trigger, originX, originY }: { trigger: number; originX: number; originY: number }) {
  const [rings, setRings] = useState<ShockwaveRing[]>([]);
  useEffect(() => {
    if (trigger === 0) return;
    const newRings: ShockwaveRing[] = [
      { id: trigger * 10,     delay: 0,   maxSize: 40 },
      { id: trigger * 10 + 1, delay: 120, maxSize: 80 },
      { id: trigger * 10 + 2, delay: 240, maxSize: 140 },
    ];
    setRings((prev) => [...prev, ...newRings]);
    setTimeout(() => setRings((prev) => prev.filter((r) => !newRings.find((nr) => nr.id === r.id))), 1400);
  }, [trigger]);

  return (
    <svg style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 8000, overflow: 'visible' }}>
      {rings.map((ring) => (
        <circle key={ring.id} cx={originX} cy={originY} r={0} fill="none" stroke="var(--color-amber-pulse)" strokeWidth={2} opacity={0}>
          <animate attributeName="r" from="0" to={ring.maxSize} dur="1000ms" begin={`${ring.delay}ms`} fill="freeze" />
          <animate attributeName="opacity" from="0.8" to="0" dur="1000ms" begin={`${ring.delay}ms`} fill="freeze" />
        </circle>
      ))}
    </svg>
  );
}

export interface TrumpetInstrumentProps {
  onNotePlay?: (note: string) => void;
}

export default function TrumpetInstrument({ onNotePlay }: TrumpetInstrumentProps) {
  const { ensureInitialized, getOrCreateChannel } = useAudio();
  const { isMobile, isTablet } = useBreakpoint();
  const valves = useInstrumentStore((s) => s.valves);
  const setValve = useInstrumentStore((s) => s.setValve);
  const isBlowing = useInstrumentStore((s) => s.isBlowing);
  const setBlowing = useInstrumentStore((s) => s.setBlowing);

  const samplerRef = useRef<Sampler | null>(null);
  const vibratoRef = useRef<Vibrato | null>(null);
  const channelRef = useRef<Gain | null>(null);
  const vibratoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shockTrigger, setShockTrigger] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);
  const bellPos = useRef({ x: 0, y: 0 });
  const currentNote = useRef('');

  useEffect(() => {
    let disposed = false;
    const setup = async () => {
      await ensureInitialized();
      if (disposed) return;
      const Tone = await import('tone');
      const channel = await getOrCreateChannel('trumpet');
      channelRef.current = channel;
      const vibrato = new Tone.Vibrato({ frequency: 5, depth: 0.1, wet: 0 });
      vibratoRef.current = vibrato;
      const distortion = new Tone.Distortion({ distortion: 0.08, wet: 0.3 });
      const reverb = new Tone.Reverb({ decay: 2, wet: 0.2 });
      await reverb.ready;
      const sampler = new Tone.Sampler({ urls: TRUMPET_SAMPLE_URLS, baseUrl: TRUMPET_BASE_URL, release: 0.3, onload: () => { if (!disposed) setIsLoaded(true); }, onerror: () => { if (!disposed) setIsLoaded(true); } });
      sampler.connect(vibrato); vibrato.connect(distortion); distortion.connect(reverb); reverb.connect(channel);
      samplerRef.current = sampler;
    };
    setup();
    return () => { disposed = true; samplerRef.current?.dispose(); vibratoRef.current?.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const noteOn = useCallback(async (note: string) => {
    await ensureInitialized();
    if (currentNote.current && currentNote.current !== note) samplerRef.current?.triggerRelease(currentNote.current);
    currentNote.current = note;
    samplerRef.current?.triggerAttack(note, undefined, 0.85);
    setBlowing(true);
    onNotePlay?.(note);
    if (bellRef.current) {
      const r = bellRef.current.getBoundingClientRect();
      bellPos.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    setShockTrigger((t) => t + 1);
    if (vibratoTimerRef.current) clearTimeout(vibratoTimerRef.current);
    vibratoTimerRef.current = setTimeout(() => vibratoRef.current?.wet.rampTo(0.5, 0.3), 600);
  }, [ensureInitialized, setBlowing, onNotePlay]);

  const noteOff = useCallback(() => {
    if (!currentNote.current) return;
    samplerRef.current?.triggerRelease(currentNote.current, '+0.3');
    currentNote.current = '';
    setBlowing(false);
    if (vibratoTimerRef.current) clearTimeout(vibratoTimerRef.current);
    vibratoRef.current?.wet.rampTo(0, 0.1);
  }, [setBlowing]);

  const blow = useCallback(() => { noteOn(valvesToNote(valves)); }, [valves, noteOn]);

  useEffect(() => {
    if (!isBlowing) return;
    const note = valvesToNote(valves);
    if (note !== currentNote.current) noteOn(note);
  }, [valves, isBlowing, noteOn]);

  useKeyboard(
    (key) => {
      if (key === ' ') { blow(); return; }
      if (key === '1') setValve(0, true);
      if (key === '2') setValve(1, true);
      if (key === '3') setValve(2, true);
    },
    (key) => {
      if (key === ' ') { noteOff(); return; }
      if (key === '1') setValve(0, false);
      if (key === '2') setValve(1, false);
      if (key === '3') setValve(2, false);
    }
  );

  const currentNoteName = valvesToNote(valves);
  const canvasH = isMobile ? 180 : isTablet ? 220 : 280;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', width: '100%', maxWidth: isMobile ? '100%' : 680 }}>
      {/* 3D Model */}
      <div ref={bellRef} style={{ width: '100%', maxWidth: 500, height: canvasH, position: 'relative' }}>
        <Canvas camera={{ position: [0, 1, 5], fov: 45 }} style={{ background: 'transparent' }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[3, 3, 3]} color="#FFAA40" intensity={2} />
          <pointLight position={[-2, -1, 2]} intensity={0.5} />
          <Suspense fallback={null}>
            <TrumpetModel isPlaying={isBlowing} valves={valves} />
          </Suspense>
        </Canvas>
        <AnimatePresence mode="wait">
          {isBlowing && (
            <motion.div key={currentNoteName} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: 700, color: 'var(--color-amber-pulse)', textShadow: 'var(--glow-trumpet)', letterSpacing: '-0.02em', pointerEvents: 'none' }}>
              {currentNoteName}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Valves + Blow — responsive row */}
      <GlassCard accent="trumpet" size={isMobile ? 'sm' : 'md'} style={{ width: '100%', maxWidth: 480 }}>
        <div
          className="trumpet-controls-row"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', flexWrap: isMobile ? 'wrap' : 'nowrap' }}
        >
          {/* Valve buttons */}
          {([0, 1, 2] as const).map((i) => {
            const isPressed = valves[i];
            return (
              <button
                key={i}
                data-testid={`trumpet-valve-${i + 1}`}
                aria-label={`Trumpet valve ${i + 1}`}
                aria-pressed={isPressed}
                className="trumpet-valve-btn"
                onPointerDown={(e) => { e.preventDefault(); setValve(i, true); }}
                onPointerUp={() => setValve(i, false)}
                onPointerLeave={() => setValve(i, false)}
                style={{
                  width: isMobile ? 72 : 80, height: isMobile ? 72 : 80,
                  borderRadius: '50%',
                  background: isPressed ? 'color-mix(in srgb, var(--color-amber-pulse) 25%, transparent)' : 'var(--glass-surface)',
                  border: `2px solid ${isPressed ? 'var(--color-amber-pulse)' : 'rgba(255,170,64,0.3)'}`,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  boxShadow: isPressed ? 'var(--glow-trumpet)' : 'none',
                  transform: isPressed ? 'scaleY(0.88) translateY(4px)' : 'none',
                  transition: 'transform 60ms var(--ease-snap), background 60ms, border-color 60ms',
                  userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none',
                  minWidth: 44, minHeight: 44,
                }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 'var(--text-lg)' : 'var(--text-xl)', fontWeight: 700, color: isPressed ? 'var(--color-amber-pulse)' : 'var(--color-starfield)', lineHeight: 1 }}>{i + 1}</span>
                {!isMobile && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-mist)' }}>KEY {i + 1}</span>}
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ width: isMobile ? '100%' : 1, height: isMobile ? 1 : 70, background: 'var(--glass-border)' }} />

          {/* Blow button */}
          <button
            data-testid="trumpet-blow"
            aria-label="Blow trumpet"
            onPointerDown={(e) => { e.preventDefault(); blow(); }}
            onPointerUp={noteOff}
            onPointerLeave={noteOff}
            style={{
              padding: isMobile ? '14px 28px' : '16px 32px',
              background: isBlowing ? 'color-mix(in srgb, var(--color-amber-pulse) 20%, transparent)' : 'var(--glass-surface)',
              border: `2px solid ${isBlowing ? 'var(--color-amber-pulse)' : 'rgba(255,170,64,0.3)'}`,
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 500,
              color: isBlowing ? 'var(--color-amber-pulse)' : 'var(--color-starfield)',
              boxShadow: isBlowing ? 'var(--glow-trumpet)' : 'none',
              transition: 'all 60ms var(--ease-snap)',
              userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none',
              minHeight: 44, minWidth: 100,
            }}
          >
            {isBlowing ? '▶ BLOWING' : '▷ BLOW'}
            {!isMobile && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-mist)', marginTop: 4 }}>SPACE</div>}
          </button>
        </div>
      </GlassCard>

      {/* Note + valve display */}
      <GlassCard accent="trumpet" size="sm">
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="label-mono" style={{ color: 'var(--color-mist)', marginBottom: 4 }}>Note</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-amber-pulse)', letterSpacing: '-0.02em' }}>
              {currentNoteName}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="label-mono" style={{ color: 'var(--color-mist)', marginBottom: 4 }}>Valves</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)' }}>
              {valves.map((v, i) => (
                <span key={i} style={{ color: v ? 'var(--color-amber-pulse)' : 'var(--color-mist)', marginRight: 4 }}>{i + 1}</span>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <ShockwaveRings trigger={shockTrigger} originX={bellPos.current.x} originY={bellPos.current.y} />

      <div className="label-mono" style={{ color: 'var(--color-mist)', textAlign: 'center' }}>
        {isMobile ? 'Hold valves · Tap BLOW' : '1/2/3 = valves · Space = blow'}
      </div>
    </div>
  );
}
