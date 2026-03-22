'use client';

import React, { useState } from 'react';
import InstrumentRoomShell from '@/components/instruments/InstrumentRoomShell';
import ViolinBackground from '@/components/backgrounds/ViolinBackground';
import StringInstrument from '@/components/instruments/StringInstrument';

const KEYBOARD_HINTS = [
  { key: 'Z', label: 'G3' }, { key: 'X', label: 'D4' },
  { key: 'C', label: 'A4' }, { key: 'V', label: 'E5' },
  { key: 'A', label: 'A3' }, { key: 'S', label: 'E4' },
  { key: 'D', label: 'B4' }, { key: 'F', label: 'F#5' },
];

export default function ViolinPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <InstrumentRoomShell
      instrumentId="violin"
      background={<ViolinBackground />}
      keyboardHints={KEYBOARD_HINTS}
      isPlaying={isPlaying}
    >
      <StringInstrument instrumentId="violin" onNotePlay={() => setIsPlaying(true)} />
    </InstrumentRoomShell>
  );
}
