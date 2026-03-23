# Architecture Research

**Domain:** Car Rental Management System (Polish market, field-first workflow)
**Researched:** 2026-03-23
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  Mobile App  │  │  Admin Panel │  │ Customer     │               │
│  │  (Employee)  │  │  (Web SPA)   │  │ Portal (Web) │               │
│  │  React Native│  │  React       │  │ React        │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                  │                       │
├─────────┴─────────────────┴──────────────────┴───────────────────────┤
│                        API GATEWAY / REVERSE PROXY                   │
│                        (Nginx or Caddy)                              │
├──────────────────────────────────────────────────────────────────────┤
│                        BACKEND API (Node.js / NestJS)                │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐            │
│  │  Auth &    │ │ Contract │ │  Fleet   │ │ Rental    │            │
│  │  Audit     │ │ & PDF    │ │ Mgmt     │ │ Lifecycle │            │
│  ├────────────┤ ├──────────┤ ├──────────┤ ├───────────┤            │
│  │ Calendar & │ │ Photo &  │ │ Customer │ │ Notifi-   │            │
│  │ Scheduling │ │ Damage   │ │ Mgmt     │ │ cations   │            │
│  └────────────┘ └──────────┘ └──────────┘ └───────────┘            │
├──────────────────────────────────────────────────────────────────────┤
│                        DATA & STORAGE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ PostgreSQL   │  │ Object Store │  │ Redis        │               │
│  │ (primary DB) │  │ (S3 / MinIO) │  │ (sessions,   │               │
│  │              │  │ photos, PDFs │  │  job queue)  │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
├──────────────────────────────────────────────────────────────────────┤
│                        EXTERNAL SERVICES                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ CEPiK    │  │ smsapi.pl│  │ SMTP /   │  │ Push     │            │
│  │ 2.0 API  │  │          │  │ Mailgun  │  │ (FCM/APNs)│           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Mobile App (Employee) | Field rental workflow: create contracts, capture signatures, take photos, verify drivers | React Native with signature canvas, camera integration |
| Admin Panel (Web) | Fleet management, calendar view, rental oversight, reporting, employee management | React SPA (Vite), full CRUD dashboard |
| Customer Portal (Web) | Read-only view of own contracts, rental history, upcoming return dates | Lightweight React app, token-based access (magic link) |
| Auth & Audit Module | JWT authentication, role-based access (admin/employee/customer), full audit trail | Passport.js or NestJS Guards, audit log table |
| Contract & PDF Module | Digital contract creation, signature embedding, PDF generation from template, email delivery | pdf-lib or @react-pdf/renderer (server), Handlebars templates |
| Fleet Management Module | Vehicle CRUD, status tracking (available/rented/maintenance), mileage, insurance dates | Standard REST CRUD with status state machine |
| Rental Lifecycle Module | Full rental cycle: create, extend, return, close. Links vehicle + customer + contract | State machine (draft -> active -> extended -> returned -> closed) |
| Calendar & Scheduling | Visual calendar of rentals, alerts for upcoming returns, conflict detection | FullCalendar (admin), cron jobs for alerts |
| Photo & Damage Module | Photo capture (mobile), upload, storage, association with rental + damage annotations | Camera API -> presigned URL upload -> S3/MinIO |
| Customer Management | Customer CRUD, contact info, rental history, driver license data | Standard REST CRUD, PESEL validation |
| Notifications | SMS reminders, email with PDF contracts, push notifications, in-app alerts | BullMQ job queue, smsapi.pl SDK, Nodemailer |

## Recommended Project Structure

This is a monorepo with three client apps and one backend API.

```
rentapp/
├── apps/
│   ├── mobile/                  # React Native (Expo) employee app
│   │   ├── src/
│   │   │   ├── screens/         # Screen components
│   │   │   ├── components/      # Shared UI components
│   │   │   ├── navigation/      # React Navigation config
│   │   │   ├── hooks/           # Custom hooks (useRental, useCamera)
│   │   │   ├── services/        # API client, storage helpers
│   │   │   ├── stores/          # State management (Zustand)
│   │   │   └── types/           # TypeScript types
│   │   └── app.json
│   ├── admin/                   # React web admin panel
│   │   ├── src/
│   │   │   ├── pages/           # Route-level components
│   │   │   ├── components/      # Shared UI components
│   │   │   ├── hooks/           # Data fetching hooks
│   │   │   ├── services/        # API client
│   │   │   └── types/           # TypeScript types
│   │   └── vite.config.ts
│   └── customer-portal/         # React web customer view
│       └── src/                 # Minimal structure (few pages)
├── packages/
│   └── shared/                  # Shared types, validation, constants
│       ├── types/               # Contract, Vehicle, Customer types
│       ├── validation/          # Zod schemas (shared client+server)
│       └── constants/           # Rental statuses, roles, etc.
├── server/                      # NestJS backend API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/            # Authentication, JWT, guards
│   │   │   ├── audit/           # Audit trail logging
│   │   │   ├── vehicles/        # Fleet management
│   │   │   ├── customers/       # Customer management
│   │   │   ├── rentals/         # Rental lifecycle
│   │   │   ├── contracts/       # PDF generation, templates
│   │   │   ├── photos/          # Photo upload, storage
│   │   │   ├── notifications/   # SMS, email, push
│   │   │   ├── calendar/        # Scheduling, alerts
│   │   │   └── cepik/           # CEPiK 2.0 integration
│   │   ├── common/
│   │   │   ├── guards/          # Auth guards
│   │   │   ├── interceptors/    # Audit interceptor, logging
│   │   │   ├── filters/         # Exception filters
│   │   │   └── decorators/      # Custom decorators
│   │   ├── database/
│   │   │   ├── migrations/      # TypeORM or Prisma migrations
│   │   │   └── seeds/           # Seed data (vehicle types, etc.)
│   │   └── jobs/                # Background job processors (BullMQ)
│   └── test/
├── docker-compose.yml           # PostgreSQL, Redis, MinIO (dev)
├── package.json                 # Workspace root (pnpm)
└── turbo.json                   # Turborepo config
```

### Structure Rationale

- **Monorepo (pnpm workspaces + Turborepo):** Three client apps + one API share types and validation schemas. Keeps everything in sync without publishing packages. At this scale (~100 cars, ~10 employees), a monorepo is simpler than separate repos.
- **packages/shared/:** Zod validation schemas and TypeScript types shared between server and all clients. Prevents contract drift between API and frontends.
- **server/src/modules/:** NestJS module-per-domain pattern. Each module owns its controller, service, entities, and DTOs. Clear boundaries, easy to test in isolation.
- **server/src/jobs/:** Background processing separated from request handlers. PDF generation, SMS sending, and email delivery should never block API responses.

## Architectural Patterns

### Pattern 1: Modular Monolith (Backend)

**What:** A single NestJS application organized into well-bounded modules, each owning its domain (vehicles, rentals, contracts, notifications). Modules communicate through injected services, not HTTP calls.

**When to use:** Always for this project. With ~100 vehicles and ~10 employees, microservices would add operational complexity with zero benefit.

**Trade-offs:**
- Pro: Single deployment, simple debugging, shared database transactions
- Pro: Can extract modules into services later if needed (unlikely at this scale)
- Con: All modules share the same process -- a bug in notifications could theoretically affect rentals
- Mitigation: Use BullMQ for background jobs to isolate heavy work from the API process

### Pattern 2: Rental State Machine

**What:** Each rental follows a strict state machine: `draft -> active -> [extended] -> returned -> closed -> [disputed]`. State transitions are enforced in the service layer and logged in the audit trail.

**When to use:** Always. The rental lifecycle is the core business process. Free-form status updates lead to invalid states and data corruption.

**Trade-offs:**
- Pro: Prevents invalid transitions (cannot "return" a draft, cannot "extend" a closed rental)
- Pro: Audit trail captures every transition with timestamp and actor
- Con: Adding new states requires migration and careful testing

**Example:**
```typescript
// Allowed transitions map
const RENTAL_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  draft: ['active', 'cancelled'],
  active: ['extended', 'returned'],
  extended: ['returned'],
  returned: ['closed', 'disputed'],
  closed: [],
  cancelled: [],
  disputed: ['closed'],
};

// Service method
async transitionRental(id: string, newStatus: RentalStatus, actorId: string) {
  const rental = await this.rentalRepo.findOneOrFail(id);
  const allowed = RENTAL_TRANSITIONS[rental.status];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestException(
      `Cannot transition from ${rental.status} to ${newStatus}`
    );
  }
  rental.status = newStatus;
  await this.rentalRepo.save(rental);
  await this.auditService.log('rental.transition', { rentalId: id, from: rental.status, to: newStatus, actorId });
}
```

### Pattern 3: Presigned URL Upload (Photos)

**What:** Mobile app requests a presigned upload URL from the API, then uploads photos directly to object storage (S3/MinIO). The API only stores the metadata (URL, rental ID, timestamp, damage flag).

**When to use:** Always for photo uploads. Avoids routing large binary payloads through the API server.

**Trade-offs:**
- Pro: API server never handles photo bytes -- saves memory and bandwidth
- Pro: Works well offline (queue uploads, execute when connected)
- Con: Slightly more complex client-side logic
- Con: Requires object storage setup (MinIO for dev, S3 or compatible for production)

### Pattern 4: Background Job Queue for Notifications

**What:** SMS, email, and PDF generation are processed asynchronously via BullMQ (Redis-backed). API endpoints enqueue jobs and return immediately.

**When to use:** Always for PDF generation, SMS, and email. These involve external service calls that can fail or be slow.

**Trade-offs:**
- Pro: API responses remain fast
- Pro: Automatic retries with exponential backoff for failed SMS/email
- Pro: Job status tracking (useful for "PDF is generating..." UI feedback)
- Con: Redis dependency (minimal -- already useful for sessions)

## Data Flow

### Core Rental Flow (Employee in the field)

```
Employee opens mobile app
    |
    v
[Select/Create Customer] --> API: POST /customers or GET /customers/:id
    |
    v
[Verify Driver License] --> API: POST /cepik/verify --> CEPiK 2.0 API
    |                                                     (rate limited:
    v                                                      20/sec, 100/min)
[Select Vehicle] --> API: GET /vehicles?status=available
    |
    v
[Fill Contract Form] --> local state (dates, terms, customer, vehicle)
    |
    v
[Capture Signature] --> react-native-signature-canvas --> base64 PNG
    |
    v
[Take Photos] --> Camera API --> presigned URL --> S3/MinIO (direct upload)
    |
    v
[Submit Rental] --> API: POST /rentals
    |                  (creates rental + contract record in transaction)
    |
    v
[Generate PDF] --> BullMQ job --> pdf-lib (embed signature, photos, data)
    |                              --> S3 (store PDF)
    |
    v
[Send Contract] --> BullMQ job --> Nodemailer (PDF attachment to customer)
    |
    v
[Rental Active] --> Cron job watches return dates
                    --> BullMQ --> smsapi.pl (SMS reminder before due date)
```

### Admin Calendar & Extension Flow

```
Admin views calendar --> API: GET /rentals?from=X&to=Y
    |
    v
[Sees upcoming return] --> clicks "Extend"
    |
    v
[Set new end date] --> API: PATCH /rentals/:id/extend
    |                   (state: active -> extended, audit logged)
    |
    v
[Auto-notify customer] --> BullMQ --> smsapi.pl SMS
                           BullMQ --> email with updated dates
```

### Customer Portal Flow

```
Customer receives email with contract
    |
    v
[Clicks magic link] --> /portal?token=xyz123
    |                   (short-lived JWT, scoped to customer ID)
    v
[Views own rentals] --> API: GET /portal/rentals (token-scoped)
    |
    v
[Downloads PDF] --> presigned S3 URL (time-limited)
```

### Key Data Flows

1. **Contract creation flow:** Multi-step data collection on mobile -> single API transaction (rental + contract + photo metadata) -> async PDF generation -> async email delivery. The mobile app should be able to collect all data offline and submit when connected.

2. **Notification pipeline:** All notifications flow through BullMQ. A rental event (creation, extension, approaching return) triggers a job. The job processor selects the right channel (SMS via smsapi.pl, email via SMTP, push via FCM). Failed deliveries retry with backoff.

3. **Photo pipeline:** Mobile captures photo -> requests presigned URL from API -> uploads directly to object storage -> confirms upload to API with metadata. Photos are grouped by rental and tagged as "pre-rental", "post-rental", or "damage".

4. **Audit trail:** An NestJS interceptor automatically logs every mutating API call (POST, PUT, PATCH, DELETE) with: actor ID, action, entity type, entity ID, timestamp, and changed fields. Stored in a dedicated audit_logs table.

## Database Schema (Core Entities)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  employees  │     │   rentals    │     │  vehicles   │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ id          │──┐  │ id           │  ┌──│ id          │
│ name        │  │  │ customer_id  │──│  │ make        │
│ email       │  │  │ vehicle_id   │──┘  │ model       │
│ phone       │  └──│ employee_id  │     │ plate_number│
│ role        │     │ start_date   │     │ year        │
│ password_h  │     │ end_date     │     │ status      │
│ created_at  │     │ status       │     │ daily_rate  │
└─────────────┘     │ created_at   │     │ vin         │
                    │ updated_at   │     │ insurance_  │
┌─────────────┐     └──────┬───────┘     │   expiry    │
│  customers  │            │             │ mileage     │
├─────────────┤     ┌──────┴───────┐     └─────────────┘
│ id          │──┐  │  contracts   │
│ first_name  │  │  ├──────────────┤     ┌─────────────┐
│ last_name   │  │  │ id           │     │   photos    │
│ phone       │  │  │ rental_id    │     ├─────────────┤
│ email       │  │  │ template_ver │     │ id          │
│ address     │  │  │ data_json    │     │ rental_id   │
│ pesel       │  │  │ signature_url│     │ url         │
│ id_number   │  │  │ pdf_url      │     │ type (pre/  │
│ id_issuer   │  │  │ signed_at    │     │  post/dmg)  │
│ id_issued   │  │  │ created_at   │     │ annotation  │
│ license_num │  │  └──────────────┘     │ uploaded_at │
│ license_cat │  │                       │ uploaded_by │
│ license_doc │  │  ┌──────────────┐     └─────────────┘
│ license_iss │  │  │ audit_logs   │
│ created_at  │  │  ├──────────────┤     ┌──────────────┐
└─────────────┘  │  │ id           │     │ notifications│
                 │  │ actor_id     │     ├──────────────┤
                 │  │ action       │     │ id           │
                 │  │ entity_type  │     │ rental_id    │
                 │  │ entity_id    │     │ channel      │
                 │  │ changes_json │     │ type         │
                 │  │ ip_address   │     │ status       │
                 │  │ created_at   │     │ sent_at      │
                 │  └──────────────┘     │ error        │
                 │                       └──────────────┘
                 │
                 └── (customer_id FK on rentals table)
```

### Key Schema Decisions

- **contracts.data_json:** Store the full contract data as JSONB. The contract template may evolve, but historical contracts must preserve the exact data they were generated with. Do not reconstruct contracts from normalized data.
- **photos.url:** Store the S3/MinIO object key, not the full URL. Generate presigned URLs on demand.
- **audit_logs.changes_json:** JSONB column storing `{ field: { old: X, new: Y } }` diffs. Enables "who changed what when" queries.
- **rentals.status:** Enum column with state machine enforcement in application code (not DB triggers).
- **customers.pesel:** Sensitive data. Encrypt at rest. Consider column-level encryption with pgcrypto for PII fields (PESEL, ID number, license number).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (~100 vehicles, ~10 employees) | Single server monolith is perfect. PostgreSQL on same host or managed service. Redis for job queue. MinIO or S3 for photos. |
| 500 vehicles, 50 employees | Same architecture. Add read replicas for PostgreSQL if report queries slow down admin panel. CDN for photo delivery. |
| 2000+ vehicles, multi-location | Consider splitting into location-scoped tenants. Separate reporting database (replicated). Dedicated job worker process. Still a monolith. |

### Scaling Priorities

1. **First bottleneck: Photo storage bandwidth.** At 10-20 photos per rental, this accumulates. Presigned URL pattern means API server is unaffected, but storage costs and retrieval latency grow. Mitigation: lifecycle policies to move old photos to cheaper storage tiers after 1 year.

2. **Second bottleneck: PDF generation under load.** If multiple employees submit rentals simultaneously, PDF generation queue depth grows. Mitigation: BullMQ handles this naturally with configurable concurrency. At this scale, a single worker with concurrency=3 is sufficient.

3. **Not a bottleneck: Database.** With ~100 vehicles and ~10 concurrent users, PostgreSQL will never be stressed. Even naive queries will be fast. Optimize only when there is actual evidence of slowness.

## Anti-Patterns

### Anti-Pattern 1: Synchronous PDF Generation in API Response

**What people do:** Generate PDF in the same request that creates the rental, making the employee wait 3-10 seconds.
**Why it's wrong:** PDF generation involves template rendering, signature image embedding, and file upload. It is slow and can fail. The employee is standing with the customer in a parking lot.
**Do this instead:** Return the rental immediately, generate PDF in background, notify when ready. The mobile app shows "Contract is being generated..." and polls or uses a WebSocket for completion.

### Anti-Pattern 2: Storing Photos as BLOBs in PostgreSQL

**What people do:** Store photo binary data directly in the database.
**Why it's wrong:** Bloats the database, makes backups slow and expensive, kills query performance when the photos table is touched.
**Do this instead:** Use object storage (S3/MinIO). Store only the object key in the database. Generate presigned URLs for access.

### Anti-Pattern 3: Free-form Rental Status Updates

**What people do:** Allow setting any status string on a rental (`rental.status = 'whatever'`).
**Why it's wrong:** Leads to inconsistent data, broken business logic, and impossible-to-debug states. "Is this rental active or returned? The status says 'done'."
**Do this instead:** Enforce a state machine with explicit allowed transitions. Every transition is a named method (e.g., `extendRental()`, `returnRental()`) that validates preconditions.

### Anti-Pattern 4: Hardcoded Contract Template

**What people do:** Build the contract layout directly in code with string concatenation.
**Why it's wrong:** Contract templates change frequently (legal requirements, business terms). Developers should not be required for every text change.
**Do this instead:** Use a template system (Handlebars or similar) with the contract template stored as a versioned file or database record. Data is injected at render time. Old contracts reference their template version.

### Anti-Pattern 5: Coupling CEPiK Verification to Rental Creation

**What people do:** Make CEPiK verification a blocking step in the rental creation flow.
**Why it's wrong:** CEPiK API may be slow, rate-limited (20/sec, 100/min), or down. If verification fails, the employee cannot proceed with the rental at all.
**Do this instead:** Make CEPiK verification a separate, optional step. The employee can verify before creating the rental. If CEPiK is unavailable, allow creating the rental with a "verification_pending" flag and verify later. Log the verification result regardless.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| CEPiK 2.0 API | REST API via HTTPS with client certificate | Requires formal application (2-3 weeks), certificate issuance. Rate limited: 20 req/sec, 100 req/min. Test environment available. Documentation at api.cepik.gov.pl/doc. Input: name + license doc number. Apply as "Przewoznicy i posrednicy przy przewozie osob". |
| smsapi.pl | REST API with bearer token | Polish SMS provider. TLS 1.2 required. Rate limit: 100 req/sec per IP. Node.js SDK available. Simple integration: POST with phone number + message text. |
| Email (SMTP) | Nodemailer via SMTP or API (Mailgun/SendGrid) | For sending contracts as PDF attachments. Use a transactional email service rather than raw SMTP for deliverability. |
| Object Storage | S3-compatible API (AWS S3 or MinIO) | Presigned URLs for upload and download. MinIO for local dev (Docker), S3 or compatible (e.g., DigitalOcean Spaces) for production. |
| Push Notifications | FCM (Android) + APNs (iOS) via firebase-admin | For in-app alerts about upcoming returns, contract ready, etc. Expo Push Notifications simplifies this if using Expo. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Mobile App <-> API | REST over HTTPS + JWT | All business logic lives in the API. Mobile is a thin client. |
| Admin Panel <-> API | REST over HTTPS + JWT | Same API, different auth role. Admin endpoints require admin guard. |
| Customer Portal <-> API | REST over HTTPS + scoped JWT (magic link) | Minimal endpoints. Read-only access to own rentals. Token contains customer_id and expiry. |
| API <-> Job Queue | BullMQ (Redis) | API enqueues jobs (PDF gen, SMS, email). Workers process them. Same codebase, can run in same or separate process. |
| API <-> Database | TypeORM or Prisma | ORM for standard CRUD. Raw SQL for complex reporting queries if needed. |
| API <-> Object Storage | AWS SDK v3 | Presigned URL generation in API. Direct upload/download from clients. |

## Build Order (Dependency Chain)

The architecture dictates a natural build order based on dependencies:

```
Phase 1: Foundation
  ├── Database schema + migrations
  ├── Auth module (JWT, roles, guards)
  ├── Audit trail interceptor
  └── Basic API scaffolding (NestJS)

Phase 2: Core Domain
  ├── Vehicle CRUD (depends on: auth, DB)
  ├── Customer CRUD (depends on: auth, DB)
  └── Rental lifecycle + state machine (depends on: vehicles, customers)

Phase 3: Mobile App Shell
  ├── React Native project setup (Expo)
  ├── Auth flow (login screen -> JWT storage)
  └── Basic navigation + vehicle/customer list screens

Phase 4: Contract & Signature
  ├── Signature capture (mobile) (depends on: mobile shell)
  ├── Contract template system (depends on: rental lifecycle)
  ├── PDF generation via BullMQ (depends on: contract, job queue)
  └── Email delivery (depends on: PDF generation)

Phase 5: Photo System
  ├── Object storage setup (MinIO/S3)
  ├── Presigned URL endpoint (depends on: auth, storage)
  ├── Photo upload from mobile (depends on: mobile shell, storage)
  └── Photo viewer in admin panel

Phase 6: Notifications & Calendar
  ├── SMS integration (smsapi.pl) (depends on: job queue)
  ├── Calendar view in admin panel (depends on: rental data)
  ├── Return reminder cron jobs (depends on: SMS, rentals)
  └── Push notifications (depends on: mobile shell)

Phase 7: External Integrations & Polish
  ├── CEPiK 2.0 integration (depends on: API approval process - start early!)
  ├── Admin panel (full) (depends on: all backend modules)
  ├── Customer portal (depends on: contracts, auth)
  └── Rental extension flow with auto-notifications
```

**Critical path note:** CEPiK 2.0 API access requires a formal application and certificate issuance (2-3 weeks). Start the application process in Phase 1 even though integration happens in Phase 7. Build the verification module with a mock/stub first.

## Sources

- [CEPiK 2.0 API Documentation (Swagger)](https://api.cepik.gov.pl/doc)
- [CEPiK API Access Portal (gov.pl)](https://www.gov.pl/web/cepik/api-dla-centralnej-ewidencji-pojazdow-i-kierowcow-api-do-cepik)
- [CEPiK Certificate Requirements](https://www.gov.pl/web/cepik/certyfikaty-do-cepik-20)
- [SMSAPI Documentation](https://www.smsapi.com/docs)
- [Fleet Management Database Design (GeeksforGeeks)](https://www.geeksforgeeks.org/dbms/how-to-design-database-for-fleet-management-systems/)
- [Fleet Management System Design (Hicron)](https://hicronsoftware.com/blog/fleet-management-system-design/)
- [react-native-signature-canvas (npm)](https://www.npmjs.com/package/react-native-signature-canvas)
- [@signpdf/signpdf (npm)](https://www.npmjs.com/package/@signpdf/signpdf)
- [React Native Architecture Overview](https://reactnative.dev/architecture/overview)

---
*Architecture research for: Car Rental Management System (Polish market)*
*Researched: 2026-03-23*
