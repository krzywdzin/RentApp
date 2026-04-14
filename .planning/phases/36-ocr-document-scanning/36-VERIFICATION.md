---
phase: 36-ocr-document-scanning
verified: 2026-04-14T16:00:00Z
status: human_needed
score: 12/12 must-haves verified
re_verification: true
  previous_status: gaps_found
  previous_score: 9/12
  gaps_closed:
    - "expo-text-extractor registered in app.config.ts plugins array (line 44)"
    - "DocumentDiffView rendered for existing customers at lines 917-925 (ID) and 929-937 (license) with full prop wiring"
    - "Document photos uploaded to R2 via uploadDocumentPhotos helper called in handleCreateCustomer (line 184) and handleProceedWithExisting (line 306)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "On a physical device with EAS dev client, tap 'Skanuj dowod osobisty', photograph a real Polish ID card front and back, and verify OCR fields populate the form"
    expected: "firstName, lastName, PESEL, and documentNumber auto-fill in the customer form with correct values"
    why_human: "On-device OCR accuracy with expo-text-extractor cannot be verified statically; ML Kit / Apple Vision output quality depends on device and document condition"
  - test: "Complete a new rental with ID and license scans -- confirm OCR fields, submit the form -- then open the customer in web admin Dokumenty tab"
    expected: "Two document entries visible (ID card, driver license) with front/back thumbnails loading from R2 presigned URLs"
    why_human: "Requires live API, R2 storage, and mobile device; cross-platform end-to-end flow"
  - test: "Select an existing customer from the list, tap scan buttons, photograph the ID card, and verify DocumentDiffView appears showing current vs OCR data side-by-side"
    expected: "Diff view renders with checkboxes per field; selecting fields and tapping confirm stores the scan; tapping keep-current dismisses without changes"
    why_human: "pendingExistingCustomer intermediate state and useEffect triggers cannot be exercised statically; requires real customer record and device"
---

# Phase 36: OCR Document Scanning Verification Report

**Phase Goal:** Workers can photograph a client's ID card and driver license, and the system pre-fills customer data from the photos, saving 2-3 minutes per rental
**Verified:** 2026-04-14T16:00:00Z
**Status:** human_needed (all automated checks pass)
**Re-verification:** Yes — after gap closure (plan 36-04)

## Re-verification Summary

| Gap | Previous Status | Current Status |
|-----|----------------|---------------|
| expo-text-extractor missing from app.config.ts plugins | FAILED | CLOSED |
| DocumentDiffView never rendered for existing customers | FAILED | CLOSED |
| Document photos never uploaded to R2 after customer creation | FAILED | CLOSED |

All three gaps from the initial verification are confirmed closed. No regressions detected in the 9 previously-passing truths.

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|---------|
| 1  | CustomerDocument model exists in Prisma schema | VERIFIED | schema.prisma — model CustomerDocument present (3 references) |
| 2  | POST /customers/:id/documents/:type/:side uploads to R2 and upserts CustomerDocument | VERIFIED | documents.service.ts uploadPhoto() with storage.upload() + prisma.customerDocument.upsert |
| 3  | GET /customers/:id/documents returns documents with presigned thumbnail URLs | VERIFIED | documents.service.ts getDocuments() calls getPresignedDownloadUrl() |
| 4  | Shared DocumentType enum and DTOs importable from @rentapp/shared | VERIFIED | packages/shared/src/types/document.types.ts exports DocumentType, IdCardOcrFields, DriverLicenseOcrFields, CustomerDocumentDto |
| 5  | System extracts firstName, lastName, PESEL, documentNumber from ID card OCR text | VERIFIED | parse-id-card.ts: PESEL regex (11 digits), docNum regex ([A-Z]{3}\d{6}), name line filtering |
| 6  | System extracts licenseNumber, categories, expiryDate from driver license OCR text | VERIFIED | parse-driver-license.ts: license regex, category regex, date conversion to ISO |
| 7  | Worker can tap scan buttons to open camera guide and capture front+back photos | VERIFIED | DocumentScanButton (5 references in index.tsx); DocumentGuideOverlay; useDocumentScan wired |
| 8  | Worker sees confirmation screen with editable fields after scan (new customer path) | VERIFIED | DocumentConfirmation rendered at lines 893-913 with !pendingExistingCustomer guard |
| 9  | Admin can see Dokumenty section on customer detail page with document photo thumbnails | VERIFIED | DocumentsSection rendered in page.tsx; useCustomerDocuments hook calls /customers/${id}/documents |
| 10 | Thumbnails load via presigned R2 URLs from the documents API | VERIFIED | documents-section.tsx uses useCustomerDocuments hook data; service returns presigned URLs |
| 11 | For existing customers, worker sees diff view comparing current data with OCR results | VERIFIED | DocumentDiffView rendered at lines 917-925 (ID) and 929-937 (license) with showIdDiff/showLicenseDiff; all 5 props wired on each instance |
| 12 | Scanned document photos are actually saved to R2 storage and linked to customer | VERIFIED | uploadDocumentPhotos helper (lines 118-176): FormData POST to /customers/${customerId}/documents/${scan.type}/${side}; called in handleCreateCustomer (line 184) and handleProceedWithExisting (line 306) |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/prisma/schema.prisma` | CustomerDocument model | VERIFIED | model CustomerDocument present |
| `packages/shared/src/types/document.types.ts` | DocumentType enum, OCR field interfaces | VERIFIED | All required exports present |
| `apps/api/src/documents/documents.service.ts` | Upload, retrieval, delete logic | VERIFIED | uploadPhoto, getDocuments, deleteDocumentsByCustomerId all implemented |
| `apps/api/src/documents/documents.controller.ts` | POST upload + GET list endpoints | VERIFIED | FileInterceptor on POST; @Roles guard present |
| `apps/mobile/src/lib/ocr/parse-id-card.ts` | Polish ID card OCR parser | VERIFIED | parseIdCard exported with PESEL and doc number regexes |
| `apps/mobile/src/lib/ocr/parse-driver-license.ts` | Polish driver license OCR parser | VERIFIED | parseDriverLicense exported |
| `apps/mobile/src/hooks/use-document-scan.ts` | Camera + OCR state machine hook | VERIFIED | extractTextFromImage, parseIdCard/parseDriverLicense all wired |
| `apps/mobile/src/components/DocumentScanner/DocumentDiffView.tsx` | Existing customer diff view | VERIFIED | Rendered twice in new-rental/index.tsx with correct props |
| `apps/mobile/src/components/DocumentScanner/DocumentConfirmation.tsx` | Post-scan editable fields review | VERIFIED | Rendered for new customer path with !pendingExistingCustomer guard |
| `apps/mobile/app/(tabs)/new-rental/index.tsx` | Full scan flow integration | VERIFIED | DocumentScanButton, DocumentGuideOverlay, DocumentConfirmation (new), DocumentDiffView (existing), uploadDocumentPhotos all wired |
| `apps/mobile/app.config.ts` | expo-text-extractor in plugins | VERIFIED | Line 44: 'expo-text-extractor' present in plugins array |
| `apps/web/src/app/(admin)/klienci/[id]/documents-section.tsx` | Documents section component | VERIFIED | DocumentsSection exported and rendered in page.tsx |
| `apps/web/src/app/(admin)/klienci/[id]/page.tsx` | Dokumenty tab added | VERIFIED | TabsTrigger value="dokumenty" and DocumentsSection rendered |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| documents.service.ts | storage.service.ts | this.storage.upload() | WIRED | Confirmed initial + regression |
| documents.service.ts | prisma.customerDocument | upsert/findMany/deleteMany | WIRED | Confirmed initial + regression |
| use-document-scan.ts | expo-text-extractor | extractTextFromImage() | WIRED | Line 61 with try/catch fallback |
| use-document-scan.ts | parse-id-card.ts | parseIdCard(ocrTexts) | WIRED | Confirmed initial + regression |
| DocumentConfirmation.tsx | new-rental/index.tsx | onConfirm + setValue | WIRED | Lines 893-913; !pendingExistingCustomer guard added by plan 36-04 |
| DocumentDiffView.tsx | new-rental/index.tsx | JSX render for existing customer | WIRED | Lines 917-925 (ID), 929-937 (license); showIdDiff/showLicenseDiff state; onUpdate + onKeepCurrent handlers wired |
| new-rental/index.tsx | /customers/:id/documents/:type/:side | uploadDocumentPhotos FormData POST | WIRED | Lines 149-153 (front), 166-170 (back); called at line 184 (new customer) and 306 (existing customer) |
| documents-section.tsx | /customers/:id/documents | apiClient via useCustomerDocuments | WIRED | Confirmed initial + regression |
| new-rental/index.tsx | DocumentScanButton.tsx | JSX render | WIRED | 5 references confirmed |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| DOC-01 | 36-02 | Worker can photograph ID card in mobile app | SATISFIED | DocumentScanButton + useDocumentScan('ID_CARD') + DocumentGuideOverlay wired in new-rental/index.tsx |
| DOC-02 | 36-02 | Worker can photograph driver license in mobile app | SATISFIED | DocumentScanButton + useDocumentScan('DRIVER_LICENSE') + DocumentGuideOverlay wired |
| DOC-03 | 36-02 | System auto-reads ID card data via OCR (firstName, lastName, PESEL, doc number) | SATISFIED | parse-id-card.ts extracts all fields; address shown as manual entry per spec (not on modern Polish ID) |
| DOC-04 | 36-02 | System auto-reads driver license data via OCR (license number, categories, expiry) | SATISFIED | parse-driver-license.ts extracts all three fields |
| DOC-05 | 36-02, 36-04 | Worker can correct/supplement data after OCR before saving | SATISFIED | DocumentConfirmation for new customers (editable form); DocumentDiffView for existing customers (field-level diff with checkboxes) |
| DOC-06 | 36-01, 36-03, 36-04 | Document photos saved in R2 storage and linked to customer | SATISFIED | Backend endpoint + DB model verified; uploadDocumentPhotos sends FormData POST after both new and existing customer creation |

All 6 requirements satisfied. No orphaned requirements detected.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| apps/mobile/app/(tabs)/new-rental/index.tsx | 155, 172 | console.warn on upload failure | INFO | By design — non-blocking failure pattern per project conventions (same as signatures.tsx) |

No blocker or warning-level anti-patterns found in modified files.

---

### Human Verification Required

#### 1. On-device OCR accuracy

**Test:** Build EAS dev client (expo-text-extractor now in plugins), tap 'Skanuj dowod osobisty', photograph a real Polish ID card front and back.
**Expected:** firstName, lastName, PESEL, and documentNumber auto-fill in the customer form with correct values.
**Why human:** Regex parser accuracy against real document photos cannot be verified statically. ML Kit / Apple Vision output quality depends on device, lighting, and document condition.

#### 2. End-to-end scan-to-storage flow

**Test:** Complete a new rental with ID and license scans — confirm OCR fields, submit the form — then open the customer in web admin Dokumenty tab.
**Expected:** Two document entries visible (ID card, driver license) with front/back thumbnails loading from R2 presigned URLs.
**Why human:** Requires live API, R2 credentials, and mobile device. Cross-platform verification of the create-customer + upload-photos sequence.

#### 3. Existing customer diff view on device

**Test:** Select an existing customer from the list, tap the scan buttons, photograph the ID card, and verify DocumentDiffView appears.
**Expected:** Diff view renders with current customer data alongside OCR data, with checkboxes per field. Selecting fields and confirming stores the scan. Keeping current dismisses without changes.
**Why human:** The pendingExistingCustomer intermediate state and useEffect triggers cannot be exercised statically. Requires real customer record and device.

---

### Regression Check

| Previously-passing truth | Result |
|--------------------------|--------|
| CustomerDocument Prisma model | 3 grep hits — pass |
| POST upload endpoint (uploadPhoto) | 1 grep hit — pass |
| GET documents endpoint (getDocuments) | 1 grep hit — pass |
| Shared DocumentType | 2 grep hits — pass |
| parseIdCard | 1 grep hit — pass |
| parseDriverLicense | 1 grep hit — pass |
| DocumentScanButton in new-rental | 5 grep hits — pass |
| DocumentConfirmation render | 3 grep hits (import + 2 render sites) — pass |
| DocumentsSection in web page.tsx | 2 grep hits — pass |

---

_Verified: 2026-04-14T16:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Mode: Re-verification after plan 36-04 gap closure_
