# Phase 1: Foundation - Research

**Researched:** 2026-03-10
**Domain:** Next.js 16 / React Three Fiber / GSAP ScrollTrigger / Lenis / Zustand scroll-to-progress engine
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scroll Authority**
- GSAP ScrollTrigger is the sole scroll authority — never use Drei ScrollControls (confirmed conflict from research: PITFALLS.md)
- Lenis provides smooth scroll inertia, synced with GSAP ScrollTrigger via documented integration pattern
- Scroll container is a tall HTML div; R3F canvas is fixed-position overlay consuming scroll state from the store

**Era Progress Model**
- Three normalized values: `globalProgress` (0–1 across entire piece), `currentEra` (0–12 integer), and `eraProgress` (0–1 within current era)
- All downstream systems read from Zustand store, never from raw scroll position
- Use `useStore.getState()` (getter) inside `useFrame`, never the React hook — prevents reconciler fighting the render loop (from research: PITFALLS.md)

**Scroll Weight / Emotional Pacing**
- Each era has a configurable scroll weight in a central config object
- The 5 major transitions (Parents' Divorce, Going to College, College to First Apartment, The Breakup, Moving to Pittsburgh) get 2–3x the scroll distance of connective-tissue eras
- Era 09 (The Breakup) and Era 01 (Being Born) should feel slow — give them extended scroll distance
- Era 11 (Year of Chaos) should feel fast — compressed scroll distance
- Exact weights are authorial decisions to be tuned later — scaffold must support arbitrary per-era weights

**SSR Safety**
- R3F canvas rendered via Next.js `dynamic()` with `ssr: false` — no server-side rendering of WebGL
- All Three.js and R3F imports isolated behind `'use client'` boundary
- App Router used (not Pages Router)

**Layout**
- Fixed-position full-viewport R3F canvas behind a scrollable HTML container
- Desktop-first design; tablet viewport adjusts canvas and camera FOV
- No mobile phone layout — phone redirect handled in Phase 10
- Debug overlay in development showing globalProgress, currentEra, eraProgress values

**Framework Decisions**
- Next.js 16 (App Router) — verify current stable version at setup
- React Three Fiber v9.5+ — bundles own reconciler, React 19 compatible
- Three.js pinned to R3F peer dep range
- GSAP 3.14+ with ScrollTrigger (all plugins free)
- Lenis 1.3+ for smooth scroll
- Zustand for state management (era store)
- TypeScript throughout

### Claude's Discretion
- Exact project structure and file organization
- Zustand store API shape beyond the three core values
- Debug overlay implementation approach
- Lenis configuration parameters (lerp, duration, etc.)
- GSAP ScrollTrigger scrub value tuning
- Whether to use GSAP's `onUpdate` or Lenis's scroll event for feeding the store

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Next.js app bootstrapped with React Three Fiber canvas that renders without SSR errors | Next.js 16 stable confirmed; `dynamic()` + `ssr: false` pattern verified; `'use client'` boundary isolation confirmed |
| FOUND-02 | Lenis smooth scroll integrated with GSAP ScrollTrigger as sole scroll authority | Lenis 1.3.18 confirmed; `autoRaf: false` + GSAP ticker drive pattern documented; ReactLenis wrapper with `ref` access confirmed |
| FOUND-03 | Scroll-to-progress engine produces normalized globalProgress (0–1), currentEra (0–12), and eraProgress (0–1) values | GSAP ScrollTrigger `onUpdate: self => self.progress` pattern confirmed; per-era weight accumulation math documented below |
| FOUND-04 | Zustand era store distributes scroll state to all consuming systems | Zustand v5.0.11 confirmed; `createStore` (vanilla) + `useStore` hook pattern documented; `getState()` for useFrame confirmed |
| FOUND-05 | Per-era scroll weight config allows different eras to occupy different scroll distances (major transitions get 2–3x) | Config object pattern with normalized weight accumulation math documented; tall scroll div height calculation included |
| FOUND-06 | Desktop and tablet responsive layout with fixed-position R3F canvas | CSS pattern confirmed; viewport breakpoint approach for tablet camera FOV documented |
</phase_requirements>

---

## Summary

This phase establishes the foundational scroll-to-progress infrastructure that all subsequent phases depend on. The architecture centers on a single tall scrollable HTML div whose scroll position is intercepted by Lenis (for smooth inertia), passed through GSAP ScrollTrigger (as sole scroll authority), converted to three normalized progress values, and stored in a Zustand vanilla store accessible to both React components and the R3F render loop.

The key architectural insight is the decoupling of scroll mechanics from all consumers. The scroll engine is the only system that reads raw scroll position; everything else reads from the Zustand store. This separation means future phases can add audio, 3D scenes, post-processing, and transitions without touching scroll logic.

All version choices are verified as of March 2026: Next.js 16.1 (stable, released October 2025), R3F v9.5.0, GSAP 3.14.2 (all plugins free since Webflow acquisition), Lenis 1.3.18, Zustand 5.0.11.

**Primary recommendation:** Build the scroll engine as a standalone `'use client'` module that owns the GSAP/Lenis integration and writes to a vanilla Zustand store. The R3F canvas is dynamically imported with `ssr: false` and reads progress exclusively via `store.getState()` inside `useFrame`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1 | App framework, SSR safety, routing | Stable since Oct 2025; App Router; Turbopack default; React 19.2 |
| react / react-dom | 19.2 | UI runtime | Required by Next.js 16; R3F v9 targets React 19 |
| @react-three/fiber | 9.5.0 | R3F renderer | R3F v9 — React 19 compatible, bundles own reconciler |
| three | >=0.140.0 (pinned to R3F peer range) | 3D engine | R3F peer dep; pin to R3F's declared range |
| gsap | 3.14.2 | ScrollTrigger, scroll authority | All plugins free; `onUpdate` provides normalized progress 0–1 |
| lenis | 1.3.18 | Smooth scroll inertia | `autoRaf: false` + GSAP ticker drive = single RAF loop |
| zustand | 5.0.11 | Era state store | Vanilla store pattern; `getState()` safe in useFrame |
| typescript | 5.x | Type safety | Required by Next.js 16 minimum |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-three/drei | latest compatible | R3F helpers | Phase 1: only if needed for basic canvas setup; avoid ScrollControls |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GSAP ScrollTrigger | Drei ScrollControls | ScrollControls conflicts with Lenis + global scroll — explicitly rejected |
| Lenis | GSAP ScrollSmoother | ScrollSmoother is now free but Lenis is lighter; decision locked |
| Zustand vanilla store | React context / useRef | Context causes re-renders on every scroll tick; refs not accessible to non-React code |

**Installation:**
```bash
npx create-next-app@latest somewhere-between-then-and-now --typescript --app --no-tailwind
cd somewhere-between-then-and-now
npm install three @react-three/fiber gsap lenis zustand
npm install @types/three
```

> Verify Three.js version after R3F install: `npm ls three` — pin if R3F selected a version, e.g. `npm install three@0.175.0`

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx          # RootLayout — wraps with LenisProvider, mounts ScrollEngine
│   ├── page.tsx            # Single page — scroll container + dynamic canvas import
│   └── globals.css         # Reset; html/body height: 100%; overflow-x: hidden
├── components/
│   ├── canvas/
│   │   └── Scene.tsx       # 'use client'; R3F Canvas component (dynamic import target)
│   ├── scroll/
│   │   └── ScrollEngine.tsx # 'use client'; Lenis + GSAP ScrollTrigger integration, writes to store
│   └── debug/
│       └── DebugOverlay.tsx # DEV-only overlay showing globalProgress, currentEra, eraProgress
├── store/
│   └── eraStore.ts         # Zustand vanilla store (createStore); eraProgress model
├── config/
│   └── eras.ts             # Era definitions and scroll weight config
└── lib/
    └── scrollMath.ts       # Pure functions: weight accumulation, progress decomposition
```

### Pattern 1: Scroll Container + Fixed Canvas Layout

**What:** A tall scrollable div generates native scroll events. The R3F canvas is CSS `position: fixed` and covers the viewport. This lets the browser handle scroll physics while WebGL renders independently.

**When to use:** Always — this is the only layout that avoids both `pointer-events` conflicts and the Drei ScrollControls/Lenis conflict.

```tsx
// src/app/page.tsx
// Source: validated pattern from R3F community discussions
'use client';
import dynamic from 'next/dynamic';

const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false });

export default function Home() {
  return (
    <>
      {/* Tall scroll container — height = total scroll distance */}
      <div style={{ height: 'var(--total-scroll-height)', position: 'relative' }}>
        {/* HTML content layers go here (Phase 10+) */}
      </div>

      {/* Fixed canvas — does not scroll, reads from Zustand store */}
      <Scene />
    </>
  );
}
```

```tsx
// src/components/canvas/Scene.tsx
'use client';
import { Canvas } from '@react-three/fiber';

export default function Scene() {
  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        pointerEvents: 'none', // let scroll events pass through to HTML
      }}
    >
      {/* 3D content added in later phases */}
    </Canvas>
  );
}
```

### Pattern 2: Lenis + GSAP ScrollTrigger Integration (Single RAF Loop)

**What:** Lenis drives smooth scroll inertia. GSAP's ticker drives Lenis's RAF — one loop, no desync. `autoRaf: false` on Lenis is mandatory when using the GSAP ticker pattern.

**When to use:** Always — this is the canonical integration. Two separate RAFs cause scroll position desync.

```tsx
// src/components/scroll/ScrollEngine.tsx
// Source: GSAP community forum + Lenis official docs (verified pattern)
'use client';
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEraStore } from '@/store/eraStore';
import { computeEraProgress } from '@/lib/scrollMath';

gsap.registerPlugin(ScrollTrigger);

export function ScrollEngine() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: false,       // CRITICAL: GSAP ticker owns the RAF loop
      lerp: 0.08,           // Claude's discretion — tunable
      duration: 1.2,        // Claude's discretion — tunable
    });
    lenisRef.current = lenis;

    // Lenis scroll events update ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // GSAP ticker drives Lenis — single unified RAF loop
    function update(time: number) {
      lenis.raf(time * 1000); // GSAP time is seconds; Lenis expects ms
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // Global ScrollTrigger to produce normalized 0–1 progress
    ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        // self.progress is 0–1 across entire scroll height
        const { currentEra, eraProgress } = computeEraProgress(self.progress);
        useEraStore.setState({
          globalProgress: self.progress,
          currentEra,
          eraProgress,
        });
      },
    });

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return null; // purely behavioral
}
```

### Pattern 3: Zustand Vanilla Store (Safe for useFrame)

**What:** A vanilla store (`createStore`) is created outside React. React components access it via `useStore`. The R3F render loop accesses it via `store.getState()` — no React reconciler involvement.

**When to use:** Always when state must be read inside `useFrame`. The React hook variant (`useStore`) causes the reconciler to fight the render loop.

```ts
// src/store/eraStore.ts
// Source: Zustand docs + verified in pmndrs/zustand discussions
import { createStore, useStore } from 'zustand';

interface EraState {
  globalProgress: number;   // 0–1 across entire scroll
  currentEra: number;       // 0–12 integer
  eraProgress: number;      // 0–1 within current era
}

// Vanilla store — accessible outside React (e.g., useFrame, GSAP callbacks)
export const eraStore = createStore<EraState>(() => ({
  globalProgress: 0,
  currentEra: 0,
  eraProgress: 0,
}));

// React hook for components that need reactive updates
export const useEraStore = <T>(selector: (state: EraState) => T) =>
  useStore(eraStore, selector);
```

```tsx
// In any R3F component using useFrame
import { useFrame } from '@react-three/fiber';
import { eraStore } from '@/store/eraStore';

function EraVisual() {
  useFrame(() => {
    // getState() — never triggers reconciler, always fresh
    const { globalProgress, currentEra, eraProgress } = eraStore.getState();
    // Use values directly to drive Three.js objects
  });
  return null;
}
```

### Pattern 4: Per-Era Scroll Weight Config and Progress Math

**What:** Each era has a `weight` property (default 1.0). The scroll engine accumulates total weight, then maps raw scroll progress to era-aware progress values.

**When to use:** Core to FOUND-03 and FOUND-05. The math must be pure and testable.

```ts
// src/config/eras.ts
export interface EraConfig {
  id: number;           // 0-indexed (0–12)
  name: string;
  weight: number;       // relative scroll distance (1.0 = baseline)
}

export const ERA_CONFIG: EraConfig[] = [
  { id: 0,  name: 'Being Born',              weight: 2.0 }, // slow — pre-language
  { id: 1,  name: 'Early Childhood',          weight: 1.0 },
  { id: 2,  name: 'The Abuse Era',            weight: 1.5 },
  { id: 3,  name: 'The Divorce',              weight: 2.5 }, // major transition
  { id: 4,  name: 'Teenage Years & Sports',   weight: 1.0 },
  { id: 5,  name: 'College',                  weight: 1.5 },
  { id: 6,  name: 'The Identity Years',       weight: 1.0 },
  { id: 7,  name: 'The Seven Years',          weight: 2.0 },
  { id: 8,  name: 'The Breakup',              weight: 3.0 }, // slow — rupture
  { id: 9,  name: 'Pittsburgh & The House',   weight: 2.5 }, // major transition
  { id: 10, name: 'The Year of Chaos',        weight: 0.5 }, // fast — compressed
  { id: 11, name: 'Finding Her',              weight: 1.5 },
  { id: 12, name: 'Somewhere Between',        weight: 2.0 }, // linger at end
];
// NOTE: These initial weights are scaffold values. Authorial tuning is a deferred decision.
```

```ts
// src/lib/scrollMath.ts
import { ERA_CONFIG } from '@/config/eras';

// Pre-compute cumulative weight boundaries (run once at module load)
const totalWeight = ERA_CONFIG.reduce((sum, era) => sum + era.weight, 0);

const eraBoundaries = ERA_CONFIG.reduce<{ start: number; end: number }[]>(
  (acc, era, idx) => {
    const start = idx === 0 ? 0 : acc[idx - 1].end;
    const end = start + era.weight / totalWeight;
    acc.push({ start, end });
    return acc;
  },
  []
);

export function computeEraProgress(globalProgress: number): {
  currentEra: number;
  eraProgress: number;
} {
  // Clamp to [0, 1]
  const p = Math.max(0, Math.min(1, globalProgress));

  // Find which era we're in
  let currentEra = ERA_CONFIG.length - 1;
  for (let i = 0; i < eraBoundaries.length; i++) {
    if (p <= eraBoundaries[i].end) {
      currentEra = i;
      break;
    }
  }

  const { start, end } = eraBoundaries[currentEra];
  const eraProgress = end > start ? (p - start) / (end - start) : 0;

  return { currentEra, eraProgress: Math.max(0, Math.min(1, eraProgress)) };
}

// Total scroll height in vh units — call to set CSS custom property
export function computeScrollHeight(baseVh = 500): number {
  return baseVh * (totalWeight / ERA_CONFIG.length);
  // Default: 500vh * (totalWeight/13) ensures consistent baseline density
}
```

### Pattern 5: Dynamic Import for SSR Safety

**What:** Next.js `dynamic()` with `ssr: false` prevents R3F/Three.js from executing on the server (which has no WebGL context and no `window`).

**When to use:** Always for the root Canvas component. Isolate all Three.js imports behind this boundary.

```tsx
// src/app/page.tsx
import dynamic from 'next/dynamic';

const Scene = dynamic(
  () => import('@/components/canvas/Scene'),
  {
    ssr: false,
    loading: () => null, // no loading flash — canvas appears when ready
  }
);
```

### Anti-Patterns to Avoid

- **Drei ScrollControls with Lenis:** ScrollControls creates its own scroll container and RAF loop. Combining with Lenis creates two competing scroll authorities — scroll position desynchronizes. Confirmed pitfall.
- **React hook (`useEraStore`) inside `useFrame`:** Triggers the React reconciler on every animation frame (60+ times/second). Use `eraStore.getState()` instead.
- **Importing Three.js in Server Components:** Even with App Router, Three.js accesses `window` and `document` at module load time. Always use `'use client'` or dynamic imports.
- **Lenis with `autoRaf: true` (default) when using GSAP ticker:** Creates two competing RAF loops. Scroll position updates on different schedules causing jitter. Always set `autoRaf: false` when integrating with GSAP.
- **`setState` inside `useFrame`:** Every state update triggers a React re-render. `useFrame` runs at 60fps — this would re-render 60 times per second. Write to the Zustand store via `eraStore.setState()` (vanilla, no React reconciler involved).
- **Scroll event listeners on `window` instead of Lenis:** Bypasses Lenis inertia and creates dual scroll sources. All scroll consumption must go through GSAP ScrollTrigger's `onUpdate`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth scroll inertia | Custom RAF + lerp loop | Lenis | Handles touch, trackpad, mouse wheel, keyboard uniformly; iOS momentum edge cases; accessibility considerations |
| Scroll-to-animation sync | Manual scroll event → GSAP tween | GSAP ScrollTrigger `scrub` | Scrub handles velocity, direction, lag, and cleanup automatically |
| Global state for 60fps reads | React context or `useState` | Zustand vanilla `createStore` | Context re-renders every subscriber on every update; Zustand getState() is zero-overhead |
| SSR detection | `typeof window !== 'undefined'` guards everywhere | `next/dynamic` with `ssr: false` | Dynamic import is the idiomatic Next.js boundary; guards are error-prone |

**Key insight:** The scroll inertia + animation sync problem has more edge cases than it appears (scroll restoration, resize, orientation change, trackpad vs. mouse wheel, reduced motion). Lenis + GSAP together solve all of these.

---

## Common Pitfalls

### Pitfall 1: Lenis AutoRaf Conflict with GSAP Ticker
**What goes wrong:** Both GSAP and Lenis run their own RAF loops. Scroll position is read at different points in the animation frame, causing visual jitter and position desync between the smooth-scrolled HTML and the R3F canvas.
**Why it happens:** Default `autoRaf: true` in Lenis. Developers add GSAP ticker integration without disabling Lenis's own loop.
**How to avoid:** Set `autoRaf: false` in Lenis constructor. Drive Lenis exclusively via `gsap.ticker.add((time) => lenis.raf(time * 1000))`.
**Warning signs:** Scroll position looks correct in Chrome DevTools but canvas lags 1-2 frames behind; parallax elements jitter on fast scroll.

### Pitfall 2: R3F Canvas SSR Hydration Error
**What goes wrong:** Next.js renders the Canvas on the server, Three.js accesses `window.WebGLRenderingContext`, throws, and the page fails to hydrate.
**Why it happens:** Forgetting `ssr: false` on the dynamic import, or importing Three.js/R3F in a Server Component.
**How to avoid:** `dynamic(() => import('./Scene'), { ssr: false })`. Never import Three.js or R3F in files without `'use client'`.
**Warning signs:** "ReferenceError: window is not defined" in server logs; hydration mismatch errors in browser console.

### Pitfall 3: React Hook in useFrame
**What goes wrong:** Component calling `useEraStore()` (React hook) inside `useFrame` triggers the React reconciler on every animation frame, causing catastrophic performance degradation.
**Why it happens:** Natural instinct to use the hook for state access. `useFrame` callback looks like a regular function.
**How to avoid:** Read store state via `eraStore.getState()` inside any callback that fires at animation frame rate. The React hook is for components that need to re-render when state changes — use it in JSX/render scope, not in `useFrame`.
**Warning signs:** Frame rate drops from 60fps to 15-20fps as soon as a 3D component subscribes to scroll state; React DevTools shows thousands of renders per second.

### Pitfall 4: Pointer Events Blocking Scroll
**What goes wrong:** The R3F canvas sits on top of the scrollable div and intercepts mouse/touch events, preventing scroll.
**Why it happens:** Canvas default styles include `pointer-events: auto`.
**How to avoid:** Set `pointerEvents: 'none'` on the Canvas wrapper div. Re-enable selectively on interactive 3D elements in later phases.
**Warning signs:** Page refuses to scroll with mouse wheel; scroll works only via keyboard.

### Pitfall 5: ScrollTrigger refresh() on Resize
**What goes wrong:** After window resize, ScrollTrigger's start/end positions are stale. The progress values drift.
**Why it happens:** ScrollTrigger caches measurements. Resize doesn't automatically trigger recalculation.
**How to avoid:** Call `ScrollTrigger.refresh()` in a debounced `window.resize` listener, or rely on `ScrollTrigger.addEventListener('refresh', ...)` for derived calculations like `computeScrollHeight`.
**Warning signs:** After resizing the browser, `eraProgress` drifts noticeably — era boundaries are in the wrong scroll position.

### Pitfall 6: Next.js 16 Async params/headers
**What goes wrong:** Next.js 16 removed synchronous `params` and `searchParams` access. If any route handler uses them synchronously, build fails.
**Why it happens:** Breaking change in Next.js 16.
**How to avoid:** This phase uses no dynamic routes (single page). Awareness is for future phases. Use `await params` and `await searchParams` if needed.
**Warning signs:** Build error mentioning `params` must be awaited.

---

## Code Examples

Verified patterns from official sources:

### GSAP ScrollTrigger Global Progress (0–1)
```typescript
// Source: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.create({
  start: 'top top',      // when page top reaches viewport top
  end: 'bottom bottom',  // when page bottom reaches viewport bottom
  onUpdate: (self) => {
    console.log('progress:', self.progress.toFixed(3)); // 0 to 1
    console.log('direction:', self.direction);           // 1 = down, -1 = up
    console.log('velocity:', self.getVelocity());        // px/s
  },
});
```

### Lenis + GSAP Single RAF Loop
```typescript
// Source: https://gsap.com/community/forums/topic/40426 (verified pattern)
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const lenis = new Lenis({ autoRaf: false }); // CRITICAL

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000); // GSAP time = seconds; Lenis = milliseconds
});
gsap.ticker.lagSmoothing(0);
```

### Zustand Vanilla Store + React Hook Bridge
```typescript
// Source: https://zustand.docs.pmnd.rs/ (createStore pattern)
import { createStore, useStore } from 'zustand';

const eraStore = createStore(() => ({
  globalProgress: 0,
  currentEra: 0,
  eraProgress: 0,
}));

// For React components (reactive):
const useEraStore = (selector) => useStore(eraStore, selector);

// For useFrame / GSAP callbacks (non-reactive, zero overhead):
const { globalProgress } = eraStore.getState();

// Writing from scroll engine (outside React):
eraStore.setState({ globalProgress: 0.42, currentEra: 5, eraProgress: 0.7 });
```

### Next.js Dynamic Import for SSR Safety
```typescript
// Source: https://nextjs.org/docs/pages/guides/lazy-loading
import dynamic from 'next/dynamic';

const Scene = dynamic(
  () => import('@/components/canvas/Scene'),
  { ssr: false }
);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSAP plugins behind Club GSAP paywall | All plugins free including ScrollTrigger, SplitText, MorphSVG | 2024 (Webflow acquisition) | No license management; install directly from npm |
| Lenis from `@studio-freight/lenis` | `lenis` (darkroomengineering moved packages) | 2024 | Import from `lenis` not `@studio-freight/lenis`; React wrapper is `lenis/react` |
| R3F v8 (React 18) | R3F v9 (React 19 compatible) | 2025 | Must use `ThreeElement` types; `MeshProps` etc. are removed |
| Next.js App Router experimental | App Router is default and stable | Next.js 15+ | No `experimental.appDir` flag needed |
| Zustand v4 (`create` from 'zustand') | Zustand v5 (`createStore` from 'zustand/vanilla') | 2024 | Vanilla store pattern is the canonical approach for non-React access |
| Next.js Webpack by default | Turbopack by default (Next.js 16) | October 2025 | Faster builds; webpack still available via `--webpack` flag |

**Deprecated/outdated:**
- `@studio-freight/react-lenis`: Old import path. Use `lenis/react` from the `lenis` package.
- `@studio-freight/lenis`: Old package. Use `lenis`.
- R3F `MeshProps`, `BoxGeometryProps` etc. as named exports: Removed in v9. Use `ThreeElement<THREE.Mesh>` pattern or JSX inference.
- Drei ScrollControls: Do not use with Lenis. They conflict.

---

## Open Questions

1. **Three.js exact version to pin**
   - What we know: R3F v9.5.0 requires three >= 0.140.0; peer dep range is broad
   - What's unclear: Which version npm will select without explicit pinning; whether latest Three.js (r175+) has any breaking changes with R3F v9
   - Recommendation: Run `npm install three @react-three/fiber` then `npm ls three` and pin the resolved version in package.json immediately

2. **Lenis `lerp` / `duration` tuning for emotional pacing**
   - What we know: These are Claude's discretion; typical values are lerp: 0.06–0.1, duration: 1.0–1.5
   - What's unclear: Whether the target emotional pacing (some eras feel slow, others fast) requires Lenis config changes or is entirely handled by scroll weight
   - Recommendation: Scroll weight config handles per-era pacing. Lenis lerp should be a fixed comfortable value (~0.08). Do not change lerp per-era — that would make scroll feel inconsistent.

3. **GSAP ScrollTrigger `scrub` vs. `onUpdate` for progress extraction**
   - What we know: `onUpdate` fires on every scroll event; `scrub` is for linking animations
   - What's unclear: Whether using `onUpdate` on a standalone `ScrollTrigger.create()` (no animation target) has any performance concerns at 60fps
   - Recommendation: Use standalone `ScrollTrigger.create({ onUpdate: ... })` without a `scrub` value. This is the correct pattern for progress monitoring (not animation driving).

---

## Validation Architecture

`nyquist_validation` is enabled in `.planning/config.json`.

### Test Framework

This is a greenfield Next.js project with no existing test infrastructure. The recommended framework for this stack is Vitest (fast, ESM-native, works with TypeScript and Next.js without heavy config).

| Property | Value |
|----------|-------|
| Framework | Vitest 2.x |
| Config file | `vitest.config.ts` — Wave 0 gap |
| Quick run command | `npx vitest run src/lib/scrollMath.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-03 | `computeEraProgress(0)` returns era 0, eraProgress 0 | unit | `npx vitest run src/lib/scrollMath.test.ts -t "computeEraProgress"` | ❌ Wave 0 |
| FOUND-03 | `computeEraProgress(1)` returns era 12, eraProgress ~1 | unit | `npx vitest run src/lib/scrollMath.test.ts` | ❌ Wave 0 |
| FOUND-03 | Era boundaries sum to 1.0 (weights normalized correctly) | unit | `npx vitest run src/lib/scrollMath.test.ts -t "era boundaries"` | ❌ Wave 0 |
| FOUND-05 | Era 3 (Divorce) occupies more scroll distance than Era 1 (Childhood) | unit | `npx vitest run src/lib/scrollMath.test.ts -t "scroll weight"` | ❌ Wave 0 |
| FOUND-05 | Era 10 (Chaos) occupies less distance than Era 8 (Breakup) | unit | `npx vitest run src/lib/scrollMath.test.ts -t "scroll weight"` | ❌ Wave 0 |
| FOUND-01 | App loads without SSR errors | smoke (manual) | Browser console check — no automation for WebGL hydration | manual-only |
| FOUND-02 | Lenis + ScrollTrigger scroll produces smooth updates | smoke (manual) | Debug overlay visual inspection | manual-only |
| FOUND-04 | Zustand store updates propagate to consumers | unit | `npx vitest run src/store/eraStore.test.ts` | ❌ Wave 0 |
| FOUND-06 | Canvas is position:fixed at all tested viewport widths | smoke (manual) | Browser dev tools responsive inspector | manual-only |

**Note on FOUND-01, FOUND-02, FOUND-06:** These requirements involve browser rendering, WebGL context, and CSS layout — they cannot be fully automated without a browser environment (Playwright/Cypress). For Phase 1 scope, manual smoke testing via the debug overlay is the appropriate gate. Playwright can be introduced in a later phase when there is more visual surface to test.

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/scrollMath.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual browser smoke (load app, confirm no console errors, scroll and confirm debug overlay shows changing values)

### Wave 0 Gaps
- [ ] `src/lib/scrollMath.test.ts` — covers FOUND-03, FOUND-05 (pure math, fully automatable)
- [ ] `src/store/eraStore.test.ts` — covers FOUND-04 (Zustand vanilla store, fully automatable)
- [ ] `vitest.config.ts` — Vitest configuration
- [ ] Framework install: `npm install -D vitest @vitest/ui` — run before Wave 1

---

## Sources

### Primary (HIGH confidence)
- Next.js blog: https://nextjs.org/blog/next-16 — Next.js 16 stable features, React 19.2, breaking changes
- GSAP Docs: https://gsap.com/docs/v3/Plugins/ScrollTrigger/ — ScrollTrigger `onUpdate`, `progress` property, `scrub`
- Lenis GitHub: https://github.com/darkroomengineering/lenis — Version 1.3.18 confirmed, `autoRaf: false` + GSAP ticker pattern
- GSAP Forum: https://gsap.com/community/forums/topic/40426-patterns-for-synchronizing-scrolltrigger-and-lenis-in-reactnext/ — `autoRaf: false` canonical integration pattern
- R3F Docs: https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide — v9 React 19 compatibility, TypeScript type changes
- WebSearch: npmjs `zustand` — version 5.0.11 confirmed current

### Secondary (MEDIUM confidence)
- WebSearch cross-verified: R3F v9.5.0 on npm, Three.js peer dep >= 0.140.0
- WebSearch cross-verified: GSAP 3.14.2 all plugins free (Webflow acquisition confirmed)
- devdreaming.com tutorial — ReactLenis + GSAP ScrollTrigger Next.js pattern (verified against GSAP forum)

### Tertiary (LOW confidence)
- Initial scroll weight values in `ERA_CONFIG` — scaffold values only; authorial tuning deferred; exact pacing is design not engineering
- Lenis `lerp: 0.08` recommendation — reasonable default based on community patterns, but inherently subjective

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all versions verified via WebSearch against npm/official sources as of March 2026
- Architecture: HIGH — patterns verified against official GSAP docs and Lenis GitHub; Zustand vanilla store pattern verified
- Pitfalls: HIGH — Lenis/ScrollControls conflict is from CONTEXT.md research; autoRaf conflict verified in GSAP community forum; React hook in useFrame is documented Zustand/R3F gotcha
- Scroll math: HIGH — pure math, deterministic, fully testable

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack — Next.js, GSAP, Lenis are slow-moving; R3F v10 is in beta but not yet stable)
