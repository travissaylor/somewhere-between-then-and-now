'use client';

import { useRef, useMemo, useEffect } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createCompositorMaterial } from './CompositorMaterial';
import { getScenePair } from '@/lib/compositorLogic';
import { getMemoryPlan } from '@/lib/memoryManager';
import { detectRenderBudget, DEFAULT_RENDER_BUDGET, type RenderBudget } from '@/lib/gpuTier';
import { eraStore } from '@/store/eraStore';
import Era01BornScene from '@/components/eras/Era01BornScene';
import Era02ChildhoodScene from '@/components/eras/Era02ChildhoodScene';

// ERA_SCENES maps era index to an array of virtual scenes
// We only have 2 eras in this proof implementation; expand as eras are added.
const ERA_COUNT = 2;

interface CompositorProps {
  /** Whether the womb gate has completed — only composite to screen after birth */
  wombDone: boolean;
}

/**
 * A/B render target compositor.
 *
 * Each era scene renders into its own THREE.Scene (via R3F createPortal).
 * The compositor reads eraStore each frame, determines which two eras to blend,
 * renders them to separate WebGLRenderTargets, then composites them to screen
 * using the Perlin noise dissolve ShaderMaterial.
 *
 * Visibility is managed by getMemoryPlan() — scenes are always mounted but
 * visibility-toggled to prevent unnecessary draw calls. Nothing is ever
 * unmounted/remounted (prevents VRAM churn).
 */
export default function Compositor({ wombDone }: CompositorProps) {
  const { gl, size, camera } = useThree();

  // Per-era portal scenes (separate THREE.Scene instances)
  const portalScenes = useMemo<THREE.Scene[]>(() => {
    const scenes: THREE.Scene[] = [];
    for (let i = 0; i < ERA_COUNT; i++) {
      scenes.push(new THREE.Scene());
    }
    return scenes;
  }, []);

  // Render targets — recreated when canvas size changes
  const rtA = useMemo(() => new THREE.WebGLRenderTarget(size.width, size.height, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    colorSpace: THREE.LinearSRGBColorSpace,
    depthBuffer: true,
    stencilBuffer: false,
  }), []);// eslint-disable-line react-hooks/exhaustive-deps

  const rtB = useMemo(() => new THREE.WebGLRenderTarget(size.width, size.height, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    colorSpace: THREE.LinearSRGBColorSpace,
    depthBuffer: true,
    stencilBuffer: false,
  }), []);// eslint-disable-line react-hooks/exhaustive-deps

  // Update render target sizes when canvas resizes
  useEffect(() => {
    rtA.setSize(size.width, size.height);
    rtB.setSize(size.width, size.height);
  }, [size.width, size.height, rtA, rtB]);

  // Fullscreen orthographic composite quad
  const quadScene = useMemo(() => {
    const scene = new THREE.Scene();
    const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mat = createCompositorMaterial();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    scene.add(mesh);
    // Attach ortho camera to scene for retrieval
    (scene as THREE.Scene & { _orthoCamera: THREE.OrthographicCamera })._orthoCamera = ortho;
    return scene;
  }, []);

  const compositorMaterial = useMemo(() => {
    const scene = quadScene as THREE.Scene & { _orthoCamera?: THREE.OrthographicCamera };
    const mesh = scene.children[0] as THREE.Mesh;
    return mesh.material as THREE.ShaderMaterial;
  }, [quadScene]);

  const orthoCamera = useMemo(() => {
    const scene = quadScene as THREE.Scene & { _orthoCamera?: THREE.OrthographicCamera };
    return scene._orthoCamera!;
  }, [quadScene]);

  // Render budget — start with default, update async
  const renderBudgetRef = useRef<RenderBudget>(DEFAULT_RENDER_BUDGET);
  useEffect(() => {
    detectRenderBudget().then((budget) => {
      renderBudgetRef.current = budget;
    });
  }, []);

  // Visibility state per era (used by scene portals)
  const visibilityRef = useRef<boolean[]>(new Array(ERA_COUNT).fill(true));

  // Track which eras are "loaded" for dispose logic
  // In this proof implementation all eras are always mounted, so they're all loaded
  const loadedErasRef = useRef<Set<number>>(new Set([0, 1]));

  // Dispose render targets on unmount
  useEffect(() => {
    return () => {
      rtA.dispose();
      rtB.dispose();
    };
  }, [rtA, rtB]);

  // Manual render loop — takes over R3F auto-render via priority=1
  useFrame(() => {
    if (!wombDone) return; // Let womb gate handle rendering until birth complete

    const { currentEra, eraProgress } = eraStore.getState();

    // Determine which two eras are in A/B
    const { fromEra, toEra, blend } = getScenePair(currentEra, eraProgress);

    // Determine visibility — which eras should have draw calls
    const memoryPlan = getMemoryPlan(
      currentEra,
      renderBudgetRef.current.keepAliveWindow,
      loadedErasRef.current
    );
    visibilityRef.current = new Array(ERA_COUNT).fill(false);
    for (const eraIdx of memoryPlan.visible) {
      if (eraIdx < ERA_COUNT) {
        visibilityRef.current[eraIdx] = true;
      }
    }

    // Render from-era to rtA
    gl.setRenderTarget(rtA);
    gl.render(portalScenes[fromEra] ?? portalScenes[0], camera);

    // Render to-era to rtB
    gl.setRenderTarget(rtB);
    gl.render(portalScenes[toEra] ?? portalScenes[ERA_COUNT - 1], camera);

    // Set blend uniform and textures
    compositorMaterial.uniforms.uBlend.value = blend;
    compositorMaterial.uniforms.tFrom.value = rtA.texture;
    compositorMaterial.uniforms.tTo.value = rtB.texture;

    // Composite to screen
    gl.setRenderTarget(null);
    gl.render(quadScene, orthoCamera);
  }, 1); // priority=1 takes over auto-render

  // Portals render each era into its own separate THREE.Scene
  return (
    <>
      {createPortal(
        <Era01BornScene visible={visibilityRef.current[0]} />,
        portalScenes[0]
      )}
      {createPortal(
        <Era02ChildhoodScene visible={visibilityRef.current[1]} />,
        portalScenes[1]
      )}
    </>
  );
}

/**
 * Expose portal scenes for WombGate shader warmup (compileAsync).
 * Used by Scene.tsx to pass scene refs to WombGate.
 */
export function useCompositorScenes(): THREE.Scene[] {
  // Scenes are created fresh in each Compositor instance;
  // for warmup purposes Scene.tsx passes the scene objects directly.
  // This is a placeholder for the pattern — actual warmup uses refs passed via props.
  return [];
}
