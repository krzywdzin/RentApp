---
phase: 35
slug: google-places-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 35 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (API) |
| **Config file** | `apps/api/jest.config.ts` |
| **Quick run command** | `pnpm --filter api test -- --testPathPattern places` |
| **Full suite command** | `pnpm --filter api test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick test for places module
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Autocomplete suggestions appear | NAJEM-02 | Requires Google API key + network | Type address in mobile, verify dropdown |
| Selected address saves to rental | NAJEM-04 | Full flow test | Select address, create rental, check detail |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
