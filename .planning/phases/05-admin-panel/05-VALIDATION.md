---
phase: 05
slug: admin-panel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit), playwright (e2e — deferred to Phase 5 execution) |
| **Config file** | `apps/web/vitest.config.ts` (unit) |
| **Quick run command** | `cd apps/web && npx next build` |
| **Full suite command** | `cd apps/web && npx next build && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/web && npx next build`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | ADMIN-01 | build | `npx next build` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | ADMIN-01, ADMIN-02 | build | `npx next build` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 3 | ADMIN-01, ADMIN-02, ADMIN-03 | build | `npx next build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/` directory scaffold with Next.js App Router
- [ ] `apps/web/package.json` with dependencies
- [ ] `next build` passes with empty app

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual layout fidelity | ADMIN-01 | UI visual check | Compare rendered pages against UI-SPEC mockups |
| Calendar timeline interaction | ADMIN-02 | Interactive UX | Drag/click on calendar, verify tooltip/selection behavior |
| Polish text rendering | ADMIN-01 | Visual check | Verify all UI text renders Polish characters correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
