---
phase: 23-mobile-quality-ux
plan: 03
subsystem: ui
tags: [react-native, safe-area, i18n, constants, polish-diacritics, toast]

requires:
  - phase: 09-photos-signatures
    provides: SignatureScreen component, OfflineBanner component
provides:
  - RENTAL_WIZARD_LABELS, DEFAULT_VAT_RATE, VAT_MULTIPLIER, ONE_DAY_MS, UPCOMING_RETURN_THRESHOLD_DAYS constants
  - Safe area inset bottom bars across 9 screens
  - Toast feedback on empty signature canvas
  - Correct Polish diacritics in checklist labels and i18n strings
  - OfflineBanner safe area top inset for Android
affects: [24-mobile-testing, 26-code-quality]

tech-stack:
  added: []
  patterns:
    - "useSafeAreaInsets().bottom with Math.max(insets.bottom, 16) for bottom bars"
    - "Named constants in lib/constants.ts for all magic numbers"

key-files:
  created: []
  modified:
    - apps/mobile/src/lib/constants.ts
    - apps/mobile/src/lib/format.ts
    - apps/mobile/src/i18n/pl.json
    - apps/mobile/src/components/SignatureScreen.tsx
    - apps/mobile/src/components/OfflineBanner.tsx
    - apps/mobile/app/(tabs)/new-rental/index.tsx
    - apps/mobile/app/(tabs)/new-rental/dates.tsx
    - apps/mobile/app/(tabs)/new-rental/contract.tsx
    - apps/mobile/app/(tabs)/new-rental/vehicle.tsx
    - apps/mobile/app/(tabs)/new-rental/photos.tsx
    - apps/mobile/app/(tabs)/new-rental/signatures.tsx
    - apps/mobile/app/return/mileage.tsx
    - apps/mobile/app/return/checklist.tsx
    - apps/mobile/app/return/notes.tsx
    - apps/mobile/app/return/confirm.tsx
    - apps/mobile/app/return/[rentalId].tsx
    - apps/mobile/app/(tabs)/rentals/[id].tsx

key-decisions:
  - "RENTAL_WIZARD_LABELS typed as string[] (not as const) for WizardStepper prop compatibility"
  - "Math.max(insets.bottom, 16) ensures minimum 16pt padding on non-notched devices"
  - "List content paddingBottom: 32 (scroll spacing) kept as-is -- only bottomBar fixed positions changed"

patterns-established:
  - "Bottom bar safe area: style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}"
  - "All VAT calculations use VAT_MULTIPLIER from constants.ts"
  - "All wizard step files import RENTAL_WIZARD_LABELS from @/lib/constants"

requirements-completed: [MUX-01, MUX-02, MUX-03, MUX-04, MUX-05, MUX-06, MUX-07]

duration: 9min
completed: 2026-03-27
---

# Phase 23 Plan 03: UX Polish Summary

**Safe area insets on 9 bottom bars, empty signature toast, Polish diacritics fix, and 5 extracted constants replacing magic numbers across wizard/return flows**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-27T22:59:31Z
- **Completed:** 2026-03-27T23:08:39Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Extracted RENTAL_WIZARD_LABELS, DEFAULT_VAT_RATE, VAT_MULTIPLIER, ONE_DAY_MS, UPCOMING_RETURN_THRESHOLD_DAYS to constants.ts -- eliminated 5 wizard file duplications and 4 hardcoded VAT references
- Fixed 28+ missing Polish diacritics across pl.json and 3 checklist labels in constants.ts
- Replaced hardcoded paddingBottom: 32 with useSafeAreaInsets().bottom on 9 bottom bar screens
- Added Toast feedback when user confirms empty signature canvas
- OfflineBanner now uses safe area top inset to avoid Android status bar overlap

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract constants and fix Polish diacritics** - `aa945df` (feat)
2. **Task 2: Fix safe area insets on bottom bars, empty signature toast, and OfflineBanner** - `4254ffe` (feat)

## Files Created/Modified
- `apps/mobile/src/lib/constants.ts` - Added 5 new constants, fixed 3 checklist diacritics
- `apps/mobile/src/lib/format.ts` - Uses DEFAULT_VAT_RATE from constants
- `apps/mobile/src/i18n/pl.json` - Fixed 28 missing Polish diacritics
- `apps/mobile/src/components/SignatureScreen.tsx` - Toast on empty canvas, i18n button labels
- `apps/mobile/src/components/OfflineBanner.tsx` - Safe area top inset
- `apps/mobile/app/(tabs)/new-rental/*.tsx` (5 files) - Shared RENTAL_WIZARD_LABELS, VAT_MULTIPLIER, ONE_DAY_MS, safe area insets
- `apps/mobile/app/(tabs)/new-rental/signatures.tsx` - DEFAULT_VAT_RATE
- `apps/mobile/app/return/*.tsx` (4 files) - Safe area bottom insets
- `apps/mobile/app/return/[rentalId].tsx` - Safe area bottom inset
- `apps/mobile/app/(tabs)/rentals/[id].tsx` - Safe area bottom inset

## Decisions Made
- RENTAL_WIZARD_LABELS typed as `string[]` instead of `as const` because WizardStepper's labels prop expects mutable `string[]`
- Math.max(insets.bottom, 16) ensures minimum 16pt padding on non-notched devices
- List content `paddingBottom: 32` (in vehicle.tsx, index.tsx, rentals/index.tsx) left unchanged -- these are scroll content spacing, not bottom bar overlaps

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed readonly tuple type incompatibility with WizardStepper**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** `as const` on RENTAL_WIZARD_LABELS produced `readonly` tuple, incompatible with WizardStepper's `string[]` prop
- **Fix:** Changed to explicit `string[]` type annotation instead of `as const`
- **Files modified:** apps/mobile/src/lib/constants.ts
- **Verification:** TypeScript compiles cleanly
- **Committed in:** aa945df (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal -- type annotation change only. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All UX polish items for this plan complete
- Ready for 23-04 (accessibility) or parallel plans
- Pattern established: all future bottom bars should use useSafeAreaInsets().bottom

---
*Phase: 23-mobile-quality-ux*
*Completed: 2026-03-27*
