---
phase: 21-critical-bug-fixes
plan: 04
subsystem: api
tags: [prisma, nestjs, safety-guards, data-integrity, s3]

requires:
  - phase: 03-rental-lifecycle
    provides: "RentalsService with processReturn, rollback methods"
  - phase: 07-photo-and-damage-documentation
    provides: "PhotosService with uploadPhoto, replacePhoto methods"
  - phase: 02-customer-management
    provides: "RetentionService with cleanupExpiredCustomers"
provides:
  - "Active rental guard in RetentionService preventing accidental customer deletion"
  - "Null guards after re-fetch in processReturn and rollback (no non-null assertions)"
  - "Atomic photo upload with DB-first ordering and S3 failure cleanup"
  - "Safe replacePhoto ordering (upload new before overwriting old)"
affects: [api, rentals, customers, photos]

tech-stack:
  added: []
  patterns: ["DB-first then S3 with cleanup on failure", "null guard after findUnique re-fetch", "relational filter for safe deletion"]

key-files:
  created: []
  modified:
    - apps/api/src/customers/retention.service.ts
    - apps/api/src/rentals/rentals.service.ts
    - apps/api/src/photos/photos.service.ts

key-decisions:
  - "Used ACTIVE/EXTENDED/DRAFT as active rental statuses (no PENDING/RESERVED in schema)"
  - "replacePhoto uses same S3 keys (overwrite) instead of new keys -- simpler, no orphaned files"

patterns-established:
  - "DB-first upload: create DB record before S3 upload, clean up DB on S3 failure"
  - "Safe replace: upload new files before deleting/overwriting old ones"
  - "Null guard after re-fetch: always check findUnique result after transaction"

requirements-completed: [AREL-03, AREL-04, AREL-05, AREL-06]

duration: 3min
completed: 2026-03-27
---

# Phase 21 Plan 04: API Safety Bugs Summary

**Retention active-rental guard, processReturn/rollback null checks, photo upload atomicity, and safe replacePhoto ordering**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T22:15:57Z
- **Completed:** 2026-03-27T22:19:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- RetentionService now excludes customers with ACTIVE/EXTENDED/DRAFT rentals from deletion
- Removed all non-null assertions on re-fetched values in rentals.service.ts (processReturn and rollback)
- Photo upload creates DB record first, cleans up on S3 failure (no orphaned S3 objects)
- replacePhoto uploads new files before overwriting old ones (no data loss on upload failure)

## Task Commits

Each task was committed atomically:

1. **Task 1: Retention active-rental guard and processReturn null check** - `c104d5e` (fix)
2. **Task 2: Photo upload atomicity and replacePhoto ordering** - `f514662` (fix)

## Files Created/Modified
- `apps/api/src/customers/retention.service.ts` - Added Prisma relational filter to exclude customers with active rentals, added skip count logging
- `apps/api/src/rentals/rentals.service.ts` - Added null guards after re-fetch in processReturn and rollback, removed non-null assertions
- `apps/api/src/photos/photos.service.ts` - Reordered uploadPhoto to DB-first with S3 cleanup, reordered replacePhoto to upload-before-delete

## Decisions Made
- Used ACTIVE/EXTENDED/DRAFT as the "active rental" statuses since PENDING and RESERVED do not exist in the RentalStatus enum
- replacePhoto reuses same S3 keys (overwrite pattern) instead of generating new keys -- simpler approach with same safety guarantee (if upload fails, old file is intact since S3 PUT is atomic)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed invalid RentalStatus values in retention filter**
- **Found during:** Task 1 (retention active-rental guard)
- **Issue:** Plan specified PENDING and RESERVED statuses which do not exist in the RentalStatus enum (only DRAFT, ACTIVE, EXTENDED, RETURNED)
- **Fix:** Used ACTIVE, EXTENDED, DRAFT as the statuses to filter on (all non-RETURNED statuses)
- **Files modified:** apps/api/src/customers/retention.service.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** c104d5e + type fix in 0014ef2

**2. [Rule 1 - Bug] replacePhoto uses overwrite instead of new-key-then-delete**
- **Found during:** Task 2 (replacePhoto ordering)
- **Issue:** Plan suggested generating new keys, uploading, updating DB, then deleting old keys. But existing code reuses the same keys, so separate delete is unnecessary.
- **Fix:** Simply reordered to upload new files (overwriting old keys) before updating DB. Removed the delete-old-first step entirely since S3 PUT overwrites atomically.
- **Files modified:** apps/api/src/photos/photos.service.ts
- **Verification:** No storage.delete calls remain in replacePhoto; upload happens before DB update
- **Committed in:** f514662

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four API safety bugs fixed (AREL-03 through AREL-06)
- TypeScript compilation passes with no errors
- Ready for next phase

---
*Phase: 21-critical-bug-fixes*
*Completed: 2026-03-27*
