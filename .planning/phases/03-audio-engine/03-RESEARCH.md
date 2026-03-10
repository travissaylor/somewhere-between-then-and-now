# Phase 3: Audio Engine - Research

**Researched:** 2026-03-10
**Domain:** Web Audio API / Tone.js scroll-reactive audio engine
**Confidence:** HIGH

## Summary

Phase 3 builds the audio backbone of the experience: 13 looping audio stems (one per era), crossfaded in real time as the user scrolls, with no click artifacts, no autoplay policy violations, graceful handling of missing stems, and tab-visibility-based pause/resume. The entire system is driven by the `eraProgress` and `currentEra` values already published by the existing Zustand `eraStore` from Phase 1.

The correct library is **Tone.js** (version 15.x, current stable). Tone.js wraps the Web Audio API with schedulable Signals, CrossFade nodes, and a standardized AudioContext — exactly what the requirements describe. The key constraint is that `AudioContext` must not be created at module load time in a Next.js SSR environment; all Tone.js initialization must happen inside `useEffect` in a `"use client"` component, triggered lazily by the first user scroll gesture.

The dominant architecture is: one `Tone.Player` (loop: true) per era, all routed through a chain of 12 `Tone.CrossFade` nodes (adjacent pairs) to a single `Tone.Destination`. The `crossFade.fade` Signal is driven directly from `eraProgress` via the vanilla Zustand store subscriber. Gain transitions use `signal.rampTo(target, 0.05)` (5 ms ramp) rather than direct `.value` assignment to prevent click artifacts per AUDO-03.

**Primary recommendation:** Use Tone.js 15.x with one Player per era, pairwise CrossFade chain, driven by eraStore subscriber (not useFrame), initialized inside useEffect with `"use client"` boundary, and Tone.start() called once on the first scroll event that already fires from the existing Lenis/GSAP ScrollTrigger scroll engine.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUDO-01 | User gesture gate resumes AudioContext on first scroll/interaction (browser autoplay compliance) | Tone.start() called from scroll handler; AudioContext stays suspended until then |
| AUDO-02 | Tone.js audio graph with CrossFade nodes driven by eraProgress for scroll-reactive mixing | CrossFade.fade Signal set from eraStore subscriber; pairwise CrossFade chain architecture |
| AUDO-03 | Gain scheduled via linearRampToValueAtTime (not direct .value assignment) to prevent click artifacts | Signal.rampTo(value, 0.05) uses linearRampToValueAtTime internally; never assign .value directly during scroll |
| AUDO-04 | 13 audio zones with crossfade overlap regions between adjacent eras | Overlap region = when eraProgress in [0, overlapWidth] of next era, CrossFade.fade drives 0→1 blend |
| AUDO-05 | Audio suspends on tab visibility change and resumes on return | document visibilitychange: hidden → Tone.context.suspend(), visible → Tone.context.resume() |
| AUDO-06 | Graceful fallback for missing audio stems (experience works without audio if stems unavailable) | try/catch on player.load(); null-safe audio graph with per-player error flag |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tone | ^15.0.4 | Web Audio framework: Players, CrossFade, Signals, AudioContext | Project requirement (AUDO-02 names Tone.js explicitly); wraps Web Audio API with schedulable Signals that prevent click artifacts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand (already installed) | ^5.0.11 | eraStore subscription to drive CrossFade.fade from scroll state | Already present from Phase 1; vanilla store subscriber avoids React render cycle overhead |
| vitest (already installed) | ^4.0.18 | Unit tests for audio math (overlap zone computation, fallback logic) | Already configured; test environment is "node" — audio graph tests must mock Tone.js |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tone.CrossFade | Tone.Gain pair with manual math | CrossFade provides equal-power curve (no volume dip at midpoint); Gain pair is linear and sounds quieter at 0.5 |
| Tone.Player | Howler.js | Tone.js integrates Signals and scheduling natively; Howler.js has no crossfade Signal API |
| eraStore subscriber | useFrame hook | Subscriber fires only on actual store changes; useFrame fires every frame even when no scroll — wasteful for audio scheduling |

**Installation:**
```bash
npm install tone
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── audio/
│   ├── AudioEngine.ts        # singleton: Players, CrossFades, graph wiring
│   ├── audioZones.ts         # 13 zone configs (stemUrl, overlapWidth)
│   ├── audioMath.ts          # computeCrossfadeFade(eraProgress, overlapWidth)
│   └── audioMath.test.ts     # unit tests for fade computation
├── components/
│   └── audio/
│       └── AudioProvider.tsx # "use client", useEffect init, Tone.start gate
```

### Pattern 1: Lazy Initialization — AudioContext Gate (AUDO-01)

**What:** Tone.js creates `AudioContext` at import time in browser builds. But the context starts in `"suspended"` state. Call `Tone.start()` exactly once from the first scroll event to transition to `"running"`.

**When to use:** Required on every page load. AudioContext will block audio silently if not resumed.

**Integration with existing scroll engine:** The Lenis/GSAP ScrollTrigger `onUpdate` callback already fires on first scroll. Add a one-shot `Tone.start()` call there — no new event listener required.

**Example:**
```typescript
// Source: https://github.com/Tonejs/Tone.js/wiki/Autoplay
// AudioProvider.tsx — "use client"
import * as Tone from 'tone';
import { useEffect, useRef } from 'react';
import { eraStore } from '@/store/eraStore';

export function AudioProvider() {
  const started = useRef(false);

  useEffect(() => {
    // Subscribe to eraStore — fires when scroll state changes
    const unsub = eraStore.subscribe(async (state) => {
      if (!started.current && state.isScrollEnabled) {
        await Tone.start(); // resumes suspended AudioContext
        started.current = true;
      }
      // ... drive CrossFade.fade here
    });
    return () => unsub();
  }, []);

  return null; // renders nothing — purely audio
}
```

**CRITICAL:** Never instantiate Tone.js objects at module scope. All `new Tone.Player()` calls must be inside `useEffect`. Tone.js accesses `window.AudioContext` on construction; this crashes Next.js SSR.

---

### Pattern 2: CrossFade Chain Architecture (AUDO-02 + AUDO-04)

**What:** 13 `Tone.Player` instances (one per era, `loop: true`) connected through 12 pairwise `Tone.CrossFade` nodes. Each CrossFade blends era N and era N+1. The chain's final output routes to `Tone.getDestination()`.

**Crossfade topology:**
```
Player[0] ──╮
             CrossFade[0] ──╮
Player[1] ──╯               │
Player[1] ──╮               │ (same Player reused as input to both CrossFades)
             CrossFade[1] ──┤
Player[2] ──╯               │
...                         │
Player[12] ─────────────────╯─── Destination
```

**Wait — correct topology:** Each era's Player feeds into exactly two CrossFades (as `b` of the previous pair and `a` of the next pair), except the first and last eras:

```
Player[0].connect(crossFades[0].a)
Player[1].connect(crossFades[0].b)
Player[1].connect(crossFades[1].a)
Player[2].connect(crossFades[1].b)
...
crossFades[0].connect(masterGain) -- NOT correct for chain

// Correct: only the active crossfade should output. Use Gain routing:
// All CrossFades output to a single masterGain; CrossFade.fade controls
// the mix. When currentEra = N, CrossFades[N-1] and CrossFades[N] are
// relevant. Others can have fade pinned to 0 or 1 (silent side).
```

**Simplified alternative — pairwise Gain nodes (RECOMMENDED for 13 eras):**

For 13 independent zones, using individual `Tone.Gain` nodes per player is simpler and more controllable than a chain of CrossFades. Use `CrossFade` for the transition between the active era and the next — or use Gain nodes with linear ramp to avoid the equal-power complexity:

```typescript
// Source: Tone.js docs — Gain + rampTo pattern
// One gain node per player; only two are ever non-zero simultaneously
const players: (Tone.Player | null)[] = new Array(13).fill(null);
const gains: Tone.Gain[] = Array.from({ length: 13 }, () => new Tone.Gain(0));

// Wire: Player[i] → Gain[i] → Destination
gains.forEach(g => g.toDestination());

// On era change + eraProgress update:
function updateAudioMix(currentEra: number, eraProgress: number, overlapWidth: number) {
  const t = Tone.now();
  gains.forEach((g, i) => {
    let target = 0;
    if (i === currentEra) {
      // fade in over overlap region at start of era
      target = eraProgress < overlapWidth
        ? eraProgress / overlapWidth  // 0→1 over overlap
        : 1;
    }
    if (i === currentEra - 1) {
      // fade out: previous era fades out as current era fades in
      target = eraProgress < overlapWidth
        ? 1 - (eraProgress / overlapWidth)
        : 0;
    }
    g.gain.rampTo(target, 0.05); // 50ms ramp prevents click artifacts (AUDO-03)
  });
}
```

**Why Gain + rampTo over CrossFade chain:** 13-era CrossFade chains are hard to wire without double-connecting nodes. Individual Gain nodes per player are simpler, easier to debug, and handle the "non-adjacent era" case (silence all non-active) cleanly.

---

### Pattern 3: Scheduled Gain via rampTo (AUDO-03)

**What:** NEVER assign `gain.gain.value = x` directly during scroll. This creates a sample-rate discontinuity — the audio engine hears an instantaneous jump, which manifests as a click or pop.

**Always use:**
```typescript
// Source: https://github.com/Tonejs/Tone.js/wiki/Signals
gain.gain.rampTo(targetValue, 0.05); // 50ms linear ramp
// rampTo calls linearRampToValueAtTime internally
```

**Why 50ms:** Short enough to feel instantaneous to the listener, long enough to prevent a sample-rate step function.

---

### Pattern 4: Tab Visibility Pause/Resume (AUDO-05)

```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) {
      Tone.getContext().suspend();
    } else {
      // On return, resume only if we had previously started
      if (started.current) {
        Tone.getContext().resume();
      }
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);
```

**Note:** Browsers may automatically suspend the AudioContext when a tab is hidden (state: `"interrupted"`). Always call `.resume()` on return regardless of which path caused suspension.

---

### Pattern 5: Graceful Fallback for Missing Stems (AUDO-06)

```typescript
// Per-player: wrap load in try/catch; null-guard before playback
async function loadPlayer(url: string, gain: Tone.Gain): Promise<Tone.Player | null> {
  try {
    const player = new Tone.Player({ url, loop: true });
    await player.load(url);
    player.connect(gain);
    player.start();
    return player;
  } catch (err) {
    console.warn(`Audio stem not available: ${url}`, err);
    return null; // gain stays at 0; silence is the fallback
  }
}
```

**Critical:** Tone.Player's `load()` returns a Promise that rejects on HTTP 404 or network error. Wrapping in try/catch at the player level means a missing stem silences that era without affecting others or throwing unhandled promise rejections.

---

### Pattern 6: SSR Safety in Next.js (Cross-cutting)

```typescript
// AudioProvider.tsx
"use client";  // REQUIRED — prevents SSR execution of Tone.js

import * as Tone from 'tone';
// All new Tone.* inside useEffect(() => { ... }, [])
```

**Why:** Next.js 16 with App Router renders Server Components on the server. Tone.js calls `new AudioContext()` at module scope (or at first import). In a Server Component, `window` is undefined — this crashes the build. The `"use client"` directive ensures the module only runs in the browser.

---

### Anti-Patterns to Avoid

- **Direct value assignment during scroll:** `gain.gain.value = x` — causes click artifacts. Use `rampTo`.
- **Instantiating Tone.js at module scope:** Crashes SSR. Always in `useEffect`.
- **Creating AudioContext before user gesture:** Browser will keep it suspended; `Tone.start()` must be called from the first user scroll.
- **Unmounting/remounting AudioProvider:** Destroys the audio graph. Treat AudioProvider as a permanent singleton — never unmount it (mirrors the visibility-based scene management decision from Phase 2).
- **Using useFrame to drive audio:** Audio scheduling is not frame-rate dependent. A Zustand store subscriber is the correct driver; it fires only on actual state changes.
- **Playing all 13 players simultaneously without gain control:** All 13 loops run (this is correct — they are always looping), but only 1–2 are at non-zero gain at any time. Starting all players is intentional; it avoids the latency of starting a player mid-experience.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Equal-power crossfade curve | Custom `Math.cos` fade curve | `Tone.CrossFade` (if using pair approach) or `Tone.Gain.rampTo` | Tone.js CrossFade implements equal-power using stereoPanner internals; custom math risks volume dips |
| Audio click suppression | Manual zero-crossing detection | `gain.gain.rampTo(v, 0.05)` | `rampTo` uses `linearRampToValueAtTime` at the Web Audio scheduler level — sample-accurate, browser-native |
| AudioContext lifecycle | Custom AudioContext resume logic | `Tone.start()` + `Tone.getContext()` | Tone.js normalizes cross-browser differences (iOS Safari quirks, `"interrupted"` state) |
| Audio file format fallback | Custom format detection | `Tone.Player` url with `[mp3|ogg]` syntax | Tone.js handles format negotiation automatically |

**Key insight:** The Web Audio API is low-level and has many cross-browser edge cases (especially iOS Safari, which treats AudioContext suspension differently). Tone.js abstracts these; hand-rolling Web Audio API code reintroduces all the bugs Tone.js has already solved.

---

## Common Pitfalls

### Pitfall 1: AudioContext Created Before User Gesture
**What goes wrong:** Page loads, Tone.js initializes, AudioContext is in `"suspended"` state. The first scroll fires, `Tone.start()` is not called, audio never plays. Developer sees no error.
**Why it happens:** Tone.js creates the AudioContext at import in browser context. Chrome's autoplay policy keeps it suspended.
**How to avoid:** Gate `Tone.start()` on the first scroll event from the existing Lenis/ScrollTrigger `onUpdate` callback. Use a `useRef(false)` flag to call it only once.
**Warning signs:** `Tone.context.state === "suspended"` after scrolling; no audio, no errors in console.

### Pitfall 2: Direct gain.gain.value Assignment During Scroll
**What goes wrong:** Every scroll frame sets `gain.gain.value = newValue` directly. Audible clicks/pops on every scroll movement.
**Why it happens:** Direct value assignment creates a step function at the audio sample level — a discontinuity the ear hears as a click.
**How to avoid:** Always use `gain.gain.rampTo(newValue, 0.05)`. Set `rampTime` to 50ms minimum.
**Warning signs:** Clicking sounds during smooth scrolling; worse at boundaries.

### Pitfall 3: Tone.js Import in Server Component
**What goes wrong:** Build error: `window is not defined` or `AudioContext is not defined` during Next.js SSR.
**Why it happens:** Tone.js accesses browser globals at module evaluation time.
**How to avoid:** Mark the component file with `"use client"` at the top. Never import `tone` in a file used by Server Components.
**Warning signs:** Build-time crash, not runtime; stack trace points to `tone/build/...`.

### Pitfall 4: Missing Stem Silences Entire Experience
**What goes wrong:** One 404 on an audio stem URL causes an unhandled Promise rejection that breaks the whole audio engine.
**Why it happens:** `Tone.Player.load()` rejects on failure; if uncaught, it propagates.
**How to avoid:** Wrap every `player.load()` in `try/catch`. The catch block sets the player reference to `null` and leaves the Gain node at 0. AUDO-06 explicitly requires this.
**Warning signs:** Console error `Uncaught (in promise)` mentioning an audio URL.

### Pitfall 5: Starting Players After Visibility Return
**What goes wrong:** User switches tabs, returns; audio resumes but at the wrong playback position (looped out of sync).
**Why it happens:** Some Tone.js versions restart the Player on `.start()` call during resume.
**How to avoid:** Don't call `.start()` again on visibility return — only call `Tone.getContext().resume()`. Players remain in their looped state. The context resuming is sufficient.
**Warning signs:** Audio "jumps" or restarts from beginning when returning to tab.

### Pitfall 6: Double-Node Connection
**What goes wrong:** Player[1] connected to both CrossFade[0].b and CrossFade[1].a — Web Audio allows this but routing gets confusing; later disposal breaks both.
**Why it happens:** CrossFade chain topology naturally wants to share intermediate nodes.
**How to avoid:** Use the individual Gain node per Player architecture (Pattern 2 above). Each Player connects to exactly one Gain node.

---

## Code Examples

Verified patterns from official sources:

### AudioContext Gate (Tone.start on first scroll)
```typescript
// Source: https://github.com/Tonejs/Tone.js/wiki/Autoplay
import * as Tone from 'tone';

let audioStarted = false;

// Called from existing ScrollTrigger onUpdate
async function onFirstScroll() {
  if (!audioStarted) {
    await Tone.start();
    audioStarted = true;
    console.log('Tone.context.state:', Tone.context.state); // "running"
  }
}
```

### Gain-based era mixer
```typescript
// Source: Tone.js Gain docs + Signal docs
import * as Tone from 'tone';

const gains = Array.from({ length: 13 }, () => new Tone.Gain(0).toDestination());

// Called from eraStore subscriber
function setEraGain(eraIndex: number, gainValue: number) {
  gains[eraIndex].gain.rampTo(gainValue, 0.05); // 50ms — AUDO-03
}
```

### Crossfade overlap region math
```typescript
// audioMath.ts
export interface AudioZoneConfig {
  eraIndex: number;
  stemUrl: string;
  overlapWidth: number; // fraction of era at which crossfade starts, e.g. 0.1 = 10%
}

export function computeGainForEra(
  eraIndex: number,
  currentEra: number,
  eraProgress: number,
  overlapWidth: number
): number {
  if (eraIndex === currentEra) {
    // Fade in from 0 at era start
    if (eraProgress < overlapWidth) {
      return eraProgress / overlapWidth;
    }
    return 1;
  }
  if (eraIndex === currentEra - 1) {
    // Previous era: fade out as current era fades in
    if (eraProgress < overlapWidth) {
      return 1 - (eraProgress / overlapWidth);
    }
    return 0;
  }
  return 0;
}
```

### Tab visibility handler
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state
function setupVisibilityHandler(started: React.MutableRefObject<boolean>) {
  const handler = () => {
    if (document.hidden) {
      Tone.getContext().suspend();
    } else if (started.current) {
      Tone.getContext().resume();
    }
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}
```

### Graceful stem load with fallback
```typescript
// Source: Tone.js Player docs — Promise rejection on 404
async function loadStem(url: string, gain: Tone.Gain): Promise<Tone.Player | null> {
  const player = new Tone.Player({ loop: true });
  try {
    await player.load(url);
    player.connect(gain);
    player.start();
    return player;
  } catch {
    player.dispose();
    // gain stays at 0; silence is the graceful fallback (AUDO-06)
    return null;
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Tone.Transport` for timing | Direct Signal scheduling for scroll-reactive audio | Tone.js 14+ | Transport is for beat-synced music; scroll-driven audio uses real-time Signal ramping |
| `new AudioContext()` directly | `Tone.start()` + `Tone.getContext()` | Chrome autoplay policy 2018 | Tone.js abstracts browser differences in autoplay handling |
| Tone.js r13 API (`Tone.CrossFade`) | Tone.js 14/15 class API (`new Tone.CrossFade()`) | v14 (2020) | ES module imports, class-based API; r13 global Tone object is deprecated |
| `crossFade.fade.value = x` | `crossFade.fade.rampTo(x, 0.05)` | Always best practice | Prevents click artifacts that direct assignment causes |

**Deprecated/outdated:**
- Tone.js r13 global API (e.g., `Tone.CrossFade`, `Tone.Player` as globals): Replaced by ES module class imports. Do not use `import Tone from 'tone'`; use `import * as Tone from 'tone'` or named imports.

---

## Open Questions

1. **Audio stem file format and availability**
   - What we know: AUDO-06 requires graceful fallback if stems are missing; STATE.md notes "if not all 13 stems are ready, Phase 3 must use graceful fallback"
   - What's unclear: Whether any real .mp3/.ogg files exist in the project yet, or if all 13 will be placeholder silence initially
   - Recommendation: Implement the audio engine with proper fallback (AUDO-06) so Phase 3 can complete fully even with zero real stems; the engine works correctly when stems are added later

2. **Overlap width per era**
   - What we know: AUDO-04 requires overlap regions between all 13 adjacent eras; the authorial tuning of overlap widths is an aesthetic decision
   - What's unclear: Whether overlap widths should be uniform (e.g., 10% of each era) or per-era (The Breakup may want a longer fade-in, Being Born may want no fade-out)
   - Recommendation: Define `overlapWidth` as a per-era config property in `audioZones.ts` with a default of `0.1`; this mirrors how ERA_CONFIG uses per-era `weight` for authorial control

3. **Audio file placement**
   - What we know: Next.js serves static files from `/public/`
   - What's unclear: Whether audio stems should be in `/public/audio/` or fetched from an external CDN
   - Recommendation: Use `/public/audio/era-{00..12}.mp3` as the default path pattern; the AudioZoneConfig can override per era for future CDN support

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDO-01 | AudioContext gate: no audio before scroll, starts after | manual-only | — | — |
| AUDO-02 | CrossFade/Gain driven by eraProgress | unit | `npm run test -- src/audio/audioMath.test.ts` | ❌ Wave 0 |
| AUDO-03 | rampTo used, not .value direct assignment | unit | `npm run test -- src/audio/audioMath.test.ts` | ❌ Wave 0 |
| AUDO-04 | 13 zones with overlap regions computed correctly | unit | `npm run test -- src/audio/audioMath.test.ts` | ❌ Wave 0 |
| AUDO-05 | Visibility change suspends/resumes context | manual-only | — | — |
| AUDO-06 | Missing stem: engine continues without error | unit | `npm run test -- src/audio/audioMath.test.ts` | ❌ Wave 0 |

**Note on manual-only:** AUDO-01 and AUDO-05 require a live browser environment to verify AudioContext state transitions. The agent-browser skill (from CLAUDE.md) should be used for UAT verification. Vitest runs in `environment: 'node'` — Web Audio API is not available there.

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green + agent-browser UAT for AUDO-01 and AUDO-05 before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/audio/audioMath.test.ts` — covers AUDO-02 (gain computation), AUDO-03 (rampTo logic is in the pure math layer), AUDO-04 (overlap zone computation), AUDO-06 (null-safe fallback logic)
- [ ] `src/audio/audioMath.ts` — pure functions, no Tone.js import, fully unit-testable in node environment
- [ ] `src/audio/AudioEngine.ts` — Tone.js graph, not unit-testable in node env; verified via agent-browser UAT
- [ ] `src/audio/audioZones.ts` — era zone config data; no framework install needed

---

## Sources

### Primary (HIGH confidence)
- [Tone.js Autoplay wiki](https://github.com/Tonejs/Tone.js/wiki/Autoplay) — Tone.start() pattern, AudioContext gate
- [Tone.js CrossFade docs v14.7.58](https://tonejs.github.io/docs/14.7.58/CrossFade) — CrossFade API, fade Signal, a/b inputs
- [Tone.js Signals wiki](https://github.com/Tonejs/Tone.js/wiki/Signals) — rampTo, linearRampToValueAtTime, setRampPoint
- [MDN BaseAudioContext.state](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state) — state values, interrupted vs suspended, visibilitychange pattern
- [Tone.js Player docs v15.0.4](https://tonejs.github.io/docs/15.0.4/classes/Player.html) — Player properties, load() Promise

### Secondary (MEDIUM confidence)
- [Tone.js Using with React wiki](https://github.com/Tonejs/Tone.js/wiki/Using-Tone.js-with-React-React-Typescript-or-Vue) — useRef/useEffect initialization, TypeScript types pattern
- [tone npm package](https://www.npmjs.com/package/tone) — version 15.x confirmed as current stable

### Tertiary (LOW confidence)
- Community pattern: 50ms ramp time for click-free gain transitions — widely cited in Web Audio API tutorials; not a specific official recommendation but consistent with Web Audio scheduling best practices

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Tone.js is named explicitly in AUDO-02; version 15.x confirmed via npm
- Architecture: HIGH — CrossFade and Gain APIs verified in Tone.js official docs; patterns verified against Web Audio API MDN docs
- Pitfalls: HIGH — autoplay policy and SSR issues verified via official Tone.js wiki; click artifact prevention verified via Signal docs; visibilitychange pattern verified via MDN

**Research date:** 2026-03-10
**Valid until:** 2026-09-10 (Tone.js is stable; Web Audio API autoplay policy changes slowly)
