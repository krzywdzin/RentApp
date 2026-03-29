---
phase: 31-vehicle-import
plan: 01
subsystem: ui, api
tags: [multipart, formdata, file-upload, csv, xlsx, vehicle-import]

requires:
  - phase: none
    provides: standalone feature
provides:
  - BFF proxy multipart/form-data forwarding
  - Vehicle import dialog with file picker, upload, results summary
  - useImportVehicles mutation hook
affects: [vehicle-management]

tech-stack:
  added: []
  patterns: [multipart proxy forwarding with arrayBuffer, FormData-aware apiClient]

key-files:
  created:
    - apps/web/src/app/(admin)/pojazdy/import-dialog.tsx
  modified:
    - apps/web/src/app/api/[...path]/route.ts
    - apps/web/src/lib/api-client.ts
    - apps/web/src/hooks/queries/use-vehicles.ts
    - apps/web/src/app/(admin)/pojazdy/vehicles-page.tsx

key-decisions:
  - "BFF proxy uses arrayBuffer for multipart body to avoid binary corruption from text encoding"
  - "apiClient omits Content-Type for FormData to let browser set boundary automatically"

patterns-established:
  - "Multipart proxy: detect content-type, forward arrayBuffer body with original headers"
  - "FormData mutation: skip Content-Type header, let fetch/browser handle it"

requirements-completed: [VIMP-01, VIMP-02, VIMP-03, VIMP-04, VIMP-05]

duration: 2min
completed: 2026-03-29
---

# Phase 31 Plan 01: Vehicle Import UI Summary

**BFF multipart proxy fix and vehicle import dialog with file picker, upload progress, and error details table**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T17:48:38Z
- **Completed:** 2026-03-29T17:50:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- BFF proxy now detects multipart/form-data requests and forwards them with original Content-Type (preserving boundary) and arrayBuffer body
- apiClient supports FormData by omitting Content-Type header, allowing browser to set it with boundary
- Import dialog component with three states: file selection, uploading spinner, results summary with error details table
- Importuj button added to vehicles page header next to Dodaj pojazd

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix BFF proxy for multipart and add import mutation hook** - `6658ef8` (feat)
2. **Task 2: Build import dialog and wire into vehicles page** - `e25726e` (feat)

## Files Created/Modified
- `apps/web/src/app/api/[...path]/route.ts` - BFF proxy with multipart detection and arrayBuffer forwarding
- `apps/web/src/lib/api-client.ts` - FormData-aware Content-Type handling in apiClient
- `apps/web/src/hooks/queries/use-vehicles.ts` - useImportVehicles mutation hook with ImportResult type
- `apps/web/src/app/(admin)/pojazdy/import-dialog.tsx` - Import dialog with file picker, template download, results summary, error table
- `apps/web/src/app/(admin)/pojazdy/vehicles-page.tsx` - Importuj button and ImportDialog integration

## Decisions Made
- BFF proxy uses arrayBuffer (not text) for multipart body to avoid binary corruption from text encoding
- apiClient omits Content-Type for FormData to let browser set boundary automatically

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Vehicle import UI is complete and ready for backend endpoint integration
- Template download depends on backend GET /vehicles/import/template endpoint
- Import upload depends on backend POST /vehicles/import endpoint

---
*Phase: 31-vehicle-import*
*Completed: 2026-03-29*
