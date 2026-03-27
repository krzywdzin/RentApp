---
phase: 22-api-validation-performance
verified: 2026-03-27T23:00:00Z
status: passed
score: 17/17 must-haves verified
re_verification: false
---

# Phase 22: API Validation & Performance Verification Report

**Phase Goal:** All API endpoints validate inputs strictly, paginate large result sets, use efficient queries, and log structured events -- no unvalidated UUIDs, no unbounded queries, no N+1 loops
**Verified:** 2026-03-27T23:00:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CalendarQueryDto rejects from > to and ranges exceeding 6 months | VERIFIED | `CalendarRangeValidator` in `calendar-query.dto.ts` checks `fromDate >= toDate` and `diffDays > 184`; `@Validate(CalendarRangeValidator)` on `to` field |
| 2 | CreateRentalDto rejects startDate >= endDate | VERIFIED | `@Validate(DateAfterValidator, ['startDate'])` on `endDate` in `create-rental.dto.ts`; `DateAfterValidator` implements `thisDate > relatedDate` |
| 3 | CreateVehicleDto make and model have @MaxLength(100) | VERIFIED | Both `make` and `model` fields carry `@MaxLength(100)` in `create-vehicle.dto.ts` |
| 4 | UploadPhotoDto position has @MaxLength(50) | VERIFIED | `position` field carries `@MaxLength(50)` in `upload-photo.dto.ts` |
| 5 | NotificationQueryDto.isRead only accepts 'true' or 'false' | VERIFIED | `@IsIn(['true', 'false'])` on `isRead` in `notification-query.dto.ts` |
| 6 | markAllAsRead route is before :id/read in the controller | VERIFIED | `@Patch('in-app/read-all')` at line 30; `@Patch('in-app/:id/read')` at line 36 -- static route first |
| 7 | GET /rentals returns paginated { data, total, page, limit } | VERIFIED | `RentalsQueryDto` DTO exists with page/limit; `rentals.service.ts` `findAll` uses `take/skip` and `Promise.all` returning `{ data, total, page, limit }`; controller uses `@Query() query: RentalsQueryDto` |
| 8 | GET /customers returns paginated { data, total, page, limit } | VERIFIED | `CustomersQueryDto` DTO exists; `customers.service.ts` uses `take/skip` and returns `{ data, total, page, limit }`; controller wired |
| 9 | GET /contracts returns paginated { data, total, page, limit } | VERIFIED | `ContractsQueryDto` DTO exists; `contracts.service.ts` uses `take/skip` and returns `{ data, total, page, limit }`; controller wired |
| 10 | Non-UUID string on portal rental, users PATCH, users reset-password returns 400 | VERIFIED | `ParseUUIDPipe` present in `portal.controller.ts` line 31 and `users.controller.ts` lines 36 and 44 |
| 11 | importFleet pre-fetches all registrations in one query before the loop | VERIFIED | `vehicles.service.ts` line 253: `findMany` with `registration: { in: registrations }`; `existingRegistrations.has(registration)` inside loop; no `findUnique` on registration in loop |
| 12 | getComparison generates all presigned URLs in parallel via Promise.all | VERIFIED | `photos.service.ts`: `Promise.all` used at line 190 across all positions and line 216 within each position -- parallel, not sequential |
| 13 | enqueueExpiryAlert uses parallelized notification creation | VERIFIED | `notifications.service.ts` lines 304-306: outer `Promise.all` over admins, inner `Promise.all` for notification + inAppNotification per admin; no sequential loop |
| 14 | AuditInterceptor uses NestJS Logger instead of console.error | VERIFIED | `audit.interceptor.ts`: `private readonly logger = new Logger(AuditInterceptor.name)`; both catch blocks use `this.logger.error`; zero `console.error` calls |
| 15 | AuthService logs failed login attempts, lockout events, and token reuse | VERIFIED | `auth.service.ts`: `logger.warn` on failed attempt (line 61), lockout trigger (line 67), token reuse (line 107), lockout rejection (line 33); `logger.log` on successful login (line 52) |
| 16 | AuthService Redis client has an error event handler | VERIFIED | `auth.service.ts` lines 25-27: `this.redis.on('error', (err) => this.logger.error('Redis connection error', err.stack))` immediately after client creation |
| 17 | Health endpoint uses $queryRaw tagged template instead of $queryRawUnsafe | VERIFIED | `health.controller.ts` line 33: `this.prisma.$queryRaw\`SELECT 1\``; `$queryRawUnsafe` not found in file |
| 18 | getWarsawDateRange uses timezone-aware date calculation | VERIFIED | `alert-scanner.service.ts`: `TIMEZONE = 'Europe/Warsaw'`; uses `toLocaleDateString` with `timeZone` option and `Intl.DateTimeFormat` with `shortOffset` for dynamic CET/CEST offset; `setHours(0` not found |
| 19 | Annex PDF uses rental.vatRate instead of hardcoded 1.23 | VERIFIED | `contracts.service.ts` line 573: `Math.round(data.newTotalPriceNet * (1 + frozenData.rental.vatRate / 100))`; `* 1.23` not found in file |

**Score:** 17/17 truths verified (plan-01 covers 6, plan-02 covers 4, plan-03 covers 3, plan-04 covers 6)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/common/validators/date-after.validator.ts` | Reusable cross-field date validator | VERIFIED | `DateAfterValidator` with `ValidatorConstraintInterface`; exported and imported by `create-rental.dto.ts` |
| `apps/api/src/rentals/dto/calendar-query.dto.ts` | CalendarRangeValidator cross-field check | VERIFIED | `CalendarRangeValidator` with 184-day threshold; `@Validate(CalendarRangeValidator)` on `to` |
| `apps/api/src/rentals/dto/create-rental.dto.ts` | DateAfterValidator on endDate | VERIFIED | `@Validate(DateAfterValidator, ['startDate'])` on `endDate`; import present |
| `apps/api/src/vehicles/dto/create-vehicle.dto.ts` | @MaxLength(100) on make/model | VERIFIED | Both fields have `@MaxLength(100)` |
| `apps/api/src/photos/dto/upload-photo.dto.ts` | @MaxLength(50) on position | VERIFIED | `position` has `@MaxLength(50)` |
| `apps/api/src/notifications/dto/notification-query.dto.ts` | @IsIn on isRead | VERIFIED | `@IsIn(['true', 'false'])` on `isRead` |
| `apps/api/src/notifications/notifications.controller.ts` | Static route before parameterized | VERIFIED | `read-all` at line 30, `:id/read` at line 36 |
| `apps/api/src/rentals/dto/rentals-query.dto.ts` | Pagination + filter DTO | VERIFIED | `page`, `limit`, `status`, `customerId`, `vehicleId` with proper decorators |
| `apps/api/src/customers/dto/customers-query.dto.ts` | Pagination DTO | VERIFIED | `page`, `limit`, `includeArchived` with proper decorators |
| `apps/api/src/contracts/dto/contracts-query.dto.ts` | Pagination DTO | VERIFIED | `page`, `limit` with proper decorators |
| `apps/api/src/rentals/rentals.service.ts` | Paginated findAll | VERIFIED | Returns `{ data, total, page, limit }` using `take/skip` |
| `apps/api/src/customers/customers.service.ts` | Paginated findAll | VERIFIED | Returns `{ data, total, page, limit }` using `take/skip` |
| `apps/api/src/contracts/contracts.service.ts` | Paginated findAll + dynamic VAT | VERIFIED | Returns `{ data, total, page, limit }`; uses `frozenData.rental.vatRate` |
| `apps/api/src/portal/portal.controller.ts` | ParseUUIDPipe on :id | VERIFIED | `@Param('id', ParseUUIDPipe)` on `getRentalDetail` |
| `apps/api/src/users/users.controller.ts` | ParseUUIDPipe on both :id params | VERIFIED | `ParseUUIDPipe` on `update` (line 36) and `resetPassword` (line 44) |
| `apps/api/src/vehicles/vehicles.service.ts` | Bulk pre-fetch in importFleet | VERIFIED | `findMany` with `in` clause before loop; `Set` for O(1) lookups; no `findUnique` on registration in loop |
| `apps/api/src/photos/photos.service.ts` | Promise.all in getComparison | VERIFIED | Two nested `Promise.all` calls for full parallelism |
| `apps/api/src/notifications/notifications.service.ts` | Parallel enqueueExpiryAlert | VERIFIED | `Promise.all` over admins with inner `Promise.all` per admin |
| `apps/api/src/audit/audit.interceptor.ts` | NestJS Logger | VERIFIED | `new Logger(AuditInterceptor.name)`; no `console.*` calls |
| `apps/api/src/auth/auth.service.ts` | Logger + Redis error handler + security events | VERIFIED | All four security events logged; Redis `.on('error', ...)` present |
| `apps/api/src/health/health.controller.ts` | $queryRaw tagged template | VERIFIED | Tagged template `\`SELECT 1\`` on line 33 |
| `apps/api/src/notifications/cron/alert-scanner.service.ts` | Timezone-aware Warsaw dates | VERIFIED | `TIMEZONE = 'Europe/Warsaw'`; `Intl.DateTimeFormat` with `shortOffset` for dynamic offset |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `calendar-query.dto.ts` | `rentals.controller.ts` | NestJS validation pipe / `CalendarQueryDto` | VERIFIED | `CalendarQueryDto` imported and used as `@Query()` param type in rentals controller |
| `rentals.controller.ts` | `rentals.service.ts` | `findAll` accepts pagination params | VERIFIED | Controller passes `query: RentalsQueryDto` to service `findAll(query)` |
| `portal.controller.ts` | `@nestjs/common` | `ParseUUIDPipe` on :id param | VERIFIED | `ParseUUIDPipe` imported and used inline on `@Param('id', ParseUUIDPipe)` |
| `vehicles.service.ts` | `prisma.vehicle.findMany` | Bulk pre-fetch before import loop | VERIFIED | `findMany({ where: { registration: { in: registrations } } })` before loop; `existingRegistrations.has(registration)` replaces per-row `findUnique` |
| `auth.service.ts` | `ioredis` | error event handler on Redis client | VERIFIED | `this.redis.on('error', (err) => this.logger.error(...))` at service construction |
| `contracts.service.ts` | `rental.vatRate` | dynamic VAT calculation in createAnnex | VERIFIED | `frozenData.rental.vatRate / 100` used in gross price calculation; `* 1.23` absent |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AVAL-01 | plan-02 | Pagination on GET /rentals, /customers, /contracts | SATISFIED | Three new query DTOs; three services updated with take/skip; paginated response shape confirmed |
| AVAL-02 | plan-02 | ParseUUIDPipe on portal rental, users PATCH, users reset-password | SATISFIED | `ParseUUIDPipe` in `portal.controller.ts` and twice in `users.controller.ts` |
| AVAL-03 | plan-01 | CalendarQueryDto from < to + max 6 months | SATISFIED | `CalendarRangeValidator` with `fromDate >= toDate` check and `diffDays > MAX_RANGE_DAYS (184)` check |
| AVAL-04 | plan-01 | CreateRentalDto startDate < endDate | SATISFIED | `DateAfterValidator` applied to `endDate` with `['startDate']` constraint reference |
| AVAL-05 | plan-01 | CreateVehicleDto @MaxLength on make/model | SATISFIED | `@MaxLength(100)` on both fields |
| AVAL-06 | plan-01 | UploadPhotoDto.position @MaxLength(50) | SATISFIED | `@MaxLength(50)` present |
| AVAL-07 | plan-01 | NotificationQueryDto.isRead as 'true' or 'false' | SATISFIED | `@IsIn(['true', 'false'])` present |
| AVAL-08 | plan-01 | Notification route order: static before parameterized | SATISFIED | `read-all` (line 30) precedes `:id/read` (line 36) |
| APERF-01 | plan-03 | importFleet bulk pre-fetch, no N+1 | SATISFIED | `findMany` with `in` clause before loop; `Set.has()` inside loop; no `findUnique` on registration in loop |
| APERF-02 | plan-03 | getComparison parallel presigned URLs | SATISFIED | `Promise.all` across positions and within each position |
| APERF-03 | plan-03 | enqueueExpiryAlert batch/parallel notifications | SATISFIED | `Promise.all` over admins with nested `Promise.all` per admin |
| APERF-04 | plan-04 | AuditInterceptor NestJS Logger | SATISFIED | `new Logger(AuditInterceptor.name)`; both `.catch` blocks use `this.logger.error` |
| APERF-05 | plan-04 | AuthService security event logging | SATISFIED | Four distinct security events logged with `logger.warn` and `logger.log` |
| APERF-06 | plan-04 | AuthService Redis error handler | SATISFIED | `.on('error', ...)` present at construction time |
| APERF-07 | plan-04 | Health endpoint $queryRaw tagged template | SATISFIED | Tagged template literal used; `$queryRawUnsafe` absent |
| APERF-08 | plan-04 | Timezone-aware Warsaw date range | SATISFIED | `TIMEZONE = 'Europe/Warsaw'`; `Intl.DateTimeFormat` with `shortOffset`; `setHours(0` absent |
| APERF-09 | plan-04 | Annex PDF dynamic vatRate | SATISFIED | `frozenData.rental.vatRate / 100` used; `* 1.23` absent |

### Anti-Patterns Found

No blockers or significant anti-patterns detected.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `notifications.service.ts` | 319 | `inAppNotification.create` inside `Promise.all` per admin (not `createMany`) | Info | Parallelized but not true batch insert -- acceptable given that inApp records need per-admin data and there is typically a small number of admins |

### Human Verification Required

#### 1. CalendarQueryDto rejection behavior at runtime

**Test:** Send `GET /rentals/calendar?from=2025-06-01&to=2025-01-01` (reversed dates) and `from=2025-01-01&to=2025-12-31` (>6 months) through the actual running API.
**Expected:** Both requests return HTTP 400 with validation error message.
**Why human:** The custom `@ValidatorConstraint` + `@Validate` pattern is non-standard; NestJS ValidationPipe must have `transform: true` configured globally for the class-level constraint to trigger.

#### 2. ParseUUIDPipe 400 response

**Test:** Send `GET /portal/rentals/not-a-uuid`, `PATCH /users/not-a-uuid`, and `POST /users/not-a-uuid/reset-password` with a valid auth token.
**Expected:** All return 400, not 500 or a Prisma error.
**Why human:** Need to confirm the global ValidationPipe and guard order allow ParseUUIDPipe to execute before the JWT guard short-circuits, depending on guard order.

#### 3. Timezone boundary correctness across DST transitions

**Test:** In a staging environment, trigger `getWarsawDateRange(0)` at 23:30 UTC in October (when Warsaw is CEST, UTC+2) and verify the returned `startOfTarget` / `endOfTarget` are correct UTC boundaries for the Warsaw calendar date.
**Expected:** Boundaries reflect Warsaw midnight, not UTC midnight.
**Why human:** The `Intl.DateTimeFormat` offset calculation is correct in code but needs empirical confirmation for the CET/CEST switchover edge cases, which cannot be simulated in a static grep analysis.

### Gaps Summary

No gaps. All 17 must-have truths are verified against the actual codebase with substantive, wired implementations:

- All six DTO validation constraints (AVAL-03 through AVAL-08) are real implementations with proper validators, not stubs.
- Pagination is wired end-to-end: DTO exists, service uses take/skip, controller passes the DTO to the service, and the paginated shape is returned.
- ParseUUIDPipe is applied at the correct parameter binding point in both affected controllers.
- The N+1 fix in `importFleet` removes the per-row `findUnique` entirely and replaces it with a pre-fetched `Set` -- the old pattern is gone.
- Promise.all parallelism in `getComparison` and `enqueueExpiryAlert` is substantive, not superficial.
- All console.error calls in AuditInterceptor are replaced; Logger is used at the class level.
- AuthService Redis error handler is placed immediately after client construction as intended.
- Health endpoint uses the tagged template literal form, not `$queryRawUnsafe`.
- Warsaw timezone fix uses the `Intl` API for dynamic CET/CEST offset, not a hardcoded value.
- Annex VAT rate reads from `frozenData.rental.vatRate` -- the hardcoded `1.23` multiplier is absent.

---

_Verified: 2026-03-27T23:00:00Z_
_Verifier: Claude (gsd-verifier)_
