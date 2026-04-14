---
phase: 37
slug: contract-delivery-pdf-encryption-email
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 37 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `apps/api/jest.config.ts` |
| **Quick run command** | `npx jest --no-coverage --passWithNoTests` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --no-coverage --passWithNoTests`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 37-01-01 | 01 | 1 | UMOWA-05 | unit | `npx jest pdf-encrypt --no-coverage` | ❌ W0 | ⬜ pending |
| 37-01-02 | 01 | 1 | UMOWA-05,06,07 | unit | `npx jest contracts.service --no-coverage` | ✅ | ⬜ pending |
| 37-01-03 | 01 | 1 | UMOWA-06 | unit | `npx jest sms --no-coverage` | ✅ | ⬜ pending |
| 37-01-04 | 01 | 1 | UMOWA-07 | unit | `npx jest mail.service --no-coverage` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/contracts/pdf/pdf-encrypt.service.spec.ts` — stubs for UMOWA-05 encryption tests

*Existing test infrastructure covers contracts.service, mail.service, and sms.service.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Encrypted PDF opens in Adobe/Chrome with registration password | UMOWA-05 | Library output must be validated in real PDF readers | Generate encrypted PDF, try opening with password in 2+ readers |
| SMS arrives on real phone with correct text | UMOWA-06 | smsapi.pl delivery cannot be unit tested | Use test mode, verify via smsapi.pl dashboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
