# Project Research Summary

**Project:** Somewhere Between Then and Now
**Domain:** Scroll-driven cinematic web experience — 13-era life memoir with 3D scenes, GLSL shader transitions, and reactive audio
**Researched:** 2026-03-10
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a cinematic personal memoir delivered as a scroll-driven WebGL experience — not a website to navigate but a film to experience. The project sits at the intersection of scroll-as-time-axis, GLSL shader-based scene transitions, and sample-accurate audio crossfading. Expert implementations of this genre (Codrops cinematic scroll demos, NRK editorial interactives) consistently converge on the same pattern: a single normalized scroll progress value drives all downstream systems (3D scene state, audio gain, post-processing), with GSAP ScrollTrigger as the sole scroll authority and React Three Fiber providing the declarative 3D layer.

The recommended stack is Next.js 16 + React 19 + React Three Fiber v9 + GSAP 3.14 + Tone.js + Lenis. The architecture has a clear dependency order: build the scroll engine and Zustand era store first, establish the R3F canvas and render pipeline, then build era scenes against that scaffold. The 5 major transition shaders (Parents' Divorce, College, First Apartment, The Breakup, Pittsburgh) are the emotional centerpieces and require a RenderTarget A/B compositor — the single most technically complex component, which must be proven early.

The primary risks are all architectural anti-patterns that become extremely costly to refactor once 13 eras are implemented: using React state for scroll-driven values (destroys frame budget), unmounting era components on change (VRAM leaks), mixing Drei ScrollControls with GSAP ScrollTrigger (desynchronized scroll state), and separate EffectComposer passes per effect (frame rate collapse). Every one of these must be established correctly in Phase 1 or they will be paid for in full during Phase 4.

## Key Findings

### Recommended Stack

The stack is well-established for this genre. Next.js 16 + R3F v9 is the current pairing — R3F v9 specifically resolved the React 19 / Next.js 15 reconciler incompatibility that was a known hazard. GSAP is now fully free (all plugins including ScrollTrigger included), making it the unambiguous choice for scroll orchestration. Lenis provides smooth scroll inertia and pairs with GSAP ScrollTrigger via a documented sync pattern. Tone.js handles audio scheduling at the audio thread level, which is necessary to avoid crossfade click artifacts from direct Web Audio API `gain.value` assignment.

See `//.planning/research/STACK.md` for full version compatibility matrix and installation commands.

**Core technologies:**
- Next.js 16 + React 19: App framework — Vercel-native, App Router enables `use client` isolation for WebGL components
- React Three Fiber 9.5.0: Declarative 3D — v9 resolves React 19 reconciler compatibility; bundles its own reconciler
- Three.js 0.171.x: Scene graph — pin version to R3F peer dep range
- GSAP 3.14 + ScrollTrigger: Scroll orchestration and animation timeline — `scrub` parameter maps scroll directly to animation progress; all plugins now free
- Lenis 1.3.18: Smooth scroll inertia — pairs with GSAP ScrollTrigger via documented sync
- Tone.js 14.7.39: Audio scheduling — CrossFade nodes, gain automation, prevents click artifacts
- @react-three/drei 10.7.7: R3F helpers — `shaderMaterial`, `useTexture`, `PerspectiveCamera`
- @react-three/postprocessing 3.0.4: Merged post-processing passes — EffectComposer merges all era effects into one GPU pass

**Avoid:** R3F v8 (React 19 incompatible), Framer Motion (conflicts with R3F render loop), Three.js WebGPU renderer (undertested with R3F v9), howler.js (no gain automation), Drei ScrollControls alongside GSAP ScrollTrigger (competing scroll state).

### Expected Features

The scroll-to-progress engine is the root dependency for everything else. Build and stabilize it first. The user gesture gate for audio is mandatory browser compliance, not optional. Asset preloading must block scroll unlock — users cannot enter an era whose assets haven't loaded.

See `//.planning/research/FEATURES.md` for full prioritization matrix and feature dependency graph.

**Must have (table stakes):**
- Scroll-to-progress engine (GSAP ScrollTrigger scrub across all 13 eras) — foundational; everything derives from it
- Asset preloading with loading gate — prevents entering broken scenes
- User gesture gate for audio — browser autoplay policy compliance
- Per-era 3D environment (geometry + lighting + simplified shaders minimum)
- 5 major transition shader events — emotional core of the piece
- Scroll-reactive audio crossfading across 13 zones
- Film grain + color grading per era — required for cinematic feeling
- Real photo integration for emotionally critical eras
- Desktop + tablet responsive layout
- `prefers-reduced-motion` fallback (static sequence of era images)
- Graceful phone-width redirect

**Should have (competitive/differentiating):**
- Camera path animation via CatmullRomCurve3 driven by scroll — adds spatial depth; complex, validate simpler version first
- Full photo/video integration for all 13 eras (v1 may use placeholders for non-critical eras)
- Session position restore via `sessionStorage`
- Performance optimization pass (texture compression, draw call audit, VRAM audit)
- Keyboard mute shortcut (`M`)

**Defer (v2+):**
- Per-era ambient sound layering (environmental audio on top of music stems)
- Soft WebGL degradation / GPU tier detection for low-end devices
- Additional inter-era photo/video as new assets are produced

**Deliberate exclusions:** No navigation menu (destroys scroll-as-time), no text narration inside the experience, no CMS, no interactive branching, no full audio control UI (single mute toggle only), no mobile optimization (graceful redirect instead).

### Architecture Approach

The architecture is a unidirectional data flow: Lenis smooth scroll feeds GSAP ScrollTrigger which writes normalized `globalProgress` (0–1), `currentEra` (0–12), and `eraProgress` (0–1) into a Zustand store. All downstream systems — R3F scenes, audio engine, post-processing — read only from this store, never from raw scroll. The RenderTarget A/B compositor is the technical centerpiece: two era scenes render off-screen simultaneously during transitions, blended by a GLSL shader driven by `uTransition`. A single EffectComposer at the top level applies all per-era post-processing in one merged GPU pass.

See `//.planning/research/ARCHITECTURE.md` for full system diagram, component responsibilities, and anti-pattern catalog.

**Major components:**
1. Scroll Engine (Lenis + GSAP ScrollTrigger) — normalizes raw scroll into era progress values; the sole scroll authority
2. Era State Store (Zustand) — single handoff point between scroll engine (writer) and all consumers (readers)
3. Scene Orchestrator + RenderTarget Compositor — manages era scene loading, A/B off-screen rendering, GLSL transition blending
4. Post-Processing Layer (EffectComposer) — applies per-era film grain, LUT color grading, bloom, vignette in one merged pass
5. Audio Engine (Tone.js) — 13 audio zones with CrossFade nodes driven by `eraProgress`; scheduled via audio timeline, not DOM events
6. Asset Loader (R3F useLoader + Suspense) — per-era asset manifests; predictive N+1 loading; dispose on N-2

### Critical Pitfalls

See `//.planning/research/PITFALLS.md` for full catalog of 10 critical pitfalls, technical debt patterns, and recovery costs.

1. **GSAP ScrollTrigger + Drei ScrollControls conflict** — these maintain competing scroll states that desync 3D and DOM layers. Use GSAP ScrollTrigger as the sole scroll authority. Never use Drei `<ScrollControls>`. Must be resolved in Phase 1 or recovery cost is HIGH.

2. **React state updates inside `useFrame`** — routes animation through React reconciler at 60fps, catastrophically destroying frame budget. Use `useRef` for scroll-driven values; use `useStore.getState()` (getter) inside `useFrame`, never the hook. Must be established as pattern in Phase 1.

3. **WebGL resource leak from era component unmount/remount** — Three.js GPU resources are not garbage collected on React unmount. On 13 eras with photos, this exhausts VRAM. Keep era scenes mounted; use `visible={false}` for inactive scenes; only dispose after transition completes. Establish in per-era scene phase.

4. **AudioContext created before user gesture** — silently suspended by all major browsers. Initialize and resume AudioContext only after first user interaction (first scroll event). Must be solved before any audio stem work.

5. **Shader compilation stutter on first transition playthrough** — GPU compiles shaders on first draw call. Pre-warm all shader materials during loading screen via `renderer.compile()`. Scaffold this during render setup, not as a retrofit.

6. **Scroll distance mapped uniformly across 13 eras** — wrong emotional pacing; experience feels mechanical. Define explicit scroll weight per era in a config object before writing any animation code; major transitions get 2–3x the scroll distance of connective tissue eras.

## Implications for Roadmap

Based on the research's explicit dependency chain and pitfall phase mapping:

### Phase 1: Foundation + Scroll Engine

**Rationale:** Everything depends on normalized scroll progress values. GSAP ScrollTrigger as sole scroll authority must be established before any 3D content is built — it's load-bearing for all downstream systems. Day 1 SSR safety (Next.js `dynamic` + `ssr: false`) must also happen here.

**Delivers:** Working Next.js app; Lenis + GSAP ScrollTrigger producing correct era/progress values; Zustand era store wired; fixed-position R3F Canvas with basic camera; no scenes yet; SSR-safe canvas boundary established.

**Addresses (from FEATURES.md):** Scroll-to-progress engine (P1 root dependency); desktop/tablet layout skeleton.

**Avoids (from PITFALLS.md):** Pitfall 1 (ScrollTrigger/ScrollControls conflict), Pitfall 4 (setState in useFrame), Pitfall 7 (uniform scroll pacing — define era weight config now), Pitfall 9 (SSR/Next.js conflict).

**Research flag:** Standard patterns — well-documented GSAP + Lenis integration; skip phase research.

### Phase 2: Render Pipeline + One Era Scaffold

**Rationale:** The RenderTarget A/B compositor is the riskiest technical component. Proving it works for a single era-to-era transition early prevents discovering blocking issues after 13 eras are built. Establish all patterns (asset loading, shader uniforms, EffectComposer, visibility toggling) on one era before scaling.

**Delivers:** Era 0 scene fully wired to eraProgress; EffectComposer with film grain + basic LUT; SceneOrchestrator with RenderTarget A/B pipeline for one transition; visibility-based scene management pattern (never unmount/remount); asset manifest pattern.

**Addresses (from FEATURES.md):** Per-era 3D environment scaffold; film grain + color grading pattern; one transition shader event.

**Avoids (from PITFALLS.md):** Pitfall 2 (AudioContext — not added yet, just scaffold), Pitfall 3 (shader warmup — add `renderer.compile()` in loading screen now), Pitfall 5 (GPU memory leak — visibility pattern established here), Pitfall 6 (post-processing pass explosion — single EffectComposer established here), Pitfall 10 (Vector3 allocation — establish pre-allocation pattern in first animated era).

**Research flag:** RenderTarget A/B compositor pattern is moderately documented but specific to this scale — consider phase research for the transition pipeline.

### Phase 3: Audio Engine

**Rationale:** Audio is a separate system that must be built and validated in isolation before it interacts with 13 eras. The user gesture gate and audio scheduling patterns are non-negotiable correctness requirements, not optimizations.

**Delivers:** Tone.js graph initialized; 2–3 era stems as proof; user gesture gate (first scroll resumes AudioContext); `eraProgress`-driven CrossFade; gain scheduled via `linearRampToValueAtTime` (not direct `.value` assignment); tab visibility suspend/resume.

**Addresses (from FEATURES.md):** User gesture gate for audio (P1 mandatory); scroll-reactive audio crossfading foundation.

**Avoids (from PITFALLS.md):** Pitfall 2 (AudioContext suspended on load), Pitfall 8 (audio crossfading driven by scroll events, not progress).

**Research flag:** Standard Tone.js patterns; skip phase research.

### Phase 4: All 13 Era Scenes + 5 Transition Shaders

**Rationale:** With the scaffold from Phase 2 proven, remaining eras follow the established pattern. The 5 major transition shaders are each discrete emotional centerpieces — build and tune them as standalone GLSL programs before wiring into scenes. The lamp continuity object spans eras 8–9 and depends on both eras and the transition pipeline existing.

**Delivers:** All 13 era 3D environments; all 5 major transition GLSL programs; full audio crossfade across all 13 zones; real photo integration for emotionally critical eras; the lamp (eras 8–9); `prefers-reduced-motion` fallback.

**Addresses (from FEATURES.md):** All P1 features; complete the piece as a functional experience end-to-end.

**Avoids (from PITFALLS.md):** Pitfall 5 (GPU memory — visibility pattern already in place), Pitfall 6 (post-processing — single EffectComposer already in place); all era scenes use the scaffold established in Phase 2.

**Research flag:** GLSL shader authoring for the 5 major transitions likely benefits from phase research — each is an emotionally distinct program with no direct reference implementation.

### Phase 5: Camera Path + Polish + Performance

**Rationale:** Camera path animation is a P2 feature — high value but complex. Deferring it allows the core experience to be validated before adding spatial complexity. The performance pass (texture compression, draw call audit, VRAM audit) requires the full experience to exist before it can be profiled.

**Delivers:** `CatmullRomCurve3` camera path driven by scroll; shader warmup verification; texture compression (KTX2/basis); draw call audit; GPU memory verified stable across 2 full passes; session position restore via `sessionStorage`; keyboard mute shortcut.

**Addresses (from FEATURES.md):** Camera path animation (P2); performance optimization pass (P2); session restore (P2); all `prefers-reduced-motion` edge cases.

**Avoids (from PITFALLS.md):** Pitfall 3 (shader compile stutter — verify during this phase); performance traps (uncompressed textures, draw call ceiling, film grain recomputed every frame).

**Research flag:** Camera path animation has well-documented CatmullRomCurve3 patterns — skip phase research. Performance optimization may benefit from phase research for KTX2/basis texture compression tooling.

### Phase Ordering Rationale

- Phases 1 and 2 must come first because all other systems are consumers of the scroll progress value and the render pipeline. Building audio or era content before the scroll engine is proven creates integration risk with no validation checkpoint.
- Audio (Phase 3) is isolated before integration because its correctness requirements (gesture gate, scheduling model) are easiest to verify in isolation and hardest to retrofit.
- Era content (Phase 4) deliberately follows the scaffold phase — the scaffold is not a prototype, it's the production pattern. Building all 13 eras after the pattern is proven eliminates the most expensive category of rework.
- Performance (Phase 5) must come last because profiling requires the full experience, and camera path requires all scenes to exist.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (RenderTarget compositor):** The A/B compositor + GLSL transition blend pattern at this scale has sparse reference implementations. Phase research recommended before implementation begins.
- **Phase 4 (Major transition shaders):** Each of the 5 centerpiece shaders is a custom GLSL program with no direct reference. Phase research into gl-transitions library and Codrops shader techniques recommended before authoring each shader.
- **Phase 5 (Texture compression tooling):** KTX2/basis texture compression pipeline integration with Next.js/Vercel is a specific tooling question. Phase research recommended.

Phases with standard patterns (skip phase research):
- **Phase 1:** Lenis + GSAP ScrollTrigger sync is thoroughly documented; Zustand patterns are standard.
- **Phase 3:** Tone.js CrossFade + gesture gate patterns are well-documented in official Tone.js and MDN docs.
- **Phase 5 (camera path):** CatmullRomCurve3 camera animation is a standard Three.js pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core library versions verified via GitHub releases and official docs. Next.js 16 as current stable confirmed via web search (MEDIUM — could not directly verify on nextjs.org). R3F v9 React 19 compatibility HIGH confidence. |
| Features | HIGH | Feature set derived from creative brief + cross-referenced against reference implementations. Table stakes features grounded in browser policy docs (MDN). Anti-features explicitly supported by UX research (NNG scrolljacking, accessibility spec). |
| Architecture | MEDIUM-HIGH | Core patterns (normalized scroll progress, RenderTarget A/B compositor, single EffectComposer) verified against Codrops reference implementations and library documentation. Audio+3D sync at 13-era scale has fewer reference implementations. |
| Pitfalls | HIGH | Critical pitfalls verified against official documentation (R3F pitfalls docs, GSAP official mistakes guide, MDN autoplay guide, pmndrs/postprocessing source). Most are confirmed issues with documented solutions, not speculative. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Next.js 16 stability:** Version confirmed via web search but not directly on nextjs.org. Verify current stable version at project setup and adjust if necessary.
- **Three.js r171 peer dep range:** R3F v9 pins a Three.js peer dep range — verify `peerDependencies` in R3F package.json before installing to avoid version conflict.
- **Scroll weight per era:** The pacing design (which eras get 2–3x scroll distance) is an authorial decision not resolvable by research. This must be made before Phase 2 begins. Treat it as a design artifact, not a technical one.
- **Audio stem availability:** Architecture assumes 13 audio stems exist. If stems are not all produced at project start, the audio engine must be built with graceful fallback for missing stems so Phase 3 is not blocked.
- **Low-end GPU target:** Research recommends testing on MacBook Air M-series as minimum viable GPU. The exact threshold for shader fallback (GPU tier detection) is unspecified — needs a decision before Phase 5.

## Sources

### Primary (HIGH confidence)
- https://github.com/pmndrs/react-three-fiber/releases — R3F v9.5.0, React 19 compatibility
- https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide — R3F v9 breaking changes, TypeScript API
- https://r3f.docs.pmnd.rs/advanced/pitfalls — R3F performance pitfalls (official)
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/ — GSAP ScrollTrigger API
- https://gsap.com/resources/st-mistakes/ — GSAP ScrollTrigger common mistakes (official)
- https://gsap.com/community/forums/topic/40114-scrolltrigger-pin-and-dreis-scrollcontrols-dont-play-well-together/ — ScrollTrigger + drei conflict confirmed
- https://gsap.com/blog/3-13/ — GSAP free/all plugins in main package
- https://github.com/pmndrs/react-postprocessing — v3.0.4, merged effect passes
- https://tonejs.github.io/docs/14.7.58/CrossFade — Tone.js CrossFade (official docs)
- https://github.com/darkroomengineering/lenis — v1.3.18, GSAP integration pattern
- https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay — AudioContext autoplay policy
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices — Web Audio API best practices

### Secondary (MEDIUM confidence)
- https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/ — Cinematic 3D scroll patterns (Nov 2025)
- https://tympanus.net/codrops/2026/02/23/composite-rendering-the-brilliance-behind-inspiring-webgl-transitions/ — RenderTarget compositor pattern (Feb 2026)
- https://tympanus.net/codrops/2025/01/22/webgl-shader-techniques-for-dynamic-image-transitions/ — Shader transition techniques
- https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/ — GSAP + shader animation
- https://tympanus.net/codrops/2024/07/18/how-to-create-distortion-and-grain-effects-on-scroll-with-shaders-in-three-js/ — Distortion + grain on scroll
- https://github.com/14islands/r3f-scroll-rig — R3F scroll rig reference
- https://developer.chrome.com/blog/nrk-casestudy — NRK scroll-driven animation case study
- https://discourse.threejs.org/t/transition-effect-between-multiple-scenes/68128 — Multi-scene transition pattern
- https://discourse.threejs.org/t/reducing-shader-compile-time-on-scene-initialization/56572 — Shader warmup via renderer.compile()
- https://medium.com/tech-vibes/reducing-shader-warmup-stutter-with-precompiled-shaders-e8dd68b525f5 — Shader warmup stutter (Feb 2026)
- https://gl-transitions.com/ — GL Transitions GLSL library
- https://web.dev/learn/accessibility/motion — Animation + motion accessibility
- https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html — WCAG 2.1 SC 2.3.3

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
