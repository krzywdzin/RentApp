---
phase: 20-security-hardening
plan: 02
subsystem: api
tags: [class-validator, throttler, csv, presigned-url, security]

requires:
  - phase: 20-security-hardening
    provides: Security hardening context and audit findings
provides:
  - Base64 payload size limits on signature and damage sketch DTOs
  - Rate-limited portal token exchange endpoint
  - CSV formula injection protection in web exports
  - Authenticated signed PDF URL flow for mobile
affects: [mobile, web, portal]

tech-stack:
  added: []
  patterns: [csv-formula-sanitization, presigned-url-for-mobile]

key-files:
  created: []
  modified:
    - apps/api/src/contracts/dto/sign-contract.dto.ts
    - apps/api/src/contracts/dto/create-contract.dto.ts
    - apps/api/src/portal/portal-auth.controller.ts
    - apps/web/src/lib/csv-export.ts
    - apps/api/src/contracts/contracts.controller.ts
    - apps/mobile/src/api/contracts.api.ts
    - apps/mobile/app/(tabs)/new-rental/success.tsx

key-decisions:
  - "500KB base64 string limit (~375KB decoded) balances usability with abuse prevention"
  - "5 req/min rate limit on portal token exchange tighter than global 100 req/min"
  - "CSV formula injection uses single-quote prefix per OWASP recommendation"
  - "Mobile PDF uses 5-minute signed URL expiry for download window"

patterns-established:
  - "CSV sanitization: prefix dangerous cells with single quote before delimiter escaping"
  - "Mobile file access: fetch signed URL via authenticated API, never expose direct storage URLs"

requirements-completed: [SEC-05, SEC-08, SEC-09, SEC-10]

duration: 2min
completed: 2026-03-27
---

# Phase 20 Plan 02: Input Limits, Rate Limiting, CSV Sanitization, and Signed PDF URLs

**Base64 size limits on DTOs, per-route throttle on portal exchange, CSV formula injection protection, and authenticated presigned PDF URL flow for mobile**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-27T22:01:34Z
- **Completed:** 2026-03-27T22:03:20Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added @MaxLength(500000) on signatureBase64 and damageSketchBase64 to reject oversized payloads
- Rate-limited portal token exchange to 5 requests per minute per IP via @Throttle decorator
- CSV export sanitizes cells starting with =, +, -, @, \t, \r with leading single quote to prevent formula injection
- New GET :id/pdf-url endpoint returns signed URL with 5-minute expiry for mobile download
- Mobile getPdfUrl converted from static URL construction to authenticated async API call

## Task Commits

Each task was committed atomically:

1. **Task 1: Add base64 size limits and portal rate limiting** - `c5c5271` (feat)
2. **Task 2: CSV formula injection protection and mobile PDF signed URL** - `f87a6e7` (feat)

## Files Created/Modified
- `apps/api/src/contracts/dto/sign-contract.dto.ts` - Added @MaxLength(500000) on signatureBase64
- `apps/api/src/contracts/dto/create-contract.dto.ts` - Added @MaxLength(500000) on damageSketchBase64
- `apps/api/src/portal/portal-auth.controller.ts` - Added @Throttle({ limit: 5, ttl: 60000 }) on exchange method
- `apps/web/src/lib/csv-export.ts` - Added FORMULA_PREFIXES sanitization before delimiter escaping
- `apps/api/src/contracts/contracts.controller.ts` - Added GET :id/pdf-url endpoint returning signed URL JSON
- `apps/mobile/src/api/contracts.api.ts` - Converted getPdfUrl to async authenticated call
- `apps/mobile/app/(tabs)/new-rental/success.tsx` - Updated to await getPdfUrl and handle errors

## Decisions Made
- 500KB base64 string limit (~375KB decoded) balances usability with abuse prevention
- 5 req/min rate limit on portal token exchange is tighter than global 100 req/min to protect brute-force vector
- CSV formula injection uses single-quote prefix per OWASP recommendation
- Mobile PDF uses 5-minute signed URL expiry -- short enough for security, long enough for download

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Security hardening for input limits, rate limiting, CSV injection, and PDF access complete
- Ready for next security plan in phase 20

---
*Phase: 20-security-hardening*
*Completed: 2026-03-27*
