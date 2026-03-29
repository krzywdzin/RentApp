---
phase: 28-bug-fixes-auth-foundation
plan: 01
subsystem: auth, ui
tags: [middleware, next.js, expo, signature-canvas, cookies, refresh-token]

# Dependency graph
requires:
  - phase: 24-web-quality-accessibility
    provides: web admin panel and middleware
provides:
  - "Middleware that allows navigation when refresh_token exists (no premature logout)"
  - "Signature canvas clearing between all 4 contract signing steps"
affects: [29-username-login-overhaul, 30-admin-user-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual-cookie auth check in middleware (access_token + refresh_token)"
    - "Separate useEffect hooks for orientation lock vs canvas state"

key-files:
  created: []
  modified:
    - apps/web/src/middleware.ts
    - apps/mobile/src/components/SignatureScreen.tsx

key-decisions:
  - "Check refresh_token alongside access_token in middleware to prevent premature logout during client-side token refresh"
  - "Split single useEffect into two: orientation (mount-only) and canvas clearing (step-dependent)"

patterns-established:
  - "Middleware allows page load when refresh_token exists, relying on client-side apiClient for 401->refresh->retry"

requirements-completed: [BUG-01, BUG-02]

# Metrics
duration: 1min
completed: 2026-03-29
---

# Phase 28 Plan 01: Bug Fixes Summary

**Middleware dual-cookie check prevents premature logout; signature canvas clearing split into dedicated useEffect per step change**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-29T16:58:20Z
- **Completed:** 2026-03-29T16:59:18Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Middleware now checks for refresh_token before redirecting to /login, allowing client-side token refresh to handle expired access_tokens
- Signature screen useEffect split into two: orientation lock (mount/unmount only) and canvas clear (on stepLabel change)
- Both files pass TypeScript compilation without errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix middleware to allow navigation when refresh_token exists** - `601eac0` (fix)
2. **Task 2: Fix signature canvas clearing between steps** - `15ad40e` (fix)

## Files Created/Modified
- `apps/web/src/middleware.ts` - Added refresh_token cookie check alongside access_token; redirect only when both absent
- `apps/mobile/src/components/SignatureScreen.tsx` - Split single useEffect into orientation lock (empty deps) and canvas clear (stepLabel dep)

## Decisions Made
- Check refresh_token alongside access_token in middleware to prevent premature logout during client-side token refresh cycle
- Split single useEffect into two separate effects rather than adding clearSignature to the existing one, for cleaner separation of concerns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth middleware foundation is ready for the username login overhaul (Phase 29)
- Signature flow works correctly for contract signing workflows

---
*Phase: 28-bug-fixes-auth-foundation*
*Completed: 2026-03-29*
