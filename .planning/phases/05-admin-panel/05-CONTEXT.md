# Phase 5: Admin Panel - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Web-based admin interface for managing all system entities (vehicles, customers, rentals, contracts), with search/filter, bulk operations, calendar timeline, and audit trail viewing. Desktop-first layout. First frontend in the monorepo — requires full scaffold of `apps/web`.

</domain>

<decisions>
## Implementation Decisions

### Tech Stack
- **Framework:** Next.js (App Router) in `apps/web/` within Turbo monorepo
- **Component library:** shadcn/ui + Tailwind CSS (components copied into src/)
- **Data tables:** TanStack Table with server-side pagination and sorting
- **Data fetching:** TanStack Query + fetch for API communication
- **Forms:** React Hook Form + Zod (reuse existing Zod schemas from @rentapp/shared)
- **Icons:** lucide-react
- **Date handling:** date-fns with Polish locale
- **Auth:** JWT via existing API `/auth/login`, tokens stored in httpOnly cookies (requires CORS + cookie config on API)
- **Theme:** Dark theme with zinc/neutral tones (professional admin feel, Linear/Vercel style)
- **Language:** Polish-only UI — all labels, menus, buttons in Polish

### Layout & Navigation
- **Layout:** Collapsible left sidebar with icons + labels, main content area on right
- **Landing page:** Dashboard with overview cards (active rentals, available vehicles, today's returns, overdue) + recent activity feed
- **Sidebar items (flat list):** Pulpit (dashboard), Pojazdy, Klienci, Wynajmy, Umowy, Audyt
- **Calendar:** Tab within Wynajmy page ("Lista" | "Kalendarz"), not separate sidebar item
- **Calendar implementation:** Custom Gantt-like timeline using div positioning + TanStack Table for vehicle axis (no external calendar library)

### CRUD & Data Display
- **Entity lists:** Data tables with TanStack Table — sortable columns, server-side pagination, per-entity filter bars
- **Create/Edit forms:** Separate pages (/entities/new, /entities/:id/edit) with breadcrumb navigation back to list
- **Detail views:** Separate page per entity with tabs (e.g., vehicle: Dane, Wynajmy, Dokumenty)
- **Rental detail page:** Status badge + action buttons (Przedluz, Zwroc, Cofnij based on state machine), tabs: Szczegoly, Umowa, Inspekcja, Audyt
- **Search:** Per-entity filter bars (Pojazdy: rej/VIN + status; Klienci: nazwisko/tel; Wynajmy: data od-do + status; Umowy: klient/rej + status)
- **Bulk operations:** Checkbox select + status change + CSV export on vehicle list

### Audit Trail Viewing
- **Global audit page:** Filterable table — filter by employee, entity type, date range
- **Entity audit:** "Audyt" tab on each entity detail page showing only that entity's history
- **Detail level:** Expandable rows with field-level diff (old value -> new value). Encrypted fields show "[ZASZYFROWANE]"
- **Columns:** Timestamp, employee name, action type (CREATE/UPDATE/DELETE), entity reference

### Claude's Discretion
- Next.js middleware structure for auth guards
- API client abstraction pattern (shared fetch wrapper vs individual hooks)
- TanStack Table column definitions and filter implementations
- Dashboard card components and data aggregation queries
- Calendar timeline rendering details (day/week zoom, scroll behavior)
- shadcn/ui component selection and customization
- Loading states, error boundaries, skeleton patterns
- Responsive behavior (desktop-first but graceful degradation)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Constraint: "interfejs tylko po polsku", core value, data fields
- `.planning/REQUIREMENTS.md` — ADMIN-01, ADMIN-02, ADMIN-03 acceptance criteria

### API backend (Phases 1-4)
- `apps/api/src/vehicles/vehicles.controller.ts` — Vehicle CRUD endpoints to consume
- `apps/api/src/customers/customers.controller.ts` — Customer CRUD endpoints with encrypted PII
- `apps/api/src/rentals/rentals.controller.ts` — Rental CRUD, calendar endpoint, state transitions
- `apps/api/src/contracts/` — Contract endpoints (Phase 4, in progress)
- `apps/api/src/audit/audit.controller.ts` — Audit trail query endpoint
- `apps/api/src/auth/auth.controller.ts` — Login, refresh, password reset endpoints

### Shared types and schemas
- `packages/shared/src/types/` — TypeScript types for all entities (vehicle, customer, rental, contract)
- `packages/shared/src/schemas/` — Zod schemas for validation (reuse in React Hook Form)

### Prior phase decisions
- `.planning/phases/03-rental-lifecycle/03-CONTEXT.md` — Calendar API shape (vehicle-grouped), state machine transitions, pricing in grosze
- `.planning/phases/04-contract-and-pdf/04-CONTEXT.md` — Contract flow, signature capture, PDF generation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@rentapp/shared` — Zod schemas for all entities, reuse with React Hook Form's zodResolver
- Existing API endpoints — REST controllers for all CRUD operations
- `AuditInterceptor` — Already captures field-level diffs on backend
- Turbo monorepo — `apps/web/` slot available, workspace dependencies ready

### Established Patterns
- NestJS REST API: standard CRUD endpoints with DTOs
- Prisma models with UUID PKs, Json columns for flexible data
- JWT auth: access + refresh tokens, role-based guards (admin, employee, customer)
- Audit: `__audit` metadata pattern, field-level diffs stored in audit log
- Pricing: net + VAT (23%), stored as integers (grosze)

### Integration Points
- `apps/web/` — New Next.js app to scaffold in Turbo workspace
- API base URL — Environment variable for backend connection
- `packages/shared/` — Import types and Zod schemas directly
- Auth flow — API `/auth/login` sets httpOnly cookies, API needs CORS + cookie config update

</code_context>

<specifics>
## Specific Ideas

- Dark theme with zinc/neutral tones — professional, similar to Linear/Vercel dashboard
- Calendar as a tab within Wynajmy, not a separate page — custom Gantt timeline
- Rental detail page shows state-aware action buttons (only valid transitions)
- Audit expandable rows show field-level diffs with encrypted field masking
- Dashboard cards: active rentals, available vehicles, today's returns, overdue returns
- All UI text in Polish — including date formatting (date-fns Polish locale)
- Bulk operations limited to vehicles: status change + CSV export

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-admin-panel*
*Context gathered: 2026-03-24*
