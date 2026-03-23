/**
 * AETHERA Sample Loader
 * Lazy loads audio buffers with progress tracking.
 * Caches loaded buffers in a module-level Map to prevent re-fetching.
 */

type LoadProgress = { loaded: number; total: number; percent: number };
type ProgressCallback = (progress: LoadProgress) => void;

// Module-level cache — persists across component mounts
const bufferCache = new Map<string, AudioBuffer>();
const loadingPromises = new Map<string, Promise<AudioBuffer>>();

export async function loadAudioBuffer(
  url: string,
  audioContext: AudioContext,
  onProgress?: ProgressCallback
): Promise<AudioBuffer> {
  const cached = bufferCache.get(url);
  if (cached) return cached;

  const existingPromise = loadingPromises.get(url);
  if (existingPromise) return existingPromise;

  const promise = (async (): Promise<AudioBuffer> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${url} (${response.status})`);
    }

    const contentLength = Number(response.headers.get('content-length') ?? 0);
    const reader = response.body?.getReader();

    if (!reader) {
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await audioContext.decodeAudioData(arrayBuffer);
      bufferCache.set(url, decoded);
      return decoded;
    }

    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      onProgress?.({
        loaded,
        total: contentLength,
        percent: contentLength > 0 ? (loaded / contentLength) * 100 : 0,
      });
    }

    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const decoded = await audioContext.decodeAudioData(merged.buffer);
    bufferCache.set(url, decoded);
    loadingPromises.delete(url);
    return decoded;
  })();

  loadingPromises.set(url, promise);
  return promise;
}

export function getCachedBuffer(url: string): AudioBuffer | undefined {
  return bufferCache.get(url);
}

export function clearSampleCache(): void {
  bufferCache.clear();
  loadingPromises.clear();
}

/**
 * Salamander Grand Piano sample URLs (official Tone.js CDN).
 * These cover the full range; Tone.Sampler interpolates the rest.
 */
export const PIANO_SAMPLE_URLS: Record<string, string> = {
  A0:  'A0.mp3',
  C1:  'C1.mp3',
  'D#1': 'Ds1.mp3',
  'F#1': 'Fs1.mp3',
  A1:  'A1.mp3',
  C2:  'C2.mp3',
  'D#2': 'Ds2.mp3',
  'F#2': 'Fs2.mp3',
  A2:  'A2.mp3',
  C3:  'C3.mp3',
  'D#3': 'Ds3.mp3',
  'F#3': 'Fs3.mp3',
  A3:  'A3.mp3',
  C4:  'C4.mp3',
  'D#4': 'Ds4.mp3',
  'F#4': 'Fs4.mp3',
  A4:  'A4.mp3',
  C5:  'C5.mp3',
  'D#5': 'Ds5.mp3',
  'F#5': 'Fs5.mp3',
  A5:  'A5.mp3',
  C6:  'C6.mp3',
  'D#6': 'Ds6.mp3',
  'F#6': 'Fs6.mp3',
  A6:  'A6.mp3',
  C7:  'C7.mp3',
  'D#7': 'Ds7.mp3',
  'F#7': 'Fs7.mp3',
  A7:  'A7.mp3',
  C8:  'C8.mp3',
};

export const PIANO_BASE_URL = 'https://tonejs.github.io/audio/salamander/';

/**
 * Guitar sample URLs (nbrosowsky tonejs-instruments collection).
 */
export const GUITAR_SAMPLE_URLS: Record<string, string> = {
  E2: 'E2.mp3', A2: 'A2.mp3', D3: 'D3.mp3',
  G3: 'G3.mp3', B3: 'B3.mp3', E4: 'E4.mp3',
};
export const GUITAR_BASE_URL =
  'https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-nylon/';

/**
 * Violin sample URLs.
 */
export const VIOLIN_SAMPLE_URLS: Record<string, string> = {
  G3: 'G3.mp3', D4: 'D4.mp3', A4: 'A4.mp3', E5: 'E5.mp3',
  A3: 'A3.mp3', E4: 'E4.mp3', B4: 'B4.mp3',
};
export const VIOLIN_BASE_URL =
  'https://nbrosowsky.github.io/tonejs-instruments/samples/violin/';

/**
 * Trumpet sample URLs.
 */
export const TRUMPET_SAMPLE_URLS: Record<string, string> = {
  'Bb4': 'Bb4.mp3',
  'A4':  'A4.mp3',
  'Ab4': 'Ab4.mp3',
  'G4':  'G4.mp3',
  'F4':  'F4.mp3',
  'E4':  'E4.mp3',
};
export const TRUMPET_BASE_URL =
  'https://nbrosowsky.github.io/tonejs-instruments/samples/trumpet/';
