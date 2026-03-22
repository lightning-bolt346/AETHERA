'use client';

import React, { useState } from 'react';
import InstrumentRoomShell from '@/components/instruments/InstrumentRoomShell';
import GuitarBackground from '@/components/backgrounds/GuitarBackground';
import StringInstrument from '@/components/instruments/StringInstrument';

const KEYBOARD_HINTS = [
  { key: 'Z', label: 'E2' }, { key: 'X', label: 'A2' }, { key: 'C', label: 'D3' },
  { key: 'V', label: 'G3' }, { key: 'B', label: 'B3' }, { key: 'N', label: 'E4' },
  { key: 'A', label: 'A3' }, { key: 'S', label: 'D4' }, { key: 'D', label: 'G4' },
];

export default function GuitarPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <InstrumentRoomShell
      instrumentId="guitar"
      background={<GuitarBackground />}
      keyboardHints={KEYBOARD_HINTS}
      isPlaying={isPlaying}
    >
      <StringInstrument instrumentId="guitar" onNotePlay={() => setIsPlaying(true)} />
    </InstrumentRoomShell>
  );
}
