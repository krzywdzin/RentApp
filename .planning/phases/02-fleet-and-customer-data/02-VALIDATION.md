---
phase: 02
slug: fleet-and-customer-data
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit) + jest-e2e (e2e) |
| **Config file** | `apps/api/package.json` (unit), `apps/api/test/jest-e2e.json` (e2e) |
| **Quick run command** | `cd apps/api && npx jest --no-cache --forceExit` |
| **Full suite command** | `cd apps/api && npx jest --no-cache --forceExit && npx jest --config ./test/jest-e2e.json --no-cache --forceExit --runInBand` |
| **Estimated runtime** | ~25 seconds |

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
| 02-01-01 | 01 | 1 | FLEET-01 | unit | `npx jest vehicles.service` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | FLEET-02 | unit | `npx jest vehicles.service` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | CUST-01, CUST-02 | unit | `npx jest customers.service` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | CUST-03 | unit | `npx jest customers.service` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | FLEET-03 | unit | `npx jest fleet-import.service` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | FLEET-01, CUST-01 | e2e | `npx jest --config ./test/jest-e2e.json fleet` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 2 | CUST-02, CUST-04 | e2e | `npx jest --config ./test/jest-e2e.json customer` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/vehicles/vehicles.service.spec.ts` — stubs for FLEET-01, FLEET-02
- [ ] `apps/api/src/customers/customers.service.spec.ts` — stubs for CUST-01, CUST-02, CUST-03
- [ ] `apps/api/src/fleet-import/fleet-import.service.spec.ts` — stubs for FLEET-03
- [ ] `apps/api/test/fleet.e2e-spec.ts` — stubs for vehicle CRUD e2e
- [ ] `apps/api/test/customer.e2e-spec.ts` — stubs for customer CRUD e2e with encryption

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MinIO file upload | FLEET-01 | Requires running MinIO | Upload vehicle document, verify in MinIO console |
| CSV/XLS import | FLEET-03 | Needs sample file | Upload CSV via API, verify vehicles created |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
