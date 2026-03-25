# Roadmap: RentApp

## Overview

RentApp replaces a paper-based car rental workflow with a digital system spanning mobile (field employees), web (admin), and a customer portal. The roadmap moves from data foundations through the core rental lifecycle, then layering on the three client interfaces, and finally adding notifications and differentiation features. Nine phases deliver 42 v1 requirements with fine granularity matching the system's multi-client, multi-domain complexity.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-9 + 9.1 (shipped 2026-03-25)
- 🚧 **v1.1 Quality, Polish & UX Improvements** - Phases 10-14 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-9 + 9.1) -- SHIPPED 2026-03-25</summary>

- [x] **Phase 1: Foundation and Auth** - Project scaffold, database schema, authentication with roles, and immutable audit trail (completed 2026-03-23)
- [x] **Phase 2: Fleet and Customer Data** - Vehicle fleet management and customer database with encrypted PII (completed 2026-03-23)
- [x] **Phase 3: Rental Lifecycle** - Rental state machine, calendar with double-booking prevention, extension and return workflows (completed 2026-03-23)
- [x] **Phase 4: Contract and PDF** - Digital contract creation, signature capture, PDF generation from template, email delivery (completed 2026-03-24)
- [x] **Phase 5: Admin Panel** - Web-based admin interface with full CRUD, search/filter, and audit trail viewing (completed 2026-03-24)
- [x] **Phase 6: Mobile App** - Cross-platform field employee app for the complete rental workflow (completed 2026-03-24)
- [x] **Phase 7: Photo and Damage Documentation** - Structured vehicle photo capture with damage marking on SVG diagrams (completed 2026-03-24)
- [x] **Phase 8: Notifications and Alerts** - SMS via smsapi.pl, email notifications, and configurable multi-channel alert system (completed 2026-03-24)
- [x] **Phase 9: Customer Portal and CEPiK** - Customer self-service portal and driver license verification (completed 2026-03-24)
- [x] **Phase 9.1: Mobile and Admin Bug Fixes** - Fix 7 bugs from user testing (completed 2026-03-25)

</details>

### v1.1 Quality, Polish & UX Improvements

- [ ] **Phase 10: Mobile UX Polish** - Loading skeletons, error states, guard rails, and human-readable feedback across all mobile screens
- [ ] **Phase 11: Web Admin Panel Polish** - User management, proper data display, validation, error states, and design system consistency
- [ ] **Phase 12: TypeScript Strictness** - Eliminate `any` types across backend services, web hooks, and shared types
- [ ] **Phase 13: Dependencies & Performance** - Fix Expo SDK 54 compatibility, align dependency versions, and resolve N+1 query bottlenecks
- [ ] **Phase 14: Test Coverage** - Component tests for web admin, smoke tests for mobile, and API coverage thresholds

## Phase Details

<details>
<summary>v1.0 Phase Details (Phases 1-9 + 9.1)</summary>

### Phase 1: Foundation and Auth
**Goal**: A running backend with authenticated users, role-based access, and an immutable audit trail that logs every mutation
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. Employee can log in with email and password and receive a session that persists across app/browser restarts
  2. Employee can reset a forgotten password via an email link and log in with the new password
  3. System enforces three distinct roles (admin, employee, customer) with different access levels -- unauthorized actions are rejected
  4. Every data mutation is recorded in an immutable audit log showing who, what, and when
  5. Dev environment runs locally (PostgreSQL, Redis, MinIO) with a single command
**Plans**: 7 plans

Plans:
- [x] 01-00-PLAN.md -- Wave 0 test stubs: scaffold all spec files required by VALIDATION.md
- [x] 01-01-PLAN.md -- Scaffold Turborepo monorepo, Docker Compose, Prisma schema, shared types, ESLint + Prettier config
- [x] 01-02-PLAN.md -- Guards (JwtAuthGuard, RolesGuard) and decorators (@Public, @Roles, @CurrentUser) with unit tests
- [x] 01-03-PLAN.md -- Users module (create account, setup token) and mail service (nodemailer/Mailpit) with unit tests
- [x] 01-04-PLAN.md -- Auth module: login with lockout, JWT access+refresh tokens, password setup/reset, wire global guards, e2e tests
- [x] 01-05-PLAN.md -- Audit trail interceptor, admin query endpoint, AES-256-GCM field encryption utility, tests
- [ ] 01-06-PLAN.md -- Gap closure: rewrite audit e2e spec with full AppModule, add EMPLOYEE 403 and GET-no-log assertions

### Phase 2: Fleet and Customer Data
**Goal**: Admin can manage the vehicle fleet and employees can create and search customer records with sensitive data properly encrypted
**Depends on**: Phase 1
**Requirements**: FLEET-01, FLEET-02, FLEET-03, CUST-01, CUST-02, CUST-03, CUST-04
**Success Criteria** (what must be TRUE):
  1. Admin can add, edit, and remove vehicles with all required fields (registration, VIN, make/model, mileage, insurance, inspection)
  2. Vehicle status (available, rented, service) updates automatically based on rental lifecycle events
  3. Admin can import a fleet from a CSV/XLS file and see the vehicles in the system
  4. Employee can create a new customer record with all personal data (name, phone, address, email, ID, PESEL, license)
  5. Sensitive fields (PESEL, ID number, license number) are encrypted at rest (AES-256-GCM) and searchable via HMAC -- raw values never appear in database dumps
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md -- Prisma schema (Vehicle + Customer), shared types/Zod schemas, StorageModule (MinIO), PESEL/VIN validators
- [ ] 02-02-PLAN.md -- VehicleModule CRUD, status transitions, document uploads, CSV/XLS fleet import with error reporting
- [ ] 02-03-PLAN.md -- CustomerModule with encrypted PII (AES-256-GCM), HMAC search, RODO retention cleanup

### Phase 3: Rental Lifecycle
**Goal**: The complete rental workflow functions end-to-end -- creation, calendar scheduling, state transitions, extensions, and structured returns
**Depends on**: Phase 2
**Requirements**: RENT-01, RENT-02, RENT-03, RENT-04, RENT-05
**Success Criteria** (what must be TRUE):
  1. Employee can create a rental linking a vehicle, customer, and date range (with time) -- the system prevents double-booking the same vehicle
  2. Calendar view shows all rentals on an interactive timeline with visual conflict indication
  3. Rental progresses through states (draft, active, extended, returned) following strict state machine rules -- invalid transitions are rejected
  4. Employee can process a structured vehicle return: record mileage, complete damage checklist, compare against handover state
  5. Admin can extend a rental with automatic date update, cost recalculation, and customer notification trigger
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md -- Prisma Rental model, shared types/Zod schemas, state machine constants, pricing utility, DTOs, module scaffold, test stubs
- [ ] 03-02-PLAN.md -- RentalsService CRUD, overlap detection (tstzrange), state machine enforcement, calendar endpoint, controller wiring
- [ ] 03-03-PLAN.md -- Vehicle return with inspection comparison, admin extension with cost recalculation, admin rollback, full e2e test suite

### Phase 4: Contract and PDF
**Goal**: The digital contract flow works end-to-end -- form entry, digital signature, PDF generation from the existing template, and automatic email delivery to the customer
**Depends on**: Phase 3
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05
**Success Criteria** (what must be TRUE):
  1. Employee can fill out a digital rental contract with customer data, vehicle info, and rental terms
  2. Customer can sign the contract digitally (finger/stylus) with full audit metadata captured (timestamp, device, content hash, witness employee ID)
  3. System generates a PDF matching the existing paper template with correct Polish characters and the embedded signature
  4. PDF is automatically emailed to the customer after signing
  5. When a rental is extended, the system creates a contract annex (versioned) linked to the original contract
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md -- Prisma schema (Contract, ContractSignature, ContractAnnex), shared types/Zod schemas, PdfService (Puppeteer + Handlebars), contract + annex templates, Wave 0 test stubs
- [ ] 04-02-PLAN.md -- ContractsService (create, sign, PDF generation, email delivery), ContractsController, rental.extended event listener for annexes, e2e tests

### Phase 5: Admin Panel
**Goal**: Admin has a complete web interface to manage all system entities, search and filter data, and review the audit trail
**Depends on**: Phase 4
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03
**Success Criteria** (what must be TRUE):
  1. Admin can perform full CRUD on vehicles, customers, rentals, and contracts through the web panel (desktop-first layout)
  2. Admin can search and filter data by registration number, customer name, date range, and perform bulk operations
  3. Admin can view the audit trail filtered by rental, vehicle, or employee -- seeing a chronological history of all actions
**Plans**: 4 plans

Plans:
- [ ] 05-01-PLAN.md -- Scaffold Next.js app, shadcn/ui dark theme, auth BFF proxy, middleware, admin layout (sidebar + top bar), reusable DataTable, dashboard
- [ ] 05-02-PLAN.md -- Vehicle and Customer CRUD pages with data tables, filters, bulk operations, Zod-validated forms, detail pages with tabs
- [ ] 05-03-PLAN.md -- Rental pages (list + calendar Gantt timeline), rental CRUD with state-aware actions, contract list and detail pages
- [ ] 05-04-PLAN.md -- Global audit trail page with server-side pagination, reusable AuditTrail component, wire Audyt tabs into all entity detail pages

### Phase 6: Mobile App
**Goal**: Field employee can complete the entire rental workflow on a mobile device -- from customer lookup through contract signing to rental submission
**Depends on**: Phase 5
**Requirements**: MOB-01, MOB-02, MOB-03
**Success Criteria** (what must be TRUE):
  1. Employee can install and log into the app on both Android and iOS devices
  2. Employee can search/add a customer, select a vehicle, fill out a contract, capture a signature, and submit a rental -- all from the mobile app
  3. Employee can process a vehicle return in the mobile app (mileage, checklist, state comparison)
**Plans**: 5 plans

Plans:
- [ ] 06-01-PLAN.md -- Scaffold Expo SDK 52 project, monorepo wiring, NativeWind + i18n config, API client with JWT refresh, Zustand stores, providers, root layout
- [ ] 06-02-PLAN.md -- Shared UI components (AppButton, AppInput, AppCard, etc.), login screen, tab navigation shell, profile tab with biometric toggle
- [ ] 06-03-PLAN.md -- API/query hooks for rentals/vehicles/customers, dashboard with stats and upcoming returns, rental list with search/filters, rental detail
- [ ] 06-04-PLAN.md -- 5-step rental creation wizard (customer, vehicle, dates, contract+RODO, 4-signature capture in landscape), success screen
- [ ] 06-05-PLAN.md -- 5-step vehicle return wizard (confirm, mileage, checklist, notes, review), end-to-end human verification

### Phase 7: Photo and Damage Documentation
**Goal**: Structured vehicle photo documentation with interactive damage marking enables visual comparison between handover and return condition
**Depends on**: Phase 6
**Requirements**: PHOTO-01, PHOTO-02, PHOTO-03, DMG-01, DMG-02
**Success Criteria** (what must be TRUE):
  1. Employee can perform a structured photo walkthrough of a vehicle at handover and return -- each photo tagged with timestamp and GPS
  2. Photos are linked to the specific rental and viewable in a side-by-side handover vs. return comparison
  3. Employee can mark damage on an interactive SVG vehicle diagram (tap, pin, attach photo)
  4. System shows a side-by-side comparison of damage diagrams from handover and return
**Plans**: 3 plans

Plans:
- [ ] 07-01-PLAN.md -- Prisma schema (PhotoWalkthrough, WalkthroughPhoto, DamageReport), shared types/Zod schemas, DTOs, SVG assets, PhotosModule scaffold, Wave 0 test stubs
- [ ] 07-02-PLAN.md -- PhotosService (Sharp resize, EXIF/GPS extraction, MinIO upload, walkthrough lifecycle) and DamageService (pin CRUD, no-damage confirmation, comparison), unit tests
- [ ] 07-03-PLAN.md -- E2e tests for photo and damage endpoints, admin panel comparison pages (side-by-side photos and damage diagrams)

### Phase 8: Notifications and Alerts
**Goal**: Automated SMS and email notifications keep customers informed, and a configurable alert system proactively warns about upcoming deadlines and overdue returns
**Depends on**: Phase 6
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, ALERT-01, ALERT-02
**Success Criteria** (what must be TRUE):
  1. System sends SMS via smsapi.pl for rental confirmation, return reminder (1 day before), and overdue alert
  2. System sends email with PDF contract attachment and rental confirmations
  3. When admin extends a rental, the system automatically sends an SMS to the customer with the new return date
  4. System generates alerts for: approaching return date, overdue return, expiring insurance, upcoming vehicle inspection
  5. Alerts are delivered multi-channel (email + SMS + in-app) with configurable rules (condition, channel, timing)
**Plans**: 2 plans

Plans:
- [ ] 08-01-PLAN.md -- Prisma schema (Notification, InAppNotification, AlertConfig), shared types/Zod, BullMQ queues, SmsService (smsapi.pl), SMS templates, AlertConfig CRUD, Wave 0 test stubs
- [ ] 08-02-PLAN.md -- NotificationsService orchestration, event listeners (rental.activated, rental.extended), daily cron scanner, email notifications, in-app API, full test implementation

### Phase 9: Customer Portal and CEPiK
**Goal**: Customers can view their rental information through a self-service portal, and the system verifies driver licenses through CEPiK 2.0 before contract signing
**Depends on**: Phase 8
**Requirements**: CEPIK-01, CEPIK-02, PORTAL-01, PORTAL-02
**Success Criteria** (what must be TRUE):
  1. Customer can access a read-only portal via a magic link received in the contract email
  2. Customer can view active rentals, rental history, return dates, and download PDF contracts from the portal
  3. System checks driver license status (suspension, validity) via CEPiK 2.0 API before contract signing
  4. CEPiK verification is asynchronous -- rental can proceed without it via manual fallback when the API is unavailable
**Plans**: 4 plans

Plans:
- [x] 09-01-PLAN.md -- Prisma schema (CepikVerification + Customer portal fields + Vehicle license category), shared types/Zod schemas, Wave 0 test stubs
- [x] 09-02-PLAN.md -- CepikModule with stub service, verify and override endpoints, role-based access, unit + e2e tests
- [x] 09-03-PLAN.md -- PortalModule API (auth exchange, JWT strategy, rentals/contracts endpoints), magic link in contract signing, mail update, e2e tests
- [x] 09-04-PLAN.md -- Portal web UI: (portal) route group, BFF proxy, token exchange, rental list and detail pages, human verification

### Phase 09.1: Mobile and Admin Bug Fixes (INSERTED)

**Goal:** Fix 7 bugs discovered during user testing -- signature offset, rental creation failure, draft deletion, user management, customer search, performance, and crash stability
**Requirements**: None (bug-fix phase)
**Depends on:** Phase 9
**Plans:** 4/4 plans complete

Plans:
- [x] 09.1-01-PLAN.md -- Fix customer search API param mismatch (BUG-5) and add draft rental deletion endpoint (BUG-3)
- [ ] 09.1-02-PLAN.md -- Fix signature canvas coordinate offset (BUG-1) and base64 data URI prefix corruption (BUG-2)
- [ ] 09.1-03-PLAN.md -- Add user management page to admin panel (BUG-4)
- [x] 09.1-04-PLAN.md -- Add error boundary for crash prevention (BUG-7) and optimize list rendering (BUG-6)

</details>

### Phase 10: Mobile UX Polish
**Goal**: Every mobile screen handles loading, empty, and error states gracefully -- the employee never sees a blank screen, raw enum, or silent failure
**Depends on**: Phase 9.1
**Requirements**: MOBUX-01, MOBUX-02, MOBUX-03, MOBUX-04, MOBUX-05, MOBUX-06, MOBUX-07
**Success Criteria** (what must be TRUE):
  1. Employee sees animated skeleton placeholders on every list screen while data loads (vehicle selection, return mileage, return confirm) -- never a blank white screen
  2. Customer search field shows a "type at least 2 characters" hint when empty, and a spinner while results are fetching
  3. When an API request fails on the rental detail screen, employee sees an error message with a retry button that re-fetches the data
  4. Navigating directly to a return wizard step without a rentalId redirects to the return start screen instead of submitting 0 km mileage
  5. Error messages throughout the app show human-readable Polish labels (e.g. "Oczekuje na zwrot") instead of raw enum values like "PENDING_RETURN"
**Plans**: 3 plans

Plans:
- [ ] 10-01-PLAN.md -- Loading skeletons for vehicle selection, customer search UX hints and spinner, rental detail error state with retry
- [ ] 10-02-PLAN.md -- Return wizard rentalId guards with redirect, OfflineBanner in return layout, Polish status labels
- [ ] 10-03-PLAN.md -- Dashboard greeting fallback for missing user name, PDF open failure error toast

### Phase 11: Web Admin Panel Polish
**Goal**: The admin panel displays real data with proper labels, validates forms consistently, handles errors visibly, and provides user management -- no more UUIDs, silent failures, or missing pages
**Depends on**: Phase 9.1
**Requirements**: WEBUX-01, WEBUX-02, WEBUX-03, WEBUX-04, WEBUX-05, WEBUX-06, WEBUX-07, WEBUX-08
**Success Criteria** (what must be TRUE):
  1. Admin can view, edit, deactivate, and reset passwords for system users from a dedicated user management page
  2. Rental list shows vehicle registration plates and customer names instead of truncated UUIDs, and rental detail "Umowa" tab displays the actual contract data
  3. Edit rental form validates input with inline Zod error messages (matching the create form pattern), and audit page date/actor filters actually filter the API query
  4. Dashboard, contract list, and entity detail pages show visible error states with retry when API requests fail -- not silent catches or infinite spinners
  5. Login page uses shadcn/ui Input components consistent with the rest of the design system
**Plans**: 3 plans

Plans:
- [x] 11-01-PLAN.md -- User management API endpoints and DataTable page with edit, deactivate, password reset
- [x] 11-02-PLAN.md -- Rental list columns fix, contract tab wiring, edit form Zod validation, Polish status labels
- [x] 11-03-PLAN.md -- Audit date/actor filter wiring, dashboard/contracts error states, login design system

### Phase 12: TypeScript Strictness
**Goal**: All `any` types in backend services, web mutation hooks, and shared portal types are replaced with proper TypeScript types -- the codebase compiles without implicit-any warnings
**Depends on**: Phase 9.1
**Requirements**: TSFIX-01, TSFIX-02, TSFIX-03, TSFIX-04, TSFIX-05, TSFIX-06
**Success Criteria** (what must be TRUE):
  1. Rental and contract service methods return typed DTOs and accept typed parameters -- no `Promise<any>` or `any` parameter types remain
  2. Damage service accesses Prisma JSON columns through a typed DamagePin interface instead of `as any` casts
  3. Portal controller uses a typed PortalRequest interface with customer context instead of `req: any`
  4. Web admin mutation hooks (create/update vehicle, customer, rental) use specific input types instead of `Record<string, unknown>`
  5. Shared portal types define a typed return data DTO replacing `returnData: any | null`
**Plans**: TBD

### Phase 13: Dependencies & Performance
**Goal**: Expo SDK 54 dependency tree is clean with no version conflicts, and server-side queries avoid N+1 patterns -- contract list and entity detail pages load in a single round-trip
**Depends on**: Phase 9.1
**Requirements**: DEPS-01, DEPS-02, DEPS-03, PERF-01, PERF-02
**Success Criteria** (what must be TRUE):
  1. `npx expo doctor` reports no dependency version mismatches for SDK 54 (expo-router, Sentry, react-native-webview all at compatible versions)
  2. react-native-webview is listed as an explicit dependency in mobile package.json (not silently resolved from a transitive dependency)
  3. Contract list page loads in a single database query using a join/batch approach -- no N+1 per-rental fetch visible in query logs
  4. Customer and vehicle detail pages pass a filter parameter to the rentals API endpoint and receive only relevant rentals -- not all rentals in the system
**Plans**: TBD

### Phase 14: Test Coverage
**Goal**: Critical UI paths have automated test coverage and the API enforces a minimum statement coverage threshold -- regressions in core screens and endpoints are caught before merge
**Depends on**: Phases 10, 11, 12, 13
**Requirements**: TEST-01, TEST-02, TEST-03
**Success Criteria** (what must be TRUE):
  1. Web admin panel has passing component tests for dashboard, rental list, vehicle list, and customer list pages (render + key interactions)
  2. Mobile app has passing smoke tests for login, dashboard, rental list, and at least one rental wizard step (render without crash)
  3. API Jest config enforces a minimum statement coverage threshold -- `npm test` fails if coverage drops below the configured minimum
**Plans**: TBD

## Progress

**Execution Order:**
v1.0: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 9.1
v1.1: 10 -> 11 -> 12 -> 13 -> 14

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation and Auth | v1.0 | 7/7 | Complete | 2026-03-23 |
| 2. Fleet and Customer Data | v1.0 | 3/3 | Complete | 2026-03-23 |
| 3. Rental Lifecycle | v1.0 | 3/3 | Complete | 2026-03-23 |
| 4. Contract and PDF | v1.0 | 0/2 | Complete | 2026-03-24 |
| 5. Admin Panel | v1.0 | 4/4 | Complete | 2026-03-24 |
| 6. Mobile App | v1.0 | 5/5 | Complete | 2026-03-24 |
| 7. Photo and Damage Documentation | v1.0 | 3/3 | Complete | 2026-03-24 |
| 8. Notifications and Alerts | v1.0 | 2/2 | Complete | 2026-03-24 |
| 9. Customer Portal and CEPiK | v1.0 | 4/4 | Complete | 2026-03-24 |
| 9.1 Mobile and Admin Bug Fixes | v1.0 | 4/4 | Complete | 2026-03-25 |
| 10. Mobile UX Polish | v1.1 | 3/3 | Complete | 2026-03-25 |
| 11. Web Admin Panel Polish | v1.1 | 3/3 | Complete | 2026-03-25 |
| 12. TypeScript Strictness | v1.1 | 0/? | Not started | - |
| 13. Dependencies & Performance | v1.1 | 0/? | Not started | - |
| 14. Test Coverage | v1.1 | 0/? | Not started | - |
