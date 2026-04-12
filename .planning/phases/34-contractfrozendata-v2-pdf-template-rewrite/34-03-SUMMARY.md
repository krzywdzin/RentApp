---
phase: 34-contractfrozendata-v2-pdf-template-rewrite
plan: 03
subsystem: api
tags: [nestjs, prisma, cepik, rental-drivers, portal, privacy]

requires:
  - phase: 34-01
    provides: "RentalDriver model, CepikVerification.driverId, Rental.rentalTerms/termsNotes fields"
provides:
  - "REST endpoints for second driver CRUD (POST/GET/DELETE /rentals/:id/driver)"
  - "CEPiK driver verification endpoint (POST /cepik/verify-driver)"
  - "PATCH /rentals/:id/terms for setting rentalTerms and termsNotes"
  - "Portal API privacy: VIN and year excluded from customer responses"
affects: [34-04, 34-05, 35-portal]

tech-stack:
  added: []
  patterns: ["Nested resource controller pattern (rentals/:id/driver)", "Prisma select for privacy filtering in portal"]

key-files:
  created:
    - apps/api/src/rental-drivers/rental-drivers.controller.ts
    - apps/api/src/cepik/dto/verify-driver.dto.ts
    - apps/api/src/rentals/dto/update-rental-terms.dto.ts
  modified:
    - apps/api/src/rental-drivers/rental-drivers.module.ts
    - apps/api/src/cepik/cepik.service.ts
    - apps/api/src/cepik/cepik.controller.ts
    - apps/api/src/cepik/cepik.module.ts
    - apps/api/src/rentals/rentals.controller.ts
    - apps/api/src/rentals/rentals.service.ts
    - apps/api/src/portal/portal.service.ts

key-decisions:
  - "CepikService.verifyDriver() looks up driver by rentalId then verifies driverId match, ensuring rental-driver ownership"
  - "Portal vehicle data uses Prisma select (not include:true then strip) for defense-in-depth privacy"

patterns-established:
  - "Nested resource controller: /rentals/:rentalId/driver for 1:1 relation sub-resources"
  - "Privacy-by-select: Portal queries use explicit field selection to prevent data leakage"

requirements-completed: [NAJEM-05, NAJEM-06, FLOTA-04, UMOWA-04]

duration: 4min
completed: 2026-04-12
---

# Phase 34 Plan 03: Second Driver API, CEPiK Extension, Portal Privacy Summary

**Second driver CRUD endpoints, CEPiK driver verification via encrypted license, rental terms PATCH, and VIN/year hidden from customer portal**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-12T21:20:26Z
- **Completed:** 2026-04-12T21:24:50Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- RentalDriversController with POST/GET/DELETE endpoints for second driver management
- CepikService.verifyDriver() fetches encrypted driver license and runs CEPiK stub verification
- PATCH /rentals/:id/terms endpoint for mobile to set rentalTerms/termsNotes before contract creation
- Portal API now uses Prisma select to expose only make/model/registration -- VIN and year never reach customers

## Task Commits

Each task was committed atomically:

1. **Task 1: RentalDrivers REST controller + CEPiK extension + rental terms PATCH** - `c15d731` (feat)
2. **Task 2: Portal API -- hide VIN and year from customer-facing responses** - `1cb7eb5` (feat)

## Files Created/Modified
- `apps/api/src/rental-drivers/rental-drivers.controller.ts` - REST controller for second driver CRUD
- `apps/api/src/rental-drivers/rental-drivers.module.ts` - Added controller to module
- `apps/api/src/cepik/cepik.service.ts` - Added verifyDriver() with RentalDriversService injection
- `apps/api/src/cepik/cepik.controller.ts` - Added POST /cepik/verify-driver endpoint
- `apps/api/src/cepik/cepik.module.ts` - Imported RentalDriversModule for DI
- `apps/api/src/cepik/dto/verify-driver.dto.ts` - DTO for driver verification request
- `apps/api/src/rentals/rentals.controller.ts` - Added PATCH :id/terms endpoint
- `apps/api/src/rentals/rentals.service.ts` - Added updateTerms() method
- `apps/api/src/rentals/dto/update-rental-terms.dto.ts` - DTO for rental terms update
- `apps/api/src/portal/portal.service.ts` - Replaced vehicle include:true with select for privacy

## Decisions Made
- CepikService.verifyDriver() validates driver belongs to rental via findByRentalId + driverId match (prevents cross-rental verification)
- Portal uses Prisma select instead of post-query stripping for defense-in-depth (fields never fetched from DB)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TS error in contracts.service.ts (ALL_SIGNATURE_TYPES undefined) -- not caused by this plan, ignored

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Second driver API ready for mobile integration (Plan 05)
- CEPiK driver verification endpoint ready for mobile driver check flow
- Rental terms PATCH endpoint ready for contract creation flow
- Portal privacy filtering in place for customer-facing app

---
*Phase: 34-contractfrozendata-v2-pdf-template-rewrite*
*Completed: 2026-04-12*
