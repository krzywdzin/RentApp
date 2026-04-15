---
status: verifying
trigger: "Login not working on both mobile (Expo) and web (Next.js) after last code update"
created: 2026-04-06T00:00:00Z
updated: 2026-04-06T18:47:00Z
---

## Current Focus

hypothesis: CONFIRMED - Upstash Redis free tier 500K commands/month limit exceeded
test: Deploy fix with graceful Redis degradation, verify login works
expecting: Login succeeds even when Redis is unavailable (with degraded rate-limiting)
next_action: Deploy fix and verify on production

## Symptoms

expected: User enters credentials and logs in successfully
actual: Error shown after entering login data on both mobile and web
errors: ReplyError: ERR max requests limit exceeded. Limit: 500000, Usage: 500002
reproduction: Try to log in on either mobile or web app
started: After the last code update (coincided with Redis limit being hit)

## Eliminated

- hypothesis: Auth code bug introduced in recent commits
  evidence: Auth code works fine locally, no logic errors found
  timestamp: 2026-04-06T18:35:00Z

- hypothesis: Prisma schema mismatch / missing migrations
  evidence: setupPassword endpoint (which queries User model) works fine in production
  timestamp: 2026-04-06T18:31:00Z

- hypothesis: Redis TLS connection issue (rediss:// not handled)
  evidence: ioredis v5 handles rediss:// automatically; health check shows redis:true
  timestamp: 2026-04-06T18:35:00Z

- hypothesis: argon2 crash on Alpine Linux
  evidence: Non-existent user (no argon2 call) also returns 500
  timestamp: 2026-04-06T18:37:00Z

## Evidence

- timestamp: 2026-04-06T18:27:00Z
  checked: Production health endpoint
  found: {"status":"ok","db":true,"redis":true,"storage":true}
  implication: App is running, infrastructure seems OK

- timestamp: 2026-04-06T18:27:24Z
  checked: Login endpoint with test credentials
  found: 500 Internal Server Error (not 401)
  implication: Something crashes during login, not just auth rejection

- timestamp: 2026-04-06T18:31:00Z
  checked: Setup-password endpoint (uses Prisma User queries but NOT Redis)
  found: Returns 401 correctly (no 500)
  implication: Prisma and DB work fine; issue is Redis-related

- timestamp: 2026-04-06T18:40:37Z
  checked: Local API with real DB and Redis
  found: Login works perfectly locally (200 with tokens, 401 for wrong creds)
  implication: Code is correct; issue is environment-specific

- timestamp: 2026-04-06T18:42:00Z
  checked: Railway production logs via `railway logs`
  found: "ReplyError: ERR max requests limit exceeded. Limit: 500000, Usage: 500002"
  implication: ROOT CAUSE CONFIRMED - Upstash Redis free tier monthly limit hit

## Resolution

root_cause: Upstash Redis free tier (500K commands/month) limit exceeded. Bull queues (SMS, email), cron jobs, and auth Redis operations consumed all 500K commands. When the limit is hit, ALL Redis commands return "ERR max requests limit exceeded", which the auth service's redis.get() call throws as an unhandled error, resulting in a 500 response.
fix: Made all Redis operations in auth service graceful (best-effort) using a safeRedis() wrapper that catches errors and returns null. Login/logout now work even when Redis is unavailable - rate-limiting and lockout tracking are skipped, refresh tokens are stored best-effort. Also fixed duplicate role check in login method.
verification: Local testing confirmed all 3 scenarios work (valid login, invalid password, non-existent user)
files_changed:
  - apps/api/src/auth/auth.service.ts
