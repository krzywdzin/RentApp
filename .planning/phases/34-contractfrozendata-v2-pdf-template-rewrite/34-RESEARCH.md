# Phase 34: ContractFrozenData v2 & PDF Template Rewrite - Research

**Researched:** 2026-04-12
**Domain:** Contract data versioning, PDF template rewrite, rich text terms, second driver, Handlebars/Puppeteer
**Confidence:** HIGH

## Summary

Phase 34 is a coordinated pass that touches the contract system from database schema through PDF output. The core challenge is extending `ContractFrozenData` from v1 to v2 while keeping old contracts rendering correctly, rewriting the Handlebars PDF template to support dynamic terms (TipTap HTML), company/VAT data, second driver, and VIN/year hiding -- all without breaking the existing signing flow.

The existing codebase has strong patterns to follow: `rodoConsentAt` pattern for `termsAcceptedAt`, encrypted PII pattern (JSON + HMAC) for second driver fields, `buildFrozenData()` as the single point for assembling contract snapshots, and Puppeteer + Handlebars for PDF generation. The main risk is the Handlebars template rewrite -- page 2 of `contract.hbs` has 21 hardcoded `<li>` conditions that must be replaced with dynamic `{{{termsHtml}}}` while old v1 contracts retain their hardcoded text.

**Primary recommendation:** Version the ContractFrozenData with a `version: number` field, use a single template with `{{#if}}` guards (not separate v1/v2 templates), and freeze terms HTML at contract creation time so the PDF is always self-contained.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Default terms template stored in AppSetting -- admin edits via TipTap rich text editor in web panel
- Per-rental override: terms HTML stored on Rental/Contract -- worker can customize before signing
- Worker CAN edit terms in mobile -- using TipTap inside a WebView (same editor, embedded in React Native WebView)
- Terms are frozen into contractData at signing time -- changes to the default template do NOT affect existing contracts
- Page 2 of contract.hbs currently has hardcoded `<ol>` conditions -- replace with dynamic HTML from frozen terms
- Separate plain-text field `termsNotes` on Rental -- worker adds per-rental notes
- Notes appear in PDF as an additional section after the main terms (e.g. "Uwagi dodatkowe:")
- Second driver added in mobile wizard at the contract step (before signatures) -- "Dodaj drugiego kierowce" button
- Second driver has full data like main customer: imie, nazwisko, PESEL, nr dowodu, nr prawa jazdy, adres, telefon
- CEPiK verification for second driver (same as main renter)
- Second driver signs the contract -- additional signature pair
- Data model: dedicated `RentalDriver` model linked to Rental (NOT reusing Customer model)
- Second driver data appears in PDF in a dedicated section
- Second driver data frozen in ContractFrozenData v2
- Client sees VIN and year NOWHERE: not in PDF contract, not in customer portal
- Workers and admins see VIN/year as before -- no changes to admin/worker views
- In PDF: VIN and year rows simply removed (no placeholder)
- In customer portal API: VIN and year fields excluded from response
- ContractFrozenData v2 still stores VIN/year (needed internally) -- just not rendered in client-facing outputs
- Klient must read terms and check acceptance checkbox before signing
- Terms displayed in WebView (HTML from TipTap) for consistency with PDF
- Checkbox text: "Zapoznalem sie z warunkami najmu i akceptuje je" (or similar)
- `termsAcceptedAt: DateTime?` on Contract -- records when customer accepted
- Cannot proceed to signature capture until checkbox is checked
- Add `version: number` field to ContractFrozenData (v1 = existing, v2 = new fields)
- v2 adds: customer address fields, company/NIP/VAT fields, insurance case number, termsHtml, termsNotes, secondDriver object, vehicleClassName
- Old contracts (v1) must render correctly -- template checks version and falls back to v1 layout

### Claude's Discretion
- Exact TipTap configuration (extensions, toolbar buttons)
- ContractFrozenData v2 exact field naming
- How WebView TipTap editor is embedded in mobile (bridge, postMessage, etc.)
- Second driver signature type naming
- Terms acceptance UX placement (dedicated step vs on signature screen)
- AppSetting model design for default terms template

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| KLIENT-05 | Dane firmy (NIP, nazwa firmy) i status VAT pojawiaja sie w umowie PDF | ContractFrozenData v2 adds `rental.isCompanyRental`, `rental.companyNip`, `rental.vatPayerStatus`; PDF template conditional company section |
| FLOTA-04 | Klient nie widzi numeru VIN ani roku produkcji w portalu klienta | Portal API response filtering in `PortalService.getRentals()` and `getRentalDetail()` -- exclude VIN/year from `PortalRentalDto` |
| FLOTA-05 | Numer VIN i rok produkcji nie pojawiaja sie w PDF umowy | Remove VIN/year rows from contract.hbs vehicle section; data still stored in frozen data |
| UMOWA-01 | Admin moze edytowac warunki najmu w panelu webowym za pomoca edytora tekstu | TipTap rich text editor in web admin settings page; store HTML in AppSetting table |
| UMOWA-02 | Pracownik moze dostosowac warunki najmu indywidualnie dla kazdego wynajmu | Per-rental `rentalTerms` field; TipTap in WebView for mobile editing; frozen at contract creation |
| UMOWA-03 | Klient widzi warunki najmu i musi potwierdzic checkbox-em przed podpisem | WebView terms display + acceptance checkbox in mobile contract step; `termsAcceptedAt` on Contract |
| UMOWA-04 | Pracownik moze dodac uwagi do warunkow najmu -- uwagi pojawiaja sie w PDF | `termsNotes` plain-text field on Rental; rendered in PDF as "Uwagi dodatkowe:" section |
| NAJEM-05 | Pracownik moze dodac drugiego kierowce (dane osobowe + nr prawa jazdy) | `RentalDriver` model with encrypted PII; mobile form in contract step; frozen in v2 data |
| NAJEM-06 | Drugi kierowca weryfikowany jest przez CEPiK | Reuse `CepikService.verify()` with `driverId` instead of `customerId`; extend CepikVerification model |
| NAJEM-07 | Dane drugiego kierowcy pojawiaja sie w umowie PDF | Dedicated second driver section in contract.hbs; conditional on `secondDriver` being non-null |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Handlebars | ^4.7.8 (installed) | PDF template rendering | Already used in PdfService; `{{{triple-stache}}}` for unescaped HTML injection |
| Puppeteer | ^24.40.0 (installed) | HTML-to-PDF generation | Already used; no changes needed to PDF generation pipeline |
| Prisma | 6.x (installed) | Database ORM | Schema changes via `prisma migrate diff` + manual SQL (established Phase 33 pattern) |
| Zustand | (installed) | Mobile state management | `rental-draft.store.ts` needs new fields for second driver + terms |
| react-native-webview | ~13.15.0 (installed) | Terms display + TipTap editing in mobile | Already installed; zero new dependencies for mobile |

### New Additions
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tiptap/react` | ^3.22.3 | Rich text editor for web admin terms editing | Web admin settings page only |
| `@tiptap/starter-kit` | ^3.22.3 | Essential extensions (bold, italic, lists, headings) | Bundled with TipTap |
| `@tiptap/pm` | ^3.22.3 | ProseMirror peer dependency | Required by TipTap |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TipTap | Quill | TipTap is headless (fits shadcn design system), HTML output maps directly to Handlebars |
| Single versioned template | Separate v1.hbs / v2.hbs | Single template with guards is simpler to maintain; v1 data uses fallback rendering |
| RentalDriver model | Reuse Customer model | Customer has portal tokens, retention, PESEL uniqueness -- ghost records, wrong abstraction |

**Installation:**
```bash
# Web admin only
cd apps/web && npm install @tiptap/react @tiptap/starter-kit @tiptap/pm
```

**Version verification:** TipTap 3.22.3 is the latest stable release as of 2026-04-12 (verified via npm registry). Note: STACK.md recommended ^2.11.0 but TipTap has since released v3.x. Use v3.

## Architecture Patterns

### Data Flow: Terms Lifecycle
```
1. Admin writes default terms via TipTap (web) -> stored in AppSetting('default_rental_terms')
2. New rental created -> Rental.rentalTerms = null (uses default) or custom HTML
3. Worker edits per-rental terms in mobile -> Rental.rentalTerms = custom HTML
4. Contract created -> buildFrozenData() freezes termsHtml (from rental or default)
5. PDF generated -> {{{termsHtml}}} in template renders frozen HTML
6. Terms locked once ANY signature added (PARTIALLY_SIGNED)
```

### Data Flow: Second Driver
```
1. Worker taps "Dodaj drugiego kierowce" in contract step
2. Enters full personal data (same fields as customer)
3. CEPiK verification triggered (same as main renter)
4. RentalDriver record created (encrypted PII)
5. Contract created -> secondDriver frozen in ContractFrozenData v2
6. PDF renders second driver section
7. Second driver signs contract (2 additional signatures: second_customer_page1/page2)
8. Total signatures: 6 (customer 2, second_driver 2, employee 2)
```

### ContractFrozenData v2 Schema
```typescript
// Extend existing interface with version discriminant
export interface ContractFrozenDataV1 {
  // existing fields unchanged
  company: { name: string; owner: string; address: string; phone: string };
  customer: { firstName: string; lastName: string; address: string | null; pesel: string; idNumber: string; idIssuedBy: string | null; licenseNumber: string; licenseCategory: string | null; phone: string; email: string | null; };
  vehicle: { registration: string; make: string; model: string; year: number; vin: string; mileage: number; };
  rental: { startDate: string; endDate: string; dailyRateNet: number; totalPriceNet: number; totalPriceGross: number; vatRate: number; };
  conditions: { depositAmount: number | null; dailyRateNet: number; lateFeeNet: number | null; };
}

export interface ContractFrozenDataV2 {
  version: 2;
  company: { name: string; owner: string; address: string; phone: string };
  customer: {
    firstName: string; lastName: string;
    street: string | null; houseNumber: string | null;
    postalCode: string | null; city: string | null;
    address: string | null; // backward compat: computed string
    pesel: string; idNumber: string; idIssuedBy: string | null;
    licenseNumber: string; licenseCategory: string | null;
    phone: string; email: string | null;
  };
  vehicle: {
    registration: string; make: string; model: string;
    year: number; vin: string; mileage: number;
    vehicleClassName: string | null;
  };
  rental: {
    startDate: string; endDate: string;
    dailyRateNet: number; totalPriceNet: number;
    totalPriceGross: number; vatRate: number;
    isCompanyRental: boolean;
    companyName: string | null;
    companyNip: string | null;
    vatPayerStatus: string | null; // 'FULL_100' | 'HALF_50' | 'NONE'
    insuranceCaseNumber: string | null;
    termsHtml: string;
    termsNotes: string | null;
  };
  conditions: { depositAmount: number | null; dailyRateNet: number; lateFeeNet: number | null; };
  secondDriver: {
    firstName: string; lastName: string;
    pesel: string; idNumber: string;
    licenseNumber: string; licenseCategory: string | null;
    address: string | null; phone: string | null;
  } | null;
}

export type ContractFrozenData = ContractFrozenDataV1 | ContractFrozenDataV2;

// Type guard
export function isV2(data: ContractFrozenData): data is ContractFrozenDataV2 {
  return 'version' in data && data.version === 2;
}
```

### Database Schema Additions

**New model: AppSetting**
```prisma
model AppSetting {
  key       String   @id
  value     String   @db.Text
  updatedAt DateTime @updatedAt
  @@map("app_settings")
}
```

**New model: RentalDriver**
```prisma
model RentalDriver {
  id                    String   @id @default(uuid())
  rentalId              String   @unique  // 1:1 with Rental (one second driver max)
  firstName             String
  lastName              String
  phone                 String?
  peselEncrypted        Json
  peselHmac             String
  idNumberEncrypted     Json
  idNumberHmac          String
  licenseNumEncrypted   Json
  licenseNumHmac        String
  licenseCategory       String?
  street                String?
  houseNumber           String?
  postalCode            String?
  city                  String?

  rental                Rental   @relation(fields: [rentalId], references: [id], onDelete: Cascade)
  cepikVerifications    CepikVerification[]

  createdAt             DateTime @default(now())
  @@map("rental_drivers")
}
```

**Modified models:**
- `Rental`: add `rentalTerms String? @db.Text`, `termsNotes String? @db.Text`, `additionalDriver RentalDriver?` relation
- `Contract`: add `termsAcceptedAt DateTime?`
- `CepikVerification`: add `driverId String?` + `driver RentalDriver?` relation (nullable)
- `ContractSignature`: extend `signatureType` valid values to include `second_customer_page1`, `second_customer_page2`

### Recommended Project Structure Changes
```
apps/api/src/
  contracts/
    contracts.service.ts         # MODIFY: buildFrozenData() v2, extended sign() for 6 sigs
    dto/create-contract.dto.ts   # MODIFY: add termsAcceptedAt
    dto/sign-contract.dto.ts     # MODIFY: extend signatureType enum
    pdf/
      pdf.service.ts             # MODIFY: add 'eq' helper, update ContractPdfData
      templates/contract.hbs     # REWRITE: dynamic terms, second driver, company, no VIN
  settings/                      # NEW module
    settings.module.ts
    settings.controller.ts       # GET/PUT /settings/:key
    settings.service.ts
    dto/update-setting.dto.ts
  rental-drivers/                # NEW module (or sub-service of rentals)
    rental-drivers.service.ts    # CRUD + encryption
    dto/create-rental-driver.dto.ts
  portal/
    portal.service.ts            # MODIFY: exclude VIN/year from responses

apps/web/src/
  app/(admin)/ustawienia/        # NEW settings page
    page.tsx                     # TipTap editor for default terms
  components/
    tiptap-editor.tsx            # Reusable TipTap component

apps/mobile/
  src/stores/rental-draft.store.ts  # MODIFY: add secondDriver fields, termsHtml
  app/(tabs)/new-rental/
    contract.tsx                 # MODIFY: terms display, acceptance checkbox, second driver form
    signatures.tsx               # MODIFY: 3 signature steps (customer, second driver, employee)
```

### Anti-Patterns to Avoid
- **Separate template files for v1/v2:** Maintaining two Handlebars templates creates drift. Use one template with `{{#if}}` guards. Old v1 data missing `version` field gets the hardcoded fallback.
- **Modifying existing contractData JSON:** NEVER backfill or modify existing `contractData` entries -- they are immutable legal records. Only new contracts get v2 schema.
- **Frontend-only VIN/year hiding:** The portal API currently returns `vehicleMake`, `vehicleModel`, `vehicleRegistration` but NOT VIN/year (confirmed by reading `PortalService`). However, verify that `contractData` (accessible via PDF download) does not leak VIN in old PDFs.
- **Storing terms as array of strings:** Store as HTML string (TipTap output). The numbered list format is an HTML `<ol>`, not a JSON array.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rich text editing | Custom contentEditable wrapper | `@tiptap/react` with starter-kit | ProseMirror-based, headless, HTML output |
| PII encryption for second driver | New encryption approach | Existing `CustomersService` encrypt/decrypt pattern | Same JSON + HMAC pattern already battle-tested |
| CEPiK verification for second driver | New verification service | Existing `CepikService.verify()` with extended params | Just add optional `driverId` parameter |
| Handlebars equality helper | Inline JavaScript in template | `Handlebars.registerHelper('eq', ...)` | Standard pattern for version checking in HBS |
| Signature type validation | String comparison | Extend `SignatureType` union type in shared package | TypeScript catches invalid types at compile time |

**Key insight:** Almost every feature in this phase follows an existing pattern. Terms acceptance = RODO consent. Second driver encryption = Customer encryption. Second driver CEPiK = Customer CEPiK. The work is extension, not invention.

## Common Pitfalls

### Pitfall 1: Handlebars Triple-Stache XSS Risk
**What goes wrong:** Using `{{{termsHtml}}}` (triple-stache, unescaped) to inject TipTap HTML into the PDF template. If terms contain malicious script tags, they execute in Puppeteer's context.
**Why it happens:** TipTap outputs clean HTML, but stored HTML could be tampered with via direct DB access or API injection.
**How to avoid:** Sanitize HTML on save (server-side) using a library like `sanitize-html` or `DOMPurify`. TipTap's output is inherently safe (it only produces the HTML its schema allows), but validate on the API input boundary. Keep the `@MaxLength` validator on the terms field.
**Warning signs:** Script tags in stored HTML; unexpected content in generated PDFs.

### Pitfall 2: Content Hash Breaks with V2 Fields
**What goes wrong:** `generateContentHash()` creates a SHA-256 hash of the frozen data. Adding new fields to v2 changes the hash for the same logical contract. If hash verification runs on old contracts with v1 data, it must still pass.
**Why it happens:** The hash function serializes ALL fields. V2 data has more fields than v1.
**How to avoid:** Hash verification already works on the stored `contractData` JSON as-is. The key is: hash is generated at contract creation from the frozen data, and verified against the same frozen data. As long as frozen data is never modified, hashes remain valid. No changes needed to the hash function.
**Warning signs:** "Contract data integrity check failed" errors on existing contracts.

### Pitfall 3: Signature Count Logic Hardcoded to 4
**What goes wrong:** In `contracts.service.ts` line 325: `if (signatureCount >= ALL_SIGNATURE_TYPES.length)` triggers PDF generation. Adding second driver signatures (6 total) means this logic must be dynamic -- contracts without a second driver need 4 sigs, contracts with a second driver need 6.
**Why it happens:** `ALL_SIGNATURE_TYPES` is a constant array of 4 types. Second driver adds 2 more conditionally.
**How to avoid:** Compute required signature count from the frozen data: if `secondDriver` exists, require 6 signatures; otherwise 4. Update `ALL_SIGNATURE_TYPES` to be a function that takes frozen data and returns the required types.
**Warning signs:** PDF generation triggered prematurely (after 4 sigs when 6 needed) or never triggered (waiting for 6 when only 4 needed).

### Pitfall 4: TipTap in WebView Communication Complexity
**What goes wrong:** Embedding TipTap in a React Native WebView for mobile editing requires bidirectional communication (postMessage) to get/set HTML content. Edge cases: WebView not loaded yet, content lost on orientation change, Android keyboard covering editor.
**Why it happens:** WebView is a separate JS context -- no shared state with React Native.
**How to avoid:** Keep the WebView editor simple: load a minimal HTML page with TipTap, use `postMessage` to send initial HTML and receive updated HTML on blur/save. Use `injectedJavaScript` for initial content. Test on both iOS and Android. Consider making mobile editing optional (web-only for first release, with mobile as read-only + request changes workflow).
**Warning signs:** Content disappearing on save; WebView blank screen; keyboard issues on Android.

### Pitfall 5: Terms Freezing Timing
**What goes wrong:** Terms are frozen into `contractData` at contract creation (in `buildFrozenData()`). But the contract is created at the first signature (in `signatures.tsx` line 149-165). If the worker edits terms AFTER the first signature is captured, the frozen terms don't match what was displayed.
**Why it happens:** Current flow: contract step shows preview -> photos step -> signatures step -> first signature triggers contract creation. Terms must be locked before contract creation.
**How to avoid:** Freeze terms at contract creation time (as currently designed). The terms acceptance checkbox with `termsAcceptedAt` timestamp proves the customer saw the specific terms. Disable terms editing in the API once contract status is not DRAFT. The mobile UI should show terms as read-only once the customer has checked the acceptance checkbox.
**Warning signs:** Terms modified after acceptance; discrepancy between displayed and frozen terms.

### Pitfall 6: Migration with Encrypted Fields
**What goes wrong:** `RentalDriver` model needs `peselEncrypted`, `idNumberEncrypted`, `licenseNumEncrypted` as `Json` columns (same as Customer). The encryption/decryption logic lives in `CustomersService`. Second driver needs the same logic but in a different service.
**Why it happens:** Encryption helpers are embedded in CustomersService, not extracted.
**How to avoid:** Extract encryption/decryption utility functions (or a shared `EncryptionService`) that both `CustomersService` and `RentalDriversService` can use. Or simply duplicate the encrypt/decrypt calls in the new service (pragmatic, since it's 10 lines of code using the existing ConfigService keys).
**Warning signs:** Inconsistent encryption between Customer and RentalDriver records.

## Code Examples

### Handlebars `eq` Helper for Version Checking
```typescript
// In pdf.service.ts onModuleInit()
Handlebars.registerHelper('eq', function(a: unknown, b: unknown) {
  return a === b;
});
```

### Template Version Guard Pattern
```handlebars
{{!-- In contract.hbs, page 2 --}}
{{#if (eq version 2)}}
  {{!-- V2: dynamic terms from TipTap HTML --}}
  <div class="conditions">
    {{{rental.termsHtml}}}
  </div>
  {{#if rental.termsNotes}}
  <div class="terms-notes">
    <div class="section-title">Uwagi dodatkowe:</div>
    <p>{{rental.termsNotes}}</p>
  </div>
  {{/if}}
{{else}}
  {{!-- V1: hardcoded conditions (keep existing <ol> intact) --}}
  <div class="conditions">
    <ol>
      <li>Wymagane jest ukonczenie 21 lat...</li>
      {{!-- ... all 21 existing items ... --}}
    </ol>
  </div>
{{/if}}
```

### Company/NIP Section in PDF (V2 only)
```handlebars
{{#if (eq version 2)}}
  {{#if rental.isCompanyRental}}
  <div class="section">
    <div class="section-title">Dane firmy klienta</div>
    <div class="field-row">
      <span class="field-label">Firma:</span>
      <span class="field-value">{{rental.companyName}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">NIP:</span>
      <span class="field-value">{{rental.companyNip}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Status VAT:</span>
      <span class="field-value">{{formatVatStatus rental.vatPayerStatus}}</span>
    </div>
  </div>
  {{/if}}
{{/if}}
```

### Second Driver Section in PDF
```handlebars
{{#if secondDriver}}
<div class="section">
  <div class="section-title">Drugi kierowca</div>
  <div class="field-row">
    <span class="field-label">Imie i nazwisko:</span>
    <span class="field-value">{{secondDriver.firstName}} {{secondDriver.lastName}}</span>
  </div>
  <div class="field-row">
    <span class="field-label">PESEL:</span>
    <span class="field-value">{{secondDriver.pesel}}</span>
  </div>
  <div class="field-row">
    <span class="field-label">Dowod osobisty nr:</span>
    <span class="field-value">{{secondDriver.idNumber}}</span>
  </div>
  <div class="field-row">
    <span class="field-label">Prawo jazdy nr:</span>
    <span class="field-value">{{secondDriver.licenseNumber}}</span>
  </div>
  {{#if secondDriver.phone}}
  <div class="field-row">
    <span class="field-label">Telefon:</span>
    <span class="field-value">{{secondDriver.phone}}</span>
  </div>
  {{/if}}
</div>
{{/if}}
```

### VIN/Year Removal from PDF
```handlebars
{{!-- Vehicle section: remove VIN and year rows entirely for v2 --}}
<div class="section">
  <div class="section-title">Pojazd</div>
  <div class="two-columns">
    <div>
      <div class="field-row">
        <span class="field-label">Marka i model:</span>
        <span class="field-value">{{vehicle.make}} {{vehicle.model}}</span>
      </div>
      <div class="field-row">
        <span class="field-label">Nr rejestracyjny:</span>
        <span class="field-value">{{vehicle.registration}}</span>
      </div>
    </div>
    <div>
      {{!-- V1 shows VIN and year; V2 shows class instead --}}
      {{#unless (eq version 2)}}
      <div class="field-row">
        <span class="field-label">VIN:</span>
        <span class="field-value">{{vehicle.vin}}</span>
      </div>
      <div class="field-row">
        <span class="field-label">Rok produkcji:</span>
        <span class="field-value">{{vehicle.year}}</span>
      </div>
      {{else}}
      {{#if vehicle.vehicleClassName}}
      <div class="field-row">
        <span class="field-label">Klasa pojazdu:</span>
        <span class="field-value">{{vehicle.vehicleClassName}}</span>
      </div>
      {{/if}}
      {{/unless}}
    </div>
  </div>
</div>
```

### buildFrozenData V2 Extension
```typescript
private buildFrozenDataV2(
  rental: RentalForContractV2,
  customer: CustomerDto,
  vehicle: VehicleForContractV2,
  conditions: { depositAmount: number | null; dailyRateNet: number; lateFeeNet: number | null },
  secondDriver: RentalDriverDto | null,
  termsHtml: string,
  termsNotes: string | null,
): ContractFrozenDataV2 {
  return {
    version: 2,
    company: { /* same as v1 */ },
    customer: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      street: customer.street ?? null,
      houseNumber: customer.houseNumber ?? null,
      postalCode: customer.postalCode ?? null,
      city: customer.city ?? null,
      address: /* computed backward-compat string */,
      pesel: customer.pesel,
      idNumber: customer.idNumber,
      idIssuedBy: customer.idIssuedBy ?? null,
      licenseNumber: customer.licenseNumber,
      licenseCategory: customer.licenseCategory ?? null,
      phone: customer.phone,
      email: customer.email ?? null,
    },
    vehicle: {
      registration: vehicle.registration,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,       // stored but not rendered in client-facing PDF
      vin: vehicle.vin,         // stored but not rendered in client-facing PDF
      mileage: vehicle.mileage,
      vehicleClassName: vehicle.vehicleClass?.name ?? null,
    },
    rental: {
      startDate: /* ... */,
      endDate: /* ... */,
      dailyRateNet: rental.dailyRateNet,
      totalPriceNet: rental.totalPriceNet,
      totalPriceGross: rental.totalPriceGross,
      vatRate: rental.vatRate,
      isCompanyRental: rental.isCompanyRental,
      companyName: rental.companyName ?? null,  // from customer
      companyNip: rental.companyNip ?? null,
      vatPayerStatus: rental.vatPayerStatus ?? null,
      insuranceCaseNumber: rental.insuranceCaseNumber ?? null,
      termsHtml,
      termsNotes,
    },
    conditions,
    secondDriver: secondDriver ? {
      firstName: secondDriver.firstName,
      lastName: secondDriver.lastName,
      pesel: secondDriver.pesel,
      idNumber: secondDriver.idNumber,
      licenseNumber: secondDriver.licenseNumber,
      licenseCategory: secondDriver.licenseCategory ?? null,
      address: /* computed from street/house/postal/city */,
      phone: secondDriver.phone ?? null,
    } : null,
  };
}
```

### Dynamic Signature Types
```typescript
function getRequiredSignatureTypes(frozenData: ContractFrozenData): SignatureType[] {
  const base: SignatureType[] = [
    'customer_page1', 'employee_page1',
    'customer_page2', 'employee_page2',
  ];
  if (isV2(frozenData) && frozenData.secondDriver) {
    base.push('second_customer_page1', 'second_customer_page2');
  }
  return base;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TipTap v2.x | TipTap v3.x (3.22.3) | 2025-2026 | New major version; API mostly compatible, check migration guide |
| Hardcoded PDF conditions | Dynamic HTML from TipTap | Phase 34 | Page 2 becomes customizable |
| 4 signatures per contract | 4 or 6 (with second driver) | Phase 34 | Signature completion logic must be dynamic |
| Single ContractFrozenData shape | Versioned (v1/v2) | Phase 34 | All new contracts get version: 2 |

**TipTap v3 note:** The STACK.md research recommended v2.11.0, but TipTap has since released v3.22.3. The v3 API is similar but check the official migration guide. Key changes: package imports are the same (`@tiptap/react`, `@tiptap/starter-kit`), but some extension APIs changed. For a new installation (no existing v2 code), use v3 directly.

## Open Questions

1. **TipTap v3 compatibility with shadcn design system**
   - What we know: TipTap is headless (renders no UI), so it integrates with any design system via custom components
   - What's unclear: Whether the v3 API for toolbar/bubble menu has changed significantly from v2 examples
   - Recommendation: Start with minimal editor (starter-kit only), add toolbar progressively. Check `@tiptap/react` v3 docs.

2. **Second driver signature UX flow**
   - What we know: Currently 2 user-facing steps (customer signs, employee signs), each uploads 2 signature types
   - What's unclear: Should second driver sign at the same time as customer (3 steps total) or in a separate sub-flow?
   - Recommendation: 3 sequential steps: customer -> second driver (if present) -> employee. Each step captures one signature image uploaded to both page1/page2 types. Same pattern as existing flow.

3. **Default terms HTML seeding**
   - What we know: The 21 hardcoded `<li>` items in current contract.hbs need to become the default AppSetting value
   - What's unclear: Whether to seed via migration or first-run logic
   - Recommendation: Prisma seed script or migration SQL that inserts `('default_rental_terms', '<ol>...<the 21 items>...</ol>')` into `app_settings`. This ensures every deployment has a default.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (e2e) + Vitest (web unit) |
| Config file | `apps/api/test/jest-e2e.json` (API), `apps/web/vitest.config.ts` (web) |
| Quick run command | `cd apps/api && npx jest --config test/jest-e2e.json --testPathPattern contracts -t "specific test"` |
| Full suite command | `cd apps/api && npx jest --config test/jest-e2e.json` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KLIENT-05 | Company data in PDF frozen data | e2e | `npx jest --config test/jest-e2e.json contracts` | Partial -- contracts.e2e exists, needs v2 tests |
| FLOTA-04 | VIN/year hidden from portal | e2e | `npx jest --config test/jest-e2e.json portal` | Partial -- portal.e2e exists, needs VIN exclusion test |
| FLOTA-05 | VIN/year not in PDF | e2e | `npx jest --config test/jest-e2e.json contracts` | No -- needs v2 PDF content verification |
| UMOWA-01 | Admin edits default terms | e2e | `npx jest --config test/jest-e2e.json settings` | No -- new settings module |
| UMOWA-02 | Per-rental terms customization | e2e | `npx jest --config test/jest-e2e.json contracts` | No -- needs terms in frozen data test |
| UMOWA-03 | Terms acceptance checkbox | e2e | `npx jest --config test/jest-e2e.json contracts` | No -- needs termsAcceptedAt test |
| UMOWA-04 | Terms notes in PDF | e2e | `npx jest --config test/jest-e2e.json contracts` | No -- needs termsNotes in frozen data test |
| NAJEM-05 | Second driver added | e2e | `npx jest --config test/jest-e2e.json rentals` | No -- needs RentalDriver creation test |
| NAJEM-06 | Second driver CEPiK | e2e | `npx jest --config test/jest-e2e.json cepik` | Partial -- cepik.e2e exists, needs driverId test |
| NAJEM-07 | Second driver in PDF | e2e | `npx jest --config test/jest-e2e.json contracts` | No -- needs second driver in frozen data test |

### Sampling Rate
- **Per task commit:** Relevant e2e test file (`npx jest --config test/jest-e2e.json --testPathPattern <module>`)
- **Per wave merge:** Full API e2e suite (`cd apps/api && npx jest --config test/jest-e2e.json`)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/test/settings.e2e-spec.ts` -- covers UMOWA-01 (AppSetting CRUD)
- [ ] Extend `contracts.e2e-spec.ts` -- v2 frozen data tests, termsAcceptedAt, secondDriver in PDF data
- [ ] Extend `portal.e2e-spec.ts` -- VIN/year exclusion verification
- [ ] Extend `rentals.e2e-spec.ts` -- RentalDriver creation, termsNotes
- [ ] Extend `cepik.e2e-spec.ts` -- driverId parameter support

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `contract.types.ts`, `contracts.service.ts`, `pdf.service.ts`, `contract.hbs`, `signatures.tsx`, `contract.tsx`, `portal.service.ts`, `cepik.service.ts`, `schema.prisma`, `rental-draft.store.ts`
- npm registry: `@tiptap/react` v3.22.3, `@tiptap/starter-kit` v3.22.3, `handlebars` v4.7.9

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` -- TipTap recommendation (v2 era, now v3 available)
- `.planning/research/PITFALLS.md` -- ContractFrozenData versioning pitfall, terms mutability pitfall
- `.planning/research/ARCHITECTURE.md` -- Integration map, RentalDriver model design

### Tertiary (LOW confidence)
- TipTap v3 migration specifics -- not verified with official docs (use v3 directly since no v2 code exists)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified against npm registry, existing codebase patterns well understood
- Architecture: HIGH -- direct code inspection of all touched files, clear extension patterns
- Pitfalls: HIGH -- informed by codebase reading (signature count logic, hash verification, terms freezing)

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable domain, no fast-moving dependencies)
