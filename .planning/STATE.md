---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: Client Features & Contract Enhancements
status: in-progress
stopped_at: Phase 39 context gathered
last_updated: "2026-04-14T21:38:51.801Z"
last_activity: 2026-04-14 -- Phase 38-02 complete (VAT reminder modal in mobile return wizard)
progress:
  total_phases: 7
  completed_phases: 6
  total_plans: 20
  completed_plans: 20
  percent: 95
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-12)

**Core value:** Pracownik w terenie moze w pelni obsluzyc wynajem -- od wypelnienia umowy, przez zweryfikowanie uprawnien kierowcy, zrobienie zdjec auta, po podpis klienta i wysylke PDF -- bez papieru i bez powrotu do biura.
**Current focus:** v3.0 Phase 38 -- Settlement & VAT Notification

## Current Position

Phase: 38 of 39 (Settlement & VAT Notification)
Plan: 2 of 2 in current phase (38-02 complete)
Status: in-progress
Last activity: 2026-04-14 -- Phase 38-02 complete (VAT reminder modal in mobile return wizard)

Progress: [██████████] 95%

## Performance Metrics

**Velocity:**
- Total plans completed: 109 (37 v1.0 + 14 v1.1 + 7 v2.0 + 26 v2.1 + 2 v2.2 + 9 v2.3 + 14 v3.0)
- Phases completed: 33 + 1 inserted (9.1)

## Accumulated Context

### Decisions

- [v3.0 roadmap]: Batch ALL ContractFrozenData + PDF template changes into Phase 34 (single pass prevents 7 separate rewrites)
- [v3.0 roadmap]: OCR uses on-device ML Kit (expo-text-extractor) -- RODO compliance
- [v3.0 roadmap]: PDF encryption via pure-JS @pdfsmaller/pdf-encrypt-lite (RC4-128) -- no qpdf on Railway
- [v3.0 roadmap]: Second driver uses dedicated RentalDriver model, NOT Customer model
- [v3.0 roadmap]: Google Places proxied through backend API -- key security + billing control
- [Phase 33]: Used migrate diff + manual SQL for migration due to shadow DB incompatibility with db-push history
- [Phase 33]: Constructed backward-compatible address string from structured fields in contracts.service for PDF template
- [Phase 33]: VAT picker as chip buttons (no external picker dependency); vehicle step uses explicit Dalej button for insurance fields
- [Phase 33]: isInsuranceRental is UI-only draft toggle; only insuranceCaseNumber sent to API
- [Phase 33]: NIP validator wraps shared isValidNip via class-validator decorator pattern (same as PESEL)
- [Phase 33]: Vehicle class CRUD uses dialog-based pattern (not separate pages) -- fewer than 20 classes expected
- [Phase 34]: Settings module uses simple key-value upsert for configurable rental terms
- [Phase 34]: CepikVerificationDto.customerId made nullable for driver-only verifications
- [Phase 34]: Migration SQL written manually (no shadow DB), following Phase 33 precedent
- [Phase 34]: CepikService.verifyDriver() validates driver belongs to rental via findByRentalId + driverId match
- [Phase 34]: Portal uses Prisma select (not include:true) for defense-in-depth privacy filtering
- [Phase 34]: TipTap v3 (3.22.3) for rich text editing -- headings limited to H2/H3 for contract terms
- [Phase 34-02]: companyName set to null in v2 frozen data -- no DB source column yet; future GUS/NIP lookup
- [Phase 34-05]: TipTap terms editor loaded via CDN in WebView with contenteditable fallback
- [Phase 34-05]: Terms acceptance checkbox gates signatures alongside RODO consent
- [Phase 34-05]: Signature steps computed dynamically from draft.secondDriverId via useMemo
- [Phase 34-05]: Rental terms PATCH is non-blocking before contract creation
- [Phase 35-01]: PlacesController short-circuits input < 2 chars with empty predictions (no Google API call)
- [Phase 35-01]: Migration SQL written manually following Phase 33/34 precedent (no shadow DB)
- [Phase 35-02]: SecureStore.getItemAsync for Bearer token in PlacesAutocomplete (requestUrl bypasses axios interceptor)
- [Phase 35-02]: z-index 2/1 layering on pickup/return wrappers to prevent dropdown overlap
- [Phase 35]: Location display uses Lokalizacje section with Miejsce wydania/zdania labels, cast via as-any (mobile) and as-unknown (web)
- [Phase 36]: Manual SQL migration following Phase 33/34 precedent (no shadow DB)
- [Phase 36]: frontPhotoKey required in schema; back-only uploads set empty string placeholder
- [Phase 36]: Document URL uses kebab-case (id-card) mapped to DB enum (ID_CARD) in controller
- [Phase 36]: Empty placeholder slots (dashed border + 'Brak') for missing document sides in web admin grid
- [Phase Phase 36]: expo-text-extractor with try/catch fallback for Expo Go compatibility
- [Phase 36]: Photo upload failures non-blocking after customer creation (same pattern as signatures.tsx)
- [Phase 37-01]: jest.spyOn(global, 'setTimeout') for retry delay tests (avoids fake timer async issues with promise chains)
- [Phase Phase 37-02]: Contract SMS uses fire-and-forget (setImmediate) same as email; annex SMS uses try/catch isolation
- [Phase 38]: Used raw Modal + View + AppButton instead of ConfirmationDialog to avoid showing cancel button in VAT reminder
- [Phase 38-01]: Settlement-summary route placed before :id route in controller to avoid UUID param collision
- [Phase 38-01]: Settlement amount stored in grosze in DB, displayed in PLN with /100 conversion
- [Phase 38-01]: settledAt auto-set on ROZLICZONY, auto-cleared on NIEROZLICZONY, preserved on other transitions

### Pending Todos

None.

### Blockers/Concerns

- ZWROT-01 (return protocol): client template not yet received -- Phase 39 is last for this reason
- OCR (Phase 36) requires EAS dev client build, not Expo Go
- @pdfsmaller/pdf-encrypt-lite newer library (Feb 2026) -- validate on target readers before Phase 37 ships

## Session Continuity

Last session: 2026-04-14T21:38:51.798Z
Stopped at: Phase 39 context gathered
Resume file: .planning/phases/39-return-protocol/39-CONTEXT.md
