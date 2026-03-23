---
phase: 1
slug: foundation-and-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (included in NestJS default scaffold) + supertest for e2e |
| **Config file** | `apps/api/jest.config.ts` — Wave 0 creation needed |
| **Quick run command** | `pnpm --filter api test -- --testPathPattern="(auth\|audit\|roles)"` |
| **Full suite command** | `pnpm --filter api test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter api test -- --testPathPattern="(auth|audit|roles)"`
- **After every plan wave:** Run `pnpm --filter api test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01 | integration | `pnpm --filter api test:e2e -- auth` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | AUTH-01 | integration | `pnpm --filter api test:e2e -- auth` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | AUTH-02 | unit | `pnpm --filter api test -- users.service` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | AUTH-02 | integration | `pnpm --filter api test:e2e -- auth` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | AUTH-03 | integration | `pnpm --filter api test:e2e -- auth` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 1 | AUTH-04 | unit | `pnpm --filter api test -- roles.guard` | ❌ W0 | ⬜ pending |
| 01-04-02 | 04 | 1 | AUTH-04 | integration | `pnpm --filter api test:e2e -- auth` | ❌ W0 | ⬜ pending |
| 01-05-01 | 05 | 1 | AUTH-05 | unit | `pnpm --filter api test -- audit.service` | ❌ W0 | ⬜ pending |
| 01-05-02 | 05 | 1 | AUTH-05 | integration | `pnpm --filter api test:e2e -- audit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/jest.config.ts` — Jest config with ts-jest transformer
- [ ] `apps/api/test/jest-e2e.json` — e2e test config pointing to `test/**/*.e2e-spec.ts`
- [ ] `apps/api/test/auth.e2e-spec.ts` — covers AUTH-01, AUTH-02, AUTH-03, AUTH-04
- [ ] `apps/api/test/audit.e2e-spec.ts` — covers AUTH-05 integration
- [ ] `apps/api/src/audit/audit.service.spec.ts` — covers AUTH-05 unit
- [ ] `apps/api/src/common/guards/roles.guard.spec.ts` — covers AUTH-04 unit
- [ ] `apps/api/src/users/users.service.spec.ts` — covers AUTH-02 unit
- [ ] Framework install: Jest is included in NestJS default scaffold — no additional install

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Docker Compose starts all services | AUTH-05 (dev env) | Infrastructure, not code | Run `docker-compose up -d` and verify PG, Redis, MinIO respond |
| Password reset email received | AUTH-02 | Requires email service (Mailpit in dev) | Trigger reset, check Mailpit inbox at localhost:8025 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
