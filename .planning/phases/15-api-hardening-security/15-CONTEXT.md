# Phase 15: API Hardening & Security - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase hardens the NestJS API for production deployment — environment validation, graceful shutdown, global error handling, rate limiting, CORS configuration, and security headers. No new features, only operational resilience and security controls.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure/hardening phase. Key constraints:
- Use @nestjs/throttler for rate limiting (standard NestJS approach)
- Use class-validator + custom bootstrap validation for env vars
- Global exception filter as NestJS ExceptionFilter
- Graceful shutdown via NestJS enableShutdownHooks()
- CORS origins from comma-separated CORS_ORIGINS env var

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/src/main.ts` — bootstrap function, already has ValidationPipe, Helmet, CORS
- `apps/api/src/app.module.ts` — root module with ConfigModule already imported
- `@nestjs/config` ConfigService already used throughout for env vars
- Existing `json({ limit: '10mb' })` for signature uploads

### Established Patterns
- NestJS modules with service/controller pattern
- ConfigService.get() / getOrThrow() for env access
- Logger per service via `new Logger(ServiceName.name)`
- Prisma for DB, BullMQ for queues, ioredis for Redis

### Integration Points
- `main.ts` — all global middleware/filters/pipes registered here
- `app.module.ts` — ThrottlerModule import
- `contracts.service.ts` — rental DRAFT→ACTIVE transition after signatures
- Storage, DB, Redis connections need graceful close

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Follow NestJS best practices.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
