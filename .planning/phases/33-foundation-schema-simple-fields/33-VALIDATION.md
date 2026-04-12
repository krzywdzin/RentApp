---
phase: 33
slug: foundation-schema-simple-fields
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 33 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (API), vitest (shared) |
| **Config file** | `apps/api/jest.config.ts`, `packages/shared/vitest.config.ts` |
| **Quick run command** | `pnpm --filter api test -- --testPathPattern` |
| **Full suite command** | `pnpm --filter api test && pnpm --filter shared test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick test for modified module
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 33-01-01 | 01 | 1 | KLIENT-01..04 | unit | `pnpm --filter shared test` | ❌ W0 | ⬜ pending |
| 33-01-02 | 01 | 1 | FLOTA-01..03 | unit | `pnpm --filter api test -- --testPathPattern vehicle-class` | ❌ W0 | ⬜ pending |
| 33-01-03 | 01 | 1 | NAJEM-01 | unit | `pnpm --filter api test -- --testPathPattern rental` | ❌ W0 | ⬜ pending |
| 33-02-01 | 02 | 1 | KLIENT-02 | unit | `pnpm --filter shared test -- --testPathPattern nip` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] NIP validator unit tests (shared package)
- [ ] VehicleClass CRUD service tests (API)
- [ ] Customer address schema validation tests (shared)

*Existing test infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile form layout for address fields | KLIENT-04 | UI layout verification | Open mobile app, go to new rental → customer step, verify address fields visible |
| Vehicle class dropdown in web panel | FLOTA-02 | UI interaction | Open web panel, go to vehicle edit, verify class dropdown appears |
| Insurance case number checkbox flow | NAJEM-01 | Mobile wizard interaction | Create new rental, select vehicle, toggle insurance checkbox, verify field appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
