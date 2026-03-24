# Phase 5: Admin Panel - Research

**Researched:** 2026-03-24
**Domain:** Next.js App Router frontend with shadcn/ui, TanStack Table/Query, React Hook Form
**Confidence:** HIGH

## Summary

Phase 5 is the first frontend in the RentApp monorepo. It requires scaffolding `apps/web/` as a Next.js App Router application within the existing Turbo/pnpm workspace, then building a complete admin panel that consumes the existing NestJS REST API. The API layer (Phases 1-4) is fully built with CRUD endpoints for vehicles, customers, rentals, contracts, and audit trail -- all protected by JWT auth with role-based guards.

The stack is locked: Next.js (App Router), shadcn/ui + Tailwind CSS, TanStack Table (server-side), TanStack Query + fetch, React Hook Form + Zod (reusing `@rentapp/shared` schemas), lucide-react icons, date-fns with Polish locale. The UI is dark theme, Polish-only, desktop-first.

**Primary recommendation:** Scaffold `apps/web/` with Next.js App Router, initialize shadcn/ui with zinc dark theme, build a shared API client layer with TanStack Query, then implement entity pages progressively (dashboard, vehicles, customers, rentals, contracts, audit) with the data table pattern as the primary reusable component.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Framework:** Next.js (App Router) in `apps/web/` within Turbo monorepo
- **Component library:** shadcn/ui + Tailwind CSS (components copied into src/)
- **Data tables:** TanStack Table with server-side pagination and sorting
- **Data fetching:** TanStack Query + fetch for API communication
- **Forms:** React Hook Form + Zod (reuse existing Zod schemas from @rentapp/shared)
- **Icons:** lucide-react
- **Date handling:** date-fns with Polish locale
- **Auth:** JWT via existing API `/auth/login`, tokens stored in httpOnly cookies (requires CORS + cookie config on API)
- **Theme:** Dark theme with zinc/neutral tones (professional admin feel, Linear/Vercel style)
- **Language:** Polish-only UI -- all labels, menus, buttons in Polish
- **Layout:** Collapsible left sidebar with icons + labels, main content area on right
- **Landing page:** Dashboard with overview cards + recent activity feed
- **Sidebar items (flat list):** Pulpit (dashboard), Pojazdy, Klienci, Wynajmy, Umowy, Audyt
- **Calendar:** Tab within Wynajmy page ("Lista" | "Kalendarz"), not separate sidebar item
- **Calendar implementation:** Custom Gantt-like timeline using div positioning + TanStack Table for vehicle axis (no external calendar library)
- **Entity lists:** Data tables with TanStack Table -- sortable columns, server-side pagination, per-entity filter bars
- **Create/Edit forms:** Separate pages (/entities/new, /entities/:id/edit) with breadcrumb navigation
- **Detail views:** Separate page per entity with tabs
- **Bulk operations:** Checkbox select + status change + CSV export on vehicle list
- **Audit trail:** Global audit page + "Audyt" tab on each entity detail page, expandable rows with field-level diff

### Claude's Discretion
- Next.js middleware structure for auth guards
- API client abstraction pattern (shared fetch wrapper vs individual hooks)
- TanStack Table column definitions and filter implementations
- Dashboard card components and data aggregation queries
- Calendar timeline rendering details (day/week zoom, scroll behavior)
- shadcn/ui component selection and customization
- Loading states, error boundaries, skeleton patterns
- Responsive behavior (desktop-first but graceful degradation)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMIN-01 | Admin has full CRUD on all entities (vehicles, customers, rentals, contracts) through web panel (desktop-first) | Next.js App Router pages for each entity, React Hook Form + Zod for create/edit, TanStack Table for list views, shadcn/ui components per UI-SPEC |
| ADMIN-02 | Admin can search and filter data (by registration, name, date range) with bulk operations support | TanStack Table server-side filtering, per-entity filter bars, checkbox selection + bulk status change + CSV export on vehicles |
| ADMIN-03 | Admin can view audit trail per rental, vehicle, or employee | Audit API endpoint with entityType/entityId/actorId filters, expandable rows with field-level diffs, global audit page + per-entity audit tabs |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.1 | App Router framework | Locked decision, App Router for RSC/layouts |
| react | 19.x | UI library | Required by Next.js 16 |
| @tanstack/react-table | 8.21.3 | Data tables with server-side pagination/sorting | Locked decision, headless -- pairs with shadcn/ui table |
| @tanstack/react-query | 5.95.2 | Server state management and caching | Locked decision, handles fetch/cache/refetch |
| react-hook-form | 7.72.0 | Form state management | Locked decision, performant re-renders |
| @hookform/resolvers | 5.2.2 | Zod resolver for react-hook-form | Bridges RHF with Zod validation |
| zod | 3.24.x | Schema validation (reuse @rentapp/shared) | Already in project, locked decision |
| tailwindcss | 4.x | Utility CSS framework | Required by shadcn/ui |
| date-fns | 4.1.0 | Date formatting with Polish locale | Locked decision |
| lucide-react | 1.0.1 | Icon library | Locked decision |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @rentapp/shared | workspace:* | Shared Zod schemas and TypeScript types | All API interactions, form validation |
| sonner | latest | Toast notifications | CRUD success/error feedback |
| nuqs | latest | URL state for search params | Table filters, pagination in URL |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nuqs for URL state | Manual useSearchParams | nuqs handles serialization/types, less boilerplate |
| Custom fetch wrapper | axios | fetch is native, smaller bundle, sufficient for REST |

**Installation (in apps/web/):**
```bash
pnpm add next react react-dom @tanstack/react-table @tanstack/react-query react-hook-form @hookform/resolvers date-fns lucide-react sonner nuqs @rentapp/shared
pnpm add -D typescript @types/react @types/react-dom @types/node tailwindcss @tailwindcss/postcss postcss
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/
├── package.json
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── components.json              # shadcn/ui config
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (providers, sidebar)
│   │   ├── page.tsx             # Dashboard (Pulpit)
│   │   ├── login/
│   │   │   └── page.tsx         # Login page (public)
│   │   ├── (admin)/             # Route group for authenticated layout
│   │   │   ├── layout.tsx       # Sidebar + main content layout
│   │   │   ├── pojazdy/
│   │   │   │   ├── page.tsx             # Vehicle list
│   │   │   │   ├── nowy/page.tsx        # Create vehicle
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx         # Vehicle detail (tabs)
│   │   │   │   │   └── edytuj/page.tsx  # Edit vehicle
│   │   │   ├── klienci/         # Same CRUD pattern
│   │   │   ├── wynajmy/         # List + Calendar tab
│   │   │   ├── umowy/           # List + detail
│   │   │   └── audyt/           # Global audit page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── top-bar.tsx
│   │   │   └── breadcrumbs.tsx
│   │   ├── data-table/
│   │   │   ├── data-table.tsx           # Generic TanStack Table wrapper
│   │   │   ├── data-table-pagination.tsx
│   │   │   ├── data-table-toolbar.tsx
│   │   │   └── data-table-column-header.tsx
│   │   ├── dashboard/
│   │   │   └── stat-card.tsx
│   │   └── audit/
│   │       └── audit-trail.tsx          # Reusable audit component (global + per-entity)
│   ├── lib/
│   │   ├── api-client.ts        # Fetch wrapper with auth token handling
│   │   ├── utils.ts             # cn() helper (shadcn standard)
│   │   └── format.ts            # Date/currency formatting helpers
│   ├── hooks/
│   │   ├── use-auth.ts          # Auth state + login/logout
│   │   └── queries/
│   │       ├── use-vehicles.ts  # TanStack Query hooks per entity
│   │       ├── use-customers.ts
│   │       ├── use-rentals.ts
│   │       ├── use-contracts.ts
│   │       └── use-audit.ts
│   └── middleware.ts            # Auth middleware (redirect unauthenticated)
```

### Pattern 1: API Client with Auth Token Management
**What:** Centralized fetch wrapper that handles JWT token from httpOnly cookies, refresh logic, and error normalization.
**When to use:** Every API call from the frontend.
**Example:**
```typescript
// src/lib/api-client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(public status: number, public data: unknown) {
    super(`API Error ${status}`);
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // send httpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data);
  }

  return res.json();
}
```

### Pattern 2: TanStack Query Hooks per Entity
**What:** Each entity gets a hooks file exporting `useList`, `useOne`, `useCreate`, `useUpdate`, `useDelete` query/mutation hooks.
**When to use:** All data fetching in components.
**Example:**
```typescript
// src/hooks/queries/use-vehicles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { VehicleDto } from '@rentapp/shared';

export const vehicleKeys = {
  all: ['vehicles'] as const,
  list: (filters: Record<string, unknown>) => [...vehicleKeys.all, 'list', filters] as const,
  detail: (id: string) => [...vehicleKeys.all, 'detail', id] as const,
};

export function useVehicles(filters: { page: number; pageSize: number }) {
  return useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: () => apiClient<VehicleDto[]>(`/vehicles`),
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVehicleInput) =>
      apiClient<VehicleDto>('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}
```

### Pattern 3: Reusable Data Table Component
**What:** Generic `<DataTable>` component wrapping TanStack Table with shadcn/ui `<Table>`, supporting server-side pagination, sorting, row selection.
**When to use:** Every entity list page.
**Example:**
```typescript
// src/components/data-table/data-table.tsx
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
}
```

### Pattern 4: Next.js Middleware for Auth
**What:** Middleware that checks for auth cookie presence, redirects to `/login` if missing.
**When to use:** Protecting all admin routes.
**Example:**
```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Pattern 5: Form Pages with Zod Schema Reuse
**What:** Create/edit pages using React Hook Form with zodResolver, importing schemas directly from `@rentapp/shared`.
**When to use:** All entity forms.
**Example:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateVehicleSchema, type CreateVehicleInput } from '@rentapp/shared';

const form = useForm<CreateVehicleInput>({
  resolver: zodResolver(CreateVehicleSchema),
  defaultValues: { seatCount: 5, mileage: 0 },
});
```

### Anti-Patterns to Avoid
- **Client-side data filtering on large datasets:** Always use server-side pagination/filtering via API query params. The API already supports `limit`/`offset` on audit and `includeArchived` on vehicles/customers.
- **Storing JWT in localStorage:** Decision is httpOnly cookies. Never store tokens in JS-accessible storage.
- **Building custom form state management:** Always use React Hook Form -- never manage form state with useState.
- **Fetching in useEffect:** Use TanStack Query exclusively. No raw useEffect + fetch patterns.
- **Duplicating Zod schemas:** Import from `@rentapp/shared`, never copy-paste schema definitions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data tables with sort/filter/pagination | Custom table with manual state | TanStack Table + shadcn Table | Column definitions, virtual scrolling, selection state |
| Server state cache | useState + useEffect for API data | TanStack Query | Stale-while-revalidate, dedup, refetch on focus |
| Form validation | Custom validation functions | React Hook Form + Zod resolver | Field-level errors, touched state, submit handling |
| Toast notifications | Custom toast system | sonner (via shadcn) | Accessible, animated, positioned correctly |
| Component primitives | Custom button/input/dialog | shadcn/ui | Accessible (Radix), themed, consistent |
| Date formatting | Manual date string manipulation | date-fns with `pl` locale | Timezone-safe, locale-aware |
| URL query state sync | Manual searchParams parsing | nuqs | Type-safe, serialization, history integration |
| CSV export | Manual CSV string building | Simple array-to-CSV util | Minimal -- but don't pull a library for this |

**Key insight:** This is an admin panel consuming an existing API. The complexity is in data display, filtering, and forms -- not business logic. The entire frontend layer should be thin, delegating validation to shared schemas and state management to TanStack Query.

## Common Pitfalls

### Pitfall 1: CORS + Cookie Configuration on API
**What goes wrong:** httpOnly cookies won't be sent cross-origin without proper CORS config. The current API calls `app.enableCors()` with no options, which does NOT enable credentials.
**Why it happens:** Default CORS in NestJS doesn't set `Access-Control-Allow-Credentials: true` or specify an origin (uses `*` which blocks credentials).
**How to avoid:** Update `apps/api/src/main.ts` to:
```typescript
app.enableCors({
  origin: process.env.WEB_URL ?? 'http://localhost:3001',
  credentials: true,
});
```
Also need a cookie-setting endpoint or proxy pattern. Since the current auth returns tokens in the response body (not cookies), the frontend needs to either:
1. Use a Next.js Route Handler as a proxy (POST to `/api/auth/login` on Next.js, which calls the backend and sets the httpOnly cookie), OR
2. Modify the API to set cookies directly in response headers.

**Recommendation:** Use Next.js Route Handler as BFF (Backend-for-Frontend) proxy for auth. This keeps the API unchanged and handles cookie management cleanly.
**Warning signs:** `fetch` with `credentials: 'include'` returns 401 despite valid login.

### Pitfall 2: Server Components vs Client Components Boundary
**What goes wrong:** Using TanStack Query or React Hook Form in Server Components causes hydration errors.
**Why it happens:** Next.js App Router defaults to Server Components. Interactive components (forms, tables with state, query-dependent views) must be Client Components.
**How to avoid:** Add `'use client'` to any component that uses hooks (useState, useQuery, useForm, useRouter from next/navigation). Keep layout components as Server Components when possible.
**Warning signs:** "useState is not a function" or hydration mismatch errors.

### Pitfall 3: TanStack Table Server-Side vs Client-Side Mode
**What goes wrong:** Table tries to sort/filter/paginate on client side when data should come pre-sorted from the API.
**Why it happens:** TanStack Table defaults to client-side processing. Must set `manualPagination: true`, `manualSorting: true`, `manualFiltering: true`.
**How to avoid:** Always pass `pageCount` from API response, use `onPaginationChange`/`onSortingChange` to update query params, re-fetch via TanStack Query.
**Warning signs:** All data loads at once, pagination shows wrong counts.

### Pitfall 4: API Pagination Gap
**What goes wrong:** The current API endpoints (`/vehicles`, `/customers`, `/rentals`) return all records without server-side pagination (only audit has `limit`/`offset`).
**Why it happens:** Backend was built for mobile/field use where datasets are small.
**How to avoid:** For Phase 5, implement client-side pagination on the TanStack Table side for vehicles/customers/rentals (data sets are manageable for a local rental fleet -- likely <100 vehicles, <1000 customers). Use `manualPagination` only for the audit endpoint which already supports it. If needed, add pagination to API endpoints in a pre-task.
**Warning signs:** Slow load times on entity lists.

### Pitfall 5: Polish Characters in Zod Error Messages
**What goes wrong:** Zod validation errors display in English by default.
**Why it happens:** Zod's default error map is English.
**How to avoid:** Set a custom `errorMap` on Zod or map errors in the form UI layer. Since this is admin-facing (not public), displaying field-level errors in Polish via custom messages in the form component is sufficient.
**Warning signs:** "String must contain at least 1 character(s)" instead of a Polish message.

### Pitfall 6: Next.js + Turbo Workspace Configuration
**What goes wrong:** Next.js can't resolve `@rentapp/shared` or build fails in Turbo pipeline.
**Why it happens:** Next.js needs `transpilePackages` config for workspace dependencies.
**How to avoid:** In `next.config.ts`:
```typescript
const nextConfig = {
  transpilePackages: ['@rentapp/shared'],
};
```
Also ensure `@rentapp/shared` builds before `@rentapp/web` in Turbo (already handled by `dependsOn: ["^build"]`).
**Warning signs:** "Module not found" for @rentapp/shared imports.

## Code Examples

### Auth BFF Pattern (Next.js Route Handler)
```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const response = NextResponse.json({ user: data.user ?? {} });

  // Set httpOnly cookie with access token
  response.cookies.set('access_token', data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 min (match JWT expiry)
  });

  response.cookies.set('refresh_token', data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 24 * 60 * 60, // 24h
  });

  return response;
}
```

### API Proxy Route Handler (Forward Cookies as Bearer)
```typescript
// src/app/api/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

async function proxyRequest(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/api/, '');
  const token = request.cookies.get('access_token')?.value;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}${request.nextUrl.search}`, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
```

### Date Formatting with Polish Locale
```typescript
// src/lib/format.ts
import { format, formatRelative } from 'date-fns';
import { pl } from 'date-fns/locale/pl';

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'd MMM yyyy', { locale: pl });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'd MMM yyyy, HH:mm', { locale: pl });
}

export function formatCurrency(grosze: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(grosze / 100);
}
```

### Audit Trail Expandable Row Component
```typescript
// Pattern for expandable audit rows with field-level diff
interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: { name: string; email: string };
  changesJson: Record<string, { old: unknown; new: unknown }>;
  createdAt: string;
}

// Column definition with expand toggle
// Expanded content shows changesJson as a diff table:
// Field | Stara wartosc | Nowa wartosc
// Encrypted fields show "[ZASZYFROWANE]"
```

### CSV Export Utility
```typescript
// Simple CSV export for bulk operations
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string,
) {
  const header = columns.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = String(row[c.key] ?? '');
      return val.includes(',') ? `"${val}"` : val;
    }).join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router (getServerSideProps) | App Router (Server Components + Client Components) | Next.js 13+ (stable 14+) | Layout nesting, streaming, server actions |
| SWR for data fetching | TanStack Query v5 | 2023+ | Stronger mutation support, devtools, query keys |
| Formik for forms | React Hook Form v7 | 2021+ | Better performance, smaller bundle |
| CSS Modules / styled-components | Tailwind CSS + shadcn/ui | 2023+ | Utility-first, copy-paste components, dark mode built-in |
| Custom calendar libraries (FullCalendar) | Custom Gantt-like timeline (decision) | N/A | Lighter weight for specific use case |

**Deprecated/outdated:**
- `getServerSideProps` / `getStaticProps` -- replaced by App Router's server components and data fetching patterns
- `next/router` -- replaced by `next/navigation` in App Router
- TanStack Query v4 -- v5 removed callbacks from useQuery, changed API slightly

## Open Questions

1. **API Pagination for Entity Lists**
   - What we know: Only audit endpoint supports `limit`/`offset`. Vehicle/customer/rental endpoints return full arrays.
   - What's unclear: Whether dataset size warrants server-side pagination or if client-side (via TanStack Table) is sufficient.
   - Recommendation: Start with client-side pagination (fleet is local, <100 vehicles). Add API pagination as a stretch task only if performance requires it.

2. **Auth Cookie Flow**
   - What we know: Current API returns tokens in response body. Decision says httpOnly cookies.
   - What's unclear: Whether to modify the API to set cookies or use a Next.js BFF proxy.
   - Recommendation: Use Next.js Route Handlers as BFF proxy for auth endpoints. This keeps the API backward-compatible for future mobile app (Phase 6) which will use Bearer tokens directly.

3. **Dashboard Aggregation Queries**
   - What we know: Dashboard needs: active rentals count, available vehicles count, today's returns, overdue count.
   - What's unclear: No dedicated dashboard/stats endpoint exists on the API.
   - Recommendation: Either add a `/dashboard/stats` endpoint to the API, or compute counts client-side from the entity list responses. Given small dataset, client-side computation is acceptable initially.

4. **Existing API CORS Update**
   - What we know: `main.ts` calls `app.enableCors()` with no config.
   - What's unclear: Whether updating the API's main.ts is in scope for Phase 5.
   - Recommendation: Include a small API modification task to configure CORS with credentials support. This is a prerequisite for the frontend to work.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (e2e) + Vitest (unit for utils/hooks) |
| Config file | none -- see Wave 0 |
| Quick run command | `pnpm --filter @rentapp/web test` |
| Full suite command | `pnpm --filter @rentapp/web test && pnpm --filter @rentapp/web test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMIN-01 | CRUD pages render, forms submit, detail pages show entity data | e2e | `pnpm --filter @rentapp/web test:e2e -- --grep "crud"` | No -- Wave 0 |
| ADMIN-01 | Form validation with Zod schemas matches API expectations | unit | `pnpm --filter @rentapp/web test -- --grep "validation"` | No -- Wave 0 |
| ADMIN-02 | Filter bars update URL params and refetch data, bulk select works | e2e | `pnpm --filter @rentapp/web test:e2e -- --grep "filter"` | No -- Wave 0 |
| ADMIN-02 | CSV export generates valid file | unit | `pnpm --filter @rentapp/web test -- --grep "csv"` | No -- Wave 0 |
| ADMIN-03 | Audit trail page loads, filters by entity/employee, rows expand | e2e | `pnpm --filter @rentapp/web test:e2e -- --grep "audit"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @rentapp/web build` (type-check + build validation)
- **Per wave merge:** `pnpm --filter @rentapp/web build && pnpm --filter @rentapp/web test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/web/vitest.config.ts` -- unit test configuration
- [ ] `apps/web/playwright.config.ts` -- e2e test configuration (if e2e added)
- [ ] `apps/web/src/__tests__/` -- test directory structure
- [ ] Framework install: `pnpm --filter @rentapp/web add -D vitest @testing-library/react @testing-library/jest-dom` -- unit testing deps
- [ ] Note: For Phase 5, build success (`next build`) is the primary validation gate. The TypeScript compiler + build process catches most issues. Full e2e testing is more appropriate post-scaffold. Unit tests for utility functions (formatDate, formatCurrency, CSV export) and form validation are high-value, low-cost.

## Sources

### Primary (HIGH confidence)
- Project codebase -- all API controllers, shared types/schemas, turbo config read directly
- `05-CONTEXT.md` -- locked decisions and discretion areas
- `05-UI-SPEC.md` -- complete visual/interaction contract
- npm registry -- verified current versions for all packages (2026-03-24)

### Secondary (MEDIUM confidence)
- Next.js App Router patterns -- based on established conventions since Next.js 14+
- TanStack Query v5 patterns -- standard documented patterns
- shadcn/ui component installation -- well-documented CLI workflow

### Tertiary (LOW confidence)
- nuqs for URL state management -- recommended based on ecosystem adoption, but could use manual useSearchParams instead

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages verified against npm registry, versions confirmed current
- Architecture: HIGH -- patterns are well-established for Next.js App Router + TanStack stack
- Pitfalls: HIGH -- identified from direct codebase analysis (CORS config, missing pagination, workspace transpilation)
- API integration: HIGH -- all controller endpoints, DTOs, and response shapes read from source code

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (30 days -- stable, established stack)
