# Phase 33: Foundation -- Schema & Simple Fields - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

New DB models and fields + mobile/web forms for: customer address (structured), company/NIP/VAT per rental, vehicle classes (admin-defined), and insurance case number. No PDF template changes — those are Phase 34.

</domain>

<decisions>
## Implementation Decisions

### Customer Address
- Split `address: String?` into structured fields: `street`, `houseNumber`, `apartmentNumber`, `postalCode`, `city`
- All address fields go on the Customer model (not Rental)
- Address fields appear in the customer creation/edit form in mobile (alongside name, PESEL, ID, etc.)
- Existing `address` data can be cleared — workers will re-enter addresses manually
- Migration: remove old `address` column, add new structured fields (all nullable initially to support existing customers)

### Company / NIP / VAT
- **Company/NIP/VAT is a per-RENTAL attribute, NOT per-customer** — the same customer may rent privately once and on a company invoice the next time
- New fields on Rental model: `isCompanyRental: Boolean @default(false)`, `companyNip: String?`, `vatPayerStatus: VatPayerStatus?` (enum: FULL_100, HALF_50, NONE)
- When `isCompanyRental` checkbox is toggled ON: show NIP field (validated — 10 digits with checksum) + VAT payer status dropdown
- Only NIP is required — company name is NOT stored (can be looked up from NIP if needed later)
- These fields appear in the mobile wizard at the dates/rental-data step

### Vehicle Classes
- New `VehicleClass` model: `id`, `name` (unique), `createdAt`, `updatedAt`
- Vehicle gets `vehicleClassId` (required) — every vehicle must have a class
- Admin manages classes on a dedicated page `/klasy` in web panel — simple CRUD (name only, no description/color)
- Vehicle add/edit form gets a dropdown to select class
- Class name displayed in vehicle list and rental details
- Migration: create VehicleClass table, add nullable `vehicleClassId` to Vehicle, backfill existing vehicles with a "Nieokreslona" default class, then make column required

### Insurance Case Number
- New field on Rental model: `insuranceCaseNumber: String?` (optional)
- Appears in mobile wizard at the vehicle step — after selecting a car, checkbox "Najem ubezpieczeniowy?" shows the case number field
- Displayed in rental details (mobile + web)
- Admin can filter rentals by: has insurance case number (yes/no) + search by case number
- Used later in Phase 37 for email subject formatting

### Claude's Discretion
- Exact form layout and field ordering within existing wizard steps
- NIP checksum validation algorithm implementation
- VehicleClass seed data (initial class names)
- Postal code validation format (XX-XXX)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database schema
- `apps/api/prisma/schema.prisma` — Current Customer (line 192), Vehicle (line 121), Rental (line 233) models
- `.planning/research/ARCHITECTURE.md` — v3.0 integration map, suggested new models and columns

### Shared validation
- `packages/shared/src/schemas/customer.schemas.ts` — Current CreateCustomerSchema (Zod) — needs address field updates

### Mobile wizard
- `apps/mobile/app/(tabs)/new-rental/index.tsx` — Customer step with react-hook-form + Zod
- `apps/mobile/app/(tabs)/new-rental/dates.tsx` — Dates step (where company/NIP/VAT fields go)
- `apps/mobile/app/(tabs)/new-rental/vehicle.tsx` — Vehicle step (where insurance case number goes)

### Web admin
- `apps/web/src/app/(admin)/pojazdy/vehicles-page.tsx` — Vehicle list (needs class column + dropdown in form)
- `apps/web/src/app/(admin)/klienci/customers-page.tsx` — Customer list (needs structured address)

### Research
- `.planning/research/STACK.md` — No new libraries needed for Phase 33
- `.planning/research/PITFALLS.md` — NIP validation, VehicleClass migration strategy

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AppInput` component: standard text input used throughout mobile forms
- `AppCard` component: card container for list items
- `WizardStepper`: step indicator in mobile rental wizard
- `react-hook-form` + `zodResolver`: form validation pattern in all mobile forms
- `useForm` + `Controller` pattern: consistent across all wizard steps

### Established Patterns
- Prisma schema uses `@@map("table_name")` for all tables
- Encrypted PII: `Json` type + HMAC columns for sensitive data (PESEL, ID, license)
- NIP is NOT sensitive PII — can be stored as plain `String`
- Shared Zod schemas in `packages/shared/src/schemas/` consumed by both API and mobile
- Mobile wizard steps are file-based routes under `app/(tabs)/new-rental/`
- Web admin pages at `apps/web/src/app/(admin)/`

### Integration Points
- `CreateCustomerSchema` in shared package needs new address fields
- `CreateRentalSchema` (if exists) needs company/NIP/VAT/insuranceCaseNumber fields
- Vehicle DTOs need `vehicleClassId` field
- Web admin vehicle page needs VehicleClass CRUD + dropdown in vehicle form
- New web admin page needed: `/klasy` for VehicleClass management

</code_context>

<specifics>
## Specific Ideas

- Insurance case number field triggered by checkbox "Najem ubezpieczeniowy?" — not always visible, keeps the form clean for non-insurance rentals
- VAT status only appears when company checkbox is on — progressive disclosure

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 33-foundation-schema-simple-fields*
*Context gathered: 2026-04-12*
