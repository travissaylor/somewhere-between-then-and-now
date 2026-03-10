---
phase: 03-audio-engine
plan: 02
subsystem: audio
tags: [tone.js, web-audio, react, next.js, zustand, scroll-reactive]

# Dependency graph
requires:
  - phase: 03-01
    provides: computeGainForEra pure function and AUDIO_ZONES 13-zone configuration
  - phase: 01-02
    provides: eraStore with currentEra, eraProgress, isScrollEnabled scroll state
  - phase: 02
    provides: WombGate womb-gate pattern (isScrollEnabled=true signals user gesture complete)

provides:
  - AudioEngine.ts: Tone.js singleton with 13 stems, gesture gate, visibility suspend/resume, graceful fallback
  - AudioProvider.tsx: Client component wiring AudioEngine to eraStore and DOM lifecycle
  - page.tsx: AudioProvider mounted via dynamic(ssr:false) after Scene

affects: [phase-04-eras, phase-09-post-processing, audio-stem-delivery]

# Tech tracking
tech-stack:
  added: [tone@latest]
  patterns:
    - All Tone.js construction inside init() — never at module scope — prevents SSR crash
    - Dynamic import of AudioEngine module from AudioProvider — belt-and-suspenders SSR safety
    - eraStore.subscribe for audio updates — fires on state change not every animation frame
    - rawContext cast to AudioContext for suspend() — Tone BaseContext exposes only resume()
    - rampTo(target, 0.05) for all gain changes — never direct .value assignment

key-files:
  created:
    - src/audio/AudioEngine.ts
    - src/components/audio/AudioProvider.tsx
  modified:
    - src/app/page.tsx

key-decisions:
  - "AudioEngine suspend uses rawContext cast to AudioContext — Tone.js BaseContext only exposes resume(), not suspend()"
  - "eraStore.subscribe drives audio (not useFrame) — audio updates only when scroll state actually changes"
  - "Dynamic import in AudioProvider useEffect plus ssr:false wrapper in page.tsx — double isolation from SSR"

patterns-established:
  - "AudioEngine: Tone.js singleton created by factory, initialised in useEffect, disposed on unmount"
  - "Graceful stem fallback: loadStem catches all errors, stores null, logs warn — experience continues silently"
  - "Gesture gate: engine.start() only after isScrollEnabled=true (womb gate completion counts as user gesture)"

requirements-completed: [AUDO-01, AUDO-05, AUDO-06]

# Metrics
duration: 15min
completed: 2026-03-10
---

# Phase 03 Plan 02: Audio Engine Summary

**Tone.js AudioEngine singleton with 13-stem gesture-gated scroll-reactive crossfader, tab-visibility suspend/resume, and graceful missing-stem fallback wired to eraStore via AudioProvider**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-10T19:10:58Z
- **Completed:** 2026-03-10T19:25:00Z
- **Tasks:** 2
- **Files modified:** 4 (AudioEngine.ts, AudioProvider.tsx, page.tsx, package.json)

## Accomplishments
- AudioEngine.ts: 13 Tone.Gain nodes connected to Destination; loadStem with graceful null fallback; start() gesture gate; updateMix() uses computeGainForEra + rampTo(target, 0.05); handleVisibility suspends/resumes rawContext; all Tone construction inside init()
- AudioProvider.tsx: pure behavioral React client component; dynamic AudioEngine import prevents SSR evaluation; eraStore.subscribe drives gain updates; engine.start() gated on isScrollEnabled
- page.tsx: AudioProvider mounted via dynamic(ssr:false) between Scene and DebugOverlay
- Build passes (--webpack flag); all 54 existing tests pass with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: AudioEngine singleton with Tone.js graph** - `845d57a` (feat)
2. **Task 2: AudioProvider component and page integration** - `d8c25c3` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/audio/AudioEngine.ts` - Tone.js singleton: 13 gain nodes, gesture gate, visibility handler, graceful stem fallback, rampTo mixing
- `src/components/audio/AudioProvider.tsx` - React bridge: dynamic import, eraStore subscription, engine lifecycle
- `src/app/page.tsx` - Added AudioProvider dynamic import and JSX mount
- `package.json` / `package-lock.json` - Added tone dependency

## Decisions Made
- **AudioContext suspend via rawContext cast:** Tone.js BaseContext only exposes `resume()`, not `suspend()`. Used `Tone.getContext().rawContext as AudioContext` to access the native `suspend()` method for tab-hide handling (AUDO-05).
- **eraStore.subscribe not useFrame:** Audio mixing updates only when scroll state changes (not every animation frame) — reduces unnecessary rampTo calls and keeps audio layer decoupled from render loop.
- **Double SSR isolation:** AudioProvider is already mounted via `dynamic({ ssr: false })` in page.tsx. The additional `import('@/audio/AudioEngine')` dynamic import inside useEffect is belt-and-suspenders — Tone.js never touches `window.AudioContext` during server rendering.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Tone.js BaseContext suspend() TypeScript error**
- **Found during:** Task 1 (AudioEngine singleton)
- **Issue:** `Tone.getContext().suspend()` doesn't exist on `BaseContext` (only `resume()` is abstract there); `rawContext.suspend()` also failed as `AnyAudioContext` includes `OfflineAudioContext` which has no `suspend()`
- **Fix:** Cast `Tone.getContext().rawContext as AudioContext` for suspend/resume — both methods exist on live `AudioContext`
- **Files modified:** src/audio/AudioEngine.ts
- **Verification:** `tsc --noEmit --skipLibCheck` passes cleanly
- **Committed in:** 845d57a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — type-level bug from Tone.js API mismatch)
**Impact on plan:** Fix necessary for correct TypeScript compilation. No scope creep.

## Issues Encountered
- `npm run build` without flags fails due to pre-existing Turbopack/webpack config conflict — used `npm run build -- --webpack` as the verified build path (this is a pre-existing project config issue, not introduced by this plan)

## User Setup Required
None — audio stems not required at this stage. AUDO-06 graceful fallback handles missing /audio/era-XX.mp3 files with a console.warn and silent era.

## Next Phase Readiness
- Full audio pipeline wired: scroll state -> AudioProvider -> AudioEngine.updateMix -> computeGainForEra -> Tone.Gain.rampTo
- Ready for audio stem delivery — drop MP3 files into /public/audio/ with naming era-00.mp3 through era-12.mp3
- Phase 4 (era content) can proceed independently — AudioProvider is mounted and will automatically react to eraStore changes

---
*Phase: 03-audio-engine*
*Completed: 2026-03-10*

## Self-Check: PASSED

- src/audio/AudioEngine.ts: FOUND
- src/components/audio/AudioProvider.tsx: FOUND
- .planning/phases/03-audio-engine/03-02-SUMMARY.md: FOUND
- Commit 845d57a (Task 1): FOUND
- Commit d8c25c3 (Task 2): FOUND
