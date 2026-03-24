---
phase: 09-customer-portal-and-cepik
verified: 2026-03-24T22:15:00Z
status: passed
score: 19/19 must-haves verified
re_verification: false
---

# Phase 9: Customer Portal and CEPiK Verification Report

**Phase Goal:** Customers can view their rental information through a self-service portal, and the system verifies driver licenses through CEPiK 2.0 before contract signing
**Verified:** 2026-03-24T22:15:00Z
**Status:** PASSED
**Re-verification:** No — initial verification
**Human checkpoint:** Approved (portal + CEPiK flows tested end-to-end)

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CepikVerification model exists in DB with correct fields and relations | VERIFIED | `schema.prisma` line 456: `model CepikVerification` with customerId, rentalId, checkedById, overriddenById, status, result, dual User relations |
| 2 | Customer has portalToken and portalTokenExpiresAt fields | VERIFIED | `schema.prisma` lines 213-214: `portalToken String?` and `portalTokenExpiresAt DateTime?` |
| 3 | Vehicle has requiredLicenseCategory defaulting to B | VERIFIED | `schema.prisma` line 135: `requiredLicenseCategory String @default("B")` |
| 4 | Shared types for CEPiK and portal are importable from @rentapp/shared | VERIFIED | `packages/shared/src/index.ts` lines 14-17 export all four modules; `cepik.types.ts` and `portal.types.ts` fully substantive |
| 5 | Employee can verify a driver license and receive pass/fail result | VERIFIED | `CepikService.verify()` calls stub, persists result, returns `CepikVerificationDto` with status PASSED/FAILED |
| 6 | Admin can override a failed CEPiK verification with a reason | VERIFIED | `POST /cepik/verify/:id/override` restricted to `UserRole.ADMIN`, calls `overrideVerification()`, sets status OVERRIDDEN with reason/adminId/timestamp |
| 7 | Employee cannot override — only admin | VERIFIED | Controller: `@Roles(UserRole.ADMIN)` on override endpoint; e2e test line 332-349 asserts 403 for EMPLOYEE |
| 8 | Stub returns configurable results (source: STUB) | VERIFIED | `cepik.service.ts` line 40: `source: CepikVerificationSource.STUB`; stub comment on line 9 |
| 9 | Customer can exchange a magic link token for a portal JWT | VERIFIED | `PortalService.exchangeToken()` with argon2.verify, signs `{ sub: customerId, type: 'portal' }` JWT; `POST /portal/auth/exchange` is `@Public()` |
| 10 | Expired magic link token is rejected with Polish error message | VERIFIED | `portal.service.ts` line 64-66: throws `UnauthorizedException('Link wygasl. Skontaktuj sie z wypozyczalnia.')`; e2e test line 304-321 asserts 401 + message contains 'wygasl' |
| 11 | Portal JWT grants access to portal endpoints only | VERIFIED | `PortalJwtStrategy` validates `payload.type !== 'portal'` returns null; strategy name `'portal-jwt'` is separate from admin `'jwt'` |
| 12 | Customer can list all their rentals through portal API | VERIFIED | `GET /portal/rentals` returns `PortalRentalDto[]` with vehicle include, filtered by customerId; presigned PDF URLs generated via StorageService |
| 13 | Customer can view rental detail with contract PDF download URL | VERIFIED | `GET /portal/rentals/:id` verifies ownership (`rental.customerId !== customerId` → NotFoundException), returns presigned PDF URL |
| 14 | Magic link URL is included in contract email after signing | VERIFIED | `contracts.service.ts` lines 336-362: generates portal token in `sign()` method, passes `portalUrl` to `sendContractEmail`; mail template includes Polish section |
| 15 | Portal token is hashed before storage (argon2) | VERIFIED | `portal.service.ts` line 32: `argon2.hash(rawToken)` before DB update |
| 16 | Customer clicking magic link reaches the portal and token is exchanged | VERIFIED | `token-exchange.tsx` reads `token` + `cid` from URL params, POSTs to `/api/portal/auth/exchange`, strips params via `replaceState` on success |
| 17 | Customer sees list of all their rentals in Polish | VERIFIED | `portal/page.tsx`: renders `<h1>Twoje wynajmy</h1>`, RentalCard with Polish status labels (Aktywny, Zwrocony, etc.), "Brak wynajmow." empty state |
| 18 | Portal does not show admin sidebar or navigation | VERIFIED | `(portal)/layout.tsx`: minimal layout with PortalHeader only; separate route group from `(admin)` |
| 19 | No photos are shown in portal | VERIFIED | `rental-detail-view.tsx`: no photo-related imports or rendering; only vehicle, dates, pricing, contract, and return inspection sections |

**Score:** 19/19 truths verified

---

## Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `apps/api/prisma/schema.prisma` | CepikVerification model, Customer portal fields, Vehicle license category | VERIFIED | All 3 additions present and substantive |
| `packages/shared/src/types/cepik.types.ts` | CepikVerificationResult, CepikVerificationStatus, CepikVerificationSource | VERIFIED | 41 lines, fully typed const objects and interfaces |
| `packages/shared/src/types/portal.types.ts` | PortalRentalDto, PortalCustomerInfo | VERIFIED | 25 lines, all PortalRentalDto fields present |
| `packages/shared/src/schemas/cepik.schemas.ts` | verifyLicenseSchema, overrideCepikSchema | VERIFIED | Exists, exported via index.ts |
| `packages/shared/src/schemas/portal.schemas.ts` | portalTokenExchangeSchema | VERIFIED | Exists, exported via index.ts |
| `packages/shared/src/index.ts` | Barrel exports for cepik and portal | VERIFIED | Lines 14-17 export all 4 modules |
| `apps/api/src/cepik/cepik.service.ts` | CepikService with stub verify and override | VERIFIED | 172 lines; verifyDriverLicense, verify (combined), createVerification, overrideVerification, findByRental, findOne |
| `apps/api/src/cepik/cepik.controller.ts` | POST /cepik/verify, POST /cepik/verify/:id/override, GET /cepik/verify/rental/:rentalId | VERIFIED | 80 lines; EMPLOYEE+ADMIN for verify, ADMIN-only for override, audit metadata attached |
| `apps/api/src/cepik/cepik.module.ts` | CepikModule exporting CepikService | VERIFIED | 10 lines; controllers, providers, exports correct |
| `apps/api/src/portal/portal.service.ts` | generatePortalToken, exchangeToken, getRentals, getRentalDetail, getCustomerInfo | VERIFIED | 225 lines; all methods substantive with argon2, JwtService, StorageService |
| `apps/api/src/portal/portal-auth.controller.ts` | POST /portal/auth/exchange (public) | VERIFIED | 17 lines; @Public(), @HttpCode(200), delegates to exchangeToken |
| `apps/api/src/portal/portal.controller.ts` | GET /portal/me, /portal/rentals, /portal/rentals/:id | VERIFIED | 27 lines; @Public + @UseGuards(PortalAuthGuard) pattern |
| `apps/api/src/portal/strategies/portal-jwt.strategy.ts` | Separate 'portal-jwt' passport strategy | VERIFIED | 22 lines; validates type:'portal' claim to prevent admin JWT reuse |
| `apps/api/src/portal/guards/portal-auth.guard.ts` | PortalAuthGuard using portal-jwt | VERIFIED | 6 lines; AuthGuard('portal-jwt') |
| `apps/api/src/portal/portal.module.ts` | PortalModule with PassportModule, JwtModule, exports PortalService | VERIFIED | 26 lines; proper JwtModule.registerAsync, PortalJwtStrategy as provider |
| `apps/web/src/app/(portal)/layout.tsx` | Minimal portal layout, no admin chrome, no-referrer | VERIFIED | 21 lines; Next.js Metadata.referrer='no-referrer', PortalHeader, max-w-3xl container |
| `apps/web/src/app/(portal)/portal/page.tsx` | Rental list page with TokenExchange and RentalCard | VERIFIED | 67 lines; TokenExchange, usePortalRentals, Polish labels, skeleton states |
| `apps/web/src/app/(portal)/portal/[rentalId]/page.tsx` | Rental detail page with back navigation | VERIFIED | 43 lines; "Powrot do listy" button, usePortalRental, RentalDetailView |
| `apps/web/src/app/api/portal/auth/exchange/route.ts` | BFF token exchange, sets httpOnly portal_token cookie | VERIFIED | 26 lines; proxies to NestJS, sets httpOnly+secure+sameSite=lax cookie scoped to /portal |
| `apps/web/src/app/api/portal/[...path]/route.ts` | Portal BFF proxy with portal_token cookie | VERIFIED | 26 lines; reads portal_token cookie, forwards as Bearer Authorization |
| `apps/web/src/hooks/use-portal-auth.ts` | Portal auth hook: exchangeToken, isAuthenticated, customerName | VERIFIED | 86 lines; checks /api/portal/me, Polish error messages |
| `apps/web/src/hooks/use-portal-rentals.ts` | usePortalRentals + usePortalRental TanStack Query hooks | VERIFIED | 36 lines; both hooks with proper query keys and enabled guard |
| `apps/web/src/middleware.ts` | Portal path bypass from admin auth redirect | VERIFIED | Lines 7-9: pathname.startsWith('/portal') returns NextResponse.next() |
| `apps/api/src/cepik/cepik.service.spec.ts` | 10 real unit tests with assertions | VERIFIED | 160 lines; no it.todo() stubs; 10 named tests with expect() assertions |
| `apps/api/test/cepik.e2e-spec.ts` | 10 e2e tests for CEPIK-01 and CEPIK-02 | VERIFIED | 403 lines; no it.todo() stubs; covers verify, override, role enforcement (403), 401 |
| `apps/api/test/portal.e2e-spec.ts` | 13 e2e tests for PORTAL-01 and PORTAL-02 | VERIFIED | 455 lines; no it.todo() stubs; covers token exchange, expiry (401), cross-customer isolation (404), PII exclusion |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `cepik.controller.ts` | `cepik.service.ts` | DI injection | WIRED | Constructor injects CepikService; all endpoints delegate to service methods |
| `cepik.service.ts` | `prisma/schema.prisma` | `prisma.cepikVerification` | WIRED | `createVerification()`, `overrideVerification()`, `findByRental()`, `findOne()` all call `this.prisma.cepikVerification.*` |
| `app.module.ts` | `cepik/cepik.module.ts` | imports array | WIRED | Line 26 imports, line 63 in imports array |
| `contracts/contracts.service.ts` | `mail/mail.service.ts` | sendContractEmail with portalUrl | WIRED | `portalUrl` parameter passed at line 362; mail template has Polish portal section |
| `portal-auth.controller.ts` | `portal.service.ts` | exchangeToken method | WIRED | Constructor injection; `exchange()` calls `this.portalService.exchangeToken()` |
| `portal.controller.ts` | `portal/guards/portal-auth.guard.ts` | @UseGuards(PortalAuthGuard) | WIRED | Controller decorator `@UseGuards(PortalAuthGuard)` on class level |
| `token-exchange.tsx` | `apps/web/src/app/api/portal/auth/exchange/route.ts` | fetch POST | WIRED | `use-portal-auth.ts` calls `fetch('/api/portal/auth/exchange', { method: 'POST' })` |
| `apps/web/src/app/api/portal/[...path]/route.ts` | `portal.controller.ts` | proxy with portal_token cookie | WIRED | Reads `portal_token` cookie, sets Bearer Authorization, proxies to `${API_URL}/portal/...` |
| `middleware.ts` | `(portal)/layout.tsx` | matcher excluding /portal from admin auth | WIRED | `pathname.startsWith('/portal')` returns early; portal route group has separate layout |
| `contracts/contracts.module.ts` | `portal/portal.module.ts` | imports array | WIRED | Line 5 imports PortalModule, line 12 in imports array |
| `app.module.ts` | `portal/portal.module.ts` | imports array | WIRED | Line 27 imports, line 64 in imports array |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CEPIK-01 | 09-01, 09-02 | System weryfikuje uprawnienia kierowcy przez CEPiK 2.0 API (status zawieszenia, ważność prawa jazdy) przed podpisaniem umowy | SATISFIED | `POST /cepik/verify` returns full verification result (licenseValid, licenseSuspended, licenseCategories, categoryMatch) with PASSED/FAILED status; stub clearly marked for replacement |
| CEPIK-02 | 09-01, 09-02 | Weryfikacja CEPiK jest asynchroniczna z ręcznym fallbackiem — wynajem może być realizowany bez niej | SATISFIED | `POST /cepik/verify/:id/override` (ADMIN only) with required reason updates status to OVERRIDDEN; fallback enables contract signing to proceed |
| PORTAL-01 | 09-01, 09-03, 09-04 | Klient może zalogować się do prostego portalu web przez magic link (link w emailu z umową) | SATISFIED | Full magic link flow: token generated in contract signing → URL in email → TokenExchange component exchanges for portal JWT stored as httpOnly cookie → URL cleaned via replaceState |
| PORTAL-02 | 09-01, 09-03, 09-04 | Klient widzi swoje aktywne wynajmy, historię, terminy zwrotu i może pobrać PDF umowy | SATISFIED | Portal list + detail pages show vehicle info, dates, status badges in Polish, pricing in PLN; PDF download via presigned URL; return inspection data when status=RETURNED |

All 4 requirements satisfied. No orphaned requirements found for Phase 9 in REQUIREMENTS.md.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/api/src/cepik/cepik.service.ts` | 9 | `// STUB: Replace with real CEPiK Carriers API...` | INFO | Expected and documented — real API requires Ministry approval; stub is intentional and clearly marked for replacement |

No blockers or warnings found. The STUB comment is a documented design decision, not an anti-pattern.

---

## Commit Verification

All 8 task commits documented in summaries confirmed present in git log:

| Commit | Plan | Description |
|--------|------|-------------|
| `c5ced3a` | 09-01 Task 1 | feat: add CEPiK verification schema and shared types |
| `65d08d4` | 09-01 Task 2 | test: add Wave 0 test stubs for CEPiK and Portal |
| `e55565a` | 09-02 Task 1 | feat: add CepikService stub, controller, and module |
| `bc12169` | 09-02 Task 2 | test: add CEPiK unit and e2e tests |
| `8209589` | 09-03 Task 1 | feat: PortalModule with magic link auth, JWT strategy, and data endpoints |
| `3a1f74d` | 09-03 Task 2 | feat: magic link in contract flow, mail update, and portal e2e tests |
| `f058396` | 09-04 Task 1 | feat: BFF routes, middleware update, portal layout and token exchange |
| `65bb10b` | 09-04 Task 2 | feat: portal rental list and detail pages with Polish UI |

---

## Human Verification Required

None. Human checkpoint (Task 3, Plan 04) was already approved before this verification was initiated. The end-to-end flow — portal loading via magic link, rental display in Polish, PDF downloads, mobile responsive layout, expired link error, CEPiK verify and override endpoints — was confirmed by human testing.

---

## Summary

Phase 9 goal is **fully achieved**. Both subsystems are complete and wired:

**CEPiK Verification (CEPIK-01, CEPIK-02):** The stub service returns configurable PASSED/FAILED results based on category match, persists every verification in the database, and provides an ADMIN-only override endpoint with mandatory reason and full audit trail. The stub comment explicitly documents the path to replace it with the real CEPiK Carriers API when Ministry access is granted.

**Customer Portal (PORTAL-01, PORTAL-02):** The full magic link flow is operational end-to-end: contract signing generates an argon2-hashed portal token → URL included in Polish contract email → customer clicks link → `TokenExchange` component exchanges token for portal JWT (stored as httpOnly cookie, URL cleaned) → rental list + detail pages render in Polish with vehicle info, status badges, pricing in PLN, contract PDF download, and return inspection data. The portal is completely isolated from admin auth via a separate route group, separate passport strategy (`portal-jwt`), and middleware bypass.

Test coverage: 10 unit tests + 10 CEPiK e2e tests + 13 portal e2e tests, all fully implemented with zero `it.todo()` stubs remaining.

---

_Verified: 2026-03-24T22:15:00Z_
_Verifier: Claude (gsd-verifier)_
