# Phase 27: Android APK Build Fix - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix EAS Build Android APK build so it completes successfully. Diagnose and resolve Gradle build failure, missing dependencies, and configuration issues that prevent `eas build --platform android --profile preview` from producing an installable APK.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

</decisions>

<code_context>
## Existing Code Insights

### Build Error Diagnosis
- **Build ID a07c830d**: `EAS_BUILD_UNKNOWN_GRADLE_ERROR` — Gradle build failed during `RUN_GRADLEW` phase
- **Build ID 43edc212**: `UNKNOWN_ERROR` — Bundle JavaScript phase failed (before postinstall fix)
- Previous fix (commit 145a627) added postinstall hook to build shared package during EAS — this fixed the JS bundle but Gradle still fails

### expo-doctor Findings (4 failures)
1. Missing peer dependency: `react-native-worklets` (required by `react-native-reanimated`) — likely root cause of Gradle failure
2. `.expo/` directory not in `.gitignore`
3. Metro config `watchFolders` does not contain all Expo defaults
4. Non-CNG project warning due to committed `ios/` directory (out of scope — Android only)

### Current Configuration Status
- **app.config.ts**: Correct — has `pl.kitek.rental` package, adaptive icon, splash config
- **eas.json**: Correct — preview profile has `buildType: "apk"`, correct API URL
- **Assets**: All present at correct dimensions (icon 1024x1024, adaptive-icon 1024x1024, splash 1284x2778)
- **EAS CLI**: v18.4.0 installed, project ID configured
- **TypeScript**: Compiles clean (`tsc --noEmit` passes)
- **Shared package**: Builds correctly, postinstall hook works for EAS

### Integration Points
- `metro.config.js` in `apps/mobile/` — monorepo-aware config
- `package.json` root — postinstall script for EAS shared build
- `apps/mobile/.gitignore` — needs .expo/ entry

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Fix the build and verify.

</specifics>

<deferred>
## Deferred Ideas

- iOS build support (explicitly out of scope per REQUIREMENTS.md)
- Play Store publishing (APK sideload only for now)
- Build optimization/caching

</deferred>
