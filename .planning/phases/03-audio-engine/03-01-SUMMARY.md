---
phase: 03-audio-engine
plan: 01
subsystem: audio
tags: [vitest, typescript, audio, crossfade, pure-functions, tdd]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: ERA_CONFIG (13 era definitions with IDs 0-12 used for zone mapping)
provides:
  - computeGainForEra pure function for scroll-reactive audio gain computation
  - AudioZoneConfig interface (eraIndex, stemUrl, overlapWidth)
  - AUDIO_ZONES array with 13 era configurations and scaffold stem URLs
affects:
  - 03-audio-engine plan 02 (AudioEngine that consumes computeGainForEra and AUDIO_ZONES)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure-function audio math layer separate from browser/Web Audio API
    - TDD-first approach for all gain computation logic
    - Scaffold-default approach for per-era tuning values (mirrors ERA_CONFIG weights pattern)

key-files:
  created:
    - src/audio/audioMath.ts
    - src/audio/audioMath.test.ts
    - src/audio/audioZones.ts
  modified: []

key-decisions:
  - "computeGainForEra returns TARGET gain only — AudioEngine (Plan 02) applies via rampTo(target, 0.05), never direct .value assignment"
  - "overlapWidth=0 short-circuits to immediate switch (avoids division by zero)"
  - "AUDIO_ZONES overlapWidth=0.1 scaffold defaults for authorial tuning — same deferred-tuning pattern as ERA_CONFIG weights"

patterns-established:
  - "Audio math: pure functions with no browser deps, fully testable in node/vitest environment"
  - "Gain contract: computeGainForEra returns target, AudioEngine animates via rampTo — separation of computation from application"

requirements-completed: [AUDO-02, AUDO-03, AUDO-04]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 3 Plan 01: Audio Math and Zone Configuration Summary

**Pure-function crossfade gain computation (computeGainForEra) with 13-zone AudioZoneConfig scaffold, fully tested via TDD in node/vitest with no browser dependencies**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T19:06:47Z
- **Completed:** 2026-03-10T19:08:29Z
- **Tasks:** 2 (Task 1 via TDD: 3 commits; Task 2: 1 commit)
- **Files created:** 3

## Accomplishments

- Implemented computeGainForEra with active era fade-in, previous era fade-out, non-adjacent silence, and clamped [0,1] output
- 17 unit tests covering all gain scenarios: active era, previous era, non-adjacent, overlap boundaries, zero-overlap edge case, clamping
- Created AUDIO_ZONES with all 13 era configurations (eraIndex 0-12, stem URLs, overlap widths)

## Task Commits

Each task was committed atomically:

1. **TDD RED — failing tests for computeGainForEra** - `9d206da` (test)
2. **TDD GREEN — implement computeGainForEra** - `81ca8ed` (feat)
3. **Task 2: AUDIO_ZONES 13-era configuration** - `b4bac33` (feat)

_Note: TDD task split into RED (test) and GREEN (implementation) commits per TDD protocol._

## Files Created/Modified

- `src/audio/audioMath.ts` — AudioZoneConfig interface and computeGainForEra pure function with JSDoc contract
- `src/audio/audioMath.test.ts` — 17 unit tests covering all gain computation behaviors and edge cases
- `src/audio/audioZones.ts` — AUDIO_ZONES array with 13 AudioZoneConfig entries (eraIndex 0-12, scaffold stem URLs and overlap widths)

## Decisions Made

- **computeGainForEra returns TARGET gain only.** The AudioEngine (Plan 02) applies it via `gain.gain.rampTo(target, 0.05)` — never via direct `.value` assignment. This separation is documented as a JSDoc contract on the function, ensuring the audio math layer stays pure and the smoothing behavior is encapsulated in the engine layer.
- **overlapWidth=0 short-circuits before dividing.** When overlapWidth is 0, the function immediately returns 1.0 for active era and 0.0 for all others, avoiding a division-by-zero that would produce NaN and propagate into the audio system.
- **AUDIO_ZONES uses uniform 0.1 scaffold defaults.** Per-era authorial tuning is intentionally deferred, mirroring the ERA_CONFIG weight scaffold pattern. The JSDoc notes this explicitly so future tuning has clear guidance.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 02 (AudioEngine) can now import `computeGainForEra` and `AudioZoneConfig` from `@/audio/audioMath`
- `AUDIO_ZONES` ready for AudioEngine to load and manage Tone.js players per zone
- Stem audio files (`/audio/era-00.mp3` through `/audio/era-12.mp3`) do not yet exist — Plan 02 must implement graceful fallback (AUDO-06)

---
*Phase: 03-audio-engine*
*Completed: 2026-03-10*
