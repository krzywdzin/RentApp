# Architecture Patterns — v3.0 Integration

**Domain:** Car rental management system — v3.0 feature integration into existing architecture
**Researched:** 2026-04-12
**Confidence:** HIGH (based on full codebase inspection)

## Existing Architecture (Reference)

```
apps/
  api/          NestJS + Prisma + Bull queues (15 modules)
  mobile/       Expo/React Native (file-based routing, wizard pattern)
  web/          Next.js admin panel
packages/
  shared/       Types (TypeScript interfaces), schemas (Zod), enums
```

**Key patterns already established:**
- Prisma ORM with PostgreSQL, single `schema.prisma` at `apps/api/prisma/`
- Encrypted PII (PESEL, ID, license) via `Json` columns + HMAC for search
- `ContractFrozenData` JSON snapshot at contract creation time
- Puppeteer + Handlebars PDF generation in `PdfService`
- S3-compatible storage (Cloudflare R2) via `StorageService`
- Event-driven side effects via `EventEmitter2` (e.g., `rental.created`, `rental.returned`)
- Bull queues on Redis for async SMS/email jobs
- class-validator DTOs on API, Zod schemas in shared package
- Mobile wizard pattern with file-based routing (`new-rental/`, `return/`)

---

## Feature-by-Feature Integration Map

### 1. Document Scanning (OCR + photo of ID/license)

**Impact:** NEW module + new DB model + new mobile wizard step

**New API module:** `apps/api/src/documents/`
```
documents/
  documents.module.ts
  documents.controller.ts    POST /documents/scan (multipart)
  documents.service.ts        orchestrates storage + OCR
  ocr.service.ts              wraps OCR provider
  dto/scan-document.dto.ts
```

**New DB model:**
```prisma
model CustomerDocument {
  id            String   @id @default(uuid())
  customerId    String?
  rentalId      String?
  type          String   // "ID_CARD" | "DRIVERS_LICENSE"
  photoKey      String
  thumbnailKey  String?
  ocrData       Json?
  ocrConfidence Float?
  uploadedById  String
  createdAt     DateTime @default(now())

  customer      Customer? @relation(fields: [customerId], references: [id])
  rental        Rental?   @relation(fields: [rentalId], references: [id])

  @@index([customerId])
  @@index([rentalId])
  @@map("customer_documents")
}
```

**Modified models:** `Customer` (add `documents CustomerDocument[]` relation), `Rental` (add `documents CustomerDocument[]` relation)

**Shared types:**
```typescript
interface DocumentScanResult {
  documentType: 'ID_CARD' | 'DRIVERS_LICENSE';
  photoUrl: string;
  extractedFields: {
    firstName?: string; lastName?: string;
    pesel?: string; idNumber?: string;
    idIssuedBy?: string; idExpiryDate?: string;
    licenseNumber?: string; licenseCategory?: string;
    address?: string;
  };
  confidence: number;
}
```

**Mobile:** New step in `new-rental/` wizard between customer selection and dates. Camera capture, upload, display extracted fields for employee confirmation.

**Data flow:** Mobile captures photo -> `POST /documents/scan` -> API stores in R2, runs OCR -> returns extracted fields -> mobile pre-fills customer form -> employee corrects -> proceeds to rental creation.

**OCR provider choice:** Google Cloud Vision API (best Polish text accuracy). Fallback: Tesseract.js for offline/cost reasons. Implementation in `ocr.service.ts` behind interface for swappability.

---

### 2. Vehicle Classes (admin-defined)

**Impact:** NEW model + extend Vehicle model + extend VehiclesModule

**New DB model:**
```prisma
model VehicleClass {
  id          String    @id @default(uuid())
  name        String    @unique
  description String?
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  vehicles    Vehicle[]
  @@map("vehicle_classes")
}
```

**Modified model:** `Vehicle` — add `classId String?` + `vehicleClass VehicleClass? @relation(...)` + `@@index([classId])`

**No new module needed.** Extend `VehiclesModule` with class CRUD:
- `GET /vehicles/classes` (all roles)
- `POST /vehicles/classes` (admin)
- `PATCH /vehicles/classes/:id` (admin)
- `DELETE /vehicles/classes/:id` (admin, soft-delete via `isActive`)

**Shared types:** `VehicleClassDto { id, name, description, sortOrder, isActive }`
**VehicleDto extension:** add `vehicleClass?: VehicleClassDto`

**Web:** New "Klasy pojazdow" settings page + class dropdown in vehicle edit form.
**Mobile:** Filter/group vehicles by class in vehicle selection step.

---

### 3. Editable Rental Terms + Notes (features #3 and #14 combined)

**Impact:** Modify Rental model + ContractFrozenData + PDF template + new Settings model

**New DB model (for default terms):**
```prisma
model AppSetting {
  key       String   @id
  value     String   @db.Text
  updatedAt DateTime @updatedAt
  @@map("app_settings")
}
```

**Modified model: Rental** — add:
```
rentalTerms   String?  @db.Text  // custom terms, null = use default
termsNotes    String?  @db.Text  // additional notes ("uwagi")
```

**ContractFrozenData.conditions extension:**
```typescript
rentalTerms: string;   // frozen: custom or default at contract time
termsNotes: string | null;
```

**CreateContractDto extension:** No change needed. `ContractsService.buildFrozenData` reads `rentalTerms` from rental (or falls back to default from `AppSetting`).

**PDF template:** Add `{{#if conditions.rentalTerms}}` section to `contract.hbs`.

**Web admin:** Settings page to edit default terms via `AppSetting` table.
**Mobile:** Editable textarea in contract step, pre-filled with default terms. Separate "Uwagi" textarea.

---

### 4. Company Customer (NIP checkbox)

**Impact:** Modify Customer model + CustomerDto + contract frozen data + PDF

**Modified model: Customer** — add:
```
isCompany       Boolean   @default(false)
companyName     String?
nipEncrypted    Json?
nipHmac         String?
companyAddress  String?
```

**CustomerDto extension:** `isCompany: boolean`, `companyName: string | null`, `nip: string | null`, `companyAddress: string | null`

**ContractFrozenData.customer extension:** same fields.

**Shared schemas:** NIP validation (Polish checksum algorithm) in `customer.schemas.ts`.

**CustomersService:** Extend `create` and `update` to handle NIP encryption (same pattern as PESEL — encrypt + HMAC).

**Mobile:** Toggle "Firma" in customer form. When checked, show NIP + company name + company address.
**PDF:** Conditional company section in header.

---

### 5. Terms Acceptance Checkbox

**Impact:** Modify Contract model + CreateContractDto + mobile flow

**Modified model: Contract** — add:
```
termsAcceptedAt  DateTime?
```

**CreateContractDto extension:** `termsAcceptedAt?: string` (ISO date, same pattern as `rodoConsentAt`).

**ContractFrozenData extension:** `termsAccepted: { accepted: boolean; timestamp: string | null }`

**Mobile:** Checkbox before signatures step, same UX as existing RODO consent.
**PDF:** Checkbox indicator with timestamp.

**Minimal change** — exact copy of existing `rodoConsentAt` pattern.

---

### 6. Google Places (handover/return location)

**Impact:** NEW module + extend handover/return JSON data

**New API module:** `apps/api/src/places/`
```
places/
  places.module.ts
  places.controller.ts   GET /places/autocomplete?input=...
  places.service.ts       wraps Google Places API
```

**No DB schema changes.** Location stored in existing `handoverData` / `returnData` JSON:
```typescript
// Extend VehicleInspection interface in shared:
location?: {
  placeId: string;
  description: string;
  lat: number;
  lng: number;
};
```

**API key:** Server-side only via `GOOGLE_PLACES_API_KEY` env var. Mobile calls own backend proxy, never touches Google directly.

**Mobile:** Autocomplete text input in handover step and return `[rentalId].tsx` step.
**PDF:** Show location text in handover/return sections.

---

### 7. Insurance Case Number + Email Subject (features #7 and #9 combined)

**Impact:** Modify Rental model + mail service + PDF

**Modified model: Rental** — add:
```
insuranceCaseNumber  String?
```

**CreateRentalDto extension:** `insuranceCaseNumber?: string`

**ContractFrozenData.rental extension:** `insuranceCaseNumber: string | null`

**MailService change:** `sendContractEmail` subject becomes: `insuranceCaseNumber ? "Nr sprawy: ${caseNumber} | ${reg} — Umowa ${contractNumber}" : "Umowa ${contractNumber} — ${reg}"`

**Mobile:** Optional text field in rental creation dates step.
**PDF:** Insurance case number in header if present.

---

### 8. Customer Address in Mobile

**Impact:** Mobile UI only

**No API or DB changes.** `Customer.address` already exists. Add address field to mobile customer form components.

---

### 10. Hide VIN/Year from Customer

**Impact:** PDF template + portal API

**PDF template change only:** Use Handlebars conditional — show VIN/year on company copy, hide on customer copy section.

**Portal:** Filter VIN/year from portal endpoint responses in `PortalService`.

**No DB changes.**

---

### 11. VAT Payer Status

**Impact:** Modify Rental model + mobile form + PDF

**Modified model: Rental** — add:
```
vatDeductionRate  Int?   // 100, 50, or 0. null = not applicable
```

**On Rental, not Customer** — VAT status is per-rental (can change between rentals).

**Mobile:** Segmented control in rental creation: "100% VAT" / "50% VAT" / "Nie odlicza".
**PDF:** VAT deduction info in pricing section.
**Pricing impact:** Display-only. Does not change invoice amounts.

---

### 12. VAT Notification on Return

**Impact:** Extend notifications module event listener

**No new models.** Uses existing `Notification` model with new type `'VAT_RETURN_REMINDER'`.

**Implementation:** Add handler in notification event listener for `rental.returned` event — if `vatDeductionRate` is set, queue notification to admin.

---

### 13. Second Driver (data + CEPiK)

**Impact:** NEW model + modify Rental + extend CEPiK + extend contract + PDF

**New DB model:**
```prisma
model RentalDriver {
  id                  String   @id @default(uuid())
  rentalId            String
  firstName           String
  lastName            String
  phone               String?
  peselEncrypted      Json
  peselHmac           String
  licenseNumEncrypted Json
  licenseNumHmac      String
  licenseCategory     String?
  licenseIssuedBy     String?
  rental              Rental   @relation(fields: [rentalId], references: [id], onDelete: Cascade)
  cepikVerifications  CepikVerification[]
  createdAt           DateTime @default(now())
  @@index([rentalId])
  @@map("rental_drivers")
}
```

**Modified models:**
- `Rental` — add `additionalDrivers RentalDriver[]`
- `CepikVerification` — add `driverId String?` + `driver RentalDriver? @relation(...)` (nullable, existing records stay linked to customer only)

**ContractFrozenData extension:**
```typescript
secondDriver?: {
  firstName: string; lastName: string;
  pesel: string; licenseNumber: string;
  licenseCategory: string | null; phone: string | null;
};
```

**Mobile:** "Dodaj drugiego kierowce" button in rental wizard. Sub-form with same encrypted fields. CEPiK check via existing `CepikService`.

**API:** Extend `CreateRentalDto` with optional `secondDriver` object. Create `RentalDriver` record in same transaction. Encryption follows `CustomersService` pattern.

**PDF:** Second driver section (conditional) on contract.

---

### 15. Return Protocol

**Impact:** New PDF template + modify Rental model + extend return flow

**Modified model: Rental** — add:
```
returnProtocolKey  String?
returnProtocolAt   DateTime?
```

**PdfService extension:** New template `return-protocol.hbs` + method `generateReturnProtocolPdf(data)`.

**Return protocol data type:**
```typescript
interface ReturnProtocolPdfData {
  contractNumber: string;
  returnDate: string;
  customer: { firstName: string; lastName: string };
  vehicle: { registration: string; make: string; model: string };
  handoverMileage: number;
  returnMileage: number;
  damages: { x: number; y: number; label: string }[];
  location?: { description: string };
  notes?: string;
  signatures: { employee?: string; customer?: string };
}
```

**Mobile return flow:** After existing return wizard steps, new signature collection step (employee + customer sign protocol). Then generate/upload protocol PDF.

**API:** New endpoint `POST /rentals/:id/return-protocol` or extend `processReturn`.

---

### 16. Settlement Tracking

**Impact:** NEW module + new models + web admin page

**New DB models:**
```prisma
enum SettlementStatus {
  PENDING
  PARTIAL
  SETTLED
  DISPUTED
}

model RentalSettlement {
  id          String           @id @default(uuid())
  rentalId    String           @unique
  status      SettlementStatus @default(PENDING)
  totalDue    Int
  totalPaid   Int              @default(0)
  notes       String?
  settledAt   DateTime?
  settledById String?
  rental      Rental           @relation(fields: [rentalId], references: [id])
  payments    SettlementPayment[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  @@map("rental_settlements")
}

model SettlementPayment {
  id           String   @id @default(uuid())
  settlementId String
  amount       Int
  method       String   // CASH, TRANSFER, CARD
  reference    String?
  paidAt       DateTime
  recordedById String
  settlement   RentalSettlement @relation(fields: [settlementId], references: [id])
  createdAt    DateTime @default(now())
  @@index([settlementId])
  @@map("settlement_payments")
}
```

**New API module:** `apps/api/src/settlements/`
- `GET /settlements` (with status/date filters, pagination)
- `GET /settlements/:id`
- `POST /settlements` (auto-created on rental return or manual)
- `PATCH /settlements/:id` (update status, notes)
- `POST /settlements/:id/payments` (record payment)

**Modified model: Rental** — add `settlement RentalSettlement?`

**Web admin:** New "Rozliczenia" page with table, status filters, payment recording.
**Mobile:** Read-only settlement status badge on rental detail (low priority).

---

### 17. Encrypted PDF

**Impact:** Modify PdfService + contract signing flow + SMS

**No new DB columns.** Encryption happens after PDF generation, before R2 upload.

**PdfService extension:**
```typescript
async encryptPdf(pdfBuffer: Buffer, password: string): Promise<Buffer> {
  // qpdf CLI: qpdf --encrypt <password> <password> 256 -- input.pdf output.pdf
}
```

**Integration:** In `ContractsService.sign`, after `generateContractPdf`, call `encryptPdf(pdfBuffer, registration.toLowerCase())` before `storageService.upload`.

**SMS:** After contract email sent, queue SMS: "Umowa wyslana na email. Haslo do PDF: {registration}".

**Tool:** `qpdf` via `child_process.execFile` — battle-tested, handles PDF encryption correctly. Install as system dependency in Docker/Railway.

---

## Complete Database Migration Summary

### New Models (5)
| Model | Table | Purpose |
|-------|-------|---------|
| `CustomerDocument` | `customer_documents` | OCR scan photos + results |
| `VehicleClass` | `vehicle_classes` | Admin-defined vehicle categories |
| `RentalDriver` | `rental_drivers` | Second driver per rental |
| `RentalSettlement` | `rental_settlements` | Settlement lifecycle |
| `SettlementPayment` | `settlement_payments` | Individual payments |
| `AppSetting` | `app_settings` | Key-value for default terms etc. |

### New Enums (1)
| Enum | Values |
|------|--------|
| `SettlementStatus` | PENDING, PARTIAL, SETTLED, DISPUTED |

### Modified Models (4)
| Model | New Columns |
|-------|-------------|
| `Customer` | `isCompany`, `companyName`, `nipEncrypted`, `nipHmac`, `companyAddress` + `documents` relation |
| `Vehicle` | `classId` (FK) + `vehicleClass` relation |
| `Rental` | `insuranceCaseNumber`, `vatDeductionRate`, `rentalTerms`, `termsNotes`, `returnProtocolKey`, `returnProtocolAt` + `additionalDrivers`, `documents`, `settlement` relations |
| `Contract` | `termsAcceptedAt` |
| `CepikVerification` | `driverId` (FK, nullable) + `driver` relation |

### Migration Strategy
**Single Prisma migration.** All new columns are nullable or have defaults. All new tables are standalone. Zero downtime — no data migration for existing records.

---

## New API Module Map

```
apps/api/src/
  documents/         NEW — OCR document scanning
  places/            NEW — Google Places proxy
  settlements/       NEW — Settlement tracking
  vehicles/          EXTEND — vehicle class CRUD endpoints
  rentals/           EXTEND — new fields (insurance case, VAT, terms, second driver)
  contracts/         EXTEND — terms acceptance, encryption, updated frozen data
  contracts/pdf/     EXTEND — new templates (return protocol), encryption, updated contract template
  customers/         EXTEND — company fields, NIP encryption, document relation
  notifications/     EXTEND — VAT return notification type
  mail/              EXTEND — dynamic email subject
  portal/            EXTEND — hide VIN/year
```

### Component Communication

| Component | Communicates With | How |
|-----------|-------------------|-----|
| `DocumentsModule` | `StorageService`, `CustomersService` | Direct injection |
| `PlacesModule` | Google Places API | HTTP client |
| `SettlementsModule` | `PrismaService` | Direct injection |
| `RentalsModule` (extended) | `CepikService` (for second driver) | Direct injection |
| `ContractsModule` (extended) | `PdfService`, `StorageService`, `NotificationsModule` | Direct injection + event |
| `PdfService` (extended) | `qpdf` CLI | `child_process.execFile` |
| `NotificationsModule` (extended) | Bull queue | Existing pattern |

---

## Suggested Build Order (Dependency-Aware)

### Phase 1: Schema + Simple Fields (no feature dependencies)
1. **Vehicle Classes** — standalone CRUD, simple
2. **Customer Address in Mobile** — UI-only change
3. **Company/NIP Support** — extends Customer model, needed by contract/PDF later
4. **Insurance Case Number** — simple Rental field, enables email subject change
5. **AppSetting model** — needed for default rental terms

### Phase 2: Contract Enhancements (batched — all touch ContractFrozenData + PDF)
6. **Editable Rental Terms + Notes** — Rental columns + frozen data + PDF template
7. **Terms Acceptance Checkbox** — Contract column, follows rodoConsentAt pattern
8. **VAT Payer Status** — Rental column + PDF display
9. **Hide VIN/Year** — PDF template conditional only
10. **Email Subject = Case Number + Reg** — MailService change, depends on #4

**Rationale for batching:** All these features modify `ContractFrozenData` and the contract Handlebars template. Doing them together means one template rewrite, one frozen data interface update.

### Phase 3: New Modules (independent, complex)
11. **Google Places Integration** — new module, used by handover/return
12. **Second Driver** — new model, CEPiK integration, contract/PDF extension
13. **Document Scanning (OCR)** — new module, most complex feature

### Phase 4: Return Flow + Settlement + Encryption (depend on earlier phases)
14. **Return Protocol** — new PDF template, extends return flow, uses locations from #11
15. **VAT Notification on Return** — notification extension, depends on #8
16. **Settlement Tracking** — new module, web admin only
17. **Encrypted PDF + SMS** — wraps final PDF generation, last because it affects existing signing flow

### Build Order Rationale
- Phase 1: Leaf nodes with no downstream dependencies, quick wins
- Phase 2: Batch all ContractFrozenData + PDF template changes to avoid rework
- Phase 3: Isolated complex features (OCR, Google API) that don't block other work
- Phase 4: Features that consume data from earlier phases (return protocol needs locations, settlement needs complete rental, encryption wraps final PDF)

---

## Anti-Patterns to Avoid

### Overloading JSON Columns
**Trap:** Putting all new data in `handoverData`/`returnData`/`contractData` JSON.
**Why bad:** Loses type safety, can't index, can't query efficiently.
**Rule:** Use proper columns for structured data. JSON only for truly dynamic data (OCR results, damage pins, inspection areas).

### Direct Google API from Mobile
**Trap:** Embedding Google Places API key in mobile app.
**Why bad:** Key exposed in APK, no rate limiting, billing risk.
**Rule:** Proxy through `PlacesModule`.

### Separate Migrations per Feature
**Trap:** Running 17 separate migrations during deployment.
**Why bad:** Slow deploys, risk of partial failures.
**Rule:** Single Prisma migration with all additive schema changes.

### Mutating ContractFrozenData Interface Piecemeal
**Trap:** Each feature independently extends `ContractFrozenData`.
**Why bad:** Multiple incompatible changes, contract template gets rewritten multiple times.
**Rule:** Design the full v3.0 `ContractFrozenData` shape upfront, implement in one pass (Phase 2).

---

## Scalability Notes

| Concern | At Current Scale (~100 vehicles) | If Growth Needed |
|---------|----------------------------------|------------------|
| OCR processing | Synchronous in request OK | Move to Bull queue |
| PDF encryption | `qpdf` CLI is fast (<1s) | Fine at any scale |
| Google Places | Backend proxy, no caching needed | Add Redis cache |
| Settlement queries | Simple paginated queries | Already indexed |
| Document storage | Flat R2 keys | R2 scales infinitely |

---

## Sources

- Prisma schema: `apps/api/prisma/schema.prisma`
- NestJS modules: `apps/api/src/app.module.ts`
- Contract frozen data: `packages/shared/src/types/contract.types.ts`
- PDF service: `apps/api/src/contracts/pdf/pdf.service.ts`
- Storage service: `apps/api/src/storage/storage.service.ts`
- Rentals service: `apps/api/src/rentals/rentals.service.ts`
- Contracts service: `apps/api/src/contracts/contracts.service.ts`
- Mobile routing: `apps/mobile/app/` directory structure
- Customer types: `packages/shared/src/types/customer.types.ts`
- All analysis based on direct codebase inspection — HIGH confidence
