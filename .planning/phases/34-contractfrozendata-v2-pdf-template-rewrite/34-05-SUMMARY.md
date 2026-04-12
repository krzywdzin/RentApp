---
phase: 34-contractfrozendata-v2-pdf-template-rewrite
plan: 05
subsystem: mobile-ui
tags: [react-native, zustand, webview, tiptap, cepik, signatures]

requires:
  - phase: 34-02
    provides: Contract service V2, PDF template, signature types with second_customer
  - phase: 34-03
    provides: PATCH /rentals/:id/terms endpoint, rental driver CRUD, CEPiK verify-driver
provides:
  - Mobile draft store with terms, secondDriver, and termsAcceptedAt fields
  - TermsWebView component for read-only and TipTap-editable terms display
  - SecondDriverForm component with CEPiK verification
  - Contract step with terms acceptance checkbox gating signature flow
  - Dynamic signature flow (2 or 3 steps / 4 or 6 signatures)
affects: [34-pdf-generation, mobile-wizard, contract-flow]

tech-stack:
  added: []
  patterns: [WebView postMessage for TipTap editor bidirectional communication, dynamic signature steps based on draft state]

key-files:
  created:
    - apps/mobile/src/components/terms-webview.tsx
    - apps/mobile/src/components/second-driver-form.tsx
  modified:
    - apps/mobile/src/stores/rental-draft.store.ts
    - apps/mobile/app/(tabs)/new-rental/contract.tsx
    - apps/mobile/app/(tabs)/new-rental/signatures.tsx
    - packages/shared/src/schemas/contract.schemas.ts

key-decisions:
  - "Terms editor uses TipTap via WebView with CDN fallback to contenteditable"
  - "Terms acceptance checkbox gates Dalej button alongside RODO consent"
  - "Signature steps built dynamically from draft.secondDriverId presence"
  - "Rental terms PATCHed before contract creation (non-blocking on failure)"

patterns-established:
  - "WebView postMessage pattern: height + content messages for bidirectional RN<->WebView communication"
  - "Dynamic signature flow: steps array computed from draft state via useMemo"

requirements-completed: [UMOWA-02, UMOWA-03, UMOWA-04, NAJEM-05, NAJEM-06, NAJEM-07]

duration: 6min
completed: 2026-04-12
---

# Phase 34 Plan 05: Mobile Contract UI -- Terms, Second Driver, 6-Signature Flow Summary

**TipTap WebView for editable rental terms, terms acceptance checkbox gating signatures, second driver form with CEPiK verification, and dynamic 2/3-step signature flow (4 or 6 signatures)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-12T21:40:34Z
- **Completed:** 2026-04-12T21:46:34Z
- **Tasks:** 3 of 3 (2 auto + 1 human-verify checkpoint approved)
- **Files modified:** 6

## Accomplishments
- Extended rental draft store with rentalTerms, termsNotes, termsAcceptedAt, secondDriver, secondDriverId, secondDriverCepikStatus
- Created TermsWebView component with read-only HTML display and TipTap editor mode via WebView postMessage
- Created SecondDriverForm with full data entry, API save, CEPiK verification, and delete
- Updated contract step with terms section, notes input, acceptance checkbox, and second driver section
- Updated signatures flow to dynamically build 2 or 3 steps based on secondDriverId presence
- Added rental terms PATCH before contract creation and termsAcceptedAt in contract payload

## Task Commits

Each task was committed atomically:

1. **Task 1: Draft store + terms WebView + second driver form components** - `245b27d` (feat)
2. **Task 2: Contract step -- terms display, acceptance, second driver + Signatures flow -- 6 signatures** - `c20aed0` (feat)
3. **Task 3: Human verification checkpoint** - approved (no code commit)

**Plan metadata:** `e90bf09` (docs: complete plan)

## Files Created/Modified
- `apps/mobile/src/stores/rental-draft.store.ts` - Added secondDriver, rentalTerms, termsNotes, termsAcceptedAt fields + SecondDriverData type
- `apps/mobile/src/components/terms-webview.tsx` - New WebView component for read-only/editable HTML terms with TipTap
- `apps/mobile/src/components/second-driver-form.tsx` - New form for second driver data entry, CEPiK verification, and removal
- `apps/mobile/app/(tabs)/new-rental/contract.tsx` - Added terms display, notes, acceptance checkbox, second driver section
- `apps/mobile/app/(tabs)/new-rental/signatures.tsx` - Dynamic 2/3-step signature flow, PATCH terms, termsAcceptedAt in contract creation
- `packages/shared/src/schemas/contract.schemas.ts` - Added second_customer_page1/page2 to signContractSchema, termsAcceptedAt to createContractSchema

## Decisions Made
- TipTap loaded from CDN in WebView with contenteditable fallback if CDN fails
- Terms acceptance checkbox gates "Dalej do podpisow" button alongside RODO consent
- Signature steps computed dynamically via useMemo from draft.secondDriverId
- Rental terms PATCH is non-blocking (catch + warn) to not prevent contract creation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated shared signContractSchema to include second_customer types**
- **Found during:** Task 1 (Draft store setup)
- **Issue:** Zod schema in contract.schemas.ts only had 4 signature types but TypeScript type already had 6, causing TS2322 error when uploading second_customer signatures
- **Fix:** Added 'second_customer_page1' and 'second_customer_page2' to z.enum in signContractSchema
- **Files modified:** packages/shared/src/schemas/contract.schemas.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** 245b27d (Task 1 commit)

**2. [Rule 3 - Blocking] Added termsAcceptedAt to createContractSchema**
- **Found during:** Task 1 (Draft store setup)
- **Issue:** Contract creation payload needed termsAcceptedAt but schema didn't include it
- **Fix:** Added optional termsAcceptedAt field to createContractSchema
- **Files modified:** packages/shared/src/schemas/contract.schemas.ts
- **Verification:** TypeScript compiles, field used in signatures.tsx contract creation
- **Committed in:** 245b27d (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for schema consistency. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 34 is now fully complete -- all 5 plans delivered and verified
- Phase 35 (Google Places) and Phase 36 (OCR) can proceed in parallel (both depend on Phase 33, not 34)
- Phase 37 (PDF Encryption) depends on Phase 34 and is now unblocked

## Self-Check: PASSED

All files and commits verified:
- terms-webview.tsx: FOUND
- second-driver-form.tsx: FOUND
- Commit 245b27d: FOUND
- Commit c20aed0: FOUND
- Commit e90bf09: FOUND

---
*Phase: 34-contractfrozendata-v2-pdf-template-rewrite*
*Completed: 2026-04-12*
