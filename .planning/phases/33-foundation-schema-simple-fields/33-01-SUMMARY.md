---
phase: 33-foundation-schema-simple-fields
plan: 01
subsystem: database
tags: [prisma, zod, nip, validation, typescript, postgresql]

requires: []
provides:
  - VehicleClass model and 'Nieokreslona' default class
  - VatPayerStatus enum (FULL_100, HALF_50, NONE)
  - Structured Customer address (street, houseNumber, apartmentNumber, postalCode, city)
  - Per-rental company fields (isCompanyRental, companyNip, vatPayerStatus, insuranceCaseNumber)
  - NIP mod-11 checksum validator (isValidNip)
  - Updated Zod schemas for Customer, Rental, Vehicle with new fields
  - VehicleClassDto type and vehicleClassName on VehicleDto
affects: [33-02, 33-03, 33-04, 34-contract-data]

tech-stack:
  added: [jest (shared package), ts-jest (shared package)]
  patterns: [mod-11 checksum validation, nullable->backfill->NOT NULL migration pattern, connectOrCreate for defaults]

key-files:
  created:
    - packages/shared/src/lib/nip.ts
    - packages/shared/src/lib/nip.spec.ts
    - packages/shared/jest.config.ts
    - apps/api/prisma/migrations/20260412174041_phase33_foundation/migration.sql
  modified:
    - apps/api/prisma/schema.prisma
    - packages/shared/src/types/vehicle.types.ts
    - packages/shared/src/types/rental.types.ts
    - packages/shared/src/types/customer.types.ts
    - packages/shared/src/schemas/customer.schemas.ts
    - packages/shared/src/schemas/rental.schemas.ts
    - packages/shared/src/schemas/vehicle.schemas.ts
    - packages/shared/src/index.ts
    - apps/api/src/customers/customers.service.ts
    - apps/api/src/customers/dto/create-customer.dto.ts
    - apps/api/src/contracts/contracts.service.ts
    - apps/api/src/vehicles/vehicles.service.ts
    - apps/api/src/vehicles/dto/create-vehicle.dto.ts
    - apps/api/src/vehicles/vehicles.service.spec.ts
    - apps/web/src/app/(admin)/klienci/[id]/page.tsx
    - apps/web/src/app/(admin)/klienci/[id]/edytuj/page.tsx

key-decisions:
  - "Used migrate diff + manual SQL instead of prisma migrate dev due to shadow DB incompatibility with db-push history"
  - "Constructed address string from structured fields in contracts.service for backward-compatible contract PDF"
  - "Used connectOrCreate for default vehicle class in CSV import to be idempotent"

patterns-established:
  - "NIP validator pattern: weights array + mod-11 checksum, same approach as PESEL validator"
  - "Nullable->backfill->NOT NULL migration pattern for adding required FK to existing tables"

requirements-completed: [KLIENT-01, KLIENT-02, KLIENT-03, KLIENT-04, FLOTA-01, FLOTA-02, NAJEM-01]

duration: 8min
completed: 2026-04-12
---

# Phase 33 Plan 01: Foundation Schema & Simple Fields Summary

**NIP mod-11 validator, VatPayerStatus enum, VehicleClass model, structured Customer address, per-rental company/insurance fields in Prisma + shared Zod schemas**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-12T17:37:00Z
- **Completed:** 2026-04-12T17:45:00Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- NIP validator with mod-11 checksum and 7 passing tests
- Prisma migration with safe backfill strategy (nullable -> backfill -> NOT NULL) for vehicleClassId
- All shared Zod schemas updated with new fields including NIP validation refine on rental schema
- CustomerDto and all API/web references updated from flat address to structured address fields

## Task Commits

Each task was committed atomically:

1. **Task 1: NIP validator, VatPayerStatus enum, and updated shared Zod schemas** - `c761a71` (feat)
2. **Task 2: Prisma schema changes and migration with backfill** - `d525c22` (feat)

## Files Created/Modified
- `packages/shared/src/lib/nip.ts` - NIP mod-11 checksum validator
- `packages/shared/src/lib/nip.spec.ts` - 7 test cases for NIP validation
- `packages/shared/jest.config.ts` - Jest config for shared package
- `apps/api/prisma/migrations/20260412174041_phase33_foundation/migration.sql` - Hand-edited migration with backfill
- `apps/api/prisma/schema.prisma` - VehicleClass model, VatPayerStatus enum, structured address, rental company fields
- `packages/shared/src/schemas/customer.schemas.ts` - Replaced address with structured fields + postal code regex
- `packages/shared/src/schemas/rental.schemas.ts` - Added company/NIP/VAT/insurance fields with NIP validation
- `packages/shared/src/schemas/vehicle.schemas.ts` - Added vehicleClassId
- `packages/shared/src/types/customer.types.ts` - Structured address fields on CustomerDto
- `packages/shared/src/types/rental.types.ts` - VatPayerStatus enum + company fields on RentalDto
- `packages/shared/src/types/vehicle.types.ts` - VehicleClassDto interface + vehicleClassName on VehicleDto

## Decisions Made
- Used `prisma migrate diff` + manual SQL file + `migrate resolve --applied` instead of `prisma migrate dev` because shadow DB replay fails with db-push migration history
- Constructed backward-compatible address string from structured fields in contracts.service for contract PDF template
- Used `connectOrCreate` for default vehicle class assignment in CSV vehicle import

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed address->structured fields in API service, DTO, and web pages**
- **Found during:** Task 2 (Prisma schema changes)
- **Issue:** Removing Customer.address from Prisma schema broke customers.service.ts, contracts.service.ts, create-customer.dto.ts, and web pages that referenced customer.address
- **Fix:** Updated all references to use structured address fields (street, houseNumber, etc). Contracts service constructs a formatted address string for backward compatibility.
- **Files modified:** apps/api/src/customers/customers.service.ts, apps/api/src/customers/dto/create-customer.dto.ts, apps/api/src/contracts/contracts.service.ts, apps/web/src/app/(admin)/klienci/[id]/page.tsx, apps/web/src/app/(admin)/klienci/[id]/edytuj/page.tsx
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** d525c22

**2. [Rule 3 - Blocking] Added vehicleClassId to CreateVehicleDto and vehicle service**
- **Found during:** Task 2 (Prisma schema changes)
- **Issue:** Adding required vehicleClassId to Vehicle model broke vehicle create operations and test
- **Fix:** Added vehicleClassId to CreateVehicleDto, destructured and used `connect` in service create, added `connectOrCreate` for CSV import, updated spec
- **Files modified:** apps/api/src/vehicles/dto/create-vehicle.dto.ts, apps/api/src/vehicles/vehicles.service.ts, apps/api/src/vehicles/vehicles.service.spec.ts
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** d525c22

**3. [Rule 3 - Blocking] Updated CustomerDto type with structured address fields**
- **Found during:** Task 2 (Prisma schema changes)
- **Issue:** CustomerDto in shared types still had `address: string | null` which didn't match the new schema
- **Fix:** Replaced with street, houseNumber, apartmentNumber, postalCode, city fields
- **Files modified:** packages/shared/src/types/customer.types.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** d525c22

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes were necessary for compilation after schema changes. No scope creep.

## Issues Encountered
- Docker Desktop was not running; had to launch it and wait for PostgreSQL to start before migration could be created/applied
- Shadow database replay failed due to historical use of `db push`; worked around with `migrate diff` + manual migration file + `resolve --applied`

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All schema changes and shared types/schemas ready for API endpoint work (33-02)
- VehicleClass CRUD and customer structured address endpoints can build on this foundation
- Migration backfill ensures existing data is compatible

---
*Phase: 33-foundation-schema-simple-fields*
*Completed: 2026-04-12*
