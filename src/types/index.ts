export type InstrumentId = 'piano' | 'trumpet' | 'drums' | 'guitar' | 'violin' | 'synth';

export interface InstrumentConfig {
  id: InstrumentId;
  name: string;
  label: string;
  color: string;
  glow: string;
  position: { x: string; y: string };
  description: string;
}

export const INSTRUMENTS: Record<InstrumentId, InstrumentConfig> = {
  piano: {
    id: 'piano',
    name: 'Piano',
    label: 'KEYS',
    color: 'var(--color-lume-teal)',
    glow: 'var(--glow-piano)',
    position: { x: '15%', y: '20%' },
    description: 'Abyssal Ocean',
  },
  trumpet: {
    id: 'trumpet',
    name: 'Trumpet',
    label: 'BRASS',
    color: 'var(--color-amber-pulse)',
    glow: 'var(--glow-trumpet)',
    position: { x: '75%', y: '22%' },
    description: 'Molten Forge',
  },
  drums: {
    id: 'drums',
    name: 'Drums',
    label: 'RHYTHM',
    color: 'var(--color-coral-bloom)',
    glow: 'var(--glow-drums)',
    position: { x: '8%', y: '55%' },
    description: 'Neon Concrete',
  },
  guitar: {
    id: 'guitar',
    name: 'Guitar',
    label: 'STRINGS',
    color: 'var(--color-iris-gold)',
    glow: 'var(--glow-guitar)',
    position: { x: '82%', y: '50%' },
    description: 'Prismatic Loft',
  },
  violin: {
    id: 'violin',
    name: 'Violin',
    label: 'BOW',
    color: 'var(--color-indigo-aurora)',
    glow: 'var(--glow-violin)',
    position: { x: '20%', y: '75%' },
    description: 'Aurora Sanctum',
  },
  synth: {
    id: 'synth',
    name: 'Synthesizer',
    label: 'SYNTH',
    color: 'var(--color-cyber-cyan)',
    glow: 'var(--glow-synth)',
    position: { x: '72%', y: '72%' },
    description: 'Retro-Void Terminal',
  },
};

export type GlassCardSize = 'sm' | 'md' | 'lg';
export type GlowButtonVariant = 'primary' | 'ghost' | 'icon';
export type RippleSize = 'sm' | 'md' | 'lg';
export type FFTSize = 256 | 512 | 1024;
