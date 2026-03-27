---
phase: 25-infrastructure-cicd
plan: 03
subsystem: infra
tags: [dependencies, docker, turbo, env, monorepo]

requires:
  - phase: 25-infrastructure-cicd
    provides: audit findings from INFRA-AUDIT.md
provides:
  - Cleaned package.json files without dead dependencies
  - Aligned zod/typescript versions across monorepo
  - Consolidated env documentation (root as single source of truth)
  - Web .env.example for frontend configuration
  - Pinned Docker images with MinIO health check
  - Turbo config with outputs for lint/test and typecheck task
affects: [26-code-quality]

tech-stack:
  added: []
  patterns:
    - "Root .env.example as single source of truth for API env vars"
    - "Sub-app .env.example files reference root or document app-specific vars only"

key-files:
  created:
    - apps/web/.env.example
  modified:
    - apps/api/package.json
    - apps/web/package.json
    - apps/mobile/package.json
    - apps/mobile/jest.config.js
    - packages/shared/package.json
    - .env.example
    - apps/api/.env.example
    - docker-compose.yml
    - turbo.json

key-decisions:
  - "S3_REGION=auto in root .env.example (matches R2 convention, not us-east-1)"
  - "apps/api/.env.example replaced with reference to root to eliminate drift"
  - "MinIO pinned to RELEASE.2025-01-20T14-49-07Z, Mailpit pinned to v1.21"

patterns-established:
  - "Version alignment: zod ^3.25.76 and typescript ^5.9.0 across all packages"
  - "Docker image pinning: use specific release tags, never :latest"

requirements-completed: [ICONF-01, ICONF-02, ICONF-03, ICONF-04, ICONF-05, ICONF-06, ICONF-07, ICONF-09]

duration: 2min
completed: 2026-03-27
---

# Phase 25 Plan 03: Infrastructure Config Cleanup Summary

**Removed 4 dead dependencies, aligned zod/typescript versions, consolidated env docs with CORS_ORIGINS, pinned Docker images with MinIO health check, and added turbo typecheck task**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-27T23:51:26Z
- **Completed:** 2026-03-27T23:52:57Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Removed unused dependencies: bullmq (API), @nestjs/cli (web), @gorhom/bottom-sheet and tailwindcss (mobile)
- Aligned zod to ^3.25.76 and typescript to ^5.9.0 across all packages
- Consolidated env documentation: root .env.example is single source of truth, API .env.example references root, created web .env.example
- Pinned Docker images (MinIO RELEASE.2025-01-20T14-49-07Z, Mailpit v1.21) and added MinIO health check
- Updated turbo.json with outputs for lint/test, .next/** for build, and new typecheck task

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove unused dependencies and align versions** - `df476f4` (chore)
2. **Task 2: Consolidate env examples, fix Docker and turbo** - `c54a460` (chore)

## Files Created/Modified
- `apps/api/package.json` - Removed bullmq dependency
- `apps/web/package.json` - Removed @nestjs/cli, aligned typescript to ^5.9.0
- `apps/mobile/package.json` - Removed @gorhom/bottom-sheet, tailwindcss; aligned zod to ^3.25.76
- `apps/mobile/jest.config.js` - Removed @gorhom/bottom-sheet from transformIgnorePatterns
- `packages/shared/package.json` - Aligned zod to ^3.25.76
- `.env.example` - Added CORS_ORIGINS, fixed S3_REGION to auto
- `apps/api/.env.example` - Replaced with reference to root
- `apps/web/.env.example` - Created with API_URL documentation
- `docker-compose.yml` - Pinned images, added MinIO health check
- `turbo.json` - Added outputs for lint/test, typecheck task, .next/** for build

## Decisions Made
- S3_REGION=auto in root .env.example (matches Cloudflare R2 convention used in production)
- apps/api/.env.example replaced with a 2-line reference to root to eliminate env var drift
- MinIO pinned to RELEASE.2025-01-20T14-49-07Z, Mailpit pinned to v1.21

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All infrastructure config issues from INFRA-AUDIT.md resolved
- Phase 25 (infrastructure-cicd) complete, ready for Phase 26 (code-quality)

## Self-Check: PASSED

- FOUND: apps/web/.env.example
- FOUND: 25-03-SUMMARY.md
- FOUND: df476f4 (Task 1 commit)
- FOUND: c54a460 (Task 2 commit)

---
*Phase: 25-infrastructure-cicd*
*Completed: 2026-03-27*
