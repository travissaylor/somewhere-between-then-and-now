---
phase: 01-foundation
plan: 01
subsystem: scroll-engine
tags: [next.js, react-three-fiber, three.js, gsap, lenis, zustand, vitest, scroll-math]

# Dependency graph
requires:
  - phase: none
    provides: greenfield project
provides:
  - Next.js 16 App Router project scaffold with all dependencies
  - ERA_CONFIG array with 13 eras and per-era scroll weights
  - computeEraProgress pure function for weighted scroll-to-era decomposition
  - computeScrollHeight for scroll container sizing
  - Zustand vanilla era store with React hook bridge
  - Vitest test infrastructure with path alias support
affects: [01-foundation-plan-02, 02-render-pipeline, 03-audio, all-subsequent-phases]

# Tech tracking
tech-stack:
  added: [next@16.1.6, react@19.2.3, three@0.183.2, "@react-three/fiber@9.5.0", gsap@3.14.2, lenis@1.3.18, zustand@5.0.11, vitest@4.0.18]
  patterns: [zustand-vanilla-store, weighted-scroll-decomposition, app-router-server-layout]

key-files:
  created:
    - src/config/eras.ts
    - src/lib/scrollMath.ts
    - src/lib/scrollMath.test.ts
    - src/store/eraStore.ts
    - src/store/eraStore.test.ts
    - vitest.config.ts
  modified:
    - package.json
    - src/app/globals.css
    - src/app/layout.tsx

key-decisions:
  - "Zustand vanilla store via createStore from zustand/vanilla for useFrame safety"
  - "ERA_CONFIG scaffold weights: major transitions 2-3x, connective eras 1.0, chaos era 0.5 -- authorial tuning deferred"
  - "RootLayout kept as Server Component (no use client needed)"

patterns-established:
  - "Vanilla Zustand store pattern: createStore for non-React access, useStore bridge for React components"
  - "Pure math modules tested with Vitest: no DOM/browser dependency for core logic"
  - "Path alias @/ resolving to src/ across both Next.js and Vitest"

requirements-completed: [FOUND-01, FOUND-04, FOUND-05]

# Metrics
duration: 4min
completed: 2026-03-10
---

# Phase 1 Plan 1: Foundation Bootstrap Summary

**Next.js 16 scaffold with weighted scroll-to-era math engine, 13-era config, and Zustand vanilla store -- all 14 unit tests passing**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T15:46:07Z
- **Completed:** 2026-03-10T15:49:52Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Next.js 16.1.6 project bootstrapped with R3F 9.5.0, GSAP 3.14.2, Lenis 1.3.18, Zustand 5.0.11, Three.js 0.183.2
- 13-era config with emotionally weighted scroll distances (major transitions get 2-3x, compressed eras get 0.5x)
- Pure scroll math engine: computeEraProgress decomposes global 0-1 progress into era-aware values respecting per-era weights
- Zustand vanilla store provides getState/setState for scroll engine writes and useFrame reads, plus React hook bridge

## Task Commits

Each task was committed atomically:

1. **Task 1: Bootstrap Next.js project and install all dependencies** - `aecbc7a` (feat)
2. **Task 2 RED: Failing tests for scroll math and era store** - `98f47f5` (test)
3. **Task 2 GREEN: Implement scroll math engine and Zustand era store** - `4cb9551` (feat)

## Files Created/Modified
- `src/config/eras.ts` - 13-era config with EraConfig interface and weighted scroll distances
- `src/lib/scrollMath.ts` - Pure functions: computeEraProgress, computeScrollHeight, eraBoundaries
- `src/lib/scrollMath.test.ts` - 11 unit tests for scroll math (boundaries, clamping, weight distribution, reachability)
- `src/store/eraStore.ts` - Zustand vanilla store with EraState interface and useEraStore React hook bridge
- `src/store/eraStore.test.ts` - 3 unit tests for store (initial state, setState/getState, rapid updates)
- `vitest.config.ts` - Vitest configuration with @/ path alias
- `package.json` - Project dependencies and test scripts
- `src/app/globals.css` - Dark cinematic base styles (black background, white text, overflow-x hidden)
- `src/app/layout.tsx` - Minimal Server Component RootLayout with project metadata

## Decisions Made
- Used `createStore` from `zustand/vanilla` (not `create` from `zustand`) per user decision for useFrame safety
- RootLayout kept as Server Component -- no `'use client'` needed since it only wraps children and sets metadata
- ERA_CONFIG weights are scaffold values matching the creative brief's emotional arc; authorial tuning deferred
- Three.js 0.183.2 resolved by npm within R3F peer range; no manual pinning needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `create-next-app` refused to run in non-empty directory (had .planning/ and creative_direction_brief.md) -- resolved by scaffolding in temp directory and rsyncing files back, as anticipated by the plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Era config, scroll math, and Zustand store are ready for Plan 02 (scroll engine, R3F canvas, Lenis/GSAP integration)
- All 14 tests passing; build clean
- Vitest infrastructure operational for future test additions

## Self-Check: PASSED

All 6 key files verified on disk. All 3 task commits verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-10*
