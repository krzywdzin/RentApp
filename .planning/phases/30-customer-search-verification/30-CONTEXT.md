# Phase 30: Customer Search Verification - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify that customer search by phone, PESEL, and last name works end-to-end across mobile app and API. This was already implemented — phase is verification and any fixes needed.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — verification phase. Read the existing customer search code, verify the API endpoint handles all three query types, verify the mobile app sends the right parameters, and fix any issues found.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Customer search was already implemented in a prior session (phone/PESEL/lastName detection)
- `apps/mobile/src/api/customers.api.ts` — search function with query type detection
- `apps/api/src/customers/customers.service.ts` — search endpoint

### Established Patterns
- API uses Prisma `where` with `contains` for text search, `startsWith` for phone
- Mobile detects query type: digits-only → phone/PESEL, otherwise → lastName

### Integration Points
- Mobile customer search screen
- API GET /customers endpoint with query params

</code_context>

<specifics>
## Specific Ideas

No specific requirements — verification phase

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
