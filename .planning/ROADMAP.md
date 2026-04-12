# Roadmap: RentApp

## Overview

RentApp replaces a paper-based car rental workflow with a digital system spanning mobile (field employees), web (admin), and a customer portal. v3.0 adds client-requested features: document OCR scanning, vehicle classes, editable contract terms, company/NIP support, Google Places for pickup/return locations, second driver with CEPiK, PDF encryption, return protocol, and settlement tracking.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-9 + 9.1 (shipped 2026-03-25)
- ✅ **v1.1 Quality, Polish & UX Improvements** - Phases 10-14 (shipped 2026-03-25)
- ✅ **v2.0 Production Ready** - Phases 15-19 (shipped 2026-03-27)
- ✅ **v2.1 Fix All Audit Issues** - Phases 20-26 (shipped 2026-03-28)
- ✅ **v2.2 Android APK Build Fix** - Phase 27 (shipped 2026-03-29)
- ✅ **v2.3 User Management, Login Overhaul & Feature Additions** - Phases 28-32 (shipped 2026-03-29)
- 🚧 **v3.0 Client Features & Contract Enhancements** - Phases 33-39 (in progress)

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

<details>
<summary>v2.1 Fix All Audit Issues (Phases 20-26) -- SHIPPED 2026-03-28</summary>

- [x] **Phase 20: Security Hardening** (completed 2026-03-27)
- [x] **Phase 21: Critical Bug Fixes** (completed 2026-03-27)
- [x] **Phase 22: API Validation & Performance** (completed 2026-03-27)
- [x] **Phase 23: Mobile Quality & UX** (completed 2026-03-27)
- [x] **Phase 24: Web Quality & Accessibility** (completed 2026-03-27)
- [x] **Phase 25: Infrastructure & CI/CD** (completed 2026-03-27)
- [x] **Phase 26: Code Quality & Cleanup** (completed 2026-03-28)

</details>

<details>
<summary>v2.2 Android APK Build Fix (Phase 27) -- SHIPPED 2026-03-29</summary>

- [x] **Phase 27: Android APK Build Fix** (completed 2026-03-29)

</details>

<details>
<summary>v2.3 User Management, Login Overhaul & Feature Additions (Phases 28-32) -- SHIPPED 2026-03-29</summary>

- [x] **Phase 28: Bug Fixes & Auth Foundation** (completed 2026-03-29)
- [x] **Phase 29: Auth Overhaul & User Management** (completed 2026-03-29)
- [x] **Phase 30: Customer Search Verification** (completed 2026-03-29)
- [x] **Phase 31: Vehicle Import** (completed 2026-03-29)
- [x] **Phase 32: Interactive Damage Map** (completed 2026-03-29)

</details>

### v3.0 Client Features & Contract Enhancements (In Progress)

**Milestone Goal:** Full suite of client-requested features -- document OCR, vehicle classes, editable terms, company support, Google Places, second driver, PDF encryption, return protocol, settlement tracking.

- [x] **Phase 33: Foundation -- Schema & Simple Fields** - New DB models, customer address/company/VAT fields, vehicle classes, insurance case number in mobile (completed 2026-04-12)
- [x] **Phase 34: ContractFrozenData v2 & PDF Template Rewrite** - Versioned frozen data schema, single coordinated PDF template rewrite for all contract-touching features (completed 2026-04-12)
- [ ] **Phase 35: Google Places Integration** - Pickup/return location autocomplete via backend-proxied Google Places API
- [ ] **Phase 36: OCR Document Scanning** - On-device OCR for Polish ID card and driver license with worker review/correction
- [ ] **Phase 37: Contract Delivery -- PDF Encryption & Email** - Encrypted PDF with registration-plate password, SMS password notification, smart email subjects
- [ ] **Phase 38: Settlement & VAT Notification** - Rental settlement lifecycle tracking in web admin, VAT collection reminder at return
- [ ] **Phase 39: Return Protocol** - Structured return protocol document generated per client template

## Phase Details

### Phase 33: Foundation -- Schema & Simple Fields
**Goal**: Workers can capture complete client data (address, company/NIP, VAT status) and admins can organize the fleet by vehicle class, while insurance case numbers are tracked per rental
**Depends on**: Phase 32 (v2.3 complete)
**Requirements**: KLIENT-01, KLIENT-02, KLIENT-03, KLIENT-04, FLOTA-01, FLOTA-02, FLOTA-03, NAJEM-01
**Success Criteria** (what must be TRUE):
  1. Worker can mark a customer as a company, enter NIP, and the system rejects invalid NIP formats
  2. Worker can set customer VAT payer status (100% / 50% / nie) in the mobile app
  3. Worker can enter a full customer address (street, number, postal code, city) in the mobile rental wizard
  4. Admin can create, edit, and delete vehicle classes in the web panel, and assign a class to any vehicle
  5. Worker can enter an optional insurance case number when creating a rental
**Plans**: 4 plans

Plans:
- [x] 33-01-PLAN.md — Prisma schema, migration, shared Zod schemas, NIP validator
- [x] 33-02-PLAN.md — VehicleClasses API module, NIP decorator, update all DTOs/services
- [x] 33-03-PLAN.md — Mobile wizard: draft store, address fields, company/NIP/VAT toggle, insurance toggle
- [x] 33-04-PLAN.md — Web admin: /klasy CRUD page, vehicle class dropdown, rental detail/filters, customer address

### Phase 34: ContractFrozenData v2 & PDF Template Rewrite
**Goal**: All contract-touching features are delivered in a single coordinated pass -- the PDF contract reflects company data, VAT status, editable terms, terms acceptance, custom notes, second driver, and hides VIN/year from client
**Depends on**: Phase 33
**Requirements**: KLIENT-05, FLOTA-04, FLOTA-05, UMOWA-01, UMOWA-02, UMOWA-03, UMOWA-04, NAJEM-05, NAJEM-06, NAJEM-07
**Success Criteria** (what must be TRUE):
  1. Admin can edit default rental terms (rich text) in the web panel, and worker can customize terms per rental in mobile -- terms are locked once customer begins signing
  2. Customer must check an acceptance checkbox confirming they read the terms before signing the contract
  3. Worker can add a second driver with full personal data and driver license number; second driver is verified via CEPiK just like the main renter
  4. Generated PDF contract shows company name/NIP (if company), VAT status, custom terms, terms notes, second driver data, and does NOT show VIN or production year
  5. Old contracts (pre-v3.0) continue to render correctly with no missing fields or template errors
**Plans**: 5 plans

Plans:
- [x] 34-01-PLAN.md — Schema + shared types v2 + Settings API + RentalDrivers service
- [x] 34-02-PLAN.md — ContractFrozenData v2 buildFrozenData + PDF template rewrite + dynamic signatures
- [x] 34-03-PLAN.md — Second driver REST API + CEPiK extension + Portal VIN/year hiding
- [x] 34-04-PLAN.md — Web admin TipTap terms editor (/ustawienia settings page)
- [x] 34-05-PLAN.md — Mobile: terms WebView + acceptance checkbox + second driver form + 6-signature flow

### Phase 35: Google Places Integration
**Goal**: Workers can select real addresses for vehicle pickup and return locations using autocomplete instead of typing free-text
**Depends on**: Phase 33
**Requirements**: NAJEM-02, NAJEM-03, NAJEM-04
**Success Criteria** (what must be TRUE):
  1. Worker can type a partial address in the pickup location field and select from Google Places autocomplete suggestions
  2. Worker can type a partial address in the return location field and select from Google Places autocomplete suggestions
  3. Selected pickup and return addresses are saved with the rental and visible in rental details (mobile and web)
**Plans**: TBD

Plans:
- [ ] 35-01: TBD

### Phase 36: OCR Document Scanning
**Goal**: Workers can photograph a client's ID card and driver license, and the system pre-fills customer data from the photos, saving 2-3 minutes per rental
**Depends on**: Phase 33 (customer schema with address fields must exist)
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06
**Success Criteria** (what must be TRUE):
  1. Worker can photograph a client's ID card in the mobile app and the system extracts name, surname, PESEL, document number, and address
  2. Worker can photograph a client's driver license and the system extracts license number, categories, and expiry date
  3. Worker can review and correct all OCR-extracted fields before saving to the customer record
  4. Photographed document images are stored in R2 and linked to the customer record
**Plans**: TBD

Plans:
- [ ] 36-01: TBD
- [ ] 36-02: TBD

### Phase 37: Contract Delivery -- PDF Encryption & Email
**Goal**: Contract PDFs are encrypted for RODO compliance, customers receive the password via SMS, and email subjects are informative for inbox filtering
**Depends on**: Phase 34 (PDF template must be finalized before adding encryption post-processing)
**Requirements**: UMOWA-05, UMOWA-06, UMOWA-07
**Success Criteria** (what must be TRUE):
  1. Generated contract PDF is encrypted with a password equal to the vehicle registration number
  2. Customer receives an SMS with the PDF password when the contract email is sent (password is NOT in the email)
  3. Contract email subject contains the insurance case number (if present) and the vehicle registration number
**Plans**: TBD

Plans:
- [ ] 37-01: TBD

### Phase 38: Settlement & VAT Notification
**Goal**: Admin has visibility into which rentals are financially settled, and workers are reminded to collect VAT documentation at vehicle return
**Depends on**: Phase 34 (VAT status must exist on customer/contract)
**Requirements**: ZWROT-02, ZWROT-03, ZWROT-04
**Success Criteria** (what must be TRUE):
  1. When a vehicle is returned and the customer is a VAT payer, the worker sees a notification/reminder to collect VAT documentation
  2. Admin can mark any rental as settled or unsettled in the web panel
  3. Admin can view a filtered list of all unsettled rentals in the web panel
**Plans**: TBD

Plans:
- [ ] 38-01: TBD

### Phase 39: Return Protocol
**Goal**: Vehicle returns produce a formal protocol document matching the client's required template
**Depends on**: Phase 34 (contract/PDF infrastructure), Phase 35 (return location data)
**Requirements**: ZWROT-01
**Success Criteria** (what must be TRUE):
  1. When a vehicle is returned, the system generates a return protocol PDF following the client-provided template
  2. Return protocol includes vehicle condition, return location, date/time, and signatures from both worker and customer
**Plans**: TBD

Plans:
- [ ] 39-01: TBD

## Progress

**Execution Order:**
v1.0: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 9.1
v1.1: 10 -> 11 -> 12 -> 13 -> 14
v2.0: 15 -> 16 & 17 (parallel) -> 18 -> 19
v2.1: 20 -> 21 -> 22 & 23 & 24 (parallel after 21) -> 25 (after 20) -> 26 (after all)
v2.2: 27
v2.3: 28 -> 29 -> 30 & 31 & 32 (parallel after 28)
v3.0: 33 -> 34 -> 35 & 36 (parallel, both depend on 33) -> 37 (after 34) -> 38 (after 34) -> 39 (after 34 & 35)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9.1 | v1.0 | 37/37 | Complete | 2026-03-25 |
| 10-14 | v1.1 | 14/14 | Complete | 2026-03-25 |
| 15-19 | v2.0 | 7/7 | Complete | 2026-03-27 |
| 20-26 | v2.1 | 26/26 | Complete | 2026-03-28 |
| 27 | v2.2 | 2/2 | Complete | 2026-03-29 |
| 28-32 | v2.3 | 9/9 | Complete | 2026-03-29 |
| 33. Foundation | v3.0 | 4/4 | Complete | 2026-04-12 |
| 34. PDF Template | v3.0 | Complete    | 2026-04-12 | 2026-04-12 |
| 35. Google Places | v3.0 | 0/? | Not started | - |
| 36. OCR Scanning | v3.0 | 0/? | Not started | - |
| 37. PDF Encryption | v3.0 | 0/? | Not started | - |
| 38. Settlement | v3.0 | 0/? | Not started | - |
| 39. Return Protocol | v3.0 | 0/? | Not started | - |
