---
phase: 39-return-protocol
plan: 03
subsystem: ui
tags: [react, next.js, shadcn, tanstack-query, presigned-url, pdf-download]

requires:
  - phase: 39-return-protocol
    provides: ReturnProtocolsController with GET /:rentalId and GET /:rentalId/download endpoints
provides:
  - useReturnProtocol query hook for fetching protocol by rental ID
  - Protocol download Card section in rental detail page (conditional on RETURNED + protocol exists)
affects: []

tech-stack:
  added: []
  patterns: [conditional-section-rendering-by-status-and-data]

key-files:
  created: []
  modified:
    - apps/web/src/hooks/queries/use-rentals.ts
    - apps/web/src/app/(admin)/wynajmy/[id]/page.tsx

key-decisions:
  - "useReturnProtocol hook added to use-rentals.ts (not separate file) for cohesion with rental queries"
  - "Protocol section placed after Tabs (not inside a tab) for visibility on returned rentals"
  - "Error toast on download failure for user feedback"

patterns-established: []

requirements-completed: [ZWROT-01]

duration: 2min
completed: 2026-04-15
---

# Phase 39 Plan 03: Web Protocol Download Summary

**Return protocol download Card in admin rental detail with presigned URL fetch and conditional rendering for RETURNED rentals**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-14T22:39:31Z
- **Completed:** 2026-04-14T22:41:13Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- useReturnProtocol query hook with retry:false (404 expected for rentals without protocol)
- Protocol download Card visible only when rental.status === RETURNED and protocol data exists
- Download button fetches presigned URL via apiClient and opens PDF in new browser tab
- Generated date shown in muted text below download button

## Task Commits

Each task was committed atomically:

1. **Task 1: Add protocol query hook and download section to rental detail** - `5e05488` (feat)

## Files Created/Modified
- `apps/web/src/hooks/queries/use-rentals.ts` - Added useReturnProtocol query hook
- `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` - Added protocol download Card section with Download icon, presigned URL fetch, and conditional rendering

## Decisions Made
- useReturnProtocol added to existing use-rentals.ts rather than creating a separate use-return-protocols.ts file -- keeps rental-related queries together
- Protocol section placed outside Tabs component (after Tabs, before dialogs) so it is always visible on the page for returned rentals, not buried in a specific tab
- Used apiClient directly in onClick handler for download (consistent with presigned URL pattern -- one-shot fetch, not cached query)
- Added toast.error on download failure for user feedback

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 39 complete: backend API (39-01), mobile wizard (39-02), and web download (39-03) all implemented
- Return protocol feature fully wired end-to-end

---
*Phase: 39-return-protocol*
*Completed: 2026-04-15*
