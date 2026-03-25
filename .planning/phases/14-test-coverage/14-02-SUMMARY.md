---
phase: 14-test-coverage
plan: 02
subsystem: testing
tags: [jest-expo, react-native, smoke-tests, testing-library]

requires:
  - phase: 10-mobile-ux-polish
    provides: mobile screen components to test
provides:
  - jest-expo test infrastructure with comprehensive native module mocks
  - 4 mobile smoke test suites (login, dashboard, rental list, customer wizard step)
  - Custom test-utils with QueryClientProvider wrapper
affects: [future mobile tests, CI pipeline]

tech-stack:
  added: []
  patterns: [jest-expo smoke test pattern, pnpm-aware transformIgnorePatterns, per-screen hook/store mocking]

key-files:
  created:
    - apps/mobile/jest.config.js
    - apps/mobile/src/test/setup.js
    - apps/mobile/src/test/test-utils.tsx
    - apps/mobile/__tests__/login.test.tsx
    - apps/mobile/__tests__/dashboard.test.tsx
    - apps/mobile/__tests__/rental-list.test.tsx
    - apps/mobile/__tests__/new-rental-customer-step.test.tsx
  modified: []

key-decisions:
  - "Used pnpm-aware transformIgnorePatterns with .pnpm allowlist instead of standard node_modules pattern"
  - "Mocked hooks/stores at module level in each test file rather than global setup to keep test isolation clear"

patterns-established:
  - "Smoke test pattern: mock all external hooks/stores, render component, assert truthy + key UI elements"
  - "Test utils: renderWithProviders wraps component in QueryClientProvider with retry=false, gcTime=0"

requirements-completed: [TEST-02]

duration: 2min
completed: 2026-03-25
---

# Phase 14 Plan 02: Mobile Smoke Tests Summary

**jest-expo smoke tests for 4 key mobile screens with comprehensive native module mocking and pnpm-compatible config**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T04:00:06Z
- **Completed:** 2026-03-25T04:02:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Configured jest-expo test infrastructure with mocks for expo-router, async-storage, secure-store, reanimated, i18n, gesture-handler, bottom-sheet, and more
- Created 4 passing smoke test suites covering login, dashboard, rental list, and customer wizard step (12 test cases total)
- Established reusable test-utils with QueryClientProvider wrapper for all future mobile tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure jest-expo and create test infrastructure** - `24ba88b` (chore)
2. **Task 2: Create smoke tests for 4 mobile screens** - `c02a189` (test)

## Files Created/Modified
- `apps/mobile/jest.config.js` - Jest config with jest-expo preset, pnpm-aware transforms, module name mappers
- `apps/mobile/src/test/setup.js` - Global mocks for expo-router, async-storage, secure-store, reanimated, i18n, gesture-handler, bottom-sheet, lucide icons, sentry, haptics, constants
- `apps/mobile/src/test/test-utils.tsx` - Custom render with QueryClientProvider wrapper
- `apps/mobile/__tests__/login.test.tsx` - Login screen: renders, shows inputs and button
- `apps/mobile/__tests__/dashboard.test.tsx` - Dashboard: renders, shows greeting and stats
- `apps/mobile/__tests__/rental-list.test.tsx` - Rental list: renders, shows empty state and filters
- `apps/mobile/__tests__/new-rental-customer-step.test.tsx` - Customer step: renders, shows wizard title and new customer button

## Decisions Made
- Used pnpm-aware transformIgnorePatterns (allowing .pnpm directory through) instead of standard node_modules pattern, because pnpm hoists dependencies into `.pnpm/` subdirectories that need transformation
- Mocked hooks and stores at per-test-file module level for clear test isolation rather than in global setup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed transformIgnorePatterns for pnpm monorepo**
- **Found during:** Task 2 (running tests)
- **Issue:** react-native/jest/setup.js uses ESM imports and wasn't being transformed because the initial transformIgnorePatterns didn't account for pnpm's `.pnpm` directory structure
- **Fix:** Adopted jest-expo preset's pattern that includes `.pnpm` in the allowlist
- **Files modified:** apps/mobile/jest.config.js
- **Verification:** All 4 test suites pass (12 tests)
- **Committed in:** c02a189 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for pnpm compatibility. No scope creep.

## Issues Encountered
None beyond the transformIgnorePatterns fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Mobile test infrastructure ready for additional test suites
- All 4 core screens have smoke test coverage
- `pnpm test` in apps/mobile exits 0

---
*Phase: 14-test-coverage*
*Completed: 2026-03-25*
