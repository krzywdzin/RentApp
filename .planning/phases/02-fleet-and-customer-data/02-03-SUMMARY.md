---
phase: 02-fleet-and-customer-data
plan: 03
subsystem: api
tags: [nestjs, prisma, aes-256-gcm, hmac, encryption, rodo, cron, customers]

requires:
  - phase: 02-fleet-and-customer-data/01
    provides: "Prisma Customer model, field-encryption.ts (encrypt/decrypt/hmacIndex), PESEL validator, shared CustomerDto types"
provides:
  - "CustomersModule with CRUD endpoints (POST/GET/PATCH /customers)"
  - "AES-256-GCM encrypted PII storage (PESEL, ID number, license number)"
  - "HMAC-based exact-match search without decryption"
  - "PESEL deduplication (returns existing customer on duplicate)"
  - "RetentionService with daily cron for RODO hard-delete of expired archived customers"
  - "Audit-safe sensitive field masking ([ENCRYPTED] in oldValues)"
affects: [03-rental-contracts, 04-contract-pdf, 05-admin-panel]

tech-stack:
  added: ["@nestjs/schedule"]
  patterns: ["encrypted PII CRUD with HMAC search indices", "RODO retention cron cleanup", "audit masking for sensitive fields"]

key-files:
  created:
    - "apps/api/src/customers/customers.controller.ts"
    - "apps/api/src/customers/customers.service.ts"
    - "apps/api/src/customers/retention.service.ts"
    - "apps/api/src/customers/customers.module.ts"
    - "apps/api/src/customers/dto/create-customer.dto.ts"
    - "apps/api/src/customers/dto/update-customer.dto.ts"
    - "apps/api/src/customers/dto/search-customer.dto.ts"
    - "apps/api/src/customers/customers.service.spec.ts"
    - "apps/api/src/customers/retention.service.spec.ts"
    - "apps/api/test/customers.e2e-spec.ts"
  modified:
    - "apps/api/src/app.module.ts"

key-decisions:
  - "Used ScheduleModule.forRoot() in AppModule for global cron registration"
  - "Corrected PESEL test value from plan (44051401358 invalid) to valid checksum (44051401359)"
  - "StorageService mocked in e2e tests to avoid MinIO dependency for customer-only tests"
  - "Import CustomerDto from @rentapp/shared barrel instead of deep path for e2e compatibility"

patterns-established:
  - "Encrypted field pattern: encrypt() to Json column + hmacIndex() to String column for searchable encrypted PII"
  - "Audit masking: sensitive fields use {old: '[ENCRYPTED]', new: '[ENCRYPTED]'} in __audit.changes"
  - "RODO retention: retentionExpiresAt set on creation, cron deletes expired+archived records"

requirements-completed: [CUST-01, CUST-02, CUST-03, CUST-04]

duration: 6min
completed: 2026-03-23
---

# Phase 2 Plan 3: Customer Module Summary

**CustomerModule with AES-256-GCM encrypted PII (PESEL/ID/license), HMAC search indices, PESEL deduplication, RODO retention cron, and 30 passing tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-23T20:10:20Z
- **Completed:** 2026-03-23T20:16:20Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Full CRUD for customers with encrypted PESEL, ID number, and license number at rest (AES-256-GCM)
- HMAC-based exact-match search for PESEL without decryption, case-insensitive lastName search, exact phone match
- PESEL deduplication: creating with existing PESEL returns the existing customer instead of duplicating
- RetentionService daily cron job hard-deletes expired archived customers per RODO requirements
- Audit-safe masking: sensitive field changes logged as "[ENCRYPTED]" in audit trail
- 15 unit tests + 15 e2e tests all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: CustomerModule -- CRUD with encrypted PII, HMAC search, audit masking** - `70458e7` (feat)
2. **Task 2: Retention service and e2e test suite for customers** - `9bceb5b` (feat)

## Files Created/Modified
- `apps/api/src/customers/customers.controller.ts` - CRUD + search endpoints with role guards and audit metadata
- `apps/api/src/customers/customers.service.ts` - Business logic with encrypt/decrypt/hmacIndex, dedup, retention
- `apps/api/src/customers/retention.service.ts` - Daily cron for RODO hard-delete of expired archived customers
- `apps/api/src/customers/customers.module.ts` - Module declaration with controller, service, retention
- `apps/api/src/customers/dto/create-customer.dto.ts` - Validated DTO with @IsValidPesel decorator
- `apps/api/src/customers/dto/update-customer.dto.ts` - PartialType of CreateCustomerDto
- `apps/api/src/customers/dto/search-customer.dto.ts` - Optional lastName/phone/pesel search params
- `apps/api/src/customers/customers.service.spec.ts` - 11 unit tests for encryption, HMAC, dedup, search, archive
- `apps/api/src/customers/retention.service.spec.ts` - 4 unit tests for retention cleanup logic
- `apps/api/test/customers.e2e-spec.ts` - 15 e2e tests for full customer lifecycle
- `apps/api/src/app.module.ts` - Added ScheduleModule.forRoot()

## Decisions Made
- **Valid PESEL for tests:** Plan specified 44051401358 which fails checksum validation; used 44051401359 instead
- **ScheduleModule placement:** Registered ScheduleModule.forRoot() in AppModule (global) rather than CustomersModule
- **StorageService mock in e2e:** Overrode StorageService in customer e2e tests to avoid MinIO dependency
- **Barrel import:** Changed CustomerDto import from deep path to @rentapp/shared barrel for e2e compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Invalid PESEL in plan test data**
- **Found during:** Task 2 (e2e test creation)
- **Issue:** Plan used PESEL 44051401358 which fails checksum validation
- **Fix:** Used 44051401359 (valid checksum) and 92071314764 as test PESELs
- **Files modified:** apps/api/test/customers.e2e-spec.ts
- **Committed in:** 9bceb5b

**2. [Rule 3 - Blocking] StorageService MinIO connection failure in e2e**
- **Found during:** Task 2 (e2e test execution)
- **Issue:** AppModule imports StorageModule which tries to connect to MinIO on init, failing in test env
- **Fix:** Overrode StorageService with mock in e2e test module setup
- **Files modified:** apps/api/test/customers.e2e-spec.ts
- **Committed in:** 9bceb5b

**3. [Rule 3 - Blocking] Deep import path incompatible with e2e test resolution**
- **Found during:** Task 2 (e2e test execution)
- **Issue:** Import from @rentapp/shared/src/types/customer.types not resolving in e2e context
- **Fix:** Changed to barrel import from @rentapp/shared
- **Files modified:** apps/api/src/customers/customers.service.ts
- **Committed in:** 9bceb5b

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for correct test execution. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Customer CRUD API fully operational with encrypted PII storage
- HMAC search indices enable efficient lookup without decryption
- RetentionService ready for Phase 3 integration (update retentionExpiresAt when rentals complete)
- CustomersService exported for use in rental contract module (Phase 3)

---
*Phase: 02-fleet-and-customer-data*
*Completed: 2026-03-23*
