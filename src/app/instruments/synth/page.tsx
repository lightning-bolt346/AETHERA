'use client';

import React, { useState } from 'react';
import InstrumentRoomShell from '@/components/instruments/InstrumentRoomShell';
import SynthBackground from '@/components/backgrounds/SynthBackground';
import SynthInstrument from '@/components/instruments/SynthInstrument';

const KEYBOARD_HINTS = [
  { key: 'Z', label: 'C3' }, { key: 'X', label: 'D3' }, { key: 'C', label: 'E3' },
  { key: 'V', label: 'F3' }, { key: 'B', label: 'G3' }, { key: 'N', label: 'A3' },
  { key: 'A', label: 'C4' }, { key: 'S', label: 'D4' }, { key: 'D', label: 'E4' },
  { key: 'F', label: 'F4' }, { key: 'G', label: 'G4' },
];

export default function SynthPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <InstrumentRoomShell
      instrumentId="synth"
      background={<SynthBackground />}
      keyboardHints={KEYBOARD_HINTS}
      isPlaying={isPlaying}
    >
      <SynthInstrument onNotePlay={() => setIsPlaying(true)} />
    </InstrumentRoomShell>
  );
}
