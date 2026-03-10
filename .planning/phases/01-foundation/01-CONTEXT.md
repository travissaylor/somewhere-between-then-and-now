# Phase 1: Foundation - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Scroll engine, era store, and responsive layout scaffold producing verified era progress values. Next.js app bootstrapped with R3F canvas (SSR-safe), Lenis smooth scroll integrated with GSAP ScrollTrigger as sole scroll authority, Zustand store distributing normalized progress values, per-era scroll weight config, and desktop/tablet responsive layout. No 3D scenes, no audio, no content yet.

</domain>

<decisions>
## Implementation Decisions

### Scroll Authority
- GSAP ScrollTrigger is the sole scroll authority — never use Drei ScrollControls (confirmed conflict from research: PITFALLS.md)
- Lenis provides smooth scroll inertia, synced with GSAP ScrollTrigger via documented integration pattern
- Scroll container is a tall HTML div; R3F canvas is fixed-position overlay consuming scroll state from the store

### Era Progress Model
- Three normalized values: `globalProgress` (0–1 across entire piece), `currentEra` (0–12 integer), `eraProgress` (0–1 within current era)
- All downstream systems read from Zustand store, never from raw scroll position
- Use `useStore.getState()` (getter) inside `useFrame`, never the React hook — prevents reconciler fighting the render loop (from research: PITFALLS.md)

### Scroll Weight / Emotional Pacing
- Each era has a configurable scroll weight in a central config object
- The 5 major transitions (Parents' Divorce, Going to College, College to First Apartment, The Breakup, Moving to Pittsburgh) get 2–3x the scroll distance of connective-tissue eras
- Era 09 (The Breakup) and Era 01 (Being Born) should feel slow — give them extended scroll distance
- Era 11 (Year of Chaos) should feel fast — compressed scroll distance
- Exact weights are authorial decisions to be tuned later — scaffold must support arbitrary per-era weights

### SSR Safety
- R3F canvas rendered via Next.js `dynamic()` with `ssr: false` — no server-side rendering of WebGL
- All Three.js and R3F imports isolated behind `'use client'` boundary
- App Router used (not Pages Router)

### Layout
- Fixed-position full-viewport R3F canvas behind a scrollable HTML container
- Desktop-first design; tablet viewport adjusts canvas and camera FOV
- No mobile phone layout — phone redirect handled in Phase 10
- Debug overlay in development showing globalProgress, currentEra, eraProgress values

### Framework Decisions
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

</decisions>

<specifics>
## Specific Ideas

- The creative brief states: "Scrolling is time. Moving forward moves you through eras of a real life." — the scroll-to-progress mapping is the fundamental metaphor of the entire piece
- "No hard cuts. Everything morphs." — the era progress model must support smooth transitions, not discrete jumps
- "Some eras should feel slow, others fast" — from the creative brief's technical section, confirming non-uniform scroll weight is essential
- The emotional arc (Warmth → Fracture → Loss → Identity → Love → Rupture → Reconstruction → Chaos → Arrival → Present → Open) should be reflected in scroll pacing even before any visual content exists
- 13 eras total, numbered 01–13 per the creative brief

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — this phase establishes the foundational patterns all subsequent phases follow

### Integration Points
- The Zustand era store is the central integration point: scroll engine writes, everything else reads
- The fixed-position R3F canvas will be the mount point for all future 3D content
- The scroll weight config object will be referenced by every era-building phase

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-10*
