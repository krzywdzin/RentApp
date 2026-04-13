---
phase: 35-google-places-integration
plan: 01
subsystem: api
tags: [google-places, prisma, nestjs, proxy, autocomplete]

requires:
  - phase: 34-contract-frozen-data
    provides: Rental model with termsNotes field (migration baseline)
provides:
  - PlaceLocation shared type and PlaceLocationSchema for validation
  - Google Places autocomplete proxy at GET /places/place/autocomplete/json
  - Rental model pickupLocation and returnLocation Json? fields
  - CreateRentalDto accepts optional location fields
affects: [35-02, 35-03, mobile-rental-form, contract-pdf]

tech-stack:
  added: []
  patterns: [backend-proxy-for-third-party-api, json-field-in-prisma]

key-files:
  created:
    - apps/api/src/places/places.service.ts
    - apps/api/src/places/places.controller.ts
    - apps/api/src/places/places.module.ts
    - apps/api/src/places/dto/autocomplete-query.dto.ts
    - apps/api/src/places/places.service.spec.ts
    - apps/api/prisma/migrations/20260413200519_add_rental_locations/migration.sql
  modified:
    - packages/shared/src/types/rental.types.ts
    - packages/shared/src/schemas/rental.schemas.ts
    - apps/api/prisma/schema.prisma
    - apps/api/src/app.module.ts
    - apps/api/src/rentals/dto/create-rental.dto.ts
    - apps/api/src/rentals/rentals.service.ts
    - .env.example

key-decisions:
  - "PlacesController returns empty predictions for input < 2 chars (short-circuit before Google API call)"
  - "Migration SQL written manually following Phase 33/34 precedent (no shadow DB)"
  - "PlaceLocationDto defined inline in create-rental.dto.ts (simple 2-field class, no separate file needed)"

patterns-established:
  - "Backend proxy pattern: third-party API keys stay server-side, mobile calls our API"

requirements-completed: [NAJEM-02, NAJEM-03, NAJEM-04]

duration: 4min
completed: 2026-04-13
---

# Phase 35 Plan 01: Schema, Types, Backend Proxy Summary

**PlaceLocation shared type, Prisma migration for location Json fields, and Google Places autocomplete proxy endpoint with country:pl bias**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-13T18:03:15Z
- **Completed:** 2026-04-13T18:07:20Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- PlaceLocation interface and PlaceLocationSchema exported from @rentapp/shared
- Google Places autocomplete proxy at GET /places/place/autocomplete/json with Poland country bias
- Rental model extended with pickupLocation and returnLocation JSONB columns
- CreateRentalDto validates nested location objects with address (1-500) and placeId (1-300)
- 5 unit tests for PlacesService covering happy path, error handling, and parameter passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared types + Prisma schema + migration + PlacesModule backend proxy**
   - `8be3229` (test) - Failing tests for PlacesService
   - `a43f3bc` (feat) - Implementation: shared types, Prisma migration, Places module
2. **Task 2: Update rental DTO + service to persist location fields** - `6fff7a1` (feat)

## Files Created/Modified
- `packages/shared/src/types/rental.types.ts` - Added PlaceLocation interface, pickupLocation/returnLocation to RentalDto
- `packages/shared/src/schemas/rental.schemas.ts` - Added PlaceLocationSchema, location fields to CreateRentalSchema
- `apps/api/prisma/schema.prisma` - Added pickupLocation Json? and returnLocation Json? to Rental model
- `apps/api/prisma/migrations/20260413200519_add_rental_locations/migration.sql` - ALTER TABLE for JSONB columns
- `apps/api/src/places/places.service.ts` - Google Places autocomplete proxy with fetch
- `apps/api/src/places/places.controller.ts` - GET /places/place/autocomplete/json endpoint
- `apps/api/src/places/places.module.ts` - NestJS module registration
- `apps/api/src/places/dto/autocomplete-query.dto.ts` - Input validation DTO
- `apps/api/src/places/places.service.spec.ts` - 5 unit tests for PlacesService
- `apps/api/src/app.module.ts` - PlacesModule imported
- `apps/api/src/rentals/dto/create-rental.dto.ts` - PlaceLocationDto + pickupLocation/returnLocation fields
- `apps/api/src/rentals/rentals.service.ts` - Persist location fields in create()
- `.env.example` - GOOGLE_PLACES_API_KEY entry

## Decisions Made
- PlacesController short-circuits with empty predictions for input < 2 chars, avoiding unnecessary Google API calls
- Migration SQL written manually (no shadow DB), following Phase 33/34 precedent
- PlaceLocationDto defined inline in create-rental.dto.ts -- simple 2-field DTO, no need for separate file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed ts-jest in api workspace**
- **Found during:** Task 1 (TDD RED phase)
- **Issue:** ts-jest was listed in package.json but not resolvable from apps/api due to hoisting
- **Fix:** Ran `pnpm add -D ts-jest --filter api` to make it available
- **Files modified:** apps/api/package.json, pnpm-lock.yaml
- **Verification:** Jest tests run successfully
- **Committed in:** a43f3bc (part of Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for test execution. No scope creep.

## Issues Encountered
None beyond the ts-jest resolution issue documented above.

## User Setup Required

The Google Places API key must be configured:
- Add `GOOGLE_PLACES_API_KEY=your-key` to `.env` (local) and Railway environment (production)
- Key must have Places API (New) enabled in Google Cloud Console
- Billing must be active on the Google Cloud project

## Next Phase Readiness
- Backend proxy endpoint ready for mobile integration (Plan 02)
- Shared types available for mobile autocomplete component
- Rental create/update accepts location data for persistence

---
*Phase: 35-google-places-integration*
*Completed: 2026-04-13*
