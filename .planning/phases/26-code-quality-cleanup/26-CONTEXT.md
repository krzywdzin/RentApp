# Phase 26: Code Quality & Cleanup - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove TypeScript 'any' types from API services, add null guards for non-null assertions, remove dead code, export shared types (PaginatedResponse, AuditLogDto, RentalWithRelations), reorganize photo schemas, fix web form type casts, add explicit module imports, enforce FIELD_ENCRYPTION_KEY, and add missing database indexes.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — code quality phase. Audit references:
- API-AUDIT: 3.1 (any types), 3.2 (non-null assertions), 11.1-11.4 (dead code), 13.1 (FIELD_ENCRYPTION_KEY), 14.1-14.3 (indexes)
- WEB-AUDIT: 1.1-1.8 (type casts), 15.1-15.4 (dead code)
- INFRA-AUDIT: SHARED-1 through SHARED-5 (shared types), QUALITY-3 through QUALITY-5 (API quality)

</decisions>

<code_context>
## Existing Code Insights

### Integration Points
- API services: customers.service.ts, cepik.service.ts, audit.interceptor.ts, portal-jwt.strategy.ts
- Shared package: packages/shared/src/types/, packages/shared/src/schemas/
- Web form pages: pojazdy, klienci edit pages
- Prisma schema: indexes on Contract, CepikVerification, Notification
- Health module: explicit imports needed

</code_context>

<specifics>
## Specific Ideas
No specific requirements — driven by audit findings.
</specifics>

<deferred>
## Deferred Ideas
None.
</deferred>
