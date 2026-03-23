---
phase: 03
slug: rental-lifecycle
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit) + jest-e2e (e2e) |
| **Config file** | `apps/api/package.json` (unit), `apps/api/test/jest-e2e.json` (e2e) |
| **Quick run command** | `cd apps/api && npx jest --no-cache --forceExit` |
| **Full suite command** | `cd apps/api && npx jest --no-cache --forceExit && npx jest --config ./test/jest-e2e.json --no-cache --forceExit --runInBand` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx jest --no-cache --forceExit`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | RENT-01, RENT-03 | unit | `npx jest rentals.service` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | RENT-02 | unit | `npx jest rentals.service` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | RENT-04 | unit | `npx jest rentals.service` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | RENT-05 | unit | `npx jest rentals.service` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | RENT-01..05 | e2e | `npx jest --config ./test/jest-e2e.json rentals` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/rentals/rentals.service.spec.ts` — stubs for RENT-01 through RENT-05
- [ ] `apps/api/test/rentals.e2e-spec.ts` — stubs for rental CRUD + state transitions e2e

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Calendar timeline rendering | RENT-02 | UI concern (Phase 5) | Verify API returns vehicle-grouped data |
| Overlap detection race condition | RENT-01 | Requires concurrent requests | Send 2 simultaneous create requests for same vehicle/dates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
