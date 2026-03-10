'use client';

import { createContext, useContext, useRef, useMemo, useEffect } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass, ToneMappingEffect, ToneMappingMode } from 'postprocessing';
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

// PortalScenesContext shares the per-era THREE.Scene instances created inside
// Compositor with siblings (e.g. WombGate) that need them for shader warmup.
const PortalScenesContext = createContext<THREE.Scene[]>([]);

/**
 * usePortalScenes — access the per-era portal scenes from any sibling/child
 * of the PortalScenesProvider. Used by WombGate for gl.compileAsync warmup.
 */
export const usePortalScenes = () => useContext(PortalScenesContext);

interface CompositorProps {
  /** Whether the womb gate has completed — only composite to screen after birth */
  wombDone: boolean;
  /** Ref that will be populated with portal scenes for external warmup consumers */
  portalScenesRef?: React.MutableRefObject<THREE.Scene[]>;
}

/**
 * A/B render target compositor.
 *
 * Each era scene renders into its own THREE.Scene (via R3F createPortal).
 * The compositor reads eraStore each frame, determines which two eras to blend,
 * renders them to separate WebGLRenderTargets, then composites them to screen
 * using the Perlin noise dissolve ShaderMaterial.
 *
 * Post-processing: An imperative EffectComposer (from the `postprocessing` library)
 * wraps the final composite-to-screen step. This proves the infrastructure pattern
 * for Phase 9 per-era effects without authoring any per-era passes yet.
 *
 * Phase 9: Per-era post-processing effects (POST-01, POST-02, POST-03)
 * will be added here as additional EffectPass instances.
 * Each era can have unique grain, color grading, and bloom/vignette.
 *
 * Visibility is managed by getMemoryPlan() — scenes are always mounted but
 * visibility-toggled to prevent unnecessary draw calls. Nothing is ever
 * unmounted/remounted (prevents VRAM churn).
 */
export default function Compositor({ wombDone, portalScenesRef }: CompositorProps) {
  const { gl, size, camera } = useThree();

  // Per-era portal scenes (separate THREE.Scene instances)
  const portalScenes = useMemo<THREE.Scene[]>(() => {
    const scenes: THREE.Scene[] = [];
    for (let i = 0; i < ERA_COUNT; i++) {
      scenes.push(new THREE.Scene());
    }
    return scenes;
  }, []);

  // Populate the external ref so WombGate can access portal scenes for warmup
  useEffect(() => {
    if (portalScenesRef) {
      portalScenesRef.current = portalScenes;
    }
  }, [portalScenes, portalScenesRef]);

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

  // Third render target for the composite output — read by the post-processing pass
  const rtComposite = useMemo(() => new THREE.WebGLRenderTarget(size.width, size.height, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    colorSpace: THREE.LinearSRGBColorSpace,
    depthBuffer: false,
    stencilBuffer: false,
  }), []);// eslint-disable-line react-hooks/exhaustive-deps

  // Update render target sizes when canvas resizes
  useEffect(() => {
    rtA.setSize(size.width, size.height);
    rtB.setSize(size.width, size.height);
    rtComposite.setSize(size.width, size.height);
  }, [size.width, size.height, rtA, rtB, rtComposite]);

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

  // EffectComposer (imperative, from `postprocessing` library) — proves post-processing
  // infrastructure without using @react-three/postprocessing React components, which
  // would conflict with our manual render loop.
  const effectComposerRef = useRef<EffectComposer | null>(null);

  useEffect(() => {
    // Create the imperative EffectComposer targeting the composite output quad scene.
    // ToneMappingEffect with ACES_FILMIC proves the pipeline can apply post passes.
    // Phase 9 will add per-era EffectPass instances here.
    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(quadScene, orthoCamera);
    const toneMappingEffect = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    const effectPass = new EffectPass(camera, toneMappingEffect);
    composer.addPass(renderPass);
    composer.addPass(effectPass);
    effectComposerRef.current = composer;

    return () => {
      composer.dispose();
      effectComposerRef.current = null;
    };
  }, [gl, quadScene, orthoCamera, camera]);

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
      rtComposite.dispose();
    };
  }, [rtA, rtB, rtComposite]);

  // Manual render loop — takes over R3F auto-render via priority=1
  useFrame((state, delta) => {
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

    // Composite A/B to the intermediate render target (read by post-processing pass)
    gl.setRenderTarget(rtComposite);
    gl.render(quadScene, orthoCamera);

    // Post-processing pass — renders rtComposite through EffectComposer to screen
    // Phase 9: Per-era post-processing effects (POST-01, POST-02, POST-03)
    // will be added here as additional EffectPass instances.
    // Each era can have unique grain, color grading, and bloom/vignette.
    if (effectComposerRef.current) {
      gl.setRenderTarget(null);
      effectComposerRef.current.render(delta);
    } else {
      // Fallback: composite directly to screen if EffectComposer not yet initialised
      gl.setRenderTarget(null);
      gl.render(quadScene, orthoCamera);
    }
  }, 1); // priority=1 takes over auto-render

  // Portals render each era into its own separate THREE.Scene
  return (
    <PortalScenesContext.Provider value={portalScenes}>
      {createPortal(
        <Era01BornScene visible={visibilityRef.current[0]} />,
        portalScenes[0]
      )}
      {createPortal(
        <Era02ChildhoodScene visible={visibilityRef.current[1]} />,
        portalScenes[1]
      )}
    </PortalScenesContext.Provider>
  );
}
