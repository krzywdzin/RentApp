---
phase: 04-contract-and-pdf
plan: 02
subsystem: api
tags: [nestjs, contracts, signatures, pdf, email, event-emitter, sha256]

requires:
  - phase: 04-contract-and-pdf
    provides: Contract/Signature/Annex Prisma models, PdfService, DTOs, shared types
  - phase: 03-rental-lifecycle
    provides: Rental model, rental.extended event, pricing in grosze
  - phase: 02-fleet-and-customers
    provides: Customer model with encrypted PII, StorageService for MinIO
provides:
  - ContractsService with create, sign, findOne, findByRental, createAnnex
  - ContractsController with REST endpoints for full contract lifecycle
  - RentalExtendedListener for automatic annex creation on rental extension
  - MailService extended with sendContractEmail and sendAnnexEmail
  - StorageService extended with getBuffer for object retrieval
  - Content hash verification with deep-sorted JSON serialization
affects: [admin-panel, mobile-app]

tech-stack:
  added: []
  patterns: [deep-sorted-json-hash, signature-upsert-pattern, event-driven-annex]

key-files:
  created:
    - apps/api/src/contracts/contracts.service.ts
    - apps/api/src/contracts/contracts.controller.ts
    - apps/api/src/contracts/contracts.module.ts
    - apps/api/src/contracts/listeners/rental-extended.listener.ts
  modified:
    - apps/api/src/mail/mail.service.ts
    - apps/api/src/storage/storage.service.ts
    - apps/api/src/app.module.ts
    - apps/api/src/contracts/contracts.service.spec.ts
    - apps/api/test/contracts.e2e-spec.ts

key-decisions:
  - "Deep sorted JSON serialization for deterministic content hash across nested objects"
  - "Signature upsert pattern allows re-signing without duplicate records"
  - "Email failures caught and logged without blocking contract flow"
  - "Annex creation failure does not block rental extension (fire-and-forget with logging)"

patterns-established:
  - "ContractsService: frozen data assembled from rental+customer(decrypted)+vehicle"
  - "Content hash: deep-sorted stringify + SHA-256 for tamper detection"
  - "Contract number: KITEK/YYYY/MMDD/XXXX with daily sequence counter"
  - "Sign endpoint: @HttpCode(200) since signing is not creating a new resource"

requirements-completed: [CONT-01, CONT-02, CONT-03, CONT-04, CONT-05]

duration: 7min
completed: 2026-03-24
---

# Phase 4 Plan 2: Contract Business Logic Summary

**ContractsService with frozen-data creation, 4-signature signing flow with SHA-256 content hash, PDF generation on final signature, automatic email delivery, and event-driven annex creation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T13:20:44Z
- **Completed:** 2026-03-24T13:28:27Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- ContractsService with full lifecycle: create contracts from rental data with frozen snapshots, handle 4 signatures with content hash verification, trigger PDF generation and email on final signature
- ContractsController exposing REST API: POST /contracts, POST /contracts/:id/sign, GET /contracts/:id, GET /contracts/rental/:rentalId, GET /contracts/:id/pdf
- RentalExtendedListener consuming rental.extended events for automatic annex creation with PDF and email
- MailService extended with sendContractEmail and sendAnnexEmail (PDF attachments)
- 19 unit tests and 7 e2e tests all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: ContractsService with create, sign, PDF generation, and email delivery** - `f8aa907` (feat)
2. **Task 2: ContractsController, event listener, module wiring, and e2e tests** - `3708fca` (feat)

## Files Created/Modified
- `apps/api/src/contracts/contracts.service.ts` - Contract creation, signing, PDF orchestration, annex logic (350+ lines)
- `apps/api/src/contracts/contracts.controller.ts` - REST endpoints with role guards and audit metadata
- `apps/api/src/contracts/contracts.module.ts` - Module wiring with imports for Rentals, Customers, Mail
- `apps/api/src/contracts/listeners/rental-extended.listener.ts` - EventEmitter2 handler for rental.extended
- `apps/api/src/mail/mail.service.ts` - Added sendContractEmail and sendAnnexEmail with PDF attachments
- `apps/api/src/storage/storage.service.ts` - Added getBuffer method for retrieving uploaded objects
- `apps/api/src/app.module.ts` - Registered ContractsModule
- `apps/api/src/contracts/contracts.service.spec.ts` - 19 unit tests replacing todo stubs
- `apps/api/test/contracts.e2e-spec.ts` - 7 e2e tests replacing todo stubs

## Decisions Made
- Deep sorted JSON serialization for content hash: `JSON.stringify` with sorted keys only handles top-level; implemented recursive sorted stringify for deterministic hashing across nested ContractFrozenData
- Signature upsert pattern: using Prisma `upsert` on `contractId_signatureType` unique constraint allows re-signing without manual delete/create
- Email delivery wrapped in try/catch: email failures logged but don't block the contract signing flow
- StorageService.getBuffer added (Rule 3 deviation): needed to fetch signature images from MinIO for PDF embedding

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added StorageService.getBuffer method**
- **Found during:** Task 1 (ContractsService sign flow)
- **Issue:** StorageService only had upload and getPresignedDownloadUrl; sign flow needs to fetch signature image buffers from MinIO for PDF embedding
- **Fix:** Added getBuffer method using GetObjectCommand with stream-to-buffer conversion
- **Files modified:** apps/api/src/storage/storage.service.ts
- **Verification:** Unit tests pass with mocked getBuffer; e2e tests verify full flow
- **Committed in:** f8aa907 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed generateContentHash for nested objects**
- **Found during:** Task 1 (unit test for different hash on different data)
- **Issue:** `JSON.stringify(data, sortedKeys)` replacer array only handles top-level keys, not nested objects -- produced identical hashes for objects differing only in nested properties
- **Fix:** Implemented recursive sortedStringify that sorts keys at every nesting level
- **Files modified:** apps/api/src/contracts/contracts.service.ts
- **Verification:** Unit test confirms different data produces different hashes
- **Committed in:** f8aa907 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- NestJS POST endpoints default to 201 status; sign endpoint needed @HttpCode(200) since signing is an update, not a creation

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 complete: all contract infrastructure and business logic implemented
- ContractsModule fully integrated into AppModule
- All CONT-01 through CONT-05 requirements implemented and tested
- Ready for Phase 5 (Admin Panel) to build UI for contract management

## Self-Check: PASSED

All 4 created files verified present. Both task commits (f8aa907, 3708fca) verified in git log.

---
*Phase: 04-contract-and-pdf*
*Completed: 2026-03-24*
