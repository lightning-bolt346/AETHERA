'use client';

import React, { useState } from 'react';
import InstrumentRoomShell from '@/components/instruments/InstrumentRoomShell';
import TrumpetBackground from '@/components/backgrounds/TrumpetBackground';
import TrumpetInstrument from '@/components/instruments/trumpet/TrumpetInstrument';

export default function TrumpetPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <InstrumentRoomShell
      instrumentId="trumpet"
      background={<TrumpetBackground />}
      isPlaying={isPlaying}
      keyboardHints={[
        { key: '1', label: 'Valve 1' }, { key: '2', label: 'Valve 2' },
        { key: '3', label: 'Valve 3' }, { key: 'SPC', label: 'Blow' },
      ]}
    >
      <TrumpetInstrument onNotePlay={() => setIsPlaying(true)} />
    </InstrumentRoomShell>
  );
}
