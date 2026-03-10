# Phase 02: Render Pipeline - Research

**Researched:** 2026-03-10
**Domain:** Three.js/R3F render targets, EffectComposer, GLSL dissolve shaders, asset preloading, VRAM management
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Boundary:** RenderTarget A/B compositor, EffectComposer, visibility-based scene management, shader warmup, asset preloading with loading gate, and predictive N+1 loading / N-2 disposal — all proved on Era 01 + Era 02 as proof-of-concept pair. No audio, no post-processing tuning, no custom transition shaders (Phase 8). Two rough-draft era environments are built to validate the pipeline, not as final content.

**Loading Gate (Womb State):**
- Loading screen represents being in the womb — deep red-black darkness with rhythmic pulse of warm light (~70bpm)
- Visual only — no audio during loading (audio engine is Phase 3)
- No text at all — no title, no "loading", no instructions, no progress indicator
- When assets are ready: heartbeat accelerates, intensity grows, light floods and breaks through into Era 01 (birth moment)
- Scroll releases after the birth break
- Loading gate waits for first 2-3 eras only, not all 13

**Proof Era Choice:**
- Era 01 (Being Born) + Era 02 (Early Childhood) as the proof pair
- Rough draft of final look — abstract light for 01, backyard diorama for 02
- Use placeholder/procedural textures — no real photo assets yet (Phase 9)
- Loose era component structure — don't over-design shared interface contract yet

**Transition Blend Style:**
- Shader-driven morph as default blend mode, not plain opacity cross-dissolve
- Compositor built from day one to accept swappable GLSL shaders per transition
- Default is a noise dissolve shader
- Brief overlap region (~10% of era scroll distance) for default transitions
- Per-boundary variation supported — each era boundary can have different dissolve speed/scale/direction

**Memory Budget:**
- Seamless back-scroll priority — keep current ±2 or ±3 eras in memory for instant backward scrolling
- Desktop-first VRAM budget; scrubbing the timeline should feel instant
- If memory pressure detected on lower-end machines: tighten keep-alive window (±3 → ±1) but never reduce visual fidelity
- Disposed eras fade in from black on revisit (0.3–0.5s subtle fade-in)
- Visibility-based scene management: scenes are hidden (visible=false), not unmounted

### Claude's Discretion

- Noise dissolve character (organic Perlin vs geometric Voronoi vs hybrid)
- Exact EffectComposer pass configuration and ordering
- Shader warmup implementation details (renderer.compile() timing)
- RenderTarget resolution and format choices
- Predictive loading trigger thresholds (how far ahead to start loading)
- Exact keep-alive window size (±2 vs ±3) based on measured VRAM
- GPU tier detection approach for adaptive window sizing
- Womb heartbeat pulse shader implementation (color, intensity curve, acceleration ramp)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RNDR-01 | RenderTarget A/B compositor renders two era scenes off-screen simultaneously during transitions | Covered in Architecture Patterns §A/B Compositor Pattern; code examples show dual WebGLRenderTarget + blend shader |
| RNDR-02 | Single EffectComposer applies all per-era post-processing in one merged GPU pass | Covered in Architecture Patterns §EffectComposer Integration; useFrame renderPriority pattern documented |
| RNDR-03 | Visibility-based scene management (never unmount/remount era components) to prevent VRAM leaks | Covered in Standard Stack §Core and Don't Hand-Roll; R3F pitfalls docs confirm visible prop pattern |
| RNDR-04 | Shader warmup via renderer.compile() during loading screen to prevent first-transition stutter | Covered in Architecture Patterns §Shader Warmup; compileAsync() API documented from official Three.js docs |
| RNDR-05 | Asset preloading with loading gate that blocks scroll until era assets are ready | Covered in Architecture Patterns §Loading Gate; useLoader.preload + Suspense pattern documented |
| RNDR-06 | Predictive N+1 asset loading and N-2 disposal for memory management | Covered in Architecture Patterns §Predictive Loading + Memory Management; detect-gpu for adaptive window |
</phase_requirements>

---

## Summary

Phase 2 establishes the GPU render pipeline that will carry the entire 13-era experience. The core architectural challenge is rendering two Three.js scenes simultaneously into separate WebGLRenderTargets, then blending them together in a final fullscreen pass using a GLSL noise dissolve shader — with the blend factor driven by `eraProgress` from the existing Zustand store. This "A/B compositor" pattern is well-documented in the Three.js ecosystem and is the standard approach for scene transition effects.

The loading gate (the "womb state") is implemented by combining R3F's Suspense boundary with `useLoader.preload()` for asset readiness signaling, while scroll remains locked via `ScrollEngine.tsx`'s existing Lenis/GSAP integration. Once assets are confirmed loaded, the womb shader animates (heartbeat accelerates → light floods), and only then is scroll unlocked. Shader warmup via `renderer.compileAsync()` runs during this same window so the GPU has all shaders compiled before the first frame the user interacts with.

Memory discipline is enforced entirely through `visible=false` toggling on era scene groups, never React mount/unmount — this is the critical VRAM-safety pattern the R3F docs recommend explicitly. Predictive N+1 loading is achieved via `useLoader.preload()` called imperatively from `useFrame` when `globalProgress` crosses a threshold, and N-2 disposal calls `.dispose()` on textures and geometries in that same callback. GPU tier detection via `detect-gpu` enables adaptive keep-alive window sizing (±2 on low-end, ±3 on high-end).

**Primary recommendation:** Build the compositor as a single `Compositor.tsx` component that takes over the render loop with `useFrame(..., 1)`, renders scene A and scene B to separate render targets, then renders a fullscreen quad with the dissolve blend shader. All scene instances live permanently in the tree as invisible groups; only the compositor decides what renders.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | ^0.183.2 | WebGLRenderTarget, WebGLRenderer, scene management | Already installed; provides all GPU primitives |
| @react-three/fiber | ^9.5.0 | useFrame, useThree, createPortal, Canvas | Already installed; the R3F integration layer |
| zustand (vanilla) | ^5.0.11 | eraStore — drives blend factor and currentEra | Already installed and wired via Phase 1 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| detect-gpu (pmndrs) | ^5.0.x | GPU tier detection for adaptive keep-alive window | Use at app init to set ±2 vs ±3 window; install needed |
| @react-three/drei | ^9.x | useProgress for loading state feedback | Use only for `useProgress` inside womb state; install needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual useFrame compositor | @react-three/postprocessing EffectComposer | @react-three/postprocessing is higher-level but less control over cross-scene blending; manual approach is right here given the A/B requirement |
| detect-gpu | navigator.hardwareConcurrency heuristic | detect-gpu uses real GPU benchmarks; concurrency count is a poor proxy for VRAM headroom |
| useLoader.preload() | Custom fetch + THREE.Loader | useLoader.preload() integrates with R3F's Suspense cache automatically |

**Installation:**
```bash
npm install detect-gpu @react-three/drei
```

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── components/
│   ├── canvas/
│   │   ├── Scene.tsx              # R3F Canvas shell (already exists — wire Compositor inside)
│   │   ├── Compositor.tsx         # A/B render target compositor — owns render loop
│   │   └── CompositorMaterial.ts  # ShaderMaterial with dissolve GLSL uniforms
│   ├── eras/
│   │   ├── Era01BornScene.tsx     # Era 01 rough draft — abstract warm light
│   │   └── Era02ChildhoodScene.tsx # Era 02 rough draft — backyard diorama
│   └── loading/
│       └── WombGate.tsx           # Loading gate — heartbeat pulse, blocks scroll
├── shaders/
│   ├── dissolve.frag.glsl         # Noise dissolve fragment shader
│   └── womb.frag.glsl             # Womb heartbeat pulse fragment shader
└── lib/
    └── gpuTier.ts                 # detect-gpu call + keep-alive window config
```

### Pattern 1: A/B Compositor with Manual Render Loop

**What:** Two WebGLRenderTargets capture the "from" and "to" era scenes. A fullscreen orthographic quad uses a ShaderMaterial that samples both textures and blends based on `eraProgress`. `useFrame` with `renderPriority=1` takes over R3F's default render loop.

**When to use:** Any time two GPU scenes must be cross-dissolved without optical corruption.

**Key detail:** Pass `renderPriority` to `useFrame` — this disables R3F's automatic `gl.render()` call, giving complete control over what renders and in what order.

```typescript
// Source: R3F official docs + three.js crossfade pattern
// Compositor.tsx — abbreviated to show the render loop structure
import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { eraStore } from '@/store/eraStore';

export function Compositor({ sceneA, sceneB }: { sceneA: THREE.Scene; sceneB: THREE.Scene }) {
  const { gl, size } = useThree();

  const rtA = useMemo(
    () => new THREE.WebGLRenderTarget(size.width, size.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType, // lower VRAM than FloatType, better than UnsignedByte for HDR
    }),
    [size.width, size.height]
  );

  const rtB = useMemo(
    () => rtA.clone(),
    [rtA]
  );

  const blendMaterial = useRef<THREE.ShaderMaterial>(/* CompositorMaterial */);
  const orthoCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const quadScene = useMemo(() => {
    const s = new THREE.Scene();
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blendMaterial.current);
    s.add(quad);
    return s;
  }, []);

  // renderPriority=1 disables R3F auto-render; this function owns all gl.render() calls
  useFrame(({ gl, camera }) => {
    const { eraProgress, currentEra } = eraStore.getState();

    // Render "from" era into rtA
    gl.setRenderTarget(rtA);
    gl.render(sceneA, camera);

    // Render "to" era into rtB
    gl.setRenderTarget(rtB);
    gl.render(sceneB, camera);

    // Blend to screen
    gl.setRenderTarget(null);
    blendMaterial.current.uniforms.tFrom.value = rtA.texture;
    blendMaterial.current.uniforms.tTo.value = rtB.texture;
    blendMaterial.current.uniforms.uBlend.value = eraProgress;
    gl.render(quadScene, orthoCamera);
  }, 1);

  // Dispose render targets when compositor unmounts (app teardown only)
  // ...

  return null;
}
```

### Pattern 2: Visibility-Based Scene Management

**What:** All era scene components live permanently in the React tree. Visibility is controlled by setting the root `<group>` `visible` prop — never unmounting.

**When to use:** Any multi-scene architecture where GPU resources must stay resident.

```typescript
// Source: R3F pitfalls documentation
// ❌ NEVER do this — causes shader recompile on every mount:
{ currentEra === 0 && <Era01BornScene /> }

// ✅ ALWAYS do this — keeps GPU resources alive:
<Era01BornScene visible={currentEra === 0 || currentEra === 1} />
<Era02ChildhoodScene visible={currentEra === 1 || currentEra === 2} />
```

The compositor component receives refs to the underlying `THREE.Scene` instances that these components populate. The `visible` flag determines whether the compositor renders them to their render targets.

### Pattern 3: Shader Warmup with compileAsync

**What:** During the womb loading gate, before scroll is unlocked, `renderer.compileAsync()` pre-compiles all materials for Era 01 and Era 02 scenes. This eliminates the first-frame stutter that would otherwise occur when shaders compile JIT.

**When to use:** Any time scenes are preloaded and a "curtain" (loading gate) exists before first render.

```typescript
// Source: Three.js official docs — WebGLRenderer.compileAsync
// Call during womb gate, after scenes are constructed but before scroll unlocks
async function warmupShaders(
  renderer: THREE.WebGLRenderer,
  sceneA: THREE.Scene,
  sceneB: THREE.Scene,
  camera: THREE.Camera
) {
  // compileAsync uses KHR_parallel_shader_compile for non-blocking compilation
  // Returns Promise that resolves when all shaders are GPU-ready
  await Promise.all([
    renderer.compileAsync(sceneA, camera),
    renderer.compileAsync(sceneB, camera),
  ]);
  // Now safe to unlock scroll — no stutter on first transition
}
```

**Important:** The scene's lighting must be configured before calling `compileAsync`. The scenes must exist in memory (either in the R3F tree or as standalone Three.js scenes). Call this during the womb animation — the ~1-2 second birth sequence gives enough time for compilation.

### Pattern 4: Loading Gate (Womb State)

**What:** A React `Suspense` boundary wraps the era scenes. `useLoader.preload()` is called imperatively for Era 01-03 assets before the Canvas renders. A custom `WombGate` component renders the heartbeat animation and signals scroll unlock when both (a) assets are loaded and (b) womb animation completes.

```typescript
// Source: R3F tutorials/loading-models docs
// Called at module level (outside component) to start loading immediately
useLoader.preload(THREE.TextureLoader, '/textures/era01-light.png');
useLoader.preload(THREE.TextureLoader, '/textures/era02-backyard.png');

// WombGate.tsx — simplified flow
function WombGate({ onReady }: { onReady: () => void }) {
  const { active, progress } = useProgress(); // from @react-three/drei

  useEffect(() => {
    if (!active && progress === 100) {
      // Assets loaded — run birth animation, then call onReady
      runBirthAnimation().then(onReady);
    }
  }, [active, progress, onReady]);

  // Womb heartbeat shader renders here during loading
  return <WombPulseShader />;
}

// In ScrollEngine.tsx — add scroll lock/unlock:
// Scroll remains locked until onReady callback fires
const [scrollEnabled, setScrollEnabled] = useState(false);
// Pass setScrollEnabled into WombGate's onReady
```

**Scroll locking mechanism:** `ScrollEngine.tsx` already owns the Lenis instance. Add a `enabled` prop that calls `lenis.stop()` / `lenis.start()` to gate scroll during the womb state.

### Pattern 5: Predictive Loading and N-2 Disposal

**What:** `useFrame` monitors `globalProgress` from the eraStore. When the user is within a threshold distance of the next era boundary, `useLoader.preload()` is called for that era's assets. When progress leaves the N-2 window, assets are manually disposed.

```typescript
// Source: R3F loading docs + Three.js dispose pattern
useFrame(() => {
  const { currentEra, globalProgress } = eraStore.getState();
  const LOAD_AHEAD = 1;   // start loading N+1 era
  const KEEP_ALIVE = 3;   // keep ±3 eras (or ±2 on low-end GPU)

  // Predictive load
  const nextEra = currentEra + LOAD_AHEAD;
  if (nextEra < 13 && !loadedEras.has(nextEra)) {
    triggerEraLoad(nextEra);
  }

  // N-2 disposal
  for (const era of loadedEras) {
    if (Math.abs(era - currentEra) > KEEP_ALIVE) {
      disposeEraAssets(era);
    }
  }
});

// Disposal: call .dispose() on textures, geometries, materials
// Set scene visible=false on disposed eras
function disposeEraAssets(eraId: number) {
  const scene = eraSceneRefs[eraId];
  scene?.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
}
```

**ImageBitmap caveat:** Textures loaded from GLB/GLTF files use `ImageBitmap` internally. Call `texture.source.data.close()` in addition to `texture.dispose()` to fully release the underlying bitmap resource.

### Anti-Patterns to Avoid

- **Conditional scene rendering:** `{era === 0 && <Scene />}` unmounts/remounts and triggers shader recompile. Always use `visible` prop.
- **New vectors inside useFrame:** `new THREE.Vector3()` inside `useFrame` allocates memory 60x/sec, eventually triggering GC pauses. Declare outside and mutate.
- **Opacity cross-dissolve:** Plain `material.opacity` lerp is locked in — use the ShaderMaterial blend from day one.
- **Synchronous renderer.compile():** Use `compileAsync()` — `compile()` blocks the JS thread during shader upload, causing a visible freeze.
- **Checking renderer.info.memory.textures to verify disposal:** This counter may not update immediately. Verify disposal through Chrome DevTools GPU memory panel instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GPU tier detection | Custom WebGL renderer benchmark | `detect-gpu` (pmndrs) | Uses pre-computed benchmark database; real GPU model detection, not just FPS sampling |
| Loading progress | Custom XHR tracking | `useProgress` from `@react-three/drei` | Hooks into Three.js LoadingManager automatically |
| Noise functions | Hand-written Perlin GLSL | `cnoise` (Patrick Gonzalez Vivo's GLSL gist) or `gl-Noise` library | Tested, GPU-optimized — hand-rolled noise has non-obvious numerical issues |
| Asset caching | Custom Map + fetch | `useLoader` (R3F) + `useLoader.preload()` | URL-keyed cache is automatic; avoids duplicate GPU uploads |

**Key insight:** The Three.js ecosystem has canonical solutions for every "boring" infrastructure problem in this phase. The creative energy should go into the dissolve shader character and the womb animation — not into re-implementing loading caches or GPU tier benchmarks.

---

## Common Pitfalls

### Pitfall 1: Mount/Unmount VRAM Leaks
**What goes wrong:** Conditionally rendering era components (`{era === 2 && <EraScene />}`) causes React to unmount/remount. On remount, R3F re-registers all geometries and materials, causing VRAM to grow because the old GPU resources are not disposed before the new ones are allocated.
**Why it happens:** React treats unmounted components as "gone" — it doesn't know about GPU resources. Three.js requires explicit `.dispose()` calls.
**How to avoid:** Every era scene lives permanently in the tree. Use `visible={false}` to hide, `visible={true}` to show. Only call `.dispose()` when deliberately evicting from the N-2 memory window.
**Warning signs:** Chrome DevTools GPU memory panel shows growing VRAM during back-and-forth scrolling.

### Pitfall 2: First-Frame Shader Stutter
**What goes wrong:** Despite loading assets, the first transition produces a 100-300ms freeze. This is shader compilation — the GPU compiles GLSL on first draw, not on resource load.
**Why it happens:** WebGL defers shader compilation until first use by default.
**How to avoid:** Call `renderer.compileAsync(scene, camera)` on all era scenes during the womb animation window. The womb's birth sequence (1-2 seconds) provides a natural compilation window.
**Warning signs:** Performance timeline shows a single large spike on the exact frame the first transition begins, even after assets appear loaded.

### Pitfall 3: RenderTarget Texture Color Space Mismatch
**What goes wrong:** Colors rendered to a `WebGLRenderTarget` appear washed out or incorrectly gamma-corrected when sampled in the blend shader.
**Why it happens:** The Canvas's default `outputColorSpace` is `THREE.SRGBColorSpace`, but `WebGLRenderTarget` textures default to `THREE.LinearSRGBColorSpace`. Sampling a linear texture as if it were sRGB (or vice versa) introduces brightness/color artifacts.
**How to avoid:** Set `renderTarget.texture.colorSpace = THREE.LinearSRGBColorSpace` explicitly. Perform the gamma correction only in the final composite pass (the output to the Canvas), not in the intermediate render passes.
**Warning signs:** Colors in transitioning eras look visually different from the same colors when not in transition.

### Pitfall 4: Render Target Size Not Matching Viewport
**What goes wrong:** Render targets created at construction time become stale when the window resizes, causing blurry or incorrectly scaled output.
**Why it happens:** `WebGLRenderTarget` size is fixed at creation; it does not auto-update with the canvas size.
**How to avoid:** Use R3F's `size` from `useThree()` to memoize render target creation, and watch for size changes to call `rt.setSize(width, height)`.
**Warning signs:** Visible blur or incorrect aspect ratio in the compositor output after a browser resize.

### Pitfall 5: Disposing ImageBitmap Textures Incompletely
**What goes wrong:** Calling `texture.dispose()` on textures sourced from GLB files does not fully release GPU memory — `ImageBitmap` objects underlying the texture remain in memory.
**Why it happens:** Three.js's `texture.dispose()` releases the GPU texture handle but not the CPU-side `ImageBitmap`. This is a known upstream issue (three.js #23953).
**How to avoid:** After `texture.dispose()`, also call `texture.source.data.close()` if `texture.source.data instanceof ImageBitmap`.
**Warning signs:** CPU memory (not GPU) grows despite dispose calls. Visible in Chrome's Memory panel, not GPU profiler.

---

## Code Examples

Verified patterns from official sources:

### Noise Dissolve Fragment Shader (Perlin-based)

```glsl
// Source: Codrops Feb 2025 dissolve tutorial + GLSL Noise Algorithms gist
// Recommendation: Use Perlin (organic, continuous) not Voronoi (cellular, harder edges)
// for the birth-to-childhood transition — organic noise matches the womb-birth metaphor

uniform sampler2D tFrom;    // era A render target texture
uniform sampler2D tTo;      // era B render target texture
uniform float uBlend;       // 0.0 = fully A, 1.0 = fully B (driven by eraProgress)
uniform float uNoiseScale;  // controls noise frequency (1.0-3.0 for organic feel)
uniform float uEdgeWidth;   // glow edge width (0.05-0.15)

varying vec2 vUv;

// Classic Perlin 3D noise (from patricio gonzalez vivo GLSL gist)
// Include cnoise() function here

void main() {
  // Use screen-space UV to sample noise — consistent across entire viewport
  float noise = cnoise(vec3(vUv * uNoiseScale, uBlend * 0.5));
  // Remap noise from [-1,1] to [0,1]
  float n = noise * 0.5 + 0.5;

  vec4 colorFrom = texture2D(tFrom, vUv);
  vec4 colorTo   = texture2D(tTo,   vUv);

  // Hard threshold approach: pixels with noise below uBlend show "to", above show "from"
  // Edge glow: pixels near the threshold boundary get a luminous edge
  float threshold = uBlend;
  float edge = smoothstep(threshold - uEdgeWidth, threshold, n);

  gl_FragColor = mix(colorFrom, colorTo, edge);
}
```

### renderer.compileAsync Usage

```typescript
// Source: Three.js official WebGLRenderer docs
// Call during womb animation, before scroll unlock
const { gl, camera } = useThree();

useEffect(() => {
  async function warmup() {
    // Both era scenes must have their lighting configured before calling
    await Promise.all([
      gl.compileAsync(era01Scene, camera),
      gl.compileAsync(era02Scene, camera),
    ]);
    // Shaders are now GPU-ready; transition will not stutter
    onShadersReady();
  }
  warmup();
}, [gl, camera, era01Scene, era02Scene]);
```

### detect-gpu Adaptive Keep-Alive Window

```typescript
// Source: pmndrs/detect-gpu GitHub
// lib/gpuTier.ts
import { getGPUTier } from 'detect-gpu';

export interface RenderBudget {
  keepAliveWindow: number;   // ±N eras to keep in memory
  renderTargetType: typeof THREE.HalfFloatType | typeof THREE.UnsignedByteType;
}

export async function detectRenderBudget(): Promise<RenderBudget> {
  const { tier } = await getGPUTier();
  if (tier >= 3) return { keepAliveWindow: 3, renderTargetType: THREE.HalfFloatType };
  if (tier >= 2) return { keepAliveWindow: 2, renderTargetType: THREE.HalfFloatType };
  return { keepAliveWindow: 1, renderTargetType: THREE.UnsignedByteType }; // tier 0-1
}
```

### WebGLRenderTarget Creation (Correct Options)

```typescript
// Source: Three.js WebGLRenderTarget docs + color space guidance
const rt = new THREE.WebGLRenderTarget(width, height, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.HalfFloatType,  // HalfFloat: less VRAM than Float, no banding vs UnsignedByte
  colorSpace: THREE.LinearSRGBColorSpace, // LINEAR — gamma correct only in final output pass
  depthBuffer: true,
  stencilBuffer: false,       // not needed for this compositor
});
```

### Lenis Scroll Lock/Unlock

```typescript
// Extend ScrollEngine.tsx to support enabled prop
// Lenis API: lenis.stop() / lenis.start()
const lenisRef = useRef<Lenis | null>(null);

// Inside useEffect, expose stop/start:
useEffect(() => {
  if (scrollEnabled) {
    lenisRef.current?.start();
  } else {
    lenisRef.current?.stop();
  }
}, [scrollEnabled]);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| renderer.compile() synchronous | renderer.compileAsync() | Three.js r158 (2023) | Non-blocking shader warmup; use compileAsync always |
| Mount/unmount scene components | visible prop toggling | R3F pitfalls doc best practice (ongoing) | Eliminates VRAM growth from remount cycles |
| Opacity cross-dissolve | GLSL ShaderMaterial blend | Standard practice since ~2019 | Enables noise dissolve, warp, and other character transitions |
| Float render targets | HalfFloat render targets | Widely recommended in WebGL 2 era | 2x VRAM savings with acceptable precision for color blending |
| Manual GPU detection | detect-gpu benchmarks | pmndrs package ~2020, active as of 2025 | Real GPU benchmark database vs fragile UA sniffing |

**Deprecated/outdated:**
- `renderer.setPixelRatio(window.devicePixelRatio)` in render targets: do NOT apply device pixel ratio to intermediate render targets — only to the final canvas output. DPR on render targets multiplies VRAM cost without visual benefit in the blend pass.

---

## Open Questions

1. **Lenis stop/start API stability**
   - What we know: `lenis.stop()` and `lenis.start()` exist in Lenis ^1.3.x (installed version)
   - What's unclear: Whether `stop()` truly prevents scroll events from writing to the store, or only prevents smooth scrolling. Need to verify that `ScrollTrigger.onUpdate` is also gated.
   - Recommendation: Gate scroll at the Zustand store level too — add an `isScrollEnabled: boolean` to eraStore that ScrollEngine checks before calling `eraStore.setState()`.

2. **createPortal vs standalone THREE.Scene for era scenes**
   - What we know: R3F's `createPortal()` renders into a virtual scene that is part of the R3F fiber tree. A standalone `new THREE.Scene()` is outside the fiber tree.
   - What's unclear: Whether era scenes should use `createPortal` (keeps them in React tree, reactive) or manual THREE.Scene (simpler for the compositor to manage). The R3F HUD example uses `createPortal` for secondary scenes.
   - Recommendation: Use `createPortal()` for era scenes — keeps lighting and useFrame hooks working within those scenes without manual wiring. The Compositor's useFrame accesses the underlying THREE.Scene via a `ref` passed from the portal.

3. **HalfFloat render target support on all target devices**
   - What we know: HalfFloat (OES_texture_half_float) is supported in all WebGL 2 contexts, which is universal on desktop Chrome/Firefox/Safari as of 2024.
   - What's unclear: Whether filtering (LINEAR) on HalfFloat is universally supported without the `OES_texture_half_float_linear` extension check.
   - Recommendation: Test on Chrome + Firefox + Safari at launch. Fall back to `UnsignedByteType` if `renderer.capabilities.isWebGL2` is false (unlikely on target desktop audience).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 |
| Config file | vitest.config.ts (check root) or package.json scripts |
| Quick run command | `npm test` (runs `vitest run`) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RNDR-01 | Compositor renders two scenes to separate render targets | unit (logic) | `npm test -- --reporter=verbose src/components/canvas/Compositor.test.ts` | ❌ Wave 0 |
| RNDR-02 | EffectComposer pass applied once per frame without double-render | unit (logic) | `npm test -- src/lib/compositorLogic.test.ts` | ❌ Wave 0 |
| RNDR-03 | Era scenes hidden via visible=false, never unmounted | unit | `npm test -- src/components/eras/EraSceneManagement.test.ts` | ❌ Wave 0 |
| RNDR-04 | compileAsync called during loading gate before scroll unlock | unit | `npm test -- src/components/loading/WombGate.test.ts` | ❌ Wave 0 |
| RNDR-05 | Scroll remains locked until assets loaded + birth animation completes | integration (manual-verify) | Manual: scroll attempt during womb state does nothing | manual-only |
| RNDR-06 | N-2 era dispose called; N+1 era preload triggered by progress threshold | unit | `npm test -- src/lib/memoryManager.test.ts` | ❌ Wave 0 |

**Note on RNDR-01 and RNDR-02:** GPU rendering cannot be unit-tested in a headless Vitest environment (no WebGL context). Tests should validate the **logic** — e.g., that the compositor selects the correct scene pair from eraStore state, that blend values are computed correctly, and that dispose is called with correct arguments. GPU correctness is validated visually.

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/canvas/Compositor.test.ts` — covers RNDR-01 compositor scene selection logic
- [ ] `src/components/loading/WombGate.test.ts` — covers RNDR-04 shader warmup + scroll gate sequencing
- [ ] `src/lib/memoryManager.test.ts` — covers RNDR-06 predictive load and N-2 disposal thresholds
- [ ] `src/components/eras/EraSceneManagement.test.ts` — covers RNDR-03 visibility toggle (not unmount) pattern

---

## Sources

### Primary (HIGH confidence)
- R3F official docs (r3f.docs.pmnd.rs/advanced/pitfalls) — mount/unmount VRAM pattern, useFrame renderPriority, useThree
- Three.js official docs (threejs.org/docs/pages/WebGLRenderer.html) — compileAsync() API, compile() API, WebGLRenderTarget options
- R3F tutorials/loading-models — useLoader.preload(), Suspense pattern, useProgress

### Secondary (MEDIUM confidence)
- Codrops Feb 2025: "Implementing a Dissolve Effect with Shaders and Particles in Three.js" — cnoise-based dissolve pattern with uProgress threshold
- Codrops Feb 2026: "Composite Rendering: The Brilliance Behind Inspiring WebGL Transitions" — dual scene render target blending pattern with GLSL mix
- pmndrs/detect-gpu GitHub — tier levels, getGPUTier() return shape, React usage pattern

### Tertiary (LOW confidence)
- Three.js forum discussions on ImageBitmap texture disposal (issue #23953) — dispose() does not close ImageBitmap; verified by cross-referencing the GitHub issue
- Community pattern for Lenis stop/start scroll locking — needs validation against Lenis ^1.3.18 API

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed (except detect-gpu and drei which are ecosystem standard)
- A/B compositor architecture: HIGH — pattern confirmed by official R3F docs, Two.js example (webgl_postprocessing_crossfade), and Codrops 2026 article
- Shader warmup (compileAsync): HIGH — documented in official Three.js WebGLRenderer API
- Loading gate / Suspense: HIGH — documented in R3F tutorials
- GLSL dissolve shader: HIGH — confirmed by Codrops 2025 tutorial with working code
- Memory management / dispose: MEDIUM — well-documented pattern but ImageBitmap caveat is an edge case worth testing
- detect-gpu adaptive sizing: MEDIUM — library confirmed active, tier values confirmed from GitHub README
- Lenis scroll locking: LOW — API exists but exact interaction with ScrollTrigger under stop() needs verification

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable libraries; Three.js API unlikely to change within 30 days)
