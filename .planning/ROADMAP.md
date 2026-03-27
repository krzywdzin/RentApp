# Roadmap: RentApp

## Overview

RentApp replaces a paper-based car rental workflow with a digital system spanning mobile (field employees), web (admin), and a customer portal. v2.1 addresses all quality issues found in a comprehensive codebase audit -- security hardening, critical bug fixes, validation gaps, accessibility, performance, infrastructure improvements, and code cleanup across all components.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-9 + 9.1 (shipped 2026-03-25)
- ✅ **v1.1 Quality, Polish & UX Improvements** - Phases 10-14 (shipped 2026-03-25)
- ✅ **v2.0 Production Ready** - Phases 15-19 (shipped 2026-03-27)
- 🚧 **v2.1 Fix All Audit Issues** - Phases 20-26 (in progress)

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

<details>
<summary>v2.0 Production Ready (Phases 15-19) -- SHIPPED 2026-03-27</summary>

- [x] **Phase 15: API Hardening & Security** (completed 2026-03-27)
- [x] **Phase 16: Mobile Production Ready** (completed 2026-03-27)
- [x] **Phase 17: Web Production Ready** (completed 2026-03-27)
- [x] **Phase 18: Infrastructure & Storage** (completed 2026-03-27)
- [x] **Phase 19: CI/CD & Deployment** (completed 2026-03-27)

</details>

### v2.1 Fix All Audit Issues

- [x] **Phase 20: Security Hardening** - Separate JWT secrets, gitignore credentials, base64 limits, rate limiting, CSV injection protection (completed 2026-03-27)
- [ ] **Phase 21: Critical Bug Fixes** - Mobile duplicate rental, hydration guard, SearchBar sync, API race conditions, data integrity fixes
- [ ] **Phase 22: API Validation & Performance** - Server-side pagination, DTO validation gaps, N+1 queries, structured logging, timezone fixes
- [ ] **Phase 23: Mobile Quality & UX** - State persistence, navigation guards, form validation, safe area insets, accessibility labels, constants extraction
- [ ] **Phase 24: Web Quality & Accessibility** - Error handling on all pages, form validation, keyboard navigation, aria attributes, responsive design, shared components
- [ ] **Phase 25: Infrastructure & CI/CD** - Redis in CI, Puppeteer in Docker, mobile CI, E2E tests, coverage enforcement, dependency cleanup, env consolidation
- [ ] **Phase 26: Code Quality & Cleanup** - TypeScript any removal, null guards, dead code removal, shared types, consistent patterns, database indexes

## Phase Details

### Phase 20: Security Hardening
**Goal**: All known security vulnerabilities from the audit are closed -- credentials cannot leak, inputs are size-bounded, and attack surfaces (rate limiting, CSV injection, unsigned URLs) are mitigated
**Depends on**: Phase 19
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08, SEC-09, SEC-10
**Success Criteria** (what must be TRUE):
  1. Portal authentication uses its own JWT secret (PORTAL_JWT_SECRET) -- compromising one secret does not compromise the other
  2. Running `git ls-files` shows no .env files tracked; apps/api/.env is in .gitignore
  3. Uploading a signature or damage sketch larger than the configured max size returns a 400 error with a clear message
  4. Sending 20 rapid token-exchange requests from the same IP returns 429 after the rate limit is exceeded
  5. Exporting CSV data that contains cells starting with =, +, -, or @ produces escaped output that does not trigger formula execution in Excel
**Plans**: 2 plans
Plans:
- [ ] 20-01-PLAN.md -- Credentials & environment hardening (SEC-01, SEC-02, SEC-03, SEC-04, SEC-06, SEC-07)
- [ ] 20-02-PLAN.md -- Input limits, rate limiting, CSV & PDF security (SEC-05, SEC-08, SEC-09, SEC-10)

### Phase 21: Critical Bug Fixes
**Goal**: All data-corrupting and crash-causing bugs in mobile and API are fixed -- no duplicate rentals, no race conditions on contract numbers, no crashes from missing guards
**Depends on**: Phase 20
**Requirements**: MBUG-01, MBUG-02, MBUG-03, MBUG-04, MBUG-05, MBUG-06, MBUG-07, AREL-01, AREL-02, AREL-03, AREL-04, AREL-05, AREL-06, AREL-07, AREL-08
**Success Criteria** (what must be TRUE):
  1. Tapping the "Create Rental" button rapidly multiple times creates exactly one rental -- no duplicates in the database
  2. Two simultaneous rental creation requests produce sequential contract numbers with no gaps or duplicates
  3. The return wizard does not fire navigation guards before Zustand store has hydrated from AsyncStorage
  4. RetentionService never deletes a customer who has an active rental -- attempting to do so skips that customer
  5. Photo upload failure (S3 timeout) does not leave orphaned database records -- either both DB record and file exist, or neither does
**Plans**: 4 plans
Plans:
- [ ] 21-01-PLAN.md -- Mobile bugs: duplicate rental, stuck loading, useEffect deps, SearchBar sync (MBUG-01, MBUG-02, MBUG-03, MBUG-04)
- [ ] 21-02-PLAN.md -- Mobile bugs: biometric logout, hydration guard, ErrorBoundary retry (MBUG-05, MBUG-06, MBUG-07)
- [ ] 21-03-PLAN.md -- API bugs: contract race, notification create, annex single-op, SmsService lazy init (AREL-01, AREL-02, AREL-07, AREL-08)
- [ ] 21-04-PLAN.md -- API bugs: retention guard, null assertions, photo upload/replace ordering (AREL-03, AREL-04, AREL-05, AREL-06)

### Phase 22: API Validation & Performance
**Goal**: All API endpoints validate inputs strictly, paginate large result sets, use efficient queries, and log structured events -- no unvalidated UUIDs, no unbounded queries, no N+1 loops
**Depends on**: Phase 21
**Requirements**: AVAL-01, AVAL-02, AVAL-03, AVAL-04, AVAL-05, AVAL-06, AVAL-07, AVAL-08, APERF-01, APERF-02, APERF-03, APERF-04, APERF-05, APERF-06, APERF-07, APERF-08, APERF-09
**Success Criteria** (what must be TRUE):
  1. GET /rentals, GET /customers, and GET /contracts accept page/limit params and return paginated responses with total count -- default page size caps results
  2. Passing a non-UUID string as an :id parameter to any endpoint returns 400 (not 500 internal server error)
  3. Importing a fleet of 50 vehicles executes a constant number of DB queries (not 50+ individual lookups)
  4. AuditInterceptor and AuthService log via NestJS Logger -- no console.log or console.error calls remain in API source
  5. Annex PDF uses the rental's actual VAT rate -- not a hardcoded 23%
**Plans**: TBD

### Phase 23: Mobile Quality & UX
**Goal**: The mobile app persists wizard state across backgrounding, validates all inputs before submission, uses safe area insets correctly, and supports screen readers on interactive elements
**Depends on**: Phase 21
**Requirements**: MSTATE-01, MSTATE-02, MSTATE-03, MNAV-01, MNAV-02, MNAV-03, MVAL-01, MVAL-02, MVAL-03, MVAL-04, MVAL-05, MUX-01, MUX-02, MUX-03, MUX-04, MUX-05, MUX-06, MUX-07, MA11Y-01, MA11Y-02, MA11Y-03, MA11Y-04
**Success Criteria** (what must be TRUE):
  1. Backgrounding the app mid-wizard and returning restores the exact step, rental ID, and form data -- no data loss
  2. The discard-changes dialog appears when pressing back on any wizard step (not just the first), and return submission uses router.replace (no stale screens in back stack)
  3. Entering non-numeric text in the daily rate field or an implausible mileage value shows a validation error before submission
  4. Bottom bar buttons and the offline banner render correctly on devices with notches -- no overlap with the status bar or home indicator
  5. Filter chips, search bar, and form inputs have accessibility roles and labels that a screen reader can announce
**Plans**: TBD

### Phase 24: Web Quality & Accessibility
**Goal**: Every web page handles errors gracefully with retry, all forms validate before submission, interactive elements are keyboard-accessible with proper ARIA attributes, and layouts adapt to small screens
**Depends on**: Phase 21
**Requirements**: WERR-01, WERR-02, WERR-03, WERR-04, WERR-05, WERR-06, WERR-07, WVAL-01, WVAL-02, WVAL-03, WVAL-04, WVAL-05, WA11Y-01, WA11Y-02, WA11Y-03, WA11Y-04, WA11Y-05, WA11Y-06, WA11Y-07, WA11Y-08, WUI-01, WUI-02, WUI-03, WUI-04, WUI-05, WPERF-01, WPERF-02, WPERF-03, WPERF-04, WRESP-01, WRESP-02, WRESP-03
**Success Criteria** (what must be TRUE):
  1. When the API returns a 500 on any detail page (vehicle, customer, rental, contract), the page shows an error message with a working retry button -- no blank screens or infinite spinners
  2. Submitting a rental form with daily rate empty, or extending a rental with an earlier end date, shows inline validation errors and prevents submission
  3. All interactive elements (filter chips, collapsible cards, calendar blocks, damage pins) can be reached and activated via keyboard Tab/Enter -- no mouse-only interactions
  4. Shared components (ErrorState, EmptyState, statusConfig, getInitials) are defined once and imported -- no duplicated inline patterns across pages
  5. Action buttons on vehicle/rental detail pages and filter bars wrap or scroll properly on viewports under 768px wide
**Plans**: TBD

### Phase 25: Infrastructure & CI/CD
**Goal**: CI pipeline tests all components (API, web, mobile) with real service dependencies (Redis), enforces coverage thresholds, and deployment includes health checks and proper migrations
**Depends on**: Phase 20
**Requirements**: CICD-01, CICD-02, CICD-03, CICD-04, CICD-05, CICD-06, CICD-07, CICD-08, CICD-09, ICONF-01, ICONF-02, ICONF-03, ICONF-04, ICONF-05, ICONF-06, ICONF-07, ICONF-08, ICONF-09
**Success Criteria** (what must be TRUE):
  1. CI workflow includes a Redis service container and mobile app typecheck+test -- all three apps (API, web, mobile) are verified on every PR
  2. Deployment pipeline runs `prisma migrate deploy` before the API starts, and post-deploy health check uses a polling loop (not a fixed sleep)
  3. Puppeteer/Chromium is installed in the API Docker production image -- PDF generation works in the deployed container
  4. CI enforces a minimum test coverage threshold -- builds fail if coverage drops below the configured percentage
  5. Unused dependencies (bullmq, @nestjs/cli in web, @gorhom/bottom-sheet) are removed; zod and typescript versions are aligned across all packages
**Plans**: TBD

### Phase 26: Code Quality & Cleanup
**Goal**: Codebase has no TypeScript `any` types in API services, no unguarded non-null assertions, no dead code, and shared types are defined once -- the code is maintainable for the next milestone
**Depends on**: Phases 20, 21, 22, 23, 24, 25
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, QUAL-06, QUAL-07, QUAL-08, QUAL-09, QUAL-10
**Success Criteria** (what must be TRUE):
  1. Searching for `: any` in API service files returns zero results -- all types are explicit
  2. Shared package exports PaginatedResponse and RentalWithRelations types -- web and API import from @rentapp/shared instead of defining locally
  3. Running the linter with unused-imports rule shows no dead imports; unused DB fields are documented with a comment explaining retention reason
  4. Database has indexes on Contract.createdById, CepikVerification.status, and Notification.createdAt -- confirmed via Prisma schema
  5. FIELD_ENCRYPTION_KEY is validated as required on startup in all environments, with a logged warning if using a dev fallback value
**Plans**: TBD

## Progress

**Execution Order:**
v1.0: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 9.1
v1.1: 10 -> 11 -> 12 -> 13 -> 14
v2.0: 15 -> 16 & 17 (parallel) -> 18 -> 19
v2.1: 20 -> 21 -> 22 & 23 & 24 (parallel after 21) -> 25 (after 20) -> 26 (after all)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9.1 | v1.0 | 37/37 | Complete | 2026-03-25 |
| 10-14 | v1.1 | 14/14 | Complete | 2026-03-25 |
| 15-19 | v2.0 | 7/7 | Complete | 2026-03-27 |
| 20. Security Hardening | 2/2 | Complete    | 2026-03-27 | - |
| 21. Critical Bug Fixes | v2.1 | 0/? | Not started | - |
| 22. API Validation & Performance | v2.1 | 0/? | Not started | - |
| 23. Mobile Quality & UX | v2.1 | 0/? | Not started | - |
| 24. Web Quality & Accessibility | v2.1 | 0/? | Not started | - |
| 25. Infrastructure & CI/CD | v2.1 | 0/? | Not started | - |
| 26. Code Quality & Cleanup | v2.1 | 0/? | Not started | - |
