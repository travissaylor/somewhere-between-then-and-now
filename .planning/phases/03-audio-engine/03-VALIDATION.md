---
phase: 3
slug: audio-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.18 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | AUDO-02 | unit | `npm run test -- src/audio/audioMath.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 0 | AUDO-03 | unit | `npm run test -- src/audio/audioMath.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 0 | AUDO-04 | unit | `npm run test -- src/audio/audioMath.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-04 | 01 | 0 | AUDO-06 | unit | `npm run test -- src/audio/audioMath.test.ts` | ❌ W0 | ⬜ pending |
| 3-xx-xx | xx | x | AUDO-01 | manual | agent-browser UAT | — | ⬜ pending |
| 3-xx-xx | xx | x | AUDO-05 | manual | agent-browser UAT | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/audio/audioMath.test.ts` — stubs for AUDO-02 (gain computation), AUDO-03 (rampTo logic), AUDO-04 (overlap zone computation), AUDO-06 (null-safe fallback)
- [ ] `src/audio/audioMath.ts` — pure functions, no Tone.js import, fully unit-testable in node environment

*Existing infrastructure covers framework install (vitest already configured).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AudioContext gate: no audio before scroll | AUDO-01 | Requires live browser AudioContext state transitions | Use agent-browser: load page, verify no audio plays, scroll, verify audio starts |
| Tab visibility pause/resume | AUDO-05 | Requires browser tab switching and AudioContext suspend/resume | Use agent-browser: play audio, switch tabs, verify pause, return, verify resume |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
