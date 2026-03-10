# Architecture Research

**Domain:** Scroll-driven cinematic web experience / life memoir with 3D scenes, shader transitions, reactive audio
**Researched:** 2026-03-10
**Confidence:** MEDIUM-HIGH (core patterns well-documented; audio+3D sync at this scale has fewer reference implementations)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCROLL ENGINE LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Lenis (smooth scroll) → GSAP ScrollTrigger              │   │
│  │  Produces: normalized scroll progress (0.0–1.0 global)   │   │
│  │  + per-era progress (0.0–1.0 local)                      │   │
│  └──────────────────────────────┬───────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ scroll progress
          ┌───────────────────────┼────────────────────┐
          ↓                       ↓                    ↓
┌─────────────────┐   ┌───────────────────┐  ┌────────────────────┐
│  VISUAL ENGINE  │   │  AUDIO ENGINE     │  │  ERA STATE STORE   │
│                 │   │                   │  │                    │
│  R3F Canvas     │   │  Tone.js / Web    │  │  Zustand store     │
│  (fixed, full   │   │  Audio API        │  │  currentEra (0-12) │
│   viewport)     │   │                   │  │  eraProgress (0-1) │
│                 │   │  13 audio zones   │  │  globalProgress    │
│  SceneOrch-     │   │  with crossfade   │  │  (0-1)             │
│  estrator       │   │  stems            │  │                    │
└────────┬────────┘   └────────┬──────────┘  └────────────────────┘
         │                     │
         ↓                     ↓
┌─────────────────┐   ┌───────────────────┐
│  SCENE PIPELINE │   │  AUDIO GRAPH      │
│                 │   │                   │
│  RenderTarget A │   │  GainNode A       │
│  RenderTarget B │   │  GainNode B       │
│  Transition     │   │  CrossFade        │
│  Compositor     │   │  (0.0–1.0)        │
│  (GLSL shader)  │   │  → MasterGain     │
└────────┬────────┘   └───────────────────┘
         │
         ↓
┌─────────────────┐
│  POST-PROCESS   │
│  LAYER          │
│                 │
│  EffectComposer │
│  Per-era LUTs   │
│  FilmGrain      │
│  Bloom/Vignette │
└─────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Scroll Engine | Normalizes raw scroll into progress values; drives all animation timelines | Lenis + GSAP ScrollTrigger with custom easing |
| Era State Store | Single source of truth for which era is active and how far through it we are | Zustand store, written by ScrollTrigger callbacks |
| Scene Orchestrator | Manages which era scenes are loaded, transitions between them, camera state | R3F component reading era store |
| RenderTarget Pipeline | Renders two scenes off-screen simultaneously for transition blending | Three.js WebGLRenderTarget A/B with full-screen composite quad |
| Transition Compositor | GLSL shader that blends A/B scenes using `uTransition` (0–1) and era-specific effects | Custom ShaderMaterial on a full-screen plane |
| Post-Processing Layer | Applies per-era film grain, color grading (LUT), bloom, vignette after scene compositing | @react-three/postprocessing EffectComposer |
| Audio Engine | Manages 13 audio stems, crossfades between zones, maps scroll progress to gain values | Tone.js CrossFade nodes wired to scroll progress |
| Asset Loader | Pre-loads textures, 3D models, audio buffers per era; manages memory | R3F useLoader + Suspense, dynamic import |

## Recommended Project Structure

```
src/
├── engine/                    # Core runtime systems
│   ├── scroll/                # Scroll normalization and era mapping
│   │   ├── ScrollEngine.ts    # Lenis init, GSAP ScrollTrigger setup
│   │   ├── eraMap.ts          # Defines scroll boundaries for each era
│   │   └── useScrollProgress.ts  # Hook: { globalProgress, currentEra, eraProgress }
│   ├── store/                 # Global state
│   │   └── useEraStore.ts     # Zustand: currentEra, eraProgress, isTransitioning
│   └── audio/                 # Audio engine
│       ├── AudioEngine.ts     # Tone.js graph init, stem management
│       ├── audioZones.ts      # Maps era index to audio stem config
│       └── useAudioSync.ts    # Hook: subscribes to scroll, drives crossfades
│
├── scenes/                    # Per-era 3D environments
│   ├── SceneOrchestrator.tsx  # Loads A/B scenes, drives transition pipeline
│   ├── TransitionCompositor.tsx  # Full-screen RenderTarget blend quad
│   ├── era-00-warmth/         # Era 0: Birth / early warmth
│   │   ├── Scene.tsx          # R3F scene tree
│   │   ├── shaders/           # Era-specific GLSL
│   │   └── assets.ts          # Asset manifest for this era
│   ├── era-01-childhood/
│   │   └── ...
│   └── ... (13 era directories)
│
├── shaders/                   # Shared GLSL library
│   ├── transitions/           # Major transition shaders (5 centerpiece transitions)
│   │   ├── dissolve.glsl
│   │   ├── fracture.glsl
│   │   └── ...
│   └── utils/                 # Reusable shader functions
│       ├── noise.glsl
│       ├── sdf.glsl
│       └── color.glsl
│
├── postprocessing/            # Per-era post-processing configs
│   ├── PostLayer.tsx          # EffectComposer wrapper; switches config by era
│   ├── effects/               # Custom effect components
│   │   ├── FilmGrain.tsx
│   │   └── ColorGrade.tsx
│   └── luts/                  # Per-era LUT textures
│
├── assets/                    # Static assets (photos, video, audio stems)
│   ├── photos/
│   ├── video/
│   └── audio/
│
└── app/                       # Next.js app directory
    └── page.tsx               # Root: mounts ScrollEngine + R3F Canvas + AudioEngine
```

### Structure Rationale

- **engine/scroll/:** Isolates all scroll-to-value logic so scenes never read raw scroll position — they only receive normalized progress values. This makes scene components testable and reorderable.
- **engine/store/:** Zustand store is the single handoff point between the scroll engine (which writes) and all consumers (scenes, audio, post-processing). Avoids prop-drilling across deeply nested R3F trees.
- **scenes/era-XX/:** Co-locating per-era shaders and assets with the scene component makes eras independently ownable — you can work on era 7 without touching era 3.
- **shaders/transitions/:** The 5 major emotional transitions are standalone GLSL programs, not embedded in scenes, so they can be tuned independently of the scenes they bridge.

## Architectural Patterns

### Pattern 1: Normalized Scroll Progress as Universal Currency

**What:** The scroll engine converts raw scroll position into two normalized values: `globalProgress` (0–1 across the entire experience) and `eraProgress` (0–1 within the current era). Every downstream system — scenes, audio, post-processing — consumes only these values, never raw scroll.

**When to use:** Always. This is the foundational pattern for the whole system.

**Trade-offs:** Adds one abstraction layer but eliminates temporal coupling between scroll mechanics and visual/audio logic. Changing scroll speed or adding easing never touches scenes.

**Example:**
```typescript
// engine/scroll/useScrollProgress.ts
export function useScrollProgress() {
  const store = useEraStore()
  // GSAP ScrollTrigger writes into Zustand on each tick
  return {
    globalProgress: store.globalProgress,  // 0.0 – 1.0
    currentEra: store.currentEra,          // 0 – 12
    eraProgress: store.eraProgress,        // 0.0 – 1.0 within current era
    isTransitioning: store.isTransitioning,
  }
}
```

### Pattern 2: RenderTarget A/B Compositor for Scene Transitions

**What:** Two scenes are always rendered off-screen into WebGLRenderTargets simultaneously. A full-screen compositor quad blends them using a GLSL shader driven by a `uTransition` uniform (0.0 = 100% scene A, 1.0 = 100% scene B). The transition shader encodes the emotional character of the crossover.

**When to use:** For the 5 major era transitions and for softer inter-era blends.

**Trade-offs:** Requires rendering two scenes per frame during transitions (higher GPU cost). Justified because transitions are the emotional centerpieces; the cost is bounded in time. During stable eras, only one RenderTarget is active.

**Example:**
```typescript
// scenes/TransitionCompositor.tsx
const transitionMaterial = useRef<ShaderMaterial>()

useFrame(() => {
  const { eraProgress, isTransitioning } = useEraStore.getState()
  if (transitionMaterial.current && isTransitioning) {
    transitionMaterial.current.uniforms.uTransition.value = eraProgress
  }
})
```

### Pattern 3: Audio Graph Mirroring Scroll Progress

**What:** Tone.js CrossFade nodes connect pairs of audio stems. The `fade` property of each CrossFade is driven directly by the same `eraProgress` value that drives visual transitions. The audio graph topology mirrors the era map.

**When to use:** For all 13 audio zone crossfades.

**Trade-offs:** Tone.js CrossFade uses equal-power fading which prevents the "dip" artifact at the midpoint of a linear crossfade. Web Audio API `setTargetAtTime` can be used as an alternative for smoother transitions without Tone.js overhead, but Tone.js CrossFade is simpler to reason about.

**Example:**
```typescript
// engine/audio/AudioEngine.ts
crossfades.forEach((cf, i) => {
  // cf.fade is a Tone.Signal — set it from scroll each frame
  cf.fade.value = i === currentEra ? eraProgress : (i < currentEra ? 1 : 0)
})
```

### Pattern 4: Per-Era Post-Processing Config Swap

**What:** `@react-three/postprocessing` EffectComposer wraps the final render. A config object per era defines which effects are active and at what intensity. When era changes, the config swaps; intensities tween over a short duration.

**When to use:** Film grain, color grading LUTs, bloom, vignette — all vary per era.

**Trade-offs:** All effects must live inside one EffectComposer pass (the library merges them for performance). Era swap requires re-configuring uniforms, not unmounting/remounting — unmounting causes a flash.

## Data Flow

### Scroll-to-Render Flow

```
User scrolls
    ↓
Lenis (smooth scroll velocity)
    ↓
GSAP ScrollTrigger (progress callbacks)
    ↓
Zustand store.setProgress(globalProgress, eraProgress, currentEra)
    ↓
  ┌─────────────────────────────────┐
  │                                 │
  ↓                                 ↓
R3F useFrame loop                Audio useEffect/rAF loop
  │                                 │
  ├── Scene A uniforms update       ├── CrossFade.fade = eraProgress
  ├── Scene B uniforms update       └── Gain nodes update
  ├── Camera position tween
  ├── Transition uTransition update
  └── PostProcessing intensity update
    ↓
WebGL render: RenderTarget A, B → Compositor → EffectComposer → Screen
```

### Key Data Flows

1. **Scroll → Era detection:** GSAP ScrollTrigger markers define era boundaries. On crossing a boundary, `currentEra` increments and `eraProgress` resets to 0. This is the era clock tick.

2. **Era change → Asset loading:** When `currentEra` changes to N, the asset loader pre-fetches era N+1 assets (predictive loading). Era N-1 assets are released after transition completes.

3. **eraProgress → Transition shader:** During major transitions, `eraProgress` in range 0–1 maps to `uTransition` in the compositor shader. The shader applies the era-specific visual effect (fracture, dissolve, etc.).

4. **eraProgress → Audio crossfade:** The same `eraProgress` value drives `CrossFade.fade` for the audio pair at the current era boundary, keeping audio perfectly synchronized with visual transition progress.

5. **currentEra → Post-processing config:** On era change, EffectComposer receives the new era's effect config. Intensities tween over ~300ms to avoid harsh cuts.

### State Management

```
Zustand Era Store (written by ScrollEngine, read by everything else)
    ├── globalProgress: number (0–1)
    ├── currentEra: number (0–12)
    ├── eraProgress: number (0–1)
    └── isTransitioning: boolean

Components subscribe via useEraStore() selector:
  R3F scenes    → read eraProgress, currentEra
  AudioEngine   → read eraProgress, currentEra
  PostLayer     → read currentEra
  SceneOrch     → read currentEra, isTransitioning
```

## Build Order (Component Dependencies)

The architecture has a clear dependency chain. Build in this order:

1. **Scroll Engine + Era Store** — Everything depends on scroll progress values. Build the normalization layer and Zustand store first. Validate that scrolling produces correct era/progress values before touching 3D.

2. **Single R3F Canvas + Camera** — Establish the fixed-position canvas, basic camera, render loop. No scenes yet. Confirm no conflicts with GSAP/Lenis.

3. **One Era Scene** — Build era 0 as the scaffold for the era scene pattern: asset loading, shader uniforms wired to eraProgress, basic lighting. This is the template all other eras follow.

4. **Post-Processing Layer** — Add EffectComposer with film grain and a basic LUT. Test per-era config swap while still on single scene.

5. **Audio Engine** — Build the Tone.js graph with two stems, wire eraProgress to CrossFade. Validate scroll-reactive crossfading in isolation before adding complexity.

6. **RenderTarget Transition Pipeline** — Add SceneOrchestrator, RenderTarget A/B, and compositor shader. Test with era 0→1 transition. This is the riskiest technical component; early validation matters.

7. **Major Transition Shaders (5)** — Build the centerpiece GLSL shaders as standalone programs, wire into compositor. Each is a discrete emotional moment.

8. **Remaining 12 Era Scenes** — With the scaffold established, build remaining eras. They share the pattern from step 3.

9. **The Lamp Continuity Object** — Eras 8–9 recurring object. Implement after both eras exist; it spans a scene boundary so the RenderTarget pipeline must be solid first.

10. **Performance Pass** — Asset pre-loading strategy, texture compression, LOD, frame budget profiling.

## Scaling Considerations

This is a single static art piece, not a multi-user service. "Scaling" here means device performance scaling, not traffic scaling.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Desktop (primary) | Full resolution, all post-processing effects active, full audio stems |
| Tablet | Reduce RenderTarget resolution to 0.75x, disable compute-heavy GLSL (FBO particles), simplify audio to single crossfade track |
| Low-end GPU | Detect via `renderer.capabilities.maxTextureSize`, fall back to CSS transition-based era changes instead of RenderTarget compositor |

### Performance Priorities

1. **First bottleneck: Two simultaneous RenderTargets** — During transitions, two full scenes render per frame. Mitigate by reducing RenderTarget resolution to match output resolution (not 2x by accident), and by keeping non-active era scenes to minimal geometry during transitions.

2. **Second bottleneck: Audio context unlock + stem buffering** — Browsers require user gesture to start AudioContext. Must buffer all stems before scroll reaches the first audio zone, or crossfades will stutter. Pre-buffer on the first user scroll event.

3. **Third bottleneck: Texture memory from 13 eras of photos** — Load textures only for current and adjacent eras. Dispose on era N-2. Use compressed texture formats (KTX2/basis) where possible.

## Anti-Patterns

### Anti-Pattern 1: Reading Raw Scroll Position in Scene Components

**What people do:** Pass `window.scrollY` directly into Three.js objects in `useFrame`.
**Why it's wrong:** Scroll position has no era context, is not smoothed, and creates tight coupling between scenes and scroll mechanics. Changing easing or era order requires touching all scene components.
**Do this instead:** Scenes read only `eraProgress` and `currentEra` from the Zustand store. Scroll-to-value mapping lives entirely in the ScrollEngine.

### Anti-Pattern 2: Unmounting/Remounting Scenes on Era Change

**What people do:** Conditionally render era scene components: `{currentEra === 3 && <Era3Scene />}`.
**Why it's wrong:** React unmount/remount causes a one-frame flash (WebGL context operations are not atomic), disposes GPU resources that need time to re-upload, and breaks the transition pipeline which requires both scenes available simultaneously.
**Do this instead:** Keep current and next era scenes mounted. Use RenderTarget visibility to control what the user sees. Dispose previous era assets *after* the transition completes.

### Anti-Pattern 3: Animating Audio Gain Directly in rAF

**What people do:** Set `gainNode.gain.value = computedValue` every animation frame.
**Why it's wrong:** Directly setting `.value` on an AudioParam bypasses the Web Audio scheduling engine and can cause clicking artifacts, especially at era boundaries where gain changes are abrupt.
**Do this instead:** Use `gainNode.gain.setTargetAtTime(value, audioContext.currentTime, 0.05)` or Tone.js CrossFade's signal-rate automation, which interpolates smoothly at the audio thread level.

### Anti-Pattern 4: One Monolithic GSAP Timeline for All 13 Eras

**What people do:** Create a single GSAP timeline that spans the entire experience and seek through it based on scroll.
**Why it's wrong:** At 13 eras with distinct visual vocabularies, a single timeline becomes unmanageable. Debugging era 9 requires navigating through 8 eras of timeline configuration. Memory footprint is large since all keyframes are resident.
**Do this instead:** Per-era GSAP timelines activated by ScrollTrigger markers at era boundaries. Each era timeline is self-contained and can be developed/debugged in isolation.

### Anti-Pattern 5: Post-Processing as Per-Scene Responsibility

**What people do:** Each era scene component creates its own EffectComposer.
**Why it's wrong:** Multiple EffectComposers cause multiple full render passes. `@react-three/postprocessing` explicitly requires a single EffectComposer that merges all effects into one pass.
**Do this instead:** One EffectComposer at the top level, with era-driven config injected via props. Era scenes communicate desired effect intensities upward via the Zustand store; the PostLayer reads them.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| ScrollEngine → Era Store | Zustand `set()` calls inside GSAP ScrollTrigger `onUpdate` | Must call `set()` synchronously, not in setTimeout |
| Era Store → R3F Scenes | `useEraStore()` selector in R3F components, read in `useFrame` | Use shallow equality selectors to prevent unnecessary re-renders |
| Era Store → Audio Engine | `useEraStore.subscribe()` outside React tree | Audio engine is not a React component; use vanilla Zustand subscription |
| SceneOrchestrator → RenderTargets | Refs passed to compositor as texture uniforms | RenderTargets must be created once and reused, not recreated on era change |
| PostLayer → EffectComposer | Era config object passed as props, intensities tweened with Tone.js Signal or simple lerp in `useFrame` | Avoid unmounting/remounting effects — tween to zero intensity instead |
| Era Scenes → Asset Loader | Each era exports an `assets.ts` manifest; SceneOrchestrator drives preload of N+1 | Use R3F `useLoader` with Suspense for automatic caching |

### No External Services

This is a static art piece deployed to Vercel. There are no API calls, no authentication, no databases. The only "external" integrations are:

- **Vercel** — Static deployment, edge caching for asset CDN
- **Browser AudioContext** — Requires user gesture unlock; handle in the first scroll event handler

## Sources

- [How to Build Cinematic 3D Scroll Experiences with GSAP | Codrops (Nov 2025)](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/) — HIGH confidence
- [Composite Rendering: The Brilliance Behind Inspiring WebGL Transitions | Codrops (Feb 2026)](https://tympanus.net/codrops/2026/02/23/composite-rendering-the-brilliance-behind-inspiring-webgl-transitions/) — HIGH confidence
- [WebGL Shader Techniques for Dynamic Image Transitions | Codrops (Jan 2025)](https://tympanus.net/codrops/2025/01/22/webgl-shader-techniques-for-dynamic-image-transitions/) — HIGH confidence
- [How to Animate WebGL Shaders with GSAP | Codrops (Oct 2025)](https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/) — HIGH confidence
- [r3f-scroll-rig by 14islands — GitHub](https://github.com/14islands/r3f-scroll-rig) — HIGH confidence (library source)
- [react-postprocessing — pmndrs/react-postprocessing](https://github.com/pmndrs/react-postprocessing) — HIGH confidence (library source)
- [Tone.js CrossFade documentation](https://tonejs.github.io/docs/14.7.58/CrossFade) — HIGH confidence (official docs)
- [Transition effect between multiple scenes — Three.js forum](https://discourse.threejs.org/t/transition-effect-between-multiple-scenes/68128) — MEDIUM confidence (community discussion)
- [Advanced scroll-based particle transitions using WebGL simulation shader | Loopspeed](https://blog.loopspeed.co.uk/fbo-particles-simulation) — MEDIUM confidence

---
*Architecture research for: scroll-driven cinematic web experience / life memoir*
*Researched: 2026-03-10*
