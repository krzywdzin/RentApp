# Phase 21: Critical Bug Fixes - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix all data-corrupting and crash-causing bugs in mobile and API: duplicate rental creation on re-tap, stuck loading states, stale useEffect dependencies, SearchBar state divergence, biometric logout race condition, Zustand hydration guard, ErrorBoundary retry loop, contract number race condition, notification two-step create, retention service safety guard, non-null assertions, photo upload ordering, replacePhoto ordering, annex create-then-update, and SmsService crash on missing token.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure bug-fix phase. Key audit references:
- MOBILE-AUDIT: BUG-01 through BUG-07 (critical mobile bugs)
- API-AUDIT: 1.1 (contract number race), 1.2 (notification two-step), 10.2 (retention guard), 3.2 (non-null assertions), 5.2 (photo upload order), 5.3 (replacePhoto order), 10.1 (annex create-update), 4.7 (SmsService crash)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Zustand persist stores at `apps/mobile/src/stores/`
- React Query mutation hooks at `apps/mobile/src/hooks/`
- Prisma transactions used throughout API services

### Established Patterns
- Zustand persist with AsyncStorage for mobile state
- class-validator DTOs for API input validation
- Prisma.$transaction for atomic DB operations

### Integration Points
- `apps/mobile/app/(tabs)/new-rental/signatures.tsx` (duplicate rental, stuck loading)
- `apps/mobile/app/return/mileage.tsx`, `checklist.tsx` (stale useEffect)
- `apps/mobile/src/components/SearchBar.tsx` (state divergence)
- `apps/mobile/src/providers/AuthProvider.tsx` (biometric race)
- `apps/mobile/src/components/ErrorBoundary.tsx` (retry loop)
- `apps/api/src/contracts/contracts.service.ts` (contract number race, annex)
- `apps/api/src/notifications/notifications.service.ts` (two-step create)
- `apps/api/src/customers/retention.service.ts` (active rental guard)
- `apps/api/src/rentals/rentals.service.ts` (non-null assertion)
- `apps/api/src/photos/photos.service.ts` (upload/replace ordering)
- `apps/api/src/notifications/sms/sms.service.ts` (lazy init)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — bug fixes driven by audit findings.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
