# Roadmap: RentApp

## Overview

RentApp replaces a paper-based car rental workflow with a digital system spanning mobile (field employees), web (admin), and a customer portal. v2.3 overhauls authentication to username-based login, enables worker management, fixes critical bugs, and adds vehicle import and interactive damage mapping.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-9 + 9.1 (shipped 2026-03-25)
- ✅ **v1.1 Quality, Polish & UX Improvements** - Phases 10-14 (shipped 2026-03-25)
- ✅ **v2.0 Production Ready** - Phases 15-19 (shipped 2026-03-27)
- ✅ **v2.1 Fix All Audit Issues** - Phases 20-26 (shipped 2026-03-28)
- ✅ **v2.2 Android APK Build Fix** - Phase 27 (shipped 2026-03-29)
- **v2.3 User Management, Login Overhaul & Feature Additions** - Phases 28-32 (in progress)

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

### v2.3 User Management, Login Overhaul & Feature Additions (In Progress)

- [x] **Phase 28: Bug Fixes & Auth Foundation** - Fix critical bugs and add username field to auth system (completed 2026-03-29)
- [x] **Phase 29: Auth Overhaul & User Management** - Username-based login across web/mobile with worker account creation (completed 2026-03-29)
- [x] **Phase 30: Customer Search Verification** - Verify customer search works end-to-end across all query types (completed 2026-03-29)
- [x] **Phase 31: Vehicle Import** - Bulk vehicle import from Excel/CSV in admin panel (completed 2026-03-29)
- [ ] **Phase 32: Interactive Damage Map** - SVG-based car diagram for marking damage locations

## Phase Details

### Phase 28: Bug Fixes & Auth Foundation
**Goal**: Critical bugs are fixed and the auth system supports username-based login at the API level
**Depends on**: Nothing (first phase of v2.3)
**Requirements**: BUG-01, BUG-02, AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. Admin can click "Uzytkownicy" tab in web panel without being logged out
  2. Signature canvas clears properly between all 4 signature steps during contract signing
  3. API User model has a username field and existing admin account has username "admin"
  4. API login endpoint accepts username as a valid credential (alongside email for backward compatibility)
**Plans:** 2/2 plans complete
Plans:
- [ ] 28-01-PLAN.md -- Fix middleware logout bug and signature canvas clearing
- [ ] 28-02-PLAN.md -- Add username to User model, update login to accept username or email

### Phase 29: Auth Overhaul & User Management
**Goal**: Admin and mobile login use username/password, and admin can create worker accounts that work immediately
**Depends on**: Phase 28
**Requirements**: AUTH-04, AUTH-05, AUTH-06, USER-01, USER-02, USER-03, USER-04
**Success Criteria** (what must be TRUE):
  1. Admin logs in to web panel with username + password (email login no longer shown)
  2. Worker logs in to mobile app with username + password (email login no longer shown)
  3. Admin creates a new worker account in web panel with username and temporary password (no email required)
  4. Newly created worker can immediately open mobile app and log in with the credentials admin just set
  5. Admin panel and mobile app use separate auth contexts (compromising one does not affect the other)
**Plans:** 3/3 plans complete
Plans:
- [ ] 29-01-PLAN.md -- API auth context separation (JWT_MOBILE_SECRET, MobileJwtStrategy, worker creation with password)
- [ ] 29-02-PLAN.md -- Web admin login overhaul and worker creation form with username/password
- [ ] 29-03-PLAN.md -- Mobile app login overhaul from email to username

### Phase 30: Customer Search Verification
**Goal**: Customer search works reliably across all three query types in mobile app
**Depends on**: Nothing (independent of other v2.3 phases)
**Requirements**: SRCH-01, SRCH-02, SRCH-03
**Success Criteria** (what must be TRUE):
  1. Worker searches by phone number in mobile app and finds the correct customer
  2. Worker searches by PESEL in mobile app and finds the correct customer
  3. Worker searches by last name in mobile app and finds matching customers
**Plans:** 1/1 plans complete
Plans:
- [ ] 30-01-PLAN.md -- Verify and fix customer search across phone, PESEL, and lastName

### Phase 31: Vehicle Import
**Goal**: Admin can bulk-import vehicles from spreadsheet files instead of adding them one by one
**Depends on**: Nothing (independent of other v2.3 phases)
**Requirements**: VIMP-01, VIMP-02, VIMP-03, VIMP-04, VIMP-05
**Success Criteria** (what must be TRUE):
  1. Admin sees an upload button for .xlsx and .csv files on the vehicles page in web panel
  2. Uploading a valid file creates vehicle records with make, model, year, and plate populated
  3. Vehicles with missing optional fields (e.g., VIN, color) import without errors
  4. After import completes, admin sees a summary showing how many vehicles were added, skipped, or had errors
**Plans:** 1/1 plans complete
Plans:
- [ ] 31-01-PLAN.md -- Fix BFF proxy for multipart uploads and build import UI dialog

### Phase 32: Interactive Damage Map
**Goal**: Workers mark vehicle damage on a visual car diagram instead of selecting from a text checklist
**Depends on**: Nothing (independent of other v2.3 phases)
**Requirements**: DMAP-01, DMAP-02, DMAP-03, DMAP-04
**Success Criteria** (what must be TRUE):
  1. Damage documentation screen shows an SVG car outline instead of the old checklist
  2. Worker taps a body part on the car diagram and a modal opens for damage details
  3. Worker can select damage type (scratch/dent/crack/other) and add notes in the modal
  4. Marked damage points appear as visual indicators on the car outline after being saved
**Plans**: TBD

## Progress

**Execution Order:**
v1.0: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 9.1
v1.1: 10 -> 11 -> 12 -> 13 -> 14
v2.0: 15 -> 16 & 17 (parallel) -> 18 -> 19
v2.1: 20 -> 21 -> 22 & 23 & 24 (parallel after 21) -> 25 (after 20) -> 26 (after all)
v2.2: 27
v2.3: 28 -> 29 -> 30 & 31 & 32 (parallel after 28)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9.1 | v1.0 | 37/37 | Complete | 2026-03-25 |
| 10-14 | v1.1 | 14/14 | Complete | 2026-03-25 |
| 15-19 | v2.0 | 7/7 | Complete | 2026-03-27 |
| 20-26 | v2.1 | 26/26 | Complete | 2026-03-28 |
| 27 | v2.2 | 2/2 | Complete | 2026-03-29 |
| 28. Bug Fixes & Auth Foundation | 2/2 | Complete    | 2026-03-29 | - |
| 29. Auth Overhaul & User Management | 3/3 | Complete    | 2026-03-29 | - |
| 30. Customer Search Verification | 1/1 | Complete    | 2026-03-29 | - |
| 31. Vehicle Import | 1/1 | Complete   | 2026-03-29 | - |
| 32. Interactive Damage Map | v2.3 | 0/? | Not started | - |
