---
phase: 20-security-hardening
plan: 01
subsystem: api
tags: [jwt, security, env-config, smtp, s3, credentials]

# Dependency graph
requires:
  - phase: 12-portal
    provides: Portal JWT auth module using shared JWT_ACCESS_SECRET
provides:
  - Separate PORTAL_JWT_SECRET for portal auth isolation
  - Company PII externalized to environment variables
  - SMTP auth support for production mail providers
  - S3 credentials removed from source code
  - Gitignore coverage for workspace .env files
  - Safe encryption key placeholder in .env.example
affects: [21-api-hardening, 22-data-integrity]

# Tech tracking
tech-stack:
  added: []
  patterns: [env-driven-config, credential-isolation, conditional-auth]

key-files:
  created: []
  modified:
    - apps/api/src/portal/portal.module.ts
    - apps/api/src/portal/strategies/portal-jwt.strategy.ts
    - apps/api/src/common/env.validation.ts
    - apps/api/src/contracts/contracts.service.ts
    - apps/api/src/mail/mail.service.ts
    - apps/api/src/storage/storage.service.ts
    - apps/api/.env.example
    - .env.example
    - .gitignore

key-decisions:
  - "S3 credential defaults moved to env.validation optionalDefaults rather than removed entirely, preserving dev experience"
  - "Company PII keeps hardcoded defaults for dev/test but reads from env vars first"
  - "Non-null assertions used for S3 credentials since env.validation guarantees values"

patterns-established:
  - "Credential isolation: each auth domain (employee, portal) uses its own JWT secret"
  - "Env-driven config: business data (company PII) comes from environment, not source code"
  - "Conditional transport auth: SMTP auth block only applied when credentials are present"

requirements-completed: [SEC-01, SEC-02, SEC-03, SEC-04, SEC-06, SEC-07]

# Metrics
duration: 2min
completed: 2026-03-27
---

# Phase 20 Plan 01: Credential & Environment Hardening Summary

**Separate portal JWT secret, externalize company PII, add SMTP auth, remove S3 hardcoded credentials, fix gitignore and encryption placeholder**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-27T22:01:37Z
- **Completed:** 2026-03-27T22:04:03Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Portal auth now uses dedicated PORTAL_JWT_SECRET, isolating it from employee JWT_ACCESS_SECRET
- Company PII (name, owner, address, phone) externalized to COMPANY_* env vars with dev defaults
- SMTP transporter conditionally includes auth when MAIL_USER/MAIL_PASS are set
- S3 credentials removed from storage service source code, defaults moved to env.validation
- Gitignore now covers workspace-level .env files (apps/api/.env, apps/web/.env)
- FIELD_ENCRYPTION_KEY placeholder changed to non-usable value with generation instructions

## Task Commits

Each task was committed atomically:

1. **Task 1: Separate portal JWT secret and fix .gitignore** - `677806f` (feat)
2. **Task 2: Externalize company PII, add SMTP auth, remove S3 defaults** - `324608f` (feat)

## Files Created/Modified
- `apps/api/src/portal/portal.module.ts` - Changed JwtModule to use PORTAL_JWT_SECRET
- `apps/api/src/portal/strategies/portal-jwt.strategy.ts` - Changed strategy to use PORTAL_JWT_SECRET
- `apps/api/src/common/env.validation.ts` - Added PORTAL_JWT_SECRET to required, S3 keys to optionalDefaults, MAIL/S3 to prodRequired
- `apps/api/src/contracts/contracts.service.ts` - Company PII reads from config with defaults
- `apps/api/src/mail/mail.service.ts` - Conditional SMTP auth block
- `apps/api/src/storage/storage.service.ts` - Removed hardcoded minioadmin defaults
- `apps/api/.env.example` - Added PORTAL_JWT_SECRET, COMPANY_*, MAIL_USER/PASS, fixed FIELD_ENCRYPTION_KEY
- `.env.example` - Same additions as above
- `.gitignore` - Added apps/api/.env and apps/web/.env

## Decisions Made
- S3 credential defaults moved to env.validation optionalDefaults rather than being removed entirely -- this preserves the dev experience while removing secrets from source code
- Company PII retains hardcoded defaults for dev/test environments but reads from env vars first, so production can configure freely
- Used non-null assertions (!) for S3 credentials in storage.service.ts since env.validation guarantees these values exist at startup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error from undefined S3 credentials**
- **Found during:** Task 2 (S3 credentials)
- **Issue:** Removing default values from `config.get<string>('S3_ACCESS_KEY')` made the return type `string | undefined`, breaking the S3Client credentials type
- **Fix:** Added non-null assertion operator (!) since env.validation guarantees these values
- **Files modified:** apps/api/src/storage/storage.service.ts
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** 324608f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal -- type assertion necessary for correctness with the env.validation pattern.

## Issues Encountered
None beyond the TypeScript type issue documented above.

## User Setup Required
None - no external service configuration required. Existing .env files need PORTAL_JWT_SECRET added.

## Next Phase Readiness
- All 6 security findings (SEC-01 through SEC-04, SEC-06, SEC-07) are resolved
- Ready for plan 20-02 (remaining security hardening tasks)
- Production deployments need: PORTAL_JWT_SECRET, COMPANY_* vars, MAIL_USER/MAIL_PASS, real FIELD_ENCRYPTION_KEY

---
*Phase: 20-security-hardening*
*Completed: 2026-03-27*
