---
phase: 04-contract-and-pdf
plan: 01
subsystem: api
tags: [prisma, puppeteer, handlebars, pdf, contracts, zod]

requires:
  - phase: 03-rental-lifecycle
    provides: Rental model, rental.extended event, pricing in grosze
  - phase: 02-fleet-and-customers
    provides: Customer model with encrypted PII, StorageService for MinIO
provides:
  - Contract, ContractSignature, ContractAnnex Prisma models
  - ContractStatus enum, ContractDto, ContractFrozenData shared types
  - createContractSchema and signContractSchema Zod schemas
  - PdfService with Puppeteer singleton and Handlebars template compilation
  - Contract and annex Handlebars templates for PDF rendering
  - Wave 0 test stubs for all CONT requirements
affects: [04-02-PLAN, admin-panel, mobile-app]

tech-stack:
  added: [puppeteer, handlebars]
  patterns: [puppeteer-singleton-browser, handlebars-template-compilation, rgb-only-colors-in-hbs, frozen-contract-data-snapshot]

key-files:
  created:
    - packages/shared/src/types/contract.types.ts
    - packages/shared/src/schemas/contract.schemas.ts
    - apps/api/src/contracts/dto/create-contract.dto.ts
    - apps/api/src/contracts/dto/sign-contract.dto.ts
    - apps/api/src/contracts/dto/create-annex.dto.ts
    - apps/api/src/contracts/pdf/pdf.service.ts
    - apps/api/src/contracts/pdf/templates/contract.hbs
    - apps/api/src/contracts/pdf/templates/annex.hbs
    - apps/api/src/contracts/pdf/pdf.service.spec.ts
    - apps/api/src/contracts/contracts.service.spec.ts
    - apps/api/test/contracts.e2e-spec.ts
  modified:
    - apps/api/prisma/schema.prisma
    - packages/shared/src/index.ts
    - apps/api/package.json

key-decisions:
  - "Puppeteer singleton browser with per-request page creation for concurrent PDF generation"
  - "rgb() color notation only in Handlebars templates to avoid # conflict"
  - "ContractFrozenData interface captures all contract data for immutable snapshot"
  - "21 Polish rental conditions in contract template with 3 interpolated financial fields"

patterns-established:
  - "PdfService: OnModuleInit launches browser, OnModuleDestroy closes it"
  - "Handlebars helpers: formatDate (DD.MM.YYYY), formatDateTime (DD.MM.YYYY HH:mm), formatMoney (grosze to zl)"
  - "Contract template: 2 pages with page-break-after, base64 embedded images"
  - "Annex template: single-page amendment referencing original contract"

requirements-completed: [CONT-01, CONT-02, CONT-03]

duration: 6min
completed: 2026-03-24
---

# Phase 4 Plan 1: Contract Schema and PDF Infrastructure Summary

**Prisma Contract/Signature/Annex models, shared types with Zod validation, PdfService with Puppeteer singleton, and 2-page Handlebars contract template with Polish rental conditions**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-24T13:11:05Z
- **Completed:** 2026-03-24T13:17:38Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Contract, ContractSignature, ContractAnnex Prisma models with proper relations and indexes
- Shared TypeScript types (ContractDto, ContractFrozenData) and Zod schemas for contract creation and signing
- PdfService with Puppeteer singleton browser, Handlebars template compilation, and formatDate/formatMoney helpers
- Full 2-page contract template with company info, customer data, vehicle details, financial conditions, RODO consent, damage sketch, 21 Polish rental conditions, and signature blocks
- Single-page annex template for rental extensions
- Wave 0 test stubs (12 todos) covering all CONT requirements
- PdfService unit tests (10 passing) with mocked Puppeteer

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema, shared types, Zod schemas, DTOs, and Wave 0 test stubs** - `bddfbf8` (feat)
2. **Task 2: PdfService with Puppeteer singleton and Handlebars contract + annex templates** - `fe9e610` (feat)

## Files Created/Modified
- `apps/api/prisma/schema.prisma` - Added ContractStatus enum, Contract, ContractSignature, ContractAnnex models
- `packages/shared/src/types/contract.types.ts` - ContractStatus, ContractDto, ContractFrozenData, SignatureType, SignerRole
- `packages/shared/src/schemas/contract.schemas.ts` - createContractSchema, signContractSchema Zod schemas
- `packages/shared/src/index.ts` - Added contract types and schemas exports
- `apps/api/src/contracts/dto/create-contract.dto.ts` - CreateContractDto with class-validator decorators
- `apps/api/src/contracts/dto/sign-contract.dto.ts` - SignContractDto with signature type validation
- `apps/api/src/contracts/dto/create-annex.dto.ts` - CreateAnnexDto for rental extension amendments
- `apps/api/src/contracts/pdf/pdf.service.ts` - PdfService with Puppeteer singleton, Handlebars compilation, helpers
- `apps/api/src/contracts/pdf/templates/contract.hbs` - 2-page contract template with Polish rental agreement
- `apps/api/src/contracts/pdf/templates/annex.hbs` - Single-page annex template
- `apps/api/src/contracts/pdf/pdf.service.spec.ts` - 10 unit tests for PdfService and Handlebars helpers
- `apps/api/src/contracts/contracts.service.spec.ts` - 12 todo stubs for contract business logic
- `apps/api/test/contracts.e2e-spec.ts` - 5 todo stubs for contract e2e flow
- `apps/api/package.json` - Added puppeteer and handlebars dependencies

## Decisions Made
- Puppeteer singleton browser with per-request page creation: avoids 500ms-2s startup per PDF, handles concurrency natively
- rgb() color notation in all Handlebars templates: prevents `#` conflict with Handlebars block helper syntax
- ContractFrozenData interface defines the immutable snapshot shape stored as JSON in contractData field
- 21 Polish rental conditions included in template with 3 interpolated fields (deposit, daily rate, late fee)
- Annex template has employee signature block only (administrative extension, not new agreement)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Rebuilt shared package to export new contract types**
- **Found during:** Task 2 (PdfService tests)
- **Issue:** `@rentapp/shared` uses compiled dist/ output; new contract types not available until rebuild
- **Fix:** Ran `pnpm build` in packages/shared to compile new types
- **Files modified:** packages/shared/dist/ (gitignored)
- **Verification:** PdfService tests compile and pass
- **Committed in:** fe9e610 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary build step for shared package. No scope creep.

## Issues Encountered
None beyond the shared package rebuild.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema, types, and PDF infrastructure ready for Plan 02 (contract business logic)
- PdfService can be injected into ContractsService
- Wave 0 test stubs define the behavioral contract for Plan 02 implementation
- Handlebars templates ready for real contract data rendering

## Self-Check: PASSED

All 12 files verified present. Both task commits (bddfbf8, fe9e610) verified in git log.

---
*Phase: 04-contract-and-pdf*
*Completed: 2026-03-24*
