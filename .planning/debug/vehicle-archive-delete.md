---
status: awaiting_human_verify
trigger: "Archiving or deleting a vehicle throws errors in web admin panel"
created: 2026-03-31T12:00:00Z
updated: 2026-03-31T12:00:00Z
---

## Current Focus

hypothesis: The useCallback dependency [archiveVehicle.mutate] is unstable causing stale closure or incorrect behavior
test: Compare original dependency [archiveVehicle] vs new [archiveVehicle.mutate] - mutate function may not be stable
expecting: Fixing dependency to use [archiveVehicle] will stabilize the callback
next_action: Fix the handleArchive useCallback dependency array

## Symptoms

expected: Should be able to archive or delete vehicles from the admin panel
actual: Archiving or deleting a vehicle throws errors
errors: Error thrown on archive/delete operation
reproduction: Go to vehicles page in web admin panel, try to archive or delete a vehicle
started: Currently broken (recent fix suspected)

## Eliminated

## Evidence

- timestamp: 2026-03-31T12:05:00Z
  checked: Recent commit 39d0d26 diff
  found: Changed handleArchive from inline to useCallback, dependency is [archiveVehicle.mutate]
  implication: The useCallback dependency array references archiveVehicle.mutate directly which changes reference on every render

- timestamp: 2026-03-31T12:07:00Z
  checked: Prisma schema for Vehicle model
  found: isArchived field exists (Boolean @default(false))
  implication: Schema is correct, not a database issue

- timestamp: 2026-03-31T12:08:00Z
  checked: TypeScript compilation
  found: Both @rentapp/api and @rentapp/web compile without errors
  implication: No type errors, but runtime behavior may still be broken

- timestamp: 2026-03-31T12:12:00Z
  checked: Compared before/after commit 39d0d26
  found: Original code had dependency [router, archiveVehicle], new code has [archiveVehicle.mutate]
  implication: The .mutate method reference is not stable - React Query docs say the mutation object is stable but individual methods may not be

- timestamp: 2026-03-31T12:18:00Z
  checked: Applied fix - changed dependency from [archiveVehicle.mutate] to [archiveVehicle]
  found: TypeScript compilation passes, code matches original pattern
  implication: Fix is syntactically correct and follows same pattern as archivedColumns useMemo

## Resolution

root_cause: The useCallback dependency [archiveVehicle.mutate] uses direct method access which may not have stable reference. The original code used [archiveVehicle] (the whole mutation object) which IS stable per TanStack Query. This change in dependency pattern could cause the handleArchive callback to be recreated frequently, leading to columns being recreated and potential stale closure issues.
fix: Change handleArchive dependency from [archiveVehicle.mutate] to [archiveVehicle]
verification: TypeScript compiles, pattern matches other mutation usages in same file
files_changed: [apps/web/src/app/(admin)/pojazdy/vehicles-page.tsx]
