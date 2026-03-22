'use client';

import React, { useState } from 'react';
import InstrumentRoomShell from '@/components/instruments/InstrumentRoomShell';
import PianoBackground from '@/components/backgrounds/PianoBackground';
import PianoInstrument from '@/components/instruments/piano/PianoInstrument';

export default function PianoPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <InstrumentRoomShell
      instrumentId="piano"
      background={<PianoBackground />}
      isPlaying={isPlaying}
      keyboardHints={[
        { key: 'A', label: 'C4' }, { key: 'W', label: 'C#4' }, { key: 'S', label: 'D4' },
        { key: 'E', label: 'D#4' }, { key: 'D', label: 'E4' }, { key: 'F', label: 'F4' },
        { key: 'T', label: 'F#4' }, { key: 'G', label: 'G4' }, { key: 'Z', label: 'Oct-' },
        { key: 'X', label: 'Oct+' }, { key: 'SPC', label: 'Sustain' },
      ]}
    >
      <PianoInstrument onNotePlay={() => setIsPlaying(true)} />
    </InstrumentRoomShell>
  );
}
