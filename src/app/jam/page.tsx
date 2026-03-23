'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import StarfieldCanvas from '@/components/canvas/StarfieldCanvas';
import NebulaBlobs from '@/components/canvas/NebulaBlobs';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';
import { useUIStore } from '@/stores/uiStore';
import {
  JamSocket,
  generateRoomCode,
  generatePlayerId,
  PLAYER_COLORS,
  type AnyJamMessage,
} from '@/lib/jam-socket';
import type { JamPlayer } from '@/stores/uiStore';

const INSTRUMENT_OPTIONS = [
  { id: 'piano',   label: 'Piano',  color: 'var(--color-lume-teal)' },
  { id: 'drums',   label: 'Drums',  color: 'var(--color-coral-bloom)' },
  { id: 'synth',   label: 'Synth',  color: 'var(--color-cyber-cyan)' },
  { id: 'guitar',  label: 'Guitar', color: 'var(--color-iris-gold)' },
  { id: 'violin',  label: 'Violin', color: 'var(--color-indigo-aurora)' },
  { id: 'trumpet', label: 'Trumpet',color: 'var(--color-amber-pulse)' },
];

type JamPhase = 'lobby' | 'connecting' | 'room';

export default function JamPage() {
  const router = useRouter();
  const {
    roomCode, setRoomCode,
    jamPlayers, addJamPlayer, removeJamPlayer,
    selfPlayerId, setSelfPlayerId,
    latencyMs, setLatency,
  } = useUIStore();

  const [phase, setPhase] = useState<JamPhase>('lobby');
  const [inputCode, setInputCode] = useState('');
  const [playerName, setPlayerName] = useState('Player');
  const [selectedInstrument, setSelectedInstrument] = useState('piano');
  const [error, setError] = useState('');
  const socketRef = useRef<JamSocket | null>(null);
  const selfIdRef = useRef(generatePlayerId());

  const handleMessage = useCallback(
    (msg: AnyJamMessage) => {
      switch (msg.type) {
        case 'playerJoined':
          addJamPlayer({
            id: msg.playerId,
            name: msg.playerName,
            instrument: msg.instrument,
            color: msg.color,
            isConnected: true,
          });
          break;
        case 'playerLeft':
          removeJamPlayer(msg.playerId);
          break;
        // noteOn/noteOff/padHit would trigger remote audio playback here
        default:
          break;
      }
    },
    [addJamPlayer, removeJamPlayer]
  );

  const createRoom = useCallback(async () => {
    setPhase('connecting');
    setError('');
    const code = generateRoomCode();
    const selfId = selfIdRef.current;
    setSelfPlayerId(selfId);
    setRoomCode(code);

    const socket = new JamSocket(code, selfId, {
      onMessage: handleMessage,
      onConnected: () => {
        setPhase('room');
        socket.sendPlayerJoined(
          playerName,
          selectedInstrument,
          PLAYER_COLORS[0] ?? 'var(--color-lume-teal)'
        );
        addJamPlayer({
          id: selfId,
          name: playerName,
          instrument: selectedInstrument,
          color: PLAYER_COLORS[0] ?? 'var(--color-lume-teal)',
          isConnected: true,
        });
      },
      onDisconnected: () => setPhase('lobby'),
      onLatency: (ms) => setLatency(ms),
    });

    socketRef.current = socket;

    if (!process.env.NEXT_PUBLIC_ABLY_API_KEY) {
      // Demo mode without Ably
      setPhase('room');
      addJamPlayer({
        id: selfId,
        name: playerName,
        instrument: selectedInstrument,
        color: PLAYER_COLORS[0] ?? 'var(--color-lume-teal)',
        isConnected: true,
      });
      return;
    }

    try {
      await socket.connect();
    } catch {
      setError('Failed to connect. Check your Ably API key.');
      setPhase('lobby');
    }
  }, [playerName, selectedInstrument, setSelfPlayerId, setRoomCode, addJamPlayer, setLatency, handleMessage]);

  const joinRoom = useCallback(async () => {
    const code = inputCode.trim().toUpperCase();
    if (code.length !== 6) { setError('Room code must be 6 characters'); return; }

    setPhase('connecting');
    setError('');
    const selfId = selfIdRef.current;
    setSelfPlayerId(selfId);
    setRoomCode(code);

    const socket = new JamSocket(code, selfId, {
      onMessage: handleMessage,
      onConnected: () => {
        setPhase('room');
        const colorIndex = jamPlayers.length % PLAYER_COLORS.length;
        const color = PLAYER_COLORS[colorIndex] ?? 'var(--color-lume-teal)';
        socket.sendPlayerJoined(playerName, selectedInstrument, color);
        addJamPlayer({
          id: selfId,
          name: playerName,
          instrument: selectedInstrument,
          color,
          isConnected: true,
        });
      },
      onDisconnected: () => setPhase('lobby'),
      onLatency: (ms) => setLatency(ms),
    });

    socketRef.current = socket;

    if (!process.env.NEXT_PUBLIC_ABLY_API_KEY) {
      setPhase('room');
      addJamPlayer({ id: selfId, name: playerName, instrument: selectedInstrument, color: PLAYER_COLORS[0] ?? 'var(--color-lume-teal)', isConnected: true });
      return;
    }

    try {
      await socket.connect();
    } catch {
      setError('Could not join room. Check the code and try again.');
      setPhase('lobby');
    }
  }, [inputCode, playerName, selectedInstrument, jamPlayers, setSelfPlayerId, setRoomCode, addJamPlayer, setLatency, handleMessage]);

  const leaveRoom = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setPhase('lobby');
    setRoomCode(null);
    setSelfPlayerId(null);
  }, [setRoomCode, setSelfPlayerId]);

  const goToInstrument = useCallback(() => {
    router.push(`/instruments/${selectedInstrument}`);
  }, [router, selectedInstrument]);

  useEffect(() => {
    return () => { socketRef.current?.disconnect(); };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: 'var(--color-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <StarfieldCanvas count={400} />
        <NebulaBlobs />
      </div>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 600, padding: 'var(--space-8)' }}>
        <AnimatePresence mode="wait">
          {phase === 'lobby' && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-starfield)', margin: 0, lineHeight: 0.9 }}>
                  JAM
                </h1>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', color: 'var(--color-mist)', marginTop: 'var(--space-3)' }}>
                  Play together in real-time
                </p>
              </div>

              <GlassCard size="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* Name input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-mist)' }}>
                    Your name
                  </label>
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                    style={{
                      background: 'var(--glass-surface)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3) var(--space-4)',
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-starfield)',
                      outline: 'none',
                      width: '100%',
                    }}
                    placeholder="Enter your name"
                  />
                </div>

                {/* Instrument picker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-mist)' }}>
                    Your instrument
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {INSTRUMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedInstrument(opt.id)}
                        style={{
                          padding: 'var(--space-2) var(--space-4)',
                          background: selectedInstrument === opt.id ? `color-mix(in srgb, ${opt.color} 15%, transparent)` : 'var(--glass-surface)',
                          border: `1px solid ${selectedInstrument === opt.id ? opt.color : 'var(--glass-border)'}`,
                          borderRadius: 'var(--radius-pill)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-display)',
                          fontSize: 'var(--text-sm)',
                          color: selectedInstrument === opt.id ? opt.color : 'var(--color-starfield)',
                          transition: 'all var(--duration-fast) var(--ease-smooth)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexDirection: 'column' }}>
                  <GlowButton
                    variant="primary"
                    accentColor="var(--color-lume-teal)"
                    onClick={createRoom}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Create New Room
                  </GlowButton>

                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <input
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      style={{
                        flex: 1,
                        background: 'var(--glass-surface)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-3) var(--space-4)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-base)',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'var(--color-starfield)',
                        outline: 'none',
                      }}
                      placeholder="ROOM CODE"
                    />
                    <GlowButton
                      variant="ghost"
                      accentColor="var(--color-lume-teal)"
                      onClick={joinRoom}
                    >
                      Join
                    </GlowButton>
                  </div>

                  {error && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-coral-bloom)', letterSpacing: '0.05em', textAlign: 'center' }}>
                      {error}
                    </p>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {phase === 'connecting' && (
            <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--color-starfield)', animation: 'pulse-ambient 1.5s ease-in-out infinite' }}>
                Connecting…
              </div>
            </motion.div>
          )}

          {phase === 'room' && (
            <motion.div key="room" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <GlassCard size="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* Room code */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-mist)', marginBottom: 'var(--space-2)' }}>
                    Room Code
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', letterSpacing: '0.3em', color: 'var(--color-lume-teal)', textShadow: 'var(--glow-piano)', fontWeight: 500 }}>
                    {roomCode}
                  </div>
                  {latencyMs > 0 && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.06em', color: latencyMs < 100 ? 'var(--color-lume-teal)' : 'var(--color-amber-pulse)', marginTop: 'var(--space-2)' }}>
                      {latencyMs}ms
                    </div>
                  )}
                </div>

                {/* Players */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-mist)' }}>
                    Players ({jamPlayers.length}/4)
                  </div>
                  {jamPlayers.map((player) => (
                    <PlayerBadge key={player.id} player={player} isSelf={player.id === selfPlayerId} />
                  ))}
                  {jamPlayers.length === 0 && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)', textAlign: 'center', padding: 'var(--space-4)' }}>
                      Share the room code to invite players
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <GlowButton
                    variant="primary"
                    accentColor="var(--color-lume-teal)"
                    onClick={goToInstrument}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Play {selectedInstrument}
                  </GlowButton>
                  <GlowButton
                    variant="ghost"
                    accentColor="var(--color-coral-bloom)"
                    onClick={leaveRoom}
                  >
                    Leave
                  </GlowButton>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PlayerBadge({ player, isSelf }: { player: JamPlayer; isSelf: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-3) var(--space-4)',
      background: 'var(--glass-surface)',
      border: `1px solid ${isSelf ? player.color : 'var(--glass-border)'}`,
      borderRadius: 'var(--radius-md)',
      transition: 'border-color var(--duration-fast)',
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: player.color, boxShadow: `0 0 8px ${player.color}` }} />
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', color: isSelf ? player.color : 'var(--color-starfield)', fontWeight: isSelf ? 500 : 400 }}>
        {player.name} {isSelf && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-mist)' }}>(you)</span>}
      </span>
      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-mist)' }}>
        {player.instrument}
      </span>
    </div>
  );
}
