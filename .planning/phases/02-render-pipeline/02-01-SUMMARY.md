---
phase: 02-render-pipeline
plan: 01
subsystem: rendering
tags: [three.js, glsl, shader, webgl, vitest, detect-gpu]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: ERA_CONFIG (era count for compositor), eraStore (globalProgress/currentEra/eraProgress)

provides:
  - Pure-function compositor logic: getScenePair(), computeBlendFactor(), getOverlapRegion()
  - Pure-function memory manager: getMemoryPlan() with visible/preload/dispose windows
  - GPU tier utility: detectRenderBudget() via detect-gpu, DEFAULT_RENDER_BUDGET constant
  - Dissolve shader: Perlin noise threshold blend between two render-target textures
  - Womb heartbeat shader: ~70bpm pulse with birth acceleration ramp
  - ShaderMaterial factories: createCompositorMaterial(), createWombMaterial()
  - GLSL import infrastructure: webpack asset/source rule, TypeScript .glsl module declaration

affects:
  - 02-02 (compositor R3F component uses these factories and logic)
  - 02-03 (womb gate uses WombMaterial and loading lifecycle)
  - 08-transitions (custom transition shaders use same swappable ShaderMaterial pattern)

# Tech tracking
tech-stack:
  added:
    - detect-gpu ^5.x — GPU tier detection for adaptive keep-alive window
  patterns:
    - Pure-function logic layer (no WebGL dependency) tested in Vitest before wiring into R3F
    - ShaderMaterial factory pattern (not React components) for GPU shader encapsulation
    - TDD RED→GREEN cycle for compositor and memory manager logic
    - GLSL as raw string imports via webpack asset/source rule

key-files:
  created:
    - src/lib/gpuTier.ts
    - src/lib/compositorLogic.ts
    - src/lib/compositorLogic.test.ts
    - src/lib/memoryManager.ts
    - src/lib/memoryManager.test.ts
    - src/shaders/dissolve.vert.glsl
    - src/shaders/dissolve.frag.glsl
    - src/shaders/womb.vert.glsl
    - src/shaders/womb.frag.glsl
    - src/shaders/glsl.d.ts
    - src/components/canvas/CompositorMaterial.ts
    - src/components/loading/WombMaterial.ts
  modified:
    - next.config.ts (webpack .glsl rule)
    - package.json (detect-gpu dependency)

key-decisions:
  - "Perlin noise (cnoise from Patricio Gonzalez Vivo) chosen over Voronoi for organic dissolve — continuous flowing noise matches womb-birth metaphor"
  - "computeBlendFactor uses early-return for eraProgress >= 1.0 to avoid floating-point imprecision near boundary"
  - "getMemoryPlan preload target is windowEnd+1 (one era beyond far edge of visible window) matching N+1 predictive loading pattern"
  - "womb vignette tuned to dist*2.8 — starts darkening at ~0.4 radius for enclosure feeling without harsh edges"
  - "ShaderMaterial factories (not React components) so Plan 02 can instantiate them inside R3F useFrame without Hook constraints"

patterns-established:
  - "Logic-before-GPU: pure TS functions testable in Vitest, wired to R3F in next plan — enables CI without WebGL"
  - "ShaderMaterial factory pattern: createXMaterial() returns configured ShaderMaterial; uniforms mutated in useFrame"
  - "GLSL as asset/source via webpack — no raw-loader, native webpack 5 pattern"

requirements-completed: [RNDR-02, RNDR-03, RNDR-06]

# Metrics
duration: 4min
completed: 2026-03-10
---

# Phase 02 Plan 01: Logic Layer and GPU Shaders Summary

**Compositor scene-pair selection, overlap blend math, and memory-window logic as tested pure functions, plus Perlin noise dissolve shader and 70bpm womb heartbeat shader with ShaderMaterial factories**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T16:39:52Z
- **Completed:** 2026-03-10T16:43:40Z
- **Tasks:** 2
- **Files modified:** 12 created + 2 modified

## Accomplishments

- 23 unit tests covering all compositor and memory manager logic — zero WebGL dependency in any test
- Dissolve fragment shader with full classic 3D Perlin noise (`cnoise`) implementation for organic threshold blending
- Womb shader with sharp-pulse heartbeat (`pow(sin(...), 3.0)`) at 70bpm, birth acceleration ramp, and edge vignette
- `createCompositorMaterial()` and `createWombMaterial()` factory functions ready for Plan 02 R3F wiring
- GLSL import infrastructure (webpack `asset/source` rule + TypeScript declaration) wired into Next.js config

## Task Commits

Each task was committed atomically:

1. **Task 1: Compositor logic and memory manager with tests** - `0c2268b` (feat)
2. **Task 2: GLSL shaders and ShaderMaterial wrappers** - `a5149ea` (feat)

## Files Created/Modified

- `src/lib/gpuTier.ts` - `detectRenderBudget()` using detect-gpu, `RenderBudget` interface, `DEFAULT_RENDER_BUDGET` constant
- `src/lib/compositorLogic.ts` - `getScenePair()`, `computeBlendFactor()`, `getOverlapRegion()` — pure functions
- `src/lib/compositorLogic.test.ts` - 14 tests covering blend math, overlap region, scene pair selection edge cases
- `src/lib/memoryManager.ts` - `getMemoryPlan()` with visible/preload/dispose window computation
- `src/lib/memoryManager.test.ts` - 9 tests including dispose-with-loadedEras and boundary clamping
- `src/shaders/dissolve.vert.glsl` - Fullscreen quad vertex shader with UV passthrough
- `src/shaders/dissolve.frag.glsl` - Perlin noise threshold dissolve with `cnoise` and soft edge `smoothstep`
- `src/shaders/womb.vert.glsl` - Fullscreen quad vertex shader
- `src/shaders/womb.frag.glsl` - Heartbeat pulse, birth acceleration, vignette
- `src/shaders/glsl.d.ts` - `declare module '*.glsl'` TypeScript declaration
- `src/components/canvas/CompositorMaterial.ts` - `createCompositorMaterial()` factory
- `src/components/loading/WombMaterial.ts` - `createWombMaterial()` factory with 1.167Hz beat rate
- `next.config.ts` - Added webpack `asset/source` rule for `.glsl` files

## Decisions Made

- **Perlin over Voronoi for dissolve:** Continuous organic noise matches the womb-birth metaphor; Voronoi cellular patterns would feel too mechanical for this emotional transition
- **Early-return at eraProgress >= 1.0:** Floating-point arithmetic `(1.0 - 0.9) / 0.1` produces `0.9999...`, not `1.0` — explicit early return avoids fence-post error in blend clamping
- **ShaderMaterial factories (not React components):** Plan 02 instantiates these inside `useFrame` and `useMemo` — factory functions have no React Hook constraints
- **getMemoryPlan preload = windowEnd + 1:** One era beyond the far visible edge — matches the N+1 predictive loading pattern described in research

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed floating-point boundary in computeBlendFactor**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** `(1.0 - (1.0 - 0.1)) / 0.1` evaluates to `0.9999999999999998` in IEEE 754 arithmetic, causing test `toBe(1)` to fail
- **Fix:** Added early-return `if (eraProgress >= 1.0) return 1` before the ramp calculation
- **Files modified:** `src/lib/compositorLogic.ts`
- **Verification:** All 14 compositor tests pass including boundary cases
- **Committed in:** `0c2268b` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - floating-point precision bug)
**Impact on plan:** Required fix for correctness; no scope creep.

## Issues Encountered

None beyond the floating-point precision auto-fix above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All logic and shader artifacts are ready for Plan 02 (Compositor R3F component wiring)
- `createCompositorMaterial()` and `createWombMaterial()` export directly into R3F component `useMemo` calls
- `getScenePair()` and `getMemoryPlan()` are ready to be called from `useFrame` in Compositor.tsx
- `detectRenderBudget()` is ready for app-init call to configure the keep-alive window

## Self-Check: PASSED

- All 12 created files verified present on disk
- Task commits `0c2268b` and `a5149ea` verified in git log
- 37 tests pass (all existing + 23 new)
- TypeScript compilation clean (0 errors)

---
*Phase: 02-render-pipeline*
*Completed: 2026-03-10*
