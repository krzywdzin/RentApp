---
phase: 13-dependencies-performance
plan: 02
subsystem: api
tags: [prisma, nestjs, react-query, n-plus-one, server-side-filtering]

requires:
  - phase: 12-typescript-strictness
    provides: typed service methods and DTOs
provides:
  - GET /contracts list endpoint returning all contracts in single query
  - GET /rentals with customerId/vehicleId server-side filtering
  - Single-query useContracts hook replacing N+1 pattern
  - Filtered useRentals hook with RentalFilters interface
affects: [14-testing]

tech-stack:
  added: []
  patterns: [server-side filtering via query params, single-query list endpoints]

key-files:
  created: []
  modified:
    - apps/api/src/contracts/contracts.controller.ts
    - apps/api/src/contracts/contracts.service.ts
    - apps/api/src/rentals/rentals.controller.ts
    - apps/api/src/rentals/rentals.service.ts
    - apps/web/src/hooks/queries/use-contracts.ts
    - apps/web/src/hooks/queries/use-rentals.ts
    - apps/web/src/app/(admin)/klienci/[id]/page.tsx
    - apps/web/src/app/(admin)/pojazdy/[id]/page.tsx

key-decisions:
  - "Used RentalFilters interface with URLSearchParams for clean query string building"
  - "Kept useRentals backward-compatible -- no-arg calls still fetch all rentals"

patterns-established:
  - "Server-side filtering via optional query params instead of client-side array filtering"

requirements-completed: [PERF-01, PERF-02]

duration: 2min
completed: 2026-03-25
---

# Phase 13 Plan 02: N+1 Query Fix and Server-Side Filtering Summary

**Single-query GET /contracts endpoint replacing N+1 fetch pattern, plus customerId/vehicleId server-side filtering on GET /rentals**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T03:46:36Z
- **Completed:** 2026-03-25T03:48:59Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Eliminated N+1 query pattern: contract list now uses single GET /contracts with Prisma join instead of fetching one contract per rental
- Added server-side customerId/vehicleId filtering to GET /rentals endpoint
- Customer detail page fetches only its own rentals instead of all rentals
- Vehicle detail page fetches only its own rentals instead of all rentals

## Task Commits

Each task was committed atomically:

1. **Task 1: Add GET /contracts list endpoint and filter params to GET /rentals** - `e04b967` (feat)
2. **Task 2: Update web hooks and detail pages to use new endpoints** - `e530ed4` (feat)

## Files Created/Modified
- `apps/api/src/contracts/contracts.controller.ts` - Added GET /contracts list endpoint before :id route
- `apps/api/src/contracts/contracts.service.ts` - Added findAll() method with single Prisma query
- `apps/api/src/rentals/rentals.controller.ts` - Added customerId/vehicleId query params to findAll
- `apps/api/src/rentals/rentals.service.ts` - Extended findAll with customerId/vehicleId where clauses
- `apps/web/src/hooks/queries/use-contracts.ts` - Replaced N+1 Promise.allSettled with single GET /contracts
- `apps/web/src/hooks/queries/use-rentals.ts` - Added RentalFilters interface with URLSearchParams building
- `apps/web/src/app/(admin)/klienci/[id]/page.tsx` - Server-side customerId filter, removed client-side filtering
- `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` - Server-side vehicleId filter, removed client-side filtering

## Decisions Made
- Used RentalFilters interface with URLSearchParams for clean query string building instead of manual string concatenation
- Kept useRentals backward-compatible: callers passing no args still fetch all rentals
- Used type assertion for rentalKeys.list parameter to satisfy Record<string, unknown> constraint

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- API performance patterns established for contract list and rental filtering
- Ready for Phase 14 (testing)

---
*Phase: 13-dependencies-performance*
*Completed: 2026-03-25*
