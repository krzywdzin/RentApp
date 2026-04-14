# Phase 38: Settlement & VAT Notification - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Rental settlement lifecycle tracking in web admin panel + VAT collection reminder for mobile workers at vehicle return. Admin can track payment status per rental with amounts and notes. Worker gets a blocking VAT reminder at return start for VAT-paying customers.

</domain>

<decisions>
## Implementation Decisions

### Settlement lifecycle
- Four statuses: Nierozliczony → Częściowo rozliczony → Rozliczony → Anulowany
- Admin records: settlement status, collected amount (numeric), free-text notes
- Every rental starts as "Nierozliczony" automatically at creation (no extra action)
- Fully reversible — admin can change status in any direction (mistakes happen)
- Settlement data edited in rental detail view (not inline in list)

### VAT reminder trigger
- Blocking modal appears when worker opens the return flow in mobile app
- Shows for both 100% and 50% VAT payers (different message per rate)
- Worker just dismisses ("Rozumiem") — no tracking of whether VAT was actually collected
- Only triggers when `vatPayerStatus` is FULL_100 or HALF_50 (not NONE or null)

### Settlement list & filtering
- All four filters: settlement status, date range, customer name, vehicle registration
- Summary bar at top: count of unsettled rentals + total unsettled amount
- Filterable, sortable table with settlement-relevant columns

### Claude's Discretion
- Whether settlement lives as a tab in /wynajmy or a separate /rozliczenia page — choose best UX
- Exact modal text and styling for VAT reminder
- Summary bar layout and number formatting
- Table column order and default sort

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Settlement & VAT data model
- `packages/shared/src/types/rental.types.ts` — VatPayerStatus enum, rental type with vatPayerStatus field
- `apps/api/src/rentals/dto/create-rental.dto.ts` — Current rental DTO with vatPayerStatus validation
- `apps/api/src/rentals/rentals.service.ts` — Rental creation service (where settlement default status should be set)

### Web admin patterns
- `apps/web/src/app/(admin)/wynajmy/page.tsx` — Existing rentals list page (reuse pattern for settlement view)
- `apps/web/src/app/(admin)/klasy/page.tsx` — Dialog-based CRUD pattern (Phase 33)
- `apps/web/src/app/(admin)/ustawienia/page.tsx` — Settings page pattern (Phase 34)

### Mobile return flow
- `apps/mobile/src/stores/rental-draft.store.ts` — Draft store with vatPayerStatus field
- `packages/shared/src/schemas/rental.schemas.ts` — Shared Zod schemas for rental validation

### SMS/notifications
- `apps/api/src/notifications/` — Existing SMS service via smsapi.pl (used in Phase 37 for PDF password)

No external specs — requirements fully captured in decisions above and REQUIREMENTS.md (ZWROT-02, ZWROT-03, ZWROT-04).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VatPayerStatus` enum (FULL_100, HALF_50, NONE): Already in shared types, used in rental creation
- SMS service: Already integrated for password notifications (Phase 37), reusable for VAT reminders if needed
- Web admin table pattern: Existing paginated tables with filters in /wynajmy, /klienci, /pojazdy
- Rental detail page: Existing detail view where settlement section will be added

### Established Patterns
- Prisma schema + manual SQL migration (no shadow DB) — Phase 33/34/35/36 precedent
- Shared Zod schemas for validation between API and clients
- Web admin uses Next.js app router with (admin) layout group
- Dialog-based forms for CRUD operations (Phase 33 vehicle classes pattern)

### Integration Points
- Prisma schema: New settlement fields on Rental model (status enum, amount Decimal, notes String, settledAt DateTime)
- Rental detail page: New "Rozliczenie" section with status/amount/notes form
- Mobile return flow: VAT modal before return wizard steps
- API: New PATCH endpoint or extend existing rental update for settlement fields

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

- Tracking partial payments and deposits (ZWROT-F01 in v4.0 requirements)
- Push notifications for overdue settlements — potential future feature

</deferred>

---

*Phase: 38-settlement-vat-notification*
*Context gathered: 2026-04-14*
