---
status: awaiting_human_verify
trigger: "Clicking 'Uzytkownicy' tab (/uzytkownicy route) in web admin panel causes logout instead of showing the page"
created: 2026-03-29T00:00:00Z
updated: 2026-03-29T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - access_token cookie maxAge (900s/15min) expires before JWT (30min), making refresh impossible since backend requires expired token for user ID extraction
test: Verified via curl that refresh fails with "Access token required for refresh" when cookie is missing
expecting: Fix cookie maxAge to match JWT expiry (1800s) in both login and refresh routes
next_action: Apply fix to login and refresh route cookie settings

## Symptoms

expected: Navigating to /uzytkownicy should display the users management page for ADMIN users
actual: Clicking the route triggers a logout/redirect to /login
errors: Likely 401 from the API users endpoint, causing the auth middleware to redirect
reproduction: Log in as admin, click "Uzytkownicy" in navigation
started: Discovered during live testing session

## Eliminated

## Evidence

- timestamp: 2026-03-29T03:50Z
  checked: Backend GET /users endpoint with valid ADMIN token via curl
  found: Returns 200 with users list - endpoint works correctly
  implication: Backend is not the problem

- timestamp: 2026-03-29T03:50Z
  checked: Web proxy /api/users with valid cookie
  found: Returns 200 with users list - proxy works correctly
  implication: Proxy is not the problem

- timestamp: 2026-03-29T03:51Z
  checked: Refresh endpoint without access_token cookie
  found: Returns 401 "Access token required for refresh" - backend requires expired access token to extract userId
  implication: When access_token cookie expires (maxAge 900s), refresh becomes impossible

- timestamp: 2026-03-29T03:51Z
  checked: Cookie settings in login route vs JWT expiry
  found: Cookie maxAge=900 (15 min) but JWT expiresIn='30m' (30 min). Cookie disappears 15 min before JWT would expire.
  implication: 15-minute window where cookie is gone but JWT would still be valid. Middleware redirects to /login on any navigation.

## Resolution

root_cause: access_token cookie maxAge (900s = 15 min) is shorter than the JWT expiry (30 min). When the cookie expires after 15 min, (1) Next.js middleware redirects to /login on page navigation, and (2) the BFF refresh route cannot send the expired JWT to the backend because the cookie is gone, making token refresh impossible.
fix: Set access_token cookie maxAge to 1800s (30 min) to match JWT expiresIn '30m' in both login and refresh BFF routes
verification: curl tests confirm login sets Max-Age=1800, /api/users returns 200, /api/users/me returns admin user, /api/auth/refresh returns 200
files_changed:
  - apps/web/src/app/api/auth/login/route.ts
  - apps/web/src/app/api/auth/refresh/route.ts
