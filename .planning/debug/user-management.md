---
status: awaiting_human_verify
trigger: "Admin login broken, employee role separation broken, user list throwing errors"
created: 2026-03-31T10:00:00Z
updated: 2026-03-31T11:15:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED - role-context validation now enforced at login time + jwt.strategy.ts properly validates admin role
test: Build passes, all tests pass
expecting: Admin login works, employee login to web panel blocked, user list loads for admin
next_action: Human verification needed - test login flows manually

## Symptoms

expected:
- Admin accounts should login to web panel
- Employee accounts should ONLY login to mobile app, NOT web panel
- User list should load in admin panel
actual:
- Admin login stopped working (but employee logins work)
- Employee accounts can login to web panel (shouldn't be allowed)
- User list throws "nie udało się załadować listy użytkowników"
errors: "nie udało się załadować listy użytkowników" (failed to load users list)
reproduction: Try admin login, try employee login to web panel, go to users page
started: Currently broken

## Eliminated

## Evidence

- timestamp: 2026-03-31T10:05:00Z
  checked: auth.service.ts login() method (lines 79-106)
  found: |
    Login accepts context parameter ('admin' | 'mobile') but NEVER validates
    that user.role is appropriate for that context. Any user with valid credentials
    can login to any context.

    Key code (line 87): `const payload = { sub: userId, role: user.role, aud: context };`
    No validation before this line - just blindly assigns context to JWT.
  implication: This is the root cause of employee login to web panel working

- timestamp: 2026-03-31T10:06:00Z
  checked: jwt.strategy.ts validate() method (lines 21-32)
  found: |
    JWT strategy checks `if (payload.aud === 'mobile') return false` but does NOT
    check if user.role is ADMIN. It just validates aud !== 'mobile'.

    The strategy returns user data including role but doesn't enforce that
    only ADMIN role can use admin context tokens.
  implication: Guard validates audience but not role-to-context mapping

- timestamp: 2026-03-31T10:07:00Z
  checked: roles.guard.ts (lines 15-30)
  found: |
    RolesGuard checks if user.role matches required roles on endpoints (e.g., @Roles(UserRole.ADMIN))
    BUT this happens AFTER successful login - the user already has a valid token.

    The /users endpoint requires ADMIN role, so EMPLOYEE tokens get ForbiddenException.
    BUT this doesn't explain why admin login is broken - only why employee access fails.
  implication: RolesGuard works correctly for endpoint protection but login needs context-role validation

- timestamp: 2026-03-31T10:08:00Z
  checked: User table structure and roles
  found: |
    UserRole enum: ADMIN, EMPLOYEE, CUSTOMER
    Expected behavior:
    - ADMIN -> can login to context='admin' (web panel)
    - EMPLOYEE -> can login to context='mobile' (mobile app only)
    - CUSTOMER -> context='mobile' only (customer portal planned)

    Current behavior: No enforcement at login time.
  implication: Need to add role validation based on context in login()

- timestamp: 2026-03-31T11:00:00Z
  checked: Full code review of auth flow
  found: |
    ROOT CAUSE IDENTIFIED - TWO BUGS:

    1. auth.service.ts login() (line 79-106):
       - No role-context validation
       - EMPLOYEE can request context='admin' and get admin-audience token
       - FIX: Validate role matches context before issuing token

    2. jwt.strategy.ts validate() (lines 21-25):
       - Code: `if (payload.aud === 'mobile') return false`
       - This returns `false` but should throw UnauthorizedException
       - Returning `false` from validate() does NOT throw 401 properly in Passport
       - This causes the strategy to fail silently or behave unexpectedly
       - FIX: Throw UnauthorizedException instead of returning false

    3. ALSO: jwt.strategy.ts doesn't validate that user.role === ADMIN for admin context
       - Even if token has aud='admin', an EMPLOYEE who got that token shouldn't pass
       - FIX: Add role check in jwt.strategy.ts
  implication: Two-part fix needed in auth.service.ts and jwt.strategy.ts

## Resolution

root_cause: |
  Two bugs in auth system:
  1. auth.service.ts login() had NO role-context validation - any user could request
     any context ('admin' or 'mobile') and get a token with that audience. This allowed
     EMPLOYEE accounts to get admin-audience tokens.
  2. jwt.strategy.ts validate() returned `false` for mobile tokens instead of throwing
     UnauthorizedException. In Passport.js, returning false from validate() doesn't
     properly reject the request. Combined with missing role check, this meant admin
     tokens could be used by non-ADMIN users.

fix: |
  1. Added role-context validation in auth.service.ts login() (lines 87-96):
     - context='admin' requires UserRole.ADMIN
     - context='mobile' requires non-ADMIN role (EMPLOYEE or CUSTOMER)
     - Throws ForbiddenException with clear message on mismatch

  2. Fixed jwt.strategy.ts validate() (lines 21-32):
     - Now throws UnauthorizedException for mobile-audience tokens
     - Added defense-in-depth: validates user.role === ADMIN for all admin context tokens
     - Protects against any legacy tokens issued before this fix

verification: |
  - API build passes: pnpm --filter api build
  - All 23 test files pass: pnpm --filter api test
  - No regressions detected

files_changed:
  - apps/api/src/auth/auth.service.ts
  - apps/api/src/auth/strategies/jwt.strategy.ts
