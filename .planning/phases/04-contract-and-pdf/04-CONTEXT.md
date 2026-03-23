# Phase 4: Contract and PDF - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Digital rental contract flow: form entry (auto-filled from rental data), digital signature capture (canvas drawing, both customer + employee), PDF generation from a Handlebars template modeled after the existing paper contract, automatic email delivery to customer, and contract amendments (aneks) for rental extensions. API + signature capture logic — admin panel UI is Phase 5, mobile is Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Contract Template & Data
- **Source template:** Existing paper contract at `.planning/phases/04-contract-and-pdf/contract-template.pdf` — 2 pages
- **Page 1 content:** Header (KITEK company info), parties (Wynajmujący + Klient), rental dates/times, vehicle info, customer personal data (imię, adres, dowód, PESEL, prawo jazdy), vehicle handover confirmation with mileage, RODO consent, signatures
- **Page 2 content:** 21 numbered conditions (WARUNKI NAJMU POJAZDU), vehicle damage sketch area, commitments (ZOBOWIĄZUJĘ SIĘ DO), damage notes, final signature
- **RODO consent:** Checkbox consent — customer must explicitly confirm before signing. Timestamp stored as proof.
- **Conditions text:** Mostly fixed, but 3 fields are editable per rental:
  - Kaucja (deposit) amount — fillable but optional
  - Daily rate (stawka za dobę) — auto-filled from rental data
  - Late return fee — configurable per rental
- **Vehicle damage sketch:** Interactive canvas — employee draws/marks damage on a vehicle outline. Saved as image, embedded in PDF.
- **Auto-filled from rental data:** Customer name, address, ID docs, vehicle registration/make/model, dates, pricing. Employee doesn't re-enter data already in the system.

### Digital Signature Capture
- **Two signatures per contract:** Page 1 (contract) + Page 2 (conditions acceptance). Matches paper template layout.
- **Both parties sign:** Customer signature + Employee (witness) signature. Both drawn on canvas.
- **Drawing only:** Canvas with finger/stylus. No typed name fallback. Saved as PNG.
- **Audit metadata captured:** Timestamp, device info, content hash (SHA-256 of contract data at signing time), witness employee ID (from JWT)
- **Signature stored:** PNG image in MinIO, reference on Contract record

### PDF Generation & Delivery
- **Clean digital version:** Same data and sections as paper template but modern digital layout. Not pixel-perfect reproduction.
- **Polish characters:** Full support required (ą, ć, ę, ł, ń, ó, ś, ź, ż)
- **PDF storage:** Claude decides (MinIO + DB reference recommended)
- **Email delivery:** Automatic after both signatures captured — PDF generated and emailed to customer immediately. No manual send step.
- **Email via:** Existing MailService (nodemailer) with PDF attachment

### Contract Amendments (Aneks)
- **Annex content:** Claude decides — minimal (date + price changes) vs full regeneration
- **Annex signatures:** Claude decides — based on Polish contract law practices
- **Triggered by:** `rental.extended` event (EventEmitter2 from Phase 3)
- **Versioning:** Each annex is numbered (Aneks nr 1, 2, ...) and linked to original contract
- **Annex PDF:** Separate document, emailed to customer automatically

### Claude's Discretion
- PDF template engine (Handlebars + Puppeteer vs alternatives)
- PDF storage structure (MinIO keys, DB model)
- Annex content scope (minimal vs full regeneration)
- Annex signature requirements
- Vehicle damage sketch — vehicle outline image or freeform canvas
- Contract data model design (Contract entity in Prisma)
- Signature canvas implementation details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Contract template
- `.planning/phases/04-contract-and-pdf/contract-template.pdf` — Original paper contract template (2 pages). Read this to understand exact layout, sections, fields, and conditions text.

### Project context
- `.planning/PROJECT.md` — Customer data fields collected in contracts, constraint: "Musi odwzorować istniejący szablon PDF"
- `.planning/REQUIREMENTS.md` — CONT-01 through CONT-05 requirements with acceptance criteria

### Existing code (Phase 1-3)
- `apps/api/src/mail/mail.service.ts` — Existing MailService for email delivery (extend with attachment support)
- `apps/api/src/storage/storage.service.ts` — MinIO/S3 storage for PDF and signature images
- `apps/api/src/rentals/rentals.service.ts` — Rental data source (vehicle, customer, dates, pricing)
- `apps/api/prisma/schema.prisma` — Current schema to extend with Contract model
- `apps/api/src/common/crypto/field-encryption.ts` — For content hash generation (SHA-256)

### Prior phase decisions
- `.planning/phases/03-rental-lifecycle/03-CONTEXT.md` — Rental extension emits `rental.extended` event, pricing stored as net + 23% VAT in grosze

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MailService` — nodemailer transport, extend with `sendContractEmail(to, pdfBuffer)` method
- `StorageService` — upload/download from MinIO, use for PDF and signature storage
- `AuditInterceptor` — auto-captures contract mutations
- `EventEmitter2` — already in AppModule, listen for `rental.extended` to trigger annex creation
- Customer model — encrypted PII fields, decrypt for contract rendering

### Established Patterns
- NestJS module: module + controller + service + DTOs
- Prisma: UUID PKs, relations, Json columns for flexible data
- MinIO: `rentapp/` bucket with path-based keys (e.g., `contracts/{rentalId}/`)

### Integration Points
- `apps/api/src/app.module.ts` — Register ContractsModule
- `apps/api/prisma/schema.prisma` — Add Contract model with Rental relation
- `apps/api/src/rentals/` — Contract creation triggered after rental activation + signing
- `packages/shared/src/types/` — Add contract types
- `apps/api/src/customers/customers.service.ts` — Decrypt customer PII for contract rendering

</code_context>

<specifics>
## Specific Ideas

- Wzór umowy jest w `.planning/phases/04-contract-and-pdf/contract-template.pdf` — 2 strony
- Klient podpisuje dwukrotnie: str. 1 (umowa) + str. 2 (warunki)
- Pracownik też podpisuje cyfrowo (jako wynajmujący/świadek)
- Rysunek uszkodzeń pojazdu na interaktywnym canvasie — osadzony w PDF
- Zgoda RODO jako checkbox z timestampem
- 3 edytowalne pola w warunkach: kaucja, stawka za dobę, opłata za spóźnienie
- Email z PDF automatycznie po podpisaniu — bez kroku "wyślij"

</specifics>

<deferred>
## Deferred Ideas

- Vehicle outline template for damage marking — could be a standardized SVG with hotspots (future enhancement)
- Digital contract editing after signing — out of scope, contracts are immutable after signature
- Multi-language contracts — Polish only for v1

</deferred>

---

*Phase: 04-contract-and-pdf*
*Context gathered: 2026-03-24*
