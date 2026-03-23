import { create } from 'zustand';

export interface JamPlayer {
  id: string;
  name: string;
  instrument: string;
  color: string;
  isConnected: boolean;
}

interface UIStoreState {
  activeRoom: string | null;
  cursorAccent: string;
  isTransitioning: boolean;
  roomCode: string | null;
  jamPlayers: JamPlayer[];
  selfPlayerId: string | null;
  latencyMs: number;
}

interface UIStoreActions {
  setActiveRoom: (room: string | null) => void;
  setCursorAccent: (color: string) => void;
  setTransitioning: (v: boolean) => void;
  setRoomCode: (code: string | null) => void;
  addJamPlayer: (player: JamPlayer) => void;
  removeJamPlayer: (id: string) => void;
  updateJamPlayer: (id: string, update: Partial<JamPlayer>) => void;
  setSelfPlayerId: (id: string | null) => void;
  setLatency: (ms: number) => void;
}

type UIStore = UIStoreState & UIStoreActions;

export const useUIStore = create<UIStore>()((set) => ({
  activeRoom: null,
  cursorAccent: 'var(--color-lume-teal)',
  isTransitioning: false,
  roomCode: null,
  jamPlayers: [],
  selfPlayerId: null,
  latencyMs: 0,

  setActiveRoom: (room) => set({ activeRoom: room }),
  setCursorAccent: (color) => set({ cursorAccent: color }),
  setTransitioning: (v) => set({ isTransitioning: v }),
  setRoomCode: (code) => set({ roomCode: code }),

  addJamPlayer: (player) =>
    set((s) => ({ jamPlayers: [...s.jamPlayers.filter((p) => p.id !== player.id), player] })),

  removeJamPlayer: (id) =>
    set((s) => ({ jamPlayers: s.jamPlayers.filter((p) => p.id !== id) })),

  updateJamPlayer: (id, update) =>
    set((s) => ({
      jamPlayers: s.jamPlayers.map((p) => (p.id === id ? { ...p, ...update } : p)),
    })),

  setSelfPlayerId: (id) => set({ selfPlayerId: id }),
  setLatency: (ms) => set({ latencyMs: ms }),
}));
