# Phase 33: Foundation -- Schema & Simple Fields - Research

**Researched:** 2026-04-12
**Domain:** Prisma schema migration, NestJS DTOs, Zod shared schemas, React Native mobile forms, Next.js web admin CRUD
**Confidence:** HIGH

## Summary

Phase 33 adds structured customer address fields, per-rental company/NIP/VAT data, a VehicleClass CRUD entity, and an optional insurance case number on rentals. No new libraries are needed -- the entire phase uses the existing stack (Prisma, NestJS class-validator, Zod shared schemas, react-hook-form, shadcn/ui).

The main technical concerns are: (1) a multi-step Prisma migration that replaces the old `address` string with structured fields, creates the `VehicleClass` table, backfills existing vehicles, and adds new Rental columns; (2) NIP checksum validation (mod-11 with weights `[6,5,7,2,3,4,5,6,7]`) implemented in both shared Zod schema and API class-validator; (3) extending the mobile wizard's existing zustand draft store and two wizard steps with new conditional fields.

**Primary recommendation:** Implement in bottom-up order: Prisma schema + migration first, then shared Zod schemas + API DTOs/endpoints, then mobile wizard forms, then web admin pages. The VehicleClass CRUD is the most self-contained piece and can be done in parallel with the rental/customer field additions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Customer address: split `address: String?` into structured fields (`street`, `houseNumber`, `apartmentNumber`, `postalCode`, `city`) on Customer model. Remove old `address` column. All nullable initially.
- Company/NIP/VAT is per-RENTAL: `isCompanyRental: Boolean @default(false)`, `companyNip: String?`, `vatPayerStatus: VatPayerStatus?` (enum: FULL_100, HALF_50, NONE). Only NIP required when company; no company name stored.
- VehicleClass: new model with `id`, `name` (unique), `createdAt`, `updatedAt`. Vehicle gets `vehicleClassId`. Admin CRUD on `/klasy` page. Simple name-only, no description/color.
- Migration strategy: create VehicleClass table, add nullable `vehicleClassId` to Vehicle, backfill with "Nieokreslona" default, then make required.
- Insurance case number: `insuranceCaseNumber: String?` on Rental. Checkbox "Najem ubezpieczeniowy?" on vehicle step. Filter/search on web.
- Company/NIP/VAT fields on dates step of mobile wizard.
- Insurance case number on vehicle step of mobile wizard.
- Address fields in customer creation/edit form on mobile.
- NIP stored as plain String (not encrypted PII).

### Claude's Discretion
- Exact form layout and field ordering within existing wizard steps
- NIP checksum validation algorithm implementation
- VehicleClass seed data (initial class names)
- Postal code validation format (XX-XXX)

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| KLIENT-01 | Worker can mark customer as company + enter NIP | Per-rental `isCompanyRental` + `companyNip` fields on Rental model; conditional form section on dates step |
| KLIENT-02 | System validates NIP format (10 digits, checksum) | NIP mod-11 validation in shared Zod + API class-validator (weights: 6,5,7,2,3,4,5,6,7) |
| KLIENT-03 | Worker can set VAT payer status (100%/50%/nie) | `VatPayerStatus` enum (FULL_100, HALF_50, NONE) on Rental; dropdown in dates step |
| KLIENT-04 | Worker can enter structured address in mobile | Replace `address: String?` with `street`, `houseNumber`, `apartmentNumber`, `postalCode`, `city` on Customer; update customer form modal |
| FLOTA-01 | Admin defines vehicle classes in web panel | New `VehicleClass` model + `/klasy` CRUD page with shadcn/ui |
| FLOTA-02 | Admin assigns class to vehicle | `vehicleClassId` on Vehicle; dropdown in vehicle create/edit forms |
| FLOTA-03 | Class visible in vehicle list + rental details | Add class column to vehicle list table; include in vehicle/rental DTOs |
| NAJEM-01 | Worker enters optional insurance case number | `insuranceCaseNumber: String?` on Rental; checkbox + field on vehicle wizard step |
</phase_requirements>

## Standard Stack

### Core (already in project -- no new installs)
| Library | Purpose | Location |
|---------|---------|----------|
| Prisma | DB schema + migrations | `apps/api/prisma/schema.prisma` |
| class-validator + class-transformer | API DTO validation (NestJS) | `apps/api/src/*/dto/*.ts` |
| zod | Shared schema validation | `packages/shared/src/schemas/*.ts` |
| react-hook-form + @hookform/resolvers | Mobile form state | `apps/mobile/app/(tabs)/new-rental/*.tsx` |
| zustand + AsyncStorage | Mobile wizard draft persistence | `apps/mobile/src/stores/rental-draft.store.ts` |
| @tanstack/react-query | Web data fetching + mutations | `apps/web/src/hooks/queries/*.ts` |
| shadcn/ui (Dialog, Select, Input, Table) | Web admin UI components | `apps/web/src/components/ui/*` |

### No new libraries needed
CONTEXT.md and STACK.md confirm no new dependencies for Phase 33.

## Architecture Patterns

### Prisma Schema Changes

Three areas of schema change in a single migration:

```prisma
// 1. New enum for VAT status
enum VatPayerStatus {
  FULL_100
  HALF_50
  NONE
}

// 2. New VehicleClass model
model VehicleClass {
  id        String   @id @default(uuid())
  name      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  vehicles  Vehicle[]
  @@map("vehicle_classes")
}

// 3. Customer: remove address, add structured fields
// (in Customer model)
// REMOVE: address String?
// ADD:
//   street           String?
//   houseNumber      String?
//   apartmentNumber  String?
//   postalCode       String?
//   city             String?

// 4. Vehicle: add vehicleClassId
// (in Vehicle model)
//   vehicleClassId   String
//   vehicleClass     VehicleClass @relation(fields: [vehicleClassId], references: [id])

// 5. Rental: add company/NIP/VAT + insurance case number
// (in Rental model)
//   isCompanyRental      Boolean          @default(false)
//   companyNip           String?
//   vatPayerStatus       VatPayerStatus?
//   insuranceCaseNumber  String?
```

### Migration Strategy (multi-step within one migration)

The migration SQL must:
1. Create `vehicle_classes` table
2. Insert default "Nieokreslona" class
3. Add nullable `vehicleClassId` to `vehicles`
4. UPDATE all vehicles SET `vehicleClassId` = (default class id)
5. ALTER `vehicleClassId` to NOT NULL
6. Add FK constraint
7. Drop `address` from `customers`, add 5 new nullable columns
8. Add 4 new columns to `rentals` (isCompanyRental, companyNip, vatPayerStatus, insuranceCaseNumber)
9. Create `VatPayerStatus` enum

Use `prisma migrate dev --create-only` then hand-edit the SQL to include the backfill step before the NOT NULL constraint.

### Shared Zod Schemas Pattern

Follow existing pattern in `packages/shared/src/schemas/`:

```typescript
// In customer.schemas.ts -- replace address with structured fields
export const CreateCustomerSchema = z.object({
  // ... existing fields ...
  // REMOVE: address: z.string().max(500).nullable().optional(),
  // ADD:
  street: z.string().max(200).nullable().optional(),
  houseNumber: z.string().max(20).nullable().optional(),
  apartmentNumber: z.string().max(20).nullable().optional(),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Format: XX-XXX').nullable().optional(),
  city: z.string().max(100).nullable().optional(),
});

// In rental.schemas.ts -- add to CreateRentalSchema
export const CreateRentalSchema = z.object({
  // ... existing fields ...
  isCompanyRental: z.boolean().default(false),
  companyNip: z.string().length(10).regex(/^\d{10}$/).nullable().optional(),
  vatPayerStatus: z.enum(['FULL_100', 'HALF_50', 'NONE']).nullable().optional(),
  insuranceCaseNumber: z.string().max(100).nullable().optional(),
}).refine(
  (data) => !data.isCompanyRental || (data.companyNip && data.companyNip.length === 10),
  { message: 'NIP is required for company rentals', path: ['companyNip'] }
);
```

### API DTO Pattern (NestJS class-validator)

Follow existing `CreateRentalDto` pattern with decorators. NIP validator follows the same custom validator pattern as `pesel.validator.ts`:

```typescript
// nip.validator.ts -- same structure as pesel.validator.ts
const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

export function isValidNip(nip: string): boolean {
  if (!/^\d{10}$/.test(nip)) return false;
  const digits = nip.split('').map(Number);
  const sum = NIP_WEIGHTS.reduce((acc, w, i) => acc + w * digits[i], 0);
  return sum % 11 === digits[9]; // remainder 10 means invalid (no digit matches)
}
```

### Mobile Wizard Store Extension

Add fields to `RentalDraft` interface in `rental-draft.store.ts`:

```typescript
interface RentalDraft {
  // ... existing fields ...
  isCompanyRental: boolean;
  companyNip: string | null;
  vatPayerStatus: string | null; // 'FULL_100' | 'HALF_50' | 'NONE'
  insuranceCaseNumber: string | null;
  isInsuranceRental: boolean;
}
```

### Mobile Wizard Form Integration Points

**Customer step (index.tsx):** Add 5 structured address fields to the "Nowy klient" modal form. Fields go after the existing personal data fields. Use `AppInput` component. Postal code field gets `keyboardType="numeric"` and `maxLength={6}` (with dash).

**Dates step (dates.tsx):** Add a conditional section below the pricing summary:
- Switch/checkbox "Wynajem na firme"
- When ON: NIP input (keyboardType="numeric", maxLength=10) + VAT dropdown (Picker or custom select)
- Extend the existing `DatesSchema` with conditional company fields

**Vehicle step (vehicle.tsx):** After vehicle selection (before navigating to dates), show:
- Switch "Najem ubezpieczeniowy?"
- When ON: insurance case number text input
- Store in draft, then navigate

### Web Admin VehicleClass CRUD Page

New page at `apps/web/src/app/(admin)/klasy/page.tsx` following existing admin page patterns:
- Simple table with name column + action column (edit, delete)
- Dialog for create/edit (single "Nazwa" input)
- Delete with confirmation dialog
- Uses `@tanstack/react-query` mutations pattern from `use-vehicles.ts`
- New `use-vehicle-classes.ts` hooks file

### Web Vehicle Form Enhancement

Add `vehicleClassId` dropdown to `apps/web/src/app/(admin)/pojazdy/nowy/page.tsx` and edit page:
- shadcn `Select` component (same as fuelType/transmission dropdowns)
- Fetch vehicle classes via new query hook
- Add to `CreateVehicleSchema` and `UpdateVehicleSchema`

### Web Vehicle List Enhancement

Add "Klasa" column to vehicle list table columns definition in `apps/web/src/app/(admin)/pojazdy/columns.tsx`.

### API Endpoints for VehicleClass

New NestJS module `vehicle-classes` with standard CRUD:
- `GET /vehicle-classes` -- list all
- `POST /vehicle-classes` -- create (name)
- `PATCH /vehicle-classes/:id` -- update (name)
- `DELETE /vehicle-classes/:id` -- delete (fail if vehicles assigned)

### Rental Details Display

Both mobile and web rental detail views need to show:
- Company NIP + VAT status (if isCompanyRental)
- Insurance case number (if present)
- Vehicle class name

### Web Rental Filtering

Add filter options to web rental list:
- Has insurance case number (yes/no toggle)
- Search by insurance case number

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| NIP checksum validation | String regex only | Mod-11 weighted checksum (weights 6,5,7,2,3,4,5,6,7) | Regex alone accepts invalid NIPs; checksum catches 90%+ of typos |
| Form conditional visibility | Manual show/hide state | react-hook-form `watch()` + conditional render | Already used pattern; keeps form state consistent |
| Polish postal code format | Free text | Regex `/^\d{2}-\d{3}$/` in Zod | Structured format ensures data quality for PDF generation |
| Migration backfill | Application-level seeding | Inline SQL in migration file | Ensures atomicity; migration won't partially apply |

## Common Pitfalls

### Pitfall 1: Migration ordering -- NOT NULL before backfill
**What goes wrong:** Adding `vehicleClassId` as required before backfilling existing vehicles causes migration failure.
**Why it happens:** Prisma generates ADD COLUMN NOT NULL without a DEFAULT for relation fields.
**How to avoid:** Use `prisma migrate dev --create-only`, then hand-edit migration SQL: add column as nullable, run UPDATE, then ALTER to NOT NULL.
**Warning signs:** Migration fails on `ALTER TABLE ... ADD COLUMN "vehicleClassId" TEXT NOT NULL`.

### Pitfall 2: Forgetting to update the zustand draft store initial state
**What goes wrong:** New fields are undefined in draft, causing form crashes on hydration from AsyncStorage.
**Why it happens:** Existing persisted drafts from before the update lack the new keys.
**How to avoid:** Add all new fields to `initialDraft` with safe defaults (false, null). Zustand's persist middleware merges, but explicit defaults prevent undefined access.
**Warning signs:** `TypeError: Cannot read property of undefined` in wizard steps.

### Pitfall 3: Shared schema divergence from API DTO
**What goes wrong:** Zod schema in shared package accepts data that class-validator DTO rejects (or vice versa).
**Why it happens:** Two validation layers maintained separately.
**How to avoid:** Write shared Zod schema first, then mirror exactly in class-validator DTO. Test both with the same test cases.
**Warning signs:** Mobile form submits successfully but API returns 400.

### Pitfall 4: VehicleClass deletion with assigned vehicles
**What goes wrong:** Admin deletes a class that has vehicles assigned, causing FK violation.
**Why it happens:** No guard on DELETE endpoint.
**How to avoid:** Check vehicle count before deletion; return 409 Conflict if vehicles exist. Alternatively use Prisma's `onDelete: Restrict` (default).
**Warning signs:** 500 error on class deletion.

### Pitfall 5: Company NIP field visible but not validated when toggle is off
**What goes wrong:** Worker enters partial NIP, toggles company off, submits. Later toggles back on and sees stale invalid NIP.
**Why it happens:** Form state persists hidden field values.
**How to avoid:** Clear `companyNip` and `vatPayerStatus` when `isCompanyRental` toggles to false. Use `watch` + `setValue` in react-hook-form.
**Warning signs:** Draft store has NIP data for non-company rentals.

### Pitfall 6: Prisma enum name mismatch with TypeScript enum
**What goes wrong:** `VatPayerStatus` enum values in Prisma don't match the TypeScript enum in shared package.
**Why it happens:** Prisma generates its own enum types; shared package has separate definition.
**How to avoid:** Use identical enum value names in both. Export from shared, import in API. Prisma enum values must match string values exactly: `FULL_100`, `HALF_50`, `NONE`.

## Code Examples

### NIP Validation (shared + API)

```typescript
// packages/shared/src/lib/nip.ts
const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

export function isValidNip(nip: string): boolean {
  if (!/^\d{10}$/.test(nip)) return false;
  const digits = nip.split('').map(Number);
  const sum = NIP_WEIGHTS.reduce((acc, w, i) => acc + w * digits[i], 0);
  const remainder = sum % 11;
  return remainder !== 10 && remainder === digits[9];
}

// Usage in Zod schema:
// companyNip: z.string().refine(isValidNip, { message: 'Nieprawidlowy NIP' })
```

```typescript
// apps/api/src/common/validators/nip.validator.ts
// Same pattern as pesel.validator.ts
import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { isValidNip } from '@rentapp/shared'; // reuse from shared

@ValidatorConstraint({ name: 'isValidNip', async: false })
class IsValidNipConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return typeof value === 'string' && isValidNip(value);
  }
  defaultMessage(): string {
    return 'Invalid NIP number';
  }
}

export function IsValidNip(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor, propertyName,
      options: validationOptions, constraints: [],
      validator: IsValidNipConstraint,
    });
  };
}
```

### Conditional Company Fields in Mobile (dates.tsx pattern)

```typescript
// Inside dates.tsx, extend DatesSchema:
const DatesSchema = z.object({
  dailyRateNet: z.string().min(1).regex(/^\d+([.,]\d{1,2})?$/),
  isCompanyRental: z.boolean().default(false),
  companyNip: z.string().nullable().optional(),
  vatPayerStatus: z.enum(['FULL_100', 'HALF_50', 'NONE']).nullable().optional(),
}).refine(
  (d) => !d.isCompanyRental || (d.companyNip && /^\d{10}$/.test(d.companyNip)),
  { message: 'NIP wymagany', path: ['companyNip'] }
);

// In JSX, after pricing summary:
const isCompany = watch('isCompanyRental');
// ... render Switch + conditional NIP/VAT fields
```

### VehicleClass API Module Structure

```
apps/api/src/vehicle-classes/
  vehicle-classes.module.ts
  vehicle-classes.controller.ts
  vehicle-classes.service.ts
  dto/
    create-vehicle-class.dto.ts
    update-vehicle-class.dto.ts
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single `address` string | Structured fields (street, house, apartment, postal, city) | Phase 33 | Enables PDF template with proper address formatting |
| No company data on rental | Per-rental `isCompanyRental` + NIP + VAT | Phase 33 | Same customer can rent privately or as company |
| No vehicle categorization | VehicleClass model with name | Phase 33 | Foundation for future class-based pricing (v4.0) |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 |
| Config file | `apps/api/jest.config.ts` (default NestJS) |
| Quick run command | `cd apps/api && npx jest --testPathPattern=<pattern> --no-coverage` |
| Full suite command | `cd apps/api && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KLIENT-01 | isCompanyRental + companyNip on rental creation | unit | `cd apps/api && npx jest --testPathPattern=rentals.service.spec -x --no-coverage` | Needs update |
| KLIENT-02 | NIP checksum validation rejects invalid | unit | `cd apps/api && npx jest --testPathPattern=nip.validator.spec -x --no-coverage` | Wave 0 |
| KLIENT-03 | vatPayerStatus saved on rental | unit | `cd apps/api && npx jest --testPathPattern=rentals.service.spec -x --no-coverage` | Needs update |
| KLIENT-04 | Structured address fields on customer create | unit | `cd apps/api && npx jest --testPathPattern=customers.service.spec -x --no-coverage` | Needs update |
| FLOTA-01 | VehicleClass CRUD operations | unit | `cd apps/api && npx jest --testPathPattern=vehicle-classes.service.spec -x --no-coverage` | Wave 0 |
| FLOTA-02 | Vehicle create/update with vehicleClassId | unit | `cd apps/api && npx jest --testPathPattern=vehicles.service.spec -x --no-coverage` | Needs update |
| FLOTA-03 | Vehicle list includes class name | unit | `cd apps/api && npx jest --testPathPattern=vehicles.service.spec -x --no-coverage` | Needs update |
| NAJEM-01 | insuranceCaseNumber saved on rental | unit | `cd apps/api && npx jest --testPathPattern=rentals.service.spec -x --no-coverage` | Needs update |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern=<relevant_spec> -x --no-coverage`
- **Per wave merge:** `cd apps/api && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/common/validators/nip.validator.spec.ts` -- NIP checksum validation unit tests (valid NIPs, invalid checksums, wrong length, non-numeric)
- [ ] `apps/api/src/vehicle-classes/vehicle-classes.service.spec.ts` -- CRUD + delete-with-vehicles guard
- [ ] Update `apps/api/src/rentals/rentals.service.spec.ts` -- add test cases for new rental fields
- [ ] Update `apps/api/src/customers/customers.service.spec.ts` -- add test cases for structured address
- [ ] Update `apps/api/src/vehicles/vehicles.service.spec.ts` -- add test cases for vehicleClassId

## Open Questions

1. **VehicleClass seed data -- what initial classes?**
   - What we know: User wants admin to define classes; "Nieokreslona" is the backfill default
   - What's unclear: Should we seed additional classes (Ekonomiczna, Komfort, SUV, Premium) or just the default?
   - Recommendation: Seed only "Nieokreslona" in migration. Admin creates real classes manually. Examples in CONTEXT suggest names but don't lock them.

2. **Postal code auto-formatting with dash**
   - What we know: Format is XX-XXX (e.g. 00-001)
   - What's unclear: Should the input auto-insert the dash as user types?
   - Recommendation: Auto-insert dash after 2 digits for better UX. Validate with regex `/^\d{2}-\d{3}$/`.

## Sources

### Primary (HIGH confidence)
- Project codebase: `schema.prisma`, `customer.schemas.ts`, `rental.schemas.ts`, `vehicle.schemas.ts`, all wizard step files, all API DTOs, `pesel.validator.ts` as validator pattern reference
- CONTEXT.md: All locked decisions and implementation specifics

### Secondary (MEDIUM confidence)
- [NIP validation algorithm](https://gist.github.com/amadeuszblanik/d76b029b2b16e44e507c555dbc8edaf5) -- TypeScript NIP checksum implementation with weights [6,5,7,2,3,4,5,6,7]
- [NIP Checker tool](https://poland.gg/tools/nip-checker) -- Confirms mod-11 algorithm with same weights

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all patterns established in codebase
- Architecture: HIGH -- follows existing project patterns exactly (DTOs, Zod schemas, wizard steps, admin pages)
- Pitfalls: HIGH -- based on direct code inspection of migration patterns and form state management
- NIP validation: HIGH -- algorithm confirmed by multiple sources, similar to existing PESEL validator

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable -- schema changes, no external dependency risk)
