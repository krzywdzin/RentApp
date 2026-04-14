---
phase: 36-ocr-document-scanning
plan: 01
subsystem: api
tags: [prisma, nestjs, r2, sharp, multer, document-scanning]

# Dependency graph
requires:
  - phase: 33-insurance-rental
    provides: Manual SQL migration precedent, StorageService for R2
provides:
  - CustomerDocument Prisma model with customerId+type unique constraint
  - Manual SQL migration for customer_documents table
  - Shared DocumentType/DocumentSide enums and OCR field interfaces in @rentapp/shared
  - Zod validation schemas for document upload params
  - NestJS DocumentsModule with upload and retrieval endpoints
  - DocumentsService with uploadPhoto, getDocuments, deleteDocumentsByCustomerId
affects: [36-02-mobile-scanner, 36-03-web-admin-viewer]

# Tech tracking
tech-stack:
  added: []
  patterns: [document-photo-upload-with-thumbnail, upsert-on-unique-constraint]

key-files:
  created:
    - apps/api/prisma/migrations/20260414121800_add_customer_documents/migration.sql
    - packages/shared/src/types/document.types.ts
    - packages/shared/src/schemas/document.schemas.ts
    - apps/api/src/documents/documents.module.ts
    - apps/api/src/documents/documents.controller.ts
    - apps/api/src/documents/documents.service.ts
    - apps/api/src/documents/documents.service.spec.ts
    - apps/api/src/documents/dto/upload-document.dto.ts
    - apps/api/src/documents/dto/document-response.dto.ts
  modified:
    - apps/api/prisma/schema.prisma
    - packages/shared/src/index.ts
    - apps/api/src/app.module.ts

key-decisions:
  - "Manual SQL migration following Phase 33/34 precedent (no shadow DB)"
  - "frontPhotoKey is required in schema; back-only uploads set empty string placeholder"
  - "URL route uses kebab-case (id-card, driver-license) mapped to DB enum (ID_CARD, DRIVER_LICENSE)"

patterns-established:
  - "Document photo key pattern: documents/{customerId}/{type}/{side}.jpg with _thumb suffix for thumbnails"
  - "Upsert on customerId+type unique constraint for idempotent re-uploads"

requirements-completed: [DOC-06]

# Metrics
duration: 5min
completed: 2026-04-14
---

# Phase 36 Plan 01: Backend Document Foundation Summary

**CustomerDocument Prisma model with R2 photo upload, NestJS documents module, shared types, and 6 passing unit tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-14T12:18:04Z
- **Completed:** 2026-04-14T12:22:40Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- CustomerDocument model in Prisma with customerId+type unique constraint, cascade delete from Customer
- Manual SQL migration for customer_documents table with foreign keys to customers and users
- Shared DocumentType/DocumentSide enums, OCR field interfaces, and Zod schemas exported from @rentapp/shared
- NestJS Documents module with POST upload (ADMIN, EMPLOYEE) and GET list (ADMIN) endpoints
- Upload generates 320px thumbnails via sharp, stores both full and thumb to R2
- 6 unit tests covering upload, retrieval, deletion, and re-upload with old key cleanup

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema, migration, shared types, and document schemas** - `3984092` (feat)
2. **Task 2: NestJS Documents module with upload/get endpoints and unit tests** - `53273d8` (feat)

## Files Created/Modified
- `apps/api/prisma/schema.prisma` - Added CustomerDocument model + relations to Customer and User
- `apps/api/prisma/migrations/20260414121800_add_customer_documents/migration.sql` - Table creation SQL
- `packages/shared/src/types/document.types.ts` - DocumentType, DocumentSide, OCR fields, DTOs
- `packages/shared/src/schemas/document.schemas.ts` - Zod schemas for document type/side validation
- `packages/shared/src/index.ts` - Barrel exports for document types and schemas
- `apps/api/src/documents/documents.module.ts` - NestJS module registration
- `apps/api/src/documents/documents.controller.ts` - POST upload and GET list endpoints
- `apps/api/src/documents/documents.service.ts` - Upload, retrieval, deletion business logic
- `apps/api/src/documents/documents.service.spec.ts` - 6 unit tests
- `apps/api/src/documents/dto/upload-document.dto.ts` - Upload params DTO with class-validator
- `apps/api/src/documents/dto/document-response.dto.ts` - Response type re-export
- `apps/api/src/app.module.ts` - DocumentsModule registered

## Decisions Made
- Manual SQL migration following Phase 33/34 precedent (no shadow DB)
- frontPhotoKey is required in Prisma schema; back-only uploads set empty string placeholder that front upload will overwrite
- Controller URL uses kebab-case (id-card, driver-license) mapped to DB enum values (ID_CARD, DRIVER_LICENSE) internally

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Prisma client needed regeneration after schema changes for TypeScript to recognize `customerDocument` property
- Shared package needed rebuild for API to resolve new exports

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Backend endpoints ready for mobile scanner (Plan 02) to upload document photos
- Web admin (Plan 03) can retrieve documents with presigned URLs
- OCR field interfaces ready for future text extraction integration

---
*Phase: 36-ocr-document-scanning*
*Completed: 2026-04-14*
