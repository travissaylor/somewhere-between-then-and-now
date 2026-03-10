---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x |
| **Config file** | `vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `npx vitest run src/lib/scrollMath.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/scrollMath.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 0 | FOUND-03 | unit | `npx vitest run src/lib/scrollMath.test.ts -t "computeEraProgress"` | ❌ W0 | ⬜ pending |
| TBD | 01 | 0 | FOUND-05 | unit | `npx vitest run src/lib/scrollMath.test.ts -t "scroll weight"` | ❌ W0 | ⬜ pending |
| TBD | 01 | 0 | FOUND-04 | unit | `npx vitest run src/store/eraStore.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | FOUND-01 | smoke | Browser console — no SSR hydration errors | manual-only | ⬜ pending |
| TBD | 01 | 1 | FOUND-02 | smoke | Debug overlay visual inspection | manual-only | ⬜ pending |
| TBD | 01 | 1 | FOUND-06 | smoke | Browser responsive inspector | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `src/lib/scrollMath.test.ts` — stubs for FOUND-03, FOUND-05 (pure math, fully automatable)
- [ ] `src/store/eraStore.test.ts` — stubs for FOUND-04 (Zustand vanilla store)
- [ ] Framework install: `npm install -D vitest @vitest/ui`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App loads without SSR errors | FOUND-01 | WebGL hydration requires browser | Load app, check console for errors |
| Lenis + ScrollTrigger smooth scroll | FOUND-02 | Scroll feel is subjective + requires browser | Scroll page, confirm debug overlay updates smoothly |
| Canvas fixed at all viewports | FOUND-06 | CSS layout requires browser responsive mode | Open dev tools responsive inspector, test desktop + tablet widths |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
