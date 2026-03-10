---
phase: 02-render-pipeline
plan: "03"
subsystem: rendering
tags: [three.js, r3f, postprocessing, shader-warmup, effectcomposer, react-context]

# Dependency graph
requires:
  - phase: 02-render-pipeline/02-01
    provides: dissolve/womb GLSL shaders and ShaderMaterial factory wrappers
  - phase: 02-render-pipeline/02-02
    provides: era scenes, Compositor, WombGate, ScrollEngine scroll gate

provides:
  - Shader warmup (gl.compileAsync) targeting actual portal era scenes during birth animation
  - Imperative EffectComposer (postprocessing library) wired into compositor render loop
  - PortalScenesContext and usePortalScenes hook for future consumers
  - Ref-bridging pattern in Scene.tsx connecting Compositor portal scenes to WombGate

affects:
  - Phase 9 post-processing (per-era EffectPass instances added to proven infrastructure)
  - Any future component needing portal scene refs (use PortalScenesContext)

# Tech tracking
tech-stack:
  added:
    - postprocessing (imperative API for EffectComposer)
    - "@react-three/postprocessing (installed, React component API not used — imperative preferred)"
  patterns:
    - "Imperative EffectComposer in useFrame manual render loop (not React component tree)"
    - "Ref-bridging: parent useRef with getter/setter notifies via useState when Compositor populates scenes"
    - "Intermediate render target (rtComposite) separates A/B composite from post-processing pass"
    - "compileAsync called on each portal scene individually via Promise.all"

key-files:
  modified:
    - src/components/canvas/Compositor.tsx
    - src/components/loading/WombGate.tsx
    - src/components/canvas/Scene.tsx
  created: []

key-decisions:
  - "EffectComposer used imperatively (postprocessing library direct API) not as @react-three/postprocessing React components — avoids conflict with manual useFrame render loop"
  - "WombGate receives portalScenes via props from Scene.tsx ref bridge, not via PortalScenesContext — WombGate is a sibling not a child of Compositor so context would require restructuring JSX tree"
  - "rtComposite is a third WebGLRenderTarget: A/B eras render to rtA/rtB, composite quad renders to rtComposite, EffectComposer reads rtComposite and outputs to screen"
  - "ToneMappingEffect with ACES_FILMIC mode proves the post-processing pipeline; redundant with canvas gl.toneMapping setting but intentional as infrastructure proof"

patterns-established:
  - "Phase 9 post-processing: add EffectPass instances after the existing ToneMappingEffect in Compositor.tsx useEffect"
  - "Portal scene ref bridging via setter-trap ref in Scene.tsx SceneContents"

requirements-completed: [RNDR-02, RNDR-04]

# Metrics
duration: 4min
completed: 2026-03-10
---

# Phase 02 Plan 03: Gap Closure Summary

**Shader warmup now targets actual portal era scenes via compileAsync, and an imperative EffectComposer (ToneMappingEffect ACES_FILMIC) is wired into the compositor render loop proving the Phase 9 post-processing infrastructure.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T18:19:23Z
- **Completed:** 2026-03-10T18:23:42Z
- **Tasks:** 1
- **Files modified:** 5 (3 source files + package.json + package-lock.json)

## Accomplishments

- Fixed RNDR-04: WombGate now calls `gl.compileAsync(s, camera)` for each portal era scene in `Promise.all`, not `useThree().scene` (the empty root R3F scene that contains no era meshes)
- Fixed RNDR-02: Imperative `EffectComposer` with `RenderPass` + `EffectPass(ToneMappingEffect)` wired into Compositor's `useFrame` loop — proves Phase 9 per-era post-processing infrastructure
- Removed dead `useCompositorScenes()` export and replaced with exported `PortalScenesContext` + `usePortalScenes()` hook
- Portal scene refs flow from Compositor to WombGate via a setter-trap `useRef` in Scene.tsx's `SceneContents` that triggers a `useState` re-render when Compositor mounts

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix shader warmup targets and prove EffectComposer integration** - `de5e74e` (feat)

**Plan metadata:** (see final commit in this summary)

## Files Created/Modified

- `src/components/canvas/Compositor.tsx` - Added `PortalScenesContext`/`usePortalScenes`, `portalScenesRef` prop, `rtComposite` third render target, imperative `EffectComposer` with `ToneMappingEffect`; removed dead `useCompositorScenes()`
- `src/components/loading/WombGate.tsx` - Added `WombGateProps` with `portalScenes?: THREE.Scene[]`; removed `scene` from `useThree()` destructure; replaced single `gl.compileAsync(scene, camera)` with `Promise.all(scenes.map(s => gl.compileAsync(s, camera)))`
- `src/components/canvas/Scene.tsx` - Added ref-bridge pattern (setter-trap `useRef` + `useState` in `SceneContents`) to pass portal scene refs from Compositor to WombGate
- `package.json` + `package-lock.json` - Added `postprocessing` and `@react-three/postprocessing`

## Decisions Made

- **Imperative EffectComposer over React component tree:** `@react-three/postprocessing`'s `<EffectComposer>` React component would conflict with the manual `useFrame` render loop. The imperative `postprocessing` library API is used directly, consistent with how Phase 9 will add per-era effects.
- **Props over context for WombGate:** WombGate is a sibling of Compositor in SceneContents, not a descendant. Passing via context would require moving WombGate inside Compositor's JSX. Props via ref bridge is structurally cleaner.
- **Setter-trap ref for notification:** Compositor's `useEffect` sets `portalScenesRef.current = portalScenes`. To notify WombGate when this happens, a getter/setter object stored in a `useRef` intercepts the assignment and calls `setPortalScenesReady(true)`, triggering a re-render with the actual scenes.
- **rtComposite as intermediate target:** Separates the A/B composite step from the post-processing step. This is the pattern Phase 9 will build on for per-era grading.

## Deviations from Plan

None - plan executed exactly as written. EffectComposer Option A (imperative, manual render loop) was selected as recommended in the plan.

## Issues Encountered

- TypeScript error on `EffectComposer` and `EffectPass` constructors: initial `as unknown as Parameters<typeof X>[0]` casts were incorrect. Removed casts since `postprocessing` types import `WebGLRenderer` and `Camera` from `"three"` — the same package R3F provides — so the types are directly compatible.
- `state.delta` doesn't exist on R3F's `RootState`; the delta is the second argument to `useFrame((state, delta) => ...)`. Fixed by adding `delta` parameter.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 render pipeline is complete. All RNDR requirements satisfied.
- Phase 9 post-processing: add `EffectPass` instances after the existing `ToneMappingEffect` in Compositor.tsx's `useEffect`. The `effectComposerRef.current` imperative API is the entry point.
- The `usePortalScenes()` hook (exported from Compositor) is available for any future R3F component that needs portal scene refs within the canvas.

---
*Phase: 02-render-pipeline*
*Completed: 2026-03-10*
