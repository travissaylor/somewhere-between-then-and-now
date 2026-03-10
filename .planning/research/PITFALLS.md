# Pitfalls Research

**Domain:** Scroll-driven cinematic web experience (3D, shader transitions, reactive audio)
**Researched:** 2026-03-10
**Confidence:** HIGH (critical pitfalls verified against official docs and active community reports)

---

## Critical Pitfalls

### Pitfall 1: GSAP ScrollTrigger and Drei ScrollControls are mutually exclusive

**What goes wrong:**
If you use `@react-three/drei`'s `<ScrollControls>` for the R3F canvas scroll layer AND GSAP `ScrollTrigger` for DOM-level animation triggers, they maintain separate, competing scroll states. Scroll position becomes desynchronized — the 3D scene's progress and the DOM animations reference different values, causing visual tearing between layers.

**Why it happens:**
Drei's `ScrollControls` creates its own internal scroll container with a virtual scroll offset it controls directly. GSAP ScrollTrigger listens to the browser's native scroll position on `window` or a separate element. The two never agree on where the user is in the experience.

**How to avoid:**
Choose one scroll authority for the entire project. For this project, use **GSAP ScrollTrigger as the sole scroll authority**. Derive all R3F animation state (camera position, uniform values, object transforms) from ScrollTrigger's `progress` value, passed into R3F via refs mutated in `useFrame`. Do not use Drei `<ScrollControls>` at all.

**Warning signs:**
- 3D scene lags behind DOM transitions during fast scrolling
- Shader transition progress and DOM overlay timing are offset by a fixed amount
- Scroll position appears correct in one layer but wrong in another

**Phase to address:** Foundation phase — must be resolved before any era content is built. The scroll architecture is load-bearing for everything else.

---

### Pitfall 2: AudioContext created on page load is immediately suspended

**What goes wrong:**
All major browsers (Chrome, Firefox, Safari) enforce an autoplay policy that suspends any `AudioContext` created before a user gesture. If you initialize Tone.js or the Web Audio API at module load time or in a React effect on mount, the context starts in `suspended` state and audio never plays — silently, with no error thrown.

**Why it happens:**
Browser autoplay policies require audio to be initiated by a user-initiated event. The browser treats `AudioContext` creation or `.resume()` calls outside a gesture handler as unauthorized. The `AudioContext.state` property will read `"suspended"` and all scheduled audio will queue but never output.

**How to avoid:**
Gate all audio initialization behind the first user interaction. For this project — where scroll is the only control — the first scroll event should trigger `audioContext.resume()` if state is `"suspended"`. Show a minimal "scroll to begin" prompt on load to ensure a gesture precedes the audio setup. Never create the `AudioContext` in a module-level `const` or top-level component render.

**Warning signs:**
- Console warning: "The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page."
- Audio plays in dev mode (where you've already interacted) but not in production first-load
- Tone.js transport starts but produces no output

**Phase to address:** Audio foundation phase — must be solved before any audio stem work begins.

---

### Pitfall 3: GLSL shader compilation causes visible stutter on first transition

**What goes wrong:**
Each unique shader material in Three.js is compiled by the GPU driver the first time it's rendered. With 5 major shader transitions and per-era post-processing, first playthrough will stutter at each transition as the GPU compiles the programs. This is especially severe on Windows with NVIDIA drivers and on lower-end laptops.

**Why it happens:**
WebGL defers final shader compilation until first draw call. Scene initialization pays nothing; the user pays at the worst possible moment — during an emotionally significant transition.

**How to avoid:**
Warm up all shader materials during the loading screen before the experience starts. Create a 1x1 off-screen render pass that draws each shader material once, forcing compilation before the user reaches that transition. The `renderer.compile(scene, camera)` method in Three.js was added specifically for this. Run it against all materials during the loading phase, not during render.

**Warning signs:**
- First time a transition plays it stutters; subsequent replays are smooth
- Frame time spike (visible in browser performance profiler) at the exact frame a new material first renders
- The loading screen completes quickly but first transitions feel janky

**Phase to address:** Performance/polish phase — but shader warmup scaffolding should be part of the initial render setup, not retrofitted.

---

### Pitfall 4: React state updates inside useFrame destroy R3F performance

**What goes wrong:**
Calling `setState` (from `useState`, Zustand store setters, or React context dispatch) inside a `useFrame` callback routes animation updates through React's scheduler. React batches and reconciles these — adding 16ms+ overhead to every frame update. At 60fps this is catastrophic: the render loop fights the React reconciler for the same frame budget.

**Why it happens:**
Developers accustomed to React patterns reach for state when they need to communicate scroll progress to 3D objects. This feels correct in React but `useFrame` runs inside the WebGL render loop, not inside React's update cycle.

**How to avoid:**
Never call `setState` inside `useFrame`. Use `useRef` to hold scroll progress and mutable scene values. Mutate refs directly in scroll callbacks. Inside `useFrame`, read from refs and apply values directly to Three.js objects (`mesh.current.position.x = ref.current.scrollProgress * 100`). For cross-component communication, use a Zustand store with the `getState()` getter (not the hook) inside `useFrame`.

**Warning signs:**
- React DevTools Profiler shows frequent renders triggered by animation (not user events)
- Frame rate drops sharply when the 3D scene is visible
- `useFrame` callback duration spikes in profiler

**Phase to address:** Foundation phase — the pattern must be established in the first R3F component and enforced consistently.

---

### Pitfall 5: WebGL resource leak from unmounted era components

**What goes wrong:**
Three.js geometries, materials, and textures allocated in GPU memory are not automatically garbage-collected when React components unmount. If eras are implemented as separate React components that mount/unmount as the user scrolls, every transition leaks GPU memory. On a 13-era experience with photos, this will exhaust VRAM on integrated graphics systems.

**Why it happens:**
JavaScript GC handles CPU memory but has no visibility into WebGL buffers, texture memory, or shader programs. Three.js objects must call `.dispose()` explicitly. React's `useEffect` cleanup is the correct place but easy to forget, especially for complex GLTF scenes and multi-texture materials.

**How to avoid:**
Never unmount era components — use `visible={false}` to hide inactive eras. Preload all textures via `useLoader` (which caches globally) during the loading phase. If eras must unmount, implement a `useEffect` cleanup that traverses the scene graph and calls `.dispose()` on every geometry and material. For post-processing passes, use `@react-three/postprocessing` which handles disposal automatically.

**Warning signs:**
- GPU memory usage (visible in Chrome's Task Manager or `chrome://gpu`) grows continuously as user scrolls through eras
- Performance degrades after the full experience has been scrolled through once
- `GL_OUT_OF_MEMORY` errors in console on low-VRAM devices

**Phase to address:** Per-era scene implementation phase — establish the visibility pattern early, not after all 13 eras are built.

---

### Pitfall 6: Post-processing passes as separate render passes for each era effect

**What goes wrong:**
Implementing film grain, color grading, vignette, and chromatic aberration as separate EffectComposer passes — one per effect — multiplies the number of full-screen render passes. Each pass reads and writes the framebuffer. At 5+ effects across 13 eras this means 5+ full-screen quad renders per frame, easily halving frame rate.

**Why it happens:**
The default EffectComposer pattern is one effect per pass, which is simple to implement. Developers stack effects because they work in isolation. The GPU cost isn't visible until all effects are active simultaneously.

**How to avoid:**
Merge all per-era effects (grain, grading, vignette, aberration) into a single custom `ShaderMaterial` or use `@react-three/postprocessing`'s `Effect` API which automatically merges compatible effects into one pass. Film grain in particular: only recompute noise every 2-3 frames (it's temporal noise, not spatially coherent). Use uniforms to blend between era-specific color grades rather than switching entire passes.

**Warning signs:**
- Frame time increases linearly with each post-processing effect added
- GPU utilization near 100% even on simple scenes when effects are enabled
- Chrome Performance profiler shows multiple "GPU Present Frame" entries per rAF cycle

**Phase to address:** Per-era visual development — before building the second era, establish the merged-pass pattern.

---

### Pitfall 7: Scroll distance mapped uniformly across all 13 eras

**What goes wrong:**
Dividing total scroll height into 13 equal segments feels technically clean but creates a broken emotional experience. Some eras (major transitions like the divorce, the breakup) need long, slow scroll to breathe. Others (brief transitional eras) should pass quickly. Uniform mapping forces the user to scroll at the wrong pace for the emotional content.

**Why it happens:**
Programmers default to even distribution. Emotional pacing requires authorial intent mapped into specific scroll distances per era, which feels arbitrary and requires iteration.

**How to avoid:**
Define explicit scroll weight per era in a configuration object before writing any animation code. Weight should reflect emotional density, not time-in-life. Major transitions get 2x-3x the scroll distance of connective tissue eras. Build the pacing map first, test it by scrolling through placeholder content, then implement animation against those fixed values.

**Warning signs:**
- User testing shows people rushing through moments that should feel heavy
- Transitions complete before the user has time to notice them
- The experience feels mechanical rather than felt

**Phase to address:** Scroll architecture design phase — before any era-specific content is implemented.

---

### Pitfall 8: Audio crossfading driven directly by scroll events (not scroll progress)

**What goes wrong:**
Attaching audio crossfade logic to the scroll event fires it hundreds of times per second during active scrolling. Each event either triggers an audio graph change directly (causing clicks and pops from discontinuous gain changes) or throttled updates that make audio lag behind visual position. The result is audible artifacts or audio/visual desync.

**Why it happens:**
Developers wire scroll → audio the same way they wire scroll → CSS properties. Audio gain changes must be scheduled on the audio timeline, not the DOM event loop. Abrupt gain changes at audio sample boundaries cause clicks. Ignoring the sample-rate scheduling model makes audio reactive audio feel wrong.

**How to avoid:**
Never set audio gain values imperatively from scroll events. Instead, in the rAF/useFrame loop, read current scroll progress, calculate target gain values for each stem, and use `gainNode.gain.linearRampToValueAtTime(target, audioContext.currentTime + 0.05)` to schedule smooth ramps 50ms ahead. This separates scroll's high-frequency position reads from the audio scheduler's sample-accurate timeline.

**Warning signs:**
- Audible clicks or pops when scrolling quickly between eras
- Audio level changes feel slightly behind or ahead of the visual transitions
- CPU spikes when scrolling fast (too many audio graph operations)

**Phase to address:** Audio integration phase — the scheduling pattern must be established before audio stems are mixed.

---

### Pitfall 9: Next.js SSR attempting to render WebGL canvas on the server

**What goes wrong:**
Next.js server-renders all components by default. `@react-three/fiber`'s `<Canvas>` and all WebGL initialization (`THREE.WebGLRenderer`, `AudioContext`, `window`, `document`) fail on the server because those browser APIs don't exist in Node.js. This produces a hydration mismatch or a hard build error.

**Why it happens:**
Next.js App Router's default is React Server Components. Three.js is fundamentally browser-only. Developers forget to mark the canvas component as client-only, especially when wrapping it in layout components.

**How to avoid:**
All R3F components must be marked `'use client'` (App Router) or wrapped in `dynamic(() => import(...), { ssr: false })` (Pages Router). The root experience component that contains the canvas should be the boundary. Keep this component thin — it only renders the canvas. All data, configuration, and asset definitions can live in server components or static files outside it.

**Warning signs:**
- Build error: "document is not defined" or "window is not defined"
- Hydration warnings in console about mismatched server/client HTML
- Canvas flashes on first load as client hydration replaces server-rendered placeholder

**Phase to address:** Foundation phase — the first day of setup.

---

### Pitfall 10: Object creation in useFrame (new Vector3, new Color every frame)

**What goes wrong:**
Creating `new THREE.Vector3()`, `new THREE.Color()`, or any heap-allocated object inside `useFrame` runs at 60fps. Each allocation triggers JavaScript garbage collection. GC pauses are unpredictable — they manifest as random frame drops of 5-50ms, producing the stuttery feeling users describe as "almost smooth but not quite."

**Why it happens:**
It's natural to write `mesh.position.lerp(new THREE.Vector3(x, y, z), 0.1)` because it reads clearly. The performance cost isn't visible in small scenes but compounds with 13 eras worth of animated objects.

**How to avoid:**
Pre-allocate and reuse all transient objects at module scope or via `useRef`. Use `vec.set(x, y, z)` to update existing vectors in place. Use `color.setHex(0xffffff)` instead of `new THREE.Color(0xffffff)`. Profile with Chrome's Memory tab — the key signal is a sawtooth allocation graph during animation.

**Warning signs:**
- Frame time is on average 16ms but has frequent 20-40ms spikes
- Chrome Memory profiler shows regular GC events during scroll
- Performance is worse after the experience has been running for a few minutes

**Phase to address:** Any phase involving per-frame animation — establish the pattern in the first animated era.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| One ScrollTrigger per era (13 total) | Simple to reason about | Calculation order conflicts from pinned sections; refresh issues | Never — use a single progress value with era boundaries |
| Separate EffectComposer pass per era effect | Easy to toggle effects | 5+ full-screen passes per frame; frame rate collapse | Never for this project — merge into single pass |
| `useState` for scroll-driven values | Familiar React pattern | React reconciler runs 60x/second; destroys frame budget | Never in render loop |
| JPEG photos without compression pipeline | No tooling needed | 13 eras of photos at full resolution exhausts bandwidth and VRAM | Never — basis/webp compression is non-negotiable |
| Mount/unmount era components | Clear component lifecycle | GPU memory leak; VRAM exhaustion on long sessions | Never — use visibility toggling |
| `AudioContext` in module scope | Simple initialization | Suspended on first load in all browsers; silent failure | Never — gate behind user gesture |
| Equal scroll distance per era | No pacing decisions needed | Wrong emotional rhythm; experience feels mechanical | Acceptable only for a scrollable prototype/placeholder |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GSAP ScrollTrigger + R3F | Using `drei/ScrollControls` alongside ScrollTrigger | Use ScrollTrigger only; read progress in `useFrame` via ref |
| Tone.js + scroll | Setting gain values in scroll event callbacks | Schedule gain ramps via `linearRampToValueAtTime` in rAF loop |
| Next.js + R3F | Canvas component rendered as RSC or without `ssr: false` | `'use client'` directive + `dynamic(() => import, { ssr: false })` |
| R3F + `useLoader` | Creating `new TextureLoader()` inside components | Always use `useLoader(TextureLoader, url)` for caching |
| Post-processing + era switching | Swapping EffectComposer passes at era boundaries | Use uniform blending within a single merged pass |
| R3F + Zustand store | Using `useStore(selector)` hook inside `useFrame` | Use `useStore.getState().value` (getter, not hook) inside `useFrame` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Shader compilation on first render | Stutter on first playthrough of each major transition | Pre-compile all materials during loading screen via `renderer.compile()` | Immediate — first user to experience each transition |
| Too many draw calls per era | Frame time climbs per added 3D object | Merge geometries, use instancing, limit unique materials per era | Varies by device; integrated GPU breaks at ~200 unique draw calls |
| Uncompressed photo textures | Long load time; VRAM exhaustion | Basis Universal / webp compression; power-of-two dimensions | First user on slow connection or integrated GPU |
| Film grain recomputed every frame | Significant GPU load even on idle scenes | Recompute noise texture every 2-3 frames; use uniform time dilation | Immediately on lower-end hardware |
| Multiple audio stems all active simultaneously | CPU load from Web Audio graph processing | Keep inactive era stems at gain 0 but loaded; only fully active era runs full routing | Audible degradation at ~8+ simultaneously active stems |
| React renders triggered by scroll | Frame budget consumed by reconciler | All scroll-driven values live in refs, never in state | Any scene with >5 animated objects |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual indication experience has audio | User scrolls in silence thinking audio is a bug | Minimal "sound on" affordance visible at start prompt |
| Transitions complete too fast on fast scrollers | Emotional moments missed by power users | Cap scroll velocity's effect on transition progress; transitions have minimum duration |
| No loading indicator before heavy assets | User sees blank canvas or partial scene on load | Full loading screen with progress; experience only starts when all era-1 assets are ready |
| Scroll hijacking without orientation | Users don't know how long the experience is | A minimal progress indicator (thin line, not text) grounds user in the full length |
| Audio/video abrupt on tab visibility change | Audio continues when user switches tabs; jarring on return | Listen to `visibilitychange` event; suspend audio context when hidden, resume on return |
| "Looks great on my machine" — built only on high-end GPU | Experience is slideshow on integrated graphics | Test on MacBook Air M-series (integrated GPU) as minimum viable target throughout development |

---

## "Looks Done But Isn't" Checklist

- [ ] **Shader transitions:** Warm-up compile run during loading — verify no stutter on first playthrough after hard refresh
- [ ] **Audio initialization:** Test in a fresh Chrome tab with no prior interaction — verify audio does not auto-start and resumes on first scroll
- [ ] **GPU memory:** Scroll through all 13 eras twice — verify Chrome Task Manager GPU memory does not grow across full passes
- [ ] **Scroll authority:** Verify ScrollTrigger and no Drei ScrollControls present — check for console warnings about conflicting scroll containers
- [ ] **Post-processing:** Count EffectComposer render passes — verify all per-era effects merged into single pass, not one pass per effect
- [ ] **SSR safety:** `next build` completes without "window is not defined" errors — verify canvas is behind `dynamic` with `ssr: false`
- [ ] **Mobile guard:** Verify experience shows a "best experienced on desktop" message on viewports under 768px rather than attempting to render broken 3D
- [ ] **Tab visibility:** Switch tabs during audio playback — verify audio suspends and resumes correctly without desync

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| GSAP + ScrollControls conflict discovered mid-project | HIGH | Audit every scroll consumer; extract unified progress ref; rewire all animations to single source |
| GPU memory leak discovered after all 13 eras built | HIGH | Audit every era component; replace unmount patterns with visibility; add disposal cleanup to all useEffect returns |
| ScrollTrigger creation order bugs after all eras wired | MEDIUM | Add `refreshPriority` to all triggers in scroll order; call `ScrollTrigger.refresh()` after layout changes |
| Audio clicks/pops from direct gain setting | MEDIUM | Replace all direct `.value =` gain assignments with `linearRampToValueAtTime` calls |
| Shader compile stutter discovered in QA | MEDIUM | Add `renderer.compile()` pass in loading screen against all scene materials |
| Post-processing frame rate collapse | MEDIUM | Refactor separate passes into merged custom Effect; merge color grade + grain + vignette uniforms |
| AudioContext suspended on production | LOW | Add `audioContext.resume()` call in first-scroll handler; add state check before all audio operations |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| GSAP + ScrollControls conflict | Scroll architecture (Phase 1) | Single `scrollProgress` ref feeds all animation; no Drei ScrollControls in codebase |
| AudioContext suspended | Audio foundation (Phase 2) | Fresh-tab load test plays audio on first scroll |
| Shader compile stutter | Loading + warmup (Phase 1 infra) | Hard refresh + full scroll shows no frame spikes at transitions |
| setState in useFrame | Foundation (Phase 1) | React DevTools Profiler shows zero renders triggered by scroll events |
| GPU memory leak | Per-era scene setup (Phase 2) | GPU memory stable after two full passes through experience |
| Post-processing pass explosion | Second era implementation (Phase 3) | EffectComposer pass count verified at 1 (merged) |
| Scroll distance pacing | Pacing design (before Phase 2) | Scroll weight config document reviewed before any era animation is coded |
| Audio scheduling clicks | Audio integration (Phase 2) | No audible artifacts during rapid scroll through era boundaries |
| Next.js SSR conflict | Project setup (Day 1) | `next build` clean; no hydration warnings in production |
| Object allocation in useFrame | First animated era (Phase 2) | No GC sawtooth in Memory profiler during 60s scroll session |

---

## Sources

- [React Three Fiber: Performance Pitfalls (official docs)](https://r3f.docs.pmnd.rs/advanced/pitfalls) — HIGH confidence
- [GSAP ScrollTrigger: Tips & Mistakes (official)](https://gsap.com/resources/st-mistakes/) — HIGH confidence
- [GSAP community: ScrollTrigger pin and drei's ScrollControls don't play well together](https://gsap.com/community/forums/topic/40114-scrolltrigger-pin-and-dreis-scrollcontrols-dont-play-well-together/) — HIGH confidence
- [MDN: Autoplay guide for media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) — HIGH confidence
- [MDN: Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — HIGH confidence
- [Three.js forum: Reducing shader compile time on scene initialization](https://discourse.threejs.org/t/reducing-shader-compile-time-on-scene-initialization/56572) — MEDIUM confidence
- [Three.js forum: Memory leak when Canvas scrolled out of view](https://discourse.threejs.org/t/r3f-threejs-memory-leak-when-canvas-is-scrolled-out-of-view/48440) — MEDIUM confidence
- [Medium: Filmic Effects in WebGL — post-processing with ThreeJS](https://medium.com/@mattdesl/filmic-effects-for-webgl-9dab4bc899dc) — MEDIUM confidence
- [Three.js forum: Top Texture Optimization Techniques](https://moldstud.com/articles/p-top-texture-optimization-techniques-for-boosting-threejs-application-performance) — MEDIUM confidence
- [Composite: Designing for Attention in an Age of Scroll Fatigue](https://www.composite.global/news/scroll-fatigue-and-the-case-for-digital-pacing) — MEDIUM confidence
- [GitHub: pmndrs/postprocessing — merged effect passes](https://github.com/pmndrs/postprocessing) — HIGH confidence
- [Medium: Reducing Shader Warmup Stutter with Precompiled Shaders (Feb 2026)](https://medium.com/tech-vibes/reducing-shader-warmup-stutter-with-precompiled-shaders-e8dd68b525f5) — MEDIUM confidence

---
*Pitfalls research for: scroll-driven cinematic web experience (13-era life memoir)*
*Researched: 2026-03-10*
