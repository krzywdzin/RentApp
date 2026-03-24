---
phase: 09-customer-portal-and-cepik
plan: 03
subsystem: api, auth
tags: [nestjs, passport, jwt, argon2, magic-link, portal, prisma, e2e]

requires:
  - phase: 09-01
    provides: "Customer portalToken/portalTokenExpiresAt fields, shared Portal types"
provides:
  - "PortalModule with magic link auth exchange and portal JWT strategy"
  - "Portal data endpoints (GET /portal/me, /portal/rentals, /portal/rentals/:id)"
  - "Contract signing flow generates portal token and includes URL in email"
  - "Full portal e2e test suite (13 tests, no stubs)"
affects: [09-04-integration]

tech-stack:
  added: []
  patterns: ["Separate portal-jwt passport strategy for customer auth (isolated from admin jwt)", "Magic link token exchange with argon2 hashing", "Portal endpoints use @Public + PortalAuthGuard to bypass global JwtAuthGuard"]

key-files:
  created:
    - apps/api/src/portal/portal.module.ts
    - apps/api/src/portal/portal.service.ts
    - apps/api/src/portal/portal.controller.ts
    - apps/api/src/portal/portal-auth.controller.ts
    - apps/api/src/portal/strategies/portal-jwt.strategy.ts
    - apps/api/src/portal/guards/portal-auth.guard.ts
    - apps/api/src/portal/dto/token-exchange.dto.ts
  modified:
    - apps/api/src/app.module.ts
    - apps/api/src/contracts/contracts.service.ts
    - apps/api/src/contracts/contracts.module.ts
    - apps/api/src/mail/mail.service.ts
    - apps/api/test/portal.e2e-spec.ts

key-decisions:
  - "Portal controller uses @Public + @UseGuards(PortalAuthGuard) to bypass global JwtAuthGuard while enforcing portal-specific auth"
  - "Portal JWT uses same JWT_ACCESS_SECRET as admin JWT but with type:portal claim for isolation"
  - "PortalService injected into ContractsService via PortalModule import for token generation in signing flow"

patterns-established:
  - "Portal auth pattern: @Public decorator + custom guard for endpoints requiring different auth than global JwtAuthGuard"

requirements-completed: [PORTAL-01, PORTAL-02]

duration: 16min
completed: 2026-03-24
---

# Phase 9 Plan 03: Portal API Module Summary

**Magic link authentication with argon2 token hashing, portal JWT strategy, rental data endpoints with presigned PDF URLs, and contract signing integration with portal link in email**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-24T21:20:44Z
- **Completed:** 2026-03-24T21:37:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- PortalModule with separate portal-jwt passport strategy isolated from admin auth
- Token exchange endpoint (POST /portal/auth/exchange) with argon2 verification and Polish error messages
- Portal data endpoints returning rental list and detail with presigned PDF download URLs
- Contract signing flow generates portal magic link token and includes URL in email with Polish text
- Full e2e test suite: 13 tests covering auth exchange, rental access, cross-customer isolation, return data

## Task Commits

Each task was committed atomically:

1. **Task 1: PortalModule with auth exchange, JWT strategy, and data endpoints** - `8209589` (feat)
2. **Task 2: Magic link in contract signing flow, mail update, and portal e2e tests** - `3a1f74d` (feat)

## Files Created/Modified
- `apps/api/src/portal/portal.module.ts` - Module with PassportModule, JwtModule, exports PortalService
- `apps/api/src/portal/portal.service.ts` - Token generation (argon2), exchange, rental data access
- `apps/api/src/portal/portal.controller.ts` - GET /portal/me, /portal/rentals, /portal/rentals/:id
- `apps/api/src/portal/portal-auth.controller.ts` - POST /portal/auth/exchange (public endpoint)
- `apps/api/src/portal/strategies/portal-jwt.strategy.ts` - Separate passport strategy named portal-jwt
- `apps/api/src/portal/guards/portal-auth.guard.ts` - Guard using portal-jwt strategy
- `apps/api/src/portal/dto/token-exchange.dto.ts` - Validation DTO for token exchange
- `apps/api/src/app.module.ts` - Added PortalModule import
- `apps/api/src/contracts/contracts.service.ts` - Portal token generation in sign() method
- `apps/api/src/contracts/contracts.module.ts` - Added PortalModule import
- `apps/api/src/mail/mail.service.ts` - Added portalUrl parameter with Polish portal link section
- `apps/api/test/portal.e2e-spec.ts` - 13 e2e tests replacing todo stubs

## Decisions Made
- Portal controller uses @Public + @UseGuards(PortalAuthGuard) pattern to bypass global JwtAuthGuard while enforcing portal-specific authentication
- Portal JWT uses same JWT_ACCESS_SECRET as admin JWT but with type:portal claim -- PortalJwtStrategy validates claim to prevent admin JWTs from accessing portal
- PortalService injected into ContractsService via module import for generating portal tokens during contract signing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vehicle VIN and field name in e2e tests**
- **Found during:** Task 2 (e2e test creation)
- **Issue:** Plan-suggested VIN was too short and field name was `transmissionType` instead of `transmission`
- **Fix:** Used valid 17-char VIN and correct field name matching vehicle schema
- **Files modified:** apps/api/test/portal.e2e-spec.ts
- **Verification:** All 13 tests pass
- **Committed in:** 3a1f74d (Task 2 commit)

**2. [Rule 1 - Bug] Fixed invalid PESEL in second customer test data**
- **Found during:** Task 2 (e2e test creation)
- **Issue:** PESEL '52070803628' failed checksum validation
- **Fix:** Used validated PESEL '92071314764' from existing test constants
- **Files modified:** apps/api/test/portal.e2e-spec.ts
- **Verification:** Customer creation succeeds, all tests pass
- **Committed in:** 3a1f74d (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs in test data)
**Impact on plan:** Test data corrections only. No scope change, all planned functionality delivered.

## Issues Encountered
- Contracts e2e test was already failing before our changes (pre-existing SmsService mock missing) -- not caused by portal changes, logged as out-of-scope

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Portal API complete and tested, ready for Plan 04 integration
- PortalService exports available for any module that needs portal token generation
- Contract signing flow automatically generates and emails portal magic links

---
*Phase: 09-customer-portal-and-cepik*
*Completed: 2026-03-24*
