# Phase 19: CI/CD & Deployment - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Create GitHub Actions CI/CD pipelines for automated testing on PRs and deployment on push to main. Pure infrastructure — no feature changes.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices at Claude's discretion — infrastructure phase.
- GitHub Actions for CI/CD
- pnpm caching for fast installs
- Separate workflows for CI (PRs) and deploy (push to main)
- Railway CLI for API deployment
- Vercel or Railway for web deployment

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- turbo.json defines lint, build, test tasks
- pnpm workspace for dependency management
- Dockerfiles for API and web (Phase 18)
- Health check endpoint at /health

### Integration Points
- .github/workflows/ (new directory)
- Railway API token (secret)
- Vercel token (secret) or Railway for web

</code_context>

<specifics>
## Specific Ideas

No specific requirements.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
