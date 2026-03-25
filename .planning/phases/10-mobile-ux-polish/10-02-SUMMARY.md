---
phase: 10-mobile-ux-polish
plan: 02
subsystem: ui
tags: [react-native, expo-router, offline-banner, guard-rails, polish-locale]

# Dependency graph
requires:
  - phase: 09.1-mobile-and-admin-bug-fixes
    provides: return wizard screens, LoadingSkeleton, OfflineBanner components
provides:
  - rentalId guard rails on return wizard mileage/checklist/confirm screens
  - OfflineBanner in return wizard layout
  - Polish status labels in return start screen
affects: [10-mobile-ux-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [rentalId-guard-redirect, offline-banner-layout-pattern, status-label-map]

key-files:
  created: []
  modified:
    - apps/mobile/app/return/mileage.tsx
    - apps/mobile/app/return/checklist.tsx
    - apps/mobile/app/return/confirm.tsx
    - apps/mobile/app/return/_layout.tsx
    - apps/mobile/app/return/[rentalId].tsx

key-decisions:
  - "Guard placement after all hooks to respect React rules of hooks"
  - "Used same OfflineBanner + View wrapper pattern as tabs layout"

patterns-established:
  - "rentalId guard: useEffect redirect + early return null pattern for wizard steps"
  - "RENTAL_STATUS_LABELS map for Polish status display in user-facing messages"

requirements-completed: [MOBUX-04, MOBUX-05, MOBUX-07]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 10 Plan 02: Return Wizard Guards Summary

**RentalId guard rails on 3 return wizard steps, OfflineBanner in return layout, and Polish status labels on return start screen**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T02:53:51Z
- **Completed:** 2026-03-25T02:56:32Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Mileage, checklist, and confirm screens now redirect to rentals tab when rentalId is missing (prevents 0 km mileage bug)
- Mileage and confirm screens show loading skeletons while rental data fetches
- OfflineBanner renders above Stack in return wizard layout matching the tabs layout pattern
- Return start screen status guard shows Polish labels (e.g., "Zwrocony") instead of raw enum values

## Task Commits

Each task was committed atomically:

1. **Task 1: Add rentalId guard to return wizard steps and loading skeleton** - `0c3b629` (feat)
2. **Task 2: Add OfflineBanner to return layout and Polish status labels** - `fc1472d` (feat)

## Files Created/Modified
- `apps/mobile/app/return/mileage.tsx` - Added rentalId guard, isLoading destructure, LoadingSkeleton import and loading state
- `apps/mobile/app/return/checklist.tsx` - Added rentalId from store, guard with redirect
- `apps/mobile/app/return/confirm.tsx` - Added useEffect import, LoadingSkeleton import, rentalId guard and loading state
- `apps/mobile/app/return/_layout.tsx` - Added OfflineBanner import, View wrapper with flex:1, OfflineBanner render
- `apps/mobile/app/return/[rentalId].tsx` - Added RENTAL_STATUS_LABELS map, template literal in error message

## Decisions Made
- Guard placement after all hooks (useState, useEffect) to respect React rules of hooks -- early returns cannot precede hook calls
- Used same View + OfflineBanner + StyleSheet pattern as tabs layout for consistency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed guard placement to respect React rules of hooks**
- **Found during:** Task 1 (mileage.tsx guard)
- **Issue:** Plan placed guard before useState/useEffect hooks, which violates React rules of hooks (conditional returns before hooks)
- **Fix:** Moved guard after all hook calls (useState, useEffect) but before derived values
- **Files modified:** apps/mobile/app/return/mileage.tsx
- **Verification:** TypeScript check passes with no errors
- **Committed in:** 0c3b629

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Guard placement adjusted for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Return wizard now has proper guard rails and offline indication
- Polish localization pattern established for status labels

---
*Phase: 10-mobile-ux-polish*
*Completed: 2026-03-25*
