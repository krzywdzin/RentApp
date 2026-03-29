---
phase: 29-auth-overhaul-user-management
plan: 01
subsystem: auth
tags: [jwt, passport, argon2, nestjs, prisma]

# Dependency graph
requires:
  - phase: 28-bug-fixes-auth-foundation
    provides: username field, dual email/username login
provides:
  - MobileJwtStrategy for mobile app token validation
  - LoginDto with context field (admin/mobile)
  - Context-aware JWT signing (different secrets per audience)
  - Worker creation with immediate password (no email flow)
  - Optional email for user creation
affects: [29-02, 29-03, mobile-auth, admin-user-management]

# Tech tracking
tech-stack:
  added: []
  patterns: [context-aware JWT signing, audience-based strategy selection]

key-files:
  created:
    - apps/api/src/auth/strategies/jwt-mobile.strategy.ts
  modified:
    - packages/shared/src/types/user.types.ts
    - apps/api/src/auth/dto/login.dto.ts
    - apps/api/src/auth/auth.service.ts
    - apps/api/src/auth/auth.controller.ts
    - apps/api/src/auth/strategies/jwt.strategy.ts
    - apps/api/src/auth/auth.module.ts
    - apps/api/src/users/dto/create-user.dto.ts
    - apps/api/src/users/users.service.ts
    - apps/api/prisma/schema.prisma
    - .env.example

key-decisions:
  - "Mobile tokens signed with JWT_MOBILE_SECRET, admin with JWT_ACCESS_SECRET"
  - "Admin JwtStrategy rejects mobile tokens via aud check"
  - "Prisma schema changed to make email nullable for worker accounts without email"
  - "resetPasswordByAdmin throws if user has no email"

patterns-established:
  - "Context-aware JWT: pass context through login -> token signing -> refresh rotation"
  - "Worker fast-create: password provided = immediate hash, no email flow"

requirements-completed: [AUTH-06, USER-02, USER-03, USER-04]

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 29 Plan 01: API Auth Context Separation Summary

**Separate admin/mobile JWT signing with MobileJwtStrategy and worker creation with immediate password hashing**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T17:13:39Z
- **Completed:** 2026-03-29T17:17:54Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- JWT system generates context-aware tokens: admin tokens use JWT_ACCESS_SECRET with aud=admin, mobile tokens use JWT_MOBILE_SECRET with aud=mobile
- MobileJwtStrategy validates mobile tokens; admin JwtStrategy rejects mobile tokens
- Worker accounts can be created with immediate password (no email setup flow required)
- Email made optional for user creation (Prisma schema + DTO)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add auth context to JWT system and create MobileJwtStrategy** - `430f4f7` (feat)
2. **Task 2: Update worker creation to accept password directly and make email optional** - `2d83390` (feat)

## Files Created/Modified
- `apps/api/src/auth/strategies/jwt-mobile.strategy.ts` - MobileJwtStrategy using JWT_MOBILE_SECRET
- `packages/shared/src/types/user.types.ts` - Added aud field to JwtPayload
- `apps/api/src/auth/dto/login.dto.ts` - Added optional context field
- `apps/api/src/auth/auth.service.ts` - Context-aware token signing and refresh
- `apps/api/src/auth/auth.controller.ts` - Pass context through login/refresh endpoints
- `apps/api/src/auth/strategies/jwt.strategy.ts` - Reject mobile tokens in admin strategy
- `apps/api/src/auth/auth.module.ts` - Register MobileJwtStrategy provider
- `apps/api/src/users/dto/create-user.dto.ts` - Optional email and password fields
- `apps/api/src/users/users.service.ts` - Conditional password/email flow in createUser
- `apps/api/prisma/schema.prisma` - Made email nullable
- `.env.example` - Added JWT_MOBILE_SECRET

## Decisions Made
- Mobile tokens signed with JWT_MOBILE_SECRET, admin tokens with JWT_ACCESS_SECRET -- separate secrets prevent cross-context token reuse
- Admin JwtStrategy rejects mobile tokens via aud check before user lookup
- Prisma schema changed to make User.email nullable (was required) to support worker accounts without email
- resetPasswordByAdmin throws NotFoundException if user has no email (guards against sending to null)
- requestPasswordReset uses non-null assertion on user.email since lookup is by email (always populated)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Made User.email nullable in Prisma schema**
- **Found during:** Task 2 (worker creation with optional email)
- **Issue:** Plan specified email as optional in DTO but Prisma schema had `email String @unique` (required). TypeScript compilation failed because DTO email was `string | undefined` but Prisma expected `string`.
- **Fix:** Changed schema to `email String? @unique`, ran `prisma db push`, fixed downstream type errors in resetPasswordByAdmin and requestPasswordReset.
- **Files modified:** apps/api/prisma/schema.prisma, apps/api/src/users/users.service.ts
- **Verification:** TypeScript compilation passes for both API and web apps
- **Committed in:** 2d83390 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Schema change was necessary to fulfill the plan's requirement of optional email. No scope creep.

## Issues Encountered
- Shared package dist needed rebuilding after adding aud field to JwtPayload -- resolved by running tsc on packages/shared before API compilation check.

## User Setup Required

None - JWT_MOBILE_SECRET added to .env.example. Developers should add it to their local .env files.

## Next Phase Readiness
- MobileJwtStrategy ready for use by mobile auth guards (jwt-mobile guard name)
- Worker creation API ready for admin UI integration
- Context field ready for mobile app login requests

---
*Phase: 29-auth-overhaul-user-management*
*Completed: 2026-03-29*
