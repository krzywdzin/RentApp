---
phase: 39-return-protocol
plan: 01
subsystem: api
tags: [nestjs, prisma, puppeteer, handlebars, pdf, email, resend, return-protocol]

requires:
  - phase: 34-frozen-data
    provides: PdfService with Puppeteer + Handlebars pipeline, contract PDF generation pattern
  - phase: 37-sms-pdf-encryption
    provides: MailService with PDF attachment support
provides:
  - ReturnProtocol Prisma model with migration SQL
  - ReturnProtocolsService with create, findByRentalId, getDownloadUrl
  - ReturnProtocolsController with POST /, GET /:rentalId, GET /:rentalId/download
  - PdfService.generateReturnProtocolPdf() with Handlebars template
  - MailService.sendReturnProtocolEmail() with insurance case number support
  - ProtocolCleanliness type and CLEANLINESS_LABELS in shared package
affects: [39-02-mobile-wizard, 39-03-web-download]

tech-stack:
  added: []
  patterns: [return-protocol-pdf-pipeline, fire-and-forget-email-with-db-update]

key-files:
  created:
    - apps/api/src/return-protocols/return-protocols.module.ts
    - apps/api/src/return-protocols/return-protocols.service.ts
    - apps/api/src/return-protocols/return-protocols.controller.ts
    - apps/api/src/return-protocols/dto/create-return-protocol.dto.ts
    - apps/api/src/return-protocols/return-protocols.service.spec.ts
    - apps/api/src/contracts/pdf/templates/return-protocol.hbs
    - apps/api/prisma/migrations/manual/039_return_protocol.sql
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/src/contracts/pdf/pdf.service.ts
    - apps/api/src/contracts/contracts.module.ts
    - apps/api/src/mail/mail.service.ts
    - apps/api/src/app.module.ts
    - packages/shared/src/types/rental.types.ts

key-decisions:
  - "PdfService exported from ContractsModule for reuse by ReturnProtocolsModule"
  - "20mm PDF margins per UI-SPEC (differs from contract 15mm)"
  - "setImmediate fire-and-forget email with DB emailSentAt update on success"

patterns-established:
  - "Return protocol PDF pipeline: Handlebars template -> Puppeteer -> R2 upload -> fire-and-forget email"

requirements-completed: [ZWROT-01]

duration: 8min
completed: 2026-04-15
---

# Phase 39 Plan 01: Return Protocol Backend Summary

**ReturnProtocol API with Prisma model, NestJS module, Puppeteer PDF generation via Handlebars template, and fire-and-forget email delivery**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-14T22:28:18Z
- **Completed:** 2026-04-14T22:36:00Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- ReturnProtocol Prisma model with migration SQL, unique constraint on rentalId
- Full NestJS module with service (create, findByRentalId, getDownloadUrl), controller (3 endpoints), and DTO with class-validator
- PdfService extended with generateReturnProtocolPdf() and Handlebars template matching client layout
- MailService extended with sendReturnProtocolEmail() supporting insurance case number in subject
- 14 unit tests passing (5 DTO validation + 9 service logic)

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema, migration, shared types, DTO, Handlebars template** - `f4b3bd9` (feat)
2. **Task 2: ReturnProtocols NestJS module, PdfService/MailService extensions** - `9498be3` (feat)

## Files Created/Modified
- `apps/api/prisma/schema.prisma` - Added ReturnProtocol model with Rental/User relations
- `apps/api/prisma/migrations/manual/039_return_protocol.sql` - Manual migration SQL
- `packages/shared/src/types/rental.types.ts` - ProtocolCleanliness type and CLEANLINESS_LABELS
- `apps/api/src/return-protocols/dto/create-return-protocol.dto.ts` - DTO with cleanliness enum validation
- `apps/api/src/contracts/pdf/templates/return-protocol.hbs` - Single-page A4 PDF template with KITEK header
- `apps/api/src/return-protocols/return-protocols.service.ts` - Protocol creation, PDF gen, email, download
- `apps/api/src/return-protocols/return-protocols.controller.ts` - REST endpoints (POST, GET, GET download)
- `apps/api/src/return-protocols/return-protocols.module.ts` - NestJS module wiring
- `apps/api/src/return-protocols/return-protocols.service.spec.ts` - 9 unit tests
- `apps/api/src/contracts/pdf/pdf.service.ts` - Added ReturnProtocolPdfData interface and generateReturnProtocolPdf()
- `apps/api/src/contracts/contracts.module.ts` - Export PdfService for reuse
- `apps/api/src/mail/mail.service.ts` - Added sendReturnProtocolEmail()
- `apps/api/src/app.module.ts` - Registered ReturnProtocolsModule

## Decisions Made
- Exported PdfService from ContractsModule so ReturnProtocolsModule can import it (Rule 3 - blocking dependency)
- Used 20mm PDF margins per UI-SPEC (contract template uses 15mm)
- Customer email non-null assertion (email required for protocol delivery, nullable in schema for legacy reasons)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] PdfService not exported from ContractsModule**
- **Found during:** Task 2 (Module wiring)
- **Issue:** PdfService was a provider in ContractsModule but not exported, preventing ReturnProtocolsModule from using it
- **Fix:** Added PdfService to ContractsModule exports array
- **Files modified:** apps/api/src/contracts/contracts.module.ts
- **Verification:** Module compiles, service injection works in tests
- **Committed in:** 9498be3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Plan anticipated this possibility ("Check if ContractsModule exports PdfService"). Fix was straightforward.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- API endpoints ready for mobile wizard (39-02) to consume
- Download endpoint ready for web admin panel (39-03)
- Migration SQL ready to apply to production database

---
*Phase: 39-return-protocol*
*Completed: 2026-04-15*
