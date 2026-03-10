---
phase: 2
slug: render-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 |
| **Config file** | vitest.config.ts (or package.json scripts) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | RNDR-01 | unit (logic) | `npm test -- --reporter=verbose src/components/canvas/Compositor.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | RNDR-02 | unit (logic) | `npm test -- src/lib/compositorLogic.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | RNDR-03 | unit | `npm test -- src/components/eras/EraSceneManagement.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | RNDR-04 | unit | `npm test -- src/components/loading/WombGate.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 02 | 1 | RNDR-05 | manual | Manual: scroll attempt during womb state does nothing | N/A | ⬜ pending |
| TBD | 02 | 1 | RNDR-06 | unit | `npm test -- src/lib/memoryManager.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Note:** GPU rendering (RNDR-01, RNDR-02) cannot be unit-tested headlessly. Tests validate logic (scene pair selection, blend value computation, dispose call arguments). GPU correctness validated visually.

---

## Wave 0 Requirements

- [ ] `src/components/canvas/Compositor.test.ts` — covers RNDR-01 compositor scene selection logic
- [ ] `src/components/loading/WombGate.test.ts` — covers RNDR-04 shader warmup + scroll gate sequencing
- [ ] `src/lib/memoryManager.test.ts` — covers RNDR-06 predictive load and N-2 disposal thresholds
- [ ] `src/components/eras/EraSceneManagement.test.ts` — covers RNDR-03 visibility toggle (not unmount) pattern
- [ ] `src/lib/compositorLogic.test.ts` — covers RNDR-02 EffectComposer pass logic

*Existing infrastructure (Vitest) covers framework needs. No new test framework install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scroll locked during womb loading state | RNDR-05 | Requires browser + scroll interaction | 1. Load app in browser 2. Attempt to scroll during womb state 3. Verify scroll has no effect 4. Wait for birth animation 5. Verify scroll now works |
| No visual corruption during A/B transition | RNDR-01 | GPU rendering visual check | 1. Scroll to Era 01→02 boundary 2. Verify no black frames, flicker, or torn textures during blend |
| No first-transition stutter | RNDR-04 | Performance timing visual check | 1. Load app fresh 2. After birth animation, scroll to first transition 3. Verify no frame drop or jank |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
