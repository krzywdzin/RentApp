---
phase: 30-customer-search-verification
plan: 01
subsystem: api, testing
tags: [prisma, jest, e2e, search, pesel, hmac, phone-normalization]

requires:
  - phase: 07-customer-management
    provides: Customer CRUD, encrypted PESEL storage, search endpoint
  - phase: 29-auth-overhaul
    provides: Username-based login (login field replaces email in LoginDto)
provides:
  - Verified customer search for phone, PESEL, and lastName query types
  - Phone search with format normalization (partial numbers, spaces, dashes)
  - Unit tests for mobile detectSearchParam function
  - Fixed e2e test auth after Phase 29 login field change
affects: [mobile-customer-search, api-customers]

tech-stack:
  added: []
  patterns: [phone-contains-search, input-normalization-before-db-query]

key-files:
  created:
    - apps/mobile/__tests__/detect-search-param.test.ts
    - apps/mobile/__mocks__/@gorhom/bottom-sheet.js
  modified:
    - apps/mobile/src/api/customers.api.ts
    - apps/api/src/customers/customers.service.ts
    - apps/api/test/customers.e2e-spec.ts

key-decisions:
  - "Phone search uses Prisma 'contains' with normalization instead of exact match, enabling partial number lookup"
  - "detectSearchParam exported from customers.api.ts for testability without changing module API"

patterns-established:
  - "Phone normalization: strip spaces/dashes/parens before DB query"

requirements-completed: [SRCH-01, SRCH-02, SRCH-03]

duration: 9min
completed: 2026-03-29
---

# Phase 30 Plan 01: Customer Search Verification Summary

**Verified all three search types (phone, PESEL, lastName) end-to-end with 17 e2e tests and 9 unit tests, plus phone format normalization**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-29T17:30:25Z
- **Completed:** 2026-03-29T17:39:31Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- All three customer search types verified working end-to-end: phone (SRCH-01), PESEL via HMAC (SRCH-02), lastName case-insensitive (SRCH-03)
- Phone search enhanced with format normalization -- searching "123456789" now finds "+48123456789"
- Mobile detectSearchParam logic verified with 9 edge-case unit tests
- Fixed e2e test suite broken by Phase 29 auth changes (login field rename)

## Task Commits

Each task was committed atomically:

1. **Task 1: Run e2e tests and verify all three search types pass** - `2890a6e` (test)
2. **Task 2: Verify phone search handles format variations** - `8642434` (feat)

## Files Created/Modified
- `apps/mobile/__tests__/detect-search-param.test.ts` - Unit tests for query type detection (9 cases)
- `apps/mobile/__mocks__/@gorhom/bottom-sheet.js` - Manual mock to unblock mobile test suite
- `apps/mobile/src/api/customers.api.ts` - Exported detectSearchParam for testability
- `apps/api/src/customers/customers.service.ts` - Phone search normalization with contains matching
- `apps/api/test/customers.e2e-spec.ts` - Fixed auth, added 2 partial phone search tests (17 total)

## Decisions Made
- Phone search uses Prisma `contains` with input normalization (strip spaces/dashes/parens) instead of exact match, so partial numbers like "123456789" find "+48123456789"
- Exported `detectSearchParam` as a named export without changing the module's public API (`customersApi` object unchanged)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed e2e test auth after Phase 29 login field change**
- **Found during:** Task 1 (running e2e tests)
- **Issue:** LoginDto changed from `email` to `login` field in Phase 29, but customers e2e test still sent `{ email, password, deviceId }`
- **Fix:** Changed `loginAs` function parameter from `email` to `login` and updated request body
- **Files modified:** apps/api/test/customers.e2e-spec.ts
- **Verification:** All 15 original e2e tests pass
- **Committed in:** 2890a6e (Task 1 commit)

**2. [Rule 3 - Blocking] Added @gorhom/bottom-sheet manual mock**
- **Found during:** Task 1 (running mobile unit tests)
- **Issue:** Mobile jest setup.js tries to mock @gorhom/bottom-sheet but module isn't installed, blocking all mobile tests
- **Fix:** Created `__mocks__/@gorhom/bottom-sheet.js` manual mock
- **Files modified:** apps/mobile/__mocks__/@gorhom/bottom-sheet.js
- **Verification:** Mobile unit tests run successfully
- **Committed in:** 2890a6e (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary to run the test suites. No scope creep.

## Issues Encountered
- FIELD_ENCRYPTION_KEY env var not loaded during e2e test runs without explicit export. Pre-existing issue -- NestJS ConfigModule loads .env but field-encryption.ts reads process.env directly before module init. Tests pass when env var is provided explicitly. Not fixed as out of scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Customer search verified and enhanced, ready for any downstream features
- Mobile detectSearchParam fully tested and exported

---
*Phase: 30-customer-search-verification*
*Completed: 2026-03-29*
