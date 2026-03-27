# Phase 22: API Validation & Performance - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Strict input validation on all API endpoints, server-side pagination on list endpoints, efficient queries (no N+1), structured logging, timezone-correct date calculations, and correct VAT rate usage in annex PDFs.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure API quality phase. Key audit references:
- API-AUDIT: 2.1-2.4 (ParseUUIDPipe), 6.1-6.4 (pagination), 5.4 (importFleet N+1), 5.6 (photo comparison N+1), 5.7 (expiry alert N+1), 12.1 (AuditInterceptor logging), 12.2 (AuthService logging), 12.3 (Redis error handler), 4.5 ($queryRawUnsafe), 16.3 (timezone bug), 7.2 (annex VAT), 8.1-8.6 (validation), 9.2 (route order)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing pagination in notifications service (page/limit pattern)
- ParseUUIDPipe already used on some endpoints
- NestJS Logger used in most services

### Integration Points
- All controller :id params need ParseUUIDPipe
- List endpoints: rentals, customers, contracts need pagination DTOs
- vehicles.service.ts importFleet needs bulk pre-fetch
- photos.service.ts getComparison needs Promise.all
- notifications.service.ts enqueueExpiryAlert needs createMany

</code_context>

<specifics>
## Specific Ideas

No specific requirements — API improvements driven by audit findings.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
