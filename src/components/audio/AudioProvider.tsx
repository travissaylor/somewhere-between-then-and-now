'use client';

/**
 * AudioProvider — purely behavioral client component.
 *
 * Bridges the AudioEngine singleton to the React/DOM lifecycle:
 * - Dynamically imports AudioEngine to prevent Tone.js from being evaluated during SSR
 * - Subscribes to eraStore for scroll-reactive gain updates
 * - Calls engine.start() on first isScrollEnabled=true (womb gate gesture AUDO-01)
 * - Cleans up on unmount (though AudioProvider is a permanent singleton — see notes below)
 *
 * Renders nothing — this component is purely behavioral.
 *
 * NOTE: AudioProvider is intended to be mounted once and never unmounted, mirroring
 * the visibility-based scene management pattern from Phase 2. The cleanup path exists
 * for correctness in React StrictMode double-invocation and test environments.
 */

import { useEffect, useRef } from 'react';
import { eraStore } from '@/store/eraStore';
import type { AudioEngine } from '@/audio/AudioEngine';

export default function AudioProvider() {
  const engineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    let disposed = false;

    // Dynamic import prevents Tone.js from accessing window.AudioContext at import time
    // (which would crash during SSR). AudioProvider itself is already ssr:false via
    // the dynamic() wrapper in page.tsx, but the dynamic import here is belt-and-suspenders.
    import('@/audio/AudioEngine').then(async ({ createAudioEngine }) => {
      if (disposed) return;
      const engine = createAudioEngine();
      engineRef.current = engine;
      await engine.init();
    });

    // Subscribe to eraStore for scroll-reactive mixing.
    // Using eraStore.subscribe (not useStore/useEffect on state) so updates fire only
    // on actual state changes — not on every render or animation frame.
    const unsub = eraStore.subscribe((state) => {
      const engine = engineRef.current;
      if (!engine) return;

      // Gesture gate: start audio on first scroll enable (AUDO-01)
      // isScrollEnabled becomes true after the womb-gate birth animation completes,
      // which requires a user interaction — satisfying the Web Audio gesture requirement.
      if (state.isScrollEnabled) {
        engine.start(); // no-ops after first successful call
      }

      // Update gain mix based on current scroll position
      engine.updateMix(state.currentEra, state.eraProgress);
    });

    return () => {
      disposed = true;
      unsub();
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Renders nothing — AudioProvider is purely behavioral
  return null;
}
