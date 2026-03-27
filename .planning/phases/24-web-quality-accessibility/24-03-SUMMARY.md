---
phase: 24-web-quality-accessibility
plan: 03
subsystem: ui
tags: [zod, react-hook-form, tanstack-query, sonner, validation, mutation]

# Dependency graph
requires:
  - phase: 22-api-quality-optimization
    provides: API endpoints for rentals, users, vehicles
provides:
  - Required dailyRateNet validation in rental form
  - Extend/return dialog date and mileage validations
  - User edit form validation with toast errors
  - useCreateUser mutation hook with query invalidation
  - Numeric 0-value prevention in vehicle forms
affects: [26-code-quality]

# Tech tracking
tech-stack:
  added: []
  patterns: [mutation hook with query invalidation for user creation, isNaN undefined fallback for numeric inputs]

key-files:
  created: []
  modified:
    - apps/web/src/app/(admin)/wynajmy/nowy/page.tsx
    - apps/web/src/app/(admin)/wynajmy/[id]/page.tsx
    - apps/web/src/app/(admin)/uzytkownicy/page.tsx
    - apps/web/src/hooks/queries/use-users.ts
    - apps/web/src/app/(admin)/pojazdy/nowy/page.tsx
    - apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx

key-decisions:
  - "useCreateUser mutation hook follows existing useUpdateUser pattern with queryClient.invalidateQueries"
  - "Numeric inputs use isNaN check with undefined fallback instead of || 0 to trigger Zod required validation"
  - "Vehicle mileage keeps || 0 pattern since min(0) is acceptable for new vehicles"

patterns-established:
  - "Mutation hook pattern: apiClient call + invalidateQueries + toast success/error in hook file"
  - "Numeric input pattern: parseInt with isNaN guard returning undefined for Zod validation"

requirements-completed: [WVAL-01, WVAL-02, WVAL-03, WVAL-04, WVAL-05, WUI-05]

# Metrics
duration: 5min
completed: 2026-03-27
---

# Phase 24 Plan 03: Form Validation Gaps Summary

**Required dailyRateNet with min(1), extend/return dialog validations with toast errors, user creation via mutation hook, and numeric 0-value prevention in vehicle forms**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T23:26:31Z
- **Completed:** 2026-03-27T23:32:20Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Made dailyRateNet required with min(1) validation and Polish error messages in rental form
- Added extend date validation (must be after current end date) and return mileage validation (must be >= vehicle mileage)
- Created useCreateUser mutation hook replacing raw fetch, with automatic users list refresh
- Fixed year/seatCount 0-value handling using isNaN undefined fallback in both new and edit vehicle forms
- Added name/role validation to user edit dialog

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix rental form and extend/return dialog validations** - `607ba04` (feat)
2. **Task 2: Fix user edit validation, numeric 0-values, and user creation mutation** - `feafc2c` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified
- `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` - Made dailyRateNet required with min(1) and Polish required_error
- `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` - Added extend date and return mileage validations with toast errors
- `apps/web/src/app/(admin)/uzytkownicy/page.tsx` - Added edit validation, replaced raw fetch with createUser mutation
- `apps/web/src/hooks/queries/use-users.ts` - Added useCreateUser mutation hook with query invalidation
- `apps/web/src/app/(admin)/pojazdy/nowy/page.tsx` - Fixed year/seatCount parseInt || 0 to isNaN undefined pattern
- `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx` - Same numeric fix for edit vehicle form

## Decisions Made
- useCreateUser follows existing useUpdateUser pattern for consistency (apiClient + invalidateQueries + toast)
- Numeric inputs use `isNaN(val) ? undefined : val` instead of `|| 0` so Zod catches empty/zero values
- Vehicle mileage keeps `|| 0` since `min(0)` is acceptable for new vehicles
- Added `mileage` to RentalWithRelations vehicle interface for return mileage comparison

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prettier formatting for long toast messages**
- **Found during:** Task 1 and Task 2 (build verification)
- **Issue:** Long template literal strings exceeded prettier line width
- **Fix:** Reformatted to multi-line with proper indentation
- **Files modified:** wynajmy/[id]/page.tsx, use-users.ts
- **Verification:** Build passes with only pre-existing csv-export.ts error remaining
- **Committed in:** feafc2c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Formatting-only fix required by prettier. No scope creep.

## Issues Encountered
- Pre-existing prettier errors in csv-export.ts, empty-state.tsx, and pojazdy/columns.tsx cause build to fail (exit code 1) but are unrelated to this plan's changes. Logged to deferred-items.md.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All form validation gaps addressed, ready for remaining web quality plans (24-04, 24-05)
- Pre-existing lint errors should be addressed in Phase 26 (Code Quality)

---
*Phase: 24-web-quality-accessibility*
*Completed: 2026-03-27*
