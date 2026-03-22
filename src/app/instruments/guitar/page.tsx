'use client';

import React, { useState } from 'react';
import InstrumentRoomShell from '@/components/instruments/InstrumentRoomShell';
import GuitarBackground from '@/components/backgrounds/GuitarBackground';
import GuitarInstrument from '@/components/instruments/guitar/GuitarInstrument';

export default function GuitarPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <InstrumentRoomShell
      instrumentId="guitar"
      background={<GuitarBackground />}
      isPlaying={isPlaying}
      keyboardHints={[{ key: 'STRUM', label: 'Drag right zone' }]}
    >
      <GuitarInstrument onNotePlay={() => setIsPlaying(true)} />
    </InstrumentRoomShell>
  );
}
