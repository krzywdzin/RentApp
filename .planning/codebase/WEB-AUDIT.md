# Web Admin Panel — Quality & Concerns Audit

**Analysis Date:** 2026-03-27
**Scope:** `apps/web/src/`

---

## 1. TypeScript / Type Safety Issues

### 1.1 Unsafe `as` casts on every form submit
- **Files:**
  - `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx` — line 76: `data as UpdateVehicleInput`
  - `apps/web/src/app/(admin)/pojazdy/nowy/page.tsx` — line 67: `data as CreateVehicleInput`
  - `apps/web/src/app/(admin)/klienci/nowy/page.tsx` — line 54: `cleaned as CreateCustomerInput`
  - `apps/web/src/app/(admin)/klienci/[id]/edytuj/page.tsx` — line 62: `cleaned as UpdateCustomerInput`
- **Impact:** Bypasses the type-checker. If the Zod schema and the DTO type drift, runtime errors will not be caught at compile time.
- **Fix:** Use `zodResolver` output types that match the DTO directly (use `z.output<typeof Schema>` as the mutation type, not `z.input`).

### 1.2 Duplicate local `type UpdateFormValues` defined inside component function
- **File:** `apps/web/src/app/(admin)/pojazdy/nowy/page.tsx` — line 47: `type FormValues = z.input<typeof CreateVehicleSchema>` declared **inside** `NewVehiclePage` function body.
- **Impact:** Type is re-evaluated on every render; minor lint/style issue but unusual.

### 1.3 `useParams()` without type parameter on rental detail page
- **File:** `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` — line 61: `const params = useParams();` (no generic), then `params.id as string` cast on line 63.
- **Impact:** If `params.id` is ever `string[]` (catch-all routes) the cast silently passes an array.
- **Fix:** `useParams<{ id: string }>()` to match all other detail pages.

### 1.4 `RentalWithRelations` interface defined twice in different files
- **Files:**
  - `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` — lines 7–10
  - `apps/web/src/app/(admin)/wynajmy/columns.tsx` — lines 12–15
- **Impact:** Types can diverge silently. If `vehicle` or `customer` shape changes, only one file may be updated.
- **Fix:** Extract to a shared types file (`apps/web/src/types/rental.ts`) and import it.

### 1.5 Untyped `contractData` cast
- **File:** `apps/web/src/app/(admin)/umowy/[id]/page.tsx` — lines 53–58: `contract.contractData as Record<string, unknown> | null` followed by multiple `as Record<string, string>` and `as Record<string, unknown>` casts.
- **Impact:** Any mismatch in shape is invisible to TypeScript. If the API changes the structure, the page will render incorrectly with no error.

### 1.6 `as unknown as Resolver<FormValues>` cast
- **File:** `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` — line 66: `zodResolver(formSchema) as unknown as Resolver<FormValues>`.
- **Impact:** Forces the resolver through `unknown` — this is a workaround for a Zod/RHF type mismatch that hides a real incompatibility (likely a Zod version mismatch with `@hookform/resolvers`). The root cause should be fixed.

### 1.7 `setValue('customerId', '' as unknown as string)`
- **File:** `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` — line 153.
- **Impact:** Sets a string field to empty string via `unknown` cast — works at runtime but suppresses type errors. An empty string is not a valid UUID and will fail server-side validation.

### 1.8 `type UpdateFormValues = z.input<typeof UpdateVehicleSchema>` / `import type { z } from 'zod'` ordering
- **File:** `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx` — lines 7–11: `type UpdateFormValues` is declared after the `import type { z }` line but before other imports. This creates a confusing import split.

---

## 2. Missing Error Handling

### 2.1 No error state on vehicle detail page
- **File:** `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` — line 63: `useVehicle` only destructures `data` and `isLoading`. `isError` is not destructured.
- **Impact:** If the request fails the page renders `Nie znaleziono pojazdu.` (the "not found" fallback) — there is no way for the user to tell if the vehicle simply does not exist or if a network error occurred, and no retry button.

### 2.2 No error state on customer detail page
- **File:** `apps/web/src/app/(admin)/klienci/[id]/page.tsx` — same pattern as above, `isError` never captured.

### 2.3 No error state on rental edit page
- **File:** `apps/web/src/app/(admin)/wynajmy/[id]/edytuj/page.tsx` — line 53: only `data` and `isLoading` destructured from `useRental`.

### 2.4 No error state on contract detail page
- **File:** `apps/web/src/app/(admin)/umowy/[id]/page.tsx` — line 34: only `data` and `isLoading` from `useContract`.

### 2.5 No error handling for `foto` documentation page
- **File:** `apps/web/src/app/(admin)/wynajmy/[id]/dokumentacja/page.tsx` — lines 37–43: `photoQuery.isLoading` is handled, but `photoQuery.isError` is never checked. A failed photo load is indistinguishable from a rental with no photos.
- Damage tab (lines 48–52): `damageQuery.isError` is not handled — `<DamageComparison data={damageQuery.data} />` is rendered with `undefined` data on error, relying on the `if (!data)` guard inside the component.

### 2.6 `createRental.mutateAsync` without error catch in submit handler
- **File:** `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` — line 100: `await createRental.mutateAsync(...)`. The `onError` in the mutation hook shows a toast, but because `mutateAsync` re-throws, an uncaught promise rejection is also produced. The `onSubmit` function is `async` but has no `try/catch`.
- **Impact:** React Query 5 / `handleSubmit` silently swallows the rejection, but it can cause confusing behavior.

### 2.7 Empty `catch {}` block in portal auth
- **File:** `apps/web/src/hooks/use-portal-auth.ts` — lines 35–37 (`checkAuth`) and line 71 (`exchangeToken`): catch blocks discard the error entirely.
- **Impact:** Network errors during initial portal auth check are silently swallowed.

### 2.8 Proxy route swallows non-JSON responses
- **File:** `apps/web/src/app/api/[...path]/route.ts` — line 22: `.catch(() => ({}))` on `res.json()`. If the backend returns a non-JSON error (e.g., 502, plain-text error), the frontend receives `{}` with the correct status code but no usable message.

### 2.9 `useUsersForFilter` in audit filter bar has no error state
- **File:** `apps/web/src/app/(admin)/audyt/filter-bar.tsx` — lines 22–28: error is never consumed. If the users list fails to load, the actor dropdown silently shows only "Wszyscy".

---

## 3. Accessibility Issues

### 3.1 Interactive `div` elements with `onClick` without keyboard support
- **File:** `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` — lines 207–219: rental history items are `<div onClick={() => router.push(...)}>` with `cursor-pointer` but no `role`, `tabIndex`, or `onKeyDown`.
- **File:** `apps/web/src/app/(admin)/klienci/[id]/page.tsx` — lines 157–169: same pattern for rental history items.
- **Impact:** Keyboard-only users and screen readers cannot activate these navigation targets.

### 3.2 Collapsible card header not accessible
- **File:** `apps/web/src/app/(admin)/uzytkownicy/page.tsx` — line 163: `<CardHeader className="cursor-pointer" onClick={() => setFormOpen(!formOpen)}>`. No `role="button"`, no `tabIndex`, no `aria-expanded`, no keyboard handler.
- **Impact:** Cannot be activated by keyboard; screen readers do not announce it as interactive.

### 3.3 Filter bar labels using `<label>` without `htmlFor`
- **File:** `apps/web/src/app/(admin)/audyt/filter-bar.tsx` — lines 65, 85: plain `<label>` elements without `htmlFor` wrapping their Select components. The Shadcn `<Select>` renders a `<button>` trigger — there is no native `<select>` to associate a `<label>` with.
- **Impact:** Screen readers do not announce the label when the select is focused.
- **Fix:** Use `<Label>` (from `@/components/ui/label`) with `id` on the `SelectTrigger` and `htmlFor` on the label, or use `aria-label`.

### 3.4 Calendar view rental blocks have no keyboard access
- **File:** `apps/web/src/app/(admin)/wynajmy/calendar-view.tsx` — lines 236–249: rental blocks are `<div onClick>` with no `role`, `tabIndex`, or keyboard handler.
- **Impact:** Calendar is completely inaccessible by keyboard.

### 3.5 `TopBar` logout button has tooltip but button itself has no `aria-label`
- **File:** `apps/web/src/components/layout/top-bar.tsx` — line 36: `<Button variant="ghost" size="icon" onClick={logout}>` with only `<LogOut>` icon and tooltip — no `aria-label` attribute on the button.
- **Impact:** Screen reader announces "button" with no context.

### 3.6 Customer search dropdown is not keyboard-navigable
- **File:** `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` — lines 166–189: custom `<div>` dropdown with `<button>` items but no `role="listbox"` / `role="option"`, no focus management (first result not focused on open), no `aria-haspopup`, no `aria-expanded` on the search input.
- **Impact:** Screen readers do not recognise this as a combobox; users cannot navigate results with arrow keys.

### 3.7 Search input in vehicle filter bar has no accessible label
- **File:** `apps/web/src/app/(admin)/pojazdy/filter-bar.tsx` — lines 43–49: `<Input placeholder="Szukaj po rejestracji lub VIN...">` with no `<label>` or `aria-label`. The `<Search>` icon is decorative but adds no accessible name to the input.

### 3.8 Damage SVG diagram pins have no keyboard tooltip trigger
- **File:** `apps/web/src/components/photos/damage-comparison.tsx` — lines 228–258: `<Tooltip>` wraps a `<g>` SVG element. SVG `<g>` elements are not focusable by default. The tooltip only appears on mouse hover; keyboard users cannot access damage info.

---

## 4. Missing Loading States

### 4.1 No loading skeleton for contracts page
- **File:** `apps/web/src/app/(admin)/umowy/page.tsx` — lines 94–104: `<DataTable isLoading={isLoading}>` handles loading internally, but the page header and filter select are rendered immediately with the status filter showing before data is known. The empty state at line 86 (`!isLoading && filtered.length === 0`) can flash briefly before data arrives.

### 4.2 No loading state on edit vehicle page when vehicle not found
- **File:** `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx` — lines 81–89: if `isLoading` is false and `vehicle` is `undefined` (fetch failed or 404), the page renders `null` without any message (the loading check is `if (isLoading) return skeleton` — anything else falls through to the form which reads `vehicle?.registration ?? '...'` and shows a blank form).

### 4.3 No loading state for the new user form user creation
- **File:** `apps/web/src/app/(admin)/uzytkownicy/page.tsx` — lines 127–147: `handleSubmit` uses raw `fetch` (not the `useCreateUser` mutation hook). After user creation succeeds, the users table is not refreshed (no `queryClient.invalidateQueries` call). The new user won't appear without a manual page refresh.

### 4.4 No vehicle list loading state on new rental form
- **File:** `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` — line 49: `const { data: vehicles } = useVehicles()` — no `isLoading` consumed. While vehicles load, the select dropdown shows empty options silently.

---

## 5. Form Validation Gaps

### 5.1 `dailyRateNet` is optional in new rental form
- **File:** `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` — line 35: `dailyRateNet: z.number().int().min(0).optional()`. The server-side schema likely requires a rate. A user can submit a rental without a rate, which will fail server-side with a generic error.

### 5.2 New rental form submit ignores `overrideConflict`
- **File:** `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` — line 97: `overrideConflict: false` is hardcoded. There is no UI to retry with `overrideConflict: true` after a 409 conflict response. The user sees an error toast and must manually adjust dates/vehicle with no guidance.

### 5.3 Extend rental dialog: no minimum date validation
- **File:** `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` — lines 106–121: `handleExtend()` only checks `if (!newEndDate) return`. No validation that the new end date is after the current end date.
- **Impact:** An employee can "extend" a rental to a date in the past, which will fail server-side.

### 5.4 Return mileage: no minimum validation against current mileage
- **File:** `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` — lines 123–138: `handleReturn()` validates `mileage >= 0` but does not validate against the vehicle's current mileage. An employee can enter a return mileage lower than the vehicle's odometer, which will fail silently.

### 5.5 PESEL field has `maxLength={11}` but no format validation in UI
- **File:** `apps/web/src/app/(admin)/klienci/nowy/page.tsx` — line 163: `maxLength={11}` only prevents overly long input. PESEL digit-only validation and checksum are left entirely to server-side.
- **File:** `apps/web/src/app/(admin)/klienci/[id]/edytuj/page.tsx` — line 181: same.

### 5.6 Edit user dialog has no validation
- **File:** `apps/web/src/app/(admin)/uzytkownicy/page.tsx` — lines 149–155 (`handleEditSave`): no validation before calling `updateUser.mutate`. The `editName` could be empty; the `editRole` could be empty (default state).

### 5.7 `year` / `seatCount` / `mileage` numeric inputs default to `0` on clear
- **Files:**
  - `apps/web/src/app/(admin)/pojazdy/nowy/page.tsx` — lines 152, 235, 252: `parseInt(e.target.value) || 0`.
  - `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx` — lines 178, 261, 280: same.
- **Impact:** If the user clears the field and submits, the value sent is `0`, which is a valid integer but not a valid year/mileage. The validation schema should catch it, but the UX shows no error in the input because `0` is technically `number`.

---

## 6. Security / XSS Concerns

### 6.1 Proxy route does not validate or sanitise the path segment
- **File:** `apps/web/src/app/api/[...path]/route.ts` — line 6: `request.nextUrl.pathname.replace(/^\/api/, '')`. No validation of the resulting path. A crafted URL like `/api/../../../etc/passwd` could potentially traverse paths depending on the backend.
- **Mitigation:** The Next.js URL normalisation is expected to handle `..` segments, but this should be explicitly tested and documented.

### 6.2 Portal `token` URL parameter is stripped client-side only
- **File:** `apps/web/src/app/(portal)/portal/components/token-exchange.tsx` — lines 23–26: `window.history.replaceState` removes the token from the URL after a successful exchange. However, before the JS runs, the token is visible in the URL, may be logged by the server, and is stored in browser history and referrer headers (`referrer: 'no-referrer'` in the portal layout partially mitigates referrer leakage).
- **Impact:** Token is in browser history until `replaceState` runs. If the user copies the URL or the exchange fails, the token persists in the address bar.

### 6.3 CSV export does not sanitise formula injection
- **File:** `apps/web/src/lib/csv-export.ts` — lines 8–18: values are escaped for quotes and delimiters, but not for CSV formula injection (values starting with `=`, `+`, `-`, `@`, `\t`, `\r`).
- **Impact:** If a vehicle registration or customer name begins with `=` (unlikely but possible), opening the CSV in Excel executes a formula. This is a low-severity issue but a known CSV injection vector.

### 6.4 `vehicle.notes` rendered without sanitisation in detail page
- **File:** `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` — line 180: `<p className="text-sm whitespace-pre-wrap">{vehicle.notes}</p>`. React escapes HTML by default so XSS is not possible through this path — this is correctly handled.

---

## 7. Missing Pagination

### 7.1 Customers page fetches all customers with no server-side pagination
- **File:** `apps/web/src/hooks/queries/use-customers.ts` — line 21: `apiClient<CustomerDto[]>('/customers')`. The entire customer list is fetched, then filtered and paginated client-side.
- **File:** `apps/web/src/app/(admin)/klienci/customers-page.tsx` — line 42.
- **Impact:** With hundreds of customers the initial load is slow and memory usage is high.

### 7.2 Vehicles page fetches all vehicles with no server-side pagination
- **File:** `apps/web/src/hooks/queries/use-vehicles.ts` — line 20: `apiClient<VehicleDto[]>('/vehicles')`.
- Same impact as above.

### 7.3 Rentals page fetches all rentals with no server-side pagination
- **File:** `apps/web/src/hooks/queries/use-rentals.ts` — lines 26–36: full list fetched, paginated manually client-side in `wynajmy/page.tsx` lines 39–44.
- **Impact:** This is the most critical — rentals will grow fastest; a busy company could have thousands of records.

### 7.4 Contracts page has the same pattern
- **File:** `apps/web/src/hooks/queries/use-contracts.ts` (not explicitly read but `useContracts()` is called in `umowy/page.tsx` line 29 and paginated client-side lines 46–51).

---

## 8. Inconsistent UI Patterns

### 8.1 `statusConfig` dictionary duplicated between vehicles list and vehicle detail
- **Files:**
  - `apps/web/src/app/(admin)/pojazdy/columns.tsx` — lines 18–27
  - `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` — lines 27–36
- Both define the same `statusConfig` object. If a new status is added, it must be updated in both places.

### 8.2 `InfoRow` component defined twice
- **Files:**
  - `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` — lines 51–57
  - `apps/web/src/app/(admin)/klienci/[id]/page.tsx` — lines 26–33
- Both define an identical `InfoRow` component locally. Should be extracted to `src/components/ui/info-row.tsx`.

### 8.3 `fuelTypeOptions` / `transmissionOptions` duplicated between new and edit vehicle pages
- **Files:**
  - `apps/web/src/app/(admin)/pojazdy/nowy/page.tsx` — lines 30–45
  - `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx` — lines 34–45
- Same constant arrays defined twice. Should be in a shared constants file.

### 8.4 Error display style inconsistent
- Rentals page uses a border-destructive `<div>` with a "Ponow probe" button.
- Dashboard uses a `<Card>` with `border-destructive`.
- Vehicles and customers pages use a `<div>` with border-destructive.
- Contracts page uses `<Card>` but without a retry button.
- There is no shared `<ErrorState>` component.

### 8.5 Empty-state display inconsistent
- Rentals page: centred with two lines of text.
- Customers page: centred with icon-less text inside `<TableCell>`.
- Vehicles page: simple "Brak pojazdow" text inside `<TableCell>`.
- Audit trail: centred with two lines outside table.
- No shared `<EmptyState>` component.

### 8.6 Button icon spacing inconsistent
- Some buttons use `<Icon className="mr-2 h-4 w-4" />` (rental detail page actions).
- Some buttons use `<Icon className="h-4 w-4" />` with a space (vehicles page header "Dodaj pojazd").
- The `<Button>` component should handle icon spacing via a gap utility.

### 8.7 Dashboard uses `text-[28px]` hard-coded font size
- **File:** `apps/web/src/app/(admin)/page.tsx` — line 66: `text-[28px]`.
- All other page `<h1>` elements use `text-2xl`. This is visually slightly different from the system.

### 8.8 Portal error styling uses raw Tailwind red colours
- **File:** `apps/web/src/app/(portal)/portal/[rentalId]/page.tsx` — line 35: `border-red-200 bg-red-50 text-red-700`.
- Admin panel uses `border-destructive text-destructive` (theme-aware). The portal uses hardcoded colours that do not respond to dark/light mode or theme changes.

---

## 9. Missing Error Boundaries

### 9.1 No `ErrorBoundary` anywhere in the application
- **File:** `apps/web/src/app/layout.tsx` — line 13: `<Providers>` wraps the app but no `ErrorBoundary` is present.
- **File:** `apps/web/src/app/(admin)/layout.tsx` — no error boundary.
- **Impact:** An unhandled JavaScript error in any component tree will crash the entire page with a blank/white screen and no user-facing recovery path. Next.js provides a `global-error.tsx` mechanism that is unused.
- Audit trail (`apps/web/src/components/audit/audit-trail.tsx`) renders `ChangesTable` with `entry.changesJson!` (non-null assertion on line 291) — if `changesJson` is malformed, this throws and crashes the page.

---

## 10. Token Refresh Issues

### 10.1 `refreshPromise` is a module-level variable (shared across all requests)
- **File:** `apps/web/src/lib/api-client.ts` — line 13: `let refreshPromise: Promise<boolean> | null = null`.
- **Impact:** This is intentional (de-duplication of concurrent refresh requests) and works correctly in a browser (single tab). However, in a server-side Next.js context (server components, server actions) this module-level variable is shared across all requests and users, which would be a critical bug. Currently all fetches happen client-side so this is not triggered — but the pattern is fragile.

### 10.2 After a failed refresh, the user is redirected via `window.location.href`
- **File:** `apps/web/src/lib/api-client.ts` — lines 51–52: `window.location.href = '/login'`.
- **Impact:** This causes a hard navigation that loses any unsaved form state. A softer approach using Next.js router would be preferable. Also, any pending React Query mutations are cancelled without user notification.

### 10.3 `device_id` cookie is not refreshed after token rotation
- **File:** `apps/web/src/app/api/auth/refresh/route.ts` — lines 45–53: the response only sets new `access_token` and `refresh_token` cookies. The `device_id` cookie is not re-set. If `device_id` expires (its `maxAge` is 24h, set at login), the refresh call will fail with 401 because the backend receives no device ID — logging out the user unexpectedly.

---

## 11. Missing Search / Filter Functionality

### 11.1 Rentals page has no text search
- **File:** `apps/web/src/app/(admin)/wynajmy/page.tsx`: only status and date range filters exist. There is no way to search by vehicle registration or customer name from the rentals list. The user must know the exact date range or remember the status.

### 11.2 Contracts page has no text search
- **File:** `apps/web/src/app/(admin)/umowy/page.tsx`: only status filter. No search by contract number, customer name, or vehicle.

### 11.3 Vehicle filter does not include model/make
- **File:** `apps/web/src/app/(admin)/pojazdy/vehicles-page.tsx` — line 73–79: search matches `registration` and `vin` but not `make` or `model`.
- **File:** `apps/web/src/app/(admin)/pojazdy/filter-bar.tsx` — placeholder says "rejestracji lub VIN" which matches the implementation, but users expect to be able to search by car brand.

### 11.4 Users page has no search or filtering
- **File:** `apps/web/src/app/(admin)/uzytkownicy/page.tsx`: no search input, no active/inactive filter in the users table.

---

## 12. State Management Problems

### 12.1 User creation in `uzytkownicy/page.tsx` does not invalidate React Query cache
- **File:** `apps/web/src/app/(admin)/uzytkownicy/page.tsx` — lines 127–147: user creation uses raw `fetch` instead of the query hook system. On success (line 138), `queryClient.invalidateQueries` is never called. The users table will not refresh after a new user is created.

### 12.2 Pagination state not reset when status filter changes in rentals/contracts pages
- **File:** `apps/web/src/app/(admin)/wynajmy/page.tsx` — `setStatusFilter` and `setDateFrom/setDateTo` do not reset `pagination` back to page 0. If the user is on page 3 and changes the filter, they stay on page 3 of the new result set, which may be empty.
- **File:** `apps/web/src/app/(admin)/umowy/page.tsx` — same issue, `setStatusFilter` does not reset pagination.

### 12.3 Audit trail `expandedRows` is a `Set` stored in state, reset on filter change
- **File:** `apps/web/src/components/audit/audit-trail.tsx` — lines 56–57: `expandedRows` is tied to component state. When the audit limit changes (line 183), `setOffset(0)` is called which causes a re-render — but the `expandedRows` set is not cleared. Expanded rows from the previous page appear "expanded" (though visually empty) on the new page if row IDs reappear.

### 12.4 `bulkStatusDialog` state persists stale `selectedVehicles` count
- **File:** `apps/web/src/app/(admin)/pojazdy/vehicles-page.tsx` — lines 311–313: the dialog title reads "Zmienic status {selectedVehicles.length} pojazdow?" — if the user changes selection after opening the dialog (edge case), the dialog title will be stale because it reads from `selectedVehicles` which is derived from the current selection state.

---

## 13. Performance Issues

### 13.1 `getVehicleColumns` creates new column definitions in `useMemo` but `router` changes reference every render
- **File:** `apps/web/src/app/(admin)/pojazdy/vehicles-page.tsx` — lines 82–90: `useMemo(() => getVehicleColumns(...), [router])`. `useRouter()` returns a stable reference in App Router, so this is fine — but `router` is listed as a dependency unnecessarily (it never changes).

### 13.2 `filteredData` recomputation includes entire vehicle/customer list on every search keystroke
- **Files:**
  - `apps/web/src/app/(admin)/pojazdy/vehicles-page.tsx` — lines 70–80
  - `apps/web/src/app/(admin)/klienci/customers-page.tsx` — lines 51–61
- The filter is wrapped in `useMemo` correctly, but because all data is fetched client-side (see §7), the filter runs over potentially thousands of records on every keystroke. Server-side search (passing `q` as a query param) would be more scalable.

### 13.3 Calendar fetches a fresh query on every navigation (no stale time)
- **File:** `apps/web/src/hooks/queries/use-rentals.ts` — lines 46–55: `useRentalCalendar` uses the global `staleTime: 30_000` from providers. However, the calendar query key includes `from` and `to` ISO strings — each navigation (`handlePrev`, `handleNext`) generates a new key so the previous window's data is never reused. The user always sees a skeleton on navigation.

### 13.4 `useBulkUpdateVehicles` fires N parallel PATCH requests
- **File:** `apps/web/src/hooks/queries/use-vehicles.ts` — lines 87–108: `Promise.all(ids.map(...))`. With 50 selected vehicles, this fires 50 concurrent PATCH requests. The API has no bulk endpoint.
- **Impact:** Can overwhelm the API; the browser connection limit may throttle requests; any single failure causes the whole `Promise.all` to reject and leaves the UI in an inconsistent state (some vehicles updated, some not).

### 13.5 `paginatedData` in users page sorts the full array on every render
- **File:** `apps/web/src/app/(admin)/uzytkownicy/page.tsx` — lines 90–106: `useMemo` wraps the sort+slice correctly, but is triggered on `users`, `sorting`, and `pagination` — the full sort runs even on simple pagination changes where the sort order has not changed.

---

## 14. Missing Responsive Design

### 14.1 Top action bar on vehicle detail page overflows on small screens
- **File:** `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` — lines 96–112: header row is `flex items-center justify-between` with potentially 3 buttons ("Edytuj", "Usun") plus a heading and badge. No wrapping or responsive collapse.

### 14.2 Rental detail page action buttons will overflow on mobile
- **File:** `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` — lines 169–212: up to 5 action buttons ("Dokumentacja", "Edytuj", "Aktywuj", "Przedluz", "Cofnij status") in a single `flex` row. On screens narrower than ~600px these will overflow or stack awkwardly.

### 14.3 Calendar view is fixed-width and not scrollable on small screens
- **File:** `apps/web/src/app/(admin)/wynajmy/calendar-view.tsx` — lines 104–163: the calendar uses fixed pixel widths (`VEHICLE_COL_WIDTH = 200`, `dayWidth = 80` for 14 days = 1120px minimum). The scrollable timeline (`flex-1 overflow-x-auto`) handles horizontal scrolling, but the vehicle name column at 200px is too wide for a mobile viewport.

### 14.4 Audit trail table has no horizontal scroll on small screens
- **File:** `apps/web/src/components/audit/audit-trail.tsx` — lines 150–174: the audit table wraps in `rounded-md border` with no `overflow-x-auto`. On narrow screens the table will overflow the viewport.

### 14.5 Filter bar in audit page uses `flex-wrap` but inputs have fixed widths
- **File:** `apps/web/src/app/(admin)/audyt/filter-bar.tsx` — lines 107–119: date inputs have `className="h-9 w-36"` which on small screens means the "Od" and "Do" inputs may squeeze together but the parent `flex-wrap` container wraps correctly. The `w-48` actor select is a fixed width. These could be improved with responsive `w-full sm:w-auto` patterns.

---

## 15. Dead Code / Unused Imports

### 15.1 `userColumns` export alias is unused
- **File:** `apps/web/src/app/(admin)/uzytkownicy/columns.tsx` — line 104: `export const userColumns = getUserColumns`. This alias is never imported anywhere (the consumer on line 36 of `uzytkownicy/page.tsx` imports `getUserColumns` directly).

### 15.2 `type UpdateVehicleInput` imported but not directly used as a type annotation
- **File:** `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx` — line 7: `import { UpdateVehicleSchema, type UpdateVehicleInput } from '@rentapp/shared'`. `UpdateVehicleInput` is only used in a cast on line 76 (`data as UpdateVehicleInput`), not as a standalone type annotation. The cast could be avoided (see §1.1).

### 15.3 `useEffect` imported but only used for side effects that could be `useLayoutEffect`
- Minor style concern — `useEffect` in `Sidebar` (line 3 of `sidebar.tsx`) reads `localStorage` synchronously. This causes a flash of the expanded state before the collapsed state is restored. `useLayoutEffect` or reading localStorage during initial `useState` initialisation would prevent the flash.

### 15.4 `contractStatusLabel` function defined when `contractStatusLabels` lookup already handles it
- **File:** `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx` — lines 56–58: `contractStatusLabel(status)` is a wrapper around `contractStatusLabels[status] || status`. The function adds no value and could be replaced with the direct lookup.

---

## 16. CSS / Styling Issues

### 16.1 Dark mode hardcoded for entire app
- **File:** `apps/web/src/app/layout.tsx` — line 15: `<html lang="pl" className="dark">`. The dark class is permanently applied. Users cannot switch to light mode. This is an intentional product decision but should be documented and is a potential accessibility concern for users who prefer light mode.

### 16.2 Portal layout uses `bg-slate-50` which does not work in dark mode
- **File:** `apps/web/src/app/(portal)/layout.tsx` — line 12: `className="min-h-screen bg-slate-50"`. Since the root `<html>` has `className="dark"`, `bg-slate-50` renders as a near-white background in dark mode — the portal looks visually disconnected from the rest of the app. Should use `bg-background`.

### 16.3 Calendar rental blocks use hardcoded hex colours
- **File:** `apps/web/src/app/(admin)/wynajmy/calendar-view.tsx` — lines 16–21: `STATUS_COLORS` uses Tailwind class names (`bg-green-600`) applied via `className` on a `<div>`. This is fine for Tailwind JIT, but the colours are not linked to the design system tokens. If the success/warning colours change in the theme, the calendar will not update.

### 16.4 Damage pin colours are hardcoded hex values
- **File:** `apps/web/src/components/photos/damage-comparison.tsx` — lines 26–32: `SEVERITY_PIN_COLORS` and `PRE_EXISTING_COLOR` are hardcoded hex values used in SVG `fill` attributes. These cannot reference CSS variables or Tailwind tokens. They will always be the same in dark and light mode.

### 16.5 Active sidebar item uses `border-l-[3px]` which shifts content
- **File:** `apps/web/src/components/layout/sidebar.tsx` — line 85: `border-l-[3px] border-primary`. Adding a 3px left border to active items pushes the icon/text 3px to the right relative to inactive items, causing a visual jump when navigating between pages. Should use `outline` or a pseudo-element instead.

---

## 17. Portal-Specific Issues

### 17.1 Portal page re-fetches auth on every mount
- **File:** `apps/web/src/hooks/use-portal-auth.ts` — lines 40–42: `checkAuth()` is called in `useEffect` on every mount. The portal page and the portal detail page both instantiate their own `usePortalAuth()` calls — each navigating between them triggers a new `/api/portal/me` fetch. There is no shared state (context or query cache) for portal auth.

### 17.2 `PortalContent` renders `null` when unauthenticated (no message)
- **File:** `apps/web/src/app/(portal)/portal/page.tsx` — lines 34–37: if `!isAuthenticated`, `return null`. The user sees a blank page with no explanation of how to access the portal (e.g., "Use the link from your email").

### 17.3 Portal `metadata` title references "KITEK" brand name
- **File:** `apps/web/src/app/(portal)/layout.tsx` — lines 5–7: `title: 'KITEK - Portal Klienta'` and footer text. "KITEK" appears to be a placeholder/test brand name that was not replaced with the actual company name. This will show in browser tabs and search results.

---

## 18. Additional Minor Issues

### 18.1 `formatDate` / `formatDateTime` will throw on invalid date strings
- **File:** `apps/web/src/lib/format.ts` — lines 4 and 8: `format(new Date(date), ...)`. If `date` is `null`, `undefined`, or an invalid ISO string, `new Date(date)` returns `Invalid Date` and `date-fns` `format` throws.
- **Impact:** Any field where the backend might return `null` for a date (e.g., `idIssuedDate`) that gets passed to `formatDate` will crash the component tree.

### 18.2 `AuditRow` uses non-null assertion `entry.changesJson!`
- **File:** `apps/web/src/components/audit/audit-trail.tsx` — line 291: `<ChangesTable changes={entry.changesJson!} />`. The `hasChanges` guard on line 240 checks for null/undefined and non-empty, so the assertion is safe in practice — but it is brittle. If the condition is ever refactored, the assertion could cause a runtime error.

### 18.3 `getInitials` function duplicated in two files
- **Files:**
  - `apps/web/src/components/layout/top-bar.tsx` — lines 9–15
  - `apps/web/src/components/dashboard/activity-feed.tsx` — lines 24–31
- Identical implementation duplicated. Should be extracted to `src/lib/utils.ts`.

### 18.4 `date-fns/locale/pl` imported with full path (not default export)
- **Files:** multiple files import `import { pl } from 'date-fns/locale/pl'`. This is correct for date-fns v3 but is worth noting as a consistency check — ensure all files use the same import style.

### 18.5 `nuqs` query state in vehicle filter bar not synced back to parent on mount
- **File:** `apps/web/src/app/(admin)/pojazdy/filter-bar.tsx` — lines 34–38: the `useEffect` that syncs `statusParam` calls `onStatusChange(statusParam)` — this fires on mount with the default value from the URL. If the URL has `?status=RENTED`, the filter initialises correctly. However, `localSearch` is initialised from `searchParam` (line 23), which is correct. The parent `VehiclesPage` initialises `search` state as `''` (line 58) — so there's a brief moment where the filter bar shows a search term but the parent has not yet applied it, causing a flash of unfiltered data.

---

*Web admin panel quality audit: 2026-03-27*
