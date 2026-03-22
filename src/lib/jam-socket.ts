/**
 * AETHERA Jam Room — Ably Realtime WebSocket client
 *
 * Requires NEXT_PUBLIC_ABLY_API_KEY environment variable.
 * Supports up to 4 players per room. Room IDs are 6-char alphanumeric codes.
 */

export type JamMessageType =
  | 'noteOn'
  | 'noteOff'
  | 'padHit'
  | 'playerJoined'
  | 'playerLeft'
  | 'ping'
  | 'pong';

export interface JamMessage {
  type: JamMessageType;
  senderId: string;
  timestamp: number;
}

export interface NoteOnMessage extends JamMessage {
  type: 'noteOn';
  instrument: string;
  note: string;
  velocity: number;
}

export interface NoteOffMessage extends JamMessage {
  type: 'noteOff';
  instrument: string;
  note: string;
}

export interface PadHitMessage extends JamMessage {
  type: 'padHit';
  instrument: 'drums';
  pad: string;
  velocity: number;
}

export interface PlayerJoinedMessage extends JamMessage {
  type: 'playerJoined';
  playerId: string;
  playerName: string;
  instrument: string;
  color: string;
}

export interface PlayerLeftMessage extends JamMessage {
  type: 'playerLeft';
  playerId: string;
}

export type AnyJamMessage =
  | NoteOnMessage
  | NoteOffMessage
  | PadHitMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage;

export const PLAYER_COLORS = [
  'var(--color-lume-teal)',
  'var(--color-amber-pulse)',
  'var(--color-coral-bloom)',
  'var(--color-indigo-aurora)',
];

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function generatePlayerId(): string {
  return `p_${Math.random().toString(36).slice(2, 10)}`;
}

interface JamSocketCallbacks {
  onMessage: (msg: AnyJamMessage) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onLatency: (ms: number) => void;
}

export class JamSocket {
  private channelName: string;
  private playerId: string;
  private callbacks: JamSocketCallbacks;
  private ablyClient: unknown = null;
  private ablyChannel: unknown = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pingStart = 0;

  constructor(roomCode: string, playerId: string, callbacks: JamSocketCallbacks) {
    this.channelName = `aethera-jam-${roomCode}`;
    this.playerId = playerId;
    this.callbacks = callbacks;
  }

  async connect(): Promise<void> {
    const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY;
    if (!apiKey) {
      console.warn('[JamSocket] NEXT_PUBLIC_ABLY_API_KEY not set. Jam room requires Ably credentials.');
      return;
    }

    const Ably = await import('ably');
    const client = new Ably.Realtime({ key: apiKey, clientId: this.playerId });
    this.ablyClient = client;

    await new Promise<void>((resolve) => {
      (client as { connection: { once: (event: string, cb: () => void) => void } }).connection.once('connected', () => {
        this.callbacks.onConnected();
        resolve();
      });
    });

    const channel = (client as { channels: { get: (name: string) => unknown } }).channels.get(this.channelName);
    this.ablyChannel = channel;

    (channel as { subscribe: (cb: (msg: { data: AnyJamMessage }) => void) => void }).subscribe((msg) => {
      if ((msg.data as JamMessage).senderId === this.playerId) return;
      if ((msg.data as JamMessage).type === 'pong') {
        this.callbacks.onLatency(Date.now() - this.pingStart);
        return;
      }
      this.callbacks.onMessage(msg.data as AnyJamMessage);
    });

    // Ping every 5 seconds for latency measurement
    this.pingInterval = setInterval(() => {
      this.pingStart = Date.now();
      (this.ablyChannel as { publish: (event: string, data: unknown) => void } | null)?.publish(
        'jam',
        { type: 'ping', senderId: this.playerId, timestamp: this.pingStart }
      );
    }, 5000);
  }

  publish(message: Partial<AnyJamMessage> & { type: JamMessageType }): void {
    const full = { ...message, senderId: this.playerId, timestamp: Date.now() };
    (this.ablyChannel as { publish: (event: string, data: unknown) => void } | null)?.publish('jam', full);
  }

  sendNoteOn(instrument: string, note: string, velocity: number): void {
    this.publish({ type: 'noteOn', instrument, note, velocity } as Partial<NoteOnMessage> & { type: 'noteOn' });
  }

  sendNoteOff(instrument: string, note: string): void {
    this.publish({ type: 'noteOff', instrument, note } as Partial<NoteOffMessage> & { type: 'noteOff' });
  }

  sendPadHit(pad: string, velocity: number): void {
    this.publish({ type: 'padHit', instrument: 'drums', pad, velocity } as Partial<PadHitMessage> & { type: 'padHit' });
  }

  sendPlayerJoined(playerName: string, instrument: string, color: string): void {
    this.publish({
      type: 'playerJoined',
      playerId: this.playerId,
      playerName,
      instrument,
      color,
    } as Partial<PlayerJoinedMessage> & { type: 'playerJoined' });
  }

  disconnect(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.publish({ type: 'playerLeft', playerId: this.playerId } as Partial<PlayerLeftMessage> & { type: 'playerLeft' });
    (this.ablyClient as { close: () => void } | null)?.close();
    this.callbacks.onDisconnected();
  }
}
