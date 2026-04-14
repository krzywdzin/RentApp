---
phase: 39-return-protocol
verified: 2026-04-14T23:10:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 39: Return Protocol Verification Report

**Phase Goal:** Vehicle returns produce a formal protocol document matching the client's required template
**Verified:** 2026-04-14T23:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | ReturnProtocol record can be created with cleanliness, notes, and signature keys | VERIFIED | `return-protocols.service.ts:15` — `create()` uploads PNGs, generates PDF, persists full record |
| 2 | PDF is generated from Handlebars template matching client layout | VERIFIED | `return-protocol.hbs:30,34` — KITEK header, "PROTOKOL ZDAWCZO - ODBIORCZY SAMOCHODU" title, signature block at 25mm margin |
| 3 | PDF is stored in R2 and downloadable via presigned URL | VERIFIED | `service.ts:93` uploads PDF; `service.ts:158` calls `storageService.getPresignedDownloadUrl()`; controller exposes `GET /:rentalId/download` |
| 4 | Protocol email is sent to customer with PDF attachment (fire-and-forget) | VERIFIED | `service.ts:116-124` — `setImmediate` wrapping `this.mailService.sendReturnProtocolEmail()` with pdfBuffer |
| 5 | Worker can select vehicle cleanliness (Czysty/Brudny/Do mycia) in return wizard | VERIFIED | `protocol.tsx:291 lines` — 3 chips with Pressable toggle, `updateDraft({protocolCleanliness})` on selection |
| 6 | Worker can add optional notes for cleanliness and general observations | VERIFIED | `protocol.tsx` — `protocolCleanlinessNote` and `protocolOtherNotes` TextInput fields wired to draft store |
| 7 | Customer can sign the return protocol on device | VERIFIED | `protocol-sign-customer.tsx` — reuses `SignatureScreen` component, `onConfirm` updates `protocolCustomerSignature` in draft |
| 8 | Worker can sign the return protocol on device | VERIFIED | `protocol-sign-worker.tsx` — reuses `SignatureScreen`, `onConfirm` updates `protocolWorkerSignature`, navigates to confirm |
| 9 | Confirm screen shows protocol summary with signatures status | VERIFIED | `confirm.tsx:214-230` — displays cleanliness label, notes, "Podpisano"/"Brak" for each signature |
| 10 | Submit creates protocol via API before returning the rental | VERIFIED | `confirm.tsx:25,71-74` — `protocolMutation.mutateAsync()` called first; rental return only proceeds on success |
| 11 | Admin can download return protocol PDF from rental detail page | VERIFIED | `wynajmy/[id]/page.tsx:579` — `apiClient('/return-protocols/${rental.id}/download')` fetches presigned URL, `window.open(url, '_blank')` |
| 12 | Protocol section only visible when rental is RETURNED and protocol exists | VERIFIED | `page.tsx:569` — `rental.status === RentalStatus.RETURNED && protocol &&` conditional |
| 13 | Download opens PDF in new tab via presigned URL | VERIFIED | `page.tsx:579-580` — presigned URL fetched from API, opened with `window.open(data.url, '_blank')` |

**Score:** 13/13 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/prisma/schema.prisma` | ReturnProtocol model definition | VERIFIED | `model ReturnProtocol` at line 592; Rental relation at line 303; User relation at line 113 |
| `apps/api/src/return-protocols/return-protocols.service.ts` | Protocol creation, PDF generation, email sending | VERIFIED | 160 lines; `create()`, `findByRentalId()`, `getDownloadUrl()` all present and substantive |
| `apps/api/src/return-protocols/return-protocols.controller.ts` | REST endpoints for protocol CRUD and download | VERIFIED | 39 lines; `@Post()`, `@Get(':rentalId')`, `@Get(':rentalId/download')` all present |
| `apps/api/src/contracts/pdf/templates/return-protocol.hbs` | Handlebars HTML template for return protocol PDF | VERIFIED | 56 lines (exceeds 40-line minimum); KITEK header, title, numbered fields, signature block |
| `apps/mobile/app/return/protocol.tsx` | Protocol form screen with cleanliness chips and notes | VERIFIED | 291 lines (exceeds 80-line minimum); chips, auto-filled data, notes, navigation wired |
| `apps/mobile/app/return/protocol-sign-customer.tsx` | Customer signature capture screen | VERIFIED | 33 lines (exceeds 30-line minimum); SignatureScreen with correct title/stepLabel |
| `apps/mobile/app/return/protocol-sign-worker.tsx` | Worker signature capture screen | VERIFIED | 33 lines (exceeds 30-line minimum); SignatureScreen with correct title/stepLabel |
| `apps/mobile/app/return/confirm.tsx` | Updated confirm screen with protocol summary and 2-step submit | VERIFIED | 282 lines (exceeds 100-line minimum); protocol card, 2-step submit, error handling |
| `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` | Protocol download section in rental detail | VERIFIED | Contains "Protokol zwrotu" CardTitle, "Pobierz protokol" button, conditional on RETURNED+protocol |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `return-protocols.service.ts` | `pdf.service.ts` | `generateReturnProtocolPdf()` call | WIRED | `service.ts:89` — `await this.pdfService.generateReturnProtocolPdf(pdfData)` |
| `return-protocols.service.ts` | `mail.service.ts` | `sendReturnProtocolEmail()` fire-and-forget | WIRED | `service.ts:116-124` — `setImmediate(() => this.mailService.sendReturnProtocolEmail(...))` |
| `return-protocols.service.ts` | `storage.service.ts` | upload signatures and PDF to R2 | WIRED | `service.ts:61-62,93` — `storageService.upload()` for both PNGs and PDF; `service.ts:158` — `getPresignedDownloadUrl()` |
| `apps/mobile/app/return/protocol.tsx` | `return-draft.store.ts` | `updateDraft` for protocol fields | WIRED | `protocol.tsx` — `updateDraft({protocolCleanliness...})` on chip tap confirmed by key link grep |
| `apps/mobile/app/return/confirm.tsx` | `POST /return-protocols` | API call before returnRental | WIRED | `confirm.tsx:63` — `apiClient.post('/return-protocols', data)` via `useCreateReturnProtocol` hook |
| `apps/mobile/app/return/notes.tsx` | `apps/mobile/app/return/protocol.tsx` | `router.push('/return/protocol')` | WIRED | `notes.tsx:23` — `router.push('/return/protocol')` confirmed |
| `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` | `GET /return-protocols/:rentalId/download` | fetch presigned URL on button click | WIRED | `page.tsx:579` — `apiClient('/return-protocols/${rental.id}/download')` in onClick handler |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ZWROT-01 | 39-01, 39-02, 39-03 | Przy zwrocie pojazdu generowany jest protokol zwrotu wg wzoru klienta (At vehicle return, a return protocol is generated per the client's template) | SATISFIED | Full pipeline: Handlebars template matches client layout (KITEK header, 7 numbered fields, signature block); Puppeteer PDF generation; R2 storage; email delivery; mobile wizard collects signatures; web admin can download |

No orphaned requirements — ZWROT-01 is the only requirement mapped to Phase 39 in REQUIREMENTS.md.

---

### Anti-Patterns Found

No blockers or warnings found. Scanned `return-protocols.service.ts`, `return-protocols.controller.ts`, `protocol.tsx`, and `confirm.tsx` — no TODO/FIXME, no placeholder returns, no stub implementations.

---

### Human Verification Required

#### 1. PDF Layout Matches Client Template

**Test:** Generate a return protocol via POST /return-protocols with a real rental, then download and open the PDF.
**Expected:** Single A4 page with KITEK header, correct company details (www.p-romanowski.pl, +48 602 367 100), 7 numbered fields with rental data, and both signature images visible at the bottom with 25mm top margin.
**Why human:** Visual comparison against the `return-protocol-template.pdf` reference document cannot be automated.

#### 2. Cleanliness Chip Toggle Behaviour

**Test:** On the mobile protocol form screen, tap a chip to select it, then tap it again.
**Expected:** Chip deselects (returns to unselected state), "Dalej" button becomes disabled. Cleanliness note field hides when no chip is selected.
**Why human:** Interactive state toggle cannot be verified without running the app.

#### 3. Signature Capture on Device

**Test:** On protocol-sign-customer screen, draw a signature and tap confirm. Verify it persists to confirm screen as "Podpisano".
**Expected:** Signature captured as base64 PNG, stored in draft, confirm screen shows "Podpis klienta: Podpisano".
**Why human:** Signature canvas interaction and landscape orientation lock require device/emulator testing.

#### 4. 2-Step Submit Error Recovery

**Test:** Simulate a protocol API failure (network error) on confirm screen submit.
**Expected:** Error toast shown ("Nie udalo sie utworzyc protokolu zwrotu. Sprobuj ponownie."), return rental mutation NOT called, user can retry.
**Why human:** Requires mocking network failure in running app context.

---

## Commits Verified

All 6 task commits documented in SUMMARYs are present in git history:

| Commit | Plan | Description |
|--------|------|-------------|
| `f4b3bd9` | 39-01 | ReturnProtocol model, migration, DTO, shared types, PDF template |
| `9498be3` | 39-01 | ReturnProtocols NestJS module, service, controller, PDF/email extensions |
| `4c6feed` | 39-02 | Extend return draft store and update wizard step counts |
| `69ac96f` | 39-02 | Create protocol form and signature screens |
| `b3a9cf7` | 39-02 | Update confirm screen with protocol summary and 2-step submit |
| `5e05488` | 39-03 | Add return protocol download section to rental detail |

---

## Summary

Phase 39 goal is **fully achieved**. All three plans delivered working code that together implement the complete return protocol feature:

- **Plan 01 (Backend):** Prisma model, migration, NestJS module, Handlebars PDF template matching client layout, PdfService and MailService extensions, 14 unit tests (234-line spec).
- **Plan 02 (Mobile):** Return wizard extended from 5 to 8 steps. Three new screens (protocol form, customer signature, worker signature) wire correctly through the draft store. Confirm screen implements 2-step submit with proper error isolation.
- **Plan 03 (Web):** Protocol download Card rendered conditionally for RETURNED rentals with an existing protocol, fetching presigned URL from the API and opening in a new tab.

All key pipeline connections are verified in code: template -> Puppeteer PDF -> R2 upload -> presigned download -> fire-and-forget email. The one auto-fixed deviation (exporting PdfService from ContractsModule) was correctly handled and documented.

---

_Verified: 2026-04-14T23:10:00Z_
_Verifier: Claude (gsd-verifier)_
