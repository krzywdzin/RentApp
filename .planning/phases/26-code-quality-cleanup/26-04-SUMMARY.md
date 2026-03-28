---
phase: 26-code-quality-cleanup
plan: 04
subsystem: ui
tags: [zod, react-hook-form, zodResolver, typescript, dead-code]

requires:
  - phase: 26-01
    provides: RentalWithRelations type in @rentapp/shared
provides:
  - Type-safe web form pages without unsafe as casts
  - Consolidated RentalWithRelations import from shared
  - Dead code removal across web and mobile
affects: []

tech-stack:
  added: []
  patterns:
    - "useForm() without generic to let zodResolver infer input/output types via Resolver<Input, Context, Output>"
    - "z.infer<typeof Schema> in onSubmit handler receives validated output type"
    - "Record mutation for in-place null replacement instead of spread-to-Record cast"

key-files:
  created: []
  modified:
    - apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx
    - apps/web/src/app/(admin)/pojazdy/nowy/page.tsx
    - apps/web/src/app/(admin)/klienci/nowy/page.tsx
    - apps/web/src/app/(admin)/klienci/[id]/edytuj/page.tsx
    - apps/web/src/app/(admin)/wynajmy/nowy/page.tsx
    - apps/web/src/app/(admin)/wynajmy/columns.tsx
    - apps/web/src/app/(admin)/wynajmy/[id]/page.tsx
    - apps/web/src/app/(admin)/uzytkownicy/columns.tsx
    - apps/mobile/src/lib/constants.ts
    - apps/web/src/hooks/queries/use-audit.ts

key-decisions:
  - "useForm() without explicit generic lets zodResolver's Resolver<Input,Context,Output> handle type inference correctly"
  - "AuditLogEntry replaced with AuditLogDto from shared, re-exported for backward compatibility"

patterns-established:
  - "zodResolver pattern: useForm() (no generic) + zodResolver(Schema) + onSubmit typed as z.infer<typeof Schema>"

requirements-completed: [QUAL-03, QUAL-07]

duration: 11min
completed: 2026-03-28
---

# Phase 26 Plan 04: Type Safety & Dead Code Cleanup Summary

**Replaced unsafe as casts in 5 web form pages with zodResolver inference, consolidated RentalWithRelations to shared, removed dead code**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-28T00:17:49Z
- **Completed:** 2026-03-28T00:29:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Eliminated all `as XxxInput` casts from vehicle, customer, and rental form pages by leveraging zodResolver's `Resolver<Input, Context, Output>` type inference
- Consolidated local `RentalWithRelations` interfaces in 2 web files to single import from `@rentapp/shared`
- Removed dead code: unused `userColumns` export, `contractStatusLabel` wrapper function, phantom `CANCELLED` status from mobile
- Replaced local `AuditLogEntry` with `AuditLogDto` from shared package

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace unsafe as casts in web form pages** - `8aaceed` (feat)
2. **Task 2: Consolidate RentalWithRelations and remove dead code** - `181dc99` (feat)

## Files Created/Modified
- `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx` - Removed as UpdateVehicleInput cast, useForm without generic
- `apps/web/src/app/(admin)/pojazdy/nowy/page.tsx` - Removed as CreateVehicleInput cast, moved FormValues type outside component
- `apps/web/src/app/(admin)/klienci/nowy/page.tsx` - Removed as CreateCustomerInput cast, in-place null replacement
- `apps/web/src/app/(admin)/klienci/[id]/edytuj/page.tsx` - Removed as UpdateCustomerInput cast, in-place null replacement
- `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` - Removed as unknown as Resolver and as unknown as string casts
- `apps/web/src/app/(admin)/wynajmy/columns.tsx` - Import RentalWithRelations from shared
- `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` - Import RentalWithRelations from shared, remove contractStatusLabel wrapper
- `apps/web/src/app/(admin)/uzytkownicy/columns.tsx` - Remove unused userColumns export
- `apps/mobile/src/lib/constants.ts` - Remove phantom CANCELLED status
- `apps/web/src/hooks/queries/use-audit.ts` - Replace local AuditLogEntry with AuditLogDto from shared

## Decisions Made
- Used `useForm()` without explicit generic parameter to let zodResolver's `Resolver<Input, Context, Output>` type inference work correctly with schemas that have `.default()` transforms (where `z.input` differs from `z.output`)
- Replaced local `AuditLogEntry` interface with `AuditLogDto` from shared and re-exported as type alias for backward compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed rental possibly undefined in handleExtend**
- **Found during:** Task 2 (wynajmy/[id]/page.tsx)
- **Issue:** Pre-existing TS18048 error -- `rental` possibly undefined in handleExtend closure
- **Fix:** Added `!rental` guard at start of handleExtend function
- **Files modified:** apps/web/src/app/(admin)/wynajmy/[id]/page.tsx
- **Verification:** tsc --noEmit passes clean
- **Committed in:** 181dc99 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal -- pre-existing TS error fixed while editing the same file.

## Issues Encountered
- zodResolver with `z.infer` (output type) as form generic caused type mismatch when schema has `.default()` fields because zodResolver internally types the resolver as `Resolver<z.input<Schema>>`. Resolved by omitting the generic and letting TS infer from the resolver.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 26 (Code Quality & Cleanup) is complete with all 4 plans executed
- Both web and mobile typecheck cleanly
- All audit issues addressed

---
*Phase: 26-code-quality-cleanup*
*Completed: 2026-03-28*
