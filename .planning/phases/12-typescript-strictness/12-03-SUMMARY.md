---
phase: 12-typescript-strictness
plan: 03
subsystem: types
tags: [typescript, any-removal, portal-types, mutation-hooks, zod, react-hook-form]

requires:
  - phase: 11-web-admin-panel-polish
    provides: "Web rental pages with as-any casts deferred to Phase 12"
provides:
  - "Typed portal returnData with PortalReturnInspectionData interface"
  - "Typed mutation hooks using CreateCustomerInput/UpdateCustomerInput/CreateVehicleInput/UpdateVehicleInput"
  - "RentalWithRelations interface for typed vehicle/customer relation access"
  - "Zero as-any casts in web rental pages"
affects: [14-testing]

tech-stack:
  added: []
  patterns:
    - "RentalWithRelations extends RentalDto for API responses with included relations"
    - "PortalReturnInspectionData as portal-specific DTO separate from VehicleInspection"
    - "Resolver<FormValues> cast for zodResolver with refined schemas"

key-files:
  created: []
  modified:
    - packages/shared/src/types/portal.types.ts
    - apps/web/src/hooks/queries/use-customers.ts
    - apps/web/src/hooks/queries/use-vehicles.ts
    - apps/web/src/app/(admin)/wynajmy/columns.tsx
    - apps/web/src/app/(admin)/wynajmy/[id]/page.tsx
    - apps/web/src/app/(admin)/wynajmy/nowy/page.tsx
    - apps/web/src/app/(admin)/klienci/nowy/page.tsx
    - apps/web/src/app/(admin)/klienci/[id]/edytuj/page.tsx
    - apps/web/src/app/(admin)/pojazdy/nowy/page.tsx
    - apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx

key-decisions:
  - "Created PortalReturnInspectionData instead of reusing VehicleInspection -- portal returnData has different fields (fuelLevel, cleanliness) than rental VehicleInspection (areas, mileage)"
  - "Used Resolver<FormValues> cast for zodResolver with refined Zod schemas instead of as any"
  - "Used RentalWithRelations interface extending RentalDto for typed relation access in columns and detail pages"

patterns-established:
  - "RentalWithRelations: extend base DTO with optional relation fields for API responses that include joins"
  - "Portal-specific DTOs: portal types should be independent from internal types when shapes differ"

requirements-completed: [TSFIX-05, TSFIX-06]

duration: 8min
completed: 2026-03-25
---

# Phase 12 Plan 03: Web Hooks & Portal Types Summary

**Typed portal returnData with PortalReturnInspectionData, typed mutation hooks with shared Zod input types, and zero as-any casts in rental pages via RentalWithRelations interface**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-25T03:27:46Z
- **Completed:** 2026-03-25T03:35:40Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Portal returnData field typed with PortalReturnInspectionData instead of any
- Customer and vehicle mutation hooks use specific input types (CreateCustomerInput, UpdateCustomerInput, CreateVehicleInput, UpdateVehicleInput)
- All as-any casts removed from wynajmy/columns.tsx, wynajmy/[id]/page.tsx, and wynajmy/nowy/page.tsx
- Mutation callers in klienci and pojazdy pages updated to pass typed inputs

## Task Commits

Each task was committed atomically:

1. **Task 1: Type shared portal returnData and web mutation hooks** - `d55a8f8` (fix)
2. **Task 2: Remove as any casts from web rental pages** - `c0a3213` (fix)

## Files Created/Modified
- `packages/shared/src/types/portal.types.ts` - Added PortalReturnInspectionData interface, replaced any with typed returnData
- `apps/web/src/hooks/queries/use-customers.ts` - Typed mutation params with CreateCustomerInput/UpdateCustomerInput
- `apps/web/src/hooks/queries/use-vehicles.ts` - Typed mutation params with CreateVehicleInput/UpdateVehicleInput
- `apps/web/src/app/(admin)/wynajmy/columns.tsx` - Added RentalWithRelations, removed as-any casts on vehicle/customer access
- `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` - Used RentalWithRelations for typed relation access
- `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` - Replaced zodResolver as any with Resolver<FormValues>
- `apps/web/src/app/(admin)/klienci/nowy/page.tsx` - Updated mutate call to use CreateCustomerInput
- `apps/web/src/app/(admin)/klienci/[id]/edytuj/page.tsx` - Updated mutate call to use UpdateCustomerInput
- `apps/web/src/app/(admin)/pojazdy/nowy/page.tsx` - Updated mutate call to use CreateVehicleInput
- `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx` - Updated mutate call to use UpdateVehicleInput

## Decisions Made
- Created PortalReturnInspectionData as a portal-specific type instead of reusing VehicleInspection, because the portal returnData includes fuelLevel and cleanliness fields not present in VehicleInspection
- Used `Resolver<FormValues>` cast (via `as unknown as Resolver<FormValues>`) for zodResolver with refined schemas instead of `as any`, providing a more specific type assertion
- Defined RentalWithRelations locally in columns.tsx and [id]/page.tsx to extend RentalDto with optional vehicle/customer relations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Portal returnData uses different shape than VehicleInspection**
- **Found during:** Task 1 verification
- **Issue:** Plan specified using VehicleInspection for portal returnData, but portal actually returns fuelLevel/cleanliness/notes fields not present on VehicleInspection
- **Fix:** Created PortalReturnInspectionData interface with union of both field sets
- **Files modified:** packages/shared/src/types/portal.types.ts
- **Verification:** Build passes, portal rental-detail-view.tsx compiles cleanly
- **Committed in:** c0a3213

**2. [Rule 1 - Bug] Mutation callers pass Record<string, unknown> to now-typed hooks**
- **Found during:** Task 1 verification
- **Issue:** klienci/nowy, klienci/[id]/edytuj, pojazdy/nowy, pojazdy/[id]/edytuj explicitly cast data to Record<string, unknown> before calling mutate
- **Fix:** Updated callers to cast to specific input types (CreateCustomerInput, etc.)
- **Files modified:** 4 page files
- **Verification:** Build passes with no type errors
- **Committed in:** c0a3213

**3. [Rule 3 - Blocking] Pre-existing prettier and lint errors across web app**
- **Found during:** Task 1 verification
- **Issue:** Multiple files had pre-existing prettier formatting errors and one unused import that caused build failures
- **Fix:** Ran prettier on all web source files, removed unused Badge import, fixed use-users.ts formatting
- **Files modified:** use-users.ts, klienci/[id]/page.tsx, page.tsx, umowy/page.tsx, uzytkownicy/page.tsx, wynajmy/[id]/edytuj/page.tsx
- **Verification:** Build passes with no formatting errors
- **Committed in:** d55a8f8 (use-users.ts), c0a3213 (rest)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for build correctness. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All TSFIX-05 and TSFIX-06 requirements satisfied
- Web and shared packages build cleanly
- Ready for Phase 14 (testing)

---
*Phase: 12-typescript-strictness*
*Completed: 2026-03-25*
