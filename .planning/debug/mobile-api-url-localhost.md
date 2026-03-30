---
status: awaiting_human_verify
trigger: "Mobile APK connects to localhost:3000 instead of Railway API in production builds"
created: 2026-03-30T12:00:00Z
updated: 2026-03-30T12:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Constants.expoConfig?.extra?.apiUrl returns undefined at runtime in EAS builds
test: Fix applied and committed. EAS build queued.
expecting: New APK will always connect to Railway API, never localhost
next_action: Wait for EAS build to complete, then user installs and verifies API connectivity

## Symptoms

expected: Mobile APK should always connect to https://api-production-977b.up.railway.app in production/preview builds
actual: Mobile APK falls back to localhost:3000, making the app non-functional
errors: Network requests fail (cannot reach localhost from device)
reproduction: Install production APK on Android device, observe API calls going to localhost
started: Discovered after recent EAS builds

## Eliminated

## Evidence

- timestamp: 2026-03-30T12:05:00Z
  checked: app.config.ts extra configuration
  found: apiUrl is set with fallback - process.env.EXPO_PUBLIC_API_URL ?? 'https://api-production-977b.up.railway.app'
  implication: At build time, if EXPO_PUBLIC_API_URL is set in eas.json, it should be embedded

- timestamp: 2026-03-30T12:06:00Z
  checked: constants.ts API_URL definition
  found: Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000' - fallback is localhost
  implication: If Constants.expoConfig or extra is undefined at runtime, falls back to localhost

- timestamp: 2026-03-30T12:07:00Z
  checked: eas.json build profiles
  found: preview/staging/production profiles all set EXPO_PUBLIC_API_URL to Railway URL correctly
  implication: Env vars are correctly configured in EAS - issue is runtime reading of extra config

- timestamp: 2026-03-30T12:08:00Z
  checked: client.ts API client usage
  found: Imports API_URL from constants.ts and uses it as baseURL for axios
  implication: Whatever constants.ts exports is what the app uses

- timestamp: 2026-03-30T12:09:00Z
  checked: Known Expo issue with Constants.expoConfig in EAS builds
  found: Constants.expoConfig.extra can be undefined in production builds when app.config.ts is dynamic
  implication: This is a known behavior - expo-constants may not properly embed dynamic config values

## Resolution

root_cause: Constants.expoConfig?.extra?.apiUrl returns undefined in EAS production/preview builds because expo-constants does not reliably embed dynamic app.config.ts values. The fallback in constants.ts is localhost:3000, which is unreachable on real devices.
fix: Changed constants.ts to use Railway URL as fallback (not localhost). Added EXPO_PUBLIC_API_URL direct read as primary source since Metro embeds these at build time. Added startup logging for debugging in __DEV__ mode.
verification: |
  - TypeScript compiles successfully
  - Commit da11ccc pushed to main
  - EAS build b7f27bc2-5f74-4032-9e42-edec1e0ce0ab queued (preview profile)
  - Awaiting human verification on device
files_changed:
  - apps/mobile/src/lib/constants.ts
  - apps/mobile/app.config.ts
build_url: https://expo.dev/accounts/krzywdzinek/projects/kitek-rental/builds/b7f27bc2-5f74-4032-9e42-edec1e0ce0ab
