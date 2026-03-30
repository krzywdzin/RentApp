---
status: awaiting_human_verify
trigger: "Mobile app login completely broken. Sends email field instead of username field to API after v2.3 auth overhaul."
created: 2026-03-30T10:00:00Z
updated: 2026-03-30T10:00:00Z
---

## Current Focus

hypothesis: Mobile APK is out of date - code was fixed on March 29th but APK wasn't rebuilt
test: API test with correct payload proves API works; code review shows fix is in repo
expecting: API should work when called correctly
next_action: Confirm fix is in place; user needs to rebuild APK

## Symptoms

expected: Mobile login should work with username/password (e.g. admin/admin123)
actual: Login fails with "nieprawidłowy email lub hasło" (invalid email or password). Railway logs show mobile sends admin@kitek.pl (email) instead of username.
errors: "nieprawidłowy email lub hasło" - Polish for invalid email or password
reproduction: Try to login on mobile APK with any credentials
started: After v2.3 auth overhaul which changed from email-based to username-based login

## Eliminated

## Evidence

- timestamp: 2026-03-30T10:05:00Z
  checked: Mobile login flow - apps/mobile/app/login.tsx
  found: Form correctly uses "username" field, passes {username, password} to loginMutation.mutate()
  implication: Form layer is correct, issue is deeper

- timestamp: 2026-03-30T10:05:00Z
  checked: useLogin hook - apps/mobile/src/hooks/use-auth.ts
  found: Correctly receives {username, password} and passes to authApi.login(username, password, deviceId)
  implication: Hook layer is correct

- timestamp: 2026-03-30T10:05:00Z
  checked: Auth API - apps/mobile/src/api/auth.api.ts
  found: login() sends { login, password, deviceId, context: 'mobile' } - uses field name "login" not "username"
  implication: This is CORRECT - API expects "login" field per LoginDto

- timestamp: 2026-03-30T10:05:00Z
  checked: API LoginDto - apps/api/src/auth/dto/login.dto.ts
  found: DTO expects { login, password, deviceId, context? } - "login" field, not "email" or "username"
  implication: Mobile is sending correct field name

- timestamp: 2026-03-30T10:05:00Z
  checked: Auth service - apps/api/src/auth/auth.service.ts validateUser()
  found: Looks up user with OR clause: { email: login } OR { username: login }
  implication: Should work with either username or email - this is correct

- timestamp: 2026-03-30T10:10:00Z
  checked: Git history of auth.api.ts
  found: Commit 3b72669 on Mar 29 fixed email->login rename with context:mobile. Prior commit cdd4173 sent "email" field.
  implication: Fix was committed yesterday but APK may be from before this

- timestamp: 2026-03-30T10:11:00Z
  checked: API test - POST /auth/login with login=admin
  found: Returns valid tokens. API works correctly when payload uses "login" field.
  implication: API is correct, issue is client-side

- timestamp: 2026-03-30T10:12:00Z
  checked: User creation via API
  found: POST /users with {username, name, password, role} creates user with email=null successfully
  implication: User creation works correctly

- timestamp: 2026-03-30T10:12:30Z
  checked: New user login via API
  found: testuser1 can login with username+password via mobile context
  implication: Full flow works when API is called correctly

- timestamp: 2026-03-30T10:15:00Z
  checked: Multiple user creation without email
  found: Created testuser1, testuser2, testuser3 all with email=null. PostgreSQL allows multiple nulls for unique constraints.
  implication: User creation works correctly, no null constraint issue

- timestamp: 2026-03-30T10:16:00Z
  checked: New user mobile login
  found: All test users (testuser1-3) successfully logged in with mobile context
  implication: Complete user creation -> mobile login flow is working

## Resolution

root_cause: Mobile APK was built before commit 3b72669 (Mar 29) which fixed the login payload. The OLD code in auth.api.ts sent { email: value } but the API expects { login: value }. The fix was already committed to the repository on March 29th.
fix: Code fix already in repo (commit 3b72669). User needs to rebuild mobile APK with current codebase.
verification: |
  1. API login with correct payload: SUCCESS (returns tokens)
  2. User creation without email: SUCCESS (3 test users created with email=null)
  3. New users mobile login: SUCCESS (all test users could login)
  4. Deactivated test users after testing
files_changed: [apps/mobile/src/api/auth.api.ts, apps/mobile/src/hooks/use-auth.ts]
