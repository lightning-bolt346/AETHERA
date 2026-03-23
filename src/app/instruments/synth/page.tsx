'use client';

import React, { useState } from 'react';
import InstrumentRoomShell from '@/components/instruments/InstrumentRoomShell';
import SynthBackground from '@/components/backgrounds/SynthBackground';
import SynthInstrument from '@/components/instruments/synth/SynthInstrument';

export default function SynthPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <InstrumentRoomShell
      instrumentId="synth"
      background={<SynthBackground />}
      isPlaying={isPlaying}
      keyboardHints={[
        { key: 'A', label: 'C3' }, { key: 'W', label: 'C#3' }, { key: 'S', label: 'D3' },
        { key: 'E', label: 'D#3' }, { key: 'D', label: 'E3' }, { key: 'F', label: 'F3' },
      ]}
    >
      <SynthInstrument onNotePlay={() => setIsPlaying(true)} />
    </InstrumentRoomShell>
  );
}
