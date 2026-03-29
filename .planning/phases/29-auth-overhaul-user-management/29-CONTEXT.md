# Phase 29: Auth Overhaul & User Management - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Switch web admin and mobile login from email to username, implement separate auth contexts (admin vs mobile), and fix worker creation to set password hash immediately so workers can log in right away.

</domain>

<decisions>
## Implementation Decisions

### Web Admin Login
- Change login form in `apps/web/src/app/login/page.tsx` from email field to username field
- Update BFF login route `apps/web/src/app/api/auth/login/route.ts` to send `{ login: username, password, deviceId }` (fix field name mismatch — currently sends `email` but DTO expects `login`)
- Label the field "Nazwa użytkownika" (Polish for "Username")

### Mobile App Login
- Change login form in `apps/mobile/app/login.tsx` from email field to username field with zod schema update
- Update `apps/mobile/src/api/auth.api.ts` to send `{ login: username, password, deviceId }` instead of `{ email, password, deviceId }`
- Label the field "Nazwa użytkownika"

### Auth Context Separation
- Add `audience` claim to JWT payload: `"admin"` for web panel logins, `"mobile"` for mobile app logins
- Add `JWT_MOBILE_SECRET` env var separate from `JWT_ACCESS_SECRET`
- Create `MobileJwtStrategy` Passport strategy using `JWT_MOBILE_SECRET`
- Web admin uses existing `JwtStrategy` with `JWT_ACCESS_SECRET`
- Auth service generates tokens with appropriate secret based on login context (determined by new `context` field in login DTO or separate endpoints)
- Approach: add `context: "admin" | "mobile"` optional field to LoginDto — web BFF sends `context: "admin"`, mobile sends `context: "mobile"`
- `JwtPayload` shared type gets optional `aud` field
- Guard: admin endpoints check `aud === "admin"`, mobile endpoints accept `"mobile"`

### Worker Account Creation
- Modify `users.service.ts` `createUser` to accept optional `password` field
- When password is provided: hash with argon2 and set `passwordHash` directly (no setup token, no email)
- When password is NOT provided: keep existing setup-token + email flow (backward compatible)
- Update web admin form in `uzytkownicy/page.tsx` to include username + password fields for creating workers
- Remove email as required field for worker creation (make it optional in CreateUserDto)
- Worker = role EMPLOYEE, can immediately log in to mobile app after creation

### Claude's Discretion
- Whether to use separate login endpoints (/auth/login/admin, /auth/login/mobile) vs single endpoint with context field
- Exact argon2 configuration (use existing patterns from codebase)
- Form validation details (min password length, username constraints)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/app/login/page.tsx` — simple React state form, easy to modify
- `apps/mobile/app/login.tsx` — react-hook-form + zod, structured form
- `auth.service.ts` — clean `validateUser` + `generateTokens` methods
- `users.service.ts` — argon2 hashing already used for setup tokens
- JWT strategy in `jwt.strategy.ts` — can be cloned for MobileJwtStrategy

### Established Patterns
- Web BFF proxy: cookies httpOnly, BFF reads cookies and forwards as Bearer header
- Mobile: direct API calls, tokens in SecureStore
- User roles: ADMIN, EMPLOYEE, CUSTOMER via enum
- Password hashing: argon2id via `import * as argon2 from 'argon2'`
- Refresh tokens: opaque random bytes stored hashed in Redis

### Integration Points
- `LoginDto` (`login.dto.ts`) — already accepts `login` field (username or email)
- `auth.module.ts` — JwtModule registration, needs second strategy
- `jwt.strategy.ts` — Bearer token extraction, `validate()` method
- `packages/shared/src/types/user.types.ts` — JwtPayload type
- `.env` / `.env.example` — needs JWT_MOBILE_SECRET
- Web BFF sends body as `{ email: ... }` but DTO expects `{ login: ... }` — MUST fix

</code_context>

<specifics>
## Specific Ideas

- Admin panel credentials SEPARATE from mobile (user explicit requirement)
- Existing admin@kitek.pl already has username "admin" (from Phase 28)
- No email required for worker creation (explicit requirement)
- Worker can immediately log in after admin creates account (no setup flow)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
