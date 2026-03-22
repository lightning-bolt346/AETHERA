'use client';

import React, { useState } from 'react';
import InstrumentRoomShell from '@/components/instruments/InstrumentRoomShell';
import TrumpetBackground from '@/components/backgrounds/TrumpetBackground';
import StringInstrument from '@/components/instruments/StringInstrument';

const KEYBOARD_HINTS = [
  { key: 'Z', label: 'F#3' }, { key: 'X', label: 'G3' }, { key: 'C', label: 'Ab3' },
  { key: 'V', label: 'A3' }, { key: 'B', label: 'Bb3' }, { key: 'A', label: 'C4' },
  { key: 'S', label: 'D4' }, { key: 'D', label: 'Eb4' }, { key: 'F', label: 'E4' },
];

export default function TrumpetPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <InstrumentRoomShell
      instrumentId="trumpet"
      background={<TrumpetBackground />}
      keyboardHints={KEYBOARD_HINTS}
      isPlaying={isPlaying}
    >
      <StringInstrument instrumentId="trumpet" onNotePlay={() => setIsPlaying(true)} />
    </InstrumentRoomShell>
  );
}
