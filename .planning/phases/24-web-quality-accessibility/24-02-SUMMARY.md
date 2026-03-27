---
phase: 24-web-quality-accessibility
plan: 02
subsystem: ui
tags: [react, nextjs, error-handling, tanstack-query, proxy]

requires:
  - phase: 24-01
    provides: ErrorState shared component with retry button
provides:
  - ErrorState integration on vehicle, customer, rental edit, contract, photo documentation pages
  - try/catch on createRental submit preventing unhandled promise rejections
  - Portal auth error logging via console.error
  - Proxy non-JSON response handling with descriptive error body
affects: []

tech-stack:
  added: []
  patterns: [isError-refetch-ErrorState-pattern, try-catch-mutateAsync-pattern]

key-files:
  created: []
  modified:
    - apps/web/src/app/(admin)/pojazdy/[id]/page.tsx
    - apps/web/src/app/(admin)/klienci/[id]/page.tsx
    - apps/web/src/app/(admin)/wynajmy/[id]/edytuj/page.tsx
    - apps/web/src/app/(admin)/umowy/[id]/page.tsx
    - apps/web/src/app/(admin)/wynajmy/[id]/dokumentacja/page.tsx
    - apps/web/src/app/(admin)/wynajmy/nowy/page.tsx
    - apps/web/src/hooks/use-portal-auth.ts
    - apps/web/src/app/api/[...path]/route.ts

key-decisions:
  - "Photo documentation page combines photoQuery and damageQuery error checks with joint refetch"
  - "createRental try/catch has empty catch body since mutation onError handles toast"

patterns-established:
  - "isError + ErrorState + refetch pattern for detail pages with query hooks"
  - "try/catch wrapping mutateAsync to prevent unhandled promise rejections"

requirements-completed: [WERR-01, WERR-02, WERR-03, WERR-04, WERR-05]

duration: 3min
completed: 2026-03-27
---

# Phase 24 Plan 02: Error Handling on Detail Pages Summary

**ErrorState with retry on all detail pages, try/catch on rental submit, portal auth error logging, and proxy non-JSON handling**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T23:34:52Z
- **Completed:** 2026-03-27T23:38:01Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added isError + ErrorState with retry button to 5 detail pages (vehicle, customer, rental edit, contract, photo documentation)
- Wrapped createRental mutateAsync in try/catch to prevent unhandled promise rejections
- Added console.error logging to portal auth fetchPortalAuth and exchangeToken catch blocks
- Proxy route now returns descriptive error body with status code for non-JSON backend responses

## Task Commits

Each task was committed atomically:

1. **Task 1: Add isError handling to all detail pages** - `8f373a5` (feat)
2. **Task 2: Fix rental submit, portal auth, and proxy error handling** - `9842d03` (fix)

## Files Created/Modified
- `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` - Added isError/refetch destructuring and ErrorState return
- `apps/web/src/app/(admin)/klienci/[id]/page.tsx` - Added isError/refetch destructuring and ErrorState return
- `apps/web/src/app/(admin)/wynajmy/[id]/edytuj/page.tsx` - Added isError/refetch destructuring and ErrorState return
- `apps/web/src/app/(admin)/umowy/[id]/page.tsx` - Added isError/refetch destructuring and ErrorState return
- `apps/web/src/app/(admin)/wynajmy/[id]/dokumentacja/page.tsx` - Combined photo/damage query error check with joint refetch
- `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` - Wrapped mutateAsync in try/catch
- `apps/web/src/hooks/use-portal-auth.ts` - Added console.error to fetchPortalAuth and exchangeToken catch blocks
- `apps/web/src/app/api/[...path]/route.ts` - Non-JSON fallback returns error message and status code

## Decisions Made
- Photo documentation page uses combined error check (`photoQuery.isError || damageQuery.isError`) with a single ErrorState that refetches both queries, rather than separate error states per query
- createRental try/catch has empty catch body since the mutation's onError callback already handles user-facing toast notifications

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing prettier error in csv-export.ts and pre-existing TS error in wynajmy/[id]/page.tsx cause build to fail. These are NOT caused by plan-02 changes and were already documented in plan-01 deferred-items.md.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All detail pages now show actionable error messages with retry on API failure
- No blank screens or misleading "not found" messages on query errors
- Portal auth errors are logged for debugging

## Self-Check: PASSED

All 8 modified files verified present. Both task commits (8f373a5, 9842d03) verified in git log.

---
*Phase: 24-web-quality-accessibility*
*Completed: 2026-03-27*
