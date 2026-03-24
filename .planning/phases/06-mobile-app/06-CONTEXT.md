# Phase 6: Mobile App - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Cross-platform mobile app for field employees (Android + iOS) covering the complete rental workflow: login with biometric re-auth, customer lookup/creation, vehicle selection, contract filling with digital signature capture, rental submission, and vehicle return processing. This phase delivers the mobile frontend consuming the API built in Phases 1-4. Photo/damage documentation is Phase 7, notifications are Phase 8.

</domain>

<decisions>
## Implementation Decisions

### Framework & Stack
- **Expo SDK 52** with New Architecture (Fabric + TurboModules) enabled
- **Expo Router** (file-based routing) for navigation
- **NativeWind** (Tailwind CSS for React Native) for styling
- **TanStack Query** for server state (API calls, caching, refetch) + **Zustand** for local UI state (form drafts, navigation)
- **React Hook Form + Zod** for forms — reuses Zod schemas from `@rentapp/shared`
- **expo-secure-store** for JWT token storage (encrypted keychain/keystore)
- **react-native-signature-canvas** for signature capture (WebView-based, PNG output)
- **Jest + React Native Testing Library** for testing
- **Sentry** (sentry-expo) for crash reporting from day one
- Minimum OS: **iOS 15+ / Android 10+**

### Monorepo & Build
- Located at **`apps/mobile`** in the Turborepo monorepo
- **pnpm workspace** dependency on `@rentapp/shared` (direct workspace link)
- **EAS Build** from start — cloud builds for Android APK and iOS IPA
- **Internal distribution** via EAS (link/QR code) — no app store for ~10 employees
- **Environment-based config** via `app.config.ts` + EAS Build profiles (dev/staging/prod API URLs)

### Design & Branding
- **Light mode only** — internal tool, dark mode deferred
- **Clean & minimal** design — system fonts (SF Pro / Roboto), whites/grays, KITEK accent color
- **KITEK branding** on splash screen — but configurable for other brands in the future (multi-brand support planned)
- **i18n wired from start** — expo-localization + i18next, Polish as default. All strings in translation files.
- **Biometric authentication** (Face ID / fingerprint) for quick re-login after initial email/password login

### Navigation & Layout
- **Bottom tab bar** with tabs: Home (dashboard), + New Rental, Rentals list, Profile/Settings
- **Dashboard (Home tab):** Today's pickups, today's returns, active rental count, overdue alerts, quick-action buttons (New Rental, Quick Return), upcoming returns list
- **Rentals tab:** Filtered list with status badges (green/yellow/red), search by registration or customer name. Not a full calendar — calendar is admin territory (Phase 5)

### Rental Creation Flow
- **Step-by-step wizard** with progress indicator: 1) Select customer → 2) Select vehicle → 3) Set dates/pricing → 4) Review contract + RODO consent → 5) Signatures → Success
- **Customer search** in Step 1 with "Nowy klient" button opening a **modal/bottom sheet** for inline creation (doesn't break wizard flow)
- **Vehicle search** with availability filter — search by registration or make/model, only AVAILABLE vehicles shown by default
- **Auto-save draft** to device storage (Zustand persist) — employee can close app and resume wizard where they left off. Draft cleared on submission.

### Contract & Signature Flow
- **Contract preview** on screen before signing — scrollable read-only view of contract data. Customer reads what they're signing.
- **RODO consent checkbox** on preview screen — must be checked before "Podpisz" button enables. Timestamp recorded.
- **Full-screen landscape canvas** for each signature — device rotates, large signing area, Clear + Confirm buttons
- **4 signatures total** (matching paper template): Customer signs contract (page 1), Employee signs contract (page 1), Customer signs conditions (page 2), Employee signs conditions (page 2)
- **Separate screens** per signature — clear flow of who signs what
- **Fixed black pen** — standard stroke, no customization
- **Immediate upload** — each signature PNG uploaded to MinIO via API right after capture (retry with backoff on failure)
- **Success screen** after all signatures: "Umowa podpisana!", PDF sent confirmation, "Zobacz PDF" link (opens external), "Nowy wynajem" and "Powrót" buttons

### Vehicle Return Flow
- **Guided checklist wizard**: 1) Select active rental → 2) Enter return mileage (shows handover mileage for comparison) → 3) Damage checklist → 4) Notes → 5) Confirm return
- Progress indicator matching the rental creation wizard pattern

### Data & Connectivity
- **REST API** — uses existing endpoints from Phases 1-4 via TanStack Query
- **Graceful offline degradation** — cached data shown when offline, mutations blocked with "Brak połączenia" banner. Full offline queue is v2 (OFFL-01).
- **Automatic silent token refresh** — TanStack Query interceptor detects 401, refreshes via SecureStore token. Failed refresh → redirect to login.
- No in-app PDF viewing — contracts accessible via admin panel or customer email only

### Claude's Discretion
- Damage sketch groundwork for Phase 7 (stub screen in return wizard vs skip entirely)
- Push notification infrastructure (basic expo-notifications setup vs defer entirely to Phase 8)
- Exact bottom tab icons and naming
- Loading states and skeleton screens
- Error screen designs
- Pull-to-refresh behavior
- Date/time picker component choice

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Core value (field employee workflow), constraints (cross-platform, Polish UI, KITEK branding), customer data fields
- `.planning/REQUIREMENTS.md` — MOB-01, MOB-02, MOB-03 requirements with acceptance criteria; OFFL-01/OFFL-02 deferred to v2

### Contract & signature flow
- `.planning/phases/04-contract-and-pdf/04-CONTEXT.md` — Contract template structure, signature capture decisions (2 pages, both parties sign), PDF generation, RODO consent, auto-email
- `.planning/phases/04-contract-and-pdf/contract-template.pdf` — Original paper contract (2 pages) — signature locations and conditions layout

### Backend API (existing endpoints to consume)
- `apps/api/src/auth/` — JWT auth with refresh tokens, login, password reset
- `apps/api/src/customers/` — Customer CRUD, encrypted PII search via HMAC
- `apps/api/src/vehicles/` — Vehicle CRUD, status transitions, availability
- `apps/api/src/rentals/` — Rental CRUD, state machine, calendar, overlap detection, return/extend
- `apps/api/src/contracts/` — Contract creation, signature, PDF generation (Phase 4, in progress)

### Shared package
- `packages/shared/src/schemas/` — Zod schemas for auth, vehicle, customer, rental, contract (reuse in RHF forms)
- `packages/shared/src/types/` — TypeScript types for all domain entities

### Prior phase decisions
- `.planning/phases/01-foundation-and-auth/01-CONTEXT.md` — Auth flow, JWT refresh in Redis, account lockout
- `.planning/phases/03-rental-lifecycle/03-CONTEXT.md` — Rental state machine, pricing in grosze (net + 23% VAT), EventEmitter2

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@rentapp/shared` — Zod schemas + TypeScript types for all domain entities. Direct pnpm workspace dependency. Forms validate using same schemas as API.
- `apps/api/src/auth/` — JWT access + refresh token flow. Mobile app mirrors this: access token in memory, refresh in SecureStore.
- `apps/api/src/mail/mail.service.ts` — Email delivery. Mobile triggers server-side email via API, doesn't send directly.
- `apps/api/src/storage/storage.service.ts` — MinIO storage. Signature PNGs uploaded via multipart API to MinIO.

### Established Patterns
- **NestJS REST API** — All mobile endpoints already exist or will exist after Phase 4. Mobile is a pure consumer.
- **Turborepo monorepo** — `apps/api` + `packages/shared` + `packages/eslint-config`. Add `apps/mobile` following same pattern.
- **Zod validation** — Shared schemas validate on both client (RHF) and server (NestJS pipes). Single source of truth.
- **UUID primary keys** — All entities use UUIDs. Mobile stores/references by UUID.

### Integration Points
- `apps/mobile/` — New Expo app in monorepo
- `packages/shared/` — Direct workspace dependency for types and schemas
- `turbo.json` — Add mobile build/dev/lint/test tasks
- `package.json` (root) — Ensure pnpm workspace includes apps/mobile
- Backend API — All existing REST endpoints consumed via TanStack Query

</code_context>

<specifics>
## Specific Ideas

- KITEK branding on splash screen, but architecture allows swapping brand config for other rental companies in the future
- Wizard auto-saves draft to device — employee resumes after interruption (phone call, etc.)
- Customer modal within wizard — "Nowy klient" doesn't break the rental flow
- Dashboard shows "today's activity" — employee opens app and immediately sees what needs attention
- 4 signatures matching paper template — legally faithful to existing contract layout
- Full-screen landscape canvas for natural signing experience on phone/tablet
- RODO consent as explicit checkbox with timestamp before signature is allowed

</specifics>

<deferred>
## Deferred Ideas

- Full offline mode with mutation queue — v2 requirement (OFFL-01, OFFL-02)
- Dark mode — add later if employees request it
- In-app PDF viewer for contracts — web/email access sufficient for now
- Vehicle photos in vehicle selection grid — depends on Phase 7 photo infrastructure
- Push notifications — Phase 8 scope
- App Store / Play Store distribution — consider when scaling beyond internal use
- Multi-language support — v1 is Polish only, but i18n is wired for future expansion

</deferred>

---

*Phase: 06-mobile-app*
*Context gathered: 2026-03-24*
