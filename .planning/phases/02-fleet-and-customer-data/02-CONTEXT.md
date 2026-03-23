# Phase 2: Fleet and Customer Data - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Vehicle fleet CRUD (add/edit/archive vehicles with full details + document uploads), CSV/XLS fleet import via admin dashboard, customer record management with encrypted PII fields, and vehicle status lifecycle with automatic transitions. API-only — admin panel UI is Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Vehicle Data Model
- **Full field set:** registration, VIN, make, model, year, color, fuel type, transmission, seat count, mileage, notes
- **Insurance:** company name, policy number, expiry date, coverage type (OC/AC/NNW), optional document scan (PDF/image in MinIO)
- **Inspection (przegląd):** expiry date, optional document scan (zaświadczenie) — mirrors insurance structure
- **Optional main photo:** One thumbnail per vehicle for identification in lists (MinIO)
- **Document uploads:** Optional — insurance policy, inspection certificate, registration card. Stored in MinIO.
- **No daily rate on vehicle:** Pricing is set by employee at contract creation time (Phase 4), not stored on vehicle
- **Soft-delete:** Claude's discretion — archive vs hard-delete with guard
- **Insurance/inspection expiry alerts:** Store dates now, build alerts in notifications phase (Phase 7-8)

### Fleet Import
- **No existing spreadsheet:** System defines a CSV template with all vehicle fields
- **Multiple import options in admin dashboard:** CSV upload, XLS upload, manual add — all accessible from admin panel
- **Error handling:** Skip bad rows, import valid ones. Return report showing skipped rows with reasons.
- **Duplicate detection by registration:** Claude's discretion on insert-only vs upsert behavior
- **Downloadable template:** Provided via admin dashboard

### Customer PII Handling
- **Encryption scope:** Claude decides based on RODO/PITFALLS.md research — minimum set that satisfies 'special category' requirements
- **Existing utility:** `apps/api/src/common/crypto/field-encryption.ts` provides `encrypt()`, `decrypt()`, `hmacIndex()`
- **Search:** Full exact match only (no partial/autocomplete). Use HMAC index for encrypted fields, plaintext match for unencrypted.
- **Cross-entity search:** Employee searches by customer (name, phone) to find their rentals/vehicles, and by vehicle (registration) to find associated customers. Implemented via rental relations (Phase 3 connects vehicle + customer).
- **RODO retention:** Claude decides based on PITFALLS.md and Polish legal requirements (CUST-04)

### Vehicle Status Lifecycle
- **Statuses:** Available, Reserved, Rented, Service, Retired
- **Automatic transitions:** Available→Rented on rental start, Rented→Available on return (wired in Phase 3 rental lifecycle)
- **Manual override:** Admin can set Service or Retired anytime
- **Service guard:** Warning when trying to rent a vehicle in Service status, but allows override. Block for Retired.
- **Phase 2 scope:** Define the status enum and manual transitions (Service, Retired). Automatic transitions (Available↔Rented, Reserved) are wired when rental lifecycle is built in Phase 3.

### Claude's Discretion
- Soft-delete vs hard-delete strategy for vehicles
- Exact encrypted field set (based on RODO research)
- RODO retention period and implementation approach
- Import upsert vs insert-only behavior
- Prisma schema design for Vehicle and Customer models
- MinIO bucket structure for vehicle documents/photos

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Customer data fields collected in contracts (imiona, PESEL, dowód, prawo jazdy)
- `.planning/REQUIREMENTS.md` — FLEET-01 through FLEET-03, CUST-01 through CUST-04 requirements
- `.planning/research/ARCHITECTURE.md` — Module boundaries, data flow between fleet/customer/rental domains

### Security and compliance
- `.planning/research/PITFALLS.md` — RODO/GDPR pitfalls, PESEL encryption requirements, data minimization, retention policies
- `.planning/research/SUMMARY.md` — Key findings on UODO enforcement and data protection

### Existing code (Phase 1)
- `apps/api/src/common/crypto/field-encryption.ts` — AES-256-GCM encrypt/decrypt + HMAC index utility (reuse for customer PII)
- `apps/api/prisma/schema.prisma` — Current schema (User + AuditLog) to extend with Vehicle + Customer models
- `apps/api/src/users/users.module.ts` — NestJS module pattern to follow for Vehicle and Customer modules

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `field-encryption.ts`: encrypt(), decrypt(), hmacIndex() — ready to use for customer PII fields
- `AuditInterceptor`: auto-captures all mutations — Vehicle and Customer CRUD will be audited automatically
- `@Roles(UserRole.ADMIN)` decorator — for admin-only endpoints (fleet management, import)
- `PrismaService` — database access pattern established
- MinIO configured in docker-compose.yml — ready for document/photo storage

### Established Patterns
- NestJS module structure: module + controller + service + DTOs (see users module)
- Prisma schema: UUID primary keys, @@map for table names, @@index for query patterns
- class-validator decorators on DTOs for input validation
- Zod schemas in `packages/shared` for shared validation

### Integration Points
- `apps/api/src/app.module.ts` — Register new VehicleModule and CustomerModule
- `apps/api/prisma/schema.prisma` — Add Vehicle and Customer models
- `packages/shared/src/types/` — Add vehicle and customer type definitions
- `packages/shared/src/schemas/` — Add Zod validation schemas

</code_context>

<specifics>
## Specific Ideas

- Pracownik ustala cenę przy wypełnianiu umowy — nie ma stałego cennika na pojeździe
- Import floty musi być dostępny z poziomu panelu admina (nie oddzielne narzędzie CLI)
- Wyszukiwanie klientów działa w obie strony: po kliencie znajdziesz auto, po aucie znajdziesz klienta (via relacja wynajmu)
- Wyszukiwanie po pełnym dopasowaniu (nie autocomplete) — bezpieczniejsze z szyfrowaniem

</specifics>

<deferred>
## Deferred Ideas

- Insurance/inspection expiry alerts with notifications — Phase 7-8
- Cross-entity search (vehicle↔customer via rentals) — requires Phase 3 rental model first
- Fleet import UI in admin dashboard — Phase 5 (admin panel), Phase 2 builds the API endpoint

</deferred>

---

*Phase: 02-fleet-and-customer-data*
*Context gathered: 2026-03-23*
