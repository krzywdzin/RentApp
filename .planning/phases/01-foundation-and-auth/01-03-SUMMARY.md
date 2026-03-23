---
phase: 01-foundation-and-auth
plan: 03
subsystem: auth
tags: [nodemailer, mailpit, argon2, users, mail, password-reset, setup-token, nestjs]

# Dependency graph
requires:
  - phase: 01-01
    provides: NestJS API skeleton, PrismaService, Prisma User model, shared UserRole type
provides:
  - MailService for sending setup and reset password emails via nodemailer
  - UsersService with createUser (argon2 token hashing), findByEmail, findById, requestPasswordReset
  - UsersController with POST /users (admin-only) and GET /users/me
  - CreateUserDto with class-validator decorators
  - UsersModule and MailModule with proper DI wiring
  - 7 unit tests for UsersService
affects: [01-04, 01-05]

# Tech tracking
tech-stack:
  added: [nodemailer, ts-node]
  patterns: [token-hash-and-store, silent-failure-for-email-lookup, mail-transport-config]

key-files:
  created:
    - apps/api/src/mail/mail.service.ts
    - apps/api/src/mail/mail.module.ts
    - apps/api/src/users/users.service.ts
    - apps/api/src/users/users.controller.ts
    - apps/api/src/users/users.module.ts
    - apps/api/src/users/dto/create-user.dto.ts
    - apps/api/src/common/decorators/roles.decorator.ts
    - apps/api/src/common/decorators/current-user.decorator.ts
  modified:
    - apps/api/src/users/users.service.spec.ts

key-decisions:
  - "Created Roles and CurrentUser decorators from Plan 01-02 scope as blocking dependency for UsersController"
  - "Password reset reuses setupToken/setupTokenExpiry fields rather than adding new columns"
  - "requestPasswordReset silently returns for non-existent emails to prevent user enumeration"

patterns-established:
  - "Token hash-and-store: generate raw token, hash with argon2, store hash in DB, send raw via email"
  - "Silent failure: requestPasswordReset returns void regardless of whether email exists"
  - "MailService: configurable SMTP via ConfigService (MAIL_HOST, MAIL_PORT, MAIL_FROM, APP_URL)"

requirements-completed: [AUTH-02]

# Metrics
duration: 4min
completed: 2026-03-23
---

# Phase 1 Plan 03: Mail and Users Module Summary

**MailService with nodemailer SMTP transport, UsersService with argon2-hashed setup/reset tokens (72h/1h expiry), admin-only user creation endpoint, 7 passing unit tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-23T16:46:16Z
- **Completed:** 2026-03-23T16:50:39Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- MailService sends password setup (72h link) and reset (1h link) emails via configurable nodemailer transport (Mailpit in dev)
- UsersService creates accounts with null passwordHash, generates 32-byte hex tokens, hashes with argon2 before storage, sends raw token via email
- UsersController exposes POST /users (admin-only via @Roles decorator) and GET /users/me
- requestPasswordReset does not reveal whether email exists (prevents user enumeration)
- 7 unit tests covering all UsersService methods with mocked PrismaService and MailService

## Task Commits

Each task was committed atomically:

1. **Task 1: Create mail service and users module** - `f4617ad` (feat)
2. **Task 2: Implement UsersService unit tests** - `3a9dc22` (test)

## Files Created/Modified
- `apps/api/src/mail/mail.service.ts` - Email sending via nodemailer with setup and reset templates
- `apps/api/src/mail/mail.module.ts` - MailModule exporting MailService
- `apps/api/src/users/users.service.ts` - User creation with token generation, email lookup, password reset request
- `apps/api/src/users/users.controller.ts` - POST /users (admin-only) and GET /users/me
- `apps/api/src/users/users.module.ts` - UsersModule importing MailModule, exporting UsersService
- `apps/api/src/users/dto/create-user.dto.ts` - DTO with email, name, role validation
- `apps/api/src/common/decorators/roles.decorator.ts` - @Roles() metadata decorator
- `apps/api/src/common/decorators/current-user.decorator.ts` - @CurrentUser() param decorator
- `apps/api/src/users/users.service.spec.ts` - 7 unit tests replacing .todo stubs

## Decisions Made
- Created @Roles and @CurrentUser decorators (Plan 01-02 scope) as blocking dependency for UsersController compilation
- Reused setupToken/setupTokenExpiry columns for both setup and reset flows (no new schema columns needed)
- requestPasswordReset silently returns for non-existent emails to prevent user enumeration attacks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created Roles and CurrentUser decorators from Plan 01-02 scope**
- **Found during:** Task 1 (UsersController compilation)
- **Issue:** UsersController imports @Roles and @CurrentUser decorators which are planned for Plan 01-02 but don't exist yet
- **Fix:** Created roles.decorator.ts and current-user.decorator.ts matching Plan 01-02 interface spec
- **Files modified:** apps/api/src/common/decorators/roles.decorator.ts, apps/api/src/common/decorators/current-user.decorator.ts
- **Verification:** `pnpm --filter @rentapp/api build` compiles successfully
- **Committed in:** f4617ad (Task 1 commit)

**2. [Rule 3 - Blocking] Built @rentapp/shared before API build**
- **Found during:** Task 1 (API build)
- **Issue:** @rentapp/shared dist/ directory missing, causing TS2307 for UserRole imports
- **Fix:** Ran `pnpm --filter @rentapp/shared build` before API build
- **Files modified:** None (build output only)
- **Verification:** `pnpm --filter @rentapp/api build` resolves @rentapp/shared imports

**3. [Rule 3 - Blocking] Added ts-node for Jest config parsing**
- **Found during:** Task 2 (running tests)
- **Issue:** jest.config.ts requires ts-node to parse TypeScript config
- **Fix:** Added ts-node as devDependency
- **Files modified:** apps/api/package.json, pnpm-lock.yaml
- **Verification:** `npx jest --testPathPattern users.service` runs successfully
- **Committed in:** 3a9dc22 (Task 2 commit)

**4. [Rule 1 - Bug] Added definite assignment assertions to DTO properties**
- **Found during:** Task 1 (API build)
- **Issue:** strict mode TS2564 errors on CreateUserDto properties without initializers
- **Fix:** Added `!` definite assignment assertions (standard pattern for class-validator DTOs)
- **Files modified:** apps/api/src/users/dto/create-user.dto.ts
- **Verification:** `pnpm --filter @rentapp/api build` compiles without TS2564
- **Committed in:** f4617ad (Task 1 commit)

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 bug)
**Impact on plan:** All fixes necessary for compilation and test execution. Decorator creation was the only scope addition -- these are simple 5-line files matching the Plan 01-02 interface spec. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required. MailService uses MAIL_HOST/MAIL_PORT from environment (Mailpit via Docker Compose in dev).

## Next Phase Readiness
- UsersModule and MailModule ready for import by AuthModule in Plan 01-04
- UsersService.findByEmail available for login credential validation
- Token generation pattern established for reuse in auth refresh token flow
- @Roles and @CurrentUser decorators available for all future controllers

## Self-Check: PASSED

All 9 created/modified files verified present. Both task commits (f4617ad, 3a9dc22) verified in git log.

---
*Phase: 01-foundation-and-auth*
*Completed: 2026-03-23*
