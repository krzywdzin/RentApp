---
phase: 03-rental-lifecycle
plan: 02
subsystem: api
tags: [nestjs, prisma, state-machine, tstzrange, overlap-detection, calendar, tdd]

# Dependency graph
requires:
  - phase: 03-rental-lifecycle
    plan: 01
    provides: "Rental Prisma model, shared types, state machine, pricing utility, DTOs, module scaffold"
  - phase: 02-fleet-and-customer-data
    provides: "Vehicle and Customer Prisma models, VehicleStatus enum"
provides:
  - "RentalsService with create, findAll, findOne, activate, checkOverlap, getCalendar methods"
  - "Overlap detection via raw SQL tstzrange with '[)' bounds"
  - "State machine enforcement on activate (DRAFT->ACTIVE)"
  - "Vehicle status update to RENTED on rental activation"
  - "Calendar endpoint returning vehicle-grouped timeline with conflict flags"
  - "RentalsController with 409 Conflict on overlap, status filter, audit metadata"
  - "17 unit tests covering create, overlap, activate, calendar, findAll, findOne"
affects: [03-03-PLAN, 04-contract-pdf, 05-admin-panel]

# Tech tracking
tech-stack:
  added: []
  patterns: ["tstzrange overlap detection via $queryRaw", "409 Conflict response for double-booking", "vehicle-grouped calendar with hasConflict flags"]

key-files:
  created: []
  modified:
    - "apps/api/src/rentals/rentals.service.ts"
    - "apps/api/src/rentals/rentals.controller.ts"
    - "apps/api/src/rentals/rentals.service.spec.ts"

key-decisions:
  - "checkOverlap returns OverlapConflict[] instead of boolean for richer conflict data in 409 response"
  - "Calendar groups by vehicle with hasConflict per-rental for admin timeline visualization"
  - "findAll accepts optional RentalStatus filter via query param"

patterns-established:
  - "Overlap detection: raw SQL tstzrange with '[)' bounds, excluding RETURNED status"
  - "Conflict response: service returns { rental: null, conflicts } for controller to map to 409"
  - "Transaction pattern: $transaction callback for multi-table mutations (rental create + vehicle status)"

requirements-completed: [RENT-01, RENT-02, RENT-03]

# Metrics
duration: 4min
completed: 2026-03-23
---

# Phase 3 Plan 2: Rental CRUD and State Machine Summary

**RentalsService with tstzrange overlap detection, DRAFT->ACTIVE state machine, grosze pricing, and vehicle-grouped calendar endpoint with 17 TDD unit tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-23T22:11:53Z
- **Completed:** 2026-03-23T22:16:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- RentalsService.create() with pricing calculation, overlap detection via raw SQL tstzrange, and override support
- State machine enforcement: activate() validates DRAFT->ACTIVE, updates vehicle to RENTED, stores handover data
- Calendar endpoint returns vehicle-grouped timeline with per-rental hasConflict flags
- Controller wired with 409 Conflict on overlap, status filter on findAll, audit metadata on mutations
- 17 unit tests (TDD red-green) covering all service methods replacing it.todo() stubs

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement rental creation, overlap detection, and state machine in RentalsService** - `9287f5d` (feat, TDD)
2. **Task 2: Wire RentalsController endpoints for create, list, calendar, activate** - `e243916` (feat)

## Files Created/Modified
- `apps/api/src/rentals/rentals.service.ts` - Full CRUD, overlap detection, state machine, calendar implementation
- `apps/api/src/rentals/rentals.service.spec.ts` - 17 unit tests replacing it.todo() stubs
- `apps/api/src/rentals/rentals.controller.ts` - 409 Conflict handling, status filter, @Res passthrough

## Decisions Made
- **checkOverlap returns OverlapConflict[] not boolean:** Richer return type enables controller to pass conflict details in 409 response body, better for frontend display.
- **Calendar groups by vehicle:** Vehicle-grouped format with hasConflict per-rental optimized for admin timeline visualization (Phase 5).
- **findAll with optional status filter:** Query param filter allows frontend to fetch only ACTIVE or DRAFT rentals without client-side filtering.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Changed checkOverlap return type from boolean to OverlapConflict[]**
- **Found during:** Task 1 (TDD RED phase)
- **Issue:** Plan 01 scaffold defined `checkOverlap` returning `Promise<boolean>`, but Plan 02 requires returning conflict details for 409 response
- **Fix:** Changed return type to `Promise<OverlapConflict[]>` with id, startDate, endDate, status fields
- **Files modified:** apps/api/src/rentals/rentals.service.ts
- **Verification:** TypeScript compiles, all tests pass
- **Committed in:** 9287f5d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Return type change was required by Plan 02 spec. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Service methods for processReturn, extend, and rollback are stubbed ready for Plan 03
- Event emission patterns established (rental.created, rental.activated) for Plan 03 to follow
- Calendar endpoint ready for admin panel consumption in Phase 5
- All 91 tests pass across full API test suite

## Self-Check: PASSED

All 3 modified files verified present. Both task commits (9287f5d, e243916) verified in git log. 17 service unit tests pass. 91 total tests pass across full API suite. TypeScript compiles cleanly.

---
*Phase: 03-rental-lifecycle*
*Completed: 2026-03-23*
