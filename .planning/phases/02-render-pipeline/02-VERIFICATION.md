---
phase: 02-render-pipeline
verified: 2026-03-10T14:30:00Z
status: human_needed
score: 9/9 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 7/9
  gaps_closed:
    - "Shader warmup now targets actual portal era scenes via Promise.all(portalScenes.map(s => gl.compileAsync(s, camera)))"
    - "EffectComposer (imperative postprocessing library) integrated into compositor render loop with ToneMappingEffect ACES_FILMIC"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Load the app in Chrome, observe womb state and birth animation"
    expected: "Deep red-black pulsing warmth with ~70bpm rhythm. No text, no loading indicator. Attempt to scroll during womb — no movement. After ~1.8s minimum, heartbeat accelerates, screen floods with white-warm light, then Era 01 (abstract amber glow scene) becomes visible. Scroll now works."
    why_human: "Visual/haptic quality of heartbeat rhythm, birth flash timing, and first impression of Era 01 cannot be verified programmatically."
  - test: "Scroll toward Era 02 boundary (approximately 1/13 of total scroll)"
    expected: "Perlin noise dissolve begins organically blending Era 01 (amber glow, darkness) into Era 02 (backyard diorama, golden-hour grass/house). Dissolve uses noise pattern — not a uniform fade. Back-scrolling reverses smoothly."
    why_human: "Visual correctness of the noise dissolve pattern and perceptual distinction between the two scenes requires human assessment."
  - test: "Scroll through the Era 01 to Era 02 transition immediately after the birth animation"
    expected: "No visible frame drop or stutter on the first transition. Transition feels smooth. The compileAsync warmup now correctly targets portal era scenes, so shader compilation should not happen on-demand during first transition."
    why_human: "Shader compilation stutter is a performance timing artifact visible only at runtime. Warmup gap is now fixed — verify no stutter occurs."
---

# Phase 02: Render Pipeline Verification Report

**Phase Goal:** A single era scene renders correctly via the RenderTarget A/B compositor, proving the transition architecture and all GPU resource patterns before 13 eras are built
**Verified:** 2026-03-10T14:30:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (Plan 02-03)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Compositor logic correctly selects which two era scenes to assign to render targets A and B based on currentEra and eraProgress | VERIFIED | `getScenePair()` in compositorLogic.ts: correct fromEra/toEra/blend computation; 14 unit tests pass |
| 2 | Blend factor is computed from eraProgress with configurable overlap region per era boundary | VERIFIED | `computeBlendFactor()` and `getOverlapRegion()` implemented as pure functions; 14 tests pass |
| 3 | Memory manager determines which eras to keep alive, preload, and dispose based on currentEra and GPU tier | VERIFIED | `getMemoryPlan()` in memoryManager.ts; 9 tests pass including boundary clamping |
| 4 | Dissolve shader blends two textures using Perlin noise threshold driven by a uniform blend value | VERIFIED | dissolve.frag.glsl: full classic 3D Perlin noise (cnoise), smoothstep soft edge, noise-threshold mix; uniforms match CompositorMaterial factory |
| 5 | Womb shader pulses red-black warmth at ~70bpm and can accelerate toward a birth flash | VERIFIED | womb.frag.glsl: sharp pulse with acceleration ramp; uBirthProgress scales beat rate to 4x; birth flood color present |
| 6 | A loading screen (womb state) blocks scroll until era assets are confirmed ready, then releases with a birth animation | VERIFIED | WombGate.tsx LOADING→BIRTH→DONE state machine; lenis.stop() on init in ScrollEngine; eraStore.subscribe for start/stop; minimum 1800ms womb duration enforced |
| 7 | One era-to-era transition renders via the RenderTarget A/B compositor without visual corruption | VERIFIED (automated) / HUMAN NEEDED | Compositor.tsx: two WebGLRenderTargets, per-era createPortal isolation, manual useFrame(priority=1) render loop, dissolve material blend; visual correctness needs human confirmation |
| 8 | No first-transition stutter after the loading screen clears (shader warmup via compileAsync is active) | VERIFIED (automated) / HUMAN NEEDED | WombGate lines 141-150: `Promise.all(scenes.map(s => gl.compileAsync(s, camera)))` runs at birthProgress > 0.1; `scenes` is `portalScenes` prop from Scene.tsx ref-bridge; targets actual portal era scenes, not root R3F scene; stutter prevention must be confirmed at runtime |
| 9 | RNDR-02: Single EffectComposer applies all per-era post-processing in one merged GPU pass | VERIFIED | Compositor.tsx lines 6, 137-155, 224-231: imperative `EffectComposer` with `RenderPass` + `EffectPass(ToneMappingEffect ACES_FILMIC)` wired into `useFrame`; `effectComposerRef.current.render(delta)` called each frame after composite step; packages `postprocessing` and `@react-three/postprocessing` installed |

**Score:** 9/9 truths verified (3 items also need human runtime confirmation)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/compositorLogic.ts` | Scene pair selection and blend factor computation | VERIFIED | 63 lines; exports `getScenePair`, `computeBlendFactor`, `getOverlapRegion` |
| `src/lib/compositorLogic.test.ts` | Tests for compositor logic | VERIFIED | 99 lines, 14 tests, all passing |
| `src/lib/memoryManager.ts` | Keep-alive window, preload triggers, disposal decisions | VERIFIED | 51 lines; exports `getMemoryPlan`, `MemoryPlan` interface |
| `src/lib/memoryManager.test.ts` | Tests for memory manager | VERIFIED | 69 lines, 9 tests, all passing |
| `src/lib/gpuTier.ts` | GPU tier detection and render budget | VERIFIED | exports `detectRenderBudget`, `RenderBudget`, `DEFAULT_RENDER_BUDGET` |
| `src/shaders/dissolve.frag.glsl` | Perlin noise dissolve fragment shader | VERIFIED | 109 lines; full cnoise implementation; correct uniforms |
| `src/shaders/womb.frag.glsl` | Womb heartbeat pulse fragment shader | VERIFIED | 51 lines; uTime/uBeatRate/uIntensity/uBirthProgress; acceleration ramp |
| `src/components/canvas/CompositorMaterial.ts` | ShaderMaterial wrapping dissolve shader | VERIFIED | exports `createCompositorMaterial()` |
| `src/components/loading/WombMaterial.ts` | ShaderMaterial wrapping womb pulse shader | VERIFIED | exports `createWombMaterial()`; uBeatRate=1.167 |
| `src/components/canvas/Compositor.tsx` | A/B render target compositor with manual render loop and EffectComposer | VERIFIED | 248 lines; createPortal per era; useFrame(priority=1); rtA/rtB/rtComposite; imperative EffectComposer; PortalScenesContext exported; dead useCompositorScenes() removed |
| `src/components/eras/Era01BornScene.tsx` | Era 01 proof scene — warm light emergence | VERIFIED | 141 lines; pulsing amber core; 3 icosahedron blobs; `visible` prop forwarded |
| `src/components/eras/Era02ChildhoodScene.tsx` | Era 02 proof scene — backyard diorama | VERIFIED | 183 lines; grass, house, tree, golden-hour light; `visible` prop forwarded |
| `src/components/loading/WombGate.tsx` | Loading gate with heartbeat pulse, shader warmup, scroll unlock | VERIFIED | 168 lines; `WombGateProps` with `portalScenes?: THREE.Scene[]`; `Promise.all(scenes.map(s => gl.compileAsync(s, camera)))` at birthProgress > 0.1; no longer references useThree().scene for warmup |
| `src/components/canvas/Scene.tsx` | Updated R3F Canvas shell with portal scene ref-bridge | VERIFIED | 107 lines; setter-trap `wrappedRef` + `useState(portalScenesReady)` pattern bridges Compositor portal scenes to WombGate |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `Compositor.tsx` | `src/store/eraStore.ts` | `eraStore.getState()` inside useFrame | WIRED | Line 185: `const { currentEra, eraProgress } = eraStore.getState()` |
| `Compositor.tsx` | `src/components/canvas/CompositorMaterial.ts` | `createCompositorMaterial()` | WIRED | Line 7 import + line 115 call inside `useMemo` |
| `Compositor.tsx` | `src/lib/compositorLogic.ts` | `getScenePair` | WIRED | Line 8 import + line 188 call in useFrame |
| `WombGate.tsx` | portal era scenes | `gl.compileAsync(s, camera)` on each portalScene | WIRED | Lines 144-149: `Promise.all(scenes.map(s => gl.compileAsync(s, camera)))` where `scenes` = `portalScenes` prop from Scene.tsx |
| `Scene.tsx` | `Compositor.tsx` | `portalScenesRef` setter-trap prop | WIRED | Lines 83-91: setter-trap `wrappedRef` intercepts assignment, calls `setPortalScenesReady(true)`; line 103: `<Compositor portalScenesRef={wrappedRef.current} />` |
| `Scene.tsx` | `WombGate.tsx` | `portalScenes` prop | WIRED | Line 101: `<WombGate portalScenes={portalScenesReady ? portalScenesRef.current : []} />` |
| `WombGate.tsx` | `src/components/scroll/ScrollEngine.tsx` | scroll unlock via `isScrollEnabled` | WIRED | WombGate line 161: `eraStore.setState({ isScrollEnabled: true })`; ScrollEngine subscribes and calls `lenis.start()` |
| `Compositor.tsx` | `src/lib/memoryManager.ts` | `getMemoryPlan` | WIRED | Line 9 import + line 191 call in useFrame |
| `Compositor.tsx` | EffectComposer post-processing | `effectComposerRef.current.render(delta)` | WIRED | Lines 137-155: imperative EffectComposer created in useEffect; lines 224-226: called in useFrame after composite step |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| RNDR-01 | 02-02 | RenderTarget A/B compositor renders two era scenes off-screen simultaneously | SATISFIED | Compositor.tsx creates rtA+rtB, renders fromEra and toEra scenes separately, composites to screen via dissolve ShaderMaterial |
| RNDR-02 | 02-01, 02-03 | Single EffectComposer applies all per-era post-processing in one merged GPU pass | SATISFIED | Compositor.tsx lines 137-155: imperative EffectComposer from `postprocessing` library with RenderPass + EffectPass(ToneMappingEffect ACES_FILMIC); wired into useFrame render loop; per-era passes deferred to Phase 9 as designed |
| RNDR-03 | 02-01, 02-02 | Visibility-based scene management (never unmount/remount era components) | SATISFIED | Era scenes always mounted via createPortal; `visible` prop on `<group>` toggles draw calls; getMemoryPlan drives visibilityRef; no conditional mounting |
| RNDR-04 | 02-02, 02-03 | Shader warmup via renderer.compile() during loading screen | SATISFIED | WombGate lines 141-150: compileAsync called at birthProgress > 0.1 on each portal era scene (not empty root scene); portalScenes flow from Compositor through Scene.tsx ref-bridge |
| RNDR-05 | 02-02 | Asset preloading with loading gate that blocks scroll until era assets are ready | SATISFIED | useProgress() monitors loading; minimum 1800ms womb duration; lenis.stop() on init; isScrollEnabled gate; `eraStore.setState({ isScrollEnabled: true })` on DONE |
| RNDR-06 | 02-01, 02-02 | Predictive N+1 asset loading and N-2 disposal for memory management | SATISFIED | getMemoryPlan returns preload=[windowEnd+1] and dispose from loadedEras outside window; wired in Compositor useFrame; 9 unit tests pass |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/canvas/Compositor.tsx` | 217-218, 144 | `rtComposite` is rendered to but the EffectComposer's `RenderPass` targets `quadScene` directly — `rtComposite.texture` is never consumed as input. The composite step renders A/B to `rtComposite` (line 217), then the EffectComposer re-renders `quadScene` (re-blending rtA+rtB) as its input pass. This is a wasted intermediate render target and a double-blend of the dissolve quad per frame. | Warning | One extra `gl.render()` call per frame; `rtComposite` RT allocated and maintained for no purpose. Not blocking — pipeline produces correct output. Should be resolved when Phase 9 authors per-era effects to avoid confusion about the intended data flow. |

### Human Verification Required

**Note:** The following items require human browser testing before Phase 2 goal is considered fully achieved. All automated checks pass.

### 1. Womb State and Birth Animation

**Test:** Run `npm run dev`, open http://localhost:3000. Observe the initial state and let it play.
**Expected:** Deep red-black pulsing warmth at approximately 70bpm heartbeat rhythm. No text, no progress bars. Attempting to scroll does nothing. After ~1.8 seconds, the heartbeat visibly accelerates, intensity grows, and the screen floods with white-warm light. Era 01 (amber glowing sphere with dark blobs) becomes visible. Scrolling now works.
**Why human:** Visual quality of heartbeat rhythm, birth flash timing, emotional impact, and scroll-lock behavior require live browser testing.

### 2. Era 01 to Era 02 Dissolve Transition

**Test:** After the birth animation completes, scroll toward the Era 02 boundary (approximately 1/13 of total scroll height).
**Expected:** As eraProgress approaches 90%, a Perlin noise dissolve begins — organic flowing patches of Era 02's backyard diorama (green grass, house, golden-hour sky) appear through Era 01's amber darkness. At full eraProgress=1.0, Era 02 is fully visible. Back-scrolling reverses the dissolve smoothly. The transition looks like flowing organic shapes, not a uniform fade.
**Why human:** Visual correctness of noise pattern, scene distinctiveness, and smooth reversibility require live GPU rendering.

### 3. First-Transition Stutter Check

**Test:** After the birth animation, immediately scroll to the Era 01 to Era 02 boundary for the first time.
**Expected:** The transition should be smooth with no visible frame drop. The compileAsync warmup now correctly targets the portal era scenes (Era01BornScene and Era02ChildhoodScene meshes and materials) rather than the empty root R3F scene. First-transition stutter should not occur.
**Why human:** Shader compilation stutter is a performance timing artifact only detectable at runtime. The previous gap has been corrected — verify the fix is effective.

### Re-verification Summary

Both gaps from the initial verification have been closed by Plan 02-03:

**Gap 1 — Shader warmup (RNDR-04): CLOSED.** WombGate.tsx now accepts `portalScenes?: THREE.Scene[]` as a prop. Scene.tsx uses a setter-trap `useRef` (lines 83-91) to intercept when Compositor populates its `portalScenesRef` and triggers a `useState` re-render so WombGate receives the actual `THREE.Scene` instances before the birth animation fires. The warmup call at `birthProgress > 0.1` now calls `gl.compileAsync` on each portal era scene — the scenes that actually contain era meshes and shaders.

**Gap 2 — EffectComposer (RNDR-02): CLOSED.** The `postprocessing` library is installed. Compositor.tsx creates an imperative `EffectComposer` in `useEffect` with a `RenderPass` targeting the composite quad scene and an `EffectPass` applying `ToneMappingEffect(ACES_FILMIC)`. Each frame, after the A/B composite step, `effectComposerRef.current.render(delta)` applies the post-processing pass and outputs to screen. The dead `useCompositorScenes()` export has been removed and replaced with an exported `PortalScenesContext` and `usePortalScenes` hook for future consumers.

One warning-level anti-pattern was identified: the intermediate `rtComposite` render target is allocated and rendered to each frame, but the EffectComposer's own `RenderPass` re-renders `quadScene` directly (re-blending rtA+rtB) rather than reading `rtComposite.texture`. This means the dissolve quad is rendered twice per frame and `rtComposite` is a wasted allocation. This does not affect correctness — the EffectComposer does apply post-processing and output to screen correctly — but Phase 9 should fix the data flow to remove the redundant render step.

---

_Verified: 2026-03-10T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
