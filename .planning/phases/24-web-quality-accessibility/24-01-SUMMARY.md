---
phase: 24-web-quality-accessibility
plan: 01
subsystem: ui
tags: [react, nextjs, components, error-handling, shared-utils]

requires: []
provides:
  - ErrorState shared component with retry button
  - EmptyState shared component with icon and message
  - InfoRow shared label-value component
  - vehicleStatusConfig, fuelTypeOptions, transmissionOptions constants
  - getInitials utility function
  - Null-safe formatDate/formatDateTime functions
  - Global error boundary (global-error.tsx)
affects: [24-02, 24-03, 24-04, 24-05]

tech-stack:
  added: []
  patterns: [shared-ui-components, null-safe-formatters, global-error-boundary]

key-files:
  created:
    - apps/web/src/components/ui/error-state.tsx
    - apps/web/src/components/ui/empty-state.tsx
    - apps/web/src/components/ui/info-row.tsx
    - apps/web/src/lib/constants.ts
    - apps/web/src/app/global-error.tsx
  modified:
    - apps/web/src/lib/utils.ts
    - apps/web/src/lib/format.ts
    - apps/web/src/app/(admin)/pojazdy/[id]/page.tsx
    - apps/web/src/app/(admin)/klienci/[id]/page.tsx
    - apps/web/src/app/(admin)/pojazdy/columns.tsx
    - apps/web/src/app/(admin)/pojazdy/nowy/page.tsx
    - apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx
    - apps/web/src/components/layout/top-bar.tsx
    - apps/web/src/components/dashboard/activity-feed.tsx

key-decisions:
  - "InfoRow accepts ReactNode value type for flexibility with formatted content"
  - "Constants exported as 'as const' for type narrowing in select options"
  - "global-error.tsx uses only Tailwind (no shadcn) per Next.js docs requirement"

patterns-established:
  - "Shared UI components in components/ui/ for cross-page reuse"
  - "Constants in lib/constants.ts for label maps and option arrays"
  - "Null guard pattern: if (!date) return '-'; isNaN check before format"

requirements-completed: [WUI-01, WUI-02, WUI-03, WERR-06, WERR-07]

duration: 5min
completed: 2026-03-27
---

# Phase 24 Plan 01: Shared Components & Foundation Summary

**Extracted ErrorState, EmptyState, InfoRow components, shared constants, null-safe formatters, and global error boundary for web UI foundation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T23:26:35Z
- **Completed:** 2026-03-27T23:31:30Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Created 3 shared UI components (ErrorState, EmptyState, InfoRow) eliminating duplicate definitions across detail pages
- Extracted vehicleStatusConfig, fuelTypeOptions, transmissionOptions, fuelTypeLabels, transmissionLabels to shared constants file
- Added getInitials to shared utils, removing duplicates from top-bar and activity-feed
- Made formatDate/formatDateTime null-safe (return '-' for null/undefined/invalid)
- Created global-error.tsx providing app-wide error recovery with reset and home link

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract shared components and constants** - `e3ec46c` (feat)
2. **Task 2: Safe formatDate and global ErrorBoundary** - `7891921` (feat)

## Files Created/Modified
- `apps/web/src/components/ui/error-state.tsx` - Shared error display with retry button
- `apps/web/src/components/ui/empty-state.tsx` - Shared empty state with icon and message
- `apps/web/src/components/ui/info-row.tsx` - Shared label-value row component
- `apps/web/src/lib/constants.ts` - Vehicle status, fuel type, transmission constants
- `apps/web/src/lib/utils.ts` - Added getInitials function
- `apps/web/src/lib/format.ts` - Null/invalid guards on formatDate/formatDateTime
- `apps/web/src/app/global-error.tsx` - Next.js global error boundary
- `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` - Import from shared (removed local InfoRow, statusConfig, labels)
- `apps/web/src/app/(admin)/klienci/[id]/page.tsx` - Import from shared (removed local InfoRow)
- `apps/web/src/app/(admin)/pojazdy/columns.tsx` - Import vehicleStatusConfig from shared
- `apps/web/src/app/(admin)/pojazdy/nowy/page.tsx` - Import fuelTypeOptions/transmissionOptions from shared
- `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx` - Import fuelTypeOptions/transmissionOptions from shared
- `apps/web/src/components/layout/top-bar.tsx` - Import getInitials from shared
- `apps/web/src/components/dashboard/activity-feed.tsx` - Import getInitials from shared

## Decisions Made
- InfoRow value prop typed as ReactNode (not just string) to support formatted content like dates
- Constants file exports both option arrays (for selects) and label maps (for display) to cover all use cases
- global-error.tsx is fully self-contained with only Tailwind classes, no shadcn/ui imports, per Next.js docs requirement

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed prettier formatting in columns.tsx**
- **Found during:** Task 1
- **Issue:** Replacing statusConfig with vehicleStatusConfig made the fallback line too long for prettier
- **Fix:** Split the inline object literal across multiple lines
- **Files modified:** apps/web/src/app/(admin)/pojazdy/columns.tsx
- **Committed in:** e3ec46c

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor formatting fix. No scope creep.

## Issues Encountered
- Pre-existing prettier/lint errors in csv-export.ts, use-users.ts, uzytkownicy/page.tsx, and wynajmy/[id]/page.tsx cause build to fail. These are NOT caused by plan-01 changes and are logged in deferred-items.md.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All shared components ready for consumption by plan-02 (error/loading pages) and subsequent plans
- ErrorState component available for error pages
- EmptyState component available for empty list states
- InfoRow available for any detail page
- formatDate/formatDateTime safe to call with any input

---
*Phase: 24-web-quality-accessibility*
*Completed: 2026-03-27*
