---
phase: 29-auth-overhaul-user-management
verified: 2026-03-29T18:00:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
---

# Phase 29: Auth Overhaul & User Management Verification Report

**Phase Goal:** Admin and mobile login use username/password, and admin can create worker accounts that work immediately
**Verified:** 2026-03-29
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | API login endpoint accepts context field to distinguish admin vs mobile logins | VERIFIED | `LoginDto` has `@IsOptional() @IsIn(['admin', 'mobile']) context?` field; controller passes `dto.context ?? 'admin'` to `authService.login` |
| 2 | Admin login tokens are signed with JWT_ACCESS_SECRET and have aud=admin | VERIFIED | `auth.service.ts` L88-90: `context === 'mobile'` uses `JWT_MOBILE_SECRET`, else uses `JWT_ACCESS_SECRET`; payload includes `aud: context` |
| 3 | Mobile login tokens are signed with JWT_MOBILE_SECRET and have aud=mobile | VERIFIED | Same branching logic confirmed; `auth.api.ts` always sends `context: 'mobile'` |
| 4 | MobileJwtStrategy validates tokens signed with JWT_MOBILE_SECRET | VERIFIED | `jwt-mobile.strategy.ts`: `secretOrKey: config.get<string>('JWT_MOBILE_SECRET')!`; checks `payload.aud !== 'mobile'` throws UnauthorizedException |
| 5 | Admin JwtStrategy rejects tokens with aud=mobile | VERIFIED | `jwt.strategy.ts` L22-24: `if (payload.aud === 'mobile') throw new UnauthorizedException('Invalid token audience')` |
| 6 | Worker creation with password sets passwordHash immediately (no setup token flow) | VERIFIED | `users.service.ts` L18-38: fast-create path hashes password with argon2, sets `setupToken: null`, skips mailService |
| 7 | Email is optional for worker creation | VERIFIED | `create-user.dto.ts`: `@IsOptional() @IsEmail() email?: string`; Prisma schema has `email String? @unique` |
| 8 | Admin logs in with username field labeled "Nazwa uzytkownika" (not email) | VERIFIED | `login/page.tsx` L51: `<Label htmlFor="username">Nazwa uzytkownika</Label>`, no email field or `type="email"` |
| 9 | Web BFF sends `{ login: username, password, deviceId, context: 'admin' }` to API | VERIFIED | `api/auth/login/route.ts` L12: `body: JSON.stringify({ login: username, password, deviceId, context: 'admin' })` |
| 10 | Mobile app sends `{ login: username, password, deviceId, context: 'mobile' }` to API | VERIFIED | `auth.api.ts` L10-15: POST body `{ login, password, deviceId, context: 'mobile' }`; `use-auth.ts` accepts `{ username, password }` and passes username as `login` arg |

**Score:** 10/10 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/auth/strategies/jwt-mobile.strategy.ts` | MobileJwtStrategy for mobile token validation | VERIFIED | Exists, exports `MobileJwtStrategy`, uses JWT_MOBILE_SECRET, validates `aud === 'mobile'` |
| `apps/api/src/auth/dto/login.dto.ts` | LoginDto with optional context field | VERIFIED | Contains `context?: 'admin' \| 'mobile'` with `@IsOptional` and `@IsIn` decorators |
| `packages/shared/src/types/user.types.ts` | JwtPayload with aud field | VERIFIED | `aud?: 'admin' \| 'mobile'` present on `JwtPayload` interface |
| `apps/api/src/auth/auth.service.ts` | Context-aware JWT signing | VERIFIED | `login(userId, deviceId, context)` branches on context to select secret and sets `aud: context` in payload |
| `apps/api/src/auth/strategies/jwt.strategy.ts` | Admin strategy rejects mobile tokens | VERIFIED | Early return with UnauthorizedException when `payload.aud === 'mobile'` |
| `apps/api/src/auth/auth.module.ts` | MobileJwtStrategy registered as provider | VERIFIED | L8 import + L25 in providers array |
| `apps/api/src/users/dto/create-user.dto.ts` | Optional email and password fields | VERIFIED | Both `email?` and `password?` decorated with `@IsOptional()` |
| `apps/api/src/users/users.service.ts` | Conditional password/email flow | VERIFIED | `if (dto.password)` branch hashes immediately; else branch uses setup token + conditional email |
| `apps/web/src/app/login/page.tsx` | Username-based login form | VERIFIED | `username` state, "Nazwa uzytkownika" label, `type="text"`, sends `{ username, password }` to BFF |
| `apps/web/src/app/api/auth/login/route.ts` | BFF sends login + context to API | VERIFIED | Destructures `{ username, password }`, sends `{ login: username, password, deviceId, context: 'admin' }` |
| `apps/web/src/app/(admin)/uzytkownicy/page.tsx` | Worker creation form with username + password | VERIFIED | zod schema requires username/password, "Nazwa uzytkownika" and "Haslo tymczasowe" labels, no email field |
| `apps/web/src/hooks/queries/use-users.ts` | useCreateUser accepts username + password | VERIFIED | mutationFn type: `{ name, username, password, role, email? }`; success toast: "Pracownik moze sie zalogowac podanymi danymi" |
| `apps/mobile/app/login.tsx` | Username-based mobile login form | VERIFIED | zod schema uses `username`, "Nazwa uzytkownika" label, "jkowalski" placeholder, no email keyboard |
| `apps/mobile/src/api/auth.api.ts` | Auth API with login field and mobile context | VERIFIED | `login(login, password, deviceId)` sends `{ login, password, deviceId, context: 'mobile' }` |
| `apps/mobile/src/hooks/use-auth.ts` | useLogin accepts username | VERIFIED | mutationFn type: `{ username, password }`, calls `authApi.login(username, password, deviceId)` |
| `apps/api/prisma/schema.prisma` | User.email nullable | VERIFIED | `email String? @unique` — nullable to support worker accounts without email |
| `.env.example` | JWT_MOBILE_SECRET documented | VERIFIED | Line 8: `JWT_MOBILE_SECRET=change-me-mobile-secret-min-32-chars` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `auth.service.ts` | `JWT_MOBILE_SECRET` config | `context` param in `login()` | WIRED | L89: `this.config.get<string>('JWT_MOBILE_SECRET')` when context === 'mobile' |
| `jwt-mobile.strategy.ts` | `JWT_MOBILE_SECRET` | PassportStrategy secretOrKey | WIRED | L17: `secretOrKey: config.get<string>('JWT_MOBILE_SECRET')!` |
| `users.service.ts` | `argon2.hash` | `dto.password` in createUser | WIRED | L19-23: `argon2.hash(dto.password, {...})` inside `if (dto.password)` guard |
| `login/page.tsx` | `/api/auth/login` BFF | fetch POST with username | WIRED | L22-27: fetch to `/api/auth/login` with `{ username, password }` body |
| `api/auth/login/route.ts` | API `/auth/login` | JSON body with login + context | WIRED | L12: JSON body `{ login: username, ..., context: 'admin' }` sent to `${API_URL}/auth/login` |
| `uzytkownicy/page.tsx` | `useCreateUser` hook | form submit with username + password | WIRED | L128: `createUser.mutate(result.data, ...)` where result.data contains `{ username, name, password, role }` |
| `auth.api.ts` (mobile) | API `/auth/login` | POST body with login + context | WIRED | L10-15: `apiClient.post('/auth/login', { login, password, deviceId, context: 'mobile' })` |
| `use-auth.ts` (mobile) | `authApi.login` | mutationFn call | WIRED | L30: `authApi.login(username, password, deviceId)` |
| `auth.controller.ts` | `authService.refresh` | context extracted from expired token | WIRED | L44-46: `extractFromExpiredToken(authHeader)` decodes aud field, passes context to `authService.refresh` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTH-04 | 29-02 | Web admin panel login uses username + password (not email) | SATISFIED | `login/page.tsx` has "Nazwa uzytkownika" text field; BFF maps `username` to `login` field |
| AUTH-05 | 29-03 | Mobile app login uses username + password (not email) | SATISFIED | `login.tsx` zod schema uses `username`; no email field or email keyboard type present |
| AUTH-06 | 29-01 | Admin panel credentials separate from mobile app (different auth context) | SATISFIED | Admin tokens: `JWT_ACCESS_SECRET` + `aud=admin`; Mobile tokens: `JWT_MOBILE_SECRET` + `aud=mobile`; separate strategies enforce separation |
| USER-01 | 29-02 | Admin can create worker accounts with username and temporary password in web panel | SATISFIED | `uzytkownicy/page.tsx` has username + password fields; `useCreateUser` sends `{ username, password, name, role }` |
| USER-02 | 29-01 | Worker creation stores proper passwordHash (not null) | SATISFIED | `users.service.ts` fast-create path: `argon2.hash(dto.password)` stored as `passwordHash`, `setupToken: null` |
| USER-03 | 29-01 | Newly created worker can immediately log in to mobile app with set credentials | SATISFIED | passwordHash is set on creation; mobile login uses `validateUser()` which checks `passwordHash` via argon2.verify |
| USER-04 | 29-01, 29-02 | No email required for worker account creation | SATISFIED | `CreateUserDto.email` is optional; Prisma `email String?` nullable; form has no email field |

All 7 requirements fully satisfied.

---

## Commit Verification

All 6 documented commits confirmed present in git history:

| Commit | Description |
|--------|-------------|
| `430f4f7` | feat(29-01): add auth context separation with MobileJwtStrategy |
| `2d83390` | feat(29-01): worker creation with immediate password, email optional |
| `0fab1a8` | feat(29-02): switch web login from email to username with admin context |
| `219c5bc` | feat(29-02): update worker creation form with username and password fields |
| `3b72669` | feat(29-03): update mobile auth API to send login field with mobile context |
| `8e13306` | feat(29-03): update mobile login screen from email to username UI |

---

## Anti-Patterns Found

None. No TODO/FIXME/PLACEHOLDER comments, no stub implementations, no empty handlers, no email references remaining in mobile login or admin login flows.

---

## Human Verification Required

### 1. End-to-end Admin Login Flow

**Test:** Start the application and attempt to log in to the web admin panel with a valid username and password.
**Expected:** Login succeeds using the "Nazwa uzytkownika" field; admin context token is issued; admin can access protected routes; a mobile token cannot be used for admin access.
**Why human:** Cookie-based auth flow (httpOnly cookies set by BFF) and JWT audience enforcement require a running server to fully validate.

### 2. Worker Creation and Immediate Mobile Login

**Test:** Log in as admin, navigate to "Zarzadzanie uzytkownikami", create a new worker with username "testworker" and password "TestPass123". Then log in to the mobile app with those credentials.
**Expected:** Worker account is created instantly (success toast: "Pracownik moze sie zalogowac podanymi danymi."), and the worker can immediately log in to the mobile app with the set username/password — no email required.
**Why human:** Requires live API + database interaction and mobile device/simulator to verify the full end-to-end flow.

### 3. Token Audience Enforcement

**Test:** Obtain a mobile token (via mobile app login), then attempt to use it as a Bearer token in a direct API call to an admin-protected endpoint.
**Expected:** API returns 401 Unauthorized ("Invalid token audience") because `JwtStrategy` rejects tokens with `aud=mobile`.
**Why human:** Requires HTTP client tool (curl/Postman) and live API to verify cross-context token rejection.

---

## Summary

Phase 29 fully achieves its goal. All three sub-components are correctly implemented and wired:

1. **API auth context separation (Plan 01):** `MobileJwtStrategy` validates mobile tokens with `JWT_MOBILE_SECRET`; admin `JwtStrategy` explicitly rejects mobile tokens via aud check; `auth.service.ts` branches on context to select the correct secret and embed the correct audience claim; the refresh flow correctly propagates context from the expired access token header.

2. **Web admin login overhaul (Plan 02):** Login page uses a text field labeled "Nazwa uzytkownika"; BFF route correctly maps frontend `username` to API `login` field and adds `context: 'admin'`; worker creation form has username + password fields (no email required); `useCreateUser` sends the correct payload with success messaging indicating immediate login capability.

3. **Mobile login overhaul (Plan 03):** Login screen uses username with "Nazwa uzytkownika" label; no email field, no email keyboard type; auth API sends `context: 'mobile'` ensuring JWT_MOBILE_SECRET is used; `useLogin` hook correctly accepts and passes username.

No stub implementations, no orphaned code, no anti-patterns found. All 7 requirements (AUTH-04, AUTH-05, AUTH-06, USER-01, USER-02, USER-03, USER-04) are satisfied with direct implementation evidence.

---

_Verified: 2026-03-29_
_Verifier: Claude (gsd-verifier)_
