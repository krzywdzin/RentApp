---
status: awaiting_human_verify
trigger: "Portal klienta displays only header and footer — no content renders in the middle"
created: 2026-04-01T22:00:00Z
updated: 2026-04-01T22:05:00Z
---

## Current Focus

hypothesis: Cookie path restriction prevents portal_token from being sent to /api/portal/* routes
test: Check cookie path set during token exchange vs actual API request paths
expecting: Cookie path '/portal' does NOT cover '/api/portal/*' paths, so browser never sends portal_token
next_action: Fix cookie path to '/' so it covers both /portal/* and /api/portal/* paths

## Symptoms

expected: Portal should show full page content between header and footer (dashboard, rental info, etc.)
actual: Only header and footer render — the main content area is completely empty
errors: Unknown — likely silent auth failure (cookie not sent, /api/portal/me returns null)
reproduction: Open the customer portal in a browser after token exchange
started: Likely since cookie path was set to '/portal' in exchange route

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-04-01T22:02:00Z
  checked: apps/web/src/app/api/portal/auth/exchange/route.ts
  found: Cookie portal_token is set with path '/portal' (line 22)
  implication: Browser only sends this cookie for requests to /portal/* paths

- timestamp: 2026-04-01T22:03:00Z
  checked: apps/web/src/hooks/use-portal-auth.ts
  found: fetchPortalAuth() calls '/api/portal/me' — path starts with /api/portal, NOT /portal
  implication: Cookie path '/portal' does NOT match '/api/portal/me', so cookie is never included in request

- timestamp: 2026-04-01T22:03:30Z
  checked: apps/web/src/app/api/portal/[...path]/route.ts
  found: Proxy reads portal_token from request.cookies — but cookie was never sent by browser
  implication: All proxied portal API requests go unauthenticated, /me returns null, isAuthenticated=false

- timestamp: 2026-04-01T22:04:00Z
  checked: Portal page rendering logic (page.tsx lines 31-48)
  found: When isAuthenticated=false, shows "Witaj w Portalu Klienta" welcome message asking for link
  implication: This is the "empty content" — it shows the unauthenticated welcome message, not actual rental data

- timestamp: 2026-04-01T22:04:30Z
  checked: middleware.ts
  found: Portal paths correctly skip admin auth — no issue here
  implication: Middleware is not the problem

## Resolution

root_cause: Cookie path mismatch. The portal_token cookie is set with path '/portal' in apps/web/src/app/api/portal/auth/exchange/route.ts. However, the frontend makes API calls to '/api/portal/*' paths (e.g., '/api/portal/me', '/api/portal/rentals'). Since '/api/portal' does NOT match the cookie path '/portal', the browser never sends the portal_token cookie with API requests. This means all API proxy calls are unauthenticated, fetchPortalAuth returns null, isAuthenticated is false, and the portal shows only the welcome/unauthenticated message instead of rental content.
fix: Change cookie path from '/portal' to '/' so the browser sends it for both /portal/* page navigations and /api/portal/* API calls
verification: 
files_changed: [apps/web/src/app/api/portal/auth/exchange/route.ts]
