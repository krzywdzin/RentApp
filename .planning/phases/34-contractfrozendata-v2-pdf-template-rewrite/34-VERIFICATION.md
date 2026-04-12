---
phase: 34-contractfrozendata-v2-pdf-template-rewrite
verified: 2026-04-12T22:04:14Z
status: human_needed
score: 12/12 must-haves verified
re_verification: false
human_verification:
  - test: "Open mobile app, start new rental wizard to contract step. Verify terms are displayed (default from settings). Attempt to proceed without checking acceptance checkbox — button must be disabled."
    expected: "Terms visible, 'Dalej do podpisow' disabled until checkbox checked."
    why_human: "UI gating logic and visual state cannot be verified by grep."
  - test: "Tap 'Edytuj warunki' in mobile contract step. Edit terms in TipTap WebView. Add notes in 'Uwagi dodatkowe'. Tap 'Dodaj drugiego kierowce', fill form, tap 'Zapisz kierowce', then 'Sprawdz CEPiK'. Proceed to signatures — verify 3 steps appear."
    expected: "Terms WebView opens, CEPiK status shown on form, signature wizard shows 3 steps (Klient / Drugi Kierowca / Pracownik)."
    why_human: "WebView render, CEPiK network call, and wizard step count are runtime behaviors."
  - test: "Complete a full signature flow with a second driver. Download the generated PDF contract."
    expected: "PDF shows: company data section (if company rental), VIN and year absent, dynamic terms from TipTap, 'Uwagi dodatkowe' section with notes, second driver personal data section, all 6 signature images."
    why_human: "PDF visual output requires human inspection; generated binary cannot be diffed by grep."
  - test: "Navigate to /ustawienia in the admin web panel. Verify TipTap editor loads with current default terms. Edit text (bold, lists, heading). Click 'Zapisz'. Reload page — confirm saved terms persist."
    expected: "Editor shows formatted terms, toolbar is functional, saved terms survive page reload."
    why_human: "Rich text editor interaction and persistence require browser testing."
  - test: "Log into customer portal. Open a rental with a vehicle that has VIN and year in the DB. Verify neither VIN nor year appears anywhere in the portal UI."
    expected: "No VIN or production year visible to customer."
    why_human: "Portal UI rendering requires browser inspection to confirm absence of fields."
---

# Phase 34: ContractFrozenData v2 / PDF Template Rewrite — Verification Report

**Phase Goal:** All contract-touching features are delivered in a single coordinated pass — the PDF contract reflects company data, VAT status, editable terms, terms acceptance, custom notes, second driver, and hides VIN/year from client
**Verified:** 2026-04-12T22:04:14Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | ContractFrozenDataV2 type exists with version discriminant and all new fields | VERIFIED | `packages/shared/src/types/contract.types.ts` contains `ContractFrozenDataV2`, `version: 2`, `termsHtml`, `secondDriver`, `isV2` guard, extended `SignatureType` |
| 2 | AppSetting and RentalDriver Prisma models exist with all required fields | VERIFIED | `schema.prisma` has `model AppSetting`, `model RentalDriver`, `rentalTerms`, `termsNotes`, `termsAcceptedAt`, `driverId` on `CepikVerification` |
| 3 | Settings service reads/writes key-value pairs via DB; registered in AppModule | VERIFIED | `settings.service.ts` uses `prisma.appSetting.findUnique` / `upsert`; `SettingsModule` in `app.module.ts` |
| 4 | RentalDrivers service creates/reads second driver with encryption; registered in AppModule | VERIFIED | `rental-drivers.service.ts` imports `field-encryption`, uses `encrypt`; `RentalDriversModule` in `app.module.ts` |
| 5 | New contracts freeze v2 data: company/VAT, terms, second driver, vehicle class | VERIFIED | `contracts.service.ts` has `buildFrozenDataV2`, `version: 2`, injects `settingsService` and `rentalDriversService` |
| 6 | PDF template hides VIN/year for v2; shows company/NIP, dynamic termsHtml, second driver | VERIFIED | `contract.hbs`: VIN/year wrapped in `{{#unless (eq version 2)}}` (lines 169–185); `{{{rental.termsHtml}}}` (line 344); `secondDriver` section; `isCompanyRental` section; `Uwagi dodatkowe` block |
| 7 | V1 contracts still render with hardcoded conditions and VIN/year | VERIFIED | 21 existing `<li>` items preserved in `{{else}}` block; VIN/year rendered when not v2 |
| 8 | Signature completion is dynamic: 4 without second driver, 6 with | VERIFIED | `getRequiredSignatureTypes()` in `contracts.service.ts`; `sign-contract.dto.ts` accepts `second_customer_page1` / `second_customer_page2` |
| 9 | REST endpoints exist for second driver CRUD and CEPiK driver verification | VERIFIED | `RentalDriversController` at `rentals/:rentalId/driver` (POST/GET/DELETE); `POST /cepik/verify-driver` in `cepik.controller.ts`; `verify-driver.dto.ts` exists |
| 10 | Portal API excludes VIN and year from all customer-facing responses | VERIFIED | `portal.service.ts` has only two occurrences of "vin"/"year" and both are privacy comments confirming intentional exclusion; no select fields for vin or year |
| 11 | Admin web panel has TipTap settings page wired to Settings API | VERIFIED | `apps/web/src/app/(admin)/ustawienia/page.tsx` imports `TipTapEditor`, fetches/puts `default_rental_terms`; `tiptap-editor.tsx` uses `useEditor`, `EditorContent`; `@tiptap/react` in `package.json` |
| 12 | Mobile draft store, TermsWebView, SecondDriverForm, contract step, and signatures flow all implement required fields and wiring | VERIFIED | Store has `secondDriver`, `rentalTerms`, `termsNotes`, `termsAcceptedAt`; `terms-webview.tsx` uses `WebView` + `postMessage`/`onMessage`; `second-driver-form.tsx` calls CEPiK `verify-driver`; `contract.tsx` has `termsAcceptedAt` + `TermsWebView` + `SecondDriverForm`; `signatures.tsx` references `second_customer`, `termsAcceptedAt`, and PATCH `/rentals/:id/terms` |

**Score:** 12/12 truths verified (automated)

---

### Required Artifacts

| Artifact | Plan | Status | Details |
|----------|------|--------|---------|
| `packages/shared/src/types/contract.types.ts` | 01 | VERIFIED | V1, V2, union, `isV2`, extended `SignatureType` all present |
| `apps/api/prisma/schema.prisma` | 01 | VERIFIED | `AppSetting`, `RentalDriver`, `rentalTerms`, `termsNotes`, `termsAcceptedAt`, `driverId` |
| `apps/api/src/settings/settings.service.ts` | 01 | VERIFIED | `SettingsService` with `get()` / `set()` using `upsert` |
| `apps/api/src/rental-drivers/rental-drivers.service.ts` | 01 | VERIFIED | Encryption imported and used; `create`, `findByRentalId`, `delete` methods |
| `apps/api/src/contracts/contracts.service.ts` | 02 | VERIFIED | `buildFrozenDataV2`, `getRequiredSignatureTypes`, both services injected |
| `apps/api/src/contracts/pdf/templates/contract.hbs` | 02 | VERIFIED | `eq version 2` guards, `{{{rental.termsHtml}}}`, `secondDriver`, `isCompanyRental`, `Uwagi dodatkowe`, `secondCustomerPage1`, v1 fallback preserved |
| `apps/api/src/contracts/pdf/pdf.service.ts` | 02 | VERIFIED | `registerHelper('eq', ...)` and `registerHelper('formatVatStatus', ...)` both present |
| `apps/api/src/rental-drivers/rental-drivers.controller.ts` | 03 | VERIFIED | POST / GET / DELETE at `rentals/:rentalId/driver` with JWT guard |
| `apps/api/src/cepik/cepik.service.ts` | 03 | VERIFIED | `verifyDriver()` method with `driverId` |
| `apps/api/src/cepik/dto/verify-driver.dto.ts` | 03 | VERIFIED | File exists |
| `apps/api/src/rentals/dto/update-rental-terms.dto.ts` | 03 | VERIFIED | `rentalTerms` and `termsNotes` with optional validators |
| `apps/api/src/portal/portal.service.ts` | 03 | VERIFIED | VIN/year excluded from Prisma select in both rental list and detail methods |
| `apps/web/src/components/tiptap-editor.tsx` | 04 | VERIFIED | `useEditor`, `EditorContent`, `StarterKit`, `onChange` wired |
| `apps/web/src/app/(admin)/ustawienia/page.tsx` | 04 | VERIFIED | Imports TipTapEditor, fetches/PUTs `default_rental_terms` |
| `apps/mobile/src/stores/rental-draft.store.ts` | 05 | VERIFIED | `secondDriver`, `rentalTerms`, `termsNotes`, `termsAcceptedAt` all present |
| `apps/mobile/src/components/terms-webview.tsx` | 05 | VERIFIED | `WebView` with `postMessage`/`onMessage` for edit mode |
| `apps/mobile/src/components/second-driver-form.tsx` | 05 | VERIFIED | CEPiK `verify-driver` call present |
| `apps/mobile/app/(tabs)/new-rental/contract.tsx` | 05 | VERIFIED | `termsAcceptedAt`, `TermsWebView`, `SecondDriverForm` all referenced |
| `apps/mobile/app/(tabs)/new-rental/signatures.tsx` | 05 | VERIFIED | `second_customer` sig type, `termsAcceptedAt`, PATCH `/rentals/:id/terms` |

---

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `rental-drivers.service.ts` | `common/crypto/field-encryption` | `encrypt`/`decrypt` import | WIRED |
| `settings.service.ts` | `prisma.appSetting` | PrismaService injection | WIRED |
| `contracts.service.ts` | `rental-drivers.service.ts` | `rentalDriversService` injection (line 97) | WIRED |
| `contracts.service.ts` | `settings.service.ts` | `settingsService` injection | WIRED |
| `pdf.service.ts` | `contract.hbs` | Handlebars template compilation via `contractTemplate` | WIRED |
| `rental-drivers.controller.ts` | `rental-drivers.service.ts` | `rentalDriversService` injection | WIRED |
| `cepik.service.ts` | `schema.prisma` (CepikVerification) | `driverId` optional field | WIRED |
| `ustawienia/page.tsx` | `/settings/default_rental_terms` | `fetch` GET/PUT | WIRED |
| `tiptap-editor.tsx` | `@tiptap/react` | `useEditor` hook | WIRED |
| `contract.tsx` (mobile) | `rental-draft.store.ts` | `useRentalDraftStore` | WIRED |
| `signatures.tsx` (mobile) | `PATCH /rentals/:id/terms` | fetch before contract creation | WIRED |

---

### Requirements Coverage

| Requirement | Plans | Description | Status |
|-------------|-------|-------------|--------|
| KLIENT-05 | 02 | Company data (NIP, name) and VAT status appear in PDF | SATISFIED — `isCompanyRental` / `companyName` / `companyNip` section in `contract.hbs` |
| FLOTA-04 | 03 | Customer does not see VIN or year in client portal | SATISFIED — `portal.service.ts` excludes both from Prisma select |
| FLOTA-05 | 02 | VIN and year do not appear in PDF sent to client | SATISFIED — `{{#unless (eq version 2)}}` wraps VIN/year rows in `contract.hbs` |
| UMOWA-01 | 01, 04 | Admin can edit rental terms (page 2) in web panel via rich text editor | SATISFIED — TipTap settings page at `/ustawienia` fetches/puts `default_rental_terms` |
| UMOWA-02 | 03, 05 | Worker can customize terms per rental | SATISFIED — `PATCH /rentals/:id/terms` endpoint + mobile contract step supports editing |
| UMOWA-03 | 05 | Customer sees terms and must confirm via checkbox before signing | SATISFIED — `termsAcceptedAt` in store, acceptance gate in `contract.tsx`, `signatures.tsx` includes it in contract creation |
| UMOWA-04 | 03, 05 | Worker can add terms notes (appear in PDF) | SATISFIED — `termsNotes` field in schema, DTO, store; rendered as `Uwagi dodatkowe` in `contract.hbs` |
| NAJEM-05 | 01, 03, 05 | Worker can add second driver (personal data + license) | SATISFIED — `RentalDriver` model, encrypted service, REST controller, mobile `SecondDriverForm` |
| NAJEM-06 | 03, 05 | Second driver verified via CEPiK | SATISFIED — `verifyDriver()` in `cepik.service.ts`, `POST /cepik/verify-driver`, called from mobile form |
| NAJEM-07 | 02, 05 | Second driver data appears in PDF contract | SATISFIED — `secondDriver` section in `contract.hbs`, data frozen via `buildFrozenDataV2` |

All 10 requirement IDs from PLAN frontmatter accounted for. No orphaned requirements found for Phase 34.

---

### Anti-Patterns Found

No TODO/FIXME/placeholder patterns found in key modified files. No empty handler stubs detected. Settings service uses real `upsert`. Rental drivers service uses real encryption. Portal service has verified exclusion comments, not code deletions — the fields simply do not appear in the Prisma `select` objects.

---

### Human Verification Required

#### 1. Mobile terms acceptance gate

**Test:** Open mobile app, start new rental wizard to contract step. Attempt to tap "Dalej do podpisow" before checking acceptance checkbox.
**Expected:** Button is visually disabled and non-functional until checkbox is checked. Once checked, button enables.
**Why human:** UI disabled state and visual feedback cannot be verified by static analysis.

#### 2. Mobile TipTap WebView editor

**Test:** Tap "Edytuj warunki" in contract step. Verify the TipTap editor opens in WebView, loads current terms, and returns edited HTML back to the form.
**Expected:** Terms display and edit round-trip works; changes visible in read-only preview after editing.
**Why human:** WebView JavaScript bridge (postMessage/onMessage) and CDN-loaded TipTap require runtime verification.

#### 3. Second driver CEPiK + 6-signature flow

**Test:** Add a second driver via SecondDriverForm, tap "Sprawdz CEPiK", then proceed to signatures.
**Expected:** CEPiK status shows (PASSED/FAILED/PENDING). Signature wizard shows 3 steps: Klient, Drugi Kierowca, Pracownik.
**Why human:** Network call to CEPiK API and wizard step count are runtime behaviors.

#### 4. Generated PDF output inspection

**Test:** Complete the full flow with a company rental, second driver, custom terms, and terms notes. Download the generated PDF.
**Expected:** PDF shows — company name/NIP/VAT section; no VIN or production year; dynamic TipTap terms; "Uwagi dodatkowe" section; second driver personal data; all 6 signature images.
**Why human:** PDF is a generated binary; visual output requires human inspection.

#### 5. Web admin TipTap settings page

**Test:** Navigate to `/ustawienia` in admin web panel. Edit terms using toolbar (bold, ordered list, heading). Save. Reload page.
**Expected:** Toolbar formatting works. Terms persist after reload (fetched from Settings API).
**Why human:** Browser interaction with rich text editor required; persistence verified only via live fetch.

#### 6. Customer portal VIN/year absence

**Test:** Log into customer portal and open a rental with a vehicle that has a VIN and year populated in the database.
**Expected:** Neither VIN nor production year is visible anywhere in the portal UI.
**Why human:** Portal UI rendering confirmation requires browser inspection.

---

## Gaps Summary

No automated gaps found. All 12 observable truths verified against the codebase. All 10 requirement IDs satisfied by concrete implementation evidence. All key wiring links confirmed. The 6 human verification items above are standard runtime/visual checks that cannot be resolved by static analysis — they are not blockers to declaring the automated portion complete.

---

_Verified: 2026-04-12T22:04:14Z_
_Verifier: Claude (gsd-verifier)_
