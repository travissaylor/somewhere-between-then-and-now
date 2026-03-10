'use client';

import { useRef, useState, useEffect } from 'react';
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
 * Bridges:
 * - eraStore → Compositor wombDone prop
 * - Compositor portal scene refs → WombGate portalScenes prop (for shader warmup)
 *
 * The portalScenesRef is populated by Compositor on mount and read by WombGate
 * during its birth animation to call gl.compileAsync on the actual era scenes
 * (not the empty root R3F scene, which contains no era meshes).
 *
 * WombGate and Compositor are always mounted; the womb quad renders
 * on top of (or instead of) the compositor until birth completes.
 */
function SceneContents() {
  const isScrollEnabled = useEraStore((s) => s.isScrollEnabled);

  // Bridge portal scene refs from Compositor to WombGate.
  // Compositor writes its portalScenes[] into this ref on mount.
  // WombGate reads this ref during the birth animation for shader warmup.
  const portalScenesRef = useRef<THREE.Scene[]>([]);

  // Force a re-render once Compositor has populated the ref so WombGate
  // receives the actual scene instances (not the initial empty array).
  const [portalScenesReady, setPortalScenesReady] = useState(false);
  const onPortalScenesPopulated = useRef(() => {
    setPortalScenesReady(true);
  });

  // Wrap the ref so Compositor can signal when it has populated it
  const bridgeRef = useRef<THREE.Scene[]>([]);
  const wrappedRef = useRef({
    get current() { return bridgeRef.current; },
    set current(v: THREE.Scene[]) {
      bridgeRef.current = v;
      if (v.length > 0) {
        onPortalScenesPopulated.current();
      }
    },
  });

  // Sync bridgeRef into portalScenesRef for WombGate consumption
  useEffect(() => {
    portalScenesRef.current = bridgeRef.current;
  }, [portalScenesReady]);

  return (
    <>
      {/* WombGate: heartbeat → birth animation → unlocks scroll */}
      <WombGate portalScenes={portalScenesReady ? portalScenesRef.current : []} />
      {/* Compositor: A/B render target era blend — activates after womb birth */}
      <Compositor wombDone={isScrollEnabled} portalScenesRef={wrappedRef.current} />
    </>
  );
}
