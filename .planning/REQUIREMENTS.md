# Requirements: RentApp

**Defined:** 2026-03-27
**Milestone:** v2.1 — Fix All Audit Issues
**Core Value:** Pracownik w terenie może w pełni obsłużyć wynajem — od wypełnienia umowy, przez zweryfikowanie uprawnień kierowcy, zrobienie zdjęć auta, po podpis klienta i wysyłkę PDF — bez papieru i bez powrotu do biura.

## v2.1 Requirements

Requirements derived from comprehensive codebase audit across mobile, API, web, and infra. All 124 issues organized by domain and severity.

### Security

- [x] **SEC-01**: Portal JWT uses a dedicated secret (PORTAL_JWT_SECRET) separate from employee JWT
- [x] **SEC-02**: apps/api/.env is properly gitignored to prevent credential leaks
- [x] **SEC-03**: Company PII (name, address, phone) moved from hardcoded source to env vars
- [x] **SEC-04**: FIELD_ENCRYPTION_KEY placeholder in .env.example cannot be used as a valid key
- [x] **SEC-05**: signatureBase64 and damageSketchBase64 DTOs have @MaxLength limits
- [x] **SEC-06**: SMTP auth (MAIL_USER, MAIL_PASS) configured for production mail delivery
- [x] **SEC-07**: S3 credentials have no default values in source code (force env var config)
- [x] **SEC-08**: Portal token exchange endpoint has per-IP rate limiting
- [x] **SEC-09**: CSV export sanitizes formula injection characters (=, +, -, @)
- [x] **SEC-10**: Mobile PDF URL uses signed URL or blob download instead of unauthenticated link

### Mobile Bugs

- [x] **MBUG-01**: Rental creation is idempotent — duplicate tap does not create duplicate rental
- [x] **MBUG-02**: isSubmitting/isUploading flags are properly cleared in all code paths
- [x] **MBUG-03**: useEffect dependencies are correct in return wizard (mileage, checklist screens)
- [x] **MBUG-04**: SearchBar local state syncs when parent value prop changes
- [x] **MBUG-05**: Biometric logout awaits completion before setting isReady
- [x] **MBUG-06**: Return wizard navigation guard waits for Zustand hydration before firing
- [x] **MBUG-07**: ErrorBoundary retry increments key to force remount of child tree

### API Reliability

- [x] **AREL-01**: Contract number generation is atomic (no race condition on concurrent requests)
- [x] **AREL-02**: Notification create sets message in initial create (no two-step create+update)
- [x] **AREL-03**: RetentionService filters out customers with active rentals before deletion
- [x] **AREL-04**: processReturn re-fetch has null guard before non-null assertion
- [x] **AREL-05**: Photo upload creates DB record before S3 upload (or cleans up on failure)
- [x] **AREL-06**: replacePhoto uploads new files before deleting old ones
- [x] **AREL-07**: createAnnex uses single DB operation (not create-then-update pattern)
- [x] **AREL-08**: SmsService initializes SMSAPI client lazily (no crash when token missing in dev)

### API Validation & Pagination

- [x] **AVAL-01**: Server-side pagination on GET /rentals, GET /customers, GET /contracts
- [x] **AVAL-02**: ParseUUIDPipe on all :id params (portal rental, users PATCH, users reset-password)
- [x] **AVAL-03**: CalendarQueryDto validates from < to and max range (6 months)
- [x] **AVAL-04**: CreateRentalDto validates startDate < endDate
- [x] **AVAL-05**: CreateVehicleDto fields have @MaxLength constraints
- [x] **AVAL-06**: UploadPhotoDto.position has @MaxLength(50)
- [x] **AVAL-07**: NotificationQueryDto.isRead validates as 'true'|'false'
- [x] **AVAL-08**: Notification route order: markAllAsRead before parameterized markAsRead

### API Performance & Logging

- [x] **APERF-01**: importFleet pre-fetches registrations in bulk (no N+1 DB queries in loop)
- [x] **APERF-02**: Photo comparison uses Promise.all for presigned URL generation
- [x] **APERF-03**: enqueueExpiryAlert uses createMany for batch notifications
- [x] **APERF-04**: AuditInterceptor uses NestJS Logger instead of console.error
- [x] **APERF-05**: AuthService logs security events (failed login, lockout, token reuse)
- [x] **APERF-06**: AuthService Redis client has error event handler
- [x] **APERF-07**: Health endpoint uses $queryRaw tagged template instead of $queryRawUnsafe
- [x] **APERF-08**: getWarsawDateRange uses proper timezone-aware date calculation
- [x] **APERF-09**: Annex PDF uses rental vatRate instead of hardcoded 23%

### Mobile State & Navigation

- [x] **MSTATE-01**: rentalId, contractId, currentIndex persisted in draft store (survive backgrounding)
- [x] **MSTATE-02**: Draft step routing includes photos step (step 4 → photos, step 5 → signatures)
- [x] **MSTATE-03**: logout() clears biometricEnabled from memory state
- [x] **MNAV-01**: beforeRemove discard dialog intercepts all wizard steps, not just the first
- [x] **MNAV-02**: Return submission uses router.replace instead of router.dismissAll
- [x] **MNAV-03**: overrideConflict defaults to false; user prompted on conflict before override

### Mobile Validation & Error Handling

- [x] **MVAL-01**: Daily rate field has Zod regex validation for numeric format
- [x] **MVAL-02**: Return mileage has upper bound check for implausible values
- [x] **MVAL-03**: getMe() distinguishes network error from 401 before clearing tokens
- [x] **MVAL-04**: Return submit has retry configuration (retry: 2)
- [x] **MVAL-05**: Photo upload tracks partial failures and allows individual retry

### Mobile UX

- [x] **MUX-01**: Bottom bar buttons use safe area insets instead of hardcoded paddingBottom
- [x] **MUX-02**: SignatureScreen shows toast feedback on empty canvas confirm
- [x] **MUX-03**: Polish diacritics are correct in all checklist labels and i18n strings
- [x] **MUX-04**: WIZARD_LABELS extracted to shared constant (not duplicated per step file)
- [x] **MUX-05**: VAT rate extracted to constant DEFAULT_VAT_RATE (not hardcoded 23 in 4 places)
- [x] **MUX-06**: Magic numbers extracted to named constants (ONE_DAY_MS, UPCOMING_RETURN_THRESHOLD)
- [x] **MUX-07**: OfflineBanner rendered inside SafeAreaView to avoid status bar overlap

### Mobile Accessibility

- [x] **MA11Y-01**: Filter chips have accessibilityRole="radio" and accessibilityState
- [x] **MA11Y-02**: SearchBar TextInput has accessibilityLabel
- [x] **MA11Y-03**: AppInput label linked to TextInput via nativeID/accessibilityLabelledBy
- [x] **MA11Y-04**: Dashboard stat cards have combined accessibilityLabel

### Web Error Handling

- [ ] **WERR-01**: All detail pages (vehicle, customer, rental, contract) handle isError with retry
- [ ] **WERR-02**: Photo documentation page handles isError for photo and damage queries
- [ ] **WERR-03**: createRental.mutateAsync wrapped in try/catch in submit handler
- [ ] **WERR-04**: Portal auth catch blocks log errors instead of swallowing silently
- [ ] **WERR-05**: Proxy route handles non-JSON backend responses gracefully
- [ ] **WERR-06**: formatDate/formatDateTime handle null/invalid dates without throwing
- [ ] **WERR-07**: Global ErrorBoundary added (Next.js global-error.tsx)

### Web Form Validation

- [ ] **WVAL-01**: dailyRateNet is required (not optional) in new rental form
- [ ] **WVAL-02**: Extend rental dialog validates new end date > current end date
- [ ] **WVAL-03**: Return mileage validates against vehicle current mileage minimum
- [ ] **WVAL-04**: Edit user dialog validates name and role before save
- [ ] **WVAL-05**: Numeric inputs (year, seats, mileage) show validation error for 0 values

### Web Accessibility

- [ ] **WA11Y-01**: Interactive divs have role="button", tabIndex, and onKeyDown handlers
- [ ] **WA11Y-02**: Collapsible card headers have role="button", aria-expanded, keyboard support
- [ ] **WA11Y-03**: Filter bar labels properly associated with Select components via aria
- [ ] **WA11Y-04**: Calendar rental blocks are keyboard accessible
- [ ] **WA11Y-05**: Logout button has aria-label
- [ ] **WA11Y-06**: Customer search dropdown uses combobox pattern with aria attributes
- [ ] **WA11Y-07**: Vehicle search input has accessible label
- [ ] **WA11Y-08**: Damage SVG pins are keyboard-focusable for tooltip access

### Web UI Consistency

- [ ] **WUI-01**: statusConfig, InfoRow, fuelTypeOptions extracted to shared files (no duplication)
- [ ] **WUI-02**: Shared ErrorState and EmptyState components replace inline patterns
- [ ] **WUI-03**: getInitials utility extracted to shared lib (not duplicated)
- [ ] **WUI-04**: Portal uses theme-aware colors (bg-background) instead of hardcoded slate
- [ ] **WUI-05**: Users page creation uses mutation hook with query invalidation

### Web State & Performance

- [ ] **WPERF-01**: Pagination resets to page 0 when filter changes (rentals, contracts)
- [ ] **WPERF-02**: device_id cookie refreshed during token rotation
- [ ] **WPERF-03**: Portal auth state shared via React Query (not re-fetched on every mount)
- [ ] **WPERF-04**: Sidebar localStorage read in useState initializer (no flash)

### Web Responsive Design

- [ ] **WRESP-01**: Vehicle and rental detail action buttons wrap on small screens
- [ ] **WRESP-02**: Audit trail table has overflow-x-auto for horizontal scroll
- [ ] **WRESP-03**: Filter bar inputs use responsive widths (w-full sm:w-auto)

### Infrastructure CI/CD

- [ ] **CICD-01**: Redis service added to CI workflow
- [ ] **CICD-02**: prisma migrate deploy runs in deployment pipeline (Dockerfile or railway.toml)
- [ ] **CICD-03**: Web service has railway.toml with health check
- [ ] **CICD-04**: deploy-web.yml has post-deploy health check step
- [ ] **CICD-05**: Puppeteer Chromium installed in API Docker production image
- [ ] **CICD-06**: Deploy health check uses polling loop instead of sleep 30
- [ ] **CICD-07**: Mobile app included in CI (typecheck + test)
- [ ] **CICD-08**: E2E tests run in CI pipeline
- [ ] **CICD-09**: Coverage threshold enforced in CI

### Infrastructure Config & Dependencies

- [ ] **ICONF-01**: Unused dependencies removed (bullmq, @nestjs/cli in web, @gorhom/bottom-sheet, tailwindcss in mobile)
- [ ] **ICONF-02**: zod and typescript versions aligned across all packages
- [ ] **ICONF-03**: CORS_ORIGINS, COMPANY_PHONE, APP_URL added to .env.example with docs
- [ ] **ICONF-04**: apps/web has .env.example documenting API_URL
- [ ] **ICONF-05**: Root and API .env.example consolidated (single source of truth)
- [ ] **ICONF-06**: Docker images pinned to specific versions (MinIO, Mailpit)
- [ ] **ICONF-07**: MinIO has health check in docker-compose.yml
- [ ] **ICONF-08**: tsconfig.base.json copied in both Dockerfiles
- [ ] **ICONF-09**: turbo.json has outputs for lint/test tasks and typecheck task defined

### Code Quality

- [ ] **QUAL-01**: TypeScript 'any' types replaced with proper types across API services
- [ ] **QUAL-02**: Non-null assertions have proper null guards
- [ ] **QUAL-03**: Dead code removed (unused imports, unused DB fields documented, unused exports)
- [ ] **QUAL-04**: Shared package exports PaginatedResponse, AuditLogDto types
- [ ] **QUAL-05**: Photo Zod schemas moved from types/ to schemas/ directory
- [ ] **QUAL-06**: RentalWithRelations type defined once in shared package (not duplicated)
- [ ] **QUAL-07**: Web unsafe 'as' casts on form submits replaced with proper typing
- [ ] **QUAL-08**: HealthModule has explicit dependency imports
- [ ] **QUAL-09**: FIELD_ENCRYPTION_KEY required in all environments (with dev fallback warning)
- [ ] **QUAL-10**: Missing database indexes added (Contract.createdById, CepikVerification.status, Notification.createdAt)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side search on web list pages | Performance optimization deferred — client-side adequate for current scale (~100 vehicles, ~1000 rentals) |
| Sentry initialization in mobile | Requires SENTRY_DSN from Sentry account — setup deferred to production deployment |
| EAS project UUID | Requires expo.dev account setup — deferred to production deployment |
| Mobile NativeWind integration | Blocked by SDK 54 compatibility — revisit in future version |
| i18n infrastructure overhaul | Current hardcoded Polish strings work for single-language deployment |
| Full test coverage (>60%) | Incremental improvement — this milestone focuses on fixing bugs, not writing comprehensive tests |
| Dark/light mode toggle for web | Intentional product decision to use dark mode only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 20 | Complete |
| SEC-02 | Phase 20 | Complete |
| SEC-03 | Phase 20 | Complete |
| SEC-04 | Phase 20 | Complete |
| SEC-05 | Phase 20 | Complete |
| SEC-06 | Phase 20 | Complete |
| SEC-07 | Phase 20 | Complete |
| SEC-08 | Phase 20 | Complete |
| SEC-09 | Phase 20 | Complete |
| SEC-10 | Phase 20 | Complete |
| MBUG-01 | Phase 21 | Complete |
| MBUG-02 | Phase 21 | Complete |
| MBUG-03 | Phase 21 | Complete |
| MBUG-04 | Phase 21 | Complete |
| MBUG-05 | Phase 21 | Complete |
| MBUG-06 | Phase 21 | Complete |
| MBUG-07 | Phase 21 | Complete |
| AREL-01 | Phase 21 | Complete |
| AREL-02 | Phase 21 | Complete |
| AREL-03 | Phase 21 | Complete |
| AREL-04 | Phase 21 | Complete |
| AREL-05 | Phase 21 | Complete |
| AREL-06 | Phase 21 | Complete |
| AREL-07 | Phase 21 | Complete |
| AREL-08 | Phase 21 | Complete |
| AVAL-01 | Phase 22 | Complete |
| AVAL-02 | Phase 22 | Complete |
| AVAL-03 | Phase 22 | Complete |
| AVAL-04 | Phase 22 | Complete |
| AVAL-05 | Phase 22 | Complete |
| AVAL-06 | Phase 22 | Complete |
| AVAL-07 | Phase 22 | Complete |
| AVAL-08 | Phase 22 | Complete |
| APERF-01 | Phase 22 | Complete |
| APERF-02 | Phase 22 | Complete |
| APERF-03 | Phase 22 | Complete |
| APERF-04 | Phase 22 | Complete |
| APERF-05 | Phase 22 | Complete |
| APERF-06 | Phase 22 | Complete |
| APERF-07 | Phase 22 | Complete |
| APERF-08 | Phase 22 | Complete |
| APERF-09 | Phase 22 | Complete |
| MSTATE-01 | Phase 23 | Complete |
| MSTATE-02 | Phase 23 | Complete |
| MSTATE-03 | Phase 23 | Complete |
| MNAV-01 | Phase 23 | Complete |
| MNAV-02 | Phase 23 | Complete |
| MNAV-03 | Phase 23 | Complete |
| MVAL-01 | Phase 23 | Complete |
| MVAL-02 | Phase 23 | Complete |
| MVAL-03 | Phase 23 | Complete |
| MVAL-04 | Phase 23 | Complete |
| MVAL-05 | Phase 23 | Complete |
| MUX-01 | Phase 23 | Complete |
| MUX-02 | Phase 23 | Complete |
| MUX-03 | Phase 23 | Complete |
| MUX-04 | Phase 23 | Complete |
| MUX-05 | Phase 23 | Complete |
| MUX-06 | Phase 23 | Complete |
| MUX-07 | Phase 23 | Complete |
| MA11Y-01 | Phase 23 | Complete |
| MA11Y-02 | Phase 23 | Complete |
| MA11Y-03 | Phase 23 | Complete |
| MA11Y-04 | Phase 23 | Complete |
| WERR-01 | Phase 24 | Pending |
| WERR-02 | Phase 24 | Pending |
| WERR-03 | Phase 24 | Pending |
| WERR-04 | Phase 24 | Pending |
| WERR-05 | Phase 24 | Pending |
| WERR-06 | Phase 24 | Pending |
| WERR-07 | Phase 24 | Pending |
| WVAL-01 | Phase 24 | Pending |
| WVAL-02 | Phase 24 | Pending |
| WVAL-03 | Phase 24 | Pending |
| WVAL-04 | Phase 24 | Pending |
| WVAL-05 | Phase 24 | Pending |
| WA11Y-01 | Phase 24 | Pending |
| WA11Y-02 | Phase 24 | Pending |
| WA11Y-03 | Phase 24 | Pending |
| WA11Y-04 | Phase 24 | Pending |
| WA11Y-05 | Phase 24 | Pending |
| WA11Y-06 | Phase 24 | Pending |
| WA11Y-07 | Phase 24 | Pending |
| WA11Y-08 | Phase 24 | Pending |
| WUI-01 | Phase 24 | Pending |
| WUI-02 | Phase 24 | Pending |
| WUI-03 | Phase 24 | Pending |
| WUI-04 | Phase 24 | Pending |
| WUI-05 | Phase 24 | Pending |
| WPERF-01 | Phase 24 | Pending |
| WPERF-02 | Phase 24 | Pending |
| WPERF-03 | Phase 24 | Pending |
| WPERF-04 | Phase 24 | Pending |
| WRESP-01 | Phase 24 | Pending |
| WRESP-02 | Phase 24 | Pending |
| WRESP-03 | Phase 24 | Pending |
| CICD-01 | Phase 25 | Pending |
| CICD-02 | Phase 25 | Pending |
| CICD-03 | Phase 25 | Pending |
| CICD-04 | Phase 25 | Pending |
| CICD-05 | Phase 25 | Pending |
| CICD-06 | Phase 25 | Pending |
| CICD-07 | Phase 25 | Pending |
| CICD-08 | Phase 25 | Pending |
| CICD-09 | Phase 25 | Pending |
| ICONF-01 | Phase 25 | Pending |
| ICONF-02 | Phase 25 | Pending |
| ICONF-03 | Phase 25 | Pending |
| ICONF-04 | Phase 25 | Pending |
| ICONF-05 | Phase 25 | Pending |
| ICONF-06 | Phase 25 | Pending |
| ICONF-07 | Phase 25 | Pending |
| ICONF-08 | Phase 25 | Pending |
| ICONF-09 | Phase 25 | Pending |
| QUAL-01 | Phase 26 | Pending |
| QUAL-02 | Phase 26 | Pending |
| QUAL-03 | Phase 26 | Pending |
| QUAL-04 | Phase 26 | Pending |
| QUAL-05 | Phase 26 | Pending |
| QUAL-06 | Phase 26 | Pending |
| QUAL-07 | Phase 26 | Pending |
| QUAL-08 | Phase 26 | Pending |
| QUAL-09 | Phase 26 | Pending |
| QUAL-10 | Phase 26 | Pending |

**Coverage:**
- v2.1 requirements: 124 total
- Mapped to phases: 124
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after roadmap creation*
