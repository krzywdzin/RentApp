---
phase: 09
slug: customer-portal-and-cepik
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit + e2e), next build (portal) |
| **Config file** | `apps/api/package.json` (unit), `apps/api/test/jest-e2e.json` (e2e) |
| **Quick run command** | `cd apps/api && npx jest --no-cache --forceExit --testPathPattern="cepik\|portal"` |
| **Full suite command** | `cd apps/api && npx jest --no-cache --forceExit && npx jest --config ./test/jest-e2e.json --no-cache --forceExit --runInBand && cd ../../apps/web && npx next build` |
| **Estimated runtime** | ~40 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 40 seconds

---

## Wave 0 Requirements

- [ ] `apps/api/src/cepik/cepik.service.spec.ts` — stubs for CEPiK verification
- [ ] `apps/api/test/portal.e2e-spec.ts` — stubs for portal auth + data access
- [ ] `apps/api/test/cepik.e2e-spec.ts` — stubs for CEPiK endpoints

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Portal mobile responsiveness | PORTAL-01 | Visual check | Open portal URL on mobile viewport, verify layout |
| Magic link email delivery | PORTAL-01 | Requires SMTP | Sign contract, check email for portal link |
| CEPiK real API (when available) | CEPIK-01 | External dependency | Replace stub, test with real credentials |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 40s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
