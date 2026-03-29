# Phase 31: Vehicle Import - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Add vehicle import UI to web admin panel. API backend is already fully implemented (POST /vehicles/import, GET /vehicles/import/template). This phase is frontend + BFF proxy fix only.

</domain>

<decisions>
## Implementation Decisions

### BFF Proxy Fix
- Fix `apps/web/src/app/api/[...path]/route.ts` to detect multipart/form-data requests and forward raw body with original Content-Type header (don't force application/json)
- When incoming Content-Type is multipart/form-data: pass request body as-is, preserve Content-Type with boundary

### Import UI
- Add "Importuj" button next to existing "Dodaj pojazd" button on `apps/web/src/app/(admin)/pojazdy/vehicles-page.tsx`
- Import dialog/modal with: file picker (.csv, .xls, .xlsx), "Pobierz szablon" link to download CSV template, submit button
- After upload: show results summary — X dodanych, X pominiętych, X błędów
- If errors exist: show error table (row number + reason)
- Use existing API endpoints: POST /vehicles/import (multipart), GET /vehicles/import/template

### Required fields note
- Per user requirement: only make/model/year/plate required — rest optional
- The API already handles this (ImportVehicleRow maps to CreateVehicleDto which has these as required)
- Note: API schema has `registration` (plate), `vin`, `fuelType`, `transmission` as required too — but the import endpoint may handle defaults. Verify and adjust if needed.

### Claude's Discretion
- Modal vs drawer vs inline expand for the import UI
- Whether to use existing apiClient with FormData support or raw fetch for the upload
- Polish language for all labels and messages

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- API `POST /vehicles/import` — fully implemented with xlsx parsing, dedup, bilingual column mapping
- API `GET /vehicles/import/template` — CSV template download
- `vehicles-page.tsx` — existing vehicle listing with "Dodaj pojazd" button
- `use-vehicles.ts` — React Query hooks for vehicles

### Established Patterns
- Web admin uses shadcn/ui components (Button, Dialog, etc.)
- BFF proxy at `[...path]/route.ts` forwards all admin API calls
- `apiClient` handles auth token refresh on 401

### Integration Points
- BFF proxy needs multipart support (currently breaks file uploads)
- Vehicles page header — add import button alongside existing create button
- React Query invalidation after successful import

</code_context>

<specifics>
## Specific Ideas

- Show import summary (X added, X skipped, X errors) — explicit user requirement
- Required fields only: make/model/year/plate — rest optional
- Missing optional fields = leave empty (no validation errors)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
