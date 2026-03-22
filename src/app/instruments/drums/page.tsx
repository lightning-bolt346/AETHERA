'use client';

import React, { useState } from 'react';
import InstrumentRoomShell from '@/components/instruments/InstrumentRoomShell';
import DrumsBackground from '@/components/backgrounds/DrumsBackground';
import DrumPadInstrument from '@/components/instruments/DrumPadInstrument';

const KEYBOARD_HINTS = [
  { key: 'Q', label: 'Kick' }, { key: 'W', label: 'Snare' },
  { key: 'E', label: 'Hi-Hat' }, { key: 'R', label: 'Open Hat' },
  { key: 'A', label: 'Tom 1' }, { key: 'S', label: 'Tom 2' },
  { key: 'D', label: 'Crash' }, { key: 'F', label: 'Clap' },
];

export default function DrumsPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <InstrumentRoomShell
      instrumentId="drums"
      background={<DrumsBackground />}
      keyboardHints={KEYBOARD_HINTS}
      isPlaying={isPlaying}
    >
      <DrumPadInstrument onHit={() => setIsPlaying(true)} />
    </InstrumentRoomShell>
  );
}
