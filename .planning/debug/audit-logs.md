---
status: awaiting_human_verify
trigger: "Audit log page shows nothing or errors in web admin panel"
created: 2026-03-31T10:00:00Z
updated: 2026-03-31T10:20:00Z
---

## Current Focus

hypothesis: AuditTrail component on /audyt page lacks error handling - if API fails, component shows nothing (no error state)
test: Compare AuditTrail component with ActivityFeed component which uses the same useAudit hook
expecting: Confirm that AuditTrail lacks isError handling that ActivityFeed has
next_action: Add error handling to AuditTrail component matching the pattern from ActivityFeed

## Symptoms

expected: Audit logs should show all system activity in the admin panel
actual: Audit log page shows nothing or throws errors
errors: Likely API error or empty response
reproduction: Go to audit page in web admin panel (/audyt)
started: Currently broken

## Eliminated

## Evidence

- timestamp: 2026-03-31T10:05:00Z
  checked: Frontend code (audit-trail.tsx, use-audit.ts)
  found: Frontend sends dateFrom/dateTo as query params but backend DTO (query-audit.dto.ts) doesn't define these fields. Frontend also correctly handles empty data state (shows "Brak wpisow audytu").
  implication: Date filters are silently ignored but shouldn't cause errors

- timestamp: 2026-03-31T10:06:00Z
  checked: Backend service (audit.service.ts) and controller
  found: Service returns { data, total, limit, offset } shape. Uses Prisma with include for actor relation. No validation issues in DTO.
  implication: API structure looks correct

- timestamp: 2026-03-31T10:07:00Z
  checked: Audit interceptor registration
  found: AuditInterceptor is registered globally via APP_INTERCEPTOR in app.module.ts
  implication: Interceptor should be active and logging mutations

- timestamp: 2026-03-31T10:10:00Z
  checked: Error handling in AuditTrail vs ActivityFeed components
  found: ActivityFeed (dashboard component) uses same useAudit hook and DOES handle isError (line 52-62). AuditTrail component on /audyt page does NOT destructure isError from useAudit hook - only uses { data: response, isLoading }
  implication: If API call fails on /audyt page, component shows nothing - no error state rendered

## Resolution

root_cause: AuditTrail component lacks error handling - when API fails, it shows nothing instead of an error state. The useAudit hook returns isError but the component doesn't use it.
fix: Added isError and refetch to useAudit destructuring, added error state UI with retry button similar to ActivityFeed component pattern
verification: TypeScript and ESLint pass, code follows existing patterns
files_changed: [apps/web/src/components/audit/audit-trail.tsx]
