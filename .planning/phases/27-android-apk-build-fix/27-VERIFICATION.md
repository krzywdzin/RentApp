---
phase: 27-android-apk-build-fix
verified: 2026-03-29T10:00:00Z
status: human_needed
score: 7/8 must-haves verified
human_verification:
  - test: "Install APK on physical Android device"
    expected: "APK installs without error, app launches to login screen, adaptive icon displays correctly on supported launchers"
    why_human: "Device testing was explicitly deferred — EAS build success confirms Gradle/JS/asset packaging but does not confirm runtime behavior on a device. VERIFY-02 requires physical device confirmation."
---

# Phase 27: Android APK Build Fix Verification Report

**Phase Goal:** Field employees can install the RentApp mobile app on their Android devices via a working APK built through EAS Build
**Verified:** 2026-03-29T10:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | react-native-worklets is installed as a dependency | VERIFIED | `package.json` line 50: `"react-native-worklets": "0.5.1"` |
| 2 | metro.config.js preserves Expo default watchFolders | VERIFIED | `config.watchFolders = [...(config.watchFolders \|\| []), monorepoRoot]` at line 10 |
| 3 | .expo/ directory is gitignored and untracked | VERIFIED | `.gitignore` contains `.expo/`; `git ls-files apps/mobile/.expo/` returns empty |
| 4 | ios/ directory is removed from git tracking | VERIFIED | `.gitignore` contains `apps/mobile/ios/`; `git ls-files apps/mobile/ios/` returns empty |
| 5 | app.config.ts has correct Android package and adaptive icon config | VERIFIED | `android.package: 'pl.kitek.rental'`, adaptive icon with `foregroundImage` and `backgroundColor` confirmed |
| 6 | eas.json preview profile produces APK | VERIFIED | `"buildType": "apk"` in `build.preview.android`; `SENTRY_DISABLE_AUTO_UPLOAD: "true"` in env |
| 7 | EAS Build completes without Gradle errors | VERIFIED | Build ID 19544f1c-64bb-4151-8e31-2bd85becdf9c status FINISHED; APK URL confirmed |
| 8 | APK installs and launches on Android device | NEEDS HUMAN | Device testing deferred — build success alone does not confirm runtime behavior |

**Score:** 7/8 truths verified (1 deferred to human)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/mobile/package.json` | react-native-worklets dependency | VERIFIED | Line 50: `"react-native-worklets": "0.5.1"` |
| `apps/mobile/metro.config.js` | Spread watchFolders, preserve defaults | VERIFIED | 18-line config, correct spread pattern, `getDefaultConfig` called |
| `.gitignore` | Entries for .expo/ and apps/mobile/ios/ | VERIFIED | Both entries confirmed present |
| `apps/mobile/app.config.ts` | android.package, adaptiveIcon, splash, icon | VERIFIED | All required fields confirmed at correct values |
| `apps/mobile/eas.json` | preview.android.buildType = "apk" | VERIFIED | Correct; also contains `SENTRY_DISABLE_AUTO_UPLOAD: "true"` as expected deviation |
| `apps/mobile/assets/icon.png` | 1024x1024 PNG | VERIFIED | `PNG image data, 1024 x 1024, 8-bit/color RGB` |
| `apps/mobile/assets/adaptive-icon.png` | 1024x1024 PNG | VERIFIED | `PNG image data, 1024 x 1024, 8-bit/color RGB` |
| `apps/mobile/assets/splash.png` | 1284x2778 PNG | VERIFIED | `PNG image data, 1284 x 2778, 8-bit/color RGB` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `apps/mobile/package.json` | `react-native-reanimated` | peer dep react-native-worklets | WIRED | worklets 0.5.1 installed alongside reanimated ~4.1.7 |
| `apps/mobile/metro.config.js` | `expo/metro-config` | getDefaultConfig | WIRED | `const { getDefaultConfig } = require('expo/metro-config')` at line 1 |
| `eas build --platform android --profile preview` | EAS Build service | CLI trigger | WIRED | Build 19544f1c completed FINISHED; APK at https://expo.dev/artifacts/eas/48pQe2bHa5b9d7Aj3ykxuQ.apk |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BUILD-01 | 27-01 | EAS Build preview profile produces installable Android APK | SATISFIED | Build 19544f1c FINISHED with APK artifact |
| BUILD-02 | 27-01 | app.config.ts has correct Android package name and config | SATISFIED | `android.package: 'pl.kitek.rental'` verified in app.config.ts |
| BUILD-03 | 27-01 | eas.json preview profile configured for APK (not AAB) | SATISFIED | `"buildType": "apk"` confirmed in eas.json preview profile |
| ASSET-01 | 27-01 | icon.png exists at correct dimensions | SATISFIED | 1024x1024 PNG confirmed on disk |
| ASSET-02 | 27-01 | splash.png exists at correct dimensions | SATISFIED | 1284x2778 PNG confirmed on disk |
| ASSET-03 | 27-01 | adaptive-icon.png exists at correct dimensions | SATISFIED | 1024x1024 PNG confirmed on disk |
| VERIFY-01 | 27-02 | `eas build --platform android --profile preview` completes successfully | SATISFIED | Build 19544f1c status FINISHED, commit ef8fd5f confirmed |
| VERIFY-02 | 27-02 | Built APK is installable on Android devices | NEEDS HUMAN | Build produces APK artifact but physical device install not yet confirmed |

All 8 requirement IDs declared in PLAN frontmatter are accounted for. No orphaned requirements detected.

### Anti-Patterns Found

No anti-patterns detected in the modified files.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

### Human Verification Required

#### 1. Install APK on Physical Android Device

**Test:** Download the APK from https://expo.dev/artifacts/eas/48pQe2bHa5b9d7Aj3ykxuQ.apk. Transfer to an Android device, enable "Install from unknown sources" if needed, install, and launch.

**Expected:**
- APK installs without error
- App launches without crashing
- Login screen appears (confirms JS bundle loaded correctly)
- App icon displays correctly on the home screen (adaptive icon on supported launchers)

**Why human:** Physical device runtime behavior cannot be verified from source code or build logs. EAS Build success confirms the Gradle compilation, JS bundle generation, and asset packaging all succeeded — but crash-free launch and correct UI rendering require a device.

### Notes on Deviation Found

Plan 02 documented one auto-fixed deviation: the EAS Build initially failed because `@sentry/react-native` attempted source map upload during build without a `SENTRY_AUTH_TOKEN`. The fix — adding `"SENTRY_DISABLE_AUTO_UPLOAD": "true"` to the eas.json `preview` (and `development` and `staging`) profile env — is correct and confirmed in the file. For future production builds, `SENTRY_AUTH_TOKEN` should be configured as an EAS secret.

### Overall Assessment

All automated verifications pass. The build pipeline is fixed and working: the peer dependency is installed, Metro config correctly merges watchFolders, git tracking is clean, all required assets exist at correct dimensions, app.config.ts has the correct Android configuration, and EAS Build completed successfully producing a downloadable APK artifact.

The only outstanding item is VERIFY-02 — physical device testing, which was explicitly deferred by the implementer. This is appropriately flagged for human verification. The phase goal is effectively achieved pending this final confirmation step.

---

_Verified: 2026-03-29T10:00:00Z_
_Verifier: Claude (gsd-verifier)_
