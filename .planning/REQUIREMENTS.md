# Requirements: RentApp

**Defined:** 2026-03-27
**Milestone:** v2.0 — Production Ready
**Core Value:** Pracownik w terenie moze w pelni obsluzyc wynajem — od wypelnienia umowy, przez zweryfikowanie uprawnien kierowcy, zrobienie zdjec auta, po podpis klienta i wysylke PDF — bez papieru i bez powrotu do biura.

## v2.0 Requirements

### API Hardening (APIH)

- [ ] **APIH-01**: API validates all required environment variables at startup and fails fast with clear error messages listing missing vars
- [ ] **APIH-02**: API handles SIGTERM/SIGINT gracefully — drains active requests, closes DB/Redis connections, then exits
- [ ] **APIH-03**: Global exception filter catches all unhandled errors and returns consistent JSON error responses (not HTML stack traces)
- [ ] **APIH-04**: PDF generation errors are caught and returned as 500 with a descriptive message instead of crashing the request
- [ ] **APIH-05**: Rental DRAFT→ACTIVE transition is properly triggered after all 4 signatures are collected (idempotent, no race condition)

### API Security (APIS)

- [ ] **APIS-01**: Rate limiting applied per-endpoint — auth endpoints (login, refresh) limited to 10 req/min, general API to 100 req/min
- [ ] **APIS-02**: CORS origins configured via environment variable (not hardcoded IPs) — production allows only deployed domain
- [ ] **APIS-03**: Request body size limits enforced globally (10MB for signature uploads, 1MB default for other endpoints)
- [ ] **APIS-04**: Helmet security headers configured for production (CSP, HSTS, X-Frame-Options)
- [ ] **APIS-05**: All sensitive config values (DB URL, Redis URL, JWT secrets, API keys) loaded from environment — no defaults for secrets in production

### Mobile Production (MOBP)

- [ ] **MOBP-01**: API URL loaded from environment config (EXPO_PUBLIC_API_URL) — no hardcoded IPs in source code
- [ ] **MOBP-02**: Keyboard-aware scroll views on all form screens prevent input fields from being hidden behind the keyboard
- [ ] **MOBP-03**: Vehicle selection screen uses FlatList with proper keyExtractor and avoids VirtualizedList nesting warnings
- [ ] **MOBP-04**: Photo walkthrough step added to rental wizard — employee captures vehicle photos before signatures
- [ ] **MOBP-05**: EAS Build configuration (eas.json) set up with development, preview, and production profiles for Android APK

### Web Production (WEBP)

- [ ] **WEBP-01**: API client implements automatic token refresh on 401 responses with request queue (no double-refresh race)
- [ ] **WEBP-02**: All create/edit forms show inline validation errors using Zod schemas consistent with API DTOs
- [ ] **WEBP-03**: All data-fetching pages show error states with retry buttons when API requests fail
- [ ] **WEBP-04**: Next.js build produces zero TypeScript errors — all type assertions cleaned up

### Infrastructure (INFRA)

- [ ] **INFRA-01**: Dockerfile for API app — multi-stage build (deps, build, production) with non-root user
- [ ] **INFRA-02**: Storage service supports Cloudflare R2 as S3-compatible backend (endpoint, auth, bucket config via env vars)
- [ ] **INFRA-03**: Railway deployment config (railway.toml or Procfile) for API with health check endpoint
- [ ] **INFRA-04**: Web app deployable to Railway or Vercel with environment-based API URL configuration
- [ ] **INFRA-05**: EAS Build produces installable Android APK via `eas build --platform android --profile production`

### CI/CD Pipeline (CICD)

- [ ] **CICD-01**: GitHub Actions workflow runs lint + typecheck + test on every PR for all three apps
- [ ] **CICD-02**: API deployment triggered on push to main — builds Docker image and deploys to Railway
- [ ] **CICD-03**: Web deployment triggered on push to main — builds and deploys to Railway/Vercel
- [ ] **CICD-04**: Health check endpoint (GET /health) returns 200 with service status (DB, Redis, Storage connectivity)

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
| APIH-01 | Phase 15 | Pending |
| APIH-02 | Phase 15 | Pending |
| APIH-03 | Phase 15 | Pending |
| APIH-04 | Phase 15 | Pending |
| APIH-05 | Phase 15 | Pending |
| APIS-01 | Phase 15 | Pending |
| APIS-02 | Phase 15 | Pending |
| APIS-03 | Phase 15 | Pending |
| APIS-04 | Phase 15 | Pending |
| APIS-05 | Phase 15 | Pending |
| MOBP-01 | Phase 16 | Pending |
| MOBP-02 | Phase 16 | Pending |
| MOBP-03 | Phase 16 | Pending |
| MOBP-04 | Phase 16 | Pending |
| MOBP-05 | Phase 16 | Pending |
| WEBP-01 | Phase 17 | Pending |
| WEBP-02 | Phase 17 | Pending |
| WEBP-03 | Phase 17 | Pending |
| WEBP-04 | Phase 17 | Pending |
| INFRA-01 | Phase 18 | Pending |
| INFRA-02 | Phase 18 | Pending |
| INFRA-03 | Phase 18 | Pending |
| INFRA-04 | Phase 18 | Pending |
| INFRA-05 | Phase 18 | Pending |
| CICD-01 | Phase 19 | Pending |
| CICD-02 | Phase 19 | Pending |
| CICD-03 | Phase 19 | Pending |
| CICD-04 | Phase 19 | Pending |

**Coverage:**
- v2.0 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
