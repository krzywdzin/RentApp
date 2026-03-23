# Phase 2: Fleet and Customer Data - Research

**Researched:** 2026-03-23
**Domain:** Vehicle fleet CRUD, CSV/XLS import, customer PII management with field-level encryption, MinIO document storage
**Confidence:** HIGH

## Summary

Phase 2 builds two new NestJS modules (Vehicle, Customer) on top of the Phase 1 foundation. The Vehicle module handles full CRUD with document uploads to MinIO and a status lifecycle enum. The Customer module manages PII with AES-256-GCM encryption using the existing `field-encryption.ts` utility, HMAC-based search indices, and RODO-compliant retention policies. A fleet import endpoint accepts CSV/XLS files via Multer and parses them with SheetJS (`xlsx` library) in-memory.

The existing codebase provides all necessary infrastructure: Prisma for database modeling (UUID PKs, `@@map` convention), class-validator DTOs, global JWT+Roles guards, AuditInterceptor (with documented old-value contract for UPDATE operations), and MinIO in docker-compose. The `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` packages are the standard way to interact with MinIO since it is S3-compatible.

**Primary recommendation:** Build Vehicle module first (simpler, no encryption), then Customer module (encryption complexity), then fleet import (depends on Vehicle model). Use soft-delete (archived flag) for vehicles, encrypt PESEL + ID number + license number at rest, and implement 3-year retention for customer data per Polish statute of limitations.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Vehicle fields:** registration, VIN, make, model, year, color, fuel type, transmission, seat count, mileage, notes
- **Insurance fields:** company name, policy number, expiry date, coverage type (OC/AC/NNW), optional document scan (PDF/image in MinIO)
- **Inspection fields:** expiry date, optional document scan
- **Optional main photo:** One thumbnail per vehicle for identification
- **No daily rate on vehicle:** Pricing set at contract time (Phase 4)
- **Vehicle statuses:** Available, Reserved, Rented, Service, Retired
- **Phase 2 status scope:** Define enum + manual transitions (Service, Retired). Automatic transitions wired in Phase 3.
- **Fleet import:** CSV/XLS upload, system-defined template, skip bad rows with error report, downloadable template
- **Customer PII:** encrypt(), decrypt(), hmacIndex() from existing field-encryption.ts
- **Search:** Full exact match only (no partial/autocomplete). HMAC for encrypted fields, plaintext for unencrypted.
- **No document image capture:** Capture structured text fields only (RODO data minimization)
- **API-only:** No admin panel UI (Phase 5)

### Claude's Discretion
- Soft-delete vs hard-delete strategy for vehicles
- Exact encrypted field set (based on RODO research)
- RODO retention period and implementation approach
- Import upsert vs insert-only behavior
- Prisma schema design for Vehicle and Customer models
- MinIO bucket structure for vehicle documents/photos

### Deferred Ideas (OUT OF SCOPE)
- Insurance/inspection expiry alerts with notifications (Phase 7-8)
- Cross-entity search (vehicle<->customer via rentals) (Phase 3)
- Fleet import UI in admin dashboard (Phase 5)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FLEET-01 | Admin can add/edit/remove vehicles (registration, VIN, make/model, mileage, insurance, inspection) | Vehicle Prisma model, VehicleModule CRUD, MinIO document uploads, soft-delete pattern |
| FLEET-02 | Vehicle status updates automatically based on rental lifecycle | VehicleStatus enum defined in Phase 2; automatic transitions wired in Phase 3 per CONTEXT.md |
| FLEET-03 | Admin can import fleet from CSV/XLS file | SheetJS (xlsx) in-memory parsing, Multer FileInterceptor, error report pattern |
| CUST-01 | Employee can create customer record with all personal data | Customer Prisma model, CustomerModule CRUD, class-validator DTOs with PESEL validation |
| CUST-02 | Sensitive fields encrypted at rest (AES-256-GCM) searchable via HMAC | Existing field-encryption.ts, encrypted column pattern in Prisma, HMAC index columns |
| CUST-03 | Employee can search customer by name, phone, or PESEL | HMAC lookup for PESEL, plaintext ilike for name, exact match for phone |
| CUST-04 | RODO-compliant retention policies (auto-delete after retention period) | 3-year retention per Polish statute of limitations, soft-delete + scheduled cleanup |

</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @nestjs/core | 11.1.17 | Application framework | Already in use |
| @prisma/client | 7.5.0 | Database ORM | Already in use |
| class-validator | 0.15.1 | DTO validation | Already in use |
| class-transformer | 0.5.x | DTO transformation | Already in use |
| zod | 4.3.6 | Shared validation schemas | Already in use in packages/shared |

### New Dependencies
| Library | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| @aws-sdk/client-s3 | 3.1014.0 | S3/MinIO operations (putObject, getObject, deleteObject) | Official AWS SDK v3, works with MinIO via endpoint override, tree-shakable |
| @aws-sdk/s3-request-presigner | 3.1014.0 | Generate presigned upload/download URLs | Companion to client-s3, required for presigned URL pattern |
| xlsx | 0.18.5 | Parse CSV and XLS/XLSX files in-memory | SheetJS is the de facto standard for spreadsheet parsing in Node.js, has official NestJS demo |
| multer | 2.1.1 | File upload handling (already bundled with @nestjs/platform-express) | Built into NestJS platform-express, no additional install needed |
| @types/multer | 2.1.0 | TypeScript types for multer | Dev dependency for type safety |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @aws-sdk/client-s3 | minio (npm) | minio package is MinIO-specific; aws-sdk works with MinIO AND S3, more portable |
| xlsx (SheetJS) | papaparse + node-xlsx | SheetJS handles both CSV and XLS/XLSX in one library, fewer dependencies |
| Multer memory storage | Multer disk storage | Memory storage avoids temp file cleanup; fleet CSV/XLS files are small (<1MB) |

**Installation:**
```bash
cd apps/api && pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner xlsx && pnpm add -D @types/multer
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── vehicles/
│   ├── vehicles.module.ts
│   ├── vehicles.controller.ts
│   ├── vehicles.service.ts
│   ├── dto/
│   │   ├── create-vehicle.dto.ts
│   │   ├── update-vehicle.dto.ts
│   │   └── import-vehicle.dto.ts
│   └── vehicles.constants.ts          # Status enum, fuel types, etc.
├── customers/
│   ├── customers.module.ts
│   ├── customers.controller.ts
│   ├── customers.service.ts
│   ├── dto/
│   │   ├── create-customer.dto.ts
│   │   ├── update-customer.dto.ts
│   │   └── search-customer.dto.ts
│   └── customers.constants.ts
├── storage/
│   ├── storage.module.ts
│   └── storage.service.ts             # S3/MinIO wrapper, presigned URLs
├── common/
│   └── crypto/
│       └── field-encryption.ts         # (existing) encrypt, decrypt, hmacIndex
packages/shared/src/
├── types/
│   ├── vehicle.types.ts
│   └── customer.types.ts
├── schemas/
│   ├── vehicle.schemas.ts
│   └── customer.schemas.ts
```

### Pattern 1: Encrypted Field Storage in Prisma

**What:** Store encrypted PII as JSON columns (ciphertext + iv + tag) with a companion HMAC index column for searchable fields. Encryption/decryption happens in the service layer, never in controllers or Prisma middleware.

**When to use:** For every sensitive customer field (PESEL, ID number, license number).

**Example:**
```typescript
// Prisma schema pattern for encrypted fields
model Customer {
  id              String   @id @default(uuid())
  firstName       String
  lastName        String
  phone           String
  email           String?
  address         String?

  // Encrypted fields stored as JSON (ciphertext, iv, tag)
  peselEncrypted      Json      // EncryptedValue from field-encryption.ts
  peselHmac           String    // HMAC index for exact-match search
  idNumberEncrypted   Json
  idNumberHmac        String
  licenseNumEncrypted Json
  licenseNumHmac      String

  // Non-sensitive license metadata (stored plaintext)
  idIssuedBy      String?
  idIssuedDate    DateTime?
  licenseCategory String?
  licenseIssuedBy String?

  // Retention
  retentionExpiresAt DateTime?   // Set to lastRentalEnd + 3 years
  isArchived         Boolean     @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([peselHmac])
  @@index([lastName, firstName])
  @@index([phone])
  @@map("customers")
}

// Service layer encryption
import { encrypt, decrypt, hmacIndex } from '../common/crypto/field-encryption';

async createCustomer(dto: CreateCustomerDto) {
  return this.prisma.customer.create({
    data: {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      peselEncrypted: encrypt(dto.pesel),
      peselHmac: hmacIndex(dto.pesel),
      idNumberEncrypted: encrypt(dto.idNumber),
      idNumberHmac: hmacIndex(dto.idNumber),
      licenseNumEncrypted: encrypt(dto.licenseNumber),
      licenseNumHmac: hmacIndex(dto.licenseNumber),
      idIssuedBy: dto.idIssuedBy,
      idIssuedDate: dto.idIssuedDate,
      licenseCategory: dto.licenseCategory,
      licenseIssuedBy: dto.licenseIssuedBy,
    },
  });
}

// HMAC-based search for encrypted fields
async findByPesel(pesel: string) {
  const hmac = hmacIndex(pesel);
  return this.prisma.customer.findFirst({
    where: { peselHmac: hmac, isArchived: false },
  });
}
```

### Pattern 2: Audit-Aware UPDATE Operations

**What:** For UPDATE operations, the controller attaches `__audit` metadata with old and new values. This fulfills the old-value contract documented in AuditInterceptor.

**When to use:** Every update endpoint in Vehicle and Customer controllers.

**Example:**
```typescript
// In VehiclesController
@Patch(':id')
@Roles(UserRole.ADMIN)
async update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
  const { oldValues, vehicle } = await this.vehiclesService.update(id, dto);
  return {
    ...vehicle,
    __audit: {
      action: 'vehicle.update',
      entityType: 'Vehicle',
      entityId: id,
      changes: oldValues, // { field: { old: X, new: Y } }
    },
  };
}

// In VehiclesService
async update(id: string, dto: UpdateVehicleDto) {
  const existing = await this.prisma.vehicle.findUniqueOrThrow({ where: { id } });

  // Build changes diff
  const oldValues: Record<string, { old: any; new: any }> = {};
  for (const [key, newVal] of Object.entries(dto)) {
    if (existing[key] !== newVal) {
      oldValues[key] = { old: existing[key], new: newVal };
    }
  }

  const vehicle = await this.prisma.vehicle.update({
    where: { id },
    data: dto,
  });

  return { oldValues, vehicle };
}
```

### Pattern 3: StorageService Wrapper for MinIO/S3

**What:** A shared NestJS module wrapping `@aws-sdk/client-s3` that provides `upload()`, `getPresignedUrl()`, and `delete()` methods. Configured via environment variables for MinIO in dev and S3 in production.

**When to use:** Vehicle document uploads (insurance, inspection, photos), and later for rental photos (Phase 7).

**Example:**
```typescript
// storage.service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private client: S3Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.bucket = config.get('S3_BUCKET', 'rentapp');
    this.client = new S3Client({
      endpoint: config.get('S3_ENDPOINT', 'http://localhost:9000'),
      region: config.get('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: config.get('S3_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
    return key;
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }
}
```

### Pattern 4: Fleet Import with Error Reporting

**What:** Accept a file upload (CSV or XLS/XLSX) via Multer FileInterceptor, parse in-memory with SheetJS, validate each row, skip invalid rows, and return a structured import report.

**When to use:** FLEET-03 import endpoint.

**Example:**
```typescript
import * as XLSX from 'xlsx';

@Post('import')
@Roles(UserRole.ADMIN)
@UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
async importFleet(@UploadedFile() file: Express.Multer.File) {
  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  const results = { imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    try {
      const dto = await this.validateRow(rows[i], i + 2); // +2 for header + 0-index
      await this.vehiclesService.createFromImport(dto);
      results.imported++;
    } catch (error) {
      results.skipped++;
      results.errors.push({ row: i + 2, reason: error.message });
    }
  }

  return results;
}
```

### Anti-Patterns to Avoid
- **Encrypting in Prisma middleware:** Prisma middleware runs on every query. Encryption should be explicit in the service layer, not hidden in middleware, to avoid accidental double-encryption or performance issues.
- **Storing encrypted values as strings:** The `encrypt()` function returns `{ ciphertext, iv, tag }`. Store as Prisma `Json` type, not as concatenated string. This preserves structure and avoids parsing bugs.
- **Decrypting all fields on every query:** Only decrypt when returning data to the client. Internal queries (existence checks, counts) should use HMAC indices, never decrypt.
- **Putting file upload logic in controllers:** The controller handles the HTTP layer (FileInterceptor, UploadedFile). Parsing and validation belong in the service.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV/XLS parsing | Custom CSV parser | SheetJS (`xlsx`) | Edge cases: encoding, date formats, escaped commas, XLS binary format |
| S3/MinIO client | Custom HTTP calls to MinIO | `@aws-sdk/client-s3` | Presigned URLs, multipart upload, error handling, retry logic |
| PESEL validation | Regex-only check | Custom checksum validator (11-digit weighted checksum) | PESEL has a specific checksum algorithm; regex catches format but not validity |
| Field encryption | Custom encryption wrapper | Existing `field-encryption.ts` | Already built, tested, uses AES-256-GCM correctly |
| File upload handling | Custom multipart parser | Multer via `@nestjs/platform-express` | Built into NestJS, handles memory storage, size limits, mime types |
| VIN validation | Nothing | 17-char regex + checksum (ISO 3779) | VINs have a standard format; basic validation prevents data entry errors |

**Key insight:** The encryption utility already exists and is correct. The main complexity is in the Prisma schema design (JSON columns for encrypted values + String columns for HMAC indices) and the service layer that wraps encrypt/decrypt calls.

## Common Pitfalls

### Pitfall 1: Forgetting `forcePathStyle: true` for MinIO
**What goes wrong:** AWS SDK v3 defaults to virtual-hosted-style URLs (`bucket.endpoint`). MinIO requires path-style (`endpoint/bucket`). Without `forcePathStyle: true`, all S3 operations fail with DNS resolution errors.
**How to avoid:** Always set `forcePathStyle: true` in S3Client config when using MinIO.
**Warning signs:** `ENOTFOUND rentapp.localhost` errors.

### Pitfall 2: HMAC Key Reuse with Encryption Key
**What goes wrong:** The existing `hmacIndex()` function uses the same key as encryption. This is not ideal cryptographically but is acceptable for this use case. The real pitfall is forgetting to call `hmacIndex()` at both write time AND search time with the same normalized input.
**How to avoid:** Always normalize input before HMAC (trim whitespace, consistent casing for non-case-sensitive fields). For PESEL, strip any dashes or spaces before both storage and search.
**Warning signs:** Search returns no results for a customer you just created.

### Pitfall 3: Prisma Json Type and TypeScript
**What goes wrong:** Prisma's `Json` type maps to `Prisma.JsonValue` (essentially `any`). TypeScript cannot enforce the `EncryptedValue` shape at the Prisma layer.
**How to avoid:** Cast explicitly in the service layer: `const encrypted = encrypt(value) as unknown as Prisma.InputJsonValue`. When reading, cast back: `decrypt(record.peselEncrypted as unknown as EncryptedValue)`. Consider a helper function to encapsulate this.
**Warning signs:** Runtime errors about missing `ciphertext`, `iv`, or `tag` properties.

### Pitfall 4: SheetJS Column Name Mapping
**What goes wrong:** SheetJS uses the first row as column names. If the user renames a column in their spreadsheet (e.g., "Rejestracja" instead of "registration"), the import breaks silently with undefined values.
**How to avoid:** Define a strict column mapping. Accept both Polish and English column names. Validate that required columns exist before processing rows.
**Warning signs:** All imported vehicles have null registration numbers.

### Pitfall 5: Vehicle Soft-Delete Leaking Archived Records
**What goes wrong:** Queries return archived (soft-deleted) vehicles in search results, available vehicle lists, or rental creation dropdowns.
**How to avoid:** Add `isArchived: false` as a default filter on all vehicle queries. Consider a Prisma middleware or a base `findMany` wrapper that always includes this filter. Explicitly opt-in to including archived records (e.g., for admin "view archived" endpoint).
**Warning signs:** Deleted vehicles still appear in vehicle lists.

### Pitfall 6: Audit Trail Logging Encrypted Values
**What goes wrong:** The AuditInterceptor logs `request.body` which contains plaintext PESEL, ID number, etc. The audit log then contains unencrypted PII, defeating the purpose of field-level encryption.
**How to avoid:** Strip or mask sensitive fields from audit log changes. In the `__audit` metadata, replace sensitive values with `"[ENCRYPTED]"` or log only the HMAC. Define a list of sensitive field names that should be masked in audit output.
**Warning signs:** Running `SELECT * FROM audit_logs` shows plaintext PESEL values.

## Code Examples

### PESEL Validation (Checksum Algorithm)
```typescript
// Source: https://en.wikipedia.org/wiki/PESEL
export function isValidPesel(pesel: string): boolean {
  if (!/^\d{11}$/.test(pesel)) return false;

  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const digits = pesel.split('').map(Number);

  const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0);
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === digits[10];
}
```

### VIN Validation (Basic Format)
```typescript
// ISO 3779: 17 characters, no I/O/Q
export function isValidVin(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}
```

### Vehicle Prisma Model
```prisma
enum VehicleStatus {
  AVAILABLE
  RESERVED
  RENTED
  SERVICE
  RETIRED
}

enum FuelType {
  PETROL
  DIESEL
  LPG
  HYBRID
  ELECTRIC
}

enum TransmissionType {
  MANUAL
  AUTOMATIC
}

enum InsuranceCoverageType {
  OC
  AC
  NNW
}

model Vehicle {
  id              String          @id @default(uuid())
  registration    String          @unique
  vin             String          @unique
  make            String
  model           String
  year            Int
  color           String?
  fuelType        FuelType
  transmission    TransmissionType
  seatCount       Int             @default(5)
  mileage         Int             @default(0)
  notes           String?
  status          VehicleStatus   @default(AVAILABLE)
  photoKey        String?         // MinIO object key for main thumbnail
  isArchived      Boolean         @default(false)

  insurance       VehicleInsurance?
  inspection      VehicleInspection?
  documents       VehicleDocument[]

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([status])
  @@index([make, model])
  @@map("vehicles")
}

model VehicleInsurance {
  id            String                @id @default(uuid())
  vehicleId     String                @unique
  companyName   String
  policyNumber  String
  expiryDate    DateTime
  coverageType  InsuranceCoverageType
  documentKey   String?               // MinIO object key

  vehicle       Vehicle               @relation(fields: [vehicleId], references: [id])

  @@map("vehicle_insurance")
}

model VehicleInspection {
  id            String    @id @default(uuid())
  vehicleId     String    @unique
  expiryDate    DateTime
  documentKey   String?   // MinIO object key

  vehicle       Vehicle   @relation(fields: [vehicleId], references: [id])

  @@map("vehicle_inspections")
}

model VehicleDocument {
  id            String    @id @default(uuid())
  vehicleId     String
  label         String    // "insurance_policy", "inspection_cert", "registration_card"
  fileKey       String    // MinIO object key
  fileName      String    // Original filename
  mimeType      String
  uploadedAt    DateTime  @default(now())

  vehicle       Vehicle   @relation(fields: [vehicleId], references: [id])

  @@index([vehicleId])
  @@map("vehicle_documents")
}
```

### MinIO Bucket Structure
```
rentapp/                          # Single bucket
├── vehicles/
│   ├── {vehicleId}/
│   │   ├── photo.jpg             # Main vehicle thumbnail
│   │   └── documents/
│   │       ├── insurance-{uuid}.pdf
│   │       ├── inspection-{uuid}.pdf
│   │       └── registration-{uuid}.pdf
```

### Fleet Import CSV Template
```csv
registration,vin,make,model,year,color,fuelType,transmission,seatCount,mileage,insuranceCompany,insurancePolicyNumber,insuranceExpiry,insuranceCoverage,inspectionExpiry,notes
WE12345,WVWZZZ3CZWE123456,Volkswagen,Golf,2022,Silver,PETROL,MANUAL,5,45000,PZU,ABC123456,2026-12-31,OC,2026-06-15,Fleet car
```

## Discretion Recommendations

### Soft-Delete for Vehicles (RECOMMENDED)
Use an `isArchived` boolean flag. Reasons:
- Vehicles may be referenced by historical rentals (Phase 3). Hard-delete would break referential integrity.
- Admin may want to view retired vehicles for reporting.
- Simple to implement: add `isArchived: false` default filter.
- Archive endpoint: `PATCH /vehicles/:id/archive` sets `isArchived: true` and `status: RETIRED`.

### Encrypted Field Set (RECOMMENDED)
Based on RODO/PITFALLS.md research and UODO enforcement patterns, encrypt these fields:
1. **PESEL** - permanent national identifier, cannot be changed if leaked. HIGH risk.
2. **ID number (nr dowodu osobistego)** - identity document number. HIGH risk.
3. **License number (nr prawa jazdy)** - driver's license number. HIGH risk.

Do NOT encrypt: name, phone, email, address. These are needed for plaintext search (CUST-03) and are standard business contact data with lower breach impact. This matches the CONTEXT.md guidance ("minimum set that satisfies special category requirements").

### RODO Retention Period (RECOMMENDED: 3 years + 6 months buffer)
- Polish statute of limitations for business contract claims: 3 years (Art. 118 Kodeks cywilny).
- Add 6-month buffer for claims filed near the deadline.
- `retentionExpiresAt` = last rental return date + 3.5 years.
- Implementation: scheduled job (cron or BullMQ repeatable) runs daily, finds expired customers, hard-deletes their data (not just archive -- RODO "right to erasure" requires actual deletion).
- Customers with active rentals never expire regardless of date.
- Phase 2 scope: store `retentionExpiresAt`, implement the cleanup job. Do NOT implement "right to erasure" on-demand endpoint yet (can be Phase 9 polish).

### Import Behavior (RECOMMENDED: Insert-only with duplicate detection)
- Default: insert-only. If registration already exists, skip the row and report it as duplicate.
- Reason: upsert is dangerous for imports -- an accidental re-import could overwrite manually edited vehicle data.
- The error report will show "Row 5: duplicate registration WE12345 (skipped)".
- Admin can manually edit individual vehicles if import data needs correction.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AWS SDK v2 (monolithic) | AWS SDK v3 (modular) | 2021+ | Tree-shaking, smaller bundles, better TypeScript |
| Custom CSV parsers | SheetJS (xlsx) | Stable | Handles CSV + XLS + XLSX in one library |
| pgcrypto (DB-level encryption) | Application-level AES-256-GCM | Current best practice | App-level protects against SQL injection and DB admin access |
| Prisma middleware for soft-delete | Explicit service-layer filtering | Prisma 5+ | Middleware approach has footguns with relations; explicit filtering is safer |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x (unit) + Supertest 7.x (e2e) |
| Config file | `apps/api/test/jest-e2e.json` (e2e), default jest config (unit) |
| Quick run command | `cd apps/api && pnpm test -- --testPathPattern=vehicles` |
| Full suite command | `cd apps/api && pnpm test && pnpm test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLEET-01 | Vehicle CRUD (create, read, update, archive) | e2e | `cd apps/api && pnpm test:e2e -- --testPathPattern=vehicles` | No - Wave 0 |
| FLEET-02 | Vehicle status enum + manual transitions | unit | `cd apps/api && pnpm test -- --testPathPattern=vehicles.service` | No - Wave 0 |
| FLEET-03 | Fleet CSV/XLS import with error report | e2e | `cd apps/api && pnpm test:e2e -- --testPathPattern=vehicles` | No - Wave 0 |
| CUST-01 | Customer CRUD with all fields | e2e | `cd apps/api && pnpm test:e2e -- --testPathPattern=customers` | No - Wave 0 |
| CUST-02 | Encrypted fields stored correctly, HMAC indices work | unit | `cd apps/api && pnpm test -- --testPathPattern=customers.service` | No - Wave 0 |
| CUST-03 | Search by name, phone, PESEL (HMAC) | e2e | `cd apps/api && pnpm test:e2e -- --testPathPattern=customers` | No - Wave 0 |
| CUST-04 | Retention expiry date set, cleanup job works | unit | `cd apps/api && pnpm test -- --testPathPattern=retention` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && pnpm test -- --testPathPattern="vehicles|customers"`
- **Per wave merge:** `cd apps/api && pnpm test && pnpm test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/test/vehicles.e2e-spec.ts` -- covers FLEET-01, FLEET-02, FLEET-03
- [ ] `apps/api/src/vehicles/vehicles.service.spec.ts` -- covers FLEET-01 unit, FLEET-02 status transitions
- [ ] `apps/api/test/customers.e2e-spec.ts` -- covers CUST-01, CUST-02, CUST-03
- [ ] `apps/api/src/customers/customers.service.spec.ts` -- covers CUST-02 encryption, CUST-03 HMAC search
- [ ] Framework install: none needed (Jest + Supertest already configured)
- [ ] PESEL validation utility test: `apps/api/src/common/validators/pesel.validator.spec.ts`

## Open Questions

1. **MinIO bucket auto-creation**
   - What we know: MinIO is running in docker-compose but no buckets are pre-created.
   - What's unclear: Whether to create buckets on app startup or via a seed script.
   - Recommendation: Create bucket in StorageModule `onModuleInit()` using `CreateBucketCommand` with `BucketAlreadyOwnedByYou` error handling. Simple and automatic.

2. **File size limits for document uploads**
   - What we know: Insurance/inspection documents are PDF or image files.
   - What's unclear: Maximum acceptable file size.
   - Recommendation: 10MB per file (generous for scanned documents). Configure in Multer `limits: { fileSize: 10 * 1024 * 1024 }`.

3. **Customer deduplication beyond import**
   - What we know: Import uses registration for vehicle dedup.
   - What's unclear: Should customer creation check for existing customer by PESEL?
   - Recommendation: Yes -- check PESEL HMAC on create. If exists, return existing customer (idempotent). This prevents duplicate customer records from field employees.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `apps/api/src/common/crypto/field-encryption.ts` -- verified encrypt/decrypt/hmacIndex implementation
- Existing codebase: `apps/api/prisma/schema.prisma` -- verified current schema patterns
- Existing codebase: `apps/api/src/audit/audit.interceptor.ts` -- verified old-value contract documentation
- `.planning/research/PITFALLS.md` -- RODO encryption requirements, data minimization
- [SheetJS NestJS demo](https://docs.sheetjs.com/docs/demos/net/server/nestjs/) -- official integration guide
- [PESEL checksum algorithm](https://en.wikipedia.org/wiki/PESEL) -- validation algorithm
- npm registry: verified versions for @aws-sdk/client-s3 (3.1014.0), xlsx (0.18.5), multer (2.1.1)

### Secondary (MEDIUM confidence)
- [Polish statute of limitations (Art. 118 KC)](https://sip.lex.pl/akty-prawne/dzu-dziennik-ustaw/kodeks-cywilny-16785996/art-677) -- 3-year period for business/rental claims
- [NestJS MinIO integration patterns](https://dev.to/manuchehr/minio-integration-with-nestjs-file-upload-retrieve-f41) -- S3 compatibility, forcePathStyle requirement
- [RODO data protection overview (iclg.com)](https://iclg.com/practice-areas/data-protection-laws-and-regulations/poland) -- retention obligations

### Tertiary (LOW confidence)
- 3.5-year retention buffer: conservative estimate, not legally prescribed. A data protection lawyer should validate the exact period for the business.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified against npm registry, existing codebase patterns followed
- Architecture: HIGH -- extends established NestJS module pattern from Phase 1, encryption utility already built
- Pitfalls: HIGH -- drawn from PITFALLS.md research + practical MinIO/Prisma experience
- RODO retention: MEDIUM -- 3-year base is well-sourced (Polish civil code), buffer period is conservative estimate

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable domain, no fast-moving dependencies)
