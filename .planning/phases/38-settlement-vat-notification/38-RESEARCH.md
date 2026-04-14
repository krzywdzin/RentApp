# Phase 38: Settlement & VAT Notification - Research

**Researched:** 2026-04-14
**Domain:** Rental settlement lifecycle (web admin) + VAT collection reminder (mobile)
**Confidence:** HIGH

## Summary

Phase 38 adds two independent features: (1) a settlement tracking system in the web admin panel where admin marks rentals as settled/partially settled/cancelled with amounts and notes, plus a filtered list view; (2) a blocking VAT reminder modal in the mobile return flow for VAT-paying customers. Both features build on existing, well-established patterns in the codebase.

The settlement feature requires a Prisma schema migration (new enum + 4 fields on the Rental model), a new API endpoint for updating settlement data, and a new UI section in the rental detail page plus a filtered settlement list view. The VAT reminder is a simple modal shown at the start of the mobile return wizard, gated on the rental's `vatPayerStatus` field which already exists in the data model.

**Primary recommendation:** Split into two plans: (1) backend + web admin settlement, (2) mobile VAT reminder modal. Both are straightforward extensions of existing patterns.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Settlement lifecycle: Four statuses: Nierozliczony, Czesciowo rozliczony, Rozliczony, Anulowany
- Admin records: settlement status, collected amount (numeric), free-text notes
- Every rental starts as "Nierozliczony" automatically at creation (no extra action)
- Fully reversible -- admin can change status in any direction (mistakes happen)
- Settlement data edited in rental detail view (not inline in list)
- VAT reminder: Blocking modal appears when worker opens the return flow in mobile app
- Shows for both 100% and 50% VAT payers (different message per rate)
- Worker just dismisses ("Rozumiem") -- no tracking of whether VAT was actually collected
- Only triggers when vatPayerStatus is FULL_100 or HALF_50 (not NONE or null)
- Settlement list: All four filters (settlement status, date range, customer name, vehicle registration)
- Summary bar at top: count of unsettled rentals + total unsettled amount
- Filterable, sortable table with settlement-relevant columns

### Claude's Discretion
- Whether settlement lives as a tab in /wynajmy or a separate /rozliczenia page -- choose best UX
- Exact modal text and styling for VAT reminder
- Summary bar layout and number formatting
- Table column order and default sort

### Deferred Ideas (OUT OF SCOPE)
- Tracking partial payments and deposits (ZWROT-F01 in v4.0 requirements)
- Push notifications for overdue settlements -- potential future feature
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ZWROT-02 | Pracownik otrzymuje powiadomienie o koniecznosci pobrania VAT przy zwrocie (jesli klient jest platnikiem VAT) | VAT modal in mobile return flow; vatPayerStatus already on rental model; ConfirmationDialog component reusable for blocking modal |
| ZWROT-03 | Admin moze oznaczyc wynajem jako rozliczony/nierozliczony w panelu webowym | New SettlementStatus enum + fields on Rental model; settlement form in rental detail page; PATCH endpoint for settlement update |
| ZWROT-04 | Panel webowy wyswietla liste nierozliczonych wynajmow z filtrowaniem | Settlement list view (tab or page) with DataTable, filters, and summary bar; existing RentalFilterBar pattern reusable |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | (existing) | Schema migration for SettlementStatus enum + settlement fields | Already used for all data model changes |
| NestJS | (existing) | Settlement update endpoint + query filters | Existing API framework |
| Next.js App Router | (existing) | Settlement UI in web admin panel | Existing web framework |
| React Native + Expo Router | (existing) | VAT reminder modal in return flow | Existing mobile framework |
| @tanstack/react-table | (existing) | Settlement list table with sorting/filtering | Already used in /wynajmy |
| Zustand | (existing) | Return draft store (already has rental data for VAT check) | Already used in mobile |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-validator | (existing) | DTO validation for settlement update | Validating settlement PATCH body |
| Zod | (existing) | Shared schemas if needed | Only if settlement types need mobile validation |
| sonner | (existing) | Toast notifications for settlement actions | Web admin success/error feedback |
| lucide-react | (existing) | Icons for settlement status badges | Settlement UI elements |

No new packages needed. Everything builds on existing dependencies.

## Architecture Patterns

### Recommended Project Structure

```
# API additions
apps/api/prisma/schema.prisma                    # Add SettlementStatus enum + fields
apps/api/prisma/migrations/YYYYMMDD_settlement/  # Manual SQL migration
apps/api/src/rentals/dto/update-settlement.dto.ts # New DTO for settlement PATCH
apps/api/src/rentals/rentals.service.ts           # Add updateSettlement + settlement query methods
apps/api/src/rentals/rentals.controller.ts        # Add PATCH /rentals/:id/settlement endpoint
apps/api/src/rentals/dto/rentals-query.dto.ts     # Extend with settlement filters

# Shared types
packages/shared/src/types/rental.types.ts         # Add SettlementStatus enum + settlement fields to RentalDto

# Web additions
apps/web/src/app/(admin)/wynajmy/[id]/page.tsx    # Add "Rozliczenie" tab in rental detail
apps/web/src/app/(admin)/wynajmy/page.tsx          # Add "Rozliczenia" tab in rentals list
apps/web/src/app/(admin)/wynajmy/settlement-columns.ts  # Column definitions for settlement table
apps/web/src/app/(admin)/wynajmy/settlement-filter-bar.tsx  # Settlement-specific filters
apps/web/src/hooks/queries/use-rentals.ts          # Add useUpdateSettlement + useSettlementList hooks

# Mobile additions
apps/mobile/app/return/[rentalId].tsx              # Add VAT modal before wizard navigation
```

### Pattern 1: Settlement as Tab in /wynajmy (Recommended)

**What:** Add a "Rozliczenia" tab alongside existing "Lista", "Kalendarz", "Zarchiwizowane" tabs
**When to use:** This is the recommended approach -- keeps settlement contextually tied to rentals without creating a separate route
**Why:** The existing tabs pattern is well-established. The admin already navigates to /wynajmy for rental management. Settlement is a property of a rental, not a separate entity. Adding a tab follows the existing Zarchiwizowane pattern closely.

```typescript
// In apps/web/src/app/(admin)/wynajmy/page.tsx
<Tabs defaultValue="lista">
  <TabsList>
    <TabsTrigger value="lista">Lista</TabsTrigger>
    <TabsTrigger value="kalendarz">Kalendarz</TabsTrigger>
    <TabsTrigger value="rozliczenia">Rozliczenia</TabsTrigger>
    <TabsTrigger value="zarchiwizowane">Zarchiwizowane</TabsTrigger>
  </TabsList>
  {/* ... */}
  <TabsContent value="rozliczenia">
    <SettlementSummaryBar />
    <SettlementFilterBar />
    <DataTable columns={settlementColumns} data={...} />
  </TabsContent>
</Tabs>
```

### Pattern 2: Settlement Form in Rental Detail

**What:** Add a "Rozliczenie" tab in the rental detail page with settlement status, amount, notes form
**When to use:** For editing settlement data per rental (locked decision: edited in detail view, not inline)

```typescript
// In rental detail page, add tab:
<TabsTrigger value="rozliczenie">Rozliczenie</TabsTrigger>

// Tab content: Card with form
<Card>
  <CardHeader><CardTitle>Rozliczenie</CardTitle></CardHeader>
  <CardContent>
    {/* Status selector (4 options as buttons/select) */}
    {/* Amount input (grosze internally, PLN display) */}
    {/* Notes textarea */}
    {/* settledAt display (auto-set when status changes to Rozliczony) */}
    <Button onClick={handleSave}>Zapisz</Button>
  </CardContent>
</Card>
```

### Pattern 3: VAT Blocking Modal in Return Flow

**What:** Modal shown on first screen of return wizard when vatPayerStatus is FULL_100 or HALF_50
**When to use:** Every time a worker starts returning a vehicle for a VAT-paying customer

```typescript
// In apps/mobile/app/return/[rentalId].tsx
// After rental data loads, show modal before user can proceed
const [vatModalDismissed, setVatModalDismissed] = useState(false);
const showVatModal = rental?.vatPayerStatus &&
  ['FULL_100', 'HALF_50'].includes(rental.vatPayerStatus) &&
  !vatModalDismissed;

// Use existing ConfirmationDialog pattern (Modal with overlay)
<Modal visible={showVatModal} transparent animationType="fade">
  {/* VAT reminder content with single "Rozumiem" button */}
</Modal>
```

### Anti-Patterns to Avoid
- **Separate settlement entity/table:** Settlement is a property of Rental, not a separate model. Adding fields to Rental is correct.
- **Server-side VAT reminder:** The VAT reminder is purely client-side UI. No API call needed -- just read the existing vatPayerStatus from the rental.
- **Complex state tracking for VAT dismissal:** No persistence needed. The modal state resets each time the return flow opens. `useState(false)` is sufficient.
- **Decimal type for settlement amount:** Use Int (grosze) like all other monetary values in the system (dailyRateNet, totalPriceNet, etc.). Display as PLN using existing `formatCurrency()`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom PLN formatter | Existing `formatCurrency()` in `apps/web/src/lib/format.ts` | Already handles grosze-to-PLN with Intl.NumberFormat |
| Data table with sort/filter | Custom table | Existing `DataTable` component with @tanstack/react-table | Battle-tested in /wynajmy, /klienci, /pojazdy |
| Blocking modal (mobile) | Custom modal implementation | Existing `ConfirmationDialog` component or `Modal` from React Native | Already styled to match app theme |
| Status badge rendering | Custom badge logic | Existing badge pattern from `getRentalStatusBadge` | Consistent styling across app |
| Query invalidation pattern | Manual refetch | Existing react-query key pattern in `use-rentals.ts` | Already handles all rental data invalidation |

## Common Pitfalls

### Pitfall 1: Settlement amount stored as Decimal instead of Int
**What goes wrong:** Inconsistent monetary representation. All other amounts (dailyRateNet, totalPriceNet, totalPriceGross) are stored as Int (grosze).
**Why it happens:** Natural instinct to use Decimal for money.
**How to avoid:** Use `Int` in Prisma schema. Store in grosze (1 PLN = 100 grosze). Use `formatCurrency()` for display.
**Warning signs:** Prisma schema uses `Decimal` or `Float` for settlementAmount.

### Pitfall 2: Default settlement status not set for existing rentals
**What goes wrong:** Existing rentals have NULL settlementStatus after migration, breaking filters.
**Why it happens:** Migration adds nullable column without backfilling.
**How to avoid:** Migration SQL must: (1) add column as nullable, (2) UPDATE all existing rows to 'NIEROZLICZONY', (3) ALTER to NOT NULL with default.
**Warning signs:** Settlement list shows no results or crashes on NULL status.

### Pitfall 3: VAT modal re-showing after navigation within return wizard
**What goes wrong:** Worker sees VAT modal every time they navigate back to the first return screen.
**Why it happens:** State resets on component re-render when navigating back.
**How to avoid:** Store dismissal state in the return draft store (zustand persisted), OR gate the modal only on the initial entry (check `step === 1` and no mileage entered yet).
**Warning signs:** Modal appears on back navigation within the wizard.

### Pitfall 4: Settlement filters not resetting pagination
**What goes wrong:** Changing a filter shows empty page because pagination state still points to a high page.
**Why it happens:** Filter change reduces result count but pageIndex stays.
**How to avoid:** Reset pageIndex to 0 on every filter change (existing pattern in RentalFilterBar).
**Warning signs:** Filtering shows "Brak wynikow" when results exist.

### Pitfall 5: RentalDto type not updated in shared package
**What goes wrong:** Web and mobile see settlement fields as `any` or fail type checks.
**Why it happens:** Schema updated in Prisma but shared types not updated.
**How to avoid:** Update `RentalDto` and `RentalWithRelations` in `packages/shared/src/types/rental.types.ts` alongside schema changes.
**Warning signs:** TypeScript errors or `as unknown as` casts for settlement fields.

## Code Examples

### Prisma Schema Addition
```prisma
// In apps/api/prisma/schema.prisma

enum SettlementStatus {
  NIEROZLICZONY
  CZESCIOWO_ROZLICZONY
  ROZLICZONY
  ANULOWANY
}

model Rental {
  // ... existing fields ...
  settlementStatus   SettlementStatus @default(NIEROZLICZONY)
  settlementAmount   Int?             // grosze, nullable (no amount collected yet)
  settlementNotes    String?          @db.Text
  settledAt          DateTime?        // timestamp when marked as ROZLICZONY
  // ... rest of model ...
}
```

### Manual SQL Migration
```sql
-- Following Phase 33/34/35/36 precedent: manual SQL, no shadow DB

-- 1. Create enum
CREATE TYPE "SettlementStatus" AS ENUM ('NIEROZLICZONY', 'CZESCIOWO_ROZLICZONY', 'ROZLICZONY', 'ANULOWANY');

-- 2. Add columns
ALTER TABLE "rentals" ADD COLUMN "settlementStatus" "SettlementStatus" DEFAULT 'NIEROZLICZONY';
ALTER TABLE "rentals" ADD COLUMN "settlementAmount" INTEGER;
ALTER TABLE "rentals" ADD COLUMN "settlementNotes" TEXT;
ALTER TABLE "rentals" ADD COLUMN "settledAt" TIMESTAMP(3);

-- 3. Backfill existing rows
UPDATE "rentals" SET "settlementStatus" = 'NIEROZLICZONY' WHERE "settlementStatus" IS NULL;

-- 4. Make NOT NULL with default
ALTER TABLE "rentals" ALTER COLUMN "settlementStatus" SET NOT NULL;
ALTER TABLE "rentals" ALTER COLUMN "settlementStatus" SET DEFAULT 'NIEROZLICZONY';

-- 5. Add index for settlement filtering
CREATE INDEX "rentals_settlementStatus_idx" ON "rentals"("settlementStatus");
```

### Settlement Update DTO
```typescript
// apps/api/src/rentals/dto/update-settlement.dto.ts
import { IsEnum, IsOptional, IsInt, IsString, Min } from 'class-validator';

export enum SettlementStatus {
  NIEROZLICZONY = 'NIEROZLICZONY',
  CZESCIOWO_ROZLICZONY = 'CZESCIOWO_ROZLICZONY',
  ROZLICZONY = 'ROZLICZONY',
  ANULOWANY = 'ANULOWANY',
}

export class UpdateSettlementDto {
  @IsEnum(SettlementStatus)
  settlementStatus!: SettlementStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  settlementAmount?: number;

  @IsOptional()
  @IsString()
  settlementNotes?: string;
}
```

### Settlement Service Method
```typescript
// In rentals.service.ts
async updateSettlement(
  id: string,
  dto: UpdateSettlementDto,
): Promise<RentalWithRelations> {
  const rental = await this.prisma.rental.findUnique({ where: { id } });
  if (!rental) {
    throw new NotFoundException(`Rental with ID "${id}" not found`);
  }

  const settledAt = dto.settlementStatus === 'ROZLICZONY'
    ? new Date()
    : dto.settlementStatus === 'NIEROZLICZONY'
    ? null
    : rental.settledAt; // preserve existing for partial/cancelled

  return this.prisma.rental.update({
    where: { id },
    data: {
      settlementStatus: dto.settlementStatus,
      settlementAmount: dto.settlementAmount ?? null,
      settlementNotes: dto.settlementNotes ?? null,
      settledAt,
    },
    include: RENTAL_INCLUDE,
  });
}
```

### VAT Modal Component (Mobile)
```typescript
// In apps/mobile/app/return/[rentalId].tsx -- inside component, after rental loads
const [vatDismissed, setVatDismissed] = useState(false);

const vatMessage = rental?.vatPayerStatus === 'FULL_100'
  ? 'Klient jest platnikiem VAT (100%). Pamietaj o pobraniu faktury VAT lub potwierdzenia przy zwrocie pojazdu.'
  : rental?.vatPayerStatus === 'HALF_50'
  ? 'Klient jest platnikiem VAT (50%). Pamietaj o pobraniu odpowiedniej dokumentacji VAT przy zwrocie pojazdu.'
  : null;

const showVatModal = !!vatMessage && !vatDismissed;

// Render blocking modal using existing Modal + styling patterns
<Modal visible={showVatModal} transparent animationType="fade" statusBarTranslucent>
  <View style={overlayStyle}>
    <View style={dialogStyle}>
      <Text style={titleStyle}>Dokumentacja VAT</Text>
      <Text style={bodyStyle}>{vatMessage}</Text>
      <AppButton title="Rozumiem" onPress={() => setVatDismissed(true)} fullWidth />
    </View>
  </View>
</Modal>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A | Settlement fields on Rental model | Phase 38 (new) | No migration from old approach needed |
| N/A | Client-side VAT modal | Phase 38 (new) | Simple UI-only feature, no API |

No deprecated patterns to worry about. This phase introduces new fields and UI.

## Open Questions

1. **settledAt auto-update behavior**
   - What we know: settledAt should be set when status becomes ROZLICZONY
   - What's unclear: Should settledAt be cleared when moving back from ROZLICZONY to another status?
   - Recommendation: Clear settledAt when moving away from ROZLICZONY (fully reversible per locked decision). Re-set when moving back to ROZLICZONY.

2. **Settlement amount semantics for partial**
   - What we know: Amount is a single numeric field
   - What's unclear: For CZESCIOWO_ROZLICZONY, does the amount represent what was collected or the total owed?
   - Recommendation: Amount represents what was collected so far. This is simpler and matches the "collected amount" wording in decisions.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 |
| Config file | apps/api/jest config (in package.json) |
| Quick run command | `cd apps/api && npx jest --testPathPattern settlement -x` |
| Full suite command | `cd apps/api && npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ZWROT-02 | VAT modal shows for FULL_100/HALF_50 customers in return flow | manual-only | N/A (React Native UI, no web test runner) | N/A |
| ZWROT-03 | Settlement status can be updated via PATCH /rentals/:id/settlement | unit | `cd apps/api && npx jest rentals.service.spec -x` | Extend existing |
| ZWROT-04 | Settlement list returns filtered results with summary | unit | `cd apps/api && npx jest rentals.service.spec -x` | Extend existing |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern rentals -x`
- **Per wave merge:** `cd apps/api && npm test`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] Extend `apps/api/src/rentals/rentals.service.spec.ts` -- add settlement update + settlement query test cases
- [ ] ZWROT-02 is manual-only (mobile modal) -- verify by running Expo app and entering return flow for a VAT-paying rental

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `apps/api/prisma/schema.prisma` -- current Rental model, existing enums, migration patterns
- Codebase analysis: `apps/api/src/rentals/rentals.service.ts` -- existing service patterns, RENTAL_INCLUDE, transaction patterns
- Codebase analysis: `apps/web/src/app/(admin)/wynajmy/page.tsx` -- existing tabs, DataTable, filter patterns
- Codebase analysis: `apps/mobile/app/return/[rentalId].tsx` -- return wizard entry point for VAT modal injection
- Codebase analysis: `apps/mobile/src/components/ConfirmationDialog.tsx` -- existing modal pattern for mobile
- Codebase analysis: `packages/shared/src/types/rental.types.ts` -- VatPayerStatus enum, RentalDto interface

### Secondary (MEDIUM confidence)
- CONTEXT.md locked decisions -- settlement lifecycle, VAT reminder behavior, filter requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages, all existing patterns
- Architecture: HIGH -- direct extension of existing rental model and web/mobile patterns
- Pitfalls: HIGH -- well-understood domain, common migration/state pitfalls documented

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable domain, no external dependencies)
