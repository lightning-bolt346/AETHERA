'use client';

import React from 'react';

const BLOBS = [
  {
    color: 'rgba(0, 255, 209, 0.06)',
    size: '70vw',
    top: '10%',
    left: '-20%',
    animDuration: '18s',
    animDelay: '0s',
  },
  {
    color: 'rgba(167, 139, 250, 0.05)',
    size: '60vw',
    top: '30%',
    left: '50%',
    animDuration: '22s',
    animDelay: '-8s',
  },
  {
    color: 'rgba(34, 211, 238, 0.04)',
    size: '55vw',
    top: '60%',
    left: '20%',
    animDuration: '20s',
    animDelay: '-14s',
  },
];

export default function NebulaBlobs() {
  return (
    <>
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: blob.size,
            height: blob.size,
            top: blob.top,
            left: blob.left,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(ellipse at center, ${blob.color} 0%, transparent 70%)`,
            borderRadius: '50%',
            mixBlendMode: 'screen',
            filter: 'blur(40px)',
            animation: `hue-drift ${blob.animDuration} ease-in-out infinite`,
            animationDelay: blob.animDelay,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}
