'use client';

import React, { useState } from 'react';
import InstrumentRoomShell from '@/components/instruments/InstrumentRoomShell';
import DrumsBackground from '@/components/backgrounds/DrumsBackground';
import DrumInstrument from '@/components/instruments/drums/DrumInstrument';

export default function DrumsPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <InstrumentRoomShell
      instrumentId="drums"
      background={<DrumsBackground />}
      isPlaying={isPlaying}
      keyboardHints={[
        { key: 'J', label: 'Kick' }, { key: 'K', label: 'Snare' },
        { key: 'S', label: 'HH Closed' }, { key: 'D', label: 'HH Open' },
        { key: 'F', label: 'Crash' }, { key: 'G', label: 'Ride' },
        { key: 'H', label: 'Tom Hi' }, { key: 'L', label: 'Tom Floor' },
      ]}
    >
      <DrumInstrument onHit={() => setIsPlaying(true)} />
    </InstrumentRoomShell>
  );
}
