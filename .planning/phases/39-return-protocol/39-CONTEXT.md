# Phase 39: Return Protocol - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate a formal return protocol PDF ("Protokół Zdawczo – Odbiorczy Samochodu") when a vehicle is returned. The protocol matches the client's provided template exactly. It is filled by the worker in the mobile return wizard, signed by both parties, generated as PDF, emailed to the customer, and downloadable from the web admin panel.

</domain>

<decisions>
## Implementation Decisions

### Template structure (from client PDF)
- Title: "PROTOKÓŁ ZDAWCZO – ODBIORCZY SAMOCHODU"
- Header: hardcoded "KITEK Paweł Romanowski", www.p-romanowski.pl, Tel. (+48) 602 367 100
- 7 fields:
  1. Zdający — customer full name (auto-filled from rental, read-only)
  2. Data i godzina zwrotu — current date/time (auto-filled)
  3. Marka i model samochodu — vehicle make + model (auto-filled from rental)
  4. Numer rejestracyjny — vehicle plate (auto-filled from rental)
  5. Miejsce odbioru — return location address (auto-filled from Google Places if set)
  6. Czystość pojazdu — chip selector: Czysty / Brudny / Do mycia + optional free-text note
  7. Inne — free-text multiline field for additional observations
- Two signature lines: Zdający (data i podpis) + Odbierający (data i podpis)
- Client template PDF stored at: `.planning/phases/39-return-protocol/return-protocol-template.pdf`

### Data sources
- All possible fields auto-fill from existing rental data (customer name, vehicle, date, location)
- "Zdający" is read-only — no override (formal document)
- "Czystość pojazdu" uses chip buttons (Czysty/Brudny/Do mycia) with optional note
- "Inne" is free-text multiline

### Protocol flow in mobile
- New step in return wizard, after damage photos
- Dedicated "Protokół zwrotu" step — clear separation, fits existing wizard pattern
- Worker reviews auto-filled data, selects cleanliness, optionally adds notes

### Signatures
- Reuse existing SignatureCanvas component from contract signing
- Two separate steps: Step 1 — Customer signs ("Zdający"), Step 2 — Worker signs ("Odbierający")
- Same pattern as contract 6-signature flow but only 2 signatures

### PDF output & delivery
- PDF generated using existing pdf.service pattern (Puppeteer HTML → PDF)
- NOT encrypted (unlike contract PDF) — protocol is less sensitive
- Sent to customer by email (same MailService pattern as contract)
- No SMS password notification needed (no encryption)
- Downloadable from web admin panel — PDF download button in rental detail
- Email subject: follow existing pattern with registration plate

### Claude's Discretion
- Exact HTML/CSS layout of the PDF template
- How to store protocol data (new model vs fields on Rental)
- Whether to store protocol PDF in R2 or generate on demand
- Signature image positioning in PDF

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Client template
- `.planning/phases/39-return-protocol/return-protocol-template.pdf` — The exact layout the generated PDF must match

### PDF generation
- `apps/api/src/contracts/pdf/pdf.service.ts` — Existing PDF generation service (Puppeteer HTML → PDF)
- `apps/api/src/contracts/pdf/pdf-encryption.service.ts` — PDF encryption (NOT used for protocol — but reference for the flow)
- `apps/api/src/contracts/contracts.service.ts` — Contract generation + email flow to replicate for protocol

### Mobile return flow
- `apps/mobile/app/return/[rentalId].tsx` — Existing return wizard where protocol step will be added
- `apps/mobile/src/components/signatures/` — Existing SignatureCanvas component to reuse

### Email delivery
- `apps/api/src/mail/mail.service.ts` — Existing email service (sendContractEmail pattern to follow)

### Data model
- `apps/api/prisma/schema.prisma` — Current Rental model, existing relations
- `packages/shared/src/types/rental.types.ts` — Shared types for rental data

### Location data
- `apps/api/src/rentals/rentals.service.ts` — Return location stored on rental (Phase 35)

No external specs beyond the client template PDF — requirements captured in decisions above and REQUIREMENTS.md (ZWROT-01).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PdfService` (Puppeteer HTML → PDF): Reuse for protocol generation
- `MailService.sendContractEmail()`: Pattern for sending protocol email
- `SignatureCanvas` component: Reuse for both protocol signatures
- `formatCurrency()`, `formatDate()`: Existing formatters
- Return location data (pickupLocation/returnLocation from Phase 35)

### Established Patterns
- Prisma schema + manual SQL migration (Phase 33-38 precedent)
- PDF from HTML template rendered by Puppeteer
- Signatures stored as base64 PNG in R2, referenced by key
- Contract email flow: generate PDF → send email → (optionally encrypt + SMS)

### Integration Points
- Return wizard: new step after damage photos, before completion
- Rental detail (web): new "Protokół" section/download button
- API: new endpoint to generate + store + email the protocol
- Mail service: new `sendReturnProtocolEmail()` method

</code_context>

<specifics>
## Specific Ideas

- PDF must visually match the client's template — single page, same field order, same header
- Header is hardcoded (KITEK Pawel Romanowski) — not configurable from settings

</specifics>

<deferred>
## Deferred Ideas

- Sending protocol PDF separately to client (NAJEM-F01 in v4.0) — for now it's part of the return flow email
- Configurable company header from admin settings — currently hardcoded per client requirement

</deferred>

---

*Phase: 39-return-protocol*
*Context gathered: 2026-04-14*
