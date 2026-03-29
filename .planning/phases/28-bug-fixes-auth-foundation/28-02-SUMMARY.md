---
phase: 28-bug-fixes-auth-foundation
plan: 02
subsystem: auth
tags: [prisma, passport, nestjs, argon2, username-login]

# Dependency graph
requires:
  - phase: none
    provides: existing auth flow with email-only login
provides:
  - "User model with nullable unique username field"
  - "Login endpoint accepting username or email via 'login' field"
  - "Passport local strategy using 'login' as usernameField"
  - "validateUser with OR lookup across email and username"
  - "CreateUserDto with optional username"
affects: [29-login-overhaul, 30-user-management]

# Tech tracking
tech-stack:
  added: []
  patterns: ["generic login identifier pattern (email or username)", "OR-based Prisma findFirst for multi-field lookup"]

key-files:
  created:
    - "apps/api/prisma/migrations/20260329185918_add_username_to_user/migration.sql"
  modified:
    - "apps/api/prisma/schema.prisma"
    - "apps/api/src/auth/dto/login.dto.ts"
    - "apps/api/src/auth/strategies/local.strategy.ts"
    - "apps/api/src/auth/auth.service.ts"
    - "apps/api/src/auth/auth.controller.ts"
    - "apps/api/src/users/users.service.ts"
    - "apps/api/src/users/dto/create-user.dto.ts"

key-decisions:
  - "Used findFirst with OR instead of two sequential lookups for email/username"
  - "Login field uses @IsString @MinLength(1) instead of @IsEmail to accept both formats"
  - "trackFailedAttempt parameter renamed to 'identifier' for clarity with dual-lookup"

patterns-established:
  - "Generic login identifier: 'login' field accepts email or username"
  - "OR-based user lookup: findFirst with OR clause for multi-field auth"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 2min
completed: 2026-03-29
---

# Phase 28 Plan 02: Username Auth Foundation Summary

**Prisma username field with data migration and dual email/username login via generic 'login' identifier**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T16:58:25Z
- **Completed:** 2026-03-29T17:00:46Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added nullable unique username field to User model with Prisma migration
- Seeded admin@kitek.pl with username 'admin' via data migration
- Replaced email-only login with generic 'login' field accepting either email or username
- Updated Passport strategy, auth service, auth controller, user service, and CreateUserDto

## Task Commits

Each task was committed atomically:

1. **Task 1: Add username field to Prisma schema and run migration with admin data seed** - `0b81c04` (feat)
2. **Task 2: Update auth login flow to accept username or email, and update user DTOs** - `89b4fdf` (feat)

## Files Created/Modified
- `apps/api/prisma/schema.prisma` - Added username String? @unique to User model
- `apps/api/prisma/migrations/20260329185918_add_username_to_user/migration.sql` - ALTER TABLE + data migration for admin username
- `apps/api/src/auth/dto/login.dto.ts` - Replaced @IsEmail email with @IsString login field
- `apps/api/src/auth/strategies/local.strategy.ts` - Changed usernameField from 'email' to 'login'
- `apps/api/src/auth/auth.service.ts` - validateUser uses findFirst with OR (email/username), trackFailedAttempt uses generic identifier
- `apps/api/src/auth/auth.controller.ts` - Changed dto.email to dto.login
- `apps/api/src/users/users.service.ts` - Added username to userSelectFields
- `apps/api/src/users/dto/create-user.dto.ts` - Added optional username field with @IsOptional @MinLength(3)

## Decisions Made
- Used findFirst with OR clause instead of two sequential lookups -- simpler code, single DB query
- Login field validated with @IsString @MinLength(1) rather than custom email-or-username validator -- keeps it simple, validation happens at DB level
- Renamed trackFailedAttempt parameter from 'email' to 'identifier' for semantic clarity with dual-lookup pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Resolved Prisma migration drift**
- **Found during:** Task 1 (Prisma migration generation)
- **Issue:** Database schema had drifted from migration history (many tables added without migrations on disk). `prisma migrate dev` required a full reset.
- **Fix:** Used `prisma db execute` to apply SQL directly, created migration file manually, and used `prisma migrate resolve --applied` to sync migration history.
- **Files modified:** migration.sql (same file, different creation approach)
- **Verification:** `prisma migrate status` reports "Database schema is up to date!"
- **Committed in:** 0b81c04 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Migration drift required alternative approach but achieved identical result. No scope creep.

## Issues Encountered
- Prisma migration drift between DB state and migration history required manual migration creation and resolve. This is a pre-existing condition from previous development phases that applied schema changes without corresponding migration files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- API now supports username-based authentication alongside email
- Phase 29 (Login Overhaul) can proceed to update web and mobile UIs to use the 'login' field
- Phase 30 (User Management) can use the optional username field in CreateUserDto

## Self-Check: PASSED

All 8 files verified present. Both task commits (0b81c04, 89b4fdf) verified in git log.

---
*Phase: 28-bug-fixes-auth-foundation*
*Completed: 2026-03-29*
