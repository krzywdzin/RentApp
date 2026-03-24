---
phase: 05-admin-panel
plan: 03
subsystem: ui
tags: [react, tanstack-query, tanstack-table, shadcn-ui, gantt-timeline, state-machine-ui, date-fns]

# Dependency graph
requires:
  - phase: 05-admin-panel
    provides: Admin panel foundation (scaffold, auth, layout, DataTable, query hooks, format utils)
  - phase: 03-rental
    provides: Rental CRUD API, calendar endpoint, state transitions
  - phase: 04-contract-pdf
    provides: Contract API, signatures, annexes, PDF generation
provides:
  - Rental list page with date range + status filters and Lista/Kalendarz tabs
  - Custom Gantt timeline calendar with color-coded rental blocks and conflict indicators
  - Create rental form with vehicle/customer selection and pricing calculation
  - Rental detail page with state-aware action buttons (activate, extend, return, rollback)
  - Edit rental page (DRAFT only) with redirect guard
  - Contract list page with status badges
  - Contract detail page with Szczegoly, Podpisy, Aneksy, Audyt tabs
  - Customer search hook (useSearchCustomers) for rental form
  - Comprehensive rental query hooks (CRUD + calendar + state transitions)
  - Contract query hooks (list via rentals, detail, byRental, PDF URL)
affects: [05-04]

# Tech tracking
tech-stack:
  added: [react-day-picker]
  patterns: [Gantt timeline with div positioning, state-machine-aware UI buttons, derived contract list from rentals, customer search dropdown]

key-files:
  created:
    - apps/web/src/app/(admin)/wynajmy/page.tsx
    - apps/web/src/app/(admin)/wynajmy/columns.tsx
    - apps/web/src/app/(admin)/wynajmy/filter-bar.tsx
    - apps/web/src/app/(admin)/wynajmy/calendar-view.tsx
    - apps/web/src/app/(admin)/wynajmy/nowy/page.tsx
    - apps/web/src/app/(admin)/wynajmy/[id]/page.tsx
    - apps/web/src/app/(admin)/wynajmy/[id]/edytuj/page.tsx
    - apps/web/src/app/(admin)/umowy/page.tsx
    - apps/web/src/app/(admin)/umowy/columns.tsx
    - apps/web/src/app/(admin)/umowy/[id]/page.tsx
    - apps/web/src/hooks/queries/use-contracts.ts
    - apps/web/src/hooks/queries/use-customers.ts
  modified:
    - apps/web/src/hooks/queries/use-rentals.ts

key-decisions:
  - "Contract list derived from rentals: no GET /contracts list endpoint exists, so useContracts() fetches all rentals then parallel-fetches each contract via /contracts/rental/:id"
  - "Custom Gantt timeline over external library: div positioning with date-fns calculations for rental blocks, avoiding heavy calendar dependencies"
  - "Client-side filtering for rentals: dataset manageable (<1000), filters run in useMemo rather than server-side API calls"

patterns-established:
  - "State-machine-aware UI: action buttons (Aktywuj, Przedluz, Zwroc, Cofnij) rendered conditionally based on rental status enum"
  - "Dialog-based state transitions: extend/return/rollback use Dialog modals with forms rather than separate pages"
  - "Customer search dropdown: useSearchCustomers with debounced query, inline results dropdown for selection"
  - "Gantt timeline pattern: fixed vehicle column + scrollable date timeline with absolutely positioned rental blocks"

requirements-completed: [ADMIN-01, ADMIN-02]

# Metrics
duration: 11min
completed: 2026-03-24
---

# Phase 5 Plan 3: Rental and Contract Pages Summary

**Rental CRUD with Gantt calendar timeline, state-machine-aware action buttons, and contract detail pages with signatures/annexes display**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-24T15:41:53Z
- **Completed:** 2026-03-24T15:52:53Z
- **Tasks:** 2
- **Files modified:** 36

## Accomplishments
- Built rental list page with Lista/Kalendarz tabs, date range + status filters, and empty states in Polish
- Created custom Gantt timeline calendar showing color-coded rental blocks per vehicle with conflict indicators (red border), zoom levels (Dzien/Tydzien), and navigation controls
- Implemented create rental form with vehicle select, searchable customer dropdown, datetime pickers, pricing calculation, and 409 conflict error handling
- Built rental detail page with state-aware action buttons: Aktywuj (DRAFT), Przedluz/Zwroc (ACTIVE), Zwroc (EXTENDED), Cofnij (all non-DRAFT) -- each with proper dialog forms
- Created contract list page derived from rental data with status filter and contract detail page with 4 tabs: Szczegoly (frozen company/customer/vehicle/rental data), Podpisy (signature table), Aneksy (annex diff display), Audyt (placeholder)
- Expanded rental hooks to 8 hooks covering full CRUD + calendar + all state transitions with Polish toast notifications

## Task Commits

Each task was committed atomically:

1. **Task 1: Rental list, calendar timeline, CRUD forms, and detail page with state actions** - `ce7c198` (feat)
2. **Task 2: Contract list and detail pages** - `cf03db9` (feat)

## Files Created/Modified
- `apps/web/src/app/(admin)/wynajmy/page.tsx` - Rental list with Lista/Kalendarz tabs
- `apps/web/src/app/(admin)/wynajmy/columns.tsx` - Rental table columns with status badges and overdue detection
- `apps/web/src/app/(admin)/wynajmy/filter-bar.tsx` - Date range and status filter bar
- `apps/web/src/app/(admin)/wynajmy/calendar-view.tsx` - Custom Gantt timeline with vehicle rows and rental blocks
- `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` - Create rental form with vehicle/customer selection
- `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` - Rental detail with state-aware actions and inspection display
- `apps/web/src/app/(admin)/wynajmy/[id]/edytuj/page.tsx` - Edit rental (DRAFT only)
- `apps/web/src/app/(admin)/umowy/page.tsx` - Contract list with status filter
- `apps/web/src/app/(admin)/umowy/columns.tsx` - Contract table columns with PDF download
- `apps/web/src/app/(admin)/umowy/[id]/page.tsx` - Contract detail with 4 tabs
- `apps/web/src/hooks/queries/use-rentals.ts` - 8 rental hooks (list, detail, calendar, create, activate, return, extend, rollback)
- `apps/web/src/hooks/queries/use-contracts.ts` - Contract hooks (list, detail, byRental, PDF URL)
- `apps/web/src/hooks/queries/use-customers.ts` - Customer search hook for rental form

## Decisions Made
- **Contract list derived from rentals:** No `GET /contracts` list endpoint exists in the API, so `useContracts()` fetches all rentals then parallel-fetches each rental's contract via `GET /contracts/rental/:rentalId`. Fulfilled results are collected into the list.
- **Custom Gantt timeline:** Used div positioning + date-fns calculations instead of an external calendar library. Each rental is an absolutely positioned block within a vehicle row, with width/left computed from date offsets. This keeps the bundle small and the UI fully customizable.
- **Client-side filtering:** Rental dataset is manageable (small fleet), so date range and status filters run in `useMemo` rather than making additional API calls with query parameters.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing build errors in pojazdy pages**
- **Found during:** Task 1 build verification
- **Issue:** Files from plan 05-02 had prettier formatting errors, unused imports (getFilteredRowModel, VehicleDto), zodResolver type mismatch, and nuqs/useSearchParams SSR issue
- **Fix:** Formatted files with prettier, removed unused imports, added `as any` cast on zodResolver, wrapped pojazdy page in Suspense via server component pattern
- **Files modified:** apps/web/src/app/(admin)/pojazdy/page.tsx (renamed to vehicles-page.tsx + new server wrapper), columns.tsx, nowy/page.tsx, [id]/page.tsx, [id]/edytuj/page.tsx
- **Verification:** Build passes
- **Committed in:** ce7c198 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Pre-existing 05-02 build errors required fixing before 05-03 could verify. No scope creep.

## Issues Encountered
- zodResolver type mismatch between Zod schema defaults (optional fields) and React Hook Form strict typing -- resolved with `as any` cast on resolver (known upstream compatibility issue between @hookform/resolvers and zod)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All rental and contract pages complete, ready for 05-04 (audit trail viewing)
- Rental detail page has Audyt tab placeholder ready for audit integration
- Contract detail page has Audyt tab placeholder ready for audit integration

---
*Phase: 05-admin-panel*
*Completed: 2026-03-24*
