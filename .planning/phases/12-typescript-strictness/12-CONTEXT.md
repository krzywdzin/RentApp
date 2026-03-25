# Phase 12: TypeScript Strictness - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure refactoring phase — replace all `any` types in backend services, web mutation hooks, and shared types with proper TypeScript types. No behavior changes, no new features, no API contract changes. The codebase must compile identically before and after.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure/refactoring phase. Key targets identified during research:

**Backend (apps/api):**
- `rentals.service.ts` (~18 any occurrences): Replace `Promise<any>` returns with typed DTOs, `tx: any` with `Prisma.TransactionClient`, `where: any` with proper Prisma types
- `contracts.service.ts` (~15 any): Replace `toDto(contract: any)` and parameter types with Prisma utility types
- `damage.service.ts` (~12 any): Replace `pins as any` with typed DamagePin interface for Prisma JSON columns
- `photos.service.ts` (~5 any): Fix typed array casts
- `vehicles.service.ts` (~6 any): Fix enum casts and toDto typing
- `portal.controller.ts` (~3 any): Create PortalRequest interface extending Express Request

**Web (apps/web):**
- Mutation hooks (use-customers.ts, use-vehicles.ts): Replace `Record<string, unknown>` with specific input types from @rentapp/shared
- `wynajmy/nowy/page.tsx`: Fix `zodResolver(formSchema) as any` cast

**Shared (packages/shared):**
- `portal.types.ts`: Replace `returnData: any | null` with typed ReturnInspectionData DTO

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Prisma client types available via `@prisma/client` (TransactionClient, utility types)
- Shared DTOs in `packages/shared/src/types/` — can extend with missing types
- Existing Zod schemas in shared package that can be used to derive types

### Established Patterns
- DTOs defined in shared package and imported by API and web
- Prisma includes used for relation loading — return types derivable from includes
- JSON column pattern: Prisma stores as `JsonValue`, needs type assertion

### Integration Points
- Changes in shared types affect both API and web — ensure exports are correct
- No runtime behavior changes — only type annotations

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard TypeScript refactoring following existing patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
