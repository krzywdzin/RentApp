# Domain Pitfalls

**Domain:** Polish car rental management system - v3.0 feature additions
**Researched:** 2026-04-12
**Scope:** Pitfalls specific to ADDING v3.0 features (OCR, Google Places, PDF encryption, editable terms, company/NIP, second driver, settlement tracking, return protocol, vehicle classes) to the existing RentApp system.

Note: v1.0 pitfalls (PESEL encryption, digital signatures, CEPiK dependency, audit trail, offline, photo compression) were addressed in previous versions. This file focuses on v3.0 integration risks.

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: OCR Library Requires Expo Dev Client -- No Expo Go

**What goes wrong:** All OCR/ML Kit libraries for React Native (`@react-native-ml-kit/text-recognition`, `react-native-mlkit`, `expo-ocr`) require native modules. They crash immediately in Expo Go with "NativeModule is null" errors. The entire OCR feature is untestable in Expo Go.

**Why it happens:** Google ML Kit requires native iOS/Android SDK bindings compiled into the app binary. Expo Go bundles a fixed set of native modules and ML Kit is not one of them.

**Consequences:** If the team tries to prototype OCR in Expo Go, they waste days on cryptic errors. If daily development workflow relies on Expo Go, switching to dev client changes how every developer works.

**Prevention:**
- The app already uses EAS Build for APK (v2.2). Set up an EAS Development Client profile (`eas build --profile development`) BEFORE starting any OCR work.
- Test the dev client workflow on both Android and iOS before writing OCR code.
- Start with a minimal proof-of-concept: take photo -> extract text -> display in TextInput. If this works, the rest is UI.

**Detection:** "NativeModule.RNMLKitTextRecognition is null" at runtime in Expo Go.

**Phase relevance:** Must be resolved in the first task of OCR implementation. This is a prerequisite, not a feature.

---

### Pitfall 2: ContractFrozenData Schema Change Breaks Existing Contracts

**What goes wrong:** v3.0 adds many new fields to the contract: company NIP, second driver, editable terms, insurance case number, VAT status, pickup/return location, rental notes. The current `ContractFrozenData` interface is frozen into the `Contract.contractData` JSON column at signing time. Old contracts have the OLD shape. The Handlebars PDF template crashes or renders blank when encountering old contracts missing new fields.

**Why it happens:** The current architecture freezes all contract data into a JSON blob at creation. The PDF template reads from this blob. Adding `{{customer.companyNip}}` or `{{secondDriver.firstName}}` to the template and then viewing an old contract = broken rendering.

**Consequences:** Cannot re-generate PDFs for old contracts. Admin panel crashes viewing historical contract details. Potential data integrity issues if migration tries to backfill frozen data.

**Prevention:**
- NEVER backfill or modify existing `contractData` JSON -- it is an immutable legal record
- Add a `schemaVersion` field to new `ContractFrozenData` entries (e.g., `schemaVersion: 2`)
- All new Handlebars template fields MUST use `{{#if fieldName}}` guards
- Create versioned templates: `contract-v1.hbs` (current, untouched), `contract-v2.hbs` (with new fields). Select based on `schemaVersion`.
- In shared types, use a discriminated union: `ContractFrozenDataV1 | ContractFrozenDataV2` so TypeScript catches missing field access

**Detection:** PDF generation fails for older rentals; blank fields in re-generated PDFs; TypeScript errors when accessing new fields on old contracts without narrowing.

**Phase relevance:** Must be the FIRST thing designed in v3.0 -- every other feature (terms, company, second driver, locations) depends on how frozen data is versioned.

---

### Pitfall 3: PDF Encryption Requires System Dependency (qpdf) on Railway

**What goes wrong:** Puppeteer generates PDFs but has ZERO support for encryption or password protection (confirmed in puppeteer/puppeteer#657, still open). The commonly recommended approach is post-processing with `node-qpdf2`, which shells out to the `qpdf` CLI binary. Railway containers do not have `qpdf` installed by default.

**Why it happens:** `page.pdf()` produces an unencrypted buffer. PDF encryption is a separate concern. `node-qpdf2` is a wrapper around a system binary, not pure JavaScript.

**Consequences:** Works locally (qpdf installed via brew/apt), fails silently or crashes in production on Railway. Emergency fix requires custom Dockerfile or a library swap under pressure.

**Prevention:**
- **Recommended:** Use `@pdfsmaller/pdf-encrypt-lite` -- pure JS, ~7KB, works directly on Buffers, peer-depends on `pdf-lib`. It provides RC4 128-bit encryption which is adequate for password-protecting rental contracts (this is deterrent security, not classified documents).
- Workflow: `PdfService.generateContractPdf()` returns `Buffer` -> pass through `encryptPDF()` -> upload encrypted buffer to R2.
- **Alternative (if AES-256 required):** Add qpdf to Railway via a custom Dockerfile: `RUN apt-get update && apt-get install -y qpdf`. Use `node-qpdf2`. Test in Docker locally first.
- **Password strategy:** requirement says password = registration plate number. Send the password info via SMS (already have SMSAPI integration). Do NOT put the password in the email body alongside the PDF attachment.

**Detection:** `Error: spawn qpdf ENOENT` in production logs. Or: PDF opens without asking for password.

**Phase relevance:** Implement after the basic PDF template v2 is working. Encryption is a post-processing step that wraps the existing `generateContractPdf()` output.

---

### Pitfall 4: Second Driver Does Not Fit the Customer Model

**What goes wrong:** Adding a second driver seems like "just another customer." But the `Customer` model has: portal tokens, retention policies, rental relations, PESEL encryption, archived status. A second driver needs a subset (name, PESEL, license, CEPiK check) but not the full `Customer` lifecycle. Reusing `Customer` creates ghost records (customers with no rentals, no portal access, polluting search results). Creating inline JSON loses CEPiK verification tracking.

**Why it happens:** The Prisma schema has `Customer` as a full entity. A second driver is conceptually "a person who can drive" but not "a customer who rents." The ORM encourages reusing existing models.

**Consequences:** Ghost Customer records. CEPiK verification service tightly coupled to Customer entity needs refactoring. Customer search returns second drivers. PESEL uniqueness constraints may collide if the same person is both a customer and a second driver.

**Prevention:**
- Create a dedicated `SecondDriver` model: `{ id, rentalId, firstName, lastName, peselEncrypted, peselHmac, licenseNumEncrypted, licenseNumHmac, licenseCategory, phone? }`. Link to Rental (1:1 optional), not Customer.
- Extract CEPiK verification logic into a service method that accepts "a person's license data" (interface `DriverLicenseData { licenseNumber, firstName, lastName, pesel? }`) rather than a Customer entity. Both Customer and SecondDriver can use it.
- Add `secondDriver` as an optional section in `ContractFrozenDataV2`.
- Mobile wizard: "Dodaj drugiego kierowce" toggle that reveals additional fields inline -- NOT a navigation to customer creation.
- Apply the same encryption pattern (encrypted JSON + HMAC) used for Customer's PESEL/license fields.

**Detection:** Orphaned Customer records with no rentals; duplicate PESEL entries; CEPiK service type errors when passed a non-Customer entity.

**Phase relevance:** Data model design phase. Must be decided before building the mobile form or the PDF template section.

---

### Pitfall 5: Google Places API Billing Surprise

**What goes wrong:** Google Places API costs money per request. Every autocomplete keystroke that hits the API is a billable event. A busy rental office making 50 rentals/day with employees typing pickup/return locations = thousands of API calls/month.

**Why it happens:** Developers enable the API, test with small volume, deploy. Google charges ~$2.83/1000 Autocomplete requests and ~$17/1000 Place Details requests. No free tier for Places API (only $200/month Cloud credit which covers ~70K autocomplete calls but gets eaten quickly if Place Details are also called).

**Consequences:** Unexpected monthly bills of $50-200+. No way to retroactively limit spend.

**Prevention:**
- Aggressive debouncing: 400ms minimum before firing API call
- Minimum 3 characters before first API call
- Use session tokens (native SDK supports them) to bundle autocomplete + place details into one session charge (~$0.017/session vs separate pricing)
- Set Google Cloud billing budget alert at $20/month and a hard cap
- Cache frequent locations -- rental office pickup points are the same addresses repeatedly. Store them as "favorite locations" in the admin panel.
- Store the full address string + coordinates in the rental record, NOT just a Google Place ID (Place IDs can change and re-resolving costs money)

**Detection:** Google Cloud billing dashboard. High API call count in first operational week.

**Phase relevance:** Must configure billing alerts and debouncing before deploying to production. Test with realistic usage patterns.

---

## Moderate Pitfalls

### Pitfall 6: OCR Accuracy on Polish Documents Is Unreliable Without UX Guardrails

**What goes wrong:** ML Kit text recognition on a photo of a Polish dowod osobisty or prawo jazdy returns garbled text with field boundaries mixed up. Polish diacritics (ą, ę, ó, ś, ź, ż, ć, ń, ł) are frequently misread: ł -> l, ó -> o, ą -> a. Workers expect "scan and done" but get "scan and correct everything."

**Why it happens:** Polish ID cards have a specific layout but ML Kit returns unstructured text blocks. Glare, angles, fingers over text, and low light make it worse. There is no field-level extraction in basic ML Kit -- it returns a flat text string.

**Prevention:**
- Frame OCR as a "pre-fill helper" in the UI. Show extracted text in EDITABLE TextInputs. The worker reviews and corrects. Never auto-submit OCR results.
- For Polish ID cards, the MRZ (Machine Readable Zone) at the bottom is more reliable than visual text. Parse MRZ first for PESEL, name, document number.
- For driving licenses, field numbers (1. surname, 2. first name, 4b. date of issue, etc.) help with structured extraction -- but require parsing logic per document type.
- Image preprocessing before OCR: crop to document bounds, increase contrast, convert to grayscale (use `sharp` on the server or Expo Image Manipulator on device).
- Set worker expectations during training: OCR saves 50-70% of typing, not 100%.
- RODO consideration: if photos of documents are sent to the server for OCR, they must be deleted immediately after text extraction. Do NOT store document images (see v1.0 PITFALLS on UODO fines for document scanning). Process OCR on-device whenever possible.

**Detection:** Workers complaining "OCR doesn't work." High correction rate on pre-filled fields.

**Phase relevance:** OCR implementation phase. Build the editable pre-fill UI first, then add OCR as an enhancement.

---

### Pitfall 7: Editable Rental Terms Create Mutability Hazard

**What goes wrong:** "Editable terms per rental" introduces a question the current system doesn't have: when exactly are terms frozen? Currently, contract data freezes at creation. If terms are editable, can they change after the contract is generated but before signing? After partial signing? This ambiguity leads to contracts where the PDF shows different terms than what the customer saw on screen.

**Why it happens:** The current `ContractFrozenData` has a `conditions` object with numeric values but no free-text terms. Adding editable terms means adding a mutable text field to what was previously an immutable-at-creation pipeline.

**Prevention:**
- Add `terms: string[]` and `termsNotes: string` to `ContractFrozenDataV2`
- Terms are editable in the mobile wizard ONLY while contract status is `DRAFT`
- Once ANY signature is added (`PARTIALLY_SIGNED`), terms are locked. No exceptions.
- Store a `defaultTermsTemplate` at the company/admin level. Each new rental pre-fills from this template. Per-rental overrides are stored in the frozen data.
- The "uwagi do warunkow najmu" (notes to terms) is a separate free-text field in the frozen data -- do not mix it into the terms array.
- UI must clearly show "locked" state after signing begins.

**Detection:** Customer disputes contract terms. PDF shows different terms than database record.

**Phase relevance:** Must be designed alongside the ContractFrozenDataV2 schema. The locking rules must be enforced at the API level, not just in the mobile UI.

---

### Pitfall 8: NIP Validation Has Multiple Layers -- Checksum Is Not Enough

**What goes wrong:** Team implements NIP checksum validation (mod-11 algorithm with weights 6,5,7,2,3,4,5,6,7) client-side and considers it done. But the business needs: (1) verify the company exists, (2) check VAT payer status for the 100%/50%/nie VAT field, (3) auto-fill company name and address. Checksum alone validates format, nothing more.

**Why it happens:** NIP checksum is trivial to implement. The real value -- government API integration -- requires understanding rate limits, API availability, and data freshness.

**Prevention:**
- **Layer 1 (client-side, instant):** NIP format + checksum via `validate-polish` npm package. Already in the monorepo ecosystem (pure JS, no native deps).
- **Layer 2 (server-side, async):** Hit the free gov.pl Biala Lista VAT API: `GET https://wl-api.mf.gov.pl/api/check/nip/{nip}?date={YYYY-MM-DD}`. Free, no auth needed. Returns VAT status (czynny/zwolniony/niezarejestrowany). Rate limited: 10 requests/second, 100 searches or 5000 checks per day. Use the "check" endpoint (higher daily limit).
- **Layer 3 (optional, paid):** nip24.pl API for full GUS/REGON data (company name, address, legal form). Has a Node.js SDK. Paid service. Consider only if auto-fill of company data is a priority.
- Cache NIP verification results: store status, timestamp, source. Don't re-check on every page load.
- VAT status field on the customer/company record should be an ENUM (`ACTIVE_VAT | EXEMPT_VAT | NOT_REGISTERED | UNKNOWN`), not a boolean. The "100%/50%/nie" in the requirements refers to VAT deduction rate, which is a business rule applied to the enum status.

**Detection:** Invalid company data accepted. VAT status incorrect on contract.

**Phase relevance:** Implement Layer 1 (checksum) immediately with the form. Layer 2 (Biala Lista) as a background check. Layer 3 only if the business explicitly wants auto-fill.

---

### Pitfall 9: Settlement Tracking Scope Creep Into Accounting

**What goes wrong:** "Sledzenie rozliczenia najmu" starts as a simple paid/unpaid status but requirements grow: partial payments, payment dates, payment methods, deposit handling, damage deductions, late fee calculations, multi-payment tracking. The team ends up building a half-baked accounting system.

**Why it happens:** The business says "track settlements" but the actual need is ambiguous. Once a "payments" table exists, every financial edge case gets shoe-horned into it.

**Prevention:**
- Define scope NOW: settlement tracking is a STATUS + NOTES system, NOT a payment processing or accounting system. Get explicit sign-off.
- Minimal model: `Settlement { rentalId (unique), status: PENDING|PARTIAL|PAID|DISPUTED, totalDue: Int, totalPaid: Int, notes: String?, paidAt: DateTime?, settledById: String? }` on the Rental model, or as a related record.
- The web admin sets a rental's settlement status with an amount and optional notes. That is the feature.
- Do NOT add: payment method tracking, bank integration, automatic VAT calculation, invoice generation, multi-payment ledger.
- If the business later needs invoicing, that is a separate system (Fakturownia, wFirma, etc.) and out of scope per PROJECT.md.

**Detection:** Feature requirements growing beyond the original ask. Requests for "just one more field" on the settlement form.

**Phase relevance:** Define scope in initial design. Implement as one of the simpler v3.0 features. Resist scope expansion.

---

### Pitfall 10: Google Places Library Choice -- JS HTTP vs Native SDK

**What goes wrong:** The most popular library `react-native-google-places-autocomplete` (by FaridSafi) is pure JS making HTTP calls directly to Google's API. It has 500+ open GitHub issues, no proper session token support, CORS issues on web, and exposes the API key in the JavaScript bundle. Developers choose it because it appears first on npm and has the most downloads.

**Why it happens:** The JS library is easy to install (no native deps, works in Expo Go). The native SDK alternatives require a dev client build.

**Prevention:**
- Since OCR already requires a dev client build (Pitfall 1), there is NO extra cost to using a native Places SDK wrapper.
- Use `expo-google-places` or `react-native-google-places-sdk` -- both use the native Google Places SDK, support session tokens natively, and keep the API key in native config (not exposed in JS).
- For the web admin panel (Next.js), use Google Maps JavaScript API directly via `@react-google-maps/api` or the Places Autocomplete widget -- this is a completely separate integration path.
- Restrict the API key: Android apps restriction (SHA-1 fingerprint) + iOS apps restriction (bundle ID) + Places API only. Create a SEPARATE key for web with HTTP referrer restrictions.

**Detection:** API key visible in React Native JS bundle. CORS errors. Session tokens not reducing billing.

**Phase relevance:** Library choice must be made before implementation. Prototype with native SDK early to validate it works with the dev client.

---

## Minor Pitfalls

### Pitfall 11: Return Protocol Is a Separate Template, Not an Extension of the Contract

**What goes wrong:** Developers try to append the return protocol to the existing contract PDF template, creating a mega-template with conditional sections. The Handlebars template becomes unmaintainable -- contract.hbs grows from a complex 2-page template to an even more complex 3-4 page conditional template.

**Prevention:**
- Create a separate `return-protocol.hbs` template and a `generateReturnProtocolPdf()` method in PdfService.
- The return protocol has different data: return date/time, final mileage, fuel level, damage assessment, settlement summary, photos reference.
- Link to Rental, not Contract. Add `returnProtocolPdfKey` and `returnProtocolPdfGeneratedAt` to the Rental model.
- A rental can have multiple contracts (original + annexes) but exactly one return protocol.

**Phase relevance:** Implement after the v2 contract template is stable. The return protocol is independent.

---

### Pitfall 12: Vehicle Classes Are a Simple Lookup -- Don't Over-Engineer

**What goes wrong:** Vehicle classes get designed as a complex hierarchy (Class -> Subclass -> Tier -> Variant) when the business just needs "Ekonomiczna, Kompaktowa, SUV, Premium" as admin-defined labels.

**Prevention:**
- Simple model: `VehicleClass { id, name: String, defaultDailyRateNet: Int?, sortOrder: Int, isActive: Boolean }`
- Many-to-one from Vehicle to VehicleClass (nullable -- existing vehicles don't have a class yet)
- Admin CRUD in the web panel with drag-and-drop reordering
- Migration: add nullable `vehicleClassId` column to Vehicle. No backfill required -- workers assign classes gradually.

**Phase relevance:** One of the simplest v3.0 features. Can be implemented early as a warm-up.

---

### Pitfall 13: Hiding VIN/Year from Customer Requires Backend Filtering

**What goes wrong:** Developers hide VIN and production year in the customer portal frontend only. The API still returns this data -- visible in browser DevTools network tab.

**Prevention:**
- The portal JWT has `CUSTOMER` role. Use it to strip `vin` and `year` from vehicle responses at the API level (response serializer or DTO transformation).
- Decide if the customer-facing PDF copy also omits VIN/year. If yes, the PDF template needs a variant or a conditional section based on whether the PDF is for the customer or the company's records.
- Do not rely on frontend-only data hiding for anything the client considers sensitive.

**Phase relevance:** Small change. Can be done alongside any portal work.

---

### Pitfall 14: Email Subject with Registration + Case Number -- Encoding and Length

**What goes wrong:** Email subject "Umowa najmu WE 12345 - sprawa ubezp. 2024/XYZ/1234" may hit length limits on some email clients (recommended max ~78 chars for subject line). Special characters in case numbers (slashes, dots) display inconsistently.

**Prevention:**
- Keep email subject template short: `Umowa najmu {registration}` or `{registration} - {caseNumber}` if case number exists.
- Ensure Resend/Nodemailer uses proper MIME header encoding for UTF-8 subjects (this should be default but verify).
- Test with edge cases: long case numbers, case numbers with special characters.

**Phase relevance:** Trivial change in the email service. Can be done at any point.

---

### Pitfall 15: Migration Complexity -- Many Schema Changes at Once

**What goes wrong:** v3.0 adds many new fields and models simultaneously: VehicleClass, SecondDriver, settlement fields on Rental, returnProtocol fields, company/NIP fields on Customer, terms template, etc. A single massive migration is risky (long lock time, hard to debug failures, hard to rollback).

**Prevention:**
- Split into multiple sequential migrations, each adding one concern: (1) VehicleClass model + FK, (2) Customer company fields, (3) SecondDriver model, (4) Rental settlement fields, (5) Rental return protocol fields, (6) Contract schema version, etc.
- All new columns on existing tables MUST be nullable or have defaults. No non-null columns on populated tables.
- Test each migration on a copy of production data (Neon DB allows branching) before applying to production.
- Run `prisma migrate deploy` in CI to catch migration issues before production.

**Detection:** Migration timeout. Lock wait errors. Prisma migration status showing failed migrations.

**Phase relevance:** Plan migration strategy at the start of v3.0. Execute migrations incrementally as each feature is built.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Schema design (first) | Massive migration + frozen data breakage | Version ContractFrozenData; split migrations; all new cols nullable |
| Dev client setup | OCR + native Places SDK need dev client | Set up EAS dev client BEFORE feature work begins |
| OCR document scanning | Poor accuracy; RODO risk of storing doc images | OCR is pre-fill helper; process on-device; never store images |
| Google Places | Billing surprise; wrong library choice; key exposure | Budget alerts; native SDK (since dev client required anyway); restrict key |
| PDF encryption | System dependency breaks in Railway | Use pure-JS encryption (`@pdfsmaller/pdf-encrypt-lite`); test in Docker |
| Editable terms | Mutability after signing; template divergence | Lock at PARTIALLY_SIGNED; version templates |
| Company/NIP | Checksum-only validation; VAT status as boolean | Layer validation (local + Biala Lista); use enum for VAT status |
| Second driver | Reusing Customer model; CEPiK coupling | Dedicated SecondDriver model; extract driver verification interface |
| Return protocol | Template bloat in contract.hbs | Separate template; link to Rental not Contract |
| Settlement tracking | Scope creep into accounting | Define scope boundary upfront; status + notes + amount only |
| Vehicle classes | Over-engineering a lookup table | Simple model with name + sort order; nullable FK on Vehicle |
| VIN/year hiding | Frontend-only hiding; API still exposes data | Backend response filtering based on CUSTOMER role |

## Sources

- [Puppeteer #657: no PDF encryption support](https://github.com/puppeteer/puppeteer/issues/657) - HIGH confidence, official GitHub issue, still open
- [@pdfsmaller/pdf-encrypt-lite on npm](https://www.npmjs.com/package/@pdfsmaller/pdf-encrypt-lite) - MEDIUM confidence, newer pure-JS library
- [node-qpdf2](https://github.com/Sparticuz/node-qpdf2) - HIGH confidence, established qpdf wrapper
- [react-native-google-places-autocomplete issues](https://github.com/FaridSafi/react-native-google-places-autocomplete/issues) - HIGH confidence, 500+ open issues visible
- [expo-google-places-autocomplete](https://github.com/alanjhughes/expo-google-places-autocomplete) - MEDIUM confidence, native SDK wrapper
- [validate-polish on npm](https://www.npmjs.com/package/validate-polish) - HIGH confidence, Polish validation utility
- [Biala Lista VAT API (gov.pl)](https://www.gov.pl/web/kas/api-wykazu-podatnikow-vat) - HIGH confidence, official government API documentation
- [nip24.pl Node.js SDK](https://nip24.pl/en/nowosc-biblioteka-javascript-dla-node-js-ze-wszystkimi-funkcjami-juz-dostepna/) - MEDIUM confidence, commercial service with Node.js support
- [@react-native-ml-kit/text-recognition](https://www.npmjs.com/package/@react-native-ml-kit/text-recognition) - HIGH confidence, npm package
- [react-native-mlkit by Infinite Red](https://docs.infinite.red/react-native-mlkit/) - MEDIUM confidence, maintained by known RN consultancy
- [Google Places API pricing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) - HIGH confidence, official Google documentation
- Existing codebase: PdfService (Puppeteer + Handlebars), ContractFrozenData interface, Customer/Rental/Contract Prisma models, shared types - HIGH confidence, direct code inspection
