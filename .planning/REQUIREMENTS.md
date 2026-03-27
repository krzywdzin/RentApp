# Requirements: RentApp

**Defined:** 2026-03-27
**Milestone:** v2.0 — Production Ready
**Core Value:** Pracownik w terenie moze w pelni obsluzyc wynajem — od wypelnienia umowy, przez zweryfikowanie uprawnien kierowcy, zrobienie zdjec auta, po podpis klienta i wysylke PDF — bez papieru i bez powrotu do biura.

## v2.0 Requirements

### API Hardening (APIH)

- [x] **APIH-01**: API validates all required environment variables at startup and fails fast with clear error messages listing missing vars
- [x] **APIH-02**: API handles SIGTERM/SIGINT gracefully — drains active requests, closes DB/Redis connections, then exits
- [x] **APIH-03**: Global exception filter catches all unhandled errors and returns consistent JSON error responses (not HTML stack traces)
- [x] **APIH-04**: PDF generation errors are caught and returned as 500 with a descriptive message instead of crashing the request
- [x] **APIH-05**: Rental DRAFT→ACTIVE transition is properly triggered after all 4 signatures are collected (idempotent, no race condition)

### API Security (APIS)

- [x] **APIS-01**: Rate limiting applied per-endpoint — auth endpoints (login, refresh) limited to 10 req/min, general API to 100 req/min
- [x] **APIS-02**: CORS origins configured via environment variable (not hardcoded IPs) — production allows only deployed domain
- [x] **APIS-03**: Request body size limits enforced globally (10MB for signature uploads, 1MB default for other endpoints)
- [x] **APIS-04**: Helmet security headers configured for production (CSP, HSTS, X-Frame-Options)
- [x] **APIS-05**: All sensitive config values (DB URL, Redis URL, JWT secrets, API keys) loaded from environment — no defaults for secrets in production

### Mobile Production (MOBP)

- [x] **MOBP-01**: API URL loaded from environment config (EXPO_PUBLIC_API_URL) — no hardcoded IPs in source code
- [x] **MOBP-02**: Keyboard-aware scroll views on all form screens prevent input fields from being hidden behind the keyboard
- [x] **MOBP-03**: Vehicle selection screen uses FlatList with proper keyExtractor and avoids VirtualizedList nesting warnings
- [x] **MOBP-04**: Photo walkthrough step added to rental wizard — employee captures vehicle photos before signatures
- [x] **MOBP-05**: EAS Build configuration (eas.json) set up with development, preview, and production profiles for Android APK

### Web Production (WEBP)

- [x] **WEBP-01**: API client implements automatic token refresh on 401 responses with request queue (no double-refresh race)
- [x] **WEBP-02**: All create/edit forms show inline validation errors using Zod schemas consistent with API DTOs
- [x] **WEBP-03**: All data-fetching pages show error states with retry buttons when API requests fail
- [x] **WEBP-04**: Next.js build produces zero TypeScript errors — all type assertions cleaned up

### Infrastructure (INFRA)

- [x] **INFRA-01**: Dockerfile for API app — multi-stage build (deps, build, production) with non-root user
- [x] **INFRA-02**: Storage service supports Cloudflare R2 as S3-compatible backend (endpoint, auth, bucket config via env vars)
- [x] **INFRA-03**: Railway deployment config (railway.toml or Procfile) for API with health check endpoint
- [x] **INFRA-04**: Web app deployable to Railway or Vercel with environment-based API URL configuration
- [x] **INFRA-05**: EAS Build produces installable Android APK via `eas build --platform android --profile production`

### CI/CD Pipeline (CICD)

- [x] **CICD-01**: GitHub Actions workflow runs lint + typecheck + test on every PR for all three apps
- [x] **CICD-02**: API deployment triggered on push to main — builds Docker image and deploys to Railway
- [x] **CICD-03**: Web deployment triggered on push to main — builds and deploys to Railway/Vercel
- [x] **CICD-04**: Health check endpoint (GET /health) returns 200 with service status (DB, Redis, Storage connectivity)

## Previous Milestones

<details>
<summary>v1.1 Requirements (29 total — all complete)</summary>

### Mobile UX Polish (MOBUX) — 7 requirements, all complete
### Web Admin Panel Polish (WEBUX) — 8 requirements, all complete
### TypeScript Strictness (TSFIX) — 6 requirements, all complete
### Dependency Fixes (DEPS) — 3 requirements, all complete
### Test Coverage (TEST) — 3 requirements, all complete
### Performance (PERF) — 2 requirements, all complete

</details>

<details>
<summary>v1.0 Requirements (42 total — all complete)</summary>

AUTH (5), FLEET (3), CUST (4), RENT (5), CONT (5), ADMIN (3), MOB (3), PHOTO (3), DMG (2), NOTIF (3), ALERT (2), CEPIK (2), PORTAL (2)

</details>

## Out of Scope

| Feature | Reason |
|---------|--------|
| Platnosci online | Wypozyczalnia rozlicza sie bezposrednio — PCI compliance niepotrzebne |
| Rezerwacja online przez klienta | Wynajmy odbywaja sie na miejscu |
| Wielojezycznosc / i18n | Polski rynek — hardcoded Polish strings acceptable |
| Offline mode z sync | Complexity too high for v2.0 — requires queue/conflict resolution |
| OCR skan dokumentow | Nice-to-have for future version |
| Kubernetes / container orchestration | Railway handles scaling — no need for K8s |
| iOS App Store deployment | Only 1 iOS user — TestFlight or ad-hoc sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| APIH-01 | Phase 15 | Complete |
| APIH-02 | Phase 15 | Complete |
| APIH-03 | Phase 15 | Complete |
| APIH-04 | Phase 15 | Complete |
| APIH-05 | Phase 15 | Complete |
| APIS-01 | Phase 15 | Complete |
| APIS-02 | Phase 15 | Complete |
| APIS-03 | Phase 15 | Complete |
| APIS-04 | Phase 15 | Complete |
| APIS-05 | Phase 15 | Complete |
| MOBP-01 | Phase 16 | Complete |
| MOBP-02 | Phase 16 | Complete |
| MOBP-03 | Phase 16 | Complete |
| MOBP-04 | Phase 16 | Complete |
| MOBP-05 | Phase 16 | Complete |
| WEBP-01 | Phase 17 | Complete |
| WEBP-02 | Phase 17 | Complete |
| WEBP-03 | Phase 17 | Complete |
| WEBP-04 | Phase 17 | Complete |
| INFRA-01 | Phase 18 | Complete |
| INFRA-02 | Phase 18 | Complete |
| INFRA-03 | Phase 18 | Complete |
| INFRA-04 | Phase 18 | Complete |
| INFRA-05 | Phase 18 | Complete |
| CICD-01 | Phase 19 | Complete |
| CICD-02 | Phase 19 | Complete |
| CICD-03 | Phase 19 | Complete |
| CICD-04 | Phase 19 | Complete |

**Coverage:**
- v2.0 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
