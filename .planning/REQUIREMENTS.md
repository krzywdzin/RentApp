# Requirements: RentApp v2.2

**Defined:** 2026-03-29
**Core Value:** Working Android APK build for field deployment on 9 Android devices

## v2.2 Requirements

Requirements for Android APK build fix. Each maps to roadmap phases.

### Build Configuration

- [ ] **BUILD-01**: EAS Build preview profile produces installable Android APK
- [ ] **BUILD-02**: app.config.ts has correct Android package name (pl.kitek.rental) and configuration
- [ ] **BUILD-03**: eas.json preview profile configured for APK (not AAB) output

### Assets

- [ ] **ASSET-01**: Required app icon (icon.png) exists at correct dimensions
- [ ] **ASSET-02**: Required splash screen (splash.png) exists at correct dimensions
- [ ] **ASSET-03**: Required adaptive icon (adaptive-icon.png) exists at correct dimensions

### Verification

- [ ] **VERIFY-01**: `eas build --platform android --profile preview` completes successfully
- [ ] **VERIFY-02**: Built APK is installable on Android devices

## Future Requirements

None — this is a focused fix milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| iOS build | Focus on Android first, iOS later |
| App Store / Play Store publishing | APK sideload only for now |
| Build optimization / caching | Fix first, optimize later |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUILD-01 | Phase 27 | Pending |
| BUILD-02 | Phase 27 | Pending |
| BUILD-03 | Phase 27 | Pending |
| ASSET-01 | Phase 27 | Pending |
| ASSET-02 | Phase 27 | Pending |
| ASSET-03 | Phase 27 | Pending |
| VERIFY-01 | Phase 27 | Pending |
| VERIFY-02 | Phase 27 | Pending |

**Coverage:**
- v2.2 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 after initial definition*
