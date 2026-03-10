'use client';

import dynamic from 'next/dynamic';
import ScrollEngine from '@/components/scroll/ScrollEngine';
import DebugOverlay from '@/components/debug/DebugOverlay';
import { computeScrollHeight } from '@/lib/scrollMath';

// Dynamic import with ssr: false prevents R3F/Three.js from executing on the server
const Scene = dynamic(() => import('@/components/canvas/Scene'), {
  ssr: false,
  loading: () => null,
});

const scrollHeight = computeScrollHeight();

export default function Home() {
  return (
    <>
      <ScrollEngine />
      <div
        style={{
          height: `${scrollHeight}vh`,
          position: 'relative',
        }}
      >
        {/* Future HTML content layers go here */}
      </div>
      <Scene />
      <DebugOverlay />
    </>
  );
}
