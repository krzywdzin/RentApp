---
phase: 34-contractfrozendata-v2-pdf-template-rewrite
plan: 02
subsystem: api
tags: [nestjs, handlebars, pdf, prisma, contracts, frozen-data]

requires:
  - phase: 34-contractfrozendata-v2-pdf-template-rewrite/34-01
    provides: "ContractFrozenDataV2 types, SettingsService, RentalDriversService, isV2 guard"
provides:
  - "buildFrozenDataV2 in contracts.service.ts -- creates v2 frozen data for all new contracts"
  - "Dynamic signature completion (4 base + 2 second driver)"
  - "Versioned PDF template with v1/v2 guards in contract.hbs"
  - "eq and formatVatStatus Handlebars helpers"
  - "Company/NIP/VAT section in PDF for company rentals"
  - "Second driver section and signatures in PDF"
  - "Dynamic termsHtml rendering (triple-stache) replacing hardcoded conditions for v2"
affects: [34-03, 34-04, 34-05, mobile-contract-signing]

tech-stack:
  added: []
  patterns: [handlebars-version-guard, dynamic-signature-completion, frozen-data-v2-builder]

key-files:
  created: []
  modified:
    - apps/api/src/contracts/contracts.service.ts
    - apps/api/src/contracts/contracts.module.ts
    - apps/api/src/contracts/dto/create-contract.dto.ts
    - apps/api/src/contracts/dto/sign-contract.dto.ts
    - apps/api/src/contracts/pdf/pdf.service.ts
    - apps/api/src/contracts/pdf/templates/contract.hbs

key-decisions:
  - "companyName set to null in v2 frozen data -- no source column exists yet; will be populated from GUS/NIP lookup in future"
  - "Second driver signature layout uses 3-column flex (.signatures-row-three) when secondDriver present"
  - "ContractPdfData type updated in Task 1 (not Task 2) to unblock TypeScript compilation"

patterns-established:
  - "Version guard pattern: {{#if (eq version 2)}} for v2-only sections, {{#unless (eq version 2)}} for v1-only"
  - "Dynamic signature types: getRequiredSignatureTypes(frozenData) returns 4 or 6 based on secondDriver"
  - "Terms resolution chain: rental.rentalTerms -> settingsService.get('default_rental_terms') -> empty string"

requirements-completed: [KLIENT-05, FLOTA-05, UMOWA-02, UMOWA-03, UMOWA-04, NAJEM-07]

duration: 17min
completed: 2026-04-12
---

# Phase 34 Plan 02: Contract Service V2 & PDF Template Rewrite Summary

**buildFrozenDataV2 with company/VAT, second driver, dynamic terms; PDF template with version guards hiding VIN/year for v2 and rendering TipTap HTML conditions**

## Performance

- **Duration:** 17 min
- **Started:** 2026-04-12T21:20:25Z
- **Completed:** 2026-04-12T21:37:25Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Contract service now creates v2 frozen data with company/NIP/VAT, vehicle class, second driver, and resolved terms
- PDF template uses Handlebars version guards for v1/v2 divergence -- v1 contracts render identically to before
- Dynamic signature completion: 4 signatures without second driver, 6 with second driver
- Company rental section, second driver section, and terms notes section all conditional in PDF

## Task Commits

Each task was committed atomically:

1. **Task 1: Contract service v2 -- buildFrozenDataV2, dynamic signatures, terms resolution** - `d18cc3b` (feat)
2. **Task 2: PDF template rewrite + Handlebars helpers** - `bf56d78` (feat)

## Files Created/Modified
- `apps/api/src/contracts/contracts.service.ts` - buildFrozenDataV2, getRequiredSignatureTypes, SettingsService/RentalDriversService injection
- `apps/api/src/contracts/contracts.module.ts` - Import SettingsModule and RentalDriversModule
- `apps/api/src/contracts/dto/create-contract.dto.ts` - Added termsAcceptedAt field
- `apps/api/src/contracts/dto/sign-contract.dto.ts` - Extended signatureType validation for second driver
- `apps/api/src/contracts/pdf/pdf.service.ts` - eq/formatVatStatus helpers, extended ContractPdfData with secondCustomer sigs and termsAcceptance
- `apps/api/src/contracts/pdf/templates/contract.hbs` - Full v1/v2 version-guarded template with company, second driver, dynamic terms

## Decisions Made
- companyName set to null in v2 frozen data: no source column exists in the Rental or Customer model yet; will be populated when GUS/NIP lookup is implemented
- Updated ContractPdfData in Task 1 (ahead of Task 2) to unblock TypeScript compilation -- this was a Rule 3 blocking issue
- Second driver signatures use 3-column layout class to fit all three signature blocks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated ContractPdfData type in Task 1 instead of Task 2**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** Adding secondCustomerPage1/Page2 to pdfData in contracts.service.ts failed because ContractPdfData in pdf.service.ts didn't have those fields yet
- **Fix:** Extended ContractPdfData signatures type and added termsAcceptance field during Task 1
- **Files modified:** apps/api/src/contracts/pdf/pdf.service.ts
- **Verification:** tsc --noEmit passes cleanly
- **Committed in:** d18cc3b (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to unblock TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Contract service and PDF template fully support v2 frozen data
- Ready for Plan 03 (mobile contract signing flow updates) and Plan 04 (web admin contract views)
- v1 contracts continue to render correctly with hardcoded conditions

---
*Phase: 34-contractfrozendata-v2-pdf-template-rewrite*
*Completed: 2026-04-12*
