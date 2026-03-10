# Somewhere Between Then and Now

## What This Is

A scroll-driven, cinematic web experience that tells one life story through thirteen visual and sonic eras. The user's only control is scroll — scrolling is time, moving forward through a life with its own visual language, sound design, and emotional weather per era. A personal art object, not a portfolio or website.

## Core Value

Make someone who did not live this life feel, for a moment, that they did — through scroll-driven immersion where every visual, audio, and transition choice serves emotional truth.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Scroll-driven timeline engine mapping scroll position to emotional pacing across 13 eras
- [ ] Per-era visual environments with distinct palettes, moods, and visual languages
- [ ] Scene-to-scene shader morphing transitions (5 major transitions + inter-era blends)
- [ ] Audio stem management with scroll-reactive crossfading across 13 audio zones
- [ ] Real photo/video integration blended into 3D environments with era-matched treatment
- [ ] Film grain, color grading, and post-processing per era
- [ ] The lamp — a recurring object that travels through eras 8-9 as continuity anchor
- [ ] Responsive design that works on desktop (primary) and tablet
- [ ] Performance optimization for smooth 60fps scroll experience
- [ ] Deployment pipeline (Vercel)

### Out of Scope

- Mobile phone optimization — cinematic experience requires larger viewport
- Narration or text overlays — "No narrator. The world speaks."
- Navigation UI or menu — scroll is the only control
- User accounts or interactivity beyond scroll
- CMS or content management — this is a single fixed art piece

## Context

- Thirteen eras spanning birth to present day, each with unique visual/audio identity
- Emotional arc: Warmth → Fracture → Loss → Identity → Love → Rupture → Reconstruction → Chaos → Arrival → Present → Open
- Five major transitions are the emotional centerpieces (Parents' Divorce, Going to College, College to First Apartment, The Breakup, Moving to Pittsburgh)
- Assets available: photographs from various eras, some video footage, original music
- Assets needed: audio stems per era, 3D environment assets, GLSL shader library, curated photos with era-matched color grading
- The piece ends on a horizon — unfinished, still walking. Not a triumphant arc but an honest one.
- Technical brief recommends: GSAP ScrollTrigger, React Three Fiber, WebGL GLSL shaders, Tone.js/Web Audio API, Next.js

## Constraints

- **Tech stack**: Next.js + React Three Fiber + GSAP ScrollTrigger + Web Audio API — per creative brief recommendations
- **Performance**: Must maintain smooth scroll at 60fps with 3D scenes and audio
- **Visual fidelity**: Each era must feel like a distinct world — no consistent aesthetic across the piece
- **Audio**: Scroll-reactive mixing without jank or latency across 13 audio zones
- **Emotional truth**: "True before beautiful, dark where it was dark, warm where it was warm"

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scroll as only interaction | Creative brief: "The user holds a single control: scroll" | — Pending |
| 13 distinct eras | Maps to life story emotional arc per creative brief | — Pending |
| No text/narration | "No narrator. The world speaks." — immersion over explanation | — Pending |
| Next.js + R3F + GSAP | Recommended stack from creative brief for scroll-driven 3D | — Pending |

---
*Last updated: 2026-03-10 after initialization*
