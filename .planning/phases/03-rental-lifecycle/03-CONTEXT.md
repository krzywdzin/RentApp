# Phase 3: Rental Lifecycle - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete rental workflow API: creation (linking vehicle + customer + dates + pricing), double-booking detection with override, state machine (draft→active→extended→returned), structured vehicle handover and return with inspection checklists, admin-only extensions with cost recalculation, and calendar/scheduling endpoint. API-only — UI is Phase 5/6.

</domain>

<decisions>
## Implementation Decisions

### Rental Creation
- **Single form:** Employee fills vehicle, customer, dates (from-to with time), price in one API call. No wizard steps.
- **Draft or active:** Employee chooses — can save as draft (for pre-booking) or activate immediately
- **Pricing model:** Employee can enter either total price OR daily rate — system calculates the other. Both stored on rental.
- **Price format:** Net + VAT rate (23%). System calculates gross. Stored as integers (grosze) to avoid float issues.
- **Double-booking:** Warning with override — show conflict but allow employee to proceed (audit-logged). Not a hard block.
- **No buffer time:** Rentals can start immediately after previous ends. No automatic gap.
- **No deposit tracking:** Deposit handled outside the system (cash).
- **Additional fees:** Notes field only — no structured fee tracking. Admin handles billing manually.
- **Vehicle status:** Activating rental sets vehicle to RENTED. Return sets vehicle to AVAILABLE. (Wires Phase 2 automatic transitions.)

### State Machine
- **4 states:** DRAFT → ACTIVE → EXTENDED → RETURNED (removed 'closed' — returned is final)
- **Valid transitions:**
  - DRAFT → ACTIVE (employee activates)
  - ACTIVE → EXTENDED (admin extends)
  - ACTIVE → RETURNED (employee processes return)
  - EXTENDED → RETURNED (employee processes return)
  - EXTENDED → EXTENDED (admin extends again)
- **Admin rollback:** Admin can revert to previous state (e.g., RETURNED→ACTIVE if return was a mistake). Audit-logged.
- **Invalid transitions rejected:** API returns 400 with explanation of valid transitions.

### Vehicle Return
- **Full inspection form (optional):** Detailed checklist per vehicle area (front, rear, left, right, roof, interior, trunk, engine). Each with condition rating + note. All fields optional — employee fills what they observe.
- **Mandatory fields at return:** Current mileage only. Everything else optional.
- **Handover checklist:** Claude decides — same form at handover (rental start) for comparison, or photos-only at handover
- **Side-by-side comparison:** API stores both handover and return inspection data. Return endpoint includes handover data for comparison.

### Extension & Cost
- **Admin only:** Only admin can extend rentals (RENT-05).
- **Cost recalculation:** System suggests new total based on daily rate × new total days. Admin can accept or override with different amount.
- **Amendment record:** Claude decides whether to create a formal amendment (aneks) record in Phase 3 or defer to Phase 4 (Contract & PDF).
- **SMS trigger:** Claude decides — either emit event for Phase 8 SMS integration, or defer to Phase 8 entirely.

### Calendar API
- **API shape:** Claude decides — flat rental list or vehicle-grouped timeline. Optimized for admin panel timeline visualization (Phase 5).

### Claude's Discretion
- Calendar API response format
- Handover checklist implementation (same-as-return form vs photos-only)
- Amendment record in Phase 3 vs Phase 4
- Event emission for SMS integration vs deferral
- PostgreSQL exclusion constraints for overlap detection vs application-level check
- Inspection checklist data structure (JSON schema)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Rental data fields (date from-to, vehicle, registration), contract template requirements
- `.planning/REQUIREMENTS.md` — RENT-01 through RENT-05 with acceptance criteria
- `.planning/research/ARCHITECTURE.md` — Module boundaries, rental domain data flow

### Existing code (Phase 1-2)
- `apps/api/prisma/schema.prisma` — Current schema with Vehicle, Customer, VehicleStatus enum to extend with Rental model
- `apps/api/src/vehicles/vehicles.service.ts` — Vehicle status update pattern to wire automatic transitions
- `apps/api/src/audit/audit.interceptor.ts` — `__audit` metadata pattern for controller-level audit logging
- `apps/api/src/common/decorators/roles.decorator.ts` — `@Roles(UserRole.ADMIN)` for admin-only extension endpoint

### Phase 2 decisions
- `.planning/phases/02-fleet-and-customer-data/02-CONTEXT.md` — Vehicle status lifecycle (5 statuses, automatic transitions wired in Phase 3)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VehicleStatus` enum: AVAILABLE, RESERVED, RENTED, SERVICE, RETIRED — wire RENTED/AVAILABLE transitions here
- `VehiclesService.updateStatus()` — existing method to change vehicle status programmatically
- `AuditInterceptor` — auto-captures mutations, `__audit` pattern for controller-level metadata
- `@Roles()` decorator — for admin-only extension endpoint
- `PrismaService` — database access pattern established
- `ValidationPipe` with class-validator DTOs — input validation pattern

### Established Patterns
- NestJS module: module + controller + service + DTOs (vehicles, customers, users, auth)
- Prisma: UUID PKs, @@map, @@index, Json columns for flexible data (encrypted fields)
- Audit: `__audit` metadata on controller responses, interceptor captures diffs

### Integration Points
- `apps/api/src/app.module.ts` — Register RentalModule
- `apps/api/prisma/schema.prisma` — Add Rental model with Vehicle/Customer relations
- `packages/shared/src/types/` — Add rental types (RentalStatus, RentalDto)
- `packages/shared/src/schemas/` — Add Zod rental schemas
- `apps/api/src/vehicles/vehicles.service.ts` — Wire status transitions on rental activate/return

</code_context>

<specifics>
## Specific Ideas

- Pracownik sam ustala cenę (kwota lub stawka dzienna) — nie ma cennika
- Ceny netto + stawka VAT (23%) — system liczy brutto
- Przechowywanie cen w groszach (integer) — bez floatów
- Pełna lista kontrolna zwrotu (front, tył, lewo, prawo, dach, wnętrze, bagażnik, silnik) ale opcjonalna
- Porównanie side-by-side stanu przy wydaniu vs zwrocie
- Admin może cofnąć stan wynajmu (np. zwrócony→aktywny) — logowane w audycie
- Dodatkowe opłaty jako notatki, nie strukturyzowane
- Kaucja obsługiwana poza systemem

</specifics>

<deferred>
## Deferred Ideas

- Structured fee tracking (late return, damage fees) — future enhancement
- Deposit (kaucja) tracking in system — currently cash-based
- Buffer time between rentals — not needed for v1
- Contract amendment (aneks) PDF — Phase 4

</deferred>

---

*Phase: 03-rental-lifecycle*
*Context gathered: 2026-03-23*
