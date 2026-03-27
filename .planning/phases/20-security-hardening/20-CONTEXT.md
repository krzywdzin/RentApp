# Phase 20: Security Hardening - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Close all security vulnerabilities identified in the codebase audit: separate portal JWT secret, gitignore .env files, move company PII to env vars, add input size limits on base64 fields, configure SMTP auth, remove default S3 credentials, rate-limit portal token exchange, sanitize CSV formula injection, and use signed URLs for mobile PDF access.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure security hardening phase. Key audit references:
- INFRA-AUDIT: SEC-1 (.env gitignore), SEC-2 (portal JWT), SEC-3 (company PII), SEC-4 (encryption key placeholder)
- API-AUDIT: 4.3 (signatureBase64 size), 4.4 (damageSketchBase64 size), 4.6 (portal rate limit), 4.7 (SmsService crash)
- WEB-AUDIT: 6.3 (CSV injection)
- MOBILE-AUDIT: SEC-01 (PDF URL auth)
- INFRA-AUDIT: INFRA-7 (SMTP auth)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/src/common/env.validation.ts` — existing env validation infrastructure
- `apps/api/src/common/filters/all-exceptions.filter.ts` — global error handling
- Rate limiting already configured via ThrottlerGuard in app.module.ts

### Established Patterns
- JWT strategies in `apps/api/src/auth/strategies/` and `apps/api/src/portal/strategies/`
- ConfigService used throughout for env var access
- class-validator decorators on DTOs

### Integration Points
- Portal JWT strategy at `apps/api/src/portal/strategies/portal-jwt.strategy.ts`
- Contract service at `apps/api/src/contracts/contracts.service.ts` (company PII)
- Sign contract DTO at `apps/api/src/contracts/dto/sign-contract.dto.ts`
- Storage service at `apps/api/src/storage/storage.service.ts` (S3 defaults)
- Mail service at `apps/api/src/mail/mail.service.ts` (SMTP)
- CSV export at `apps/web/src/lib/csv-export.ts`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure/security phase driven by audit findings.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
