# Project Research Summary

**Project:** RentApp v3.0 — Client Features & Contract Enhancements
**Domain:** Polish B2B car rental management system (internal tool)
**Researched:** 2026-04-12
**Confidence:** HIGH

## Executive Summary

RentApp v3.0 adds 17 features to a production-validated monorepo (Expo 54 / NestJS 11 / Prisma 6 / Next.js). The stack itself does not change — all 4 new library additions (expo-text-extractor for OCR, react-native-google-places-autocomplete for location, @pdfsmaller/pdf-encrypt-lite for PDF encryption, @tiptap/react for admin rich text) integrate cleanly into existing patterns. No new infrastructure is required. The dominant implementation concern is not technology selection but integration sequencing: several features share the same data structures (ContractFrozenData, contract PDF template, Rental model) and must be designed together and batched into phases to avoid repeated rework.

The clearest recommendation from combined research is to design the v3.0 ContractFrozenData schema upfront — before implementing any individual feature — and to version it. Every feature that touches the contract PDF template (editable terms, second driver, company/NIP, VIN hiding, terms acceptance, VAT status, insurance case number) must be batched into a single PDF template rewrite. Attempting these features piecemeal will force 5-7 separate Handlebars template iterations and multiple frozen-data interface changes. The architecture research confirms this explicitly: treating Phase 2 as a single "all ContractFrozenData + PDF template changes" pass is the correct approach.

The two highest-risk features are OCR document scanning (requires EAS dev client, on-device ML Kit, and Polish document parsing logic with inherently imperfect accuracy) and PDF encryption (Puppeteer does not support encryption natively; the pure-JS library @pdfsmaller/pdf-encrypt-lite resolves the Railway deployment constraint but delivers RC4-128, not AES-256). Both risks have identified mitigations. Google Places API billing is a moderate operational risk requiring session tokens, debouncing, and billing alerts before the feature goes live. Settlement tracking carries scope-creep risk and must be bounded to status+notes+amounts at design time.

## Key Findings

### Recommended Stack

No changes to the existing validated stack (Expo 54, React Native 0.81, NestJS 11, Prisma 6, Puppeteer 24, Cloudflare R2, Bull/Redis, SMSAPI). Four targeted additions cover the four new technical concerns. The on-device OCR approach (expo-text-extractor using ML Kit / Apple Vision) was chosen over cloud OCR to keep ID document photos off external servers — a RODO consideration. Google Places is proxied through the backend to avoid exposing the API key in the mobile bundle.

**Core new technologies:**
- `expo-text-extractor ^2.0.0` (mobile): on-device OCR using ML Kit/Vision — avoids cloud costs, keeps ID photos on-device, requires EAS dev client build
- `react-native-google-places-autocomplete ^2.6.4` (mobile): location autocomplete — de facto standard, pure JS, no native module needed
- `react-google-places-autocomplete ^4.1.0` (web): same Google Places API for the Next.js admin panel
- `@pdfsmaller/pdf-encrypt-lite ^1.0.0` (API): pure-JS PDF encryption, zero server-side binaries — avoids Railway deployment issue with qpdf system dependency
- `@tiptap/react ^2.11.0` + `@tiptap/starter-kit` (web): headless rich text editor for admin-editable rental terms — HTML output maps directly to Handlebars PDF pipeline
- `react-native-webview ~13.15.0` (mobile, already installed): displays HTML terms for customer review — no new dependency needed

### Expected Features

**Must have (table stakes):**
- Company client support (NIP) — legal requirement for B2B invoicing in Poland
- Client terms acceptance checkbox — RODO/GDPR compliance and liability protection
- Client address exposed in mobile app — required on every Polish rental contract
- VAT payer status (100%/50%/no) — Polish tax law documentation requirement
- Second driver (full data + CEPiK check) — insurance invalidated if unlisted driver causes accident
- Custom terms notes field in PDF — per-rental conditions standard across all competitors
- Email subject = case number + registration — basic operational hygiene, inbox filtering
- Hide VIN/production year from client — standard Polish rental industry practice

**Should have (differentiators):**
- Document scanning (OCR) — no Polish competitor advertises this; saves 2-3 min per rental
- Return protocol — structured formal process replacing current minimal returnData JSON
- Rental settlement tracking — currently zero financial visibility post-rental
- Encrypted PDF (password = registration) — genuine RODO improvement for PESEL/ID in email attachments
- Google Places autocomplete for pickup/return location — professional delivery/collection service support
- Vehicle classification system — pricing by class, fleet organization

**Defer (v2+):**
- Automated NIP/REGON company lookup (unreliable BIR1 API, manual entry sufficient)
- AI/custom OCR model (ML Kit accuracy is adequate for Latin-script Polish documents)
- Full offline OCR (no quality on-device Polish document models exist)
- More than one second driver (client asked for exactly one)
- Automated settlement/invoicing integration (no accounting system to target)

### Architecture Approach

All 17 features integrate into the existing NestJS module architecture without restructuring it. Three new API modules are added (documents/, places/, settlements/). Four existing modules are extended (vehicles/, rentals/, contracts/, customers/). Six new Prisma models are added (CustomerDocument, VehicleClass, RentalDriver, AppSetting, RentalSettlement, SettlementPayment). All new columns are nullable or have defaults — a single zero-downtime Prisma migration is viable, though splitting into sequential feature-grouped migrations is safer. The critical architectural constraint is ContractFrozenData versioning: a schemaVersion field plus ContractFrozenDataV1 | ContractFrozenDataV2 discriminated union prevents old contracts from breaking when the PDF template is updated.

**Major components and responsibilities:**
1. `DocumentsModule` (new) — OCR photo upload to R2, on-device text extraction via expo-text-extractor, returns parsed fields to mobile for worker review/correction
2. `PlacesModule` (new) — backend proxy to Google Places API; mobile never calls Google directly; stores place data in existing handoverData/returnData JSON
3. `SettlementsModule` (new) — PENDING/PARTIAL/SETTLED/DISPUTED lifecycle, payment recording, dashboard widget for unsettled rentals
4. `ContractFrozenDataV2` (schema redesign) — add schemaVersion, secondDriver, termsAccepted, rentalTerms, termsNotes, insuranceCaseNumber, vatDeductionRate, customer company fields, pickup/return location; used by all contract/PDF features
5. `PdfService` (extended) — new contract-v2.hbs template (all new contract fields), separate return-protocol.hbs, post-processing with @pdfsmaller/pdf-encrypt-lite before R2 upload
6. Mobile wizard (extended) — customer address, company toggle, terms acceptance, second driver sub-form, Google Places autocomplete in handover/return steps

### Critical Pitfalls

1. **ContractFrozenData breakage on old contracts** — New Handlebars template fields crash or render blank on old contract JSON blobs. Prevention: add schemaVersion: 2 to new contracts; wrap ALL new template fields in {{#if}} guards; keep contract-v1.hbs untouched; use discriminated union in shared types. Design this before implementing any individual feature.

2. **OCR requires EAS dev client, not Expo Go** — expo-text-extractor crashes in Expo Go with "NativeModule is null." Set up a development client profile (eas build --profile development) before writing any OCR code. This is a prerequisite task, not a feature task.

3. **PDF encryption must be pure JS for Railway** — Puppeteer has no native PDF encryption support (confirmed open GitHub issues #657, #6120). node-qpdf2 requires the qpdf system binary absent on Railway. Use @pdfsmaller/pdf-encrypt-lite (pure JS, RC4-128, zero deps) to post-process the buffer before R2 upload.

4. **Second driver must NOT reuse the Customer model** — Customer carries portal tokens, rental relations, archived status. Reusing it creates ghost records and PESEL uniqueness collisions. Use a dedicated RentalDriver model linked to Rental. Extract CEPiK verification into a DriverLicenseData interface both Customer and RentalDriver can use.

5. **Google Places API billing** — Every autocomplete keystroke is billable. Mitigation: 400ms debounce, 3-character minimum, session tokens, billing alert at $20/month, cache frequent pickup points as "favorite locations."

## Implications for Roadmap

Based on combined research, the correct phase structure is dependency-driven: design ContractFrozenData v2 first (cross-cuts everything), batch all PDF template changes into one phase, keep new-module work isolated, defer high-risk/high-complexity features last.

### Phase 1: Foundation + Simple Field Additions
**Rationale:** Leaf-node features with no downstream dependencies. Quick operational wins. No PDF template changes yet. EAS dev client setup happens here so Phase 4 is unblocked. AppSetting model created here for Phase 2.
**Delivers:** Complete customer forms in mobile (address), business rental support (NIP), insurance tracking, terms notes, email subject formatting, VIN privacy fix, vehicle class lookup table.
**Addresses features:** #8 client address, #4 company/NIP (schema + mobile form, PDF deferred to Phase 2), #7 insurance case number, #14 custom terms notes, #9 email subject, #10 hide VIN/year, #2 vehicle classes.
**Avoids:** Pitfall 15 (migration complexity — all nullable columns); Pitfall 12 (vehicle class over-engineering).

### Phase 2: ContractFrozenData v2 + PDF Template Batch
**Rationale:** All features that modify ContractFrozenData and contract.hbs must be done in one coordinated pass. This is the highest-leverage sequencing decision in v3.0. Seven features touch the same template — one rewrite beats seven incremental ones.
**Delivers:** Versioned ContractFrozenData (schemaVersion, discriminated union, contract-v2.hbs), terms acceptance checkbox, editable rental terms with locking at PARTIALLY_SIGNED, VAT payer status display in PDF, second driver section in contract, company/NIP section in contract, all template fields guarded by {{#if}}.
**Addresses features:** #5 terms acceptance, #3 editable terms, #11 VAT status, #13 second driver (model + contract/PDF), and the PDF portions of #4, #7, #10.
**Avoids:** Pitfall 2 (frozen data breakage — versioned template), Pitfall 7 (terms mutability — locked at PARTIALLY_SIGNED), Pitfall 4 (second driver model design).

### Phase 3: New Modules — Google Places + Settlement
**Rationale:** Independent new modules that don't require Phase 2 PDF work to be complete. Places is needed before Phase 4 (return protocol uses location data). Settlement is web-admin-only and self-contained.
**Delivers:** Pickup/return location autocomplete in mobile (backend-proxied), settlement lifecycle tracking with unsettled-rentals dashboard, VAT return notification triggered on rental return.
**Addresses features:** #6 Google Places, #16 settlement tracking, #12 VAT notification on return.
**Avoids:** Pitfall 5 (Places billing — debounce + billing alerts + session tokens before production), Pitfall 9 (settlement scope creep — status+notes+amounts only), Pitfall 10 (API key exposure — server-side proxy).

### Phase 4: High-Complexity Differentiators
**Rationale:** OCR and return protocol are the most complex and riskiest features. Self-contained — OCR doesn't block anything; return protocol uses location data from Phase 3. EAS dev client from Phase 1 makes OCR development possible. Stable contract/rental model from Phases 1-2 is the foundation.
**Delivers:** OCR document scanning (pre-fills customer form from Polish ID card + driver license photo with worker review), structured return protocol (multi-step wizard + return-protocol.hbs PDF + dual signatures), encrypted PDF delivery (post-process signing pipeline, SMS password to customer).
**Addresses features:** #1 document scanning, #15 return protocol, #17 encrypted PDF.
**Avoids:** Pitfall 1 (dev client — already solved), Pitfall 3 (PDF encryption binary — pure-JS library), Pitfall 6 (OCR UX — editable pre-fill, not auto-submit), Pitfall 11 (return protocol as separate template, not contract extension).

### Phase Ordering Rationale

- Phase 1 before Phase 2: AppSetting model needed for default terms; NIP schema needed before NIP section in PDF template; insurance case number field needed before email subject logic.
- Phase 2 batched together: ContractFrozenData and contract.hbs must be designed holistically. Seven features all modify the same template and interface — one coordinated pass prevents repeated rework and TypeScript churn.
- Phase 3 after Phase 2: VAT notification depends on VAT payer status (Phase 2). Location data from Places is used by return protocol PDF (Phase 4).
- Phase 4 last: Riskiest features benefit from all earlier model/contract work being stable. Encrypted PDF wraps the final signing flow — safe to add last when the signing pipeline is proven.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (OCR parsing):** Polish document layout parsing (MRZ zone extraction, pre-2019 vs post-2019 Polish ID card format differences) is implementation-sensitive. Build a parsing utility with unit tests for PESEL (11 digits), Polish ID number (3 letters + 6 digits), and name patterns before integrating into the wizard.
- **Phase 4 (PDF encryption compatibility):** Validate that @pdfsmaller/pdf-encrypt-lite RC4-128 output is reliably openable by iOS Files, Adobe Reader Android, and common email clients before committing.
- **Phase 3 (Places session tokens):** react-native-google-places-autocomplete session token behavior has known issues in older versions. Validate tokens are actually sent in v2.6.4 before production deployment.

Phases with standard patterns (skip research-phase):
- **Phase 1:** All nullable schema fields + mobile form additions. Standard NestJS/Prisma/Expo patterns throughout.
- **Phase 2 (terms/VAT/second driver model):** Architecture fully mapped, ContractFrozenData versioning pattern is clear, RentalDriver model is specified.
- **Phase 3 (settlement):** New module following exact same NestJS structure as existing modules. No novel patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All 4 new libraries verified against Expo 54 / NestJS 11. Incompatibilities confirmed via official GitHub issues. |
| Features | HIGH | Polish rental industry competitive analysis (RentCarSoft, CorCode, Enterprise PL, Avis PL) plus direct client requirements. Scope is well-defined. |
| Architecture | HIGH | Based on direct codebase inspection of schema.prisma, ContractFrozenData, PdfService, mobile routing. Not inference — actual code reviewed. |
| Pitfalls | HIGH | Critical pitfalls confirmed via official sources (Puppeteer GitHub issues, Google Places API billing docs, Expo native module constraints). |

**Overall confidence:** HIGH

### Gaps to Address

- **OCR parsing accuracy for Polish documents:** expo-text-extractor returns unstructured text. Regex/parsing logic for PESEL, ID numbers, and names from ML Kit output needs iterative testing on real document samples. Budget extra time and set worker expectations (OCR is a pre-fill helper, not auto-complete).
- **@pdfsmaller/pdf-encrypt-lite production validation:** Newer library (Feb 2026) with fewer production deployments than node-qpdf2. Test encrypted PDFs on target readers before Phase 4 ships.
- **Google Places session token validation:** Confirm session tokens are actually sent by react-native-google-places-autocomplete v2.6.4 before enabling in production to avoid billing surprises.
- **ContractFrozenData V1 type guard:** Existing production contracts have no schemaVersion field. TypeScript narrowing must treat all contracts without schemaVersion as V1. Design this type guard before Phase 2 implementation begins.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: apps/api/prisma/schema.prisma, packages/shared/src/types/contract.types.ts, apps/api/src/contracts/pdf/pdf.service.ts, apps/mobile/app/ routing
- [Puppeteer #657](https://github.com/puppeteer/puppeteer/issues/657) + [#6120](https://github.com/puppeteer/puppeteer/issues/6120) — PDF encryption not supported natively
- [Google Places API Pricing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) — billing structure confirmed
- [Biala Lista VAT API](https://www.gov.pl/web/kas/api-wykazu-podatnikow-vat) — free gov.pl NIP/VAT verification
- Enterprise Poland, Avis Poland general conditions — second driver signing requirement confirmed

### Secondary (MEDIUM confidence)
- [expo-text-extractor GitHub](https://github.com/pchalupa/expo-text-extractor) — v2.0.0, Feb 2026, Expo SDK 52+ compatible; newer library, lower production deployment volume
- [@pdfsmaller/pdf-encrypt-lite npm](https://www.npmjs.com/package/@pdfsmaller/pdf-encrypt-lite) — pure JS, RC4-128; functional but newer
- [react-native-google-places-autocomplete npm](https://www.npmjs.com/package/react-native-google-places-autocomplete) — 60K+ weekly downloads, v2.6.4; session token behavior needs validation
- Polish rental competitor analysis (RentCarSoft, CorCode, Nomora 2026 roundup) — feature landscape

### Tertiary (LOW confidence)
- NIP/REGON API (BIR1) reliability claims — based on community reports, not direct testing
- OCR accuracy estimates for Polish diacritics — qualitative assessment, not benchmarked

---
*Research completed: 2026-04-12*
*Ready for roadmap: yes*
