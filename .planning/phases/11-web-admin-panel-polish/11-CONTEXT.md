# Phase 11: Web Admin Panel Polish - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase fixes UX gaps in the web admin panel: completing the user management page, wiring disconnected data (contract tab, rental columns), adding form validation, fixing audit filters, and standardizing the design system. No new pages or features beyond what's in WEBUX requirements.

</domain>

<decisions>
## Implementation Decisions

### User Management (WEBUX-01)
- Rewrite /uzytkownicy page to include: users DataTable with columns (name, email, role, status, actions), edit dialog, deactivate toggle, password reset action
- Use existing DataTable component pattern from other list pages (pojazdy, klienci, wynajmy)
- Use existing useUsers/useCreateUser hooks — add useUpdateUser, useDeactivateUser, useResetPassword mutations
- API already has PATCH /users/:id and admin endpoints — wire them to the UI
- User deactivation = soft toggle (isActive field), not deletion

### Data Display Fixes (WEBUX-02, WEBUX-03, WEBUX-06)
- Rental list columns: replace vehicleId.slice(0,8) with vehicle.registrationNumber, replace customerId.slice(0,8) with customer.firstName + customer.lastName
- This requires the rental list API to include vehicle and customer relations — check if API returns nested data or if we need to adjust the query
- Rental detail "Umowa" tab: call useContractByRental(rentalId) and render contract data (parties, dates, terms, signatures) instead of hardcoded "Brak umowy" text
- Customer and vehicle detail rental tabs: use Polish status labels (same mapping as admin columns), add loading state while rentals fetch

### Form Validation (WEBUX-04)
- Edit rental form: add zodResolver with Zod schema matching create form pattern, display formState.errors inline per field
- Validation rules: startDate required, endDate required and > startDate, dailyRateNet > 0, vatRate in valid range
- Extend dialog: validate newEndDate > current endDate, show inline error in dialog

### Audit Filters (WEBUX-05)
- Wire dateFrom/dateTo from AuditFilterBar to AuditTrail component and through to useAudit hook
- Add dateFrom/dateTo to AuditFilters interface and URL query params
- Replace actor text input with a dropdown populated from useUsers hook (show user name, pass userId)

### Error States (WEBUX-07)
- Dashboard: add isError check with retry for useVehicles/useRentals, show error card with "Nie udalo sie zaladowac" + retry button
- Contract list: add error state to useContracts, show error card
- Entity detail pages: add error state check to rental tabs

### Design System Consistency (WEBUX-08)
- Login page: replace raw <input> elements with shadcn/ui <Input> component and <Label> component
- Use the same form pattern as other forms in the app (react-hook-form where applicable)

### Claude's Discretion
- Exact column ordering in user management DataTable
- Error card layout and styling details
- Whether to add breadcrumbs to list pages (low priority, skip if not needed)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataTable` component at `apps/web/src/components/ui/data-table.tsx`
- shadcn/ui components: Input, Label, Button, Card, Badge, Dialog, Select, Tabs
- `useUsers` hook at `apps/web/src/hooks/queries/use-users.ts`
- `useContractByRental` hook at `apps/web/src/hooks/queries/use-contracts.ts`
- `useAudit` hook at `apps/web/src/hooks/queries/use-audit.ts`
- Zod schemas from `@rentapp/shared`
- React Hook Form with zodResolver pattern used in create forms

### Established Patterns
- Page layout: Card > CardHeader + CardContent, with DataTable inside
- Form pattern: useForm + zodResolver + FormField + FormMessage for validation
- Error toast: toast.error('Polish message')
- Mutation pattern: useMutation + queryClient.invalidateQueries on success
- Polish status labels: defined in columns.tsx files (rentalColumns, vehicleColumns)

### Integration Points
- `apps/web/src/app/(admin)/uzytkownicy/page.tsx` — rewrite with DataTable
- `apps/web/src/app/(admin)/wynajmy/columns.tsx` — fix column accessors
- `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` — wire Umowa tab
- `apps/web/src/app/(admin)/wynajmy/[id]/edytuj/page.tsx` — add validation
- `apps/web/src/app/(admin)/audyt/page.tsx` + `filter-bar.tsx` — wire date filters
- `apps/web/src/app/(admin)/page.tsx` — add error state
- `apps/web/src/app/login/page.tsx` — use design system components
- `apps/web/src/hooks/queries/use-audit.ts` — add date filter params
- `apps/web/src/app/(admin)/klienci/[id]/page.tsx` — Polish labels + loading
- `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` — Polish labels + loading

</code_context>

<specifics>
## Specific Ideas

No specific requirements — apply standard admin panel UX patterns following existing shadcn/ui conventions.

</specifics>

<deferred>
## Deferred Ideas

- Breadcrumbs on list pages — cosmetic, not blocking
- Sidebar hydration flash fix — SSR-specific, low impact

</deferred>
