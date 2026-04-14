---
phase: 39
slug: return-protocol
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 39 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (API), Jest + React Native Testing Library (mobile) |
| **Config file** | `apps/api/jest.config.ts`, `apps/mobile/jest.config.ts` |
| **Quick run command** | `cd apps/api && npx jest --testPathPattern=return-protocol -x` |
| **Full suite command** | `cd apps/api && npx jest` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx jest --testPathPattern=return-protocol -x`
- **After every plan wave:** Run `cd apps/api && npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 39-01-01 | 01 | 1 | ZWROT-01 | unit | `cd apps/api && npx jest return-protocols.service.spec -x` | No - Wave 0 | ⬜ pending |
| 39-01-02 | 01 | 1 | ZWROT-01 | unit | `cd apps/api && npx jest return-protocols.controller.spec -x` | No - Wave 0 | ⬜ pending |
| 39-02-01 | 02 | 2 | ZWROT-01 | manual-only | N/A (React Native UI) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/return-protocols/return-protocols.service.spec.ts` — PDF generation + email delivery tests
- [ ] `apps/api/src/return-protocols/return-protocols.controller.spec.ts` — endpoint validation + auth tests

*Wave 0 test stubs created as part of Plan 01 backend task.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cleanliness chip selector in mobile | ZWROT-01 | React Native UI — no automated runner | Open return wizard, verify 3 chips (Czysty/Brudny/Do mycia) render and select |
| Signature capture in mobile | ZWROT-01 | React Native canvas — no automated runner | Sign on device, verify image renders in protocol |
| Protocol download from web admin | ZWROT-01 | Browser interaction | Open rental detail, verify "Protokół" download button works |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
