/**
 * AETHERA Audio Engine — Centralized Tone.js routing graph.
 *
 * Signal path:
 *   [Instrument] → [Instrument Channel (Gain)]
 *     → [Compressor] → [EQ (high-shelf)] → [Master Reverb]
 *     → [Master Gain] → [Waveform Analyser] → [Destination]
 *
 * Must call initAudioEngine() inside a user-gesture handler before
 * any audio playback. The engine is a module-level singleton.
 */

import type {
  Gain,
  Compressor,
  Filter,
  Reverb,
  Waveform,
  ToneAudioNode,
} from 'tone';

interface InstrumentChannel {
  gain: Gain;
}

class AudioEngine {
  private _masterGain: Gain | null = null;
  private _compressor: Compressor | null = null;
  private _eq: Filter | null = null;
  private _reverb: Reverb | null = null;
  private _waveform: Waveform | null = null;
  private _channels: Map<string, InstrumentChannel> = new Map();
  private _initialized = false;

  async initialize(): Promise<void> {
    if (this._initialized) return;

    const Tone = await import('tone');

    // Master gain (user-controlled volume)
    this._masterGain = new Tone.Gain(0.8);

    // Compressor: ratio 4:1, threshold -18dB, attack 10ms, release 100ms
    this._compressor = new Tone.Compressor({
      ratio: 4,
      threshold: -18,
      attack: 0.01,
      release: 0.1,
      knee: 6,
    });

    // EQ: high-shelf +2dB at 8kHz for air/presence
    this._eq = new Tone.Filter({
      type: 'highshelf',
      frequency: 8000,
      gain: 2,
    });

    // Master reverb (hall impulse)
    this._reverb = new Tone.Reverb({ decay: 2.5, wet: 0.1 });
    await this._reverb.ready;

    // Waveform analyser (feeds visualizers)
    this._waveform = new Tone.Waveform(1024);

    // Chain: compressor → EQ → reverb → masterGain → waveform → destination
    this._compressor.connect(this._eq);
    this._eq.connect(this._reverb);
    this._reverb.connect(this._masterGain);
    this._masterGain.connect(this._waveform);
    this._masterGain.connect(Tone.getDestination());

    this._initialized = true;
  }

  /**
   * Get or create an instrument channel connected to the effects chain.
   * Each instrument calls this to get its dedicated gain stage.
   */
  getInstrumentChannel(instrumentId: string): Gain {
    if (!this._compressor) {
      throw new Error('AudioEngine not initialized. Call initAudioEngine() first.');
    }

    const existing = this._channels.get(instrumentId);
    if (existing) return existing.gain;

    import('tone').then((Tone) => {
      if (!this._compressor) return;
      const gain = new Tone.Gain(1.0);
      gain.connect(this._compressor);
      this._channels.set(instrumentId, { gain });
    });

    // Return a placeholder that gets connected async
    // For synchronous callers that need the node immediately,
    // we create it synchronously using the already-loaded module
    throw new Error(
      `Channel for "${instrumentId}" not ready. Use getOrCreateChannel() instead.`
    );
  }

  /**
   * Async version — preferred for use in useEffect hooks.
   */
  async getOrCreateChannel(instrumentId: string): Promise<Gain> {
    if (!this._initialized) {
      throw new Error('AudioEngine not initialized.');
    }

    const existing = this._channels.get(instrumentId);
    if (existing) return existing.gain;

    const Tone = await import('tone');
    const gain = new Tone.Gain(1.0);
    gain.connect(this._compressor!);
    this._channels.set(instrumentId, { gain });
    return gain;
  }

  setChannelVolume(instrumentId: string, value: number): void {
    const channel = this._channels.get(instrumentId);
    if (channel) {
      channel.gain.gain.rampTo(value, 0.05);
    }
  }

  setMasterReverb(wet: number): void {
    this._reverb?.wet.rampTo(wet, 0.1);
  }

  setMasterVolume(volume: number): void {
    this._masterGain?.gain.rampTo(volume, 0.05);
  }

  getWaveform(): Waveform | null {
    return this._waveform;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  dispose(): void {
    this._channels.forEach((ch) => ch.gain.dispose());
    this._channels.clear();
    this._waveform?.dispose();
    this._masterGain?.dispose();
    this._compressor?.dispose();
    this._eq?.dispose();
    this._reverb?.dispose();
    this._initialized = false;
  }
}

// Module-level singleton
let _engineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!_engineInstance) {
    _engineInstance = new AudioEngine();
  }
  return _engineInstance;
}

/**
 * Call this exactly once inside a user-gesture handler (click/keydown).
 * Initializes Tone.js context + the full effects chain.
 */
export async function initAudioEngine(): Promise<AudioEngine> {
  const { start, getContext } = await import('tone');
  await start();
  await getContext().resume();
  const engine = getAudioEngine();
  await engine.initialize();
  return engine;
}
