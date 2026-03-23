---
phase: 03-rental-lifecycle
plan: 03
subsystem: api
tags: [nestjs, prisma, rental-lifecycle, state-machine, tdd, e2e, events]

# Dependency graph
requires:
  - phase: 03-rental-lifecycle (plan 01-02)
    provides: "Rental CRUD, state machine, overlap detection, calendar, DTOs"
provides:
  - "processReturn service method with mileage + inspection recording"
  - "extend service method with pricing recalculation and overlap checks"
  - "rollback service method with admin transition map and vehicle status adjustment"
  - "Domain events: rental.returned, rental.extended, rental.rolledBack"
  - "Full e2e test suite covering all rental endpoints with role enforcement"
affects: [04-contracts, 05-mobile-app]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Service-layer audit metadata (not controller duplication)", "Raw SQL with camelCase column names for Prisma"]

key-files:
  created: []
  modified:
    - "apps/api/src/rentals/rentals.service.ts"
    - "apps/api/src/rentals/rentals.service.spec.ts"
    - "apps/api/src/rentals/rentals.controller.ts"
    - "apps/api/test/rentals.e2e-spec.ts"

key-decisions:
  - "Audit metadata generated in service layer, controller simply returns service result"
  - "ConflictException thrown for extension overlaps (no override unlike creation)"
  - "Return data cleared on rollback from RETURNED state"

patterns-established:
  - "Service methods return __audit metadata for interceptor consumption"
  - "Vehicle status side-effects managed in same transaction as rental update"

requirements-completed: [RENT-04, RENT-05]

# Metrics
duration: 18min
completed: 2026-03-23
---

# Phase 3 Plan 3: Return, Extend, Rollback and E2E Summary

**Vehicle return with inspection comparison, admin extension with pricing recalculation, admin rollback with audit trail, and 15 e2e tests covering full rental lifecycle**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-23T22:19:04Z
- **Completed:** 2026-03-23T22:37:07Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- processReturn records mileage + optional inspection, sets vehicle AVAILABLE, returns handover+return for side-by-side comparison
- extend recalculates pricing from dailyRateNet, checks overlaps (ConflictException), enforces admin-only via @Roles
- rollback uses admin rollback map, adjusts vehicle status, clears return data, logs reason in audit
- Domain events emitted for all state transitions (rental.returned, rental.extended, rental.rolledBack)
- 35 unit tests and 15 e2e tests pass, no it.todo stubs remaining

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Add failing tests** - `7999fd1` (test)
2. **Task 1 (GREEN): Implement processReturn, extend, rollback** - `b265e8c` (feat)
3. **Task 2: Wire controller + e2e tests** - `e17ca24` (feat)

_TDD: Task 1 split into RED (failing tests) and GREEN (implementation) commits_

## Files Created/Modified
- `apps/api/src/rentals/rentals.service.ts` - processReturn, extend, rollback implementations with events and audit
- `apps/api/src/rentals/rentals.service.spec.ts` - 18 new unit tests (35 total) covering all behaviors
- `apps/api/src/rentals/rentals.controller.ts` - Simplified to delegate audit metadata to service layer
- `apps/api/test/rentals.e2e-spec.ts` - 15 e2e tests replacing all it.todo stubs

## Decisions Made
- Moved audit metadata generation to service layer -- controller was double-wrapping and using wrong (post-update) status for old value
- ConflictException for extension overlaps (no overrideConflict option unlike creation) -- extensions should not silently create conflicts
- Return data (returnMileage, returnData) cleared when rolling back from RETURNED to prevent stale inspection data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed raw SQL column names in checkOverlap**
- **Found during:** Task 2 (e2e tests)
- **Issue:** Raw SQL used snake_case column names (start_date, end_date, vehicle_id) but Prisma generates camelCase columns without explicit @map
- **Fix:** Changed to quoted camelCase ("startDate", "endDate", "vehicleId")
- **Files modified:** apps/api/src/rentals/rentals.service.ts
- **Verification:** All e2e tests pass, overlap detection works correctly
- **Committed in:** e17ca24 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed controller audit metadata duplication**
- **Found during:** Task 2 (controller wiring)
- **Issue:** Controller was overriding service __audit with incorrect old status (using post-update rental.status)
- **Fix:** Simplified controller to return service result directly (audit metadata already correct in service)
- **Files modified:** apps/api/src/rentals/rentals.controller.ts
- **Verification:** Audit metadata in e2e responses has correct old/new status values
- **Committed in:** e17ca24 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- E2e test timeouts on slower operations (resetVehicleStatus + create + return chains) -- increased individual test timeouts to 15s where needed

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Full rental lifecycle API complete (CRUD, activation, return, extension, rollback)
- All endpoints tested with role enforcement (admin vs employee)
- Ready for Phase 4 (Contracts/PDF generation) which depends on rental data

---
*Phase: 03-rental-lifecycle*
*Completed: 2026-03-23*
