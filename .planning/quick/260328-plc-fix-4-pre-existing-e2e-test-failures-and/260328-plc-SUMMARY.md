---
phase: quick
plan: 260328-plc
subsystem: testing
tags: [e2e, jest, nestjs, throttler, pagination, portal, auth]

requires:
  - phase: 260328-otq
    provides: e2e test infrastructure configuration and baseline results

provides:
  - "All 12 e2e test suites passing (124/124 tests)"
  - "ThrottlerGuard bypass pattern for e2e tests"
  - "Paginated response shape assertions for rentals and customers"

affects: [e2e-tests, ci-cd]

tech-stack:
  added: []
  patterns:
    - "jest.spyOn(ThrottlerGuard.prototype, 'canActivate') for e2e throttle bypass"
    - "Paginated response shape: res.body.data/total/page for list endpoints"

key-files:
  created: []
  modified:
    - apps/api/test/portal.e2e-spec.ts
    - apps/api/test/auth.e2e-spec.ts
    - apps/api/test/rentals.e2e-spec.ts
    - apps/api/test/customers.e2e-spec.ts

key-decisions:
  - "Override ThrottlerGuard via jest.spyOn prototype mock instead of Redis key clearing (throttler uses in-memory storage, not Redis)"
  - "Add transform: true to auth and customers test ValidationPipe to match production config"

patterns-established:
  - "ThrottlerGuard bypass: jest.spyOn at file level before describe block for e2e tests that exceed rate limits"

requirements-completed: [e2e-fix]

duration: 45min
completed: 2026-03-28
---

# Quick Task 260328-plc: Fix Pre-existing E2E Test Failures Summary

**Fixed 4 e2e test failures across portal, auth, rentals, and customers suites -- 124/124 tests now green**

## Performance

- **Duration:** 45 min
- **Started:** 2026-03-28T17:38:50Z
- **Completed:** 2026-03-28T18:24:00Z
- **Tasks:** 3 (2 implementation + 1 verification)
- **Files modified:** 4

## Accomplishments
- All 12 e2e test suites passing with 124/124 tests green
- Portal exchange tests no longer hit 429 rate limit
- Auth refresh and role enforcement tests pass with correct status codes
- Rentals and customers GET endpoints tested against paginated response shape
- API starts and health endpoint responds with status ok

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix portal rate limit and auth JWT test failures** - `f9cb302` (fix)
2. **Task 2: Fix rentals and customers pagination response shape assertions** - `1c7eb1c` (fix)
3. **Task 3: Run full e2e suite to confirm 124/124 green** - verification only, no commit needed

## Files Created/Modified
- `apps/api/test/portal.e2e-spec.ts` - Added ThrottlerGuard bypass via jest.spyOn to prevent 429 during rapid exchange calls
- `apps/api/test/auth.e2e-spec.ts` - Added ThrottlerGuard bypass, added transform: true to ValidationPipe
- `apps/api/test/rentals.e2e-spec.ts` - Updated assertions to use res.body.data for paginated GET /rentals
- `apps/api/test/customers.e2e-spec.ts` - Updated assertions to use res.body.data/total/page, added transform: true

## Decisions Made
- Used `jest.spyOn(ThrottlerGuard.prototype, 'canActivate').mockResolvedValue(true)` instead of Redis key clearing because NestJS ThrottlerModule uses in-memory storage by default, not Redis. The plan's suggested approach of clearing `*throttler*` Redis keys would not have worked.
- Added `transform: true` to ValidationPipe in auth and customers tests to match the production config pattern used by other passing test files (rentals, portal).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing PORTAL_JWT_SECRET env var**
- **Found during:** Task 1 (auth e2e tests)
- **Issue:** All auth tests failed with "JwtStrategy requires a secret or key" because PORTAL_JWT_SECRET was missing from .env files (present in .env.example but not .env)
- **Fix:** Added PORTAL_JWT_SECRET to both root .env and apps/api/.env (gitignored files, not committed)
- **Files modified:** .env, apps/api/.env (both gitignored)
- **Verification:** Auth tests proceed past module compilation

**2. [Rule 1 - Bug] Changed throttler bypass from Redis key clearing to jest.spyOn**
- **Found during:** Task 1 (portal and auth tests)
- **Issue:** Plan suggested clearing Redis `*throttler*` keys, but NestJS ThrottlerModule uses in-memory storage, not Redis. Redis key clearing had no effect on rate limiting.
- **Fix:** Used `jest.spyOn(ThrottlerGuard.prototype, 'canActivate').mockResolvedValue(true)` at file level to bypass throttling entirely in test files
- **Files modified:** apps/api/test/portal.e2e-spec.ts, apps/api/test/auth.e2e-spec.ts
- **Verification:** All 14 auth tests and 13 portal tests pass without 429 errors

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both deviations were necessary -- the plan's approach would not have worked due to incorrect assumption about throttler storage backend.

## Issues Encountered
- The `node dist/main.js` command fails with "Cannot find module 'express'" due to pnpm strict hoisting. This is a pre-existing infrastructure issue unrelated to e2e tests. The API starts correctly via `npx nest start`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- E2e test baseline is fully green (124/124)
- Blocker "4 pre-existing e2e test failures" is resolved
- Ready for CI/CD pipeline integration

---
*Quick task: 260328-plc*
*Completed: 2026-03-28*
