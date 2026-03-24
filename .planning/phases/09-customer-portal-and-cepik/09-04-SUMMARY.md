---
phase: 09-customer-portal-and-cepik
plan: 04
subsystem: ui
tags: [next.js, portal, bff-proxy, magic-link, polish-ui, mobile-first, tanstack-query]

# Dependency graph
requires:
  - phase: 09-customer-portal-and-cepik
    provides: Portal API module with auth exchange, JWT strategy, and rental/contract endpoints (Plan 03)
provides:
  - Customer-facing portal web UI at /portal with magic link token exchange
  - BFF proxy routes forwarding portal_token cookie as Bearer auth
  - Rental list page with Polish status badges and pricing
  - Rental detail page with contract PDF download and return inspection summary
  - Mobile-first responsive layout without admin chrome
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Portal route group (portal) with separate layout excluding admin sidebar"
    - "BFF token exchange storing portal JWT in httpOnly cookie scoped to /portal"
    - "URL token stripping via history.replaceState for security"
    - "Polish-only UI with hardcoded pl-PL locale formatting"

key-files:
  created:
    - apps/web/src/app/(portal)/layout.tsx
    - apps/web/src/app/(portal)/portal/page.tsx
    - apps/web/src/app/(portal)/portal/[rentalId]/page.tsx
    - apps/web/src/app/(portal)/portal/components/portal-header.tsx
    - apps/web/src/app/(portal)/portal/components/rental-card.tsx
    - apps/web/src/app/(portal)/portal/components/rental-detail-view.tsx
    - apps/web/src/app/(portal)/portal/components/token-exchange.tsx
    - apps/web/src/app/api/portal/auth/exchange/route.ts
    - apps/web/src/app/api/portal/[...path]/route.ts
    - apps/web/src/hooks/use-portal-auth.ts
    - apps/web/src/hooks/use-portal-rentals.ts
  modified:
    - apps/web/src/middleware.ts

key-decisions:
  - "Portal route group (portal) isolates layout from admin (admin) group"
  - "portal_token cookie scoped to /portal path with 24h maxAge matching JWT expiry"
  - "Token stripped from URL via replaceState after exchange for security"
  - "No-referrer meta tag prevents token leakage in Referer header"

patterns-established:
  - "Portal BFF pattern: separate cookie name and proxy route for customer-facing auth"
  - "Middleware bypass: portal paths excluded from admin auth redirect"

requirements-completed: [PORTAL-01, PORTAL-02]

# Metrics
duration: 20min
completed: 2026-03-24
---

# Phase 9 Plan 04: Portal Web UI Summary

**Customer portal with magic link token exchange, Polish rental list/detail pages, PDF download, and mobile-first responsive layout via BFF proxy**

## Performance

- **Duration:** ~20 min (across checkpoint)
- **Started:** 2026-03-24T21:00:00Z
- **Completed:** 2026-03-24T21:45:31Z
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 12

## Accomplishments
- BFF token exchange sets httpOnly portal_token cookie, portal proxy forwards it as Bearer auth
- Middleware updated to bypass admin auth for /portal paths
- Rental list page with Polish status badges (Aktywny, Zwrocony, etc.) and PLN pricing
- Rental detail page with contract PDF download button and return inspection summary
- Mobile-first responsive layout with no admin chrome, no-referrer meta for security
- Token stripped from URL after successful exchange via history.replaceState

## Task Commits

Each task was committed atomically:

1. **Task 1: BFF routes, middleware update, portal layout and token exchange** - `f058396` (feat)
2. **Task 2: Portal rental list and detail pages** - `65bb10b` (feat)
3. **Task 3: Verify complete portal and CEPiK flow end-to-end** - human-verify checkpoint (approved)

## Files Created/Modified
- `apps/web/src/middleware.ts` - Updated to exclude /portal from admin auth redirect
- `apps/web/src/app/api/portal/auth/exchange/route.ts` - BFF token exchange, sets httpOnly cookie
- `apps/web/src/app/api/portal/[...path]/route.ts` - Portal BFF proxy with portal_token cookie
- `apps/web/src/hooks/use-portal-auth.ts` - Portal auth hook with exchangeToken and /me fetch
- `apps/web/src/hooks/use-portal-rentals.ts` - TanStack Query hooks for portal rental data
- `apps/web/src/app/(portal)/layout.tsx` - Minimal portal layout with no-referrer meta
- `apps/web/src/app/(portal)/portal/page.tsx` - Rental list page with TokenExchange component
- `apps/web/src/app/(portal)/portal/[rentalId]/page.tsx` - Rental detail page with back navigation
- `apps/web/src/app/(portal)/portal/components/portal-header.tsx` - Header with KITEK branding
- `apps/web/src/app/(portal)/portal/components/rental-card.tsx` - Rental card with Polish status badges
- `apps/web/src/app/(portal)/portal/components/rental-detail-view.tsx` - Full rental detail with PDF download
- `apps/web/src/app/(portal)/portal/components/token-exchange.tsx` - Magic link token exchange with URL cleanup

## Decisions Made
- Portal route group `(portal)` isolates layout from admin `(admin)` group
- `portal_token` cookie scoped to `/portal` path with 24h maxAge matching JWT expiry
- Token stripped from URL via `replaceState` after exchange for security
- `no-referrer` meta tag prevents token leakage in Referer header

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 9 is the final phase -- all 4 plans complete
- Full v1.0 milestone delivered: auth, fleet, rentals, contracts, admin panel, mobile app, photos, notifications, customer portal, and CEPiK verification
- Production deployment readiness depends on external service configuration (SMSAPI, MinIO/S3, CEPiK API approval)

## Self-Check: PASSED

All 12 created/modified files verified present. Both task commits (f058396, 65bb10b) verified in git log.

---
*Phase: 09-customer-portal-and-cepik*
*Completed: 2026-03-24*
