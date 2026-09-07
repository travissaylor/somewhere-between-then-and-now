# Plan

The creative source of truth is `creative_direction_brief.md`. This file holds the
technical decisions and the build order. When the two disagree, the brief wins.

## Decisions

**Stack.** Vite, TypeScript, vanilla Three.js. No framework, no React, no GSAP
ScrollTrigger. GSAP core is allowed for timelines and eases if it earns its place.
Raw Web Audio, no Tone.js.

**Rendering.** One persistent Three.js scene. The six cast objects (Light, Ground,
Walls, Table, Lamp, Horizon) are persistent meshes that are re-posed, re-materialed,
and re-parented as time advances. Transitions are real state changes, never a
crossfade between two rendered scenes. One post-processing pass carries grain, color
grade, vignette, and blur, driven by per-era parameter curves.

**Time.** Virtual scroll. Wheel, touch, arrow keys, and space are inputs. Light
inertia. Backward input is silently ignored. Progress is a single number from 0 to 1
that every system reads; nothing else holds state about where the viewer is. Era
boundaries come from the weight table in the brief. Reload restarts from darkness.

**Sound.** Generated in the browser. Drones, heartbeat, wind, notes, birds, crowd are
synthesized. A handful of CC0 recordings are allowed for concrete hits only (record
scratch, screen door, cleats, door opening), stored in the repo with attribution.
Audio starts on the entry click. Scroll speed drives mix energy with a per-era
sensitivity: zero in the breakup, maximum in chaos.

**Transitions.** Five choreographed set pieces (divorce, college, first apartment,
breakup, Pittsburgh). The other seven boundaries are parameter drifts.

**Targets.** M1 MacBook Air at 60 fps is the floor. Phone widths get a plain
"meant for a larger screen" page. `prefers-reduced-motion` removes the camera tilt
and flicker only.

**Tooling.** Dev-only debug panel (key toggle): era and progress readout, jump-to-era,
live weight tuning, FPS, audio meters. A `?t=` URL parameter lands at a progress
value for screenshots. Neither ships in the viewer path.

**Deploy.** Public GitHub repo. Cloudflare Pages, free tier, preview URL per push.

## Process

Every slice is deployed and checked in the browser by Claude, then checkpointed with
Travis before the next slice starts. A checkpoint is a preview URL plus a short list
of what to look at. Commit per meaningful increment on main. No research or phase
docs; this file and the brief are the only planning documents.

What the previous attempt did wrong, so it is not repeated: three phases of
infrastructure, tests for gain math, and nothing ever scrolled by a person; silent
because no audio existed; bugs logged in verification docs and left.

## Slices

| # | Slice | Status |
|---|---|---|
| 1 | Skeleton: entry, all 13 eras as light, palette, grain, and drone; walking camera; forward-only scroll; the ending; deploy pipeline | not started |
| 2 | Eras 01 to 04 at depth, including the divorce set piece | not started |
| 3 | Eras 05 to 07, including the college and first-apartment set pieces | not started |
| 4 | Eras 08 to 10, including the breakup and Pittsburgh set pieces | not started |
| 5 | Eras 11 to 13, the horizon, the bookend | not started |
| 6 | Pass over the whole: pacing, mix, grain curve, the stops | not started |

Slice 2 is where the visual language gets decided; expect the most back-and-forth there.
