---
phase: 05-admin-panel
plan: 02
subsystem: ui
tags: [react, tanstack-table, react-hook-form, zod, shadcn-ui, nuqs]

# Dependency graph
requires:
  - phase: 05-admin-panel
    plan: 01
    provides: DataTable component, API client, auth BFF proxy, sidebar layout, query hook pattern
  - phase: 02-vehicle-customer
    provides: Vehicle and customer CRUD API endpoints, shared Zod schemas and types
provides:
  - Vehicle list page with sortable columns, status badges, filter bar (registration/VIN + status), bulk operations (status change + CSV export)
  - Vehicle create/edit forms with Zod validation from @rentapp/shared
  - Vehicle detail page with 3 tabs (Dane, Wynajmy, Dokumenty)
  - Customer list page with name/phone filter bar and empty state
  - Customer create/edit forms with Zod validation (personal data, ID documents, license)
  - Customer detail page with 2 tabs (Dane, Wynajmy)
  - CSV export utility with BOM for Polish character support
  - Full vehicle and customer query/mutation hooks (CRUD + archive + bulk update)
affects: [05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [client-side filtering with nuqs URL state, Suspense boundary for nuqs pages, z.input form types for Zod schemas with defaults, named component + page.tsx Suspense wrapper pattern]

key-files:
  created:
    - apps/web/src/app/(admin)/klienci/page.tsx
    - apps/web/src/app/(admin)/klienci/customers-page.tsx
    - apps/web/src/app/(admin)/klienci/columns.tsx
    - apps/web/src/app/(admin)/klienci/filter-bar.tsx
    - apps/web/src/app/(admin)/klienci/nowy/page.tsx
    - apps/web/src/app/(admin)/klienci/[id]/page.tsx
    - apps/web/src/app/(admin)/klienci/[id]/edytuj/page.tsx
  modified:
    - apps/web/src/hooks/queries/use-customers.ts
    - apps/web/src/hooks/queries/use-vehicles.ts
    - apps/web/src/lib/csv-export.ts

key-decisions:
  - "Used z.input<typeof Schema> for form types to avoid type mismatch with Zod schemas using .default() modifiers"
  - "Suspense wrapper pattern: page.tsx wraps named component for nuqs/useSearchParams compatibility in Next.js 15"
  - "Client-side filtering for both vehicles and customers -- dataset is small enough to filter in-memory"

patterns-established:
  - "Suspense Page Pattern: page.tsx imports and wraps 'use client' component with Suspense for nuqs compatibility"
  - "Form Type Pattern: z.input<typeof Schema> for react-hook-form types when schema has .default() modifiers"
  - "CRUD Page Structure: list page + filter-bar + columns + nowy/page + [id]/page + [id]/edytuj/page"
  - "Customer Filter: debounced text search matching lastName, firstName, phone"

requirements-completed: [ADMIN-01, ADMIN-02]

# Metrics
duration: 13min
completed: 2026-03-24
---

# Phase 5 Plan 2: Vehicle and Customer CRUD Summary

**Vehicle and customer management pages with sortable data tables, Zod-validated forms, detail pages with tabs, and vehicle bulk operations (status change + CSV export)**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-24T15:41:41Z
- **Completed:** 2026-03-24T15:54:41Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Vehicle pages (list, create, edit, detail) with full CRUD operations, status badges, filter bar, and bulk operations (checkbox select + status change + CSV export)
- Customer pages (list, create, edit, detail) with CRUD operations, filter bar (name/phone search), and archive with confirmation
- All forms use Zod schemas from @rentapp/shared with zodResolver for client-side validation
- Polish labels throughout per UI-SPEC copywriting contract

## Task Commits

Each task was committed atomically:

1. **Task 1: Vehicle list with filters and bulk ops, vehicle CRUD forms and detail page** - `ce7c198` (feat) -- committed as part of 05-03 blocking dependency resolution
2. **Task 2: Customer list with filters, customer CRUD forms and detail page** - `9b090cb` (feat)

## Files Created/Modified
- `apps/web/src/app/(admin)/pojazdy/page.tsx` - Suspense wrapper for vehicle list
- `apps/web/src/app/(admin)/pojazdy/vehicles-page.tsx` - Vehicle list with DataTable, filters, bulk ops
- `apps/web/src/app/(admin)/pojazdy/columns.tsx` - Vehicle column definitions with status badges
- `apps/web/src/app/(admin)/pojazdy/filter-bar.tsx` - Registration/VIN search + status filter (nuqs)
- `apps/web/src/app/(admin)/pojazdy/nowy/page.tsx` - Create vehicle form with Zod validation
- `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` - Vehicle detail with Dane/Wynajmy/Dokumenty tabs
- `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx` - Edit vehicle form
- `apps/web/src/hooks/queries/use-vehicles.ts` - Full CRUD + bulk update query hooks
- `apps/web/src/lib/csv-export.ts` - CSV export utility with UTF-8 BOM
- `apps/web/src/app/(admin)/klienci/page.tsx` - Suspense wrapper for customer list
- `apps/web/src/app/(admin)/klienci/customers-page.tsx` - Customer list with DataTable and filter
- `apps/web/src/app/(admin)/klienci/columns.tsx` - Customer column definitions
- `apps/web/src/app/(admin)/klienci/filter-bar.tsx` - Name/phone search filter (nuqs)
- `apps/web/src/app/(admin)/klienci/nowy/page.tsx` - Create customer form with Zod validation
- `apps/web/src/app/(admin)/klienci/[id]/page.tsx` - Customer detail with Dane/Wynajmy tabs
- `apps/web/src/app/(admin)/klienci/[id]/edytuj/page.tsx` - Edit customer form
- `apps/web/src/hooks/queries/use-customers.ts` - Full CRUD + search query hooks

## Decisions Made
- **z.input form types:** Used `z.input<typeof CreateVehicleSchema>` instead of `z.infer<>` for react-hook-form because Zod `.default()` makes fields optional at input level but required at output level, causing zodResolver type mismatch.
- **Suspense wrapper pattern:** Next.js 15 requires Suspense boundary for pages using `useSearchParams` (via nuqs). Created separate `page.tsx` (server component with Suspense) wrapping the `'use client'` component.
- **Client-side filtering:** Both vehicle and customer lists use client-side filtering since fleet datasets are small (<100 records). Filter state persisted in URL via nuqs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vehicle pages committed as part of 05-03 execution**
- **Found during:** Task 1
- **Issue:** A previous 05-03 executor created all vehicle pages as a blocking dependency for rental pages. The vehicle files were already committed in `ce7c198`.
- **Fix:** Verified existing vehicle pages meet all acceptance criteria. No re-creation needed.
- **Files modified:** None (already committed)
- **Verification:** All acceptance criteria grep checks passed, build succeeds

**2. [Rule 1 - Bug] Fixed pre-existing prettier formatting in shadcn-generated and wynajmy files**
- **Found during:** Task 1 build verification
- **Issue:** shadcn-generated UI components used double quotes and wrong formatting; wynajmy files had unused imports
- **Fix:** Ran prettier on affected files, removed unused imports (CalendarResponse, CalendarRentalEntry, RentalStatus from calendar-view.tsx, MoreHorizontal from columns.tsx)
- **Files modified:** 11 shadcn UI component files, 2 wynajmy files
- **Verification:** Build passes

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Task 1 was pre-completed by 05-03 executor. Task 2 (customers) was the main new work. No scope creep.

## Issues Encountered
- Zod `.default()` modifier creates type mismatch between `z.infer` (output type with required fields) and `z.input` (input type with optional fields), causing zodResolver type errors. Resolved by using `z.input<typeof Schema>` for form types.
- Next.js 15 requires Suspense boundary for pages using nuqs/useSearchParams. Resolved by splitting into server component page.tsx wrapper and client component.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Vehicle and customer CRUD complete, ready for rental management (05-03) which references these entities
- All shared patterns (Suspense wrapper, form types, CRUD page structure) documented for reuse
- Query hooks for vehicles and customers available for cross-entity references

## Self-Check: PASSED

All 15 key files verified present. Both task commits (ce7c198, 9b090cb) found in git log. Build passes.

---
*Phase: 05-admin-panel*
*Completed: 2026-03-24*
