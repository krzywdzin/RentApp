---
phase: 38-settlement-vat-notification
plan: 01
subsystem: api, ui
tags: [prisma, settlement, nestjs, react-query, shadcn, admin-ui]

requires:
  - phase: 33-foundation
    provides: Prisma schema with Rental model, web admin rental list/detail pages
provides:
  - SettlementStatus enum in Prisma schema and shared types
  - PATCH /rentals/:id/settlement endpoint (ADMIN only)
  - GET /rentals/settlement-summary endpoint
  - Settlement filters on GET /rentals (settlementStatus, customerSearch, vehicleSearch, dateFrom, dateTo)
  - Rozliczenia tab in /wynajmy with summary bar, filters, and DataTable
  - Rozliczenie tab in /wynajmy/[id] with settlement form
affects: [38-02, 39-return-protocol]

tech-stack:
  added: []
  patterns: [settlement-status-enum, settlement-badge-mapping, server-side-settlement-filters]

key-files:
  created:
    - apps/api/prisma/migrations/20260414220000_add_settlement_fields/migration.sql
    - apps/api/src/rentals/dto/update-settlement.dto.ts
    - apps/web/src/app/(admin)/wynajmy/settlement-columns.tsx
    - apps/web/src/app/(admin)/wynajmy/settlement-filter-bar.tsx
    - apps/web/src/app/(admin)/wynajmy/settlement-summary-bar.tsx
  modified:
    - apps/api/prisma/schema.prisma
    - packages/shared/src/types/rental.types.ts
    - apps/api/src/rentals/rentals.service.ts
    - apps/api/src/rentals/rentals.controller.ts
    - apps/api/src/rentals/dto/rentals-query.dto.ts
    - apps/api/src/rentals/rentals.service.spec.ts
    - apps/web/src/hooks/queries/use-rentals.ts
    - apps/web/src/app/(admin)/wynajmy/page.tsx
    - apps/web/src/app/(admin)/wynajmy/[id]/page.tsx

key-decisions:
  - "Settlement-summary route placed before :id route in controller to avoid UUID param collision"
  - "Settlement amount stored in grosze (cents) in DB, displayed in PLN with /100 conversion"
  - "settledAt auto-set on ROZLICZONY, auto-cleared on NIEROZLICZONY, preserved on other transitions"

patterns-established:
  - "Settlement badge mapping: destructive/amber/green/secondary for 4 statuses"
  - "Server-side settlement filters via query params (settlementStatus, customerSearch, vehicleSearch, dateFrom, dateTo)"

requirements-completed: [ZWROT-03, ZWROT-04]

duration: 7min
completed: 2026-04-14
---

# Phase 38 Plan 01: Settlement Lifecycle Summary

**Settlement tracking backend with SettlementStatus enum, PATCH/GET endpoints, server-side filters, plus web admin Rozliczenia list tab and per-rental Rozliczenie form**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-14T20:44:23Z
- **Completed:** 2026-04-14T20:51:30Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Full settlement lifecycle backend: Prisma schema with SettlementStatus enum (4 statuses), SQL migration with backfill, shared types, validated DTO, PATCH and GET endpoints
- Server-side filtering for settlement queries: status, customer name, vehicle registration, date range
- Web admin Rozliczenia tab with summary bar (unsettled count + amount), filter bar, and sortable DataTable
- Per-rental Rozliczenie tab with settlement form (status select, amount in PLN, notes textarea, read-only settledAt)
- 42 rental service tests passing (7 new settlement tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema, migration, shared types, API endpoint, and tests** - `5ac29be` (feat)
2. **Task 2: Web admin settlement UI -- list tab + detail form** - `67b050d` (feat)

## Files Created/Modified
- `apps/api/prisma/schema.prisma` - SettlementStatus enum + 4 fields on Rental model + index
- `apps/api/prisma/migrations/20260414220000_add_settlement_fields/migration.sql` - Migration with backfill
- `packages/shared/src/types/rental.types.ts` - SettlementStatus enum + settlement fields on RentalDto
- `apps/api/src/rentals/dto/update-settlement.dto.ts` - Validated DTO for settlement PATCH
- `apps/api/src/rentals/dto/rentals-query.dto.ts` - Settlement filter query params
- `apps/api/src/rentals/rentals.service.ts` - updateSettlement + getSettlementSummary + filter logic
- `apps/api/src/rentals/rentals.controller.ts` - PATCH :id/settlement + GET settlement-summary
- `apps/api/src/rentals/rentals.service.spec.ts` - 7 settlement test cases
- `apps/web/src/hooks/queries/use-rentals.ts` - useSettlementRentals, useSettlementSummary, useUpdateSettlement
- `apps/web/src/app/(admin)/wynajmy/settlement-columns.tsx` - Settlement columns with status badges
- `apps/web/src/app/(admin)/wynajmy/settlement-filter-bar.tsx` - Filter bar component
- `apps/web/src/app/(admin)/wynajmy/settlement-summary-bar.tsx` - Summary bar component
- `apps/web/src/app/(admin)/wynajmy/page.tsx` - Rozliczenia tab added
- `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` - Rozliczenie tab with form

## Decisions Made
- Settlement-summary route placed before :id route in controller to avoid UUID param collision
- Settlement amount stored in grosze in DB, displayed in PLN with /100 conversion in UI
- settledAt auto-set on ROZLICZONY, auto-cleared on NIEROZLICZONY, preserved on other transitions
- Shared package rebuilt to export SettlementStatus enum for API tests

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Shared package needed rebuild before API tests could import SettlementStatus (resolved with `npm run build` in packages/shared)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Settlement backend and UI fully functional, ready for Plan 02 (VAT notification)
- Migration SQL ready for deployment (backfills existing rentals to NIEROZLICZONY)

---
*Phase: 38-settlement-vat-notification*
*Completed: 2026-04-14*
