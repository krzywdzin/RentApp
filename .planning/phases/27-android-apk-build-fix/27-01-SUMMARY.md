---
phase: 27-android-apk-build-fix
plan: 01
subsystem: infra
tags: [expo, eas-build, metro, react-native, android, apk]

# Dependency graph
requires: []
provides:
  - "Fixed EAS Build configuration for Android APK generation"
  - "Clean git state without tracked generated directories"
affects: []

# Tech tracking
tech-stack:
  added: [react-native-worklets@0.5.1]
  patterns: [metro-config-spread-defaults]

key-files:
  created: []
  modified:
    - apps/mobile/package.json
    - apps/mobile/metro.config.js
    - .gitignore

key-decisions:
  - "Used npx expo install for SDK-compatible dependency versioning"
  - "Spread existing metro watchFolders array instead of overriding to preserve Expo defaults"

patterns-established:
  - "Metro config: always spread config.watchFolders defaults before adding monorepo root"

requirements-completed: [BUILD-01, BUILD-02, BUILD-03, ASSET-01, ASSET-02, ASSET-03]

# Metrics
duration: 2min
completed: 2026-03-29
---

# Phase 27 Plan 01: Android APK Build Fix Summary

**Installed react-native-worklets peer dependency, fixed metro watchFolders spread, and cleaned .expo/ios/ from git tracking**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T02:18:29Z
- **Completed:** 2026-03-29T02:19:53Z
- **Tasks:** 2
- **Files modified:** 30 (3 modified + 27 deleted from git index)

## Accomplishments
- Installed react-native-worklets 0.5.1 as required peer dependency for react-native-reanimated
- Fixed metro.config.js to spread default watchFolders instead of overriding them
- Removed .expo/ (5 files) and ios/ (21 files) from git tracking, added to .gitignore
- Verified app.config.ts, eas.json, and all required assets are correct

## Task Commits

Each task was committed atomically:

1. **Task 1: Install missing dependency and fix Metro config** - `f3cafdd` (fix)
2. **Task 2: Clean git tracking of generated directories** - `f80cce0` (chore)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `apps/mobile/package.json` - Added react-native-worklets dependency
- `apps/mobile/metro.config.js` - Spread default watchFolders instead of overriding
- `pnpm-lock.yaml` - Updated lockfile
- `.gitignore` - Added .expo/ and apps/mobile/ios/ entries

## Decisions Made
- Used `npx expo install` (not pnpm add) for SDK-compatible dependency versioning
- Spread existing metro watchFolders array to preserve Expo defaults while adding monorepo root

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Build configuration ready for EAS Build trigger
- Run `eas build --platform android --profile preview` to generate APK
- No blockers remaining for Android APK build

---
*Phase: 27-android-apk-build-fix*
*Completed: 2026-03-29*
