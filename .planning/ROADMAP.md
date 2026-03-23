# Roadmap: RentApp

## Overview

RentApp replaces a paper-based car rental workflow with a digital system spanning mobile (field employees), web (admin), and a customer portal. The roadmap moves from data foundations through the core rental lifecycle, then layering on the three client interfaces, and finally adding notifications and differentiation features. Nine phases deliver 42 v1 requirements with fine granularity matching the system's multi-client, multi-domain complexity.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation and Auth** - Project scaffold, database schema, authentication with roles, and immutable audit trail (completed 2026-03-23)
- [x] **Phase 2: Fleet and Customer Data** - Vehicle fleet management and customer database with encrypted PII (completed 2026-03-23)
- [x] **Phase 3: Rental Lifecycle** - Rental state machine, calendar with double-booking prevention, extension and return workflows (completed 2026-03-23)
- [ ] **Phase 4: Contract and PDF** - Digital contract creation, signature capture, PDF generation from template, email delivery
- [ ] **Phase 5: Admin Panel** - Web-based admin interface with full CRUD, search/filter, and audit trail viewing
- [ ] **Phase 6: Mobile App** - Cross-platform field employee app for the complete rental workflow
- [ ] **Phase 7: Photo and Damage Documentation** - Structured vehicle photo capture with damage marking on SVG diagrams
- [ ] **Phase 8: Notifications and Alerts** - SMS via smsapi.pl, email notifications, and configurable multi-channel alert system
- [ ] **Phase 9: Customer Portal and CEPiK** - Customer self-service portal and driver license verification

## Phase Details

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
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Mobile App
**Goal**: Field employee can complete the entire rental workflow on a mobile device -- from customer lookup through contract signing to rental submission
**Depends on**: Phase 5
**Requirements**: MOB-01, MOB-02, MOB-03
**Success Criteria** (what must be TRUE):
  1. Employee can install and log into the app on both Android and iOS devices
  2. Employee can search/add a customer, select a vehicle, fill out a contract, capture a signature, and submit a rental -- all from the mobile app
  3. Employee can process a vehicle return in the mobile app (mileage, checklist, state comparison)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Photo and Damage Documentation
**Goal**: Structured vehicle photo documentation with interactive damage marking enables visual comparison between handover and return condition
**Depends on**: Phase 6
**Requirements**: PHOTO-01, PHOTO-02, PHOTO-03, DMG-01, DMG-02
**Success Criteria** (what must be TRUE):
  1. Employee can perform a structured photo walkthrough of a vehicle at handover and return -- each photo tagged with timestamp and GPS
  2. Photos are linked to the specific rental and viewable in a side-by-side handover vs. return comparison
  3. Employee can mark damage on an interactive SVG vehicle diagram (tap, pin, attach photo)
  4. System shows a side-by-side comparison of damage diagrams from handover and return
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

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
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Customer Portal and CEPiK
**Goal**: Customers can view their rental information through a self-service portal, and the system verifies driver licenses through CEPiK 2.0 before contract signing
**Depends on**: Phase 8
**Requirements**: CEPIK-01, CEPIK-02, PORTAL-01, PORTAL-02
**Success Criteria** (what must be TRUE):
  1. Customer can access a read-only portal via a magic link received in the contract email
  2. Customer can view active rentals, rental history, return dates, and download PDF contracts from the portal
  3. System checks driver license status (suspension, validity) via CEPiK 2.0 API before contract signing
  4. CEPiK verification is asynchronous -- rental can proceed without it via manual fallback when the API is unavailable
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Auth | 7/7 | Complete   | 2026-03-23 |
| 2. Fleet and Customer Data | 3/3 | Complete   | 2026-03-23 |
| 3. Rental Lifecycle | 3/3 | Complete    | 2026-03-23 |
| 4. Contract and PDF | 0/2 | Not started | - |
| 5. Admin Panel | 0/? | Not started | - |
| 6. Mobile App | 0/? | Not started | - |
| 7. Photo and Damage Documentation | 0/? | Not started | - |
| 8. Notifications and Alerts | 0/? | Not started | - |
| 9. Customer Portal and CEPiK | 0/? | Not started | - |
