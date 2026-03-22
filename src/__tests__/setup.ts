import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tone.js entirely to avoid Web Audio API in tests
vi.mock('tone', () => {
  const mockNode = {
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
    toDestination: vi.fn().mockReturnThis(),
    set: vi.fn(),
    get: vi.fn(() => ({})),
    wet: { rampTo: vi.fn(), value: 0 },
    frequency: { rampTo: vi.fn(), value: 440, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    Q: { rampTo: vi.fn(), value: 1 },
    gain: { rampTo: vi.fn(), value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
    bpm: { value: 120 },
  };

  const makeNode = () => ({
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
    toDestination: vi.fn().mockReturnThis(),
    set: vi.fn(),
    get: vi.fn(() => ({})),
    wet: { rampTo: vi.fn(), value: 0 },
    frequency: { rampTo: vi.fn(), value: 440, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    Q: { rampTo: vi.fn(), value: 1 },
    gain: { rampTo: vi.fn(), value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
    bpm: { value: 120 },
    input: {},
  });

  class MockSampler { loaded = true; triggerAttack = vi.fn(); triggerRelease = vi.fn(); triggerAttackRelease = vi.fn(); ready = Promise.resolve(); connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); set = vi.fn(); }
  class MockPolySynth { triggerAttack = vi.fn(); triggerRelease = vi.fn(); triggerAttackRelease = vi.fn(); connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); set = vi.fn(); get = vi.fn(() => ({})); }
  class MockSynth { triggerAttack = vi.fn(); triggerRelease = vi.fn(); triggerAttackRelease = vi.fn(); connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); set = vi.fn(); }
  class MockFilter { frequency = { rampTo: vi.fn(), value: 2000 }; Q = { rampTo: vi.fn(), value: 1 }; connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); input = {}; }
  class MockLFO { connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); start = vi.fn(); stop = vi.fn(); frequency = { rampTo: vi.fn(), value: 2 }; }
  class MockReverb { ready = Promise.resolve(); wet = { rampTo: vi.fn(), value: 0.3 }; connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); }
  class MockFeedbackDelay { wet = { rampTo: vi.fn(), value: 0.2 }; connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); }
  class MockVibrato { wet = { rampTo: vi.fn(), value: 0 }; connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); }
  class MockDistortion { wet = { rampTo: vi.fn(), value: 0.3 }; connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); }
  class MockCompressor { connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); }
  class MockGain { gain = { rampTo: vi.fn(), value: 1 }; input = {}; connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); }
  class MockPlayer { start = vi.fn(); stop = vi.fn(); connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); }
  class MockWaveform { getValue = vi.fn(() => new Float32Array(1024)); connect = vi.fn().mockReturnThis(); disconnect = vi.fn(); dispose = vi.fn(); }
  class MockSequence { start = vi.fn(); stop = vi.fn(); connect = vi.fn(); disconnect = vi.fn(); dispose = vi.fn(); }
  class MockPattern { start = vi.fn(); stop = vi.fn(); connect = vi.fn(); disconnect = vi.fn(); dispose = vi.fn(); interval = '8n'; }

  const mockTransport = {
    start: vi.fn(),
    stop: vi.fn(),
    bpm: { value: 120 },
    scheduleRepeat: vi.fn(() => 0),
    cancel: vi.fn(),
    ticks: 0,
  };

  const mockDraw = {
    schedule: vi.fn((fn: () => void) => fn()),
  };

  return {
    Sampler: MockSampler,
    PolySynth: MockPolySynth,
    Synth: MockSynth,
    Filter: MockFilter,
    LFO: MockLFO,
    Reverb: MockReverb,
    FeedbackDelay: MockFeedbackDelay,
    Vibrato: MockVibrato,
    Distortion: MockDistortion,
    Compressor: MockCompressor,
    Gain: MockGain,
    Player: MockPlayer,
    Waveform: MockWaveform,
    Sequence: MockSequence,
    Pattern: MockPattern,
    start: vi.fn().mockResolvedValue(undefined),
    getContext: vi.fn(() => ({
      resume: vi.fn().mockResolvedValue(undefined),
      rawContext: {
        currentTime: 0,
        sampleRate: 44100,
        createOscillator: vi.fn(() => ({
          frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          type: 'sine',
        })),
        createGain: vi.fn(() => ({
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
        })),
        createBuffer: vi.fn(() => ({
          getChannelData: vi.fn(() => new Float32Array(100)),
        })),
        createBufferSource: vi.fn(() => ({
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
        })),
        createBiquadFilter: vi.fn(() => ({
          type: 'lowpass',
          frequency: { value: 1000 },
          Q: { value: 1 },
          connect: vi.fn(),
        })),
        createAnalyser: vi.fn(() => ({
          fftSize: 2048,
          frequencyBinCount: 1024,
          connect: vi.fn(),
          getFloatTimeDomainData: vi.fn(),
        })),
        destination: {},
      },
    })),
    getDestination: vi.fn(() => ({ volume: { rampTo: vi.fn() } })),
    getTransport: vi.fn(() => mockTransport),
    getDraw: vi.fn(() => mockDraw),
    now: vi.fn(() => 0),
    Frequency: vi.fn(() => ({
      transpose: vi.fn().mockReturnThis(),
      toNote: vi.fn(() => 'C4'),
    })),
  };
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })),
  usePathname: vi.fn(() => '/'),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: new Proxy({}, {
      get: (_target, prop) => {
        const Component = ({ children, ...props }: Record<string, unknown>) => {
          const React = require('react');
          return React.createElement(prop as string, props, children);
        };
        return Component;
      },
    }),
  };
});

// Suppress expected Web Audio API async rejections in jsdom test environment
window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e.reason);
  if (msg.includes('AudioContext') || msg.includes('Tone') || msg.includes('audio')) {
    e.preventDefault();
  }
});

// Mock pointer capture APIs (not in jsdom)
if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = vi.fn();
}
if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = vi.fn();
}
if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
}

// Mock ResizeObserver as a proper class constructor
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_callback: ResizeObserverCallback) {}
};

// Mock canvas
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(400) })),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  shadowBlur: 0,
  shadowColor: '',
  setLineDash: vi.fn(),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock @react-three/fiber to avoid WebGL in tests
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'r3f-canvas' }, children),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ camera: {}, scene: {}, gl: {} })),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Html: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}));

import React from 'react';
