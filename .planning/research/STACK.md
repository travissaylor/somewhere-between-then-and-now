# Stack Research

**Domain:** Scroll-driven cinematic web experience — 3D environments, GLSL shader transitions, scroll-reactive audio
**Researched:** 2026-03-10
**Confidence:** MEDIUM-HIGH (core libraries verified via GitHub releases and official docs; some version pinning may need adjustment at install time)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x (current stable) | App framework, routing, deployment target | Project brief specifies it; Vercel-native; static export option fits a single-page art piece; App Router enables `use client` isolation for heavy WebGL components. Use v16 (not v15) — v15 had a known R3F incompatibility. |
| React | 19.x (bundled with Next 16) | Component model | Required by R3F v9; v9 specifically targets React 19.0–19.2. |
| React Three Fiber | 9.5.0 | React renderer for Three.js | The standard declarative 3D layer for React. v9 resolves the React 19 / Next 15 reconciler breakage. Ships its own reconciler bundle — no external reconciler dependency. |
| Three.js | 0.171.x | WebGL/3D scene graph | R3F's underlying engine. r171 introduced zero-config WebGPURenderer import; stable WebGL renderer is mature. Pin to a version compatible with the R3F minor you install. |
| GSAP | 3.14.x | Scroll timeline, animation orchestration | Completely free since Webflow acquisition (all plugins including ScrollTrigger, ScrollSmoother, SplitText). Industry standard for scroll-driven cinematic work. ScrollTrigger's `scrub` parameter maps scroll position directly to animation progress — essential for the "scroll = time" mechanic. |
| Tone.js | 14.7.39 | Scroll-reactive audio scheduling and crossfade | Web Audio API wrapper with DAW-like constructs (Transport, GainNode management, Player). Enables scheduled crossfades between audio stems as scroll zones change. Lower-level than needed for synthesis but exactly right for audio stem mixing and gain automation triggered by scroll events. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-three/drei | 10.7.7 | R3F helpers: `ScrollControls`, `useScroll`, `shaderMaterial`, `useTexture`, `Html`, `PerspectiveCamera` | Use throughout. `ScrollControls` + `useScroll` provide a scroll data hook that can drive scene state without GSAP. `shaderMaterial` is the right API for custom GLSL materials in R3F. |
| @react-three/postprocessing | 3.0.4 | Post-processing effects pipeline in R3F | Use for per-era color grading, film grain (Noise), vignette, chromatic aberration, bloom, and LUT (3D lookup table) color grading. EffectComposer wraps effects declaratively. Keep ToneMapping effect last. |
| postprocessing | (peer dep of above) | Core GPU-efficient effect passes | Do not use directly — used internally by @react-three/postprocessing. Custom effects via this library's Effect base class if needed. |
| lenis | 1.3.18 | Smooth scroll inertia | Use instead of GSAP ScrollSmoother when you want inertia-based scroll without locking DOM structure. Pairs with ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)` and `gsap.ticker.add`. Provides the "weighted scroll" feel appropriate for a memoir pace. |
| @gsap/react | 2.x | GSAP React integration hooks | Use `useGSAP` hook for proper cleanup of ScrollTrigger instances on unmount. Avoids the most common R3F + GSAP leak pattern. |
| gl-transitions | 1.43.0 | GLSL transition shader library | Use as a reference/source for the 5 major era transitions. These are drop-in GLSL fragment shaders (from/to texture + progress uniform). Adapt into R3F shaderMaterial rather than using the library directly. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript | Type safety | Use with R3F v9's new `ThreeElements` interface (replaces the per-type `MeshProps` exports). |
| Vercel | Deployment | Project constraint. Ensure `next.config.js` sets `output: 'export'` only if no server features needed, otherwise standard Vercel Next.js deploy. |
| @types/three | Type definitions for Three.js | Pin to same minor as `three` package. |
| glsl-literal (VS Code ext) | GLSL syntax highlighting in JS template literals | Quality-of-life for inline shader authoring. |
| Spector.js | WebGL frame debugger | Browser extension for diagnosing shader/framebuffer issues during development. Not a dependency. |

---

## Installation

```bash
# Core framework
npm install next react react-dom

# 3D stack
npm install @react-three/fiber@^9.5.0 three@^0.171.0 @react-three/drei@^10.7.7

# Post-processing
npm install @react-three/postprocessing@^3.0.4

# Animation & scroll
npm install gsap@^3.14.0 @gsap/react lenis@^1.3.18

# Audio
npm install tone@^14.7.39

# Dev dependencies
npm install -D typescript @types/three @types/react @types/react-dom
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 | Vite + React SPA | If you don't need SSR, image optimization, or Vercel-native deploys. Vite is faster in development and has zero Next.js overhead. Valid choice if the project brief didn't specify Next.js. |
| Next.js 16 | Astro | If the experience were mostly static HTML with islands of 3D. Not appropriate here — the entire experience is 3D. |
| GSAP ScrollTrigger | CSS Scroll-Driven Animations (native) | If the experience were 2D and animation requirements were simpler. GSAP's scrub precision and cross-browser consistency are essential for 13-era orchestration. |
| Lenis + GSAP ScrollTrigger | GSAP ScrollSmoother | ScrollSmoother requires a specific wrapper/content DOM structure. Lenis is more flexible, especially when the canvas sits outside the normal scroll container. |
| Tone.js | Raw Web Audio API | Only if Tone.js's scheduling overhead became measurable. For stem crossfading driven by scroll position, Web Audio API alone requires significant boilerplate. Tone.js earns its weight here. |
| @react-three/postprocessing | Custom EffectComposer wiring | Only if the built-in effect pipeline can't express an era's visual treatment. Start with the library; drop to custom passes only when stuck. |
| R3F ScrollControls + useScroll | GSAP ScrollTrigger for 3D scroll state | Drei's `useScroll` gives normalized 0–1 progress with dampening built in, ideal for continuous scene state. GSAP ScrollTrigger is better for discrete animation sequences tied to scroll positions. Use both: Drei for scene interpolation, GSAP for transitions and text effects. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| React Three Fiber v8 | Incompatible with React 19 / Next.js 15+. Will throw `ReactCurrentOwner` TypeError at runtime. | R3F v9.5.0 |
| Next.js 15.x (pre-patch) | Had confirmed R3F/React 19 reconciler incompatibility. The issue was in the `ReactCurrentOwner` internal API. | Next.js 16.x |
| A-Frame or Babylon.js | React integration is bolted on, not native. A-Frame is DOM-based (performance ceiling). Babylon.js is a full engine unnecessarily — this project needs a scene graph, not a game engine. | Three.js via R3F |
| Framer Motion | Excellent for UI animation, not built for WebGL scene orchestration or scroll-scrubbing 3D cameras. Will conflict with R3F's render loop. | GSAP inside R3F via `useFrame` + external state |
| Three.js WebGPU renderer (for now) | r171 made it importable with zero config, but R3F v9's async constructor support for WebGPU is new and undertested. Per-era GLSL shaders require WebGL 2 compatibility mode anyway. | Standard WebGLRenderer (default in R3F) |
| OGL | Lightweight WebGL library used in some Codrops tutorials. No React integration, no ecosystem for your use case. | Three.js via R3F |
| howler.js | Designed for game sound effects (one-shot playback). No built-in gain automation or scheduled crossfading between stems. | Tone.js or raw Web Audio API |
| TSL (Three Shader Language) | JavaScript-based shader authoring that compiles to GLSL/WGSL. Interesting for WebGPU future. In 2026 it is still experimental and documentation is sparse. The cinematic effect palette here (gl-transitions patterns, film grain, warp distortion) has a larger existing GLSL body of reference. | GLSL directly in shaderMaterial |

---

## Stack Patterns by Variant

**If an era needs a full shader transition (e.g., Parents' Divorce — film burn):**
- Author a custom GLSL fragment shader using gl-transitions as source material
- Expose `progress` and `ratio` as uniforms in drei's `shaderMaterial`
- Drive `progress` uniform from GSAP ScrollTrigger scrub or Drei `useScroll` offset
- Because: this gives frame-exact control over transition progress tied to scroll position

**If an era needs continuous post-processing (e.g., 1990s VHS grain):**
- Add era-specific effects as children of `<EffectComposer>` in `@react-three/postprocessing`
- Swap the EffectComposer children when scroll crosses era boundaries
- Because: declarative effect composition with automatic multi-pass batching is GPU-efficient

**If audio needs to crossfade between two era stems:**
- Use `Tone.Player` for each stem, route through `Tone.Gain` nodes
- On scroll zone boundary, `gain.rampTo(0, 1.5)` on outgoing, `gain.rampTo(1, 1.5)` on incoming
- Because: Tone.js GainNode scheduling prevents audio clicks that direct Web Audio API `gain.value = x` would cause

**If a 3D scene needs camera path driven by scroll:**
- Derive camera position/target from `useScroll().offset` inside `useFrame`
- Use `THREE.CatmullRomCurve3` for the camera path, sample it with `curve.getPoint(offset)`
- Do NOT use GSAP to directly mutate R3F camera refs — instead feed a reactive value into `useFrame`
- Because: GSAP outside the R3F render loop can desync camera state with the frame

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @react-three/fiber@9.5.0 | react@19.0–19.2, next@16.x | R3F v9 bundles its own reconciler; does NOT rely on external react-reconciler peer dep |
| @react-three/drei@10.x | @react-three/fiber@9.x | Drei v10 dropped support for R3F v8 |
| @react-three/postprocessing@3.x | @react-three/fiber@9.x, three@0.168+ | v3 changed EffectComposer API; ToneMapping must be last effect |
| three@0.171.x | @react-three/fiber@9.5.0 | R3F pins a Three.js peer dep range; check `peerDependencies` in R3F package.json before upgrading Three independently |
| gsap@3.14.x | next@16.x, react@19.x | No React peer dep; works in any JS environment. All plugins (ScrollTrigger, ScrollSmoother) now in main package |
| lenis@1.3.18 | gsap@3.x (ScrollTrigger) | Sync via `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.add(t => lenis.raf(t * 1000))` |
| tone@14.7.39 | react@19.x | No React peer dep. Must initialize AudioContext after user gesture (browser policy) |

---

## Sources

- https://github.com/pmndrs/react-three-fiber/releases — R3F v9.5.0 confirmed, React 19.0–19.2 compatibility (HIGH confidence)
- https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide — Breaking changes in v9, async GL support, TypeScript API changes (HIGH confidence)
- https://github.com/pmndrs/drei/releases — drei v10.7.7 confirmed (HIGH confidence)
- https://github.com/pmndrs/react-postprocessing — v3.0.4 confirmed Feb 2025, EffectComposer changes (HIGH confidence)
- https://github.com/Tonejs/Tone.js/releases — v14.7.39 confirmed (HIGH confidence)
- https://github.com/darkroomengineering/lenis — v1.3.18, GSAP integration pattern (HIGH confidence)
- https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/ — Confirmed R3F + GSAP + Three.js as current cinematic 3D pattern, Nov 2025 (MEDIUM confidence)
- https://gsap.com/blog/3-13/ — GSAP fully free, all plugins in main package (HIGH confidence)
- WebSearch: Next.js 16 is current stable as of Feb 2026 (MEDIUM confidence — could not directly verify on nextjs.org)
- WebSearch: Three.js r171 WebGPU production-ready, zero-config import (MEDIUM confidence)
- https://gl-transitions.com/ — GL Transitions GLSL library for transition shaders (MEDIUM confidence — last meaningful update 2019 but GLSL transitions are stable primitives)

---

*Stack research for: scroll-driven cinematic web experience / life memoir*
*Researched: 2026-03-10*
