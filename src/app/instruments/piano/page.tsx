'use client';

import React, { useState } from 'react';
import InstrumentRoomShell from '@/components/instruments/InstrumentRoomShell';
import PianoBackground from '@/components/backgrounds/PianoBackground';
import PianoInstrument from '@/components/instruments/PianoInstrument';

const KEYBOARD_HINTS = [
  { key: 'A', label: 'C4' }, { key: 'W', label: 'C#' }, { key: 'S', label: 'D4' },
  { key: 'E', label: 'D#' }, { key: 'D', label: 'E4' }, { key: 'F', label: 'F4' },
  { key: 'T', label: 'F#' }, { key: 'G', label: 'G4' }, { key: 'Y', label: 'G#' },
  { key: 'H', label: 'A4' }, { key: 'U', label: 'A#' }, { key: 'J', label: 'B4' },
];

export default function PianoPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <InstrumentRoomShell
      instrumentId="piano"
      background={<PianoBackground />}
      keyboardHints={KEYBOARD_HINTS}
      isPlaying={isPlaying}
    >
      <PianoInstrument onNotePlay={() => setIsPlaying(true)} />
    </InstrumentRoomShell>
  );
}
