---
phase: 29-auth-overhaul-user-management
plan: 02
subsystem: auth, ui
tags: [nextjs, react, zod, username-auth, bff]

requires:
  - phase: 29-01
    provides: API login DTO with login field and context, CreateUserDto with username/password
provides:
  - Username-based web admin login form
  - BFF route sending login field with admin context
  - Worker creation form with username and temporary password
affects: [29-03, mobile-auth]

tech-stack:
  added: []
  patterns: [username-based auth for admin panel, BFF field mapping with context]

key-files:
  created: []
  modified:
    - apps/web/src/app/login/page.tsx
    - apps/web/src/app/api/auth/login/route.ts
    - apps/web/src/app/(admin)/uzytkownicy/page.tsx
    - apps/web/src/hooks/queries/use-users.ts

key-decisions:
  - "UserDto.email made nullable to support worker accounts without email"
  - "Edit dialog falls back to username then name when email is null"

patterns-established:
  - "BFF login route maps frontend username to API login field with context parameter"

requirements-completed: [AUTH-04, USER-01, USER-04]

duration: 2min
completed: 2026-03-29
---

# Phase 29 Plan 02: Web Admin Login & Worker Creation Summary

**Username-based web login with admin context and worker creation form with temporary password**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T17:19:57Z
- **Completed:** 2026-03-29T17:21:37Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Web admin login page now uses username field labeled "Nazwa uzytkownika" instead of email
- BFF login route sends `{ login: username, password, deviceId, context: 'admin' }` fixing field name mismatch
- Worker creation form accepts username + temporary password instead of email
- Success messages updated to reflect immediate login capability

## Task Commits

Each task was committed atomically:

1. **Task 1: Switch web login from email to username and fix BFF field mapping** - `0fab1a8` (feat)
2. **Task 2: Update worker creation form with username and password fields** - `219c5bc` (feat)

## Files Created/Modified
- `apps/web/src/app/login/page.tsx` - Username-based login form with "Nazwa uzytkownika" label
- `apps/web/src/app/api/auth/login/route.ts` - BFF route mapping username to login field with admin context
- `apps/web/src/app/(admin)/uzytkownicy/page.tsx` - Worker creation form with username + password fields
- `apps/web/src/hooks/queries/use-users.ts` - Updated useCreateUser type and UserDto interface

## Decisions Made
- Made UserDto.email nullable (`string | null`) since worker accounts may not have email
- Updated edit dialog description to fall back from email to username to name for display

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated edit dialog user identifier display**
- **Found during:** Task 2 (Worker creation form update)
- **Issue:** Edit dialog showed `editUser?.email` which would be null for workers without email
- **Fix:** Changed to `editUser?.username ?? editUser?.email ?? editUser?.name` fallback chain
- **Files modified:** apps/web/src/app/(admin)/uzytkownicy/page.tsx
- **Verification:** TypeScript compilation passes
- **Committed in:** 219c5bc (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor fix to prevent null display in edit dialog. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Web admin login and worker creation fully converted to username-based auth
- Ready for Plan 03 (mobile auth updates) or any remaining phase 29 plans

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 29-auth-overhaul-user-management*
*Completed: 2026-03-29*
