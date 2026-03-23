# Phase 3: Rental Lifecycle - Research

**Researched:** 2026-03-23
**Domain:** Rental CRUD, state machine, calendar scheduling, vehicle return inspection, admin extensions
**Confidence:** HIGH

## Summary

Phase 3 builds the core rental lifecycle as a NestJS module (API-only, no UI). It introduces the `Rental` model with relations to Vehicle and Customer, a state machine enforcing DRAFT/ACTIVE/EXTENDED/RETURNED transitions, double-booking detection with soft-warning, structured vehicle inspection at handover and return, admin-only extension with cost recalculation, and a calendar endpoint for timeline visualization.

The key technical challenge is double-booking detection. Prisma does not support PostgreSQL range types (`tstzrange`) or exclusion constraints natively -- range columns get dropped to `String` during migrations. The recommended approach is application-level overlap checking with a raw SQL query using `tstzrange` overlap operator (`&&`) for correctness, wrapped in a Prisma transaction. This gives database-level safety without fighting Prisma's migration system.

Prices are stored as integers (grosze) to avoid float precision issues. The inspection checklist is stored as a JSON column with a well-defined schema. The state machine is implemented as a simple transition map in application code, not database triggers.

**Primary recommendation:** Build a single `RentalsModule` with service methods per business operation (`createRental`, `activateRental`, `processReturn`, `extendRental`), each enforcing state machine rules. Use raw SQL for overlap detection within Prisma transactions. Store inspection data as typed JSON columns.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Single form creation:** Employee fills vehicle, customer, dates (from-to with time), price in one API call. No wizard steps.
- **Draft or active:** Employee chooses -- can save as draft (for pre-booking) or activate immediately
- **Pricing model:** Employee can enter either total price OR daily rate -- system calculates the other. Both stored on rental.
- **Price format:** Net + VAT rate (23%). System calculates gross. Stored as integers (grosze) to avoid float issues.
- **Double-booking:** Warning with override -- show conflict but allow employee to proceed (audit-logged). Not a hard block.
- **No buffer time:** Rentals can start immediately after previous ends. No automatic gap.
- **No deposit tracking:** Deposit handled outside the system (cash).
- **Additional fees:** Notes field only -- no structured fee tracking.
- **Vehicle status:** Activating rental sets vehicle to RENTED. Return sets vehicle to AVAILABLE.
- **4 states:** DRAFT, ACTIVE, EXTENDED, RETURNED (removed 'closed' -- returned is final)
- **Valid transitions:** DRAFT->ACTIVE, ACTIVE->EXTENDED, ACTIVE->RETURNED, EXTENDED->RETURNED, EXTENDED->EXTENDED
- **Admin rollback:** Admin can revert to previous state (e.g., RETURNED->ACTIVE). Audit-logged.
- **Return mandatory field:** Current mileage only. Everything else optional.
- **Full inspection form (optional):** Detailed checklist per vehicle area (front, rear, left, right, roof, interior, trunk, engine). Each with condition rating + note.
- **Side-by-side comparison:** API stores both handover and return inspection data. Return endpoint includes handover data for comparison.
- **Admin only extensions:** Only admin can extend rentals (RENT-05).
- **Cost recalculation:** System suggests new total based on daily rate x new total days. Admin can accept or override.

### Claude's Discretion
- Calendar API response format
- Handover checklist implementation (same-as-return form vs photos-only)
- Amendment record in Phase 3 vs Phase 4
- Event emission for SMS integration vs deferral
- PostgreSQL exclusion constraints for overlap detection vs application-level check
- Inspection checklist data structure (JSON schema)

### Deferred Ideas (OUT OF SCOPE)
- Structured fee tracking (late return, damage fees) -- future enhancement
- Deposit (kaucja) tracking in system -- currently cash-based
- Buffer time between rentals -- not needed for v1
- Contract amendment (aneks) PDF -- Phase 4
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RENT-01 | Employee can create rental (vehicle + customer + dates with time) | Rental model with Vehicle/Customer FKs, date range fields, pricing fields. Single POST endpoint. |
| RENT-02 | Calendar view with timeline and double-booking prevention | Calendar endpoint returning vehicle-grouped rentals. Application-level overlap detection with raw SQL tstzrange query. |
| RENT-03 | Rental state machine (draft->active->extended->returned) with invalid transition rejection | Transition map in service layer, 400 response for invalid transitions, audit logging on every transition. |
| RENT-04 | Structured vehicle return: mileage, damage checklist, comparison with handover | Return endpoint with mileage + optional inspection JSON. Handover inspection stored at activation. Return response includes both for comparison. |
| RENT-05 | Admin extension with date update, cost recalculation, notification trigger | Admin-only extend endpoint. Recalculate total from daily rate x days. Emit domain event for future SMS integration. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @nestjs/common | (existing) | HTTP framework, decorators, pipes | Already in project |
| @prisma/client | (existing) | Database ORM | Already in project, handles all CRUD |
| class-validator | (existing) | DTO validation decorators | Already used in vehicles/customers |
| class-transformer | (existing) | DTO transformation | Already used in vehicles/customers |
| @rentapp/shared | (existing) | Shared types and Zod schemas | Already used for enums |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.x | Date arithmetic (day counting, range comparison) | Calculating rental duration for pricing |

**No new dependencies required.** The existing stack covers all Phase 3 needs. `date-fns` is the only potential addition for clean date arithmetic (differenceInDays, isWithinInterval), but native Date + simple math works too for this scope. Recommend keeping it dependency-free using raw date math since the calculations are straightforward (end - start in ms / ms-per-day).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Application-level overlap check | PostgreSQL exclusion constraint with tstzrange | Prisma does not support range types or exclusion constraints natively (GitHub issues #17514, #3287 open since 2023). Would require raw migrations and raw SQL for all range operations. Application-level check is simpler and sufficient at this scale. |
| XState for state machine | Simple transition map object | XState is overkill for 4 states. A `Record<RentalStatus, RentalStatus[]>` with a `validateTransition()` function is clear, testable, and zero-dependency. |
| Separate calendar module | Calendar endpoint in RentalsModule | Only one endpoint needed. Separate module adds unnecessary indirection. |

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/rentals/
  rentals.module.ts        # NestJS module registration
  rentals.controller.ts    # HTTP endpoints
  rentals.service.ts       # Business logic, state machine, overlap detection
  dto/
    create-rental.dto.ts   # Vehicle + customer + dates + pricing
    update-rental.dto.ts   # Partial updates
    extend-rental.dto.ts   # New end date, optional price override
    return-rental.dto.ts   # Mileage + optional inspection
    calendar-query.dto.ts  # Date range filter for calendar
  constants/
    rental-transitions.ts  # State machine transition map
    inspection-areas.ts    # Inspection area constants

packages/shared/src/
  types/rental.types.ts    # RentalStatus enum, RentalDto interface, InspectionDto
  schemas/rental.schemas.ts # Zod schemas for rental validation
```

### Pattern 1: State Machine as Transition Map
**What:** A simple `Record<RentalStatus, RentalStatus[]>` defining valid transitions. Each business operation (activate, extend, return) calls `validateTransition()` before mutating.
**When to use:** Always for rental status changes.
**Example:**
```typescript
// constants/rental-transitions.ts
export const RENTAL_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  DRAFT: [RentalStatus.ACTIVE],
  ACTIVE: [RentalStatus.EXTENDED, RentalStatus.RETURNED],
  EXTENDED: [RentalStatus.EXTENDED, RentalStatus.RETURNED],
  RETURNED: [], // terminal state
};

// Admin rollback has its own separate map
export const ADMIN_ROLLBACK_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  RETURNED: [RentalStatus.ACTIVE, RentalStatus.EXTENDED],
  EXTENDED: [RentalStatus.ACTIVE],
  ACTIVE: [RentalStatus.DRAFT],
};

function validateTransition(
  current: RentalStatus,
  target: RentalStatus,
  isAdminRollback = false,
): void {
  const map = isAdminRollback ? ADMIN_ROLLBACK_TRANSITIONS : RENTAL_TRANSITIONS;
  const allowed = map[current] ?? [];
  if (!allowed.includes(target)) {
    throw new BadRequestException(
      `Cannot transition from ${current} to ${target}. Valid transitions: ${allowed.join(', ') || 'none (terminal state)'}`,
    );
  }
}
```

### Pattern 2: Application-Level Overlap Detection with Raw SQL
**What:** Use `prisma.$queryRaw` with `tstzrange` overlap operator for accurate date range overlap detection. This avoids Prisma's lack of range type support while getting database-level correctness.
**When to use:** When creating or extending a rental -- check for conflicts on the same vehicle.
**Example:**
```typescript
async checkOverlap(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
  excludeRentalId?: string,
): Promise<Rental[]> {
  // Use raw SQL with tstzrange for correct overlap detection
  // '[)' = inclusive start, exclusive end -- so back-to-back rentals don't conflict
  const conflicts = await this.prisma.$queryRaw<Rental[]>`
    SELECT * FROM rentals
    WHERE vehicle_id = ${vehicleId}
      AND status NOT IN ('RETURNED')
      AND tstzrange("start_date", "end_date", '[)') &&
          tstzrange(${startDate}::timestamptz, ${endDate}::timestamptz, '[)')
      ${excludeRentalId ? Prisma.sql`AND id != ${excludeRentalId}` : Prisma.empty}
  `;
  return conflicts;
}
```

### Pattern 3: Pricing as Integers (Grosze)
**What:** Store all monetary values as integers representing grosze (1/100 PLN). Calculate gross from net + VAT rate. Both totalPriceNet and dailyRateNet stored, system derives the other.
**When to use:** All price fields in the Rental model.
**Example:**
```typescript
// If employee provides totalPriceNet (in grosze), calculate dailyRate
// If employee provides dailyRateNet (in grosze), calculate totalPrice
const days = differenceInCalendarDays(endDate, startDate) || 1;
if (dto.totalPriceNet && !dto.dailyRateNet) {
  dailyRateNet = Math.round(dto.totalPriceNet / days);
  totalPriceNet = dto.totalPriceNet;
} else if (dto.dailyRateNet && !dto.totalPriceNet) {
  dailyRateNet = dto.dailyRateNet;
  totalPriceNet = dto.dailyRateNet * days;
} else {
  // Both provided -- use as-is
  dailyRateNet = dto.dailyRateNet;
  totalPriceNet = dto.totalPriceNet;
}
// VAT is always 23%
const vatRate = 23;
const totalPriceGross = Math.round(totalPriceNet * (1 + vatRate / 100));
```

### Pattern 4: Inspection Data as Typed JSON
**What:** Store handover and return inspections as JSON columns with a well-defined TypeScript interface. Same schema for both handover and return.
**When to use:** For the optional vehicle inspection at rental activation (handover) and return.
**Example:**
```typescript
// Inspection area enum
const INSPECTION_AREAS = [
  'front', 'rear', 'left', 'right',
  'roof', 'interior', 'trunk', 'engine',
] as const;

type InspectionArea = typeof INSPECTION_AREAS[number];

// Condition rating
type ConditionRating = 'good' | 'minor_damage' | 'major_damage' | 'missing';

interface AreaInspection {
  area: InspectionArea;
  condition: ConditionRating;
  note?: string;
}

interface VehicleInspection {
  mileage: number;
  areas?: AreaInspection[];
  generalNotes?: string;
}
```

### Anti-Patterns to Avoid
- **Storing prices as floats:** Use integers (grosze). `19999` not `199.99`. Float arithmetic causes rounding errors.
- **Updating status directly:** Never `rental.status = 'RETURNED'`. Always go through `validateTransition()` + business method that handles side effects (vehicle status update, audit logging).
- **Blocking on overlap check:** The user decision says warning-with-override, not hard block. Return conflicts in response, allow creation with `overrideConflict: true` flag.
- **Separate handover/return tables:** Use JSON columns on the Rental model. Two separate inspection tables would add complexity for what is fundamentally rental metadata.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date range overlap detection | String comparison of ISO dates | PostgreSQL `tstzrange` overlap operator via raw SQL | Edge cases with timezone boundaries, inclusive/exclusive ranges |
| VAT calculation | Manual percentage math everywhere | Centralized `calculatePricing()` utility | One place to change if VAT rate changes, avoids rounding inconsistencies |
| State machine validation | Ad-hoc if/else chains in each endpoint | Centralized transition map + `validateTransition()` | Single source of truth for valid transitions, easy to test |
| Date duration calculation | Manual ms arithmetic | `differenceInCalendarDays` or equivalent simple utility | Off-by-one errors with timezone-aware dates |

## Common Pitfalls

### Pitfall 1: Off-by-One in Day Counting
**What goes wrong:** Rental from Jan 1 to Jan 3 -- is that 2 days or 3 days? Different functions give different answers.
**Why it happens:** `differenceInDays` vs `differenceInCalendarDays` behave differently. Time-of-day matters.
**How to avoid:** Define the business rule explicitly: a rental from Jan 1 10:00 to Jan 3 10:00 is 2 days. Use calendar day difference. Document the convention. Use ceil for partial days if the business charges per started day.
**Warning signs:** Pricing doesn't match expectations for short rentals.

### Pitfall 2: Race Condition in Overlap Detection
**What goes wrong:** Two employees create rentals for the same vehicle simultaneously. Both pass the overlap check. Both succeed.
**Why it happens:** Application-level check without database-level constraint.
**How to avoid:** Wrap create in a Prisma transaction with `SELECT ... FOR UPDATE` on the vehicle row, or use serializable isolation. At the scale of ~100 vehicles and ~10 employees, this race is extremely unlikely but should still be handled.
**Warning signs:** Two active rentals for the same vehicle.

### Pitfall 3: Vehicle Status Desync
**What goes wrong:** Rental transitions to RETURNED but vehicle stays RENTED. Or admin rollback doesn't reset vehicle status.
**Why it happens:** Vehicle status update is a side effect of rental transition, easy to forget in a code path.
**How to avoid:** Make vehicle status updates part of the rental transition methods, inside the same database transaction. Never update vehicle status independently for rental-related changes.
**Warning signs:** Vehicles stuck in RENTED status after rental is returned.

### Pitfall 4: Prisma Raw SQL Type Safety
**What goes wrong:** Raw SQL queries return untyped results. Column name mismatch between raw SQL (snake_case) and Prisma model (camelCase).
**Why it happens:** Prisma's `$queryRaw` returns raw database column names, not the mapped Prisma field names.
**How to avoid:** Use column aliases in raw SQL to match expected field names, or map the results. For overlap detection, only need to check if conflicts exist (count > 0) or return IDs, minimizing the mapping surface.
**Warning signs:** Undefined fields when accessing overlap check results.

### Pitfall 5: Integer Overflow in Price Calculations
**What goes wrong:** `dailyRate * days` exceeds safe integer range, or intermediate calculations lose precision.
**Why it happens:** JavaScript numbers are IEEE 754 doubles. Safe integer range is up to 2^53. For grosze this is not a realistic concern (max ~90 trillion PLN), but intermediate VAT calculations with large amounts could accumulate rounding.
**How to avoid:** Use `Math.round()` after any division. Keep all intermediate calculations as integers where possible.
**Warning signs:** Prices off by 1 grosz.

## Code Examples

### Prisma Schema Extension (Rental Model)
```prisma
enum RentalStatus {
  DRAFT
  ACTIVE
  EXTENDED
  RETURNED
}

model Rental {
  id              String        @id @default(uuid())
  vehicleId       String
  customerId      String
  createdById     String        // Employee who created

  startDate       DateTime      // With time
  endDate         DateTime      // With time

  status          RentalStatus  @default(DRAFT)

  // Pricing (stored in grosze - integers)
  dailyRateNet    Int           // Daily rate net in grosze
  totalPriceNet   Int           // Total net in grosze
  totalPriceGross Int           // Total gross in grosze (net * 1.23)
  vatRate         Int           @default(23) // VAT percentage

  // Inspection data (JSON)
  handoverData    Json?         // VehicleInspection at rental start
  returnData      Json?         // VehicleInspection at return

  // Return tracking
  returnMileage   Int?          // Mileage at return

  notes           String?       // General notes, additional fees description

  // Override tracking
  overrodeConflict Boolean      @default(false) // True if created despite overlap warning

  vehicle         Vehicle       @relation(fields: [vehicleId], references: [id])
  customer        Customer      @relation(fields: [customerId], references: [id])
  createdBy       User          @relation(fields: [createdById], references: [id])

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([vehicleId])
  @@index([customerId])
  @@index([status])
  @@index([startDate, endDate])
  @@map("rentals")
}
```

Note: Relations also need to be added to Vehicle, Customer, and User models.

### Calendar API Endpoint (Recommended Format)
```typescript
// GET /rentals/calendar?from=2026-03-01&to=2026-03-31
// Returns vehicle-grouped timeline optimized for admin panel

interface CalendarResponse {
  vehicles: Array<{
    id: string;
    registration: string;
    make: string;
    model: string;
    rentals: Array<{
      id: string;
      startDate: string;
      endDate: string;
      status: RentalStatus;
      customerName: string;
      hasConflict: boolean; // overlaps with another rental
    }>;
  }>;
  period: { from: string; to: string };
}
```

**Rationale for vehicle-grouped format:** The admin panel timeline (Phase 5) displays vehicles as rows and time as columns. Vehicle-grouped data maps directly to this visualization without client-side regrouping. Each vehicle row contains its rentals for the requested period.

### Handover Checklist Decision
**Recommendation: Same form for handover and return.**

Using the same inspection form at both handover (rental activation) and return enables direct field-by-field comparison. The handover inspection is stored in `handoverData` JSON when the rental is activated, and the return inspection is stored in `returnData` when the rental is returned. The return endpoint returns both side-by-side.

Photos are Phase 7 scope. For Phase 3, the inspection is text-based (condition rating + notes per area).

### Amendment Record Decision
**Recommendation: Defer formal amendment (aneks) record to Phase 4.**

Phase 4 handles contracts and PDFs. An amendment is a contract artifact. In Phase 3, extension data is captured via the rental's `endDate` update + audit log entry. The audit trail provides the full history of date changes. Phase 4 can read the audit trail to generate amendment PDFs.

### Event Emission for SMS Decision
**Recommendation: Emit a simple domain event for Phase 8 integration.**

Use NestJS EventEmitter2 (already available via @nestjs/event-emitter) to emit events like `rental.extended`, `rental.activated`, `rental.returned`. In Phase 3, these events are emitted but have no listeners. Phase 8 (Notifications) adds listeners that trigger SMS/email. This is zero-cost, forward-compatible, and avoids tight coupling.

```typescript
// In RentalsService
this.eventEmitter.emit('rental.extended', {
  rentalId: rental.id,
  customerId: rental.customerId,
  newEndDate: rental.endDate,
  extendedBy: actorId,
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PostgreSQL exclusion constraints via Prisma | Application-level check with raw SQL | Ongoing (Prisma #3287 still open) | Must use raw SQL for tstzrange queries |
| Separate status tracking tables | JSON columns for inspection data | Prisma JSON support mature since v4+ | Simplifies schema, fewer migrations |
| Float prices | Integer (grosze) prices | Industry standard | Eliminates rounding errors |

## Open Questions

1. **PostgreSQL version on deployment target**
   - What we know: Using PostgreSQL via Docker in dev, `tstzrange` available since PG 9.2
   - What's unclear: Production PostgreSQL version
   - Recommendation: Assume PG 14+ (widely available). Raw SQL overlap query works on all modern PG versions.

2. **@nestjs/event-emitter availability**
   - What we know: The project uses NestJS with @nestjs/schedule already. EventEmitter2 is a standard NestJS package.
   - What's unclear: Whether it's already installed
   - Recommendation: Add `@nestjs/event-emitter` as a dependency in Phase 3 if not present. Low-risk, well-supported package.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via ts-jest) |
| Config file | `apps/api/test/jest-e2e.json` (e2e), project jest config (unit) |
| Quick run command | `cd apps/api && npx jest --testPathPattern=rentals --no-coverage` |
| Full suite command | `cd apps/api && npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RENT-01 | Create rental linking vehicle + customer + dates | e2e | `cd apps/api && npx jest --config test/jest-e2e.json --testPathPattern=rentals -t "create rental"` | No -- Wave 0 |
| RENT-01 | Price calculation (daily rate vs total, VAT) | unit | `cd apps/api && npx jest --testPathPattern=rentals.service -t "pricing"` | No -- Wave 0 |
| RENT-02 | Calendar endpoint returns vehicle-grouped rentals | e2e | `cd apps/api && npx jest --config test/jest-e2e.json --testPathPattern=rentals -t "calendar"` | No -- Wave 0 |
| RENT-02 | Overlap detection warns but allows override | unit | `cd apps/api && npx jest --testPathPattern=rentals.service -t "overlap"` | No -- Wave 0 |
| RENT-03 | Valid state transitions succeed | unit | `cd apps/api && npx jest --testPathPattern=rentals.service -t "transition"` | No -- Wave 0 |
| RENT-03 | Invalid state transitions return 400 | e2e | `cd apps/api && npx jest --config test/jest-e2e.json --testPathPattern=rentals -t "invalid transition"` | No -- Wave 0 |
| RENT-04 | Return with mileage + optional inspection | e2e | `cd apps/api && npx jest --config test/jest-e2e.json --testPathPattern=rentals -t "return"` | No -- Wave 0 |
| RENT-04 | Return includes handover data for comparison | unit | `cd apps/api && npx jest --testPathPattern=rentals.service -t "handover comparison"` | No -- Wave 0 |
| RENT-05 | Admin-only extend with cost recalculation | e2e | `cd apps/api && npx jest --config test/jest-e2e.json --testPathPattern=rentals -t "extend"` | No -- Wave 0 |
| RENT-05 | Employee cannot extend (403) | e2e | `cd apps/api && npx jest --config test/jest-e2e.json --testPathPattern=rentals -t "employee extend"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern=rentals --no-coverage`
- **Per wave merge:** `cd apps/api && npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/rentals/rentals.service.spec.ts` -- unit tests for state machine, pricing, overlap
- [ ] `apps/api/test/rentals.e2e-spec.ts` -- e2e tests for all rental endpoints
- [ ] Framework install: none needed -- Jest already configured
- [ ] `@nestjs/event-emitter` -- check if installed, add if missing

## Sources

### Primary (HIGH confidence)
- Project codebase: `apps/api/prisma/schema.prisma` -- current schema, Vehicle/Customer models, enum patterns
- Project codebase: `apps/api/src/vehicles/vehicles.service.ts` -- service patterns, status validation, `__audit` pattern
- Project codebase: `apps/api/src/audit/audit.interceptor.ts` -- audit integration pattern
- Project codebase: `apps/api/src/vehicles/dto/create-vehicle.dto.ts` -- DTO validation with class-validator pattern
- [PostgreSQL Range Types documentation](https://www.postgresql.org/docs/current/rangetypes.html) -- tstzrange overlap operator
- [Prisma GitHub #3287](https://github.com/prisma/prisma/issues/3287) -- range type support not available
- [Prisma GitHub #17514](https://github.com/prisma/prisma/issues/17514) -- exclusion constraints not supported

### Secondary (MEDIUM confidence)
- [PostgreSQL exclusion constraints for booking systems](https://medium.com/@jamshidbek-makhmudov/postgressql-exclusion-constraints-f9fdb4158f9e) -- pattern verified against PG docs
- Phase 3 CONTEXT.md -- all user decisions locked

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- using existing project dependencies, no new libraries needed
- Architecture: HIGH -- follows established NestJS module pattern from Phase 1-2
- State machine: HIGH -- simple transition map, well-understood pattern
- Overlap detection: HIGH -- raw SQL workaround for Prisma limitation is well-documented
- Pricing: HIGH -- integer arithmetic, straightforward
- Pitfalls: MEDIUM -- race condition severity depends on actual concurrent usage patterns

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable domain, no fast-moving dependencies)
