# Phase 18: Infrastructure & Storage - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Infrastructure phase: Dockerfile for API, Cloudflare R2 storage compatibility, Railway deployment config, web deployment config, health check endpoint with dependency checks. No feature changes.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase.
- Multi-stage Dockerfile for API (deps → build → production)
- R2 compatible with existing S3 client (just different endpoint/auth)
- Health check queries DB, Redis, Storage connectivity
- Railway uses Procfile or nixpacks auto-detection
- Web app deploys as standalone Next.js with output: 'standalone'

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- StorageService already supports S3-compatible backends via endpoint config
- HealthController exists in app.module.ts (returns { status: 'ok', timestamp })
- PrismaService for DB connection check
- ConfigService for Redis URL

### Integration Points
- apps/api/Dockerfile (new)
- apps/api/src/app.module.ts — enhance health check
- apps/web/next.config.ts — add standalone output
- Root Procfile or railway.toml (new)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
