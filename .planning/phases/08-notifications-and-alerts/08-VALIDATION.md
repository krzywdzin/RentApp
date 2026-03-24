---
phase: 8
slug: notifications-and-alerts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | apps/api/jest.config.ts, apps/api/test/jest-e2e.json |
| **Quick run command** | `cd apps/api && npx jest --testPathPattern="notifications\|sms\|alert" --no-coverage` |
| **Full suite command** | `cd apps/api && npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx jest --testPathPattern="notifications|sms|alert" --no-coverage`
- **After every plan wave:** Run `cd apps/api && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | NOTIF-01, NOTIF-03 | unit | `npx jest sms.service.spec` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | NOTIF-02 | unit | `npx jest notification-email.spec` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | ALERT-01 | unit | `npx jest alert-scanner.spec` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | ALERT-02 | unit | `npx jest alert-config.spec` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | NOTIF-01, NOTIF-02, NOTIF-03 | e2e | `npx jest --config test/jest-e2e.json notifications` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 2 | ALERT-01, ALERT-02 | e2e | `npx jest --config test/jest-e2e.json alerts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/notifications/sms/sms.service.spec.ts` — stubs for NOTIF-01, NOTIF-03
- [ ] `apps/api/src/notifications/email/notification-email.service.spec.ts` — stubs for NOTIF-02
- [ ] `apps/api/src/notifications/alerts/alert-scanner.service.spec.ts` — stubs for ALERT-01
- [ ] `apps/api/src/notifications/alerts/alert-config.service.spec.ts` — stubs for ALERT-02
- [ ] `apps/api/test/notifications.e2e-spec.ts` — e2e stubs for full notification flow
- [ ] `apps/api/test/alerts.e2e-spec.ts` — e2e stubs for alert system

*Existing infrastructure covers test framework and config.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SMS delivery to real phone | NOTIF-01 | Requires smsapi.pl credentials and real phone | Send test SMS via smsapi sandbox, verify receipt |
| Email arrives in inbox | NOTIF-02 | Requires real SMTP | Check Mailpit UI during e2e tests |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
