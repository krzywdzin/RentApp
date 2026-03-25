# Phase 13: Dependencies & Performance - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix Expo SDK 54 dependency mismatches, add missing explicit dependencies, and resolve N+1 query patterns in the web admin panel. No new features — only dependency alignment and query optimization.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase.

**Dependency Fixes (DEPS-01, DEPS-02, DEPS-03):**
- Add `react-native-webview` as explicit dependency in `apps/mobile/package.json` (currently only transitive via react-native-signature-canvas)
- Align expo-router to tilde range (`~6.0.23` instead of exact `6.0.23`)
- Verify @sentry/react-native version compatibility with Expo SDK 54 / RN 0.81 — downgrade if needed
- Align react version pins to use caret/tilde ranges where safe
- Run `npx expo install --check` to auto-fix any remaining version mismatches
- Check @react-native-community/netinfo version against SDK 54 compatibility

**Performance Fixes (PERF-01, PERF-02):**
- Contract list N+1: Current `useContracts` fetches all rentals then fires one API call per rental to get its contract. Fix by adding a GET /contracts API endpoint that returns contracts with rental data in a single query (Prisma include)
- Customer/vehicle detail rentals: Current code fetches ALL rentals then filters client-side. Fix by adding query param support to GET /rentals (e.g., `?customerId=X` or `?vehicleId=X`) and using it in the detail page hooks

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/mobile/package.json` — Expo SDK 54 dependencies
- `apps/api/src/contracts/contracts.controller.ts` — existing contract endpoints
- `apps/api/src/rentals/rentals.controller.ts` — existing rental list endpoint
- `apps/web/src/hooks/queries/use-contracts.ts` — N+1 contract fetching
- `apps/web/src/hooks/queries/use-rentals.ts` — client-side filtering hook

### Established Patterns
- API uses NestJS controllers with Prisma queries
- Web hooks use React Query with apiClient
- Rental list already supports status filter query param

### Integration Points
- `apps/api/src/contracts/contracts.controller.ts` — add GET /contracts list endpoint
- `apps/api/src/rentals/rentals.controller.ts` — add customerId/vehicleId query params
- `apps/web/src/hooks/queries/use-contracts.ts` — replace N+1 with single query
- `apps/web/src/hooks/queries/use-rentals.ts` — add filter params
- `apps/web/src/app/(admin)/klienci/[id]/page.tsx` — use filtered rentals
- `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` — use filtered rentals

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard dependency and performance fixes.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
