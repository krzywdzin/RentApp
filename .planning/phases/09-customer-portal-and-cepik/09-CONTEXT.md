# Phase 9: Customer Portal and CEPiK - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Customer self-service read-only portal (magic link auth via contract email) showing rental history, details, and PDF downloads. CEPiK 2.0 driver license verification integrated into the contract signing flow with manual fallback. API endpoints + portal UI. Final phase of v1.

</domain>

<decisions>
## Implementation Decisions

### Customer Portal Auth
- **Magic link delivery:** Included in the contract email (same email that sends the PDF). No separate email.
- **Token expiry:** 30 days from issuance. Customer must contact the rental company for a new link after expiry.
- **Expired link behavior:** Display message "Link wygasł. Skontaktuj się z wypożyczalnią." No self-service renewal.
- **Portal app:** Claude decides — separate routes in apps/web or separate apps/portal app
- **Session:** Token in URL → exchange for short-lived session (httpOnly cookie). No password, no registration.
- **Responsive:** Mobile-first responsive — customer will open link from phone (email on mobile)

### Portal Content
- **Rental scope:** All rentals (full history) — past + current + upcoming. Customer sees everything with this company.
- **Rental detail:** Vehicle (make/model/registration), dates (from-to), status, pricing details, contract PDF download link, return inspection summary if returned.
- **No photos in portal:** Handover/return photos not shown to customer (admin-only via Phase 7)
- **PII display:** Claude decides based on RODO minimization — likely no PII displayed (customer knows their own data)
- **Polish language:** Entire portal in Polish

### CEPiK Integration
- **API access:** Public API (CEPiK 2.0) — no special approval needed per user's understanding
- **What to check:** License validity (not expired, not suspended) + category match for rented vehicle type
- **Build approach:** Real integration with CEPiK 2.0 API. If API proves inaccessible, fall back to stub service.

### CEPiK Timing & UX
- **When:** Before contract signing — after customer data entered, before signatures. Blocks signing flow.
- **API unavailable fallback:** Manual override with reason text (e.g., "API niedostępne"). Employee enters reason, audit-logged. Rental proceeds.
- **Failed verification (suspended/invalid license):** Soft block — employee cannot proceed, but admin can override after reviewing the CEPiK result. Override is audit-logged.
- **License category mismatch:** Same soft block behavior — admin override required.

### Claude's Discretion
- Portal app architecture (same apps/web vs separate apps/portal)
- PII display strategy (none vs masked)
- CEPiK API client implementation details (endpoint URLs, auth method, response parsing)
- Portal visual design (reuse shadcn/ui from admin or lighter approach)
- Magic link token generation and storage mechanism
- CEPiK result caching (per customer per day? per rental?)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Customer portal requirements, CEPiK 2.0 mention, constraint about access
- `.planning/REQUIREMENTS.md` — PORTAL-01, PORTAL-02, CEPIK-01, CEPIK-02 requirements

### Existing code
- `apps/api/src/auth/auth.service.ts` — JWT token generation patterns to extend for magic link tokens
- `apps/api/src/mail/mail.service.ts` — Email delivery, extend with magic link in contract email
- `apps/api/src/contracts/contracts.service.ts` — Contract creation flow where magic link should be generated
- `apps/api/src/contracts/listeners/rental-extended.listener.ts` — Event listener pattern for CEPiK check integration
- `apps/web/` — Admin panel Next.js app (potential host for portal routes)

### Prior phase decisions
- `.planning/phases/01-foundation-and-auth/01-CONTEXT.md` — Customer role: magic link access, no password, token-based auth with expiry
- `.planning/phases/04-contract-and-pdf/04-CONTEXT.md` — Contract email auto-sent after signing — magic link goes here

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MailService` — extend `sendContractEmail` to include magic link URL
- `StorageService` — presigned URLs for contract PDF download in portal
- `@rentapp/shared` types — rental, vehicle, contract types for portal display
- shadcn/ui components — potentially reuse in portal (Button, Card, Badge, etc.)
- BFF proxy pattern from admin panel — reuse for portal auth

### Established Patterns
- Next.js App Router with route groups — `(admin)` layout exists, add `(portal)` or separate app
- TanStack Query hooks — same pattern for portal data fetching
- JWT + httpOnly cookies via BFF — same auth pattern for portal session

### Integration Points
- `apps/api/src/contracts/contracts.service.ts` — generate magic link token on contract creation
- `apps/api/src/app.module.ts` — register CepikModule
- `apps/api/prisma/schema.prisma` — add CepikVerification model, magic link token fields on Customer
- Rental creation wizard (mobile + admin) — integrate CEPiK check step before contract signing

</code_context>

<specifics>
## Specific Ideas

- Magic link w tym samym mailu co umowa PDF — nie osobny mail
- Token ważny 30 dni, po wygaśnięciu "Skontaktuj się z wypożyczalnią"
- Portal mobile-first responsive — klient otworzy z maila na telefonie
- CEPiK publiczny — sprawdzenie ważności + kategoria prawa jazdy
- CEPiK przed podpisaniem umowy — blokuje flow
- API niedostępne → override manualny z powodem (audit log)
- Prawo jazdy zawieszone → soft block, admin może override

</specifics>

<deferred>
## Deferred Ideas

- Self-service magic link renewal (customer enters email → gets new link) — v2
- Customer can dispute damage report via portal — v2
- CEPiK check at customer creation (cached) — could optimize but not needed for v1
- Portal dark mode — v2

</deferred>

---

*Phase: 09-customer-portal-and-cepik*
*Context gathered: 2026-03-24*
