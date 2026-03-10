# Roadmap: Somewhere Between Then and Now

## Overview

The project builds from the ground up in a strict dependency order: a working scroll engine first, then a proven render pipeline, then audio in isolation, then all 13 era environments in four content phases, then the five major transition shaders that connect them, then post-processing and photo integration applied across the completed environments, then accessibility and edge cases as a final pass before deployment. Each phase delivers a coherent, verifiable capability before the next begins — the scaffold phases (1-3) are not prototypes but production patterns that all subsequent content work follows.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Scroll engine, era store, and responsive layout scaffold producing verified era progress values (completed 2026-03-10)
- [x] **Phase 2: Render Pipeline** - RenderTarget A/B compositor, EffectComposer, and asset loading gate proved on one era (completed 2026-03-10)
- [ ] **Phase 3: Audio Engine** - Tone.js graph with gesture gate, scroll-reactive crossfading, and 13-zone architecture
- [ ] **Phase 4: Eras — Origins** - Era environments 1-4 (Birth through The Divorce) built on proven scaffold
- [ ] **Phase 5: Eras — Youth and Identity** - Era environments 5-7 (Teenage Years through Identity Years)
- [ ] **Phase 6: Eras — Love, Loss, and Rebuilding** - Era environments 8-10 including the lamp continuity object
- [ ] **Phase 7: Eras — Present Day** - Era environments 11-13 (Year of Chaos through the open horizon)
- [ ] **Phase 8: Major Transitions** - All five centerpiece GLSL shader transitions connecting the emotional turning points
- [ ] **Phase 9: Post-Processing and Photo Integration** - Per-era film grain, color grading, bloom/vignette, and real photo blending
- [ ] **Phase 10: Accessibility and Deployment** - Reduced-motion fallback, phone redirect, scroll accessibility, and Vercel deployment

## Phase Details

### Phase 1: Foundation
**Goal**: The scroll engine produces verified era progress values that all downstream systems can trust, with the app loading without SSR errors
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06
**Success Criteria** (what must be TRUE):
  1. App loads in a browser without any SSR hydration errors in the console
  2. Scrolling the page produces correct `globalProgress` (0–1), `currentEra` (0–12), and `eraProgress` (0–1) values visible in a debug overlay or console
  3. Major transition eras occupy visibly more scroll distance than connective-tissue eras (per-era weight config is active)
  4. Zustand era store updates are readable by any consumer component without direct scroll coupling
  5. Desktop and tablet viewports both render the fixed-position canvas without layout breakage
**Plans**: 2 plans
Plans:
- [ ] 01-01-PLAN.md — Bootstrap project, era config, scroll math, Zustand store (with tests)
- [ ] 01-02-PLAN.md — Scroll engine, R3F canvas, debug overlay, responsive layout

### Phase 2: Render Pipeline
**Goal**: A single era scene renders correctly via the RenderTarget A/B compositor, proving the transition architecture and all GPU resource patterns before 13 eras are built
**Depends on**: Phase 1
**Requirements**: RNDR-01, RNDR-02, RNDR-03, RNDR-04, RNDR-05, RNDR-06
**Success Criteria** (what must be TRUE):
  1. A loading screen blocks scroll until era assets are confirmed ready, then releases
  2. One era-to-era transition renders via the RenderTarget A/B compositor without visual corruption
  3. Switching eras does not cause VRAM to grow — scenes are hidden, not unmounted
  4. No first-transition stutter after the loading screen clears (shader warmup via `renderer.compile()` is active)
  5. Next era's assets begin loading predictively; previous era's assets dispose after the N-2 threshold
**Plans**: 2 plans
Plans:
- [ ] 02-01-PLAN.md — Compositor logic, memory manager, GPU tier detection, GLSL shaders, ShaderMaterial wrappers
- [ ] 02-02-PLAN.md — Era scenes, A/B compositor, womb loading gate, scroll lock, shader warmup, visual verification

### Phase 3: Audio Engine
**Goal**: Scroll-reactive audio crossfading works correctly across multiple zones with no click artifacts or browser autoplay violations
**Depends on**: Phase 1
**Requirements**: AUDO-01, AUDO-02, AUDO-03, AUDO-04, AUDO-05, AUDO-06
**Success Criteria** (what must be TRUE):
  1. Audio does not play until the user's first scroll or interaction (no browser autoplay policy violation)
  2. Scrolling between eras crossfades audio smoothly with no audible clicks or pops
  3. Switching browser tabs pauses audio; returning resumes it without restart
  4. If an audio stem file is missing, the experience continues silently without error or broken state
  5. All 13 audio zones are wired with crossfade overlap regions so no zone boundary is abrupt
**Plans**: TBD

### Phase 4: Eras — Origins
**Goal**: Era environments 1-4 (Being Born, Early Childhood, Abuse Era, The Divorce) are fully built and emotionally distinct, each wired to scroll progress on the proven scaffold
**Depends on**: Phase 2, Phase 3
**Requirements**: ERA-01, ERA-02, ERA-03, ERA-04
**Success Criteria** (what must be TRUE):
  1. Era 1 (Being Born) opens in darkness with warm light emerging — no other era looks or sounds like this
  2. Era 2 (Early Childhood) is visibly Super 8 film aesthetic with warm outdoor palette — distinctly different from era 1
  3. Era 3 (Abuse Era) communicates instability and threat through corrupted geometry and harsh grain — uncomfortable to inhabit
  4. Era 4 (The Divorce) feels cold and emptying — objects have departed, color has drained
**Plans**: TBD

### Phase 5: Eras — Youth and Identity
**Goal**: Era environments 5-7 (Teenage Years and Sports, College, Identity Years) are built with their distinct visual and audio identities
**Depends on**: Phase 4
**Requirements**: ERA-05, ERA-06, ERA-07
**Success Criteria** (what must be TRUE):
  1. Era 5 (Teenage Years) feels expansive and golden — the energy of Friday night lights is present
  2. Era 6 (College) is saturated and fast — the most visually dense era, with layered audio stems
  3. Era 7 (Identity Years) feels muted and transitional — the stadium has emptied, something quieter begins
**Plans**: TBD

### Phase 6: Eras — Love, Loss, and Rebuilding
**Goal**: Era environments 8-10 (The Seven Years, The Breakup, Pittsburgh and The House) are built, including the lamp as a traveling continuity object
**Depends on**: Phase 5
**Requirements**: ERA-08, ERA-09, ERA-10, PHOT-02
**Success Criteria** (what must be TRUE):
  1. Era 8 (The Seven Years) feels warm and inhabited — the lamp is present as a recognizable 3D object
  2. Era 9 (The Breakup) is the starkest moment — monochrome, the lamp has fallen, silence is the predominant audio
  3. The lamp is recognizably the same object traveling from era 8 into era 9, providing felt continuity through rupture
  4. Era 10 (Pittsburgh) communicates rebuilding — geometry assembles, Pittsburgh gold/black palette arrives
**Plans**: TBD

### Phase 7: Eras — Present Day
**Goal**: Era environments 11-13 (Year of Chaos, Finding Her, Somewhere Between Then and Now) complete the full 13-era journey
**Depends on**: Phase 6
**Requirements**: ERA-11, ERA-12, ERA-13
**Success Criteria** (what must be TRUE):
  1. Era 11 (Year of Chaos) is the most kinetic and saturated era — scroll-speed reactivity amplifies the sense of overwhelm
  2. Era 12 (Finding Her) resolves the chaos visibly — warm earth tones arrive, audio settles into a simple melody
  3. Era 13 (Somewhere Between Then and Now) ends on an open horizon — edges dissolving, no resolution, still moving
  4. Scrolling through all 13 eras end-to-end completes without any era showing placeholder geometry or missing audio
**Plans**: TBD

### Phase 8: Major Transitions
**Goal**: All five centerpiece GLSL shader transitions are authored and wired — the emotional turning points of the piece are fully realized
**Depends on**: Phase 7
**Requirements**: TRNS-01, TRNS-02, TRNS-03, TRNS-04, TRNS-05
**Success Criteria** (what must be TRUE):
  1. Transition 1 (Parents' Divorce) — the house empties in reverse order of intimacy, cold blue light replacing warmth
  2. Transition 2 (Going to College) — the floor becomes turf, the ceiling opens to sky, color explodes
  3. Transition 3 (College to First Apartment) — stadium lights cut one by one until only the lamp remains lit
  4. Transition 4 (The Breakup) — the lamp falls, geometry fragments, the world goes monochrome and silent in one gesture
  5. Transition 5 (Moving to Pittsburgh) — broken geometry reassembles into a house foundation, gold and black arrive
**Plans**: TBD

### Phase 9: Post-Processing and Photo Integration
**Goal**: Every era has its correct film grain character, color grading, and post-processing, and real photographs are blended into emotionally critical environments
**Depends on**: Phase 8
**Requirements**: POST-01, POST-02, POST-03, PHOT-01
**Success Criteria** (what must be TRUE):
  1. Each era has a distinct film grain character — childhood eras feel analog and warm, later eras use era-appropriate noise types
  2. Color grading is emotional notation: warm amber in childhood, desaturated grey in fracture eras, monochrome in The Breakup
  3. Bloom and vignette settings are tuned per era — no two eras have identical post-processing signatures
  4. Real photographs appear in emotionally critical eras blended into the 3D environment, not floating as flat sprites
**Plans**: TBD

### Phase 10: Accessibility and Deployment
**Goal**: The piece is accessible to users who cannot experience motion, handles phone visitors gracefully, works with keyboard/trackpad scroll, and is deployed to Vercel
**Depends on**: Phase 9
**Requirements**: ACCS-01, ACCS-02, ACCS-03
**Success Criteria** (what must be TRUE):
  1. A user with `prefers-reduced-motion` enabled sees a static sequence of era images that conveys the narrative without animation
  2. Visiting on a phone-width viewport shows a message directing the visitor to a larger screen — no broken 3D scene
  3. Keyboard arrow keys and trackpad scroll both advance the experience without trapping focus or behaving unexpectedly
  4. The live Vercel URL loads the experience without errors in a production build
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Complete    | 2026-03-10 |
| 2. Render Pipeline | 2/2 | Complete   | 2026-03-10 |
| 3. Audio Engine | 0/TBD | Not started | - |
| 4. Eras — Origins | 0/TBD | Not started | - |
| 5. Eras — Youth and Identity | 0/TBD | Not started | - |
| 6. Eras — Love, Loss, and Rebuilding | 0/TBD | Not started | - |
| 7. Eras — Present Day | 0/TBD | Not started | - |
| 8. Major Transitions | 0/TBD | Not started | - |
| 9. Post-Processing and Photo Integration | 0/TBD | Not started | - |
| 10. Accessibility and Deployment | 0/TBD | Not started | - |
