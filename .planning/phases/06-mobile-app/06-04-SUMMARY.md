---
phase: 06-mobile-app
plan: 04
subsystem: mobile
tags: [react-native, expo-router, wizard, signature-capture, react-hook-form, zod, bottom-sheet, datetimepicker, screen-orientation, haptics]

# Dependency graph
requires:
  - phase: 06-mobile-app
    plan: 02
    provides: Shared UI components (AppButton, AppInput, AppCard, SearchBar, EmptyState, WizardStepper, ConfirmationDialog), tab navigation, stack layouts
  - phase: 06-mobile-app
    plan: 03
    provides: Customer/vehicle/rental API clients and TanStack Query hooks, rental draft Zustand store
provides:
  - 5-step rental creation wizard (customer search, vehicle selection, dates/pricing, contract review, signature capture)
  - Inline customer creation via bottom sheet within wizard flow
  - Contract API client and hooks (create, sign, get by rental)
  - Full-screen landscape signature capture component with orientation lock and haptics
  - 4-signature sequential capture flow with retry on upload failure
  - Success screen with PDF link and navigation options
  - Draft persistence across all wizard steps with resume prompt
affects: [06-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [Wizard step pattern with draft store persistence, Signature capture with orientation lock, Bottom sheet form pattern for inline creation, Date picker with read-only input trigger]

key-files:
  created:
    - apps/mobile/app/(tabs)/new-rental/vehicle.tsx
    - apps/mobile/app/(tabs)/new-rental/dates.tsx
    - apps/mobile/app/(tabs)/new-rental/contract.tsx
    - apps/mobile/app/(tabs)/new-rental/signatures.tsx
    - apps/mobile/app/(tabs)/new-rental/success.tsx
    - apps/mobile/src/components/SignatureScreen.tsx
    - apps/mobile/src/api/contracts.api.ts
    - apps/mobile/src/hooks/use-contracts.ts
  modified:
    - apps/mobile/app/(tabs)/new-rental/_layout.tsx
    - apps/mobile/app/(tabs)/new-rental/index.tsx
    - apps/mobile/src/i18n/pl.json

key-decisions:
  - "Rental + contract created on first signature capture (not after all 4), so signatures can be uploaded immediately"
  - "SignatureViewRef used for ref typing instead of typeof SignatureCanvas"
  - "CreateRentalInput requires explicit vatRate and overrideConflict due to z.infer including .default() resolved types"

patterns-established:
  - "Wizard step pattern: WizardStepper at top, content scrollview, bottom-fixed CTA button"
  - "Draft resume pattern: check draft store on mount, show ConfirmationDialog to continue or reset"
  - "Signature capture pattern: ScreenOrientation lock to landscape, SignatureCanvas with custom webStyle, haptic feedback on confirm"
  - "Bottom sheet form pattern: @gorhom/bottom-sheet with RHF form inside BottomSheetScrollView"

requirements-completed: [MOB-02]

# Metrics
duration: 7min
completed: 2026-03-24
---

# Phase 6 Plan 04: Rental Creation Wizard Summary

**5-step rental wizard with customer search/creation, vehicle selection, date/pricing calculator, RODO consent, and 4-signature landscape capture with immediate upload and retry**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T18:30:41Z
- **Completed:** 2026-03-24T18:38:25Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Complete 5-step rental creation wizard: customer selection with inline creation via bottom sheet, vehicle search with availability filter, date/time pickers with auto-calculated pricing (net + 23% VAT), contract preview with RODO consent gate, and 4-signature sequential capture
- Full-screen landscape signature capture component (SignatureScreen) with orientation lock, haptic feedback, clear/confirm controls, and loading overlay
- Rental + contract created on first signature, then each signature uploaded immediately with exponential backoff retry (3 attempts: 1s, 2s, 4s)
- Success screen with PDF link via Linking.openURL, new rental option, and back-to-dashboard navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Build wizard steps 1-4** - `3cd8a44` (feat)
2. **Task 2: Build signature capture, success screen, wire submission** - `2b41a75` (feat)

## Files Created/Modified
- `apps/mobile/app/(tabs)/new-rental/index.tsx` - Step 1: Customer search with inline creation bottom sheet, draft resume dialog
- `apps/mobile/app/(tabs)/new-rental/vehicle.tsx` - Step 2: Vehicle selection with availability toggle and client-side search
- `apps/mobile/app/(tabs)/new-rental/dates.tsx` - Step 3: Date/time pickers with pricing summary (days x rate, net, gross with 23% VAT)
- `apps/mobile/app/(tabs)/new-rental/contract.tsx` - Step 4: Contract preview with RODO consent checkbox gating signatures
- `apps/mobile/app/(tabs)/new-rental/signatures.tsx` - Step 5: 4-signature sequential flow with rental/contract creation and retry
- `apps/mobile/app/(tabs)/new-rental/success.tsx` - Success confirmation with PDF link and navigation
- `apps/mobile/app/(tabs)/new-rental/_layout.tsx` - Stack navigator with draft discard confirmation on back
- `apps/mobile/src/components/SignatureScreen.tsx` - Landscape signature canvas with orientation lock and haptics
- `apps/mobile/src/api/contracts.api.ts` - Contract API: create, sign, get, getByRental, getPdfUrl
- `apps/mobile/src/hooks/use-contracts.ts` - TanStack Query hooks: useCreateContract, useSignContract, useContract, useContractByRental
- `apps/mobile/src/i18n/pl.json` - Added draft resume dialog i18n keys

## Decisions Made
- Rental and contract are created on the first signature capture rather than after all 4 signatures. This allows each signature to be uploaded immediately against the existing contract, matching the backend API pattern where signContract requires a contractId.
- Used SignatureViewRef (from react-native-signature-canvas type exports) for the signature canvas ref type instead of the component class.
- Explicit vatRate: 23 and overrideConflict: false passed to createRental because z.infer resolves .default() values as required in the output type.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added vatRate and overrideConflict to CreateRental call**
- **Found during:** Task 2 (Signature flow implementation)
- **Issue:** TypeScript error because CreateRentalInput (z.infer) requires vatRate and overrideConflict even though the schema has .default() values
- **Fix:** Added explicit vatRate: 23 and overrideConflict: false to the createRental mutation call
- **Files modified:** apps/mobile/app/(tabs)/new-rental/signatures.tsx
- **Committed in:** 2b41a75

**2. [Rule 3 - Blocking] Fixed SignatureCanvas ref type**
- **Found during:** Task 2 (SignatureScreen component)
- **Issue:** TypeScript error: SignatureCanvas refers to a value, not a type, for useRef generic
- **Fix:** Imported SignatureViewRef type and used it as the ref generic parameter
- **Files modified:** apps/mobile/src/components/SignatureScreen.tsx
- **Committed in:** 2b41a75

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes resolved TypeScript type mismatches. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete rental creation wizard ready for use in the mobile app
- Contract hooks available for reuse in rental detail views (Plan 05 return wizard)
- SignatureScreen component reusable for any future signature needs
- Draft persistence tested via Zustand persist with AsyncStorage

## Self-Check: PASSED
