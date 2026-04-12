---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: Client Features & Contract Enhancements
status: in-progress
stopped_at: Completed 34-03-PLAN.md
last_updated: "2026-04-12T21:25:48.894Z"
last_activity: 2026-04-12 -- Completed 34-04 (Admin Terms Editor)
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 9
  completed_plans: 7
  percent: 55
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-12)

**Core value:** Pracownik w terenie moze w pelni obsluzyc wynajem -- od wypelnienia umowy, przez zweryfikowanie uprawnien kierowcy, zrobienie zdjec auta, po podpis klienta i wysylke PDF -- bez papieru i bez powrotu do biura.
**Current focus:** v3.0 Phase 34 -- ContractFrozenData v2, PDF Template Rewrite

## Current Position

Phase: 34 of 39 (ContractFrozenData v2, PDF Template Rewrite)
Plan: 4 of 5 in current phase
Status: in-progress
Last activity: 2026-04-12 -- Completed 34-04 (Admin Terms Editor)

Progress: [█████░░░░░] 55%

## Performance Metrics

**Velocity:**
- Total plans completed: 100 (37 v1.0 + 14 v1.1 + 7 v2.0 + 26 v2.1 + 2 v2.2 + 9 v2.3 + 5 v3.0)
- Phases completed: 32 + 1 inserted (9.1)

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

### Pending Todos

None.

### Blockers/Concerns

- ZWROT-01 (return protocol): client template not yet received -- Phase 39 is last for this reason
- OCR (Phase 36) requires EAS dev client build, not Expo Go
- @pdfsmaller/pdf-encrypt-lite newer library (Feb 2026) -- validate on target readers before Phase 37 ships

## Session Continuity

Last session: 2026-04-12T21:25:00Z
Stopped at: Completed 34-04-PLAN.md
Resume file: .planning/phases/34-contractfrozendata-v2-pdf-template-rewrite/34-05-PLAN.md
