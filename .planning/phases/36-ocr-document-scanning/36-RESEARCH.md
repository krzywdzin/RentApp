# Phase 36: OCR Document Scanning - Research

**Researched:** 2026-04-13
**Domain:** On-device OCR text recognition, Polish ID/license parsing, document photo management
**Confidence:** MEDIUM

## Summary

This phase adds document scanning to the rental wizard -- workers photograph a client's Polish ID card (dowod osobisty) and driver license (prawo jazdy), the system extracts text via on-device OCR, and the worker reviews/corrects fields before saving. Document photos are stored in R2.

The core technical challenge is parsing structured fields from raw OCR text output. `expo-text-extractor` v2.0.0 (Feb 2026) is the right library -- it wraps ML Kit on Android and Apple Vision on iOS, returns `string[]` blocks, and requires Expo SDK 52+ (project uses SDK 54). The API is simple but returns flat text without confidence scores, so field extraction relies on regex parsing of Polish document layouts. A critical finding: Polish ID cards since 2015 no longer contain the address field -- address must be entered manually even when scanning.

The camera capture reuses the established `expo-image-picker` pattern (already in the project for vehicle photos). The document guide overlay is a simple React Native `View` overlay on the camera preview -- no need for `expo-camera` or Vision Camera. Storage follows the existing R2 path-based key pattern. A new `CustomerDocument` Prisma model links photos to customers.

**Primary recommendation:** Use `expo-text-extractor` for OCR, `expo-image-picker` for camera capture (established pattern), regex-based parsing for Polish document fields, and the existing StorageService for R2 uploads. Address fields must be manual input -- not extractable from modern Polish ID cards.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Scan buttons ("Skanuj dowod" / "Skanuj prawo jazdy") embedded in existing customer step of rental wizard
- Two separate buttons (not one button + type selector) -- one tap opens camera immediately
- Scan available for both new and existing customers -- new: fills empty fields, existing: proposes updates (worker decides per field)
- Scan is optional -- worker can always enter data manually
- Automatic document type recognition (DOC-F01) deferred to v4.0 -- worker chooses manually
- Confirmation screen after scan: thumbnail at top, all extracted fields below (editable), "Zatwierdz" button
- Low-confidence or missing OCR fields shown empty with color highlight (yellow/red) -- worker must fill manually
- Existing customer: diff view showing current vs OCR data side by side, checkbox per field to update
- ID card fields (DOC-03): imie, nazwisko, PESEL, nr dokumentu, adres (ulica, nr, kod, miasto)
- Driver license fields (DOC-04): nr prawa jazdy, kategorie, data waznosci
- Document guide frame on camera screen in ID-1 card proportions
- Front + back photos per document (back of ID has additional data)
- Camera only -- no gallery (fresh photo, better for audit)
- Torch button on camera screen
- Photos deleted with customer data (retentionExpiresAt) -- consistent with existing retention policy
- Document photo access: admin only in web panel. Workers see only during scanning
- Admin panel: new "Dokumenty" section on customer detail with thumbnails, click opens full image

### Claude's Discretion
- Camera overlay implementation (expo-image-picker vs expo-camera vs custom view)
- R2 key structure for document photos
- Parsing/regex for Polish ID and driver license (MRZ vs visual OCR)
- Database model for customer documents (CustomerDocument entity)
- Scan order (front -> back automatically vs manually)
- Exact logic for comparing existing data with OCR results

### Deferred Ideas (OUT OF SCOPE)
- DOC-F01: Automatic document type recognition (dowod vs prawo jazdy) -- v4.0
- Scanning second driver's documents -- separate phase if needed
- Offline scan with background sync -- deferred

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOC-01 | Worker can photograph client's ID card in mobile app | expo-image-picker camera capture pattern (established in photos.tsx), document guide overlay |
| DOC-02 | Worker can photograph client's driver license in mobile app | Same camera pattern as DOC-01, separate button trigger |
| DOC-03 | System extracts data from ID card via OCR: name, surname, PESEL, document number, address | expo-text-extractor v2.0.0 + regex parsing. CRITICAL: address NOT on modern Polish ID cards (since 2015) -- must be manual input |
| DOC-04 | System extracts data from driver license via OCR: license number, categories, expiry date | expo-text-extractor v2.0.0 + regex parsing of EU-standard license layout |
| DOC-05 | Worker can review/correct OCR-extracted data before saving | Confirmation screen with editable fields, diff view for existing customers |
| DOC-06 | Document photos stored in R2 and linked to customer | StorageService (existing), new CustomerDocument Prisma model, path-based R2 keys |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-text-extractor | 2.0.0 | On-device OCR (ML Kit Android / Apple Vision iOS) | Expo-native module, RODO-compliant (no server upload), SDK 52+ compatible |
| expo-image-picker | ~17.0.8 | Camera capture for document photos | Already installed, established pattern in vehicle photos |
| @aws-sdk/client-s3 | (existing) | R2 storage for document images | Already in project via StorageService |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | (existing) | Server-side image resize/thumbnail generation | When creating thumbnails of document photos for admin panel |
| zustand | (existing) | Draft store for scan state during wizard | Extend useRentalDraftStore with document scan data |
| react-hook-form | (existing) | OCR confirmation form with editable fields | Confirmation screen after scan |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-text-extractor | @react-native-ml-kit/text-recognition v2.0.0 | More mature but not Expo-native; expo-text-extractor uses Expo Modules API, simpler integration |
| expo-text-extractor | react-native-vision-camera + frame processor | Real-time OCR overkill; we only need single-image processing after capture |
| expo-image-picker | expo-camera | expo-camera gives more control (overlay, torch) but expo-image-picker is established pattern; overlay can be shown BEFORE launching camera |

**Installation:**
```bash
npx expo install expo-text-extractor
```

**IMPORTANT:** expo-text-extractor requires EAS dev client build -- will NOT work in Expo Go. This is already noted as a blocker in STATE.md.

## Architecture Patterns

### Recommended Project Structure
```
apps/mobile/
  src/
    components/
      DocumentScanner/
        DocumentScanButton.tsx       # "Skanuj dowod" / "Skanuj prawo jazdy" button
        DocumentConfirmation.tsx      # Post-scan review screen with editable fields
        DocumentDiffView.tsx          # Side-by-side diff for existing customer
        DocumentGuideOverlay.tsx      # Pre-scan guide showing document positioning
    lib/
      ocr/
        parse-id-card.ts             # Regex parsing of Polish ID card OCR text
        parse-driver-license.ts      # Regex parsing of Polish driver license OCR text
        ocr-types.ts                 # Shared OCR result types
    hooks/
      use-document-scan.ts           # Hook orchestrating capture + OCR + state

apps/api/
  src/
    documents/
      documents.module.ts
      documents.controller.ts        # Upload document photos, get document photos
      documents.service.ts           # Storage, thumbnail gen, CRUD
      dto/
        upload-document.dto.ts
        document-response.dto.ts

apps/web/
  src/
    app/(admin)/klienci/[id]/
      documents-section.tsx          # "Dokumenty" tab/section on customer detail

packages/shared/
  src/types/
    document.types.ts                # DocumentType enum, OcrResultDto, etc.
```

### Pattern 1: Camera Capture with Pre-scan Guide
**What:** Show a modal with document positioning guide BEFORE launching camera, then use expo-image-picker for actual capture
**When to use:** When you need a guide overlay but want to reuse established camera patterns
**Example:**
```typescript
// 1. Show guide overlay modal with document frame
// 2. User taps "Zrob zdjecie" in guide
// 3. Launch expo-image-picker camera (established pattern)
const result = await ImagePicker.launchCameraAsync({
  quality: 0.8, // slightly higher than vehicle photos for OCR readability
  allowsEditing: false,
  // No base64 -- use URI, upload separately
});
// 4. If not canceled, run OCR on captured image URI
if (!result.canceled && result.assets[0]) {
  const texts = await extractTextFromImage(result.assets[0].uri);
  const parsed = parseIdCard(texts); // or parseDriverLicense(texts)
}
```

### Pattern 2: Two-Photo Sequential Capture (Front + Back)
**What:** After capturing front, automatically prompt for back photo
**When to use:** Always -- both sides of document needed
**Example:**
```typescript
// State machine: IDLE -> FRONT_GUIDE -> FRONT_CAPTURE -> BACK_GUIDE -> BACK_CAPTURE -> REVIEW
type ScanPhase = 'idle' | 'front_guide' | 'front_captured' | 'back_guide' | 'back_captured' | 'review';
```

### Pattern 3: R2 Key Structure for Document Photos
**What:** Path-based keys following existing photo convention
**Example:**
```
documents/{customerId}/id-card/front.jpg
documents/{customerId}/id-card/front_thumb.jpg
documents/{customerId}/id-card/back.jpg
documents/{customerId}/id-card/back_thumb.jpg
documents/{customerId}/driver-license/front.jpg
documents/{customerId}/driver-license/front_thumb.jpg
documents/{customerId}/driver-license/back.jpg
documents/{customerId}/driver-license/back_thumb.jpg
```
This follows the existing `photos/{rentalId}/{type}/{position}.jpg` pattern but scoped to customer, not rental.

### Pattern 4: CustomerDocument Prisma Model
**What:** New model linking document photos to customers
**Example:**
```prisma
model CustomerDocument {
  id            String   @id @default(uuid())
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  type          String   // 'ID_CARD' | 'DRIVER_LICENSE'
  frontPhotoKey String
  frontThumbKey String
  backPhotoKey  String?
  backThumbKey  String?
  scannedAt     DateTime @default(now())
  scannedById   String
  scannedBy     User     @relation(fields: [scannedById], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([customerId, type])  // one document per type per customer (overwrite on re-scan)
}
```
Add `documents CustomerDocument[]` to Customer model. The `@@unique` constraint means re-scanning overwrites the previous document (delete old R2 keys first).

### Anti-Patterns to Avoid
- **Storing OCR text in the database:** OCR text is transient -- only the parsed, worker-confirmed fields matter. Don't persist raw OCR output.
- **Using expo-camera for simple capture:** expo-image-picker already handles permissions, camera launch, and returns URI. Adding expo-camera adds complexity without benefit since we only need a single snapshot, not a live preview.
- **Trying to parse address from modern Polish ID:** Since 2015, Polish ID cards do NOT contain the registered address. The CONTEXT.md lists address as a DOC-03 field, but it cannot be OCR-extracted. The address fields must remain manual input. The confirmation screen should show address fields as empty/manual-entry.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OCR text recognition | Custom ML model or server-side Cloud Vision | expo-text-extractor (ML Kit / Apple Vision) | On-device, RODO-compliant, handles languages automatically |
| Image upload to R2 | Custom S3 client | Existing StorageService | Already handles local fallback, bucket creation, presigned URLs |
| Thumbnail generation | Client-side resize | Server-side sharp (existing pattern in photos.service) | Consistent with vehicle photo thumbnails |
| PESEL validation | Custom validator | Existing IsValidPesel decorator | Already in codebase |
| Camera permissions | Manual permission handling | expo-image-picker's built-in requestCameraPermissionsAsync | Established pattern |

**Key insight:** The heaviest part of this phase is the UI/UX (guide overlay, two-photo flow, confirmation screen, diff view) -- NOT the OCR itself. The OCR API call is one line; the parsing and confirmation UX is the real work.

## Common Pitfalls

### Pitfall 1: Polish ID Card Has No Address Since 2015
**What goes wrong:** Developer assumes OCR can extract address from dowod osobisty
**Why it happens:** CONTEXT.md lists address as a DOC-03 field, and older ID cards did have address
**How to avoid:** Address fields in confirmation screen must be empty/manual-entry. Only extract: imie, nazwisko, PESEL, nr dokumentu from ID card. Show clear label "Adres -- wpisz recznie"
**Warning signs:** Regex trying to find "ul." or "Adres" on ID card OCR output

### Pitfall 2: OCR Quality Varies Wildly by Photo Conditions
**What goes wrong:** OCR returns garbled text, especially for Polish diacritics (ą, ę, ś, ź, etc.)
**Why it happens:** Poor lighting, angle, blur, glare on laminated card
**How to avoid:** Higher image quality (0.8 vs 0.7), document guide overlay to help positioning, torch button, treat ALL OCR fields as suggestions that worker must confirm
**Warning signs:** Over-relying on OCR accuracy instead of making correction easy

### Pitfall 3: expo-text-extractor Returns Flat Strings Without Confidence
**What goes wrong:** Developer expects structured blocks with bounding boxes or confidence scores
**Why it happens:** The API returns `Promise<string[]>` -- just an array of text strings
**How to avoid:** Parse the entire text array with regex patterns. Match known patterns (PESEL = 11 digits, document number = 3 letters + 6 digits, etc.) rather than relying on field position
**Warning signs:** Code that assumes text[0] is always the name, text[1] is always the surname

### Pitfall 4: Expo Go Incompatibility
**What goes wrong:** expo-text-extractor crashes or is undefined in Expo Go
**Why it happens:** Native module requires EAS dev client build
**How to avoid:** Use `isSupported` check before calling `extractTextFromImage`. Gate scan buttons behind platform check. Document EAS build requirement clearly.
**Warning signs:** "Module not found" errors during development

### Pitfall 5: Overwriting Customer Data Without Consent
**What goes wrong:** OCR results automatically update customer record
**Why it happens:** Missing the confirmation/diff step
**How to avoid:** ALWAYS show confirmation screen. For existing customers, show diff view with checkboxes. Worker must explicitly approve each field change.
**Warning signs:** Direct customer update from OCR output without review

### Pitfall 6: Document Photos Not Deleted With Customer
**What goes wrong:** Customer archived/deleted but document photos remain in R2
**Why it happens:** Missing cascade delete for R2 keys
**How to avoid:** Use `onDelete: Cascade` in Prisma for CustomerDocument. Add R2 cleanup in customer archive/retention service (delete R2 keys when CustomerDocument rows are deleted)
**Warning signs:** Orphaned R2 objects after customer deletion

## Code Examples

### OCR Text Parsing for Polish ID Card (Front)
```typescript
// Source: Research analysis of Polish ID card layout (Wikipedia, EU standards)
// Front of Polish ID card contains: surname, given names, date of birth,
// nationality, card number, gender, expiry date, PESEL (on newer cards)

interface IdCardOcrResult {
  firstName: string | null;
  lastName: string | null;
  pesel: string | null;
  documentNumber: string | null;
  // Address NOT extractable from modern Polish ID cards (removed 2015)
}

export function parseIdCard(ocrTexts: string[]): IdCardOcrResult {
  const fullText = ocrTexts.join('\n');

  // PESEL: exactly 11 consecutive digits (not part of a longer number)
  const peselMatch = fullText.match(/(?<!\d)\d{11}(?!\d)/);

  // Document number: 3 uppercase letters + 6 digits (e.g., ABC123456)
  const docNumMatch = fullText.match(/[A-Z]{3}\d{6}/);

  // Names: typically on lines after "Nazwisko / Surname" and "Imie / Name"
  // Heuristic: look for label patterns on Polish ID
  const nameLines = ocrTexts.filter(line =>
    !line.match(/RZECZPOSPOLITA|DOWÓD|POLSKA|IDENTITY|CARD|Surname|Name|Date|Nationality|Sex/)
    && line.match(/^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+$/)
  );

  return {
    firstName: nameLines[1] ?? null,  // second name-like line is usually given name
    lastName: nameLines[0] ?? null,   // first name-like line is usually surname
    pesel: peselMatch?.[0] ?? null,
    documentNumber: docNumMatch?.[0] ?? null,
  };
}
```

### OCR Text Parsing for Polish Driver License
```typescript
// Source: EU driver license standard, Polish prawo jazdy layout
// Front: surname (1), given names (2), DOB (3), issue date (4a),
// expiry date (4b), issuing authority (4c), license number (5)
// Back: categories with validity dates

interface DriverLicenseOcrResult {
  licenseNumber: string | null;
  categories: string | null;
  expiryDate: string | null;  // ISO format
}

export function parseDriverLicense(ocrTexts: string[]): DriverLicenseOcrResult {
  const fullText = ocrTexts.join('\n');

  // License number: typically a sequence like "12345/67/8901" or similar Polish format
  const licenseNumMatch = fullText.match(/\d{5}\/\d{2}\/\d{4}/);

  // Categories: B, B+E, A, A2, AM, C, D, etc. - look for category-like patterns
  const categoryMatch = fullText.match(/(?:AM|A1|A2|A|B1|B\+E|BE|B|C1\+E|C1|C\+E|CE|C|D1\+E|D1|D\+E|DE|D|T)(?:\s*,?\s*(?:AM|A1|A2|A|B1|B\+E|BE|B|C1\+E|C1|C\+E|CE|C|D1\+E|D1|D\+E|DE|D|T))*/);

  // Expiry date: DD.MM.YYYY or DD/MM/YYYY pattern
  const dates = fullText.match(/\d{2}[./]\d{2}[./]\d{4}/g) ?? [];
  // Last date is typically expiry (4b comes after 4a issue date)
  const expiryRaw = dates.length > 1 ? dates[1] : dates[0];

  let expiryDate: string | null = null;
  if (expiryRaw) {
    const parts = expiryRaw.split(/[./]/);
    expiryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;  // to ISO
  }

  return {
    licenseNumber: licenseNumMatch?.[0] ?? null,
    categories: categoryMatch?.[0]?.replace(/\s+/g, ', ') ?? null,
    expiryDate,
  };
}
```

### Document Photo Upload API Endpoint
```typescript
// Following existing photos.controller.ts pattern
@Post(':customerId/documents/:type/:side')
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
@UseInterceptors(FileInterceptor('file'))
async uploadDocumentPhoto(
  @Param('customerId') customerId: string,
  @Param('type') type: 'id-card' | 'driver-license',
  @Param('side') side: 'front' | 'back',
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: UserPayload,
) {
  return this.documentsService.uploadPhoto(customerId, type, side, file, user.sub);
}
```

### Draft Store Extension for Document Scan
```typescript
// Extend RentalDraft interface
interface DocumentScanData {
  frontUri: string;
  backUri: string | null;
  ocrResult: Record<string, string | null>;
  confirmed: boolean;
}

// Add to RentalDraft:
idCardScan: DocumentScanData | null;
driverLicenseScan: DocumentScanData | null;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polish ID with address | No address on ID card | 2015 | Cannot OCR-extract address -- manual input required |
| Server-side Cloud Vision | On-device ML Kit | Project decision (v3.0) | RODO compliant, no data leaves device for OCR |
| expo-text-recognizer (old name) | expo-text-extractor v2.0.0 | Feb 2026 | Stable Expo Modules API, SDK 52+ |
| react-native-mlkit-ocr | Unmaintained (3 years old) | 2023 | Do not use -- expo-text-extractor is current alternative |

## Open Questions

1. **PESEL on front vs back of modern ID cards**
   - What we know: PESEL appears on the back of current (2019+) Polish ID cards. Some sources say it also appears on the front.
   - What's unclear: Whether OCR of just the front is sufficient for PESEL extraction, or if back photo is required.
   - Recommendation: Require both front AND back photos. Parse PESEL from whichever side yields it. The back definitely has it.

2. **OCR accuracy for Polish diacritics in names**
   - What we know: ML Kit handles Latin script well but Polish-specific characters (ą, ę, ś, ź, ż, ó, ł, ń, ć) may have lower accuracy
   - What's unclear: Actual accuracy rate on Polish ID cards with ML Kit
   - Recommendation: Always show OCR results as editable suggestions. Workers will naturally correct diacritic errors.

3. **Address field in CONTEXT.md vs reality**
   - What we know: CONTEXT.md DOC-03 lists address as an OCR field, but Polish IDs since 2015 have no address
   - What's unclear: Whether the user expects address to come from OCR or understands it must be manual
   - Recommendation: Implement address fields in the confirmation screen as empty/manual-entry. Show them in the OCR review but clearly marked as "Wpisz recznie". This satisfies DOC-03 (fields exist) while being honest about OCR limitations.

4. **Driver license number format variability**
   - What we know: Polish license numbers follow several formats depending on issuing period
   - What's unclear: Full set of format variations
   - Recommendation: Use loose regex matching, show result as editable. Worker corrects if needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (ts-jest) |
| Config file | `apps/api/jest.config.ts` |
| Quick run command | `cd apps/api && npx jest --testPathPattern=documents --no-coverage` |
| Full suite command | `cd apps/api && npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOC-01 | Upload ID card photo to R2 via API | unit | `cd apps/api && npx jest documents.service --no-coverage` | No - Wave 0 |
| DOC-02 | Upload driver license photo to R2 via API | unit | Same as DOC-01 (same service) | No - Wave 0 |
| DOC-03 | Parse Polish ID card OCR text | unit | `cd apps/mobile && npx jest parse-id-card --no-coverage` | No - Wave 0 |
| DOC-04 | Parse Polish driver license OCR text | unit | `cd apps/mobile && npx jest parse-driver-license --no-coverage` | No - Wave 0 |
| DOC-05 | Review/correct endpoint (PATCH customer with partial fields) | unit | `cd apps/api && npx jest customers.service --no-coverage` | Yes (existing) |
| DOC-06 | Document photo CRUD + cascade delete | unit | `cd apps/api && npx jest documents.service --no-coverage` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern=documents --no-coverage`
- **Per wave merge:** `cd apps/api && npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/documents/documents.service.spec.ts` -- covers DOC-01, DOC-02, DOC-06
- [ ] `apps/mobile/src/lib/ocr/__tests__/parse-id-card.test.ts` -- covers DOC-03
- [ ] `apps/mobile/src/lib/ocr/__tests__/parse-driver-license.test.ts` -- covers DOC-04

## Sources

### Primary (HIGH confidence)
- [expo-text-extractor GitHub](https://github.com/pchalupa/expo-text-extractor) - API, version 2.0.0, SDK 52+ requirement, Feb 2026 release
- [expo-text-extractor npm](https://www.npmjs.com/package/expo-text-extractor) - version 2.0.0, published 2026-02-28
- Project codebase - existing patterns for camera (photos.tsx), storage (storage.service.ts), customer model (schema.prisma), draft store

### Secondary (MEDIUM confidence)
- [Polish identity card - Wikipedia](https://en.wikipedia.org/wiki/Polish_identity_card) - card layout, address removal in 2015, PESEL location, document number format
- [Driving licence in Poland - Wikipedia](https://en.wikipedia.org/wiki/Driving_licence_in_Poland) - EU-standard layout, field numbering, categories
- [Poland's 2019 Identity Card (Keesing)](https://www.keesingtechnologies.com/wp-content/uploads/2020/12/Polish-ID-Card_V2.pdf) - 2019 e-dowod format details
- [@react-native-ml-kit/text-recognition npm](https://www.npmjs.com/package/@react-native-ml-kit/text-recognition) - alternative library comparison

### Tertiary (LOW confidence)
- OCR parsing regex patterns for Polish documents -- based on document layout research, not tested against real OCR output. Patterns will need tuning during implementation.
- Driver license number format variations -- incomplete coverage of historical formats

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - expo-text-extractor verified on npm, established project patterns for camera/storage
- Architecture: HIGH - follows existing NestJS module + Expo patterns established in 33+ prior phases
- OCR parsing: LOW - regex patterns are educated guesses based on document layout, need real-world testing
- Polish ID address limitation: HIGH - confirmed by Wikipedia and multiple sources that address removed in 2015
- Pitfalls: MEDIUM - based on general OCR experience and Polish document specifics

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (30 days -- stable domain, unlikely to change)
