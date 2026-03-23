# Phase 1: Foundation and Auth - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffold (Turborepo monorepo), database schema with encrypted PII fields, authentication with JWT and three roles (admin, employee, customer), and immutable audit trail interceptor. This phase delivers the running backend foundation that all subsequent phases build on. No client UIs — API only.

</domain>

<decisions>
## Implementation Decisions

### Dev Environment
- **Monorepo:** Turborepo with structure: `apps/api`, `apps/web`, `apps/mobile`, `packages/shared`
- **Package manager:** pnpm
- **Node.js:** v22 LTS
- **Local dependencies:** Docker Compose (PostgreSQL 16, Redis 7, MinIO) — one `docker-compose up` starts everything
- **Shared package:** TypeScript types + Zod validation schemas shared between all apps — prevents API/client contract drift
- **Linting/formatting:** ESLint + Prettier with shared config
- **Target hosting:** Railway (PaaS)

### Auth Behavior
- **Session duration:** 24 hours — daily re-login required
- **Failed login:** Account locked for 15 minutes after 5 failed attempts
- **Password policy:** Minimum 8 characters, no forced complexity (NIST approach)
- **Account creation:** Admin creates employee accounts → employee receives email with password setup link
- **Multi-device:** Allowed — employee can be logged in on phone + laptop simultaneously

### Role Boundaries
- **Admin:** Full access to everything — all CRUD, audit trail, account management, system settings
- **Employee:** Can create/edit rentals and customers, read-only access to vehicles, no audit trail access, no account management
- **Customer:** Magic link access (no password) — read-only portal (Phase 9), token-based auth with expiry
- **Public endpoints:** None — all endpoints require authentication

### Audit Trail
- **Scope:** All mutations (create/update/delete) on every entity are logged
- **Detail level:** Full diff — old value → new value for every changed field
- **Retention:** Indefinite — logs are never deleted (legal/accountability requirements)
- **Access:** Admin-only in admin panel
- **Implementation:** NestJS interceptor pattern — automatic, no manual logging per endpoint
- **Immutability:** Append-only table, no update/delete operations on audit records

### Claude's Discretion
- JWT token structure (access + refresh token strategy)
- Database migration tooling (Prisma Migrate)
- Exact Docker Compose service configuration
- Redis usage patterns (sessions, caching, or both)
- CI/CD pipeline details
- Test framework selection

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Project vision, constraints (Polish market, smsapi.pl, existing contract template)
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-05 requirements with acceptance criteria
- `.planning/research/STACK.md` — Detailed stack recommendations with versions (NestJS 11, Prisma 7.4, PostgreSQL 16)
- `.planning/research/ARCHITECTURE.md` — Modular monolith architecture, module boundaries, data flow

### Security and compliance
- `.planning/research/PITFALLS.md` — Critical RODO/GDPR pitfalls, PESEL encryption requirements, data minimization rules
- `.planning/research/SUMMARY.md` — Key findings including UODO enforcement precedents (ING 18M PLN, Glovo 5.9M PLN fines)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project

### Established Patterns
- None — patterns will be established in this phase

### Integration Points
- This phase creates the foundation other phases integrate with:
  - Auth module (JWT guards, role decorators) used by all subsequent phases
  - Audit trail interceptor attached to all future controllers
  - Prisma schema extended by Phase 2+ for new entities
  - Shared types package consumed by web (Phase 5) and mobile (Phase 6)

</code_context>

<specifics>
## Specific Ideas

- User confirmed that mobile cross-platform setup (Expo, Android/iOS builds) belongs in Phase 6, not here
- Phase 1 establishes only the backend API + monorepo scaffold
- CEPiK API access application should be submitted during this phase (external process, multi-week approval)
- SMSAPI sender ID registration should also start (needed by Phase 8)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-and-auth*
*Context gathered: 2026-03-23*
