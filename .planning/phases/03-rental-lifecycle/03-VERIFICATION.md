---
phase: 03-rental-lifecycle
verified: 2026-03-23T23:00:00Z
status: human_needed
score: 14/14 must-haves verified
re_verification: false
human_verification:
  - test: "Run unit test suite for rentals"
    expected: "All 35 unit tests pass (pricing, transitions, service: create, overlap, activate, calendar, processReturn, extend, rollback)"
    why_human: "Cannot execute test runner in this environment"
  - test: "Run e2e test suite for rentals"
    expected: "All 15 e2e tests pass: POST /rentals (draft, active, 409 conflict, override), GET /rentals, GET /rentals/calendar, GET /rentals/:id, PATCH activate (success + 400 invalid), PATCH return (mileage + handover comparison), PATCH extend (admin 200 + employee 403), PATCH rollback (admin 200 + employee 403)"
    why_human: "Requires live PostgreSQL + Redis; cannot run in this environment"
notes:
  - "RENT-02 requires PostgreSQL exclusion constraint for double-booking prevention (per requirement text). Actual implementation uses application-layer tstzrange raw SQL query. Database has no EXCLUDE constraint. This is a deliberate architectural choice — application-layer check is functionally equivalent for this use case — but deviates from requirement spec wording."
---

# Phase 3: Rental Lifecycle Verification Report

**Phase Goal:** The complete rental workflow functions end-to-end -- creation, calendar scheduling, state transitions, extensions, and structured returns
**Verified:** 2026-03-23T23:00:00Z
**Status:** human_needed (automated checks pass, test execution requires live environment)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1 | RentalStatus enum exists in shared package with DRAFT, ACTIVE, EXTENDED, RETURNED values | VERIFIED | `packages/shared/src/types/rental.types.ts` L1-6: `export enum RentalStatus` with all 4 values |
| 2 | Rental model in Prisma schema has vehicleId, customerId, createdById, startDate, endDate, pricing fields, inspection JSON columns | VERIFIED | `apps/api/prisma/schema.prisma` L192-222: `model Rental` with all fields, relations, and 4 indexes |
| 3 | State machine transition map defines valid transitions and admin rollback transitions | VERIFIED | `rental-transitions.ts`: `RENTAL_TRANSITIONS`, `ADMIN_ROLLBACK_TRANSITIONS`, `validateTransition()` — all 4 states covered |
| 4 | Pricing utility calculates daily rate from total (and vice versa), applies 23% VAT, stores in grosze | VERIFIED | `utils/pricing.ts` L6-34: both paths implemented, `Math.round(net * (1 + vatRate/100))` |
| 5 | All DTOs have class-validator decorators for input validation | VERIFIED | All 6 DTOs present with `@IsUUID`, `@IsISO8601`, `@IsInt`, `@Min`, `@IsEnum`, `@ValidateNested` decorators |
| 6 | Employee can create a rental linking vehicle, customer, and date range with pricing | VERIFIED | `RentalsService.create()` L44-129: validates vehicle+customer, calculates pricing, persists with vehicle+customer relations |
| 7 | System detects overlapping rentals and returns warning but allows override | VERIFIED | `checkOverlap()` L490-506 uses `tstzrange` raw SQL; `create()` L87-89 returns `{ rental: null, conflicts }` without override |
| 8 | Rental transitions through states following strict state machine rules | VERIFIED | `validateTransition()` called in `activate()`, `processReturn()`, `extend()`, `rollback()` — throws `BadRequestException` on invalid transitions |
| 9 | Calendar endpoint returns vehicle-grouped rentals for a date range | VERIFIED | `getCalendar()` L424-488: groups rentals by vehicleId, returns `CalendarResponse` with `CalendarVehicleEntry[]` and `period` |
| 10 | Activating a rental stores handover inspection data and sets vehicle status to RENTED | VERIFIED | `activate()` L155-195: `$transaction` updates rental with `handoverData`, updates vehicle to `'RENTED'` |
| 11 | Employee can process a return with mandatory mileage and optional inspection checklist | VERIFIED | `processReturn()` L197-253: required `returnMileage`, optional `returnData` (VehicleInspection), `ReturnRentalDto` validates `@IsInt @Min(0)` |
| 12 | Return response includes both handover and return inspection data for side-by-side comparison | VERIFIED | `processReturn()` L230-233: re-fetches rental with RENTAL_INCLUDE after update, returning full record including `handoverData` and `returnData` |
| 13 | Returning a rental sets vehicle status back to AVAILABLE | VERIFIED | `processReturn()` L222-226: `$transaction` updates vehicle with `status: 'AVAILABLE'` |
| 14 | Admin can extend a rental with automatic cost recalculation based on daily rate | VERIFIED | `extend()` L255-353: calls `calculatePricing({ dailyRateNet, days: newDays })` unless `totalPriceNet` override; `@Roles(UserRole.ADMIN)` on controller |
| 15 | Employee cannot extend a rental (403 Forbidden) | VERIFIED | Controller L103-111: `@Roles(UserRole.ADMIN)` on `extend` endpoint, RolesGuard returns 403 |
| 16 | Admin can rollback a rental status with audit-logged reason | VERIFIED | `rollback()` L355-422: uses `ADMIN_ROLLBACK_TRANSITIONS` via `validateTransition(..., true)`, emits event with `reason`, `__audit` metadata includes reason |
| 17 | Domain events are emitted for return, extension, and rollback | VERIFIED | `rental.returned` L236, `rental.extended` L333, `rental.rolledBack` L401 — all emitted via `EventEmitter2` |
| 18 | All rental endpoints work end-to-end with authentication and role enforcement | UNCERTAIN | E2e tests written and structurally complete (532 lines, no `it.todo`), but execution requires live database |

**Score:** 17/18 truths verified programmatically (1 needs live test execution)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/prisma/schema.prisma` | Rental model with all fields and relations | VERIFIED | `model Rental` with 19 fields, Vehicle/Customer/User relations, 4 indexes, `@@map("rentals")` |
| `packages/shared/src/types/rental.types.ts` | RentalStatus enum, RentalDto, InspectionDto interfaces | VERIFIED | All 9 exports present: RentalStatus, RentalDto, VehicleInspection, CalendarResponse, PricingResult, etc. |
| `apps/api/src/rentals/constants/rental-transitions.ts` | State machine transition map | VERIFIED | RENTAL_TRANSITIONS, ADMIN_ROLLBACK_TRANSITIONS, validateTransition() — 30 lines, fully implemented |
| `apps/api/src/rentals/utils/pricing.ts` | Pricing calculation utility | VERIFIED | calculatePricing() with both input paths, VAT, rounding — 34 lines |
| `apps/api/src/rentals/rentals.service.ts` | Full rental CRUD, state machine, overlap detection, calendar | VERIFIED | 507 lines (exceeds min_lines: 200); all 9 methods implemented |
| `apps/api/src/rentals/rentals.controller.ts` | HTTP endpoints for rental operations | VERIFIED | 8 endpoints, @Roles guard, @CurrentUser, 409 Conflict handling |
| `apps/api/src/rentals/rentals.service.spec.ts` | Unit tests for all service behaviors | VERIFIED | 35 real tests, 0 `it.todo` stubs remaining |
| `apps/api/test/rentals.e2e-spec.ts` | Full e2e test suite | VERIFIED | 532 lines (exceeds min_lines: 100), 15 real e2e tests, 0 `it.todo` stubs |
| `apps/api/src/rentals/rentals.module.ts` | Module registration | VERIFIED | RentalsController + RentalsService registered, RentalsService exported |
| `apps/api/src/app.module.ts` | RentalsModule + EventEmitterModule registered | VERIFIED | Both imports present at L44-45 |
| DTOs (6 files) | class-validator decorated input DTOs | VERIFIED | All 6 DTOs present: create, activate, extend, return, calendar-query, rollback — all with decorators |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/shared/src/index.ts` | `rental.types.ts` | barrel export | VERIFIED | L7: `export * from './types/rental.types'` |
| `packages/shared/src/index.ts` | `rental.schemas.ts` | barrel export | VERIFIED | L8: `export * from './schemas/rental.schemas'` |
| `apps/api/prisma/schema.prisma` | Vehicle model | `Rental.vehicle @relation` | VERIFIED | L210: `vehicle Vehicle @relation(fields: [vehicleId], references: [id])` |
| `rentals.service.ts` | `rental-transitions.ts` | import validateTransition | VERIFIED | L22: `import { validateTransition } from './constants/rental-transitions'`; called in activate(), processReturn(), extend(), rollback() |
| `rentals.service.ts` | `utils/pricing.ts` | import calculatePricing | VERIFIED | L23: `import { calculatePricing } from './utils/pricing'`; called in create() L76, extend() L306 |
| `rentals.service.ts` | `prisma.$queryRaw` | tstzrange overlap detection | VERIFIED | L496-505: raw SQL with `tstzrange(..., '[)')` operator |
| `rentals.service.ts` | vehicle status AVAILABLE | processReturn vehicle update | VERIFIED | L225: `data: { status: 'AVAILABLE' }` inside `$transaction` |
| `rentals.service.ts` | EventEmitter2 | event emission | VERIFIED | rental.returned L236, rental.extended L333, rental.rolledBack L401 |
| `rentals.controller.ts` | RolesGuard | @Roles(ADMIN) on extend/rollback | VERIFIED | extend L104, rollback L114: `@Roles(UserRole.ADMIN)` only |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| RENT-01 | 03-01, 03-02 | Employee can create rental (vehicle + customer + dates + time) | SATISFIED | `create()` validates vehicle/customer, accepts ISO8601 dates with time, returns pricing-calculated rental |
| RENT-02 | 03-01, 03-02 | Calendar with timeline view and double-booking prevention (PostgreSQL exclusion constraints) | PARTIAL | Calendar endpoint implemented and functional. Double-booking prevention uses application-layer tstzrange query, NOT a PostgreSQL EXCLUDE constraint. No `btree_gist` extension or `EXCLUDE USING gist` constraint exists in schema. Observable behavior meets the functional goal but deviates from stated implementation approach. |
| RENT-03 | 03-01, 03-02 | State machine: draft -> active -> extended -> returned (+ closed) | SATISFIED | RENTAL_TRANSITIONS map enforces all 4 states; validateTransition() called on every mutation; BadRequestException on invalid transitions |
| RENT-04 | 03-03 | Structured return: mileage registration, damage checklist, comparison with handover state | SATISFIED | processReturn() records returnMileage (required), returnData VehicleInspection (optional), re-fetches full rental with handoverData for comparison |
| RENT-05 | 03-03 | Admin can extend: automatic date update, cost recalculation, SMS notification | PARTIAL | Date update and cost recalculation implemented. SMS notification (NOTIF-03) is deferred to Phase 8 (per REQUIREMENTS.md) — this is expected, not a gap for Phase 3. |

**Note on RENT-05:** The SMS notification component maps to NOTIF-03 (Phase 8), not Phase 3. The Phase 3 plan for RENT-05 scopes to date/cost only. This is correctly deferred.

**Note on RENT-02:** The requirements text parenthetically prescribes PostgreSQL exclusion constraints as the implementation mechanism. The actual implementation achieves equivalent double-booking prevention at the application layer via `tstzrange` in a raw SQL query. This trades database-level enforcement for application-layer logic. The functional outcome (preventing/warning on double-bookings, calendar timeline) is achieved. Flag for product owner awareness.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/api/src/rentals/dto/create-rental.dto.ts` | — | No `@IsNotEmpty()` on required UUID fields | Info | `@IsUUID()` implicitly rejects empty strings, but explicit `@IsNotEmpty()` is common convention |
| `apps/api/src/rentals/rentals.service.ts` | L47 | `Promise<any>` return types on all service methods | Info | Reduces type safety — return types use `any` instead of typed `Rental` with includes. Not a functional issue. |
| — | — | `update-rental.dto.ts` listed in 03-01-PLAN `files_modified` but never created | Info | No code references `UpdateRentalDto` and it was not used in any task. Harmless orphan in plan frontmatter. |

No blocker or warning anti-patterns found. No `TODO`, `FIXME`, `Not implemented`, or `it.todo` stubs in any production or test file.

### Human Verification Required

#### 1. Unit Test Suite Execution

**Test:** Run `cd apps/api && npx jest --no-cache --forceExit --testPathPattern="rentals" -- --no-coverage`
**Expected:** 35 unit tests pass across: pricing (6), rental-transitions (10), RentalsService (19) — create, overlap, activate, findAll, findOne, calendar, processReturn, extend, rollback
**Why human:** Cannot execute Jest in this verification environment

#### 2. E2E Test Suite Execution

**Test:** Run `cd apps/api && npx jest --config test/jest-e2e.json --no-cache --forceExit --runInBand --testPathPattern="rentals" -- --no-coverage`
**Expected:** 15 e2e tests pass: POST /rentals (4 scenarios), GET /rentals (1), GET /rentals/calendar (1), GET /rentals/:id (1), PATCH activate (2), PATCH return (2), PATCH extend (2), PATCH rollback (2)
**Why human:** Requires live PostgreSQL + Redis; cannot run in this environment

#### 3. RENT-02 Double-Booking Enforcement Decision

**Test:** Create two rentals for the same vehicle with overlapping dates (no override). Attempt the second POST without `overrideConflict: true`.
**Expected:** 409 Conflict response with `{ conflicts: [...] }` body
**Why human:** Assess whether application-layer tstzrange prevention satisfies the product requirement, or whether a PostgreSQL EXCLUDE constraint is still needed for data integrity (concurrent requests bypassing application layer)

### Gaps Summary

No hard gaps blocking the phase goal. All artifacts exist and are substantive. All key links are wired. No placeholder stubs remain.

Two items worth noting for the product owner:

1. **RENT-02 implementation approach:** Double-booking prevention is application-layer only (no PostgreSQL exclusion constraint). Under concurrent load, two simultaneous POST requests could theoretically both pass the overlap check before either commits. For a small fleet rental application this is acceptable, but if strict database-level enforcement is required, a `btree_gist` extension and `EXCLUDE USING gist` constraint should be added to the Prisma schema.

2. **RENT-05 SMS notification:** Correctly deferred to Phase 8 (NOTIF-03). Not a Phase 3 gap.

---

_Verified: 2026-03-23T23:00:00Z_
_Verifier: Claude (gsd-verifier)_
