# Phase 34: ContractFrozenData v2 & PDF Template Rewrite - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Single coordinated pass for all contract-touching features: versioned ContractFrozenData schema (v2), rewritten PDF template, editable rental terms (TipTap), terms acceptance checkbox, second driver with full data + CEPiK + signature, hide VIN/year from client views. No PDF encryption (Phase 37).

</domain>

<decisions>
## Implementation Decisions

### Editable Rental Terms
- Default terms template stored in AppSetting (or equivalent) — admin edits via TipTap rich text editor in web panel
- Per-rental override: terms HTML stored on Rental/Contract — worker can customize before signing
- **Worker CAN edit terms in mobile** — using TipTap inside a WebView (same editor, embedded in React Native WebView)
- Terms are frozen into contractData at signing time — changes to the default template do NOT affect existing contracts
- Page 2 of contract.hbs currently has hardcoded `<ol>` conditions — replace with dynamic HTML from frozen terms

### Custom Terms Notes (UMOWA-04)
- Separate plain-text field `termsNotes` on Rental — worker adds per-rental notes
- Notes appear in PDF as an additional section after the main terms (e.g. "Uwagi dodatkowe:")
- Both web and mobile can add notes

### Second Driver
- Added in mobile wizard at the **contract step** (before signatures) — "Dodaj drugiego kierowce" button
- **Full data like main customer**: imie, nazwisko, PESEL, nr dowodu, nr prawa jazdy, adres, telefon
- CEPiK verification for second driver (same as main renter)
- **Second driver signs the contract** — additional signature pair (customer_second_page1, customer_second_page2 or similar)
- Data model: dedicated `RentalDriver` model linked to Rental (NOT reusing Customer model per research recommendation)
- Second driver data appears in PDF in a dedicated section
- Second driver data frozen in ContractFrozenData v2

### Hide VIN/Year from Client
- **Client sees VIN and year NOWHERE**: not in PDF contract, not in customer portal
- **Workers and admins see VIN/year as before** — no changes to admin/worker views
- In PDF: VIN and year rows simply removed (no placeholder, no "---")
- In customer portal API: VIN and year fields excluded from response
- ContractFrozenData v2 still stores VIN/year (needed internally) — just not rendered in client-facing outputs

### Terms Acceptance
- Klient must read terms and check acceptance checkbox **before signing** — Claude decides exact UX placement (before signature step or on signature screen)
- Terms displayed in **WebView** (HTML from TipTap) for consistency with PDF
- Checkbox text: "Zapoznalem sie z warunkami najmu i akceptuje je" (or similar)
- `termsAcceptedAt: DateTime?` on Contract — records when customer accepted
- Cannot proceed to signature capture until checkbox is checked

### ContractFrozenData Versioning
- Add `version: number` field to ContractFrozenData (v1 = existing, v2 = new fields)
- v2 adds: `customer.street`, `customer.houseNumber`, `customer.postalCode`, `customer.city`, `rental.isCompanyRental`, `rental.companyNip`, `rental.vatPayerStatus`, `rental.insuranceCaseNumber`, `rental.termsHtml`, `rental.termsNotes`, `secondDriver` object (nullable), `vehicle.vehicleClassName`
- v2 removes from client-visible outputs: `vehicle.vin`, `vehicle.year`
- **Old contracts (v1) must render correctly** — template checks version and falls back to v1 layout

### Claude's Discretion
- Exact TipTap configuration (extensions, toolbar buttons)
- ContractFrozenData v2 exact field naming
- How WebView TipTap editor is embedded in mobile (bridge, postMessage, etc.)
- Second driver signature type naming
- Terms acceptance UX placement (dedicated step vs on signature screen)
- AppSetting model design for default terms template

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Contract system
- `packages/shared/src/types/contract.types.ts` — Current ContractFrozenData interface (v1) — lines 59-81
- `apps/api/src/contracts/contracts.service.ts` — Builds frozen data, manages contract lifecycle
- `apps/api/src/contracts/pdf/pdf.service.ts` — PDF generation with Puppeteer + Handlebars
- `apps/api/src/contracts/pdf/templates/contract.hbs` — Current PDF template (page 1 + page 2 with hardcoded conditions)

### Signatures
- `apps/mobile/app/(tabs)/new-rental/signatures.tsx` — Current 4-signature flow (customer/employee page1/page2)
- `apps/mobile/app/(tabs)/new-rental/contract.tsx` — Contract step in mobile wizard

### CEPiK
- `apps/api/src/cepik/cepik.service.ts` — CEPiK verification service (reuse for second driver)
- `apps/api/src/cepik/cepik.controller.ts` — CEPiK API endpoint

### Customer portal
- `apps/api/test/portal.e2e-spec.ts` — Portal API tests (check VIN/year exposure)

### Research
- `.planning/research/ARCHITECTURE.md` — v3.0 integration map, ContractFrozenData v2 design
- `.planning/research/PITFALLS.md` — ContractFrozenData versioning pitfall, TipTap mobile approach
- `.planning/research/STACK.md` — TipTap library recommendation (@tiptap/react ^2.11.0)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PdfService`: Puppeteer + Handlebars pipeline — generates PDF from template + data
- `ContractsService.buildFrozenData()`: Creates ContractFrozenData snapshot — needs v2 extension
- `CepikService.verify()`: CEPiK driver verification — reuse for second driver
- `StorageService`: R2 storage for PDFs and signatures — reuse for second driver signatures
- Mobile signature capture: Canvas-based signature pad in `signatures.tsx` — extend for second driver

### Established Patterns
- `contractData: Json` column on Contract stores frozen snapshot
- Handlebars template with `{{}}` interpolation for all contract fields
- 4 signature types: customer_page1/2, employee_page1/2 — extend to 6 with second driver
- RODO consent stored as `rodoConsentAt: DateTime?` — same pattern for `termsAcceptedAt`

### Integration Points
- `contract.hbs` template: page 2 hardcoded conditions → replace with `{{{termsHtml}}}` triple-brace (unescaped HTML)
- `ContractFrozenData` interface: add v2 fields, keep v1 compatibility
- `signatures.tsx`: add second driver signature capture loop
- Portal API: filter out VIN/year from vehicle response
- `MailService`: email still sends PDF — no changes needed here (encryption is Phase 37)

</code_context>

<specifics>
## Specific Ideas

- TipTap editor in WebView for mobile — same editor component, loaded in a WebView with postMessage bridge
- Terms frozen as HTML in contractData — rendered with `{{{termsHtml}}}` in Handlebars (unescaped)
- Second driver section in PDF between customer and vehicle sections
- Old v1 contracts: template uses `{{#if (eq version 2)}}` conditional blocks

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 34-contractfrozendata-v2-pdf-template-rewrite*
*Context gathered: 2026-04-12*
