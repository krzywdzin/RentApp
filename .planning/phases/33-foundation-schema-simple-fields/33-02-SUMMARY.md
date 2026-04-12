---
phase: 33-foundation-schema-simple-fields
plan: 02
subsystem: api
tags: [nestjs, class-validator, prisma, nip, vehicle-classes, dto]

# Dependency graph
requires:
  - phase: 33-foundation-schema-simple-fields/01
    provides: Prisma schema with VehicleClass model, structured address fields, rental company/NIP/insurance columns
provides:
  - VehicleClasses NestJS module (full CRUD with delete guard)
  - NIP class-validator decorator (@IsValidNip)
  - Updated Vehicle/Rental/Customer DTOs for new schema fields
  - Insurance filtering on rental list endpoint
affects: [33-03 (web/mobile forms), 34 (contracts/PDF), 35 (vehicle class selector UI)]

# Tech tracking
tech-stack:
  added: []
  patterns: [mod-11 NIP validation via shared lib + class-validator decorator, vehicle class include in all vehicle queries]

key-files:
  created:
    - apps/api/src/common/validators/nip.validator.ts
    - apps/api/src/common/validators/nip.validator.spec.ts
    - apps/api/src/vehicle-classes/vehicle-classes.module.ts
    - apps/api/src/vehicle-classes/vehicle-classes.controller.ts
    - apps/api/src/vehicle-classes/vehicle-classes.service.ts
    - apps/api/src/vehicle-classes/vehicle-classes.service.spec.ts
    - apps/api/src/vehicle-classes/dto/create-vehicle-class.dto.ts
    - apps/api/src/vehicle-classes/dto/update-vehicle-class.dto.ts
  modified:
    - apps/api/src/app.module.ts
    - apps/api/src/vehicles/dto/create-vehicle.dto.ts
    - apps/api/src/vehicles/vehicles.service.ts
    - apps/api/src/rentals/dto/create-rental.dto.ts
    - apps/api/src/rentals/dto/rentals-query.dto.ts
    - apps/api/src/rentals/rentals.service.ts
    - apps/api/src/customers/dto/create-customer.dto.ts

key-decisions:
  - "NIP validator wraps shared isValidNip via class-validator decorator pattern (same as PESEL)"
  - "VehicleClass included in all vehicle queries via VEHICLE_INCLUDE constant"
  - "Rental insurance filtering via hasInsurance boolean and insuranceSearch string query params"

patterns-established:
  - "Class-validator decorator wrapping shared validation: import from @rentapp/shared, wrap in ValidatorConstraint"
  - "Delete guard pattern: count related entities before delete, throw ConflictException if > 0"

requirements-completed: [KLIENT-01, KLIENT-02, KLIENT-03, KLIENT-04, FLOTA-01, FLOTA-02, FLOTA-03, NAJEM-01]

# Metrics
duration: 4min
completed: 2026-04-12
---

# Phase 33 Plan 02: API DTOs & Services Summary

**VehicleClasses CRUD module with delete guard, NIP class-validator decorator, and updated DTOs for company rental/insurance/structured address fields**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-12T17:47:14Z
- **Completed:** 2026-04-12T17:51:20Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- VehicleClasses NestJS module with full CRUD endpoints (GET list, POST create, PATCH update, DELETE with vehicle-count guard)
- NIP class-validator decorator reusing shared isValidNip (mod-11 checksum)
- Rental DTO accepts isCompanyRental, companyNip, vatPayerStatus, insuranceCaseNumber with conditional validation
- Customer DTO has structured address with @MaxLength and @Matches postal code validation
- Vehicle responses now include vehicleClass relation
- Rental list supports insurance filtering (hasInsurance, insuranceSearch query params)

## Task Commits

Each task was committed atomically:

1. **Task 1: VehicleClasses API module + NIP validator (TDD)**
   - `68c9044` (test: failing tests for NIP validator and VehicleClasses service)
   - `b2f1190` (feat: VehicleClasses CRUD module and NIP validator)
2. **Task 2: Update Vehicle, Rental, Customer DTOs and services** - `a0ec4b5` (feat)

## Files Created/Modified
- `apps/api/src/common/validators/nip.validator.ts` - NIP class-validator decorator wrapping shared isValidNip
- `apps/api/src/common/validators/nip.validator.spec.ts` - Unit tests for NIP validator constraint
- `apps/api/src/vehicle-classes/vehicle-classes.module.ts` - NestJS module registration
- `apps/api/src/vehicle-classes/vehicle-classes.controller.ts` - REST endpoints with admin-only guards
- `apps/api/src/vehicle-classes/vehicle-classes.service.ts` - CRUD with P2002/P2025 handling and delete guard
- `apps/api/src/vehicle-classes/vehicle-classes.service.spec.ts` - Unit tests for service (findAll, create, update, remove)
- `apps/api/src/vehicle-classes/dto/create-vehicle-class.dto.ts` - Create DTO with name validation
- `apps/api/src/vehicle-classes/dto/update-vehicle-class.dto.ts` - Update DTO with name validation
- `apps/api/src/app.module.ts` - Added VehicleClassesModule import
- `apps/api/src/vehicles/dto/create-vehicle.dto.ts` - Added @IsUUID on vehicleClassId
- `apps/api/src/vehicles/vehicles.service.ts` - Added vehicleClass to VEHICLE_INCLUDE
- `apps/api/src/rentals/dto/create-rental.dto.ts` - Added company/NIP/VAT/insurance fields
- `apps/api/src/rentals/dto/rentals-query.dto.ts` - Added hasInsurance and insuranceSearch params
- `apps/api/src/rentals/rentals.service.ts` - Passes new fields to Prisma, insurance filtering, vehicleClass in rental includes
- `apps/api/src/customers/dto/create-customer.dto.ts` - Added @MaxLength, @Matches for postal code

## Decisions Made
- NIP validator wraps shared `isValidNip` via class-validator decorator pattern (same as PESEL) -- avoids duplication
- VehicleClass included in all vehicle queries via VEHICLE_INCLUDE constant -- consistent response shape
- Rental insurance filtering uses `hasInsurance` boolean and `insuranceSearch` string query params -- simple REST convention

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vehicleClassId already had @IsString instead of @IsUUID**
- **Found during:** Task 2 (reading create-vehicle.dto.ts)
- **Issue:** 33-01 added vehicleClassId with @IsString but plan specifies @IsUUID for proper UUID validation
- **Fix:** Replaced @IsString with @IsUUID decorator
- **Files modified:** apps/api/src/vehicles/dto/create-vehicle.dto.ts
- **Committed in:** a0ec4b5

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor decorator correction. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- API layer complete for all Phase 33 fields
- VehicleClasses endpoints ready for web/mobile consumption (33-03)
- NIP validation available for rental forms
- Insurance filtering available for rental list views

---
*Phase: 33-foundation-schema-simple-fields*
*Completed: 2026-04-12*
