---
phase: 06-mobile-app
plan: 01
subsystem: mobile
tags: [expo, react-native, nativewind, zustand, tanstack-query, i18next, axios, jwt, securestore]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Auth endpoints (login, refresh, logout), JWT token infrastructure
  - phase: 02-fleet-customers
    provides: Shared types and schemas (UserDto, TokenPairDto, rental/customer schemas)
provides:
  - Expo SDK 52 project scaffolded at apps/mobile with monorepo wiring
  - NativeWind v4 styling configured (Metro, Babel, Tailwind)
  - Axios API client with JWT token refresh interceptor queue pattern
  - Auth store with SecureStore token persistence
  - Rental-draft and return-draft Zustand stores with AsyncStorage persistence
  - Complete Polish i18n translations (11 namespaces matching UI-SPEC)
  - QueryProvider with AppState focus management
  - AuthProvider with biometric gate and navigation guard
  - useLogin/useLogout/useMe TanStack Query hooks
  - Root layout with all providers wired
affects: [06-02, 06-03, 06-04, 06-05]

# Tech tracking
tech-stack:
  added: [expo ~52.0.49, expo-router ~4.0, nativewind ^4.2.3, @tanstack/react-query ^5.95, zustand ^5.0, react-hook-form ^7.72, axios ^1.7, i18next ^25.10, expo-secure-store, expo-local-authentication, expo-crypto, @sentry/react-native ^8.5, @gorhom/bottom-sheet ^5.2.8, react-native-signature-canvas ^5.0.2, lucide-react-native ^1.6, react-native-toast-message ^2.3, @react-native-community/netinfo ^12.0, @react-native-async-storage/async-storage ^3.0]
  patterns: [JWT refresh interceptor with queue, Zustand persist to AsyncStorage, SecureStore for sensitive tokens, biometric auth gate, AppState-to-focusManager wiring]

key-files:
  created:
    - apps/mobile/package.json
    - apps/mobile/app.config.ts
    - apps/mobile/metro.config.js
    - apps/mobile/babel.config.js
    - apps/mobile/tailwind.config.js
    - apps/mobile/src/api/client.ts
    - apps/mobile/src/stores/auth.store.ts
    - apps/mobile/src/stores/rental-draft.store.ts
    - apps/mobile/src/stores/return-draft.store.ts
    - apps/mobile/src/i18n/pl.json
    - apps/mobile/src/providers/QueryProvider.tsx
    - apps/mobile/src/providers/AuthProvider.tsx
    - apps/mobile/src/hooks/use-auth.ts
    - apps/mobile/app/_layout.tsx
  modified: []

key-decisions:
  - "expo-crypto for UUID generation instead of manual UUID to leverage Expo native random"
  - "GET /users/me endpoint used for token validation (no dedicated /auth/me needed)"
  - "Refresh endpoint requires expired access token in Authorization header per API design"
  - "@types/node added as devDep for process.env in app.config.ts"

patterns-established:
  - "API client pattern: Axios instance with SecureStore token injection and 401 refresh queue"
  - "Auth store pattern: Zustand for reactive state, SecureStore for tokens, AsyncStorage for preferences"
  - "Draft store pattern: Zustand with persist middleware to AsyncStorage for wizard state recovery"
  - "Provider hierarchy: GestureHandler > SafeArea > Query > Auth > Slot (root layout)"

requirements-completed: [MOB-01]

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 6 Plan 01: Mobile App Scaffold Summary

**Expo SDK 52 project with NativeWind styling, Axios JWT refresh client, Zustand stores, complete Polish i18n, and auth-gated root layout**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-24T18:16:22Z
- **Completed:** 2026-03-24T18:22:05Z
- **Tasks:** 2
- **Files modified:** 29

## Accomplishments
- Expo SDK 52 project scaffolded at apps/mobile with full monorepo wiring to @rentapp/shared
- NativeWind v4 configured end-to-end (Metro withNativeWind, Babel preset, Tailwind content paths, global.css)
- Axios API client with token refresh interceptor using queue pattern for concurrent request handling
- Auth, rental-draft, and return-draft Zustand stores with appropriate persistence (SecureStore for tokens, AsyncStorage for drafts)
- Complete Polish i18n (11 namespaces, all UI-SPEC copywriting keys present)
- Root layout wiring all providers: GestureHandler, SafeArea, Query, Auth, Toast

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Expo project with monorepo wiring and full configuration** - `13f911d` (feat)
2. **Task 2: Create API client, stores, providers, i18n, auth hook, and root layout** - `cdd4173` (feat)

## Files Created/Modified
- `apps/mobile/package.json` - Expo project with all dependencies
- `apps/mobile/app.config.ts` - Dynamic Expo config with New Architecture, EAS, iOS/Android settings
- `apps/mobile/tsconfig.json` - TypeScript strict config extending expo base
- `apps/mobile/babel.config.js` - NativeWind v4 JSX import source preset
- `apps/mobile/metro.config.js` - Metro with NativeWind and monorepo watchFolders
- `apps/mobile/tailwind.config.js` - Tailwind with NativeWind preset
- `apps/mobile/global.css` - Tailwind directives
- `apps/mobile/nativewind-env.d.ts` - NativeWind type reference
- `apps/mobile/eas.json` - EAS Build profiles (dev/staging/prod)
- `apps/mobile/assets/` - Placeholder brand assets (icon, splash, adaptive-icon)
- `apps/mobile/src/api/client.ts` - Axios instance with JWT refresh interceptor
- `apps/mobile/src/api/auth.api.ts` - Auth API functions (login, refresh, logout, getMe)
- `apps/mobile/src/stores/auth.store.ts` - Auth state with SecureStore token management
- `apps/mobile/src/stores/rental-draft.store.ts` - Rental wizard draft with AsyncStorage persist
- `apps/mobile/src/stores/return-draft.store.ts` - Return wizard draft with AsyncStorage persist
- `apps/mobile/src/i18n/index.ts` - i18next configuration (Polish default)
- `apps/mobile/src/i18n/pl.json` - Complete Polish translations (11 namespaces)
- `apps/mobile/src/providers/QueryProvider.tsx` - TanStack Query with AppState focus management
- `apps/mobile/src/providers/AuthProvider.tsx` - Auth gate with biometric and navigation guard
- `apps/mobile/src/hooks/use-auth.ts` - useLogin, useLogout, useMe hooks
- `apps/mobile/src/lib/constants.ts` - API URL, version, status colors, checklist items
- `apps/mobile/src/lib/format.ts` - Polish date, PLN currency, mileage formatters
- `apps/mobile/src/lib/network.ts` - useNetworkStatus and useIsOffline hooks
- `apps/mobile/app/_layout.tsx` - Root layout with full provider hierarchy

## Decisions Made
- Used expo-crypto for UUID generation (device ID) instead of manual UUID implementation
- GET /users/me endpoint used for token validation since it already exists in the API
- Refresh endpoint sends expired access token in Authorization header per existing API contract
- Added @types/node as devDependency for process.env type support in app.config.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed expo-crypto for device ID generation**
- **Found during:** Task 2 (use-auth.ts implementation)
- **Issue:** useLogin hook needs to generate UUID for deviceId but no UUID generation library was listed in plan dependencies
- **Fix:** Installed expo-crypto and used Crypto.randomUUID()
- **Files modified:** apps/mobile/package.json, apps/mobile/src/hooks/use-auth.ts
- **Verification:** TypeScript compiles cleanly
- **Committed in:** cdd4173 (Task 2 commit)

**2. [Rule 3 - Blocking] Installed @types/node for app.config.ts**
- **Found during:** Task 1 (TypeScript verification)
- **Issue:** process.env.EXPO_PUBLIC_API_URL in app.config.ts failed with "Cannot find name 'process'"
- **Fix:** Added @types/node as devDependency
- **Files modified:** apps/mobile/package.json
- **Verification:** npx tsc --noEmit passes cleanly
- **Committed in:** 13f911d (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary for TypeScript compilation. No scope creep.

## Issues Encountered
- Peer dependency warnings for react-native-reanimated ^4.2 (wants RN 0.80+, project uses 0.76.9 via SDK 52). These are non-blocking warnings since reanimated ships bundled with SDK 52.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All infrastructure layers ready for screen development
- Auth flow (login, token refresh, biometric) ready for login screen implementation
- Draft stores ready for rental and return wizard state management
- i18n translations ready for all planned screens
- Provider hierarchy established -- subsequent plans add screens inside existing layout

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 06-mobile-app*
*Completed: 2026-03-24*
