# Phase 25: Infrastructure & CI/CD - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

CI pipeline fixes (Redis service, mobile CI, E2E tests, coverage enforcement), deployment fixes (prisma migrate, Puppeteer in Docker, health check polling, web railway.toml), dependency cleanup, version alignment, env documentation, Docker improvements, and turbo config.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase. Audit references:
- INFRA-AUDIT: INFRA-1 through INFRA-7, CI-1 through CI-3, DEP-1 through DEP-5, ENV-1 through ENV-4, DOCKER-1 through DOCKER-4, TURBO-1 through TURBO-2

</decisions>

<code_context>
## Existing Code Insights

### Integration Points
- .github/workflows/ci.yml — CI pipeline
- .github/workflows/deploy-api.yml — API deployment
- .github/workflows/deploy-web.yml — Web deployment
- apps/api/Dockerfile — API Docker image
- apps/web/Dockerfile — Web Docker image
- docker-compose.yml — Dev services
- turbo.json — Monorepo config
- package.json files across all packages

</code_context>

<specifics>
## Specific Ideas
No specific requirements — driven by audit findings.
</specifics>

<deferred>
## Deferred Ideas
None.
</deferred>
