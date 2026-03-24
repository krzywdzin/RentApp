---
phase: 05-admin-panel
plan: 01
subsystem: ui
tags: [next.js, react, shadcn-ui, tanstack-query, tanstack-table, tailwindcss, bff-proxy]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Auth endpoints (login/refresh/logout), JWT tokens, user CRUD, audit trail
  - phase: 02-vehicle-customer
    provides: Vehicle and customer CRUD endpoints, shared types
  - phase: 03-rental
    provides: Rental CRUD endpoints, calendar data
  - phase: 04-contract-pdf
    provides: Contract endpoints
provides:
  - Next.js App Router app scaffold in apps/web/ with Turbo monorepo integration
  - Auth BFF proxy with httpOnly cookie token storage
  - Middleware-based auth redirect for protected routes
  - Collapsible sidebar layout with 6 Polish navigation items
  - Reusable DataTable component with server-side pagination and sorting
  - API client wrapper (apiClient) for all frontend API calls
  - TanStack Query hooks for vehicles, rentals, and audit data
  - Dashboard with 4 stat cards and recent activity feed
  - shadcn/ui component library (button, input, card, badge, skeleton, tooltip, table, select, avatar, scroll-area, separator)
  - Format utilities for Polish dates and PLN currency
affects: [05-02, 05-03, 05-04]

# Tech tracking
tech-stack:
  added: [next.js 15, react 19, @tanstack/react-query 5, @tanstack/react-table 8, react-hook-form 7, shadcn/ui, tailwindcss 4, date-fns 4, lucide-react, sonner, nuqs]
  patterns: [BFF auth proxy, httpOnly cookie tokens, server-side pagination DataTable, TanStack Query hooks per entity, apiClient fetch wrapper]

key-files:
  created:
    - apps/web/package.json
    - apps/web/src/middleware.ts
    - apps/web/src/lib/api-client.ts
    - apps/web/src/lib/format.ts
    - apps/web/src/lib/providers.tsx
    - apps/web/src/hooks/use-auth.tsx
    - apps/web/src/app/api/auth/login/route.ts
    - apps/web/src/app/api/[...path]/route.ts
    - apps/web/src/app/login/page.tsx
    - apps/web/src/app/(admin)/layout.tsx
    - apps/web/src/app/(admin)/page.tsx
    - apps/web/src/components/layout/sidebar.tsx
    - apps/web/src/components/layout/top-bar.tsx
    - apps/web/src/components/data-table/data-table.tsx
    - apps/web/src/components/dashboard/activity-feed.tsx
  modified:
    - apps/api/src/main.ts

key-decisions:
  - "BFF proxy pattern for auth: Next.js Route Handlers proxy auth requests and store tokens in httpOnly cookies, keeping API unchanged for future mobile app"
  - "Client-side data aggregation for dashboard stats: fleet dataset is small enough to compute counts from full vehicle/rental lists rather than adding dedicated API endpoint"
  - "Renamed use-auth.ts to use-auth.tsx: file contains JSX (Context.Provider) so needs TSX extension for TypeScript parser"

patterns-established:
  - "BFF Auth Proxy: /api/auth/* routes proxy to NestJS API, set/clear httpOnly cookies"
  - "API Proxy: /api/[...path] catch-all forwards Bearer token from cookie to NestJS API"
  - "Query Hook Pattern: entityKeys factory + useEntity hook per entity type"
  - "DataTable Pattern: generic DataTable<TData, TValue> with manual pagination/sorting for server-side control"
  - "Polish UI Convention: all labels, nav items, empty states in Polish"

requirements-completed: [ADMIN-01]

# Metrics
duration: 9min
completed: 2026-03-24
---

# Phase 5 Plan 1: Admin Panel Foundation Summary

**Next.js admin app with BFF auth proxy (httpOnly cookies), collapsible sidebar (6 Polish nav items), reusable DataTable, and dashboard with stat cards and audit activity feed**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-24T15:28:30Z
- **Completed:** 2026-03-24T15:37:30Z
- **Tasks:** 2
- **Files modified:** 37

## Accomplishments
- Scaffolded Next.js 15 App Router app in Turbo monorepo with shadcn/ui dark zinc theme and all required dependencies
- Built complete auth flow: BFF proxy routes for login/refresh/logout with httpOnly cookie token storage, middleware redirect for unauthenticated users, login page with Polish labels
- Created admin layout shell with collapsible sidebar (6 nav items: Pulpit, Pojazdy, Klienci, Wynajmy, Umowy, Audyt) and top bar with user avatar/logout
- Built reusable DataTable component with server-side pagination and sorting support
- Implemented dashboard page with 4 stat cards (active rentals, available vehicles, today's returns, overdue) and recent activity feed showing latest 5 audit entries in Polish
- Updated API CORS config to support credentials for BFF communication

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js app, shadcn/ui, dependencies, API CORS update, auth BFF proxy, and middleware** - `d03b641` (feat)
2. **Task 2: Admin layout shell, reusable DataTable, dashboard page with activity feed** - `de67c05` (feat)

## Files Created/Modified
- `apps/web/package.json` - Next.js app with all required dependencies
- `apps/web/next.config.ts` - transpilePackages for @rentapp/shared
- `apps/web/tsconfig.json` - TypeScript config with @/* path alias
- `apps/web/postcss.config.mjs` - Tailwind CSS v4 PostCSS plugin
- `apps/web/components.json` - shadcn/ui configuration
- `apps/web/src/app/globals.css` - Dark zinc theme CSS variables
- `apps/web/src/app/layout.tsx` - Root layout with Providers, Inter font, dark mode
- `apps/web/src/lib/utils.ts` - cn() helper (clsx + tailwind-merge)
- `apps/web/src/lib/api-client.ts` - Centralized fetch wrapper with ApiError class
- `apps/web/src/lib/format.ts` - Polish date/currency formatting (date-fns + Intl)
- `apps/web/src/lib/providers.tsx` - QueryClient, NuqsAdapter, Toaster providers
- `apps/web/src/hooks/use-auth.tsx` - AuthProvider context with login/logout/checkAuth
- `apps/web/src/middleware.ts` - Auth cookie check, redirect to /login
- `apps/web/src/app/api/auth/login/route.ts` - BFF proxy: login + set httpOnly cookies
- `apps/web/src/app/api/auth/refresh/route.ts` - BFF proxy: refresh tokens
- `apps/web/src/app/api/auth/logout/route.ts` - BFF proxy: logout + clear cookies
- `apps/web/src/app/api/[...path]/route.ts` - General API proxy with Bearer token forwarding
- `apps/web/src/app/login/page.tsx` - Login page with Polish labels ("Zaloguj sie")
- `apps/web/src/app/(admin)/layout.tsx` - Admin layout with Sidebar + TopBar + AuthProvider
- `apps/web/src/app/(admin)/page.tsx` - Dashboard with 4 stat cards + ActivityFeed
- `apps/web/src/components/layout/sidebar.tsx` - Collapsible sidebar with 6 nav items
- `apps/web/src/components/layout/top-bar.tsx` - Top bar with user avatar and logout
- `apps/web/src/components/layout/breadcrumbs.tsx` - Reusable breadcrumb navigation
- `apps/web/src/components/data-table/data-table.tsx` - Generic DataTable with TanStack Table
- `apps/web/src/components/data-table/data-table-pagination.tsx` - Pagination with page size selector
- `apps/web/src/components/data-table/data-table-column-header.tsx` - Sortable column headers
- `apps/web/src/components/dashboard/stat-card.tsx` - Stat card with destructive variant
- `apps/web/src/components/dashboard/activity-feed.tsx` - Recent audit entries in Polish
- `apps/web/src/hooks/queries/use-vehicles.ts` - Vehicle query hook
- `apps/web/src/hooks/queries/use-rentals.ts` - Rental query hook
- `apps/web/src/hooks/queries/use-audit.ts` - Audit query hook with AuditLogEntry interface
- `apps/web/src/components/ui/*.tsx` - 11 shadcn/ui components (button, input, card, badge, skeleton, tooltip, table, select, avatar, scroll-area, separator)
- `apps/api/src/main.ts` - Updated CORS with origin + credentials: true

## Decisions Made
- **BFF proxy pattern for auth:** Next.js Route Handlers proxy auth requests to NestJS API and store tokens in httpOnly cookies. This keeps the API backward-compatible for future mobile app (Phase 6) which will use Bearer tokens directly.
- **Client-side dashboard stats:** Fleet dataset is small (<100 vehicles), so stat card counts are computed client-side from full vehicle/rental arrays rather than adding a dedicated API endpoint.
- **Renamed use-auth.ts to .tsx:** The auth hook file contains JSX for Context.Provider, requiring the .tsx extension for the TypeScript parser used by prettier/ESLint.
- **Device ID stored in httpOnly cookie:** The BFF login route generates a deviceId via crypto.randomUUID() and stores it in an httpOnly cookie alongside tokens, enabling the refresh and logout flows to pass the deviceId without client-side storage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed use-auth.ts extension to .tsx**
- **Found during:** Task 1 (auth hook implementation)
- **Issue:** The use-auth.ts file contains JSX (<AuthContext.Provider>) but had a .ts extension, causing prettier and ESLint parser failures
- **Fix:** Renamed to use-auth.tsx
- **Files modified:** apps/web/src/hooks/use-auth.tsx
- **Verification:** Build passes, prettier formats correctly
- **Committed in:** d03b641 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor file extension fix. No scope creep.

## Issues Encountered
- ESLint/prettier parsing failure for JSX in .ts files -- resolved by using .tsx extension for files containing JSX

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All foundation components ready for entity pages (05-02 vehicles, 05-03 customers/rentals)
- DataTable, query hooks, API client, and layout shell are reusable across all entity pages
- Auth flow complete: login -> BFF proxy -> httpOnly cookies -> middleware protection

---
*Phase: 05-admin-panel*
*Completed: 2026-03-24*
