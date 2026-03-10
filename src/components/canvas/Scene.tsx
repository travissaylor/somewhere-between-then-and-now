'use client';

import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Compositor from './Compositor';
import WombGate from '@/components/loading/WombGate';
import { useEraStore } from '@/store/eraStore';

/**
 * Scene — the root R3F Canvas shell.
 *
 * Contains:
 * - WombGate: heartbeat loading state until assets warm up, then birth animation
 * - Compositor: A/B render target compositor for era dissolve transitions
 *
 * The Compositor takes over rendering once the WombGate signals birth complete
 * (isScrollEnabled becomes true in eraStore).
 */
export default function Scene() {
  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        pointerEvents: 'none',
      }}
      camera={{
        fov: 50,
        near: 0.1,
        far: 1000,
        position: [0, 0, 5],
      }}
      gl={{
        antialias: true,
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 1);
      }}
    >
      <SceneContents />
    </Canvas>
  );
}

/**
 * SceneContents — inner R3F component with access to Canvas context.
 *
 * Bridges eraStore → Compositor wombDone prop.
 * WombGate and Compositor are always mounted; the womb quad renders
 * on top of (or instead of) the compositor until birth completes.
 */
function SceneContents() {
  const isScrollEnabled = useEraStore((s) => s.isScrollEnabled);

  return (
    <>
      {/* WombGate: heartbeat → birth animation → unlocks scroll */}
      <WombGate />
      {/* Compositor: A/B render target era blend — activates after womb birth */}
      <Compositor wombDone={isScrollEnabled} />
    </>
  );
}
