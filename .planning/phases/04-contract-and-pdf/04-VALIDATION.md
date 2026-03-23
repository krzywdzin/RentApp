---
phase: 04
slug: contract-and-pdf
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit) + jest-e2e (e2e) |
| **Config file** | `apps/api/package.json` (unit), `apps/api/test/jest-e2e.json` (e2e) |
| **Quick run command** | `cd apps/api && npx jest --no-cache --forceExit` |
| **Full suite command** | `cd apps/api && npx jest --no-cache --forceExit && npx jest --config ./test/jest-e2e.json --no-cache --forceExit --runInBand` |
| **Estimated runtime** | ~35 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx jest --no-cache --forceExit`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 35 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | CONT-01, CONT-02 | unit | `npx jest contracts.service` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | CONT-03 | unit | `npx jest pdf.service` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | CONT-04 | unit | `npx jest contracts.service` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | CONT-05 | unit | `npx jest contracts.service` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | CONT-01..05 | e2e | `npx jest --config ./test/jest-e2e.json contracts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/contracts/contracts.service.spec.ts` — stubs for CONT-01 through CONT-05
- [ ] `apps/api/src/contracts/pdf.service.spec.ts` — stubs for PDF generation
- [ ] `apps/api/test/contracts.e2e-spec.ts` — stubs for contract lifecycle e2e

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF visual quality | CONT-03 | Requires visual inspection | Open generated PDF, verify Polish chars, layout, embedded signatures |
| Signature canvas UX | CONT-02 | Frontend component (Phase 5/6) | Phase 4 is API — canvas is frontend concern |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 35s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
