# Roadmap: RentApp

## Overview

RentApp replaces a paper-based car rental workflow with a digital system spanning mobile (field employees), web (admin), and a customer portal. v2.2 fixes the failing Android APK build so the mobile app can be deployed to 9 field Android devices.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-9 + 9.1 (shipped 2026-03-25)
- ✅ **v1.1 Quality, Polish & UX Improvements** - Phases 10-14 (shipped 2026-03-25)
- ✅ **v2.0 Production Ready** - Phases 15-19 (shipped 2026-03-27)
- ✅ **v2.1 Fix All Audit Issues** - Phases 20-26 (shipped 2026-03-28)
- 🚧 **v2.2 Android APK Build Fix** - Phase 27 (in progress)

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

### v2.2 Android APK Build Fix

- [ ] **Phase 27: Android APK Build Fix** - Diagnose and fix EAS Build configuration, assets, and Gradle build to produce an installable APK

## Phase Details

### Phase 27: Android APK Build Fix
**Goal**: Field employees can install the RentApp mobile app on their Android devices via a working APK built through EAS Build
**Depends on**: Phase 26
**Requirements**: BUILD-01, BUILD-02, BUILD-03, ASSET-01, ASSET-02, ASSET-03, VERIFY-01, VERIFY-02
**Success Criteria** (what must be TRUE):
  1. Running `eas build --platform android --profile preview` completes successfully with no Gradle errors
  2. The built APK file installs and launches on an Android device without crashes
  3. app.config.ts contains the correct Android package name (pl.kitek.rental) and all required Android configuration fields
  4. eas.json preview profile is configured to produce an APK file (not an AAB bundle)
  5. All required Expo assets -- icon.png, splash.png, and adaptive-icon.png -- exist in the project at their correct dimensions
**Plans**: 2 plans

Plans:
- [ ] 27-01-PLAN.md -- Fix build dependencies, Metro config, and git tracking
- [ ] 27-02-PLAN.md -- Trigger EAS Build and verify APK on device

## Progress

**Execution Order:**
v1.0: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 9.1
v1.1: 10 -> 11 -> 12 -> 13 -> 14
v2.0: 15 -> 16 & 17 (parallel) -> 18 -> 19
v2.1: 20 -> 21 -> 22 & 23 & 24 (parallel after 21) -> 25 (after 20) -> 26 (after all)
v2.2: 27 (01 -> 02)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9.1 | v1.0 | 37/37 | Complete | 2026-03-25 |
| 10-14 | v1.1 | 14/14 | Complete | 2026-03-25 |
| 15-19 | v2.0 | 7/7 | Complete | 2026-03-27 |
| 20-26 | v2.1 | 26/26 | Complete | 2026-03-28 |
| 27. Android APK Build Fix | 1/2 | In Progress|  | - |
