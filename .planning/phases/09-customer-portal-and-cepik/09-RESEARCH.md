# Phase 9: Customer Portal and CEPiK - Research

**Researched:** 2026-03-24
**Domain:** Customer self-service portal (magic link auth), CEPiK 2.0 driver license verification
**Confidence:** MEDIUM

## Summary

Phase 9 has two distinct domains: (1) a read-only customer portal with magic link authentication, and (2) CEPiK 2.0 integration for driver license verification before contract signing.

The customer portal is straightforward -- it reuses the existing Next.js app with a new `(portal)` route group, magic link tokens stored on the Customer model, and a separate JWT strategy for portal sessions. The BFF proxy pattern and shadcn/ui components are already in place. The portal is mobile-first, Polish-only, and displays rental history with PDF downloads.

The CEPiK integration is more complex than initially expected. The **public CEPiK API** (api.cepik.gov.pl) only provides aggregate statistics and vehicle lookup -- it does NOT support individual driver license verification. A separate **"API dla Przewoznikow"** (Carriers API) launched in January 2025 does provide individual license verification, but requires formal application to the Ministry of Digitization (biurocepik2.0@cyfra.gov.pl) with a .pem certificate for authentication. Access approval may take weeks. Given this, the implementation should use a **stub/mock service** with a clean interface that can be swapped for the real CEPiK API once access is granted.

**Primary recommendation:** Build a `CepikModule` with a `CepikService` interface backed by a stub implementation. Portal uses `(portal)` route group in existing `apps/web`. Magic link token generated on contract signing and included in contract email.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Magic link included in contract email (same email as PDF), not separate
- Token expiry: 30 days, expired link shows "Link wygasl. Skontaktuj sie z wypozyczalnia."
- Portal shows ALL rentals (full history) for the customer
- Rental detail: vehicle info, dates, status, pricing, contract PDF download, return inspection summary
- No photos in portal (admin-only via Phase 7)
- Entire portal in Polish
- CEPiK check: license validity + category match for vehicle type
- CEPiK timing: before contract signing, blocks signing flow
- API unavailable fallback: manual override with reason text, audit-logged
- Failed verification: soft block, admin override with audit log
- License category mismatch: same soft block behavior
- Session: token in URL exchanged for short-lived httpOnly cookie session
- Mobile-first responsive design

### Claude's Discretion
- Portal app architecture (same apps/web vs separate apps/portal)
- PII display strategy (none vs masked)
- CEPiK API client implementation details (endpoint URLs, auth method, response parsing)
- Portal visual design (reuse shadcn/ui from admin or lighter approach)
- Magic link token generation and storage mechanism
- CEPiK result caching (per customer per day? per rental?)

### Deferred Ideas (OUT OF SCOPE)
- Self-service magic link renewal (customer enters email -> gets new link) -- v2
- Customer can dispute damage report via portal -- v2
- CEPiK check at customer creation (cached) -- could optimize but not needed for v1
- Portal dark mode -- v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CEPIK-01 | System weryfikuje uprawnienia kierowcy przez CEPiK 2.0 API (status zawieszenia, waznosc prawa jazdy) przed podpisaniem umowy | CepikModule with stub service, manual override with audit, admin override for failed checks |
| CEPIK-02 | Weryfikacja CEPiK jest asynchroniczna z recznym fallbackiem -- wynajem moze byc realizowany bez niej | Manual override flow with reason text, audit logging, async check pattern |
| PORTAL-01 | Klient moze zalogowac sie do prostego portalu web przez magic link (link w emailu z umowa) | Magic link token on Customer model, exchange for JWT session cookie, (portal) route group |
| PORTAL-02 | Klient widzi swoje aktywne wynajmy, historie, terminy zwrotu i moze pobrac PDF umowy | Portal API endpoints returning rental history with contracts, presigned URLs for PDF download |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.3.x | Portal UI (route group in existing app) | Already in project, App Router with route groups |
| NestJS | 11.x | API endpoints for portal + CEPiK module | Already in project |
| Prisma | 7.5.x | Database models for magic link tokens, CEPiK results | Already in project |
| @tanstack/react-query | 5.x | Portal data fetching | Already in project |
| shadcn/ui | latest | Portal UI components (Card, Badge, Button) | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto (Node.js built-in) | - | Magic link token generation (randomBytes + base64url) | Token generation |
| argon2 | existing | Hash magic link tokens before storage | Already used for password/refresh tokens |
| passport-jwt | existing | Separate strategy for portal JWT | Already used, add second strategy |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| (portal) route group in apps/web | Separate apps/portal Next.js app | Separate app means duplicating shared config, components, BFF proxy. Route group is cleaner since portal is simple. |
| Separate portal JWT strategy | Reuse same JWT with role check | Separate strategy is cleaner -- portal tokens have different lifetime (30 days), different payload (customerId instead of userId) |
| Stub CEPiK service | Attempt real integration | Real CEPiK Carriers API requires formal approval (.pem certificate from Ministry). Stub with interface allows swap later. |

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
  portal/                    # Portal module
    portal.module.ts
    portal.controller.ts     # GET /portal/rentals, /portal/rentals/:id
    portal.service.ts
    portal-auth.controller.ts # POST /portal/auth/exchange (token -> JWT)
    strategies/
      portal-jwt.strategy.ts # Separate passport strategy for portal tokens
    guards/
      portal-auth.guard.ts   # Guard using 'portal-jwt' strategy
  cepik/                     # CEPiK module
    cepik.module.ts
    cepik.service.ts         # Interface + stub implementation
    cepik.controller.ts      # POST /cepik/verify (admin-facing)
    dto/
      verify-license.dto.ts
      cepik-result.dto.ts

apps/web/src/app/
  (portal)/                  # Portal route group (no admin layout)
    layout.tsx               # Minimal portal layout (no sidebar, mobile-first)
    portal/                  # /portal path
      page.tsx               # Rental list
      [rentalId]/
        page.tsx             # Rental detail with PDF download
    components/
      portal-header.tsx
      rental-card.tsx
      rental-detail.tsx
  api/
    portal/                  # Portal BFF routes
      auth/
        exchange/route.ts    # Token exchange endpoint
      [...path]/route.ts     # Portal API proxy
```

### Pattern 1: Magic Link Token Flow
**What:** Generate crypto token on contract signing, store hashed on Customer, include raw in contract email URL. Customer clicks link, token exchanged for short-lived JWT stored in httpOnly cookie.
**When to use:** Portal authentication
**Example:**
```typescript
// Token generation (in ContractsService, after contract signed)
const rawToken = crypto.randomBytes(32).toString('base64url');
const hashedToken = await argon2.hash(rawToken);
await prisma.customer.update({
  where: { id: customerId },
  data: {
    portalToken: hashedToken,
    portalTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
});
const portalUrl = `${appUrl}/portal?token=${rawToken}&cid=${customerId}`;
// Include portalUrl in contract email HTML

// Token exchange (PortalAuthController)
@Public()
@Post('portal/auth/exchange')
async exchange(@Body() dto: { token: string; customerId: string }) {
  const customer = await prisma.customer.findUnique({ where: { id: dto.customerId } });
  if (!customer?.portalToken || !customer.portalTokenExpiresAt) throw 401;
  if (customer.portalTokenExpiresAt < new Date()) throw 401; // "Link wygasl"
  const valid = await argon2.verify(customer.portalToken, dto.token);
  if (!valid) throw 401;
  // Issue portal JWT (short-lived, 1h)
  const jwt = jwtService.sign({ sub: customer.id, type: 'portal' }, { expiresIn: '1h' });
  return { accessToken: jwt };
}
```

### Pattern 2: CEPiK Stub Service with Interface
**What:** Define a clean interface for CEPiK verification, implement with a stub that always returns configurable results. Real implementation swappable later.
**When to use:** CEPiK integration
**Example:**
```typescript
// cepik.service.ts
export interface CepikVerificationResult {
  verified: boolean;
  licenseValid: boolean;
  licenseSuspended: boolean;
  licenseCategories: string[];
  categoryMatch: boolean;
  rawResponse?: any;
  checkedAt: Date;
  source: 'CEPIK_API' | 'STUB' | 'MANUAL_OVERRIDE';
}

@Injectable()
export class CepikService {
  async verifyDriverLicense(
    firstName: string,
    lastName: string,
    licenseNumber: string,
    requiredCategory: string,
  ): Promise<CepikVerificationResult> {
    // STUB: Simulate CEPiK response
    // In production, replace with real API call using .pem certificate
    return {
      verified: true,
      licenseValid: true,
      licenseSuspended: false,
      licenseCategories: ['B'],
      categoryMatch: requiredCategory === 'B',
      checkedAt: new Date(),
      source: 'STUB',
    };
  }
}
```

### Pattern 3: CEPiK Check in Contract Signing Flow
**What:** CEPiK verification happens as a step before contract creation. Result stored in DB. If check fails or API unavailable, manual override path with audit logging.
**When to use:** Before contract signing
**Example:**
```typescript
// In contract creation flow or as a separate pre-check endpoint
@Post('cepik/verify')
@Roles(UserRole.EMPLOYEE, UserRole.ADMIN)
async verify(@Body() dto: VerifyLicenseDto, @CurrentUser() user) {
  const result = await cepikService.verifyDriverLicense(
    dto.firstName, dto.lastName, dto.licenseNumber, dto.requiredCategory,
  );
  // Store result in CepikVerification table
  const verification = await prisma.cepikVerification.create({
    data: {
      customerId: dto.customerId,
      rentalId: dto.rentalId,
      result: result as any,
      status: result.licenseValid && result.categoryMatch ? 'PASSED' : 'FAILED',
      checkedById: user.id,
    },
  });
  return verification;
}

// Manual override endpoint (admin only)
@Post('cepik/verify/:id/override')
@Roles(UserRole.ADMIN)
async override(@Param('id') id, @Body() dto: { reason: string }, @CurrentUser() user) {
  return prisma.cepikVerification.update({
    where: { id },
    data: {
      status: 'OVERRIDDEN',
      overrideReason: dto.reason,
      overriddenById: user.id,
      overriddenAt: new Date(),
    },
  });
}
```

### Anti-Patterns to Avoid
- **Sharing JWT strategy between admin and portal:** Portal tokens have completely different semantics (customer ID, 30-day magic link vs employee credentials). Use separate passport strategies.
- **Storing raw magic link tokens:** Always hash tokens (argon2) before storing. Only the raw token exists in the email URL.
- **Blocking rental flow on CEPiK failure:** The requirement explicitly states manual override must be available. Never make CEPiK a hard gate without admin bypass.
- **Putting portal under (admin) layout:** Portal has no sidebar, no top bar, no admin auth. It needs its own layout.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token generation | Custom token algorithm | `crypto.randomBytes(32).toString('base64url')` | Cryptographically secure, URL-safe |
| Token hashing | SHA-256 | argon2 (already in project) | Consistent with existing refresh token pattern |
| PDF presigned URLs | Custom URL signing | `StorageService.getPresignedUrl()` (MinIO) | Already available, handles expiry |
| Portal UI components | Custom components | shadcn/ui (already in project) | Consistent design, responsive by default |
| Date formatting | Custom formatters | `formatDateWarsaw` helper (from Phase 8) | Already handles pl-PL locale, Europe/Warsaw TZ |

## Common Pitfalls

### Pitfall 1: CEPiK Public API Confusion
**What goes wrong:** Developer assumes api.cepik.gov.pl provides individual license verification
**Why it happens:** The public API exists and has /prawa-jazdy endpoints, but these only return aggregate monthly statistics on license issuances -- NOT individual driver verification
**How to avoid:** Use stub service. The real verification API (Carriers API) requires formal application to Ministry of Digitization with .pem certificate authentication. Contact biurocepik2.0@cyfra.gov.pl.
**Warning signs:** Getting 403/404 when trying to verify individual licenses against public API

### Pitfall 2: Magic Link Token in URL Leaking via Referrer
**What goes wrong:** Token in URL gets sent to external services via Referrer header
**Why it happens:** When portal page loads external resources or user navigates away
**How to avoid:** Exchange token for session cookie immediately on page load. The portal page itself should be a client-side exchange page that strips the token from URL after exchange. Use `<meta name="referrer" content="no-referrer">` in portal layout.
**Warning signs:** Tokens appearing in server logs of external services

### Pitfall 3: Portal Route Conflicts with Admin Routes
**What goes wrong:** Portal routes clash with admin routes or middleware
**Why it happens:** Both share the same Next.js app and BFF proxy
**How to avoid:** Use `(portal)` route group with its own layout. Portal BFF routes under `/api/portal/`. Portal API endpoints under `/portal/` prefix on NestJS side. Portal JWT strategy named 'portal-jwt' to not conflict with 'jwt' strategy.
**Warning signs:** Admin auth middleware intercepting portal requests

### Pitfall 4: Forgetting Audit Logging on CEPiK Overrides
**What goes wrong:** Admin overrides CEPiK verification without audit trail
**Why it happens:** Override seems like a simple status update
**How to avoid:** Override endpoint must capture: who overrode, when, reason text, original CEPiK result. Use AuditInterceptor (already global) + store override details in CepikVerification record.
**Warning signs:** No audit trail for rentals where license check failed

### Pitfall 5: Portal Session Not Refreshing
**What goes wrong:** Customer opens portal, browses for a while, session expires
**Why it happens:** Portal JWT is short-lived (1h) but there's no refresh mechanism
**How to avoid:** Either: (a) make portal JWT longer-lived (e.g., 24h since portal is read-only and low-risk), or (b) implement a lightweight refresh using the original magic link token. Option (a) is simpler and sufficient for a read-only portal.
**Warning signs:** Customer gets logged out while browsing rentals

## Code Examples

### Prisma Schema Additions
```prisma
// Add to Customer model
model Customer {
  // ... existing fields ...
  portalToken           String?
  portalTokenExpiresAt  DateTime?
}

// New model for CEPiK verification results
model CepikVerification {
  id              String    @id @default(uuid())
  customerId      String
  rentalId        String?
  status          String    // PENDING, PASSED, FAILED, OVERRIDDEN, ERROR
  result          Json?     // Full CEPiK response
  checkedById     String
  overrideReason  String?
  overriddenById  String?
  overriddenAt    DateTime?
  createdAt       DateTime  @default(now())

  customer        Customer  @relation(fields: [customerId], references: [id])
  rental          Rental?   @relation(fields: [rentalId], references: [id])
  checkedBy       User      @relation("CepikCheckedBy", fields: [checkedById], references: [id])
  overriddenBy    User?     @relation("CepikOverriddenBy", fields: [overriddenById], references: [id])

  @@index([customerId])
  @@index([rentalId])
  @@map("cepik_verifications")
}
```

### Contract Email with Magic Link
```typescript
// Extend sendContractEmail in MailService
async sendContractEmail(
  to: string,
  customerName: string,
  vehicleRegistration: string,
  contractNumber: string,
  pdfBuffer: Buffer,
  portalUrl?: string,  // NEW: magic link URL
): Promise<void> {
  const portalSection = portalUrl
    ? `<p>Twoj portal klienta: <a href="${portalUrl}">${portalUrl}</a></p><p>Link wazny przez 30 dni.</p>`
    : '';
  await this.transporter.sendMail({
    from: this.config.get('MAIL_FROM'),
    to,
    subject: 'RentApp - Umowa najmu pojazdu ' + vehicleRegistration,
    html: `<p>Szanowny/a ${customerName},</p><p>W zalaczniku przesylamy umowe najmu pojazdu ${vehicleRegistration} (nr ${contractNumber}).</p>${portalSection}<p>Prosimy o zachowanie tego dokumentu.</p><p>KITEK - Wynajem Pojazdow</p>`,
    attachments: [{ /* existing */ }],
  });
}
```

### Portal BFF Token Exchange Route
```typescript
// apps/web/src/app/api/portal/auth/exchange/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${API_URL}/portal/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const isProduction = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({ success: true });
  response.cookies.set('portal_token', data.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/portal',
    maxAge: 86400, // 24h
  });
  return response;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CEPiK manual phone check | CEPiK 2.0 Carriers API (automated) | Jan 2025 | Automated but requires Ministry approval |
| Magic link via separate email | Magic link in contract email | User decision | Single email, simpler UX |
| Separate portal app | Route group in existing Next.js app | Architectural decision | Less duplication, shared infrastructure |

**CEPiK Access Reality:**
- **Public API** (api.cepik.gov.pl): Vehicle data + aggregate statistics only. No individual license verification.
- **Carriers API** (biurocepik2.0@cyfra.gov.pl): Individual license verification. Requires formal application, .pem certificate. Authentication via client certificate. Input: first name, last name, license blank number. Output: license validity, suspension status, categories, expiry date.
- **Web tool** (obywatel.gov.pl): Manual single-lookup tool for citizens. Not suitable for API integration.

## Open Questions

1. **CEPiK Carriers API access timeline**
   - What we know: Access requires application to biurocepik2.0@cyfra.gov.pl. Over 130 companies have integrated.
   - What's unclear: Whether a car rental company qualifies (documentation mentions "transport industry"). Approval timeline unknown.
   - Recommendation: Build stub now, apply for access in parallel. Stub should return configurable responses for testing.

2. **Portal token regeneration on new contracts**
   - What we know: Token is generated when contract is signed and included in email
   - What's unclear: If customer already has a valid token and signs a new contract, should the old token be invalidated?
   - Recommendation: Always generate a new token on contract signing. Old token is overwritten (single portalToken field on Customer). New email always has a fresh link.

3. **CEPiK required category mapping**
   - What we know: CEPiK returns license categories (A, B, C, etc.). Vehicle types in fleet need to map to required categories.
   - What's unclear: Exact mapping between vehicle types in the system and required license categories
   - Recommendation: Most fleet vehicles require category B. Store required category on Vehicle model (default 'B'), allow admin to change.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (e2e for API) |
| Config file | `apps/api/test/jest-e2e.json` |
| Quick run command | `cd apps/api && npx jest --config ./test/jest-e2e.json --testPathPattern=<file> --no-cache` |
| Full suite command | `cd apps/api && npx jest --config ./test/jest-e2e.json` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CEPIK-01 | CEPiK verify endpoint returns license status | e2e | `cd apps/api && npx jest --config ./test/jest-e2e.json --testPathPattern=cepik -t "verify" --no-cache` | No - Wave 0 |
| CEPIK-01 | Failed verification blocks contract creation | e2e | `cd apps/api && npx jest --config ./test/jest-e2e.json --testPathPattern=cepik -t "block" --no-cache` | No - Wave 0 |
| CEPIK-02 | Manual override with reason logged | e2e | `cd apps/api && npx jest --config ./test/jest-e2e.json --testPathPattern=cepik -t "override" --no-cache` | No - Wave 0 |
| CEPIK-02 | Admin-only override for failed checks | e2e | `cd apps/api && npx jest --config ./test/jest-e2e.json --testPathPattern=cepik -t "admin" --no-cache` | No - Wave 0 |
| PORTAL-01 | Token exchange returns JWT | e2e | `cd apps/api && npx jest --config ./test/jest-e2e.json --testPathPattern=portal -t "exchange" --no-cache` | No - Wave 0 |
| PORTAL-01 | Expired token rejected | e2e | `cd apps/api && npx jest --config ./test/jest-e2e.json --testPathPattern=portal -t "expired" --no-cache` | No - Wave 0 |
| PORTAL-02 | Portal returns customer rentals | e2e | `cd apps/api && npx jest --config ./test/jest-e2e.json --testPathPattern=portal -t "rentals" --no-cache` | No - Wave 0 |
| PORTAL-02 | PDF presigned URL generated | e2e | `cd apps/api && npx jest --config ./test/jest-e2e.json --testPathPattern=portal -t "pdf" --no-cache` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** Quick run on changed test file
- **Per wave merge:** Full e2e suite
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/test/portal.e2e-spec.ts` -- covers PORTAL-01, PORTAL-02
- [ ] `apps/api/test/cepik.e2e-spec.ts` -- covers CEPIK-01, CEPIK-02

## Sources

### Primary (HIGH confidence)
- [CEPiK Public API Swagger](https://api.cepik.gov.pl/doc) - Confirmed public API only provides vehicle data + aggregate statistics, NOT individual license verification
- [CEPiK API OpenAPI spec](https://api.cepik.gov.pl/swagger/apicepik.json) - Full endpoint list: /pojazdy, /prawa-jazdy (statistics only), /uprawnienia (statistics only)
- Existing codebase: apps/api/src/auth/, apps/api/src/contracts/, apps/web/src/app/ -- verified patterns for JWT, BFF proxy, route groups

### Secondary (MEDIUM confidence)
- [Gov.pl CEPiK API page](https://www.gov.pl/web/cepik/api-dla-centralnej-ewidencji-pojazdow-i-kierowcow-api-do-cepik) - Public API free, vehicle data only
- [Chandon Waller Partners - API verification](https://chandonwaller.pl/api-weryfikacja-uprawnien-kierowcy/) - Carriers API details: input (name + license blank number), output (categories, validity, suspension), contact biurocepik2.0@cyfra.gov.pl
- [Gov.pl Ministry of Digitization announcement](https://www.gov.pl/web/cyfryzacja/nowe-narzedzie-do-weryfikacji-uprawnien-kierowcow) - January 2025 launch of Carriers API, .pem certificate auth

### Tertiary (LOW confidence)
- [Cabgo - CEPiK verification article](https://cabgo.pl/weryfikacja-prawa-jazdy-cepik-2-0-przez-api/) - Referenced but content not fully extractable
- CEPiK Carriers API eligibility for rental companies -- unclear if car rental qualifies under "transport industry" umbrella

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, well-understood patterns
- Architecture: HIGH - Route groups, JWT strategies, BFF proxy all established in prior phases
- CEPiK integration: LOW - Real API requires formal approval; stub approach is solid but real integration details uncertain
- Pitfalls: MEDIUM - Based on general security patterns and CEPiK API investigation

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable patterns, CEPiK access status may change)
