# Phase 17: Web Production Ready - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix web admin panel for production: token refresh on 401, consistent form validation, error states with retry on all data pages, clean TypeScript build.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Token refresh via axios interceptor with request queue pattern
- Error boundary + per-page error states with retry buttons
- Zod schemas shared from @rentapp/shared where possible
- Fix TypeScript errors to achieve zero-error build

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- apps/web/src/lib/api-client.ts — axios instance, may already have interceptors
- apps/web/src/hooks/queries/ — React Query hooks
- shadcn/ui components for consistent UI
- Existing Zod schemas in some create forms

### Established Patterns
- React Query for data fetching with useQuery/useMutation
- Next.js App Router with (admin) route group
- shadcn/ui dark theme components
- BFF proxy pattern for API calls

### Integration Points
- api-client.ts — token refresh interceptor
- All page.tsx files — error state rendering
- Create/edit form components — Zod validation

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard web production hardening.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
