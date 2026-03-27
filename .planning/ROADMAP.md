# Roadmap: RentApp

## Overview

RentApp replaces a paper-based car rental workflow with a digital system spanning mobile (field employees), web (admin), and a customer portal. v2.0 takes the feature-complete app to production — hardening the API, fixing mobile/web issues, setting up infrastructure, and deploying to Railway/Cloudflare R2/EAS Build.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-9 + 9.1 (shipped 2026-03-25)
- ✅ **v1.1 Quality, Polish & UX Improvements** - Phases 10-14 (shipped 2026-03-25)
- 🚧 **v2.0 Production Ready** - Phases 15-19 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-9 + 9.1) -- SHIPPED 2026-03-25</summary>

- [x] **Phase 1: Foundation and Auth** (completed 2026-03-23)
- [x] **Phase 2: Fleet and Customer Data** (completed 2026-03-23)
- [x] **Phase 3: Rental Lifecycle** (completed 2026-03-23)
- [x] **Phase 4: Contract and PDF** (completed 2026-03-24)
- [x] **Phase 5: Admin Panel** (completed 2026-03-24)
- [x] **Phase 6: Mobile App** (completed 2026-03-24)
- [x] **Phase 7: Photo and Damage Documentation** (completed 2026-03-24)
- [x] **Phase 8: Notifications and Alerts** (completed 2026-03-24)
- [x] **Phase 9: Customer Portal and CEPiK** (completed 2026-03-24)
- [x] **Phase 9.1: Mobile and Admin Bug Fixes** (completed 2026-03-25)

</details>

<details>
<summary>v1.1 Quality, Polish & UX Improvements (Phases 10-14) -- SHIPPED 2026-03-25</summary>

- [x] **Phase 10: Mobile UX Polish** (completed 2026-03-25)
- [x] **Phase 11: Web Admin Panel Polish** (completed 2026-03-25)
- [x] **Phase 12: TypeScript Strictness** (completed 2026-03-25)
- [x] **Phase 13: Dependencies & Performance** (completed 2026-03-25)
- [x] **Phase 14: Test Coverage** (completed 2026-03-25)

</details>

### v2.0 Production Ready

- [ ] **Phase 15: API Hardening & Security** - Environment validation, graceful shutdown, global error filter, rate limiting, CORS config, security headers, PDF error handling, rental flow fix
- [ ] **Phase 16: Mobile Production Ready** - Dynamic API URL, keyboard-aware forms, vehicle list optimization, photo walkthrough in rental wizard, EAS Build config
- [ ] **Phase 17: Web Production Ready** - Token refresh, form validations, error states with retry, TypeScript build cleanup
- [ ] **Phase 18: Infrastructure & Storage** - Dockerfile for API, Cloudflare R2 storage, Railway deployment config, web deployment config, health check endpoint
- [ ] **Phase 19: CI/CD & Deployment** - GitHub Actions pipeline for lint/test/build, automated deployment to Railway, EAS Build for Android APK

## Phase Details

### Phase 15: API Hardening & Security
**Goal**: The API validates its configuration at startup, handles errors consistently, shuts down gracefully, and enforces security controls -- no unhandled crashes, no leaked stack traces, no open CORS
**Depends on**: Phase 14
**Requirements**: APIH-01, APIH-02, APIH-03, APIH-04, APIH-05, APIS-01, APIS-02, APIS-03, APIS-04, APIS-05
**Success Criteria** (what must be TRUE):
  1. API fails to start when required env vars (DATABASE_URL, JWT secrets) are missing -- error message lists the missing variables
  2. Sending SIGTERM to the API process completes in-flight requests and exits with code 0 within 10 seconds
  3. Throwing an unhandled exception in a controller returns a JSON object with `statusCode`, `message`, `error` -- never an HTML page
  4. Rate-limited auth endpoints return 429 after 10 rapid requests within 1 minute
  5. CORS origin is read from `CORS_ORIGINS` env var -- hardcoded IPs removed from source

### Phase 16: Mobile Production Ready
**Goal**: The mobile app connects to any API endpoint via configuration, handles keyboard/scroll edge cases, includes photo documentation in the rental wizard, and has EAS Build profiles for Android APK generation
**Depends on**: Phase 15
**Requirements**: MOBP-01, MOBP-02, MOBP-03, MOBP-04, MOBP-05
**Success Criteria** (what must be TRUE):
  1. Setting `EXPO_PUBLIC_API_URL=https://api.example.com` and rebuilding produces an app that calls that URL -- no hardcoded IPs in source
  2. On the contract review screen, the keyboard does not hide the active input field -- content scrolls to keep the focused field visible
  3. Photo walkthrough screen appears in the rental wizard between contract review and signatures -- employee can capture at least front/rear/left/right photos
  4. `eas.json` exists with development, preview, and production profiles -- `eas build --platform android --profile preview` command is valid
  5. Vehicle selection screen renders without VirtualizedList nesting warnings in the console

### Phase 17: Web Production Ready
**Goal**: The admin panel handles auth token expiry transparently, validates all forms consistently, and shows actionable error states -- no silent failures or infinite spinners
**Depends on**: Phase 15
**Requirements**: WEBP-01, WEBP-02, WEBP-03, WEBP-04
**Success Criteria** (what must be TRUE):
  1. When a JWT expires mid-session, the next API call automatically refreshes the token and retries -- the user does not see a login redirect for expired tokens
  2. Create and edit forms for vehicles, customers, and rentals show inline field-level errors from Zod validation before submission
  3. Dashboard, rental list, and customer list pages show an error card with a retry button when the API returns a 500
  4. `pnpm --filter web build` completes with zero TypeScript errors

### Phase 18: Infrastructure & Storage
**Goal**: The API runs in a Docker container with Cloudflare R2 for file storage, Railway is configured for deployment, and a health check endpoint verifies all service dependencies
**Depends on**: Phases 15, 16, 17
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. `docker build -f apps/api/Dockerfile .` succeeds and produces an image under 200MB
  2. Storage service uploads to Cloudflare R2 when `S3_ENDPOINT` points to an R2-compatible URL -- existing S3/MinIO code works unchanged
  3. `GET /health` returns `{"status":"ok","db":true,"redis":true,"storage":true}` when all services are connected
  4. Railway config (Procfile or railway.toml) specifies the start command, health check path, and build command
  5. Web app has environment-based API URL for production deployment (not localhost)

### Phase 19: CI/CD & Deployment
**Goal**: Every push to main triggers automated testing and deployment -- API to Railway, web to Railway/Vercel, and Android APK buildable via EAS
**Depends on**: Phase 18
**Requirements**: CICD-01, CICD-02, CICD-03, CICD-04
**Success Criteria** (what must be TRUE):
  1. `.github/workflows/ci.yml` runs lint, typecheck, and tests for API, web, and shared packages on every PR
  2. `.github/workflows/deploy-api.yml` builds and deploys the API Docker image to Railway on push to main
  3. `.github/workflows/deploy-web.yml` deploys the web app on push to main
  4. All CI workflows use pnpm caching and complete within 10 minutes

## Progress

**Execution Order:**
v1.0: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 9.1
v1.1: 10 -> 11 -> 12 -> 13 -> 14
v2.0: 15 -> 16 & 17 (parallel) -> 18 -> 19

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9.1 | v1.0 | 37/37 | Complete | 2026-03-25 |
| 10-14 | v1.1 | 14/14 | Complete | 2026-03-25 |
| 15. API Hardening & Security | v2.0 | 0/0 | Not Started | - |
| 16. Mobile Production Ready | v2.0 | 0/0 | Not Started | - |
| 17. Web Production Ready | v2.0 | 0/0 | Not Started | - |
| 18. Infrastructure & Storage | v2.0 | 0/0 | Not Started | - |
| 19. CI/CD & Deployment | v2.0 | 0/0 | Not Started | - |
