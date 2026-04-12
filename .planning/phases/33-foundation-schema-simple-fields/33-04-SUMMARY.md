---
phase: 33-foundation-schema-simple-fields
plan: 04
subsystem: ui
tags: [react, tanstack-query, shadcn, next.js, vehicle-classes, crud]

# Dependency graph
requires:
  - phase: 33-foundation-schema-simple-fields/02
    provides: API endpoints for vehicle classes, rental/customer DTO fields
  - phase: 33-foundation-schema-simple-fields/03
    provides: Mobile UI forms for new fields
provides:
  - Vehicle class CRUD management page at /klasy
  - Vehicle class dropdown in vehicle create/edit forms
  - Vehicle class column in vehicle list table
  - Company/insurance/class fields in rental detail view
  - Insurance filter and search in rental list
  - Structured address display in customer views
affects: [34-contract-frozen-data, 35-rental-flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [react-query-crud-hooks, dialog-based-crud-page]

key-files:
  created:
    - apps/web/src/hooks/queries/use-vehicle-classes.ts
    - apps/web/src/app/(admin)/klasy/page.tsx
  modified:
    - apps/web/src/app/(admin)/pojazdy/columns.tsx
    - apps/web/src/app/(admin)/pojazdy/nowy/page.tsx
    - apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx
    - apps/web/src/app/(admin)/wynajmy/[id]/page.tsx
    - apps/web/src/app/(admin)/wynajmy/columns.tsx
    - apps/web/src/app/(admin)/wynajmy/filter-bar.tsx
    - apps/web/src/app/(admin)/wynajmy/page.tsx
    - apps/web/src/app/(admin)/klienci/columns.tsx
    - apps/web/src/components/layout/sidebar.tsx

key-decisions:
  - "Vehicle class CRUD uses dialog-based pattern (not separate pages) since < 20 classes expected"
  - "Delete blocked by 409 shows user-friendly toast rather than error page"

patterns-established:
  - "Dialog-based CRUD: for simple entities with few fields, use shadcn Dialog for create/edit instead of dedicated pages"
  - "React Query CRUD hooks: vehicleClassKeys pattern with all/list/detail hierarchy and mutation invalidation"

requirements-completed: [FLOTA-01, FLOTA-02, FLOTA-03, NAJEM-01, KLIENT-04]

# Metrics
duration: 35min
completed: 2026-04-12
---

# Phase 33 Plan 04: Web Admin UI Summary

**Vehicle class CRUD page at /klasy with dialog-based management, class dropdown in vehicle forms, company/insurance/class fields in rental detail, insurance filtering in rental list, and structured address in customer views**

## Performance

- **Duration:** 35 min
- **Started:** 2026-04-12T18:00:00Z
- **Completed:** 2026-04-12T18:35:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Full CRUD page for vehicle classes at /klasy with create/edit dialogs, delete confirmation with 409 guard, empty state, and sidebar navigation
- React Query hooks (useVehicleClasses, useCreateVehicleClass, useUpdateVehicleClass, useDeleteVehicleClass) following established project patterns
- Vehicle create/edit forms now require vehicle class selection via dropdown
- Rental detail view displays company info (NIP, VAT status), insurance case number, and vehicle class
- Rental list supports filtering by insurance presence and searching by case number
- Customer list and detail views display structured address fields instead of single string

## Task Commits

Each task was committed atomically:

1. **Task 1: Vehicle class CRUD page (/klasy) with query hooks** - `276f8eb` (feat)
2. **Task 2: Update vehicle forms/list, rental detail/filters, customer detail** - `463d65e` (feat)
3. **Task 3: Human verification checkpoint** - approved (no commit, verification-only)

## Files Created/Modified
- `apps/web/src/hooks/queries/use-vehicle-classes.ts` - React Query CRUD hooks for vehicle class API
- `apps/web/src/app/(admin)/klasy/page.tsx` - Vehicle class management page with dialog-based CRUD
- `apps/web/src/components/layout/sidebar.tsx` - Added "Klasy" nav link
- `apps/web/src/app/(admin)/pojazdy/columns.tsx` - Added "Klasa" column to vehicle list table
- `apps/web/src/app/(admin)/pojazdy/nowy/page.tsx` - Added vehicle class dropdown (required)
- `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx` - Added vehicle class dropdown with pre-selection
- `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` - Added company info, insurance case number, vehicle class display
- `apps/web/src/app/(admin)/wynajmy/columns.tsx` - Added insurance case number badge
- `apps/web/src/app/(admin)/wynajmy/filter-bar.tsx` - Added insurance toggle filter and case number search
- `apps/web/src/app/(admin)/wynajmy/page.tsx` - Wired insurance filter params to rental query
- `apps/web/src/app/(admin)/klienci/columns.tsx` - Replaced single address with structured address display

## Decisions Made
- Vehicle class CRUD uses dialog-based pattern (not separate pages) since fewer than 20 classes expected
- Delete blocked by 409 shows user-friendly toast rather than error page

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 33 web admin UI complete -- vehicle classes, company/insurance fields, structured addresses all visible
- Phase 34 (Contract Frozen Data) can proceed with confidence that all new fields are surfaced in the UI
- Mobile UI (Plan 03) and Web UI (Plan 04) both verified by human checkpoint

## Self-Check: PASSED

- [x] use-vehicle-classes.ts exists
- [x] klasy/page.tsx exists
- [x] Commit 276f8eb verified
- [x] Commit 463d65e verified

---
*Phase: 33-foundation-schema-simple-fields*
*Completed: 2026-04-12*
