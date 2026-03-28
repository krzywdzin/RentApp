---
phase: quick
plan: 260328-otq
subsystem: testing
tags: [jest, vitest, docker-compose, postgres, redis, e2e, unit-tests, coverage]

requires:
  - phase: 26-code-quality-cleanup
    provides: "refactored codebase to validate tests against"
provides:
  - "All API unit tests passing (23 suites, 227 tests)"
  - "All web unit tests passing (4 suites, 12 tests)"
  - "E2e test baseline: 8/12 suites passing, 110/124 tests"
  - "Diagnosed 4 failing e2e suites with root causes"
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - apps/api/src/customers/retention.service.spec.ts
    - apps/api/src/photos/photos.service.spec.ts

key-decisions:
  - "Used prisma db push instead of migrate deploy for local testing (single migration didn't cover full schema)"
  - "PORTAL_JWT_SECRET missing from .env files but present in .env.example -- config drift documented"

patterns-established: []

requirements-completed: []

duration: 23min
completed: 2026-03-28
---

# Quick Task 260328-otq: Configure and Run Application Tests Summary

**Local test infrastructure via Docker Compose, all 239 unit tests green, e2e baseline 110/124 with 4 diagnosed failures**

## Performance

- **Duration:** 23 min
- **Started:** 2026-03-28T16:54:49Z
- **Completed:** 2026-03-28T17:17:49Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Docker Compose infrastructure (postgres, redis, minio, mailpit) running with health checks
- API unit tests: 23 suites, 227 tests all passing (coverage threshold 35% met)
- Web unit tests: 4 suites, 12 tests all passing
- E2e tests: 8/12 suites passing (110/124 tests), 4 failing suites diagnosed with root causes
- Fixed 2 outdated test files that failed due to Phase 21/22 implementation changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Start local infrastructure and configure env** - `ef12045` (chore)
2. **Task 2: Run unit tests for API and Web** - `3cb68fa` (fix)
3. **Task 3: Run API e2e tests** - no commit (documentation only, .env changes gitignored)

## Files Created/Modified

- `apps/api/src/customers/retention.service.spec.ts` - Added missing `count` mock and updated `findMany` assertion for active-rental skip logic
- `apps/api/src/photos/photos.service.spec.ts` - Updated replacePhoto tests to match overwrite pattern (Phase 21 decision: same S3 keys, no delete)

## Decisions Made

- Used `prisma db push` instead of `prisma migrate deploy` for local testing because the single migration file did not cover all 18 Prisma models (only vehicles/customers). This is a dev-only approach; production uses migrate deploy.
- Added `PORTAL_JWT_SECRET` to both .env files -- it was in .env.example but missing from the actual .env files (config drift).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] RetentionService spec missing `count` mock**
- **Found during:** Task 2 (API unit tests)
- **Issue:** `retention.service.ts` was updated in Phase 21 to count skipped customers with active rentals (`prisma.customer.count`), but the test mock only had `findMany` and `deleteMany`
- **Fix:** Added `count: jest.fn().mockResolvedValue(0)` to mock, updated `findMany` assertion to include `rentals: { none: ... }` filter
- **Files modified:** `apps/api/src/customers/retention.service.spec.ts`
- **Verification:** All retention tests pass
- **Committed in:** `3cb68fa`

**2. [Rule 1 - Bug] PhotosService replacePhoto spec expected delete calls that no longer happen**
- **Found during:** Task 2 (API unit tests)
- **Issue:** Phase 21 changed replacePhoto to overwrite pattern (upload to same S3 keys) but tests still expected `storageService.delete` calls
- **Fix:** Removed delete assertions, replaced with upload assertions verifying correct keys
- **Files modified:** `apps/api/src/photos/photos.service.spec.ts`
- **Verification:** All photo tests pass
- **Committed in:** `3cb68fa`

**3. [Rule 3 - Blocking] Missing PORTAL_JWT_SECRET env var**
- **Found during:** Task 3 (e2e tests)
- **Issue:** All 12 e2e suites failed with `JwtStrategy requires a secret or key` because PORTAL_JWT_SECRET was absent from .env
- **Fix:** Added `PORTAL_JWT_SECRET=change-me-portal-jwt-secret-min-32-chars` to both .env files
- **Files modified:** `apps/api/.env`, `.env` (gitignored)
- **Verification:** E2e suites progressed past JWT initialization

**4. [Rule 3 - Blocking] Incomplete database schema from single migration**
- **Found during:** Task 3 (e2e tests)
- **Issue:** `prisma migrate deploy` applied only 1 migration covering vehicles/customers. E2e tests hit `table alert_configs does not exist`
- **Fix:** Used `prisma db push --accept-data-loss` to sync all 18 models to local DB
- **Files modified:** None (runtime DB operation)
- **Verification:** E2e suites progressed past schema errors, 8/12 now pass

---

**Total deviations:** 4 auto-fixed (2 bugs, 2 blocking)
**Impact on plan:** All auto-fixes necessary for test execution. No scope creep.

## E2e Test Results Detail

### Passing Suites (8/12)

| Suite | Tests |
|-------|-------|
| alerts.e2e-spec.ts | All pass |
| audit.e2e-spec.ts | All pass |
| cepik.e2e-spec.ts | All pass |
| contracts.e2e-spec.ts | All pass |
| damage.e2e-spec.ts | All pass |
| notifications.e2e-spec.ts | All pass |
| photos.e2e-spec.ts | All pass |
| vehicles.e2e-spec.ts | All pass |

### Failing Suites (4/12) with Root Causes

| Suite | Failures | Root Cause | Fix Path |
|-------|----------|------------|----------|
| portal.e2e-spec.ts | 7 tests | 429 Too Many Requests -- portal rate limit (5 req/min per Phase 20 decision) hit during rapid test execution | Add rate limit bypass for test environment or increase limit in test config |
| auth.e2e-spec.ts | 4 tests | (a) refresh token returns 400 instead of 201 -- likely token format/validation mismatch; (b) POST /users returns 401 instead of 403 -- JWT token not being accepted | Debug JWT token generation in test helpers; may need matching secret configuration |
| rentals.e2e-spec.ts | 2 tests | `Cannot read properties of undefined (reading 'id')` -- test setup creates rental but response shape changed (likely after pagination/relations refactoring) | Update test to handle current response shape |
| customers.e2e-spec.ts | 1 test | `expect(Array.isArray(res.body)).toBe(true)` fails -- GET /customers now returns paginated object `{ data: [...], total, page }` per Phase 22 pagination pattern | Update test to use `res.body.data` |

## Issues Encountered

- Docker Desktop was listed as a blocker in STATE.md but Docker CLI (v29.3.1) is available and functional
- Migration count (1) vs model count (18) mismatch suggests migrations were not kept up to date during development phases

## User Setup Required

None - local Docker infrastructure starts automatically via `docker compose up -d`.

## Next Steps

- Fix the 4 failing e2e test suites (portal rate limiting, auth token handling, rentals/customers response shapes)
- Add `PORTAL_JWT_SECRET` to the committed .env files or update .env generation tooling
- Consider creating additional Prisma migrations to match the full schema

---
*Quick task: 260328-otq*
*Completed: 2026-03-28*
