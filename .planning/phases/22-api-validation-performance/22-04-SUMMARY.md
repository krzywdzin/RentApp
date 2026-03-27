---
phase: 22-api-validation-performance
plan: 04
subsystem: api
tags: [nestjs-logger, redis, timezone, vat, prisma, security-logging]

requires:
  - phase: 22-api-validation-performance
    provides: "API validation and performance foundation"
provides:
  - "Structured NestJS Logger in AuditInterceptor and AuthService"
  - "Redis error handler on AuthService client"
  - "Security event logging (failed login, lockout, token reuse)"
  - "Safe $queryRaw tagged template on health endpoint"
  - "Timezone-aware Warsaw date range calculation"
  - "Dynamic VAT rate from rental in annex PDF"
affects: [23-mobile-ux-polish, 24-web-admin-reporting]

tech-stack:
  added: []
  patterns: [nestjs-logger-per-service, timezone-aware-date-ranges, dynamic-vat-from-entity]

key-files:
  created: []
  modified:
    - apps/api/src/audit/audit.interceptor.ts
    - apps/api/src/auth/auth.service.ts
    - apps/api/src/health/health.controller.ts
    - apps/api/src/notifications/cron/alert-scanner.service.ts
    - apps/api/src/contracts/contracts.service.ts

key-decisions:
  - "Used Intl.DateTimeFormat shortOffset for dynamic CET/CEST offset instead of adding date-fns-tz dependency"
  - "frozenData.rental.vatRate used directly for annex VAT (already available in contract frozen data)"

patterns-established:
  - "NestJS Logger per service: private readonly logger = new Logger(ClassName.name)"
  - "Redis error handler: this.redis.on('error', ...) immediately after client creation"
  - "Timezone-aware date ranges: use Intl API to get dynamic UTC offset for Europe/Warsaw"

requirements-completed: [APERF-04, APERF-05, APERF-06, APERF-07, APERF-08, APERF-09]

duration: 3min
completed: 2026-03-27
---

# Phase 22 Plan 04: Logging, Safety & Correctness Fixes Summary

**NestJS Logger in AuditInterceptor/AuthService, safe $queryRaw on health, timezone-aware Warsaw dates, and dynamic VAT rate in annex PDF**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T22:40:41Z
- **Completed:** 2026-03-27T22:43:43Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Replaced all console.error calls in AuditInterceptor with structured NestJS Logger
- Added security event logging to AuthService (failed login, lockout, token reuse) and Redis error handler
- Fixed health endpoint to use safe $queryRaw tagged template instead of $queryRawUnsafe
- Fixed getWarsawDateRange to use timezone-aware UTC offset calculation (handles CET/CEST)
- Replaced hardcoded 1.23 VAT multiplier with dynamic frozenData.rental.vatRate in annex creation

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace console.error with NestJS Logger and add security logging** - `20e70a0` (fix)
2. **Task 2: Fix health query, timezone calculation, and annex VAT rate** - `89d8602` (fix)

## Files Created/Modified
- `apps/api/src/audit/audit.interceptor.ts` - NestJS Logger replaces console.error
- `apps/api/src/auth/auth.service.ts` - Logger + Redis error handler + security event logging
- `apps/api/src/health/health.controller.ts` - $queryRaw tagged template
- `apps/api/src/notifications/cron/alert-scanner.service.ts` - Timezone-aware Warsaw date range
- `apps/api/src/contracts/contracts.service.ts` - Dynamic VAT from rental.vatRate

## Decisions Made
- Used Intl.DateTimeFormat with shortOffset to dynamically resolve CET/CEST offset instead of adding date-fns-tz as a new dependency
- Used frozenData.rental.vatRate directly since it was already available in the contract frozen data snapshot

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Contracts.service.ts change was committed by a parallel executor (22-03) due to concurrent execution; the fix is correctly in the codebase
- Pre-existing TypeScript error in rentals.service.spec.ts (unrelated to this plan)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 6 logging/safety/correctness issues resolved
- Structured logging ready for production log aggregation
- All 39 related tests pass

---
*Phase: 22-api-validation-performance*
*Completed: 2026-03-27*
