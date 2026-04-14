---
phase: 39-return-protocol
plan: 02
subsystem: ui
tags: [react-native, expo-router, zustand, signature, wizard]

requires:
  - phase: 39-return-protocol
    provides: "Return protocol API endpoint (POST /return-protocols), ProtocolCleanliness type, CLEANLINESS_LABELS"
provides:
  - "Protocol form screen with cleanliness chips and auto-filled rental data"
  - "Customer and worker signature capture screens"
  - "Updated confirm screen with protocol summary and 2-step submit"
  - "Extended return draft store with protocol fields"
  - "8-step wizard flow (up from 5)"
affects: [39-return-protocol]

tech-stack:
  added: []
  patterns:
    - "Cleanliness chip selector with Pressable toggle (select/deselect)"
    - "2-step submit pattern: create protocol then return rental"

key-files:
  created:
    - apps/mobile/app/return/protocol.tsx
    - apps/mobile/app/return/protocol-sign-customer.tsx
    - apps/mobile/app/return/protocol-sign-worker.tsx
  modified:
    - apps/mobile/src/stores/return-draft.store.ts
    - apps/mobile/app/return/_layout.tsx
    - apps/mobile/app/return/notes.tsx
    - apps/mobile/app/return/confirm.tsx
    - apps/mobile/app/return/[rentalId].tsx
    - apps/mobile/app/return/mileage.tsx
    - apps/mobile/app/return/damage-map.tsx
    - apps/mobile/src/hooks/use-rentals.ts

key-decisions:
  - "Return location extracted from rental.returnLocation JSON with fallback to 'Nie podano'"
  - "useCreateReturnProtocol hook added to use-rentals.ts (not separate file) for consistency"

patterns-established:
  - "Shared RETURN_WIZARD_TOTAL_STEPS constant imported across all wizard screens"
  - "2-step submit: protocol creation must succeed before rental return mutation"

requirements-completed: [ZWROT-01]

duration: 5min
completed: 2026-04-14
---

# Phase 39 Plan 02: Return Protocol Mobile Screens Summary

**3 new wizard screens (protocol form, customer signature, worker signature) extending return flow to 8 steps with 2-step submit**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-14T22:39:18Z
- **Completed:** 2026-04-14T22:44:06Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Extended return wizard from 5 to 8 steps with shared RETURN_WIZARD_TOTAL_STEPS constant
- Protocol form screen with auto-filled rental data, cleanliness chip selector, and optional notes
- Customer and worker signature screens reusing existing SignatureScreen component
- Confirm screen updated with protocol summary card and 2-step submit (create protocol API call before rental return)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend return draft store and update existing screens step counts** - `4c6feed` (feat)
2. **Task 2: Create protocol form screen and signature screens** - `69ac96f` (feat)
3. **Task 3: Update confirm screen with protocol summary and 2-step submit** - `b3a9cf7` (feat)

## Files Created/Modified
- `apps/mobile/src/stores/return-draft.store.ts` - Added 5 protocol fields and RETURN_WIZARD_TOTAL_STEPS constant
- `apps/mobile/app/return/_layout.tsx` - Registered 3 new Stack.Screen entries
- `apps/mobile/app/return/protocol.tsx` - Protocol form with cleanliness chips and auto-filled data
- `apps/mobile/app/return/protocol-sign-customer.tsx` - Customer signature capture via SignatureScreen
- `apps/mobile/app/return/protocol-sign-worker.tsx` - Worker signature capture via SignatureScreen
- `apps/mobile/app/return/confirm.tsx` - Protocol summary card and 2-step submit
- `apps/mobile/app/return/notes.tsx` - Updated totalSteps and navigation to protocol
- `apps/mobile/app/return/[rentalId].tsx` - Updated totalSteps
- `apps/mobile/app/return/mileage.tsx` - Updated totalSteps
- `apps/mobile/app/return/damage-map.tsx` - Updated totalSteps
- `apps/mobile/src/hooks/use-rentals.ts` - Added useCreateReturnProtocol mutation hook

## Decisions Made
- Return location extracted from rental.returnLocation JSON field with try/catch and "Nie podano" fallback
- useCreateReturnProtocol hook placed in existing use-rentals.ts for consistency with other rental hooks

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Mobile return wizard complete with all 8 steps
- Plan 03 (web admin protocol download) can proceed independently
- Protocol API integration tested via TypeScript compilation (no new type errors)

---
*Phase: 39-return-protocol*
*Completed: 2026-04-14*
