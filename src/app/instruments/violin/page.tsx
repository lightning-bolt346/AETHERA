'use client';

import React, { useState } from 'react';
import InstrumentRoomShell from '@/components/instruments/InstrumentRoomShell';
import ViolinBackground from '@/components/backgrounds/ViolinBackground';
import ViolinInstrument from '@/components/instruments/violin/ViolinInstrument';

export default function ViolinPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <InstrumentRoomShell
      instrumentId="violin"
      background={<ViolinBackground />}
      isPlaying={isPlaying}
      keyboardHints={[{ key: 'BOW', label: 'Click & drag string lanes' }]}
    >
      <ViolinInstrument onNotePlay={() => setIsPlaying(true)} />
    </InstrumentRoomShell>
  );
}
