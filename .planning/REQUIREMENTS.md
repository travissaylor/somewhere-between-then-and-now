# Requirements: Somewhere Between Then and Now

**Defined:** 2026-03-10
**Core Value:** Make someone who did not live this life feel, for a moment, that they did — through scroll-driven immersion where every visual, audio, and transition choice serves emotional truth.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Next.js app bootstrapped with React Three Fiber canvas that renders without SSR errors
- [x] **FOUND-02**: Lenis smooth scroll integrated with GSAP ScrollTrigger as sole scroll authority
- [x] **FOUND-03**: Scroll-to-progress engine produces normalized globalProgress (0–1), currentEra (0–12), and eraProgress (0–1) values
- [x] **FOUND-04**: Zustand era store distributes scroll state to all consuming systems
- [x] **FOUND-05**: Per-era scroll weight config allows different eras to occupy different scroll distances (major transitions get 2–3x)
- [x] **FOUND-06**: Desktop and tablet responsive layout with fixed-position R3F canvas

### Render Pipeline

- [x] **RNDR-01**: RenderTarget A/B compositor renders two era scenes off-screen simultaneously during transitions
- [x] **RNDR-02**: Single EffectComposer applies all per-era post-processing in one merged GPU pass
- [x] **RNDR-03**: Visibility-based scene management (never unmount/remount era components) to prevent VRAM leaks
- [x] **RNDR-04**: Shader warmup via renderer.compile() during loading screen to prevent first-transition stutter
- [x] **RNDR-05**: Asset preloading with loading gate that blocks scroll until era assets are ready
- [x] **RNDR-06**: Predictive N+1 asset loading and N-2 disposal for memory management

### Audio

- [x] **AUDO-01**: User gesture gate resumes AudioContext on first scroll/interaction (browser autoplay compliance)
- [x] **AUDO-02**: Tone.js audio graph with CrossFade nodes driven by eraProgress for scroll-reactive mixing
- [x] **AUDO-03**: Gain scheduled via linearRampToValueAtTime (not direct .value assignment) to prevent click artifacts
- [x] **AUDO-04**: 13 audio zones with crossfade overlap regions between adjacent eras
- [x] **AUDO-05**: Audio suspends on tab visibility change and resumes on return
- [x] **AUDO-06**: Graceful fallback for missing audio stems (experience works without audio if stems unavailable)

### Era Environments

- [ ] **ERA-01**: Era 01 (Being Born) — abstract warm light, formless shapes, heartbeat rhythm, grows from darkness
- [ ] **ERA-02**: Era 02 (Early Childhood) — Super 8 grain, backyard diorama, birds/screen door audio, grass green/sky blue/golden hour
- [ ] **ERA-03**: Era 03 (Abuse Era) — corrupted Super 8, harsh grain, unstable geometry, sub-bass, tilted camera
- [ ] **ERA-04**: Era 04 (The Divorce) — cold gray-blue, objects emptying, record scratch, single unresolved note
- [ ] **ERA-05**: Era 05 (Teenage Years & Sports) — Friday night lights gold, ink flooding back, crowd noise, cleats on turf
- [ ] **ERA-06**: Era 06 (College) — saturated fast motion, layered audio stems, stadium ceiling, unfinished edges
- [ ] **ERA-07**: Era 07 (Identity Years) — muted olive/gray, stadium emptying, code fragments, coffee shop ambience
- [ ] **ERA-08**: Era 08 (The Seven Years) — lavender/muted rose, three apartments with the lamp, birds with dark undercurrent
- [ ] **ERA-09**: Era 09 (The Breakup) — monochrome, geometry fragments, lamp falls, complete stillness, longest silence
- [ ] **ERA-10**: Era 10 (Pittsburgh & The House) — Pittsburgh gold/black, geometry rebuilds into house, door opening sound
- [ ] **ERA-11**: Era 11 (Year of Chaos) — neon saturated, scroll-speed reactive bass, multiple stems competing
- [ ] **ERA-12**: Era 12 (Finding Her) — warm earth tones, chaos settles into focus, simple warm melody
- [ ] **ERA-13**: Era 13 (Somewhere Between Then and Now) — dissolving edges, horizon line, single sustained note

### Transitions

- [ ] **TRNS-01**: Transition 01 (Parents' Divorce) — house empties, objects fade in reverse order of intimacy, cold blue light fills space
- [ ] **TRNS-02**: Transition 02 (Going to College) — house floor transforms to turf, ceiling opens to sky, color explosion
- [ ] **TRNS-03**: Transition 03 (College to First Apartment) — stadium empties, lights cut one by one, lamp turns on in apartment
- [ ] **TRNS-04**: Transition 04 (The Breakup) — lamp falls, apartment geometry fragments, world goes monochrome and completely still
- [ ] **TRNS-05**: Transition 05 (Moving to Pittsburgh) — broken geometry rebuilds into house foundation, Pittsburgh gold/black arrives

### Post-Processing

- [ ] **POST-01**: Per-era film grain with era-appropriate grain character (heavy analog for childhood, different noise types for later eras)
- [ ] **POST-02**: Per-era color grading as emotional notation (warm amber childhood, desaturated fracture, monochrome breakup, etc.)
- [ ] **POST-03**: Per-era vignette and bloom settings tuned to emotional register

### Photo Integration

- [ ] **PHOT-01**: Real photographs blended into 3D environments with era-matched color grading for emotionally critical eras
- [ ] **PHOT-02**: The lamp — a single recurring 3D object that travels through eras 08 and 09 as continuity anchor

### Accessibility & Edge Cases

- [ ] **ACCS-01**: prefers-reduced-motion fallback provides narrative content without motion (static era sequence)
- [ ] **ACCS-02**: Graceful phone-width redirect with "best experienced on desktop or tablet" message
- [ ] **ACCS-03**: Keyboard and trackpad scroll both work without trapping focus

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Camera & Spatial

- **CAM-01**: Camera path animation via CatmullRomCurve3 driven by scroll for spatial depth through 3D scenes
- **CAM-02**: Per-era camera behavior (some eras feel close, some vast)

### Performance & Polish

- **PERF-01**: KTX2/basis texture compression for reduced GPU memory and load time
- **PERF-02**: Draw call audit and optimization across all 13 eras
- **PERF-03**: Session position restore via sessionStorage for returning visitors
- **PERF-04**: Keyboard mute shortcut (M key)

### Audio Enhancement

- **AUDE-01**: Per-era ambient sound layering (environmental audio on top of music stems)
- **AUDE-02**: Scroll-speed affects audio playback energy (faster scroll = more chaotic audio in appropriate eras)

### Fallback

- **FALL-01**: Soft WebGL degradation for low-end GPUs via GPU tier detection
- **FALL-02**: Simplified shader fallback for devices that can't handle full post-processing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Navigation menu / chapter select | Destroys scroll-as-time metaphor; emotional accumulation requires sequential experience |
| Text narration / captions | "No narrator. The world speaks." — competes with visual/audio language |
| Full audio control UI / volume slider | Audio is load-bearing, not decoration; single mute toggle only |
| Mobile phone optimization | Cinematic experience requires larger viewport; degraded mobile version worse than redirect |
| CMS / content management | Single fixed art object, not a publication; content changes require code deploy |
| Social sharing buttons | Personal art object, not a product; minimal OG tags only |
| Interactive branching / user choices | Scroll is the only control; linearity is the point |
| User accounts / interactivity | This is a viewing experience, not an application |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| FOUND-06 | Phase 1 | Complete |
| RNDR-01 | Phase 2 | Complete |
| RNDR-02 | Phase 2 | Complete |
| RNDR-03 | Phase 2 | Complete |
| RNDR-04 | Phase 2 | Complete |
| RNDR-05 | Phase 2 | Complete |
| RNDR-06 | Phase 2 | Complete |
| AUDO-01 | Phase 3 | Complete |
| AUDO-02 | Phase 3 | Complete |
| AUDO-03 | Phase 3 | Complete |
| AUDO-04 | Phase 3 | Complete |
| AUDO-05 | Phase 3 | Complete |
| AUDO-06 | Phase 3 | Complete |
| ERA-01 | Phase 4 | Pending |
| ERA-02 | Phase 4 | Pending |
| ERA-03 | Phase 4 | Pending |
| ERA-04 | Phase 4 | Pending |
| ERA-05 | Phase 5 | Pending |
| ERA-06 | Phase 5 | Pending |
| ERA-07 | Phase 5 | Pending |
| ERA-08 | Phase 6 | Pending |
| ERA-09 | Phase 6 | Pending |
| ERA-10 | Phase 6 | Pending |
| ERA-11 | Phase 7 | Pending |
| ERA-12 | Phase 7 | Pending |
| ERA-13 | Phase 7 | Pending |
| TRNS-01 | Phase 8 | Pending |
| TRNS-02 | Phase 8 | Pending |
| TRNS-03 | Phase 8 | Pending |
| TRNS-04 | Phase 8 | Pending |
| TRNS-05 | Phase 8 | Pending |
| POST-01 | Phase 9 | Pending |
| POST-02 | Phase 9 | Pending |
| POST-03 | Phase 9 | Pending |
| PHOT-01 | Phase 9 | Pending |
| PHOT-02 | Phase 6 | Pending |
| ACCS-01 | Phase 10 | Pending |
| ACCS-02 | Phase 10 | Pending |
| ACCS-03 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
