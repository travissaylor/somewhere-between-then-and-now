# Phase 2: Render Pipeline - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

RenderTarget A/B compositor, EffectComposer, visibility-based scene management, shader warmup, asset preloading with loading gate, and predictive N+1 loading / N-2 disposal — all proved on Era 01 + Era 02 as proof-of-concept pair. No audio, no post-processing tuning, no custom transition shaders (Phase 8). Two rough-draft era environments are built to validate the pipeline, not as final content.

</domain>

<decisions>
## Implementation Decisions

### Loading Gate (Womb State)
- Loading screen represents being in the womb — the experience begins before scroll begins
- Deep red-black darkness with a rhythmic pulse of warm light synced to heartbeat tempo (~70bpm)
- Visual only — no audio during loading (audio engine is Phase 3, and loading state should stay lightweight)
- No text at all — no title, no "loading", no instructions, no progress indicator
- When assets are ready: heartbeat accelerates, intensity grows, light floods and breaks through into Era 01 (birth moment)
- Scroll releases after the birth break
- Loading gate waits for first 2-3 eras only, not all 13 — remaining eras load predictively as user scrolls

### Proof Era Choice
- Era 01 (Being Born) + Era 02 (Early Childhood) as the proof pair — proves loading, rendering, AND transitioning
- Rough draft of final look — attempt the actual creative vision (abstract light for 01, backyard diorama for 02) even if rough
- Use placeholder/procedural textures — no real photo assets yet (Phase 9)
- Loose era component structure — don't over-design a shared interface contract yet; extract patterns in Phase 4 when more eras exist

### Transition Blend Style
- Shader-driven morph as the default blend mode, not plain opacity cross-dissolve
- Compositor built from day one to accept swappable GLSL shaders per transition
- Default is a noise dissolve shader (Claude's discretion on organic vs geometric noise character)
- Brief overlap region (~10% of era scroll distance) for default transitions
- Per-boundary variation supported — each era boundary can have a slightly different dissolve (speed, scale, direction), not a single uniform blend everywhere
- Phase 8 uses the same swappable shader mechanism for the 5 major custom transitions

### Memory Budget
- Seamless back-scroll priority — keep current ±2 or ±3 eras in memory for instant backward scrolling
- Desktop-first VRAM budget; scrubbing the timeline should feel instant
- If memory pressure detected on lower-end machines: tighten the keep-alive window (±3 → ±1) but never reduce visual fidelity — what's on screen always looks right
- Disposed eras fade in from black on revisit (0.3–0.5s subtle fade-in) — no loading bars or spinners mid-experience
- Visibility-based scene management: scenes are hidden (visible=false), not unmounted — prevents VRAM leaks from mount/unmount cycles

### Claude's Discretion
- Noise dissolve character (organic Perlin vs geometric Voronoi vs hybrid)
- Exact EffectComposer pass configuration and ordering
- Shader warmup implementation details (renderer.compile() timing)
- RenderTarget resolution and format choices
- Predictive loading trigger thresholds (how far ahead to start loading)
- Exact keep-alive window size (±2 vs ±3) based on measured VRAM
- GPU tier detection approach for adaptive window sizing
- Womb heartbeat pulse shader implementation (color, intensity curve, acceleration ramp)

</decisions>

<specifics>
## Specific Ideas

- The loading gate IS the womb — not a loading screen with a theme, but literally the pre-birth darkness before the piece begins. The heartbeat pulse accelerating into a birth moment is the first emotional beat of the entire experience.
- "No hard cuts. Everything morphs." — the shader-driven compositor with per-boundary variation means even non-major transitions have character, not just opacity fades.
- The proof pair (Era 01 → Era 02) tests the most important transition: from abstract formlessness into the first concrete world. This is the birth-to-childhood passage.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `eraStore.ts`: Vanilla Zustand store with `globalProgress`, `currentEra`, `eraProgress` — the compositor reads these to drive blend progress
- `ERA_CONFIG` in `config/eras.ts`: 13 eras with scroll weights — used to calculate transition overlap regions
- `Scene.tsx`: Bare R3F Canvas with fixed positioning — the render pipeline replaces the placeholder content inside this canvas
- `ScrollEngine.tsx`: GSAP ScrollTrigger + Lenis integration writing to eraStore — the scroll authority that drives the compositor

### Established Patterns
- Vanilla store accessed via `eraStore.getState()` inside `useFrame` (not React hooks) — render pipeline must follow this pattern
- `'use client'` boundary for all R3F/Three.js code — SSR safety pattern
- Single unified RAF loop (Lenis driven by GSAP ticker with `autoRaf: false`)

### Integration Points
- The A/B compositor will live inside `Scene.tsx`'s Canvas, replacing the placeholder mesh
- `eraProgress` drives the blend factor between render targets A and B
- `currentEra` determines which scenes are assigned to which render target
- The loading gate needs to intercept before scroll is enabled (coordinate with ScrollEngine)
- Asset preloading system needs to signal readiness to the loading gate to trigger the birth transition

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-render-pipeline*
*Context gathered: 2026-03-10*
