---
phase: 21-critical-bug-fixes
plan: 03
subsystem: api
tags: [prisma, transaction, race-condition, sms, notifications, atomicity]

# Dependency graph
requires:
  - phase: 05-contracts
    provides: Contract service with number generation, annex creation, notification system
provides:
  - Atomic contract number generation inside prisma.$transaction
  - Single-operation annex creation (PDF first, then DB write)
  - Single-step notification creation with message included
  - Lazy SmsService initialization safe for missing credentials
affects: [contracts, notifications, sms]

# Tech tracking
tech-stack:
  added: []
  patterns: [interactive-prisma-transaction-with-retry, lazy-service-init, compute-before-persist]

key-files:
  created: []
  modified:
    - apps/api/src/contracts/contracts.service.ts
    - apps/api/src/notifications/notifications.service.ts
    - apps/api/src/notifications/sms/sms.service.ts
    - apps/api/src/contracts/contracts.service.spec.ts
    - apps/api/src/notifications/sms/sms.service.spec.ts

key-decisions:
  - "Retry once on P2002 unique constraint violation for concurrent contract creation"
  - "Generate annex PDF and upload to S3 before any DB write -- clean failure if PDF fails"
  - "Use crypto.randomUUID() for annex ID to allow S3 key generation before DB create"
  - "SmsService getClient() returns null when token missing, send() returns 'skipped'"
  - "Email notification message stored as subject line for consistency"

patterns-established:
  - "Interactive transaction pattern: count+create inside prisma.$transaction for sequential numbering"
  - "Compute-before-persist: generate all derived data before DB write to avoid partial records"
  - "Lazy service init: defer external client creation to first use for dev-friendly startup"

requirements-completed: [AREL-01, AREL-02, AREL-07, AREL-08]

# Metrics
duration: 6min
completed: 2026-03-27
---

# Phase 21 Plan 03: API Reliability Bugs Summary

**Atomic contract numbers via interactive transaction with P2002 retry, single-op annex/notification creation, and lazy SmsService init**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-27T22:15:57Z
- **Completed:** 2026-03-27T22:21:32Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Contract number generation moved inside prisma.$transaction with retry on unique constraint collision
- All four notification enqueue methods compute message before create call (no empty-message records)
- Annex creation generates PDF + uploads to S3 first, then does single contractAnnex.create with all fields
- SmsService initializes SMSAPI client lazily -- missing token logs warning instead of crashing app

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix contract number race condition and annex single-operation create** - `379c1fa` (fix)
2. **Task 2: Fix notification two-step create and SmsService lazy initialization** - `3089529` (fix)

## Files Created/Modified
- `apps/api/src/contracts/contracts.service.ts` - Atomic contract number in $transaction, single-op annex create
- `apps/api/src/notifications/notifications.service.ts` - Message computed before notification.create in all enqueue methods
- `apps/api/src/notifications/sms/sms.service.ts` - Lazy getClient() pattern, null-safe send()
- `apps/api/src/contracts/contracts.service.spec.ts` - Updated mocks for $transaction and single-op annex
- `apps/api/src/notifications/sms/sms.service.spec.ts` - Updated for lazy init pattern, added missing-token test

## Decisions Made
- Retry once on P2002 unique constraint violation for concurrent contract creation (not infinite retries)
- Generate annex PDF and upload to S3 before any DB write for clean failure semantics
- Use crypto.randomUUID() for annex ID so S3 key can be computed before DB create
- SmsService getClient() returns null when token missing; send() returns 'skipped' string
- Email notification stores subject as message field for audit trail consistency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ConfigService mock missing company config values in contract tests**
- **Found during:** Task 1 verification
- **Issue:** ConfigService.get mock returned undefined for all keys, causing frozenData assertions to fail
- **Fix:** Added proper config map mock with COMPANY_NAME, COMPANY_OWNER, etc.
- **Files modified:** apps/api/src/contracts/contracts.service.spec.ts
- **Verification:** All 19 contract tests pass
- **Committed in:** 3089529 (Task 2 commit)

**2. [Rule 3 - Blocking] Missing $transaction mock in Prisma test mock**
- **Found during:** Task 1 verification
- **Issue:** prisma.$transaction not defined in test mock, causing create() tests to throw TypeError
- **Fix:** Added $transaction mock that passes prisma object as tx parameter
- **Files modified:** apps/api/src/contracts/contracts.service.spec.ts
- **Verification:** All contract tests pass including transaction-based create
- **Committed in:** 3089529 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for test verification. No scope creep.

## Issues Encountered
None beyond the test mock updates documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- API reliability bugs fixed, ready for remaining v2.1 phases
- Pre-existing test failures in photos.service.spec.ts are unrelated to this plan

---
*Phase: 21-critical-bug-fixes*
*Completed: 2026-03-27*
