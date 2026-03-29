# Phase 28: Bug Fixes & Auth Foundation - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix two critical bugs (Użytkownicy tab logout, signature canvas clearing) and add username field to the auth system at the API level, including data migration for the existing admin account.

</domain>

<decisions>
## Implementation Decisions

### BUG-01: Użytkownicy Tab Logout Fix
- Root cause: Next.js middleware at `apps/web/src/middleware.ts` redirects to /login when `access_token` cookie is absent (expired via maxAge:1800), without checking for `refresh_token` — prevents client-side refresh from ever running
- Fix approach: Modify middleware to allow navigation when `refresh_token` cookie exists, letting the page load and `apiClient` handle token refresh on 401
- Secondary fix: Correct `device_id` cookie path in `apps/web/src/app/api/auth/refresh/route.ts` line 59 from `'/'` to `'/api/auth'` for consistency with login route

### BUG-02: Signature Canvas Reset
- Root cause: `useEffect` in `SignatureScreen.tsx` has `stepLabel` in dependency array, causing orientation unlock/relock cycle on every step change
- Fix approach: Split into two effects — one for orientation lock (mount/unmount only), one for explicit canvas clear on `stepLabel` change via `signatureRef.current?.clearSignature()`
- Canvas should clear between steps (intentional behavior per requirements)

### Auth Username Field
- Add `username String? @unique` to User model in Prisma schema (nullable initially for migration safety)
- Modify `validateUser` in auth.service.ts to look up by email first, then by username if no email match
- Change login DTO from `@IsEmail() email` to `@IsString() login` field that accepts either
- Update `local.strategy.ts` usernameField to match new DTO field name
- Data migration: set username="admin" for admin@kitek.pl in seed/migration
- Add username to CreateUserDto and userSelectFields

### Claude's Discretion
- Exact Prisma migration naming convention
- Whether to use a single `findFirst` with OR clause vs sequential lookups for username/email
- Login DTO field naming (login vs identifier vs credential)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apiClient` in web app handles 401 → refresh → retry cycle (works correctly once page loads)
- `SignatureScreen.tsx` already has `handleClear()` method and `signatureRef`
- Prisma migration infrastructure is well-established (many prior migrations)
- `auth.service.ts` has clean `validateUser` method to extend

### Established Patterns
- NestJS auth: Passport local strategy + JWT guards
- Web BFF proxy: `apps/web/src/app/api/[...path]/route.ts` forwards to NestJS API
- Cookie-based auth: httpOnly cookies for access_token, refresh_token, device_id
- Prisma: `@unique` constraints, optional fields with `?`

### Integration Points
- `middleware.ts` — gate for all admin routes (matcher excludes /api, /login, /_next, /static)
- `local.strategy.ts` — Passport strategy configuration
- `login.dto.ts` — request validation for login endpoint
- `auth.service.ts` — user lookup and password verification
- `schema.prisma` User model — shared across entire API
- `SignatureScreen.tsx` — used during contract signing flow (4 signatures)

</code_context>

<specifics>
## Specific Ideas

- Existing admin@kitek.pl account must get username "admin" (explicit user requirement)
- Username field should be unique but nullable (not all existing users have usernames yet)
- Login must accept EITHER username OR email (backward compatibility)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
