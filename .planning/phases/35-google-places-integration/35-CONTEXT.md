# Phase 35: Google Places Integration - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Google Places autocomplete for pickup and return locations in mobile rental wizard. Backend proxy for API key security. Save selected location data with rental. Display in rental details (mobile + web).

</domain>

<decisions>
## Implementation Decisions

### Autocomplete UX
- Inline text field with dropdown suggestions (like Google Maps) — not a modal
- Two separate fields: one for pickup location, one for return location
- Fields appear on the **dates step** of mobile wizard (alongside dates, rate, deposit)

### Data Storage
- Save: formatted address string + Google `place_id`
- Two new fields on Rental: `pickupLocation` (JSON with address + placeId) and `returnLocation` (JSON with address + placeId)
- place_id enables opening location in Google Maps later if needed

### Backend Proxy
- Google Places API key stays on backend — mobile calls proxy endpoint
- Proxy endpoint: `GET /places/autocomplete?input=...` returns suggestions
- Per milestone research: key security + billing control

### Claude's Discretion
- Exact proxy endpoint design (session tokens, country bias to PL)
- How to display saved locations in rental detail views (web + mobile)
- Debounce timing for autocomplete input
- What to show when Google Places returns no results

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Mobile wizard
- `apps/mobile/app/(tabs)/new-rental/dates.tsx` — Dates step where location fields go
- `apps/mobile/src/stores/rental-draft.store.ts` — Draft store (needs pickup/return location fields)

### API
- `apps/api/prisma/schema.prisma` — Rental model (needs new location fields)
- `apps/api/src/rentals/dto/create-rental.dto.ts` — DTO needs location fields

### Research
- `.planning/research/STACK.md` — `react-native-google-places-autocomplete` v2.6.4 recommendation
- `.planning/research/ARCHITECTURE.md` — Places proxy module design
- `.planning/research/PITFALLS.md` — Session token billing, country bias

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AppInput` component for text fields in mobile
- `apiClient` for API calls from mobile
- Existing NestJS module pattern (controller + service + DTO)

### Established Patterns
- `Json` Prisma type for structured data (used for handoverData, returnData, contractData)
- Zod schemas in shared package for validation
- Mobile draft store with zustand persist

### Integration Points
- `dates.tsx`: add two location fields after existing date/rate fields
- `rental-draft.store.ts`: add pickupLocation and returnLocation
- `create-rental.dto.ts`: add location fields
- New NestJS module: `places/` with proxy controller
- Rental detail views (mobile + web): display saved locations

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard Google Places autocomplete integration.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 35-google-places-integration*
*Context gathered: 2026-04-12*
