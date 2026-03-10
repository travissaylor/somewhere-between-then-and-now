# Feature Research

**Domain:** Scroll-driven cinematic web experience / life memoir
**Researched:** 2026-03-10
**Confidence:** HIGH (core scroll/WebGL/audio features), MEDIUM (post-processing specifics, accessibility tradeoffs)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Smooth scroll-to-progress mapping | Scroll is the only control — any jank breaks immersion immediately | HIGH | GSAP ScrollTrigger with `scrub: 1` or `scrub: 2`; ScrollSmoother for inertia. Must call `ScrollTrigger.refresh()` after first render to avoid layout misalignment |
| Asset preloading / loading screen | Heavy WebGL scenes, audio stems, and photo textures require load time; dropping users into a half-loaded scene destroys the effect | MEDIUM | Show a minimal loading state before revealing the experience; canvas and audio context can be initialized during load |
| User gesture gate for audio | All modern browsers (Chrome, Firefox, Safari) require user interaction before playing audio; AudioContext starts in `suspended` state if created before gesture | LOW-MEDIUM | A single click/scroll to "enter" serves as the gesture; resume AudioContext on that event. This is mandatory, not optional |
| Visual continuity across eras | Users expect scene transitions to feel intentional, not glitchy; jarring cuts break the narrative | HIGH | Per-era shader transitions that morph rather than hard-cut; GLSL fragment shader blend between era palettes |
| Consistent 60fps performance | A scroll-driven experience that stutters feels broken; performance is perceived as quality | HIGH | GPU texture compression, draw call minimization, dispose of Three.js geometries/materials when scenes exit viewport |
| Desktop/tablet viewport support | The experience is designed for larger screens; it should not visually break on tablet | MEDIUM | CSS breakpoints for canvas sizing; R3F camera FOV adjustments for narrower tablet viewports |
| Accessible entry/exit points | Some users scroll with keyboard, some with trackpad — all must be able to enter and leave the experience | MEDIUM | Do not trap focus inside the scroll container; provide a way to reach the browser address bar; respect OS scroll speed |
| `prefers-reduced-motion` respect | Users with vestibular disorders can trigger nausea from continuous motion; WCAG 2.1 SC 2.3.3 applies | MEDIUM | When `prefers-reduced-motion: reduce` is set, still expose content but disable parallax, camera fly-through, and shader morphing. The narrative should still be accessible as a static sequence |

### Differentiators (Competitive Advantage)

Features that set this work apart. Not universally expected, but these are where the piece earns its emotional impact.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Per-era GLSL shader identity | Each of the 13 eras has its own visual language at the shader level — not just color palette changes, but different noise patterns, grain structure, and light behavior | HIGH | Fragment shaders per era; transition shaders for the 5 major transitions; `pmndrs/postprocessing` library integrates cleanly with R3F |
| Scroll-reactive audio crossfading | Audio stems fade in/out based on scroll position, not time; the user's scroll pace changes the emotional texture of the sound | HIGH | Tone.js or raw Web Audio API gain nodes interpolated against scroll progress (0–1); 13 audio zones with overlap zones for crossfade; latency and buffer management are critical |
| Real photo/video integration into 3D | Personal photographs and video footage are projected into the 3D environment with era-matched color grading — not floating overlays, but part of the scene | HIGH | Three.js `VideoTexture` for video; image textures with GLSL color grading pass per era; blend between photographic and painterly treatment to serve emotional truth |
| Film grain and cinematic post-processing per era | Grain is not decoration — it is temporal. Childhood eras get heavy grain (analog); later eras get cleaner grain or different noise types | MEDIUM | `postprocessing` EffectComposer with per-era `NoiseEffect`/`FilmEffect` configuration; combine into single render pass for performance |
| Scene transition as emotional centerpiece | The 5 major life transitions (Parents' Divorce, College, First Apartment, The Breakup, Pittsburgh) are not cross-fades — they are distinct shader events with their own visual language | HIGH | Per-transition GLSL programs; trigger via ScrollTrigger scrub pinned sections; each transition needs a dedicated pinned scroll range |
| The lamp as recurring continuity anchor | A single object (the lamp) traveling across eras 8–9 provides emotional coherence across visual discontinuity | MEDIUM | A Three.js mesh with consistent geometry; material adapts per-era; GSAP-driven position/opacity transitions tied to scroll |
| Camera path animation through 3D space | Scroll drives a camera through the 3D scene rather than a flat parallax layer — creates genuine depth and spatial presence | HIGH | Three.js `CatmullRomCurve3` or keyframed camera positions; GSAP ScrollTrigger maps scroll progress to camera `t` value along path |
| Color grading as emotional notation | Each era's color grade is chosen for emotional truth, not consistency — warm amber for childhood, desaturated blue-grey for fracture, blown-out whites for rupture | MEDIUM | Per-era `ColorCorrectionEffect` or custom GLSL LUT pass; must be swapped cleanly at era boundaries without visible pop |
| Ending on an unfinished horizon | The final scene does not resolve — it opens outward. Most narrative web experiences end with a call-to-action; this one ends with ambiguity | LOW (concept), HIGH (execution) | The final 3D environment is a horizon line with no endpoint rendered; camera movement slows but never fully stops; audio fades but does not silence |

### Anti-Features (Commonly Requested, Often Problematic)

Features to deliberately exclude.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Navigation menu / chapter select | Seems helpful for returning visitors; standard on long-form web content | Destroys the scroll-as-time metaphor; letting users jump to "Era 9" removes the emotional accumulation that makes Era 9 land. This is not a website to navigate — it is a film to experience | None — accept that returning visitors must re-scroll. Consider a persistent scroll position via `sessionStorage` so the browser restores position on reload |
| Text narration / captions overlaid on scenes | Natural impulse to explain what each era means; seems more accessible | "No narrator. The world speaks." — narration would compete with the visual/audio language and flatten the emotional interpretation space. It also creates a literal layer on top of an experiential one | Trust the visuals and audio. If a detail needs explanation, put it on a separate static "about" page, not inside the experience |
| User-controlled audio toggle / volume slider | Standard accessibility best practice for audio on the web | While a mute button is reasonable, a full audio control UI introduces chrome that breaks immersion and implies the sound is optional decoration. The audio is load-bearing | Provide a single unobtrusive mute toggle (keyboard shortcut `M` or a minimal icon that fades after interaction); do not build a mixer or volume UI |
| Mobile phone optimization | Mobile is where most web traffic is; seems like a missed audience | The cinematic experience requires a viewport wide enough to experience 3D spatial depth and post-processing effects. Mobile GPU constraints and touch-scroll behavior make the scrub unreliable. A degraded mobile version would be worse than no mobile version | Add a graceful "best experienced on desktop or tablet" redirect for phone-width viewports |
| CMS / content management system | Seems like good engineering to make content editable | This is a single fixed art object, not a publication. A CMS adds infrastructure complexity for zero editorial gain. Content changes should require a code deploy — that friction is intentional | Static assets committed to the repository |
| Social sharing / Open Graph metadata beyond basics | Seems like growth marketing best practice | This is a personal art object, not a product or publication. Heavy social optimization signals the wrong intent to viewers | Minimal OG tags (title, description, one image) for link previews; no share buttons inside the experience |
| Interactive branching or user choices | Some narrative web experiences let users choose paths | Scroll is the only control by design. Choices would introduce state management complexity and fragment the emotional arc the piece is built around | The piece is a linear experience; its linearity is the point |
| Parallax-only implementation (no shader transitions) | Parallax is the simplest scroll effect; frameworks support it natively | Parallax alone produces depth but not emotional transformation. Eras must feel like distinct worlds, not just layers at different scroll speeds. Parallax is a component of some eras, not the primary technique | Use GLSL shader morphing for era transitions; parallax layers can exist within eras as supporting technique |

## Feature Dependencies

```
[Scroll-to-Progress Engine]
    └──required by──> [Per-Era Visual Environment]
    └──required by──> [Scroll-Reactive Audio Crossfading]
    └──required by──> [Camera Path Animation]
    └──required by──> [Scene Transition Shader Events]

[Asset Preloading]
    └──required by──> [Real Photo/Video Integration]
    └──required by──> [Per-Era Audio Stems]
    └──required by──> [3D Scene Rendering]

[User Gesture Gate]
    └──required by──> [Scroll-Reactive Audio Crossfading]
    (audio cannot start without it — browser policy)

[Per-Era GLSL Shader Identity]
    └──enhances──> [Color Grading as Emotional Notation]
    └──enhances──> [Film Grain Post-Processing]
    └──required by──> [Scene Transition Shader Events]

[Scene Transition Shader Events]
    └──enhances──> [The Lamp Continuity Anchor]
    (lamp appears across eras that include a major transition)

[Camera Path Animation]
    └──conflicts──> [Parallax-only Implementation]
    (camera path requires 3D scene; parallax works on flat DOM layers)

[prefers-reduced-motion]
    └──conflicts with──> [Camera Path Animation] (must disable)
    └──conflicts with──> [Scene Transition Shader Events] (must simplify)
    └──partially conflicts with──> [Film Grain] (can reduce intensity)
```

### Dependency Notes

- **Scroll-to-Progress Engine is the root dependency:** Everything else in the experience — audio, visuals, camera, transitions — derives its timing from scroll progress (0 to 1 per section). Build and stabilize this engine before building anything else.
- **User Gesture Gate blocks audio start:** The Web Audio API `AudioContext` will be in `suspended` state on page load. The "enter" interaction (first scroll or click) must call `audioCtx.resume()`. All audio stem loading can happen before this gate, but playback cannot begin until after.
- **Asset preloading must complete before scroll unlocks:** Users should not be able to scroll into an era whose 3D assets or audio haven't loaded. The scroll container should be locked (pointer-events: none; overflow: hidden) until preload resolves.
- **Camera path animation requires 3D scene:** Camera movement through space only works if eras are rendered as 3D environments. This decision was made in the creative brief; it forecloses parallax-only approaches.
- **prefers-reduced-motion creates a content parity requirement:** The narrative must still communicate without motion. This means the visual content of each era (photos, text if any, audio) must be meaningful independent of the cinematic effects layered on top.

## MVP Definition

### Launch With (v1)

Minimum viable for the piece to exist as intended:

- [ ] Scroll engine — GSAP ScrollTrigger scrub mapping scroll to progress across all 13 eras
- [ ] Asset preloading with loading gate — prevents entering broken scenes
- [ ] User gesture gate for audio — mandatory browser compliance
- [ ] Per-era 3D environment (at least geometry + lighting; shaders can be simplified for early builds)
- [ ] Scroll-reactive audio crossfading across 13 zones (stems loaded; gain interpolated against scroll)
- [ ] 5 major transition shader events — these are the emotional core of the piece
- [ ] Film grain + color grading per era — table stakes for the cinematic feeling
- [ ] Real photo integration for key eras (not all 13 need photos for v1 — prioritize the emotionally critical eras)
- [ ] The lamp (eras 8–9) — continuity anchor
- [ ] Desktop and tablet responsive layout
- [ ] `prefers-reduced-motion` fallback (even a minimal one — static sequence of era images)
- [ ] Graceful phone-width redirect

### Add After Validation (v1.x)

- [ ] Camera path animation — adds spatial depth; complex to build; validate the simpler version first
- [ ] Full photo/video integration for all 13 eras (v1 may use placeholder textures for some)
- [ ] Session position restore via `sessionStorage` — let returning visitors resume
- [ ] Performance optimization pass — texture compression, draw call audit, memory leak audit
- [ ] Keyboard mute shortcut (`M`)

### Future Consideration (v2+)

- [ ] Per-era ambient sound layering (environmental audio on top of music stems) — adds texture, complex to mix
- [ ] Soft WebGL degradation for low-end GPUs (simplified shader fallback) — detect GPU tier and reduce post-processing
- [ ] Additional inter-era photo/video integration as new assets are produced

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Scroll engine (GSAP ScrollTrigger) | HIGH | MEDIUM | P1 |
| Asset preloading / loading gate | HIGH | MEDIUM | P1 |
| User gesture gate for audio | HIGH | LOW | P1 |
| Per-era 3D environment | HIGH | HIGH | P1 |
| 5 major transition shader events | HIGH | HIGH | P1 |
| Scroll-reactive audio crossfading | HIGH | HIGH | P1 |
| Film grain + color grading per era | HIGH | MEDIUM | P1 |
| Real photo/video integration | HIGH | MEDIUM | P1 |
| The lamp continuity anchor | MEDIUM | MEDIUM | P1 |
| Desktop + tablet layout | HIGH | LOW | P1 |
| `prefers-reduced-motion` fallback | MEDIUM | MEDIUM | P1 |
| Camera path animation | HIGH | HIGH | P2 |
| Session position restore | MEDIUM | LOW | P2 |
| Performance optimization pass | HIGH | MEDIUM | P2 |
| Ambient sound layering | MEDIUM | HIGH | P3 |
| Low-GPU shader fallback | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Typical scrollytelling site | Editorial web narrative (NYT/NRK style) | This project's approach |
|---------|---------------------------|----------------------------------------|------------------------|
| Scroll control | Parallax + pin sections | Scroll-triggered reveals, some video scrub | Full 3D + shader + audio all scrub-driven |
| Audio | Optional background music | Usually none or embedded audio players | Load-bearing audio stems, scroll-reactive mixing |
| Transitions | CSS cross-fades, slide-ins | Fade between sections | GLSL shader morphing per major transition |
| Visual language | Consistent brand aesthetic | Editorial typography + photography | Distinct visual world per era, no consistent aesthetic |
| Post-processing | Rarely | Never | Film grain, color grading, vignette per era |
| Personal narrative | Rare | Common (journalism) | A single person's life, not a journalistic subject |
| Ending | CTA or summary | Article end | Unresolved horizon — intentionally open |

## Sources

- [How to Build Cinematic 3D Scroll Experiences with GSAP — Codrops, November 2025](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/)
- [How to Create Distortion and Grain Effects on Scroll with Shaders in Three.js — Codrops, 2024](https://tympanus.net/codrops/2024/07/18/how-to-create-distortion-and-grain-effects-on-scroll-with-shaders-in-three-js/)
- [WebGL Shader Techniques for Dynamic Image Transitions — Codrops, January 2025](https://tympanus.net/codrops/2025/01/22/webgl-shader-techniques-for-dynamic-image-transitions/)
- [GSAP ScrollTrigger Docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Web Audio API Best Practices — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Autoplay Guide for Media and Web Audio APIs — MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- [Animation and Motion Accessibility — web.dev](https://web.dev/learn/accessibility/motion)
- [Understanding WCAG 2.1 SC 2.3.3: Animation from Interactions — W3C](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [How NRK Uses Scroll-Driven Animations — Chrome for Developers](https://developer.chrome.com/blog/nrk-casestudy)
- [Scrolljacking 101 — Nielsen Norman Group](https://www.nngroup.com/articles/scrolljacking-101/)
- [pmndrs/postprocessing — GitHub](https://github.com/pmndrs/postprocessing)
- [react-kino: Cinematic Scroll-Driven Storytelling — GitHub](https://github.com/btahir/react-kino)
- [Optimizing GSAP Animations in Next.js 15 — Medium](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232)
- [WebGL Best Practices — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

---
*Feature research for: scroll-driven cinematic web experience / life memoir*
*Researched: 2026-03-10*
