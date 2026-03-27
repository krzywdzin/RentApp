# Infrastructure & Configuration Audit

**Analysis Date:** 2026-03-27
**Scope:** Shared packages, Docker, CI/CD, deployment config, env management, monorepo config

---

## CRITICAL (Security / Data Loss Risk)

### [SEC-1] `apps/api/.env` Contains Live Production Credentials — Not Gitignored

- **File:** `apps/api/.env`
- **Issue:** The file contains a real Neon PostgreSQL connection string and a real Upstash Redis TLS URL (confirmed in git status as untracked, but the root `.gitignore` only ignores `.env` at root, not `apps/api/.env`). There is no `apps/api/.gitignore`. If this file is ever staged and committed (e.g., by `git add -A`), live production credentials will be in history.
- **Root `.gitignore` line 4:** Only ignores `.env` at the repo root, not workspace-level `.env` files.
- **Impact:** Credential leak to any developer with repo access or public history.
- **Fix:** Add `apps/api/.env` to root `.gitignore` OR create `apps/api/.gitignore` with `.env`. Rotate credentials immediately if they have ever been committed.

### [SEC-2] Portal JWT Reuses Main Access JWT Secret

- **File:** `apps/api/src/portal/strategies/portal-jwt.strategy.ts`, line 12
- **Issue:** `PortalJwtStrategy` uses `JWT_ACCESS_SECRET` (the same secret as the main user auth strategy) to sign/validate portal tokens. The only guard against privilege escalation is a `payload.type !== 'portal'` check. A compromised or brute-forced main JWT secret allows portal impersonation and vice versa.
- **Fix:** Introduce a dedicated `PORTAL_JWT_SECRET` env var. Add it to `.env.example` and `env.validation.ts` production requirements.

### [SEC-3] Company Details Hard-Coded in Business Logic

- **File:** `apps/api/src/contracts/contracts.service.ts`, lines 101–106
- **Issue:** Company name (`'KITEK'`), owner name (`'Pawel Romanowski'`), address, and phone number are string literals inside `buildFrozenData()`. Any change to the company requires a code change and redeployment. These belong in environment config or a database settings table.
- **Fix:** Move to env vars (`COMPANY_NAME`, `COMPANY_OWNER`, `COMPANY_ADDRESS`, `COMPANY_PHONE`) and add to `.env.example`.

### [SEC-4] `FIELD_ENCRYPTION_KEY` All-Zeros Placeholder in `.env.example`

- **File:** `apps/api/.env.example`, line 12; root `.env.example`, line 9
- **Issue:** `FIELD_ENCRYPTION_KEY=0000...0000` (64 zeroes). If a developer copies this directly without changing it, all encrypted PII fields (PESEL, ID number, license number) in production will be encrypted with a known-zero key, making them trivially decryptable.
- **Fix:** Use a placeholder that cannot be valid, e.g., `FIELD_ENCRYPTION_KEY=REPLACE_WITH_64_HEX_CHARS_openssl_rand_-hex_32`.

---

## HIGH (Production Reliability)

### [INFRA-1] No Redis Service Container in CI — Tests Use `REDIS_URL` That Points Nowhere

- **File:** `.github/workflows/ci.yml`, line 38
- **Issue:** `REDIS_URL: redis://localhost:6379` is set as an env var but there is no `redis:` entry under `services:`. The postgres service is correctly provisioned (lines 19–32) but Redis is not. Any test that touches Bull queues or the notification stack will fail or silently skip when run in CI. The `BullModule.forRootAsync` call in `app.module.ts` (line 45) will attempt to connect to a non-existent Redis and may crash module initialization.
- **Fix:** Add a Redis service block under `jobs.lint-and-test.services` in `ci.yml`, mirroring the Postgres block.

```yaml
redis:
  image: redis:7-alpine
  ports:
    - 6379:6379
  options: >-
    --health-cmd "redis-cli ping"
    --health-interval 10s
    --health-timeout 5s
    --health-retries 5
```

### [INFRA-2] No Database Migration Step in Deployment Pipeline

- **File:** `.github/workflows/deploy-api.yml` (entire file); `apps/api/Dockerfile` (entire file)
- **Issue:** Neither the Railway deploy workflow nor the Docker CMD runs `prisma migrate deploy`. The Dockerfile copies the `prisma/` folder (line 32) and runs `prisma generate` (line 20) but never runs migrations. `PrismaService.onModuleInit()` only calls `$connect()`. If the schema changes, the running app will fail with Prisma P2025/column errors until migrations are run manually.
- **Fix:** Add a migration step before application startup. Options:
  - In `Dockerfile` CMD: `CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]`
  - Or as a Railway pre-deploy command in `railway.toml`: `[deploy] startCommand = "npx prisma migrate deploy && node dist/main.js"`

### [INFRA-3] No `railway.toml` for Web Service — No Health Check Configured

- **File:** `apps/web/` (missing `railway.toml`)
- **Issue:** The API has `apps/api/railway.toml` with `healthcheckPath`, timeout, and restart policy. The web (Next.js) service has no `railway.toml` at all. Railway will use generic defaults — no health check endpoint, no restart policy on failure, no explicit Dockerfile path.
- **Fix:** Create `apps/web/railway.toml`:
```toml
[build]
builder = "dockerfile"
dockerfilePath = "apps/web/Dockerfile"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
```
Add a `/api/health` route to the Next.js app.

### [INFRA-4] `deploy-web.yml` Has No Health Check Step

- **File:** `.github/workflows/deploy-web.yml` (entire file — 32 lines)
- **Issue:** The web deploy workflow deploys to Railway and ends immediately. Unlike the API workflow (which at least attempts a health check after `sleep 30`), the web workflow has no post-deploy verification step. A broken deployment will not be detected.
- **Fix:** Add a health check step mirroring `deploy-api.yml` lines 33–49, using `WEB_URL` variable.

### [INFRA-5] Puppeteer Chromium Not Installed in API Docker Production Image

- **File:** `apps/api/Dockerfile`
- **Issue:** The production image is based on `node:20-alpine`. Puppeteer downloads Chromium at install time, but it downloads to the build stage's layer. The production image (`FROM node:20-alpine AS production`) copies only `dist/`, `node_modules/`, `prisma/`, and `packages/shared/dist/`. It does NOT copy the Puppeteer Chromium cache (typically at `/root/.cache/puppeteer` or `node_modules/.cache`). The PDF service (`pdf.service.ts` line 47) calls `puppeteer.launch()` at module init which will fail immediately in production.
- **Fix:** Either:
  1. Install Chromium system package: `RUN apk add --no-cache chromium` in the production stage and set `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`
  2. Copy the Puppeteer cache from build: `COPY --from=build /root/.cache/puppeteer /root/.cache/puppeteer`
  - Additionally, `--no-sandbox` is already passed in `pdf.service.ts` line 49 (required for Alpine/Docker), which is correct.

### [INFRA-6] `sleep 30` Hard-Coded in API Deploy Health Check

- **File:** `.github/workflows/deploy-api.yml`, line 34
- **Issue:** `run: sleep 30` unconditionally blocks the deploy workflow for 30 seconds regardless of whether the service is up. This is fragile (too short for cold starts, too long for fast ones) and wastes CI minutes.
- **Fix:** Replace with a polling loop:
```bash
for i in $(seq 1 10); do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' "${API_URL}/health" || echo "000")
  [ "$STATUS" = "200" ] && echo "Health check passed" && exit 0
  echo "Attempt $i: status $STATUS — retrying in 10s"
  sleep 10
done
echo "Health check failed after retries"
```

### [INFRA-7] SMTP Authentication Not Configured for Production Mail

- **File:** `apps/api/src/mail/mail.service.ts`, lines 10–14; `apps/api/.env.example`, lines 14–16
- **Issue:** The Nodemailer transporter is created with only `host`, `port`, and `secure: false`. No `auth: { user, pass }` is configured. Production SMTP providers (SMTP2GO, SendGrid, Mailgun, etc.) require authentication. The `.env.example` also has no `MAIL_USER` or `MAIL_PASS` entries.
- **Fix:** Add `MAIL_USER` and `MAIL_PASS` env vars. Update `MailService` constructor to pass `auth` when both are set. Add to `.env.example` and `env.validation.ts` production requirements.

---

## MEDIUM (Correctness / Developer Experience)

### [DEP-1] Both `bull` and `bullmq` Are Runtime Dependencies — Only `bull` Is Used

- **File:** `apps/api/package.json`, lines 32 (`bullmq: ^5.0.0`) and the entire notifications subsystem
- **Issue:** `bullmq` appears in `dependencies` but is never imported in source code. All queue usage imports from `@nestjs/bull` and `bull` (v4). `bullmq` is a different major library with a different API (`@nestjs/bullmq` is the NestJS adapter, which is also not installed). This dead dependency adds ~2MB to every Docker image.
- **Fix:** Remove `bullmq` from `apps/api/package.json` dependencies.

### [DEP-2] `@nestjs/cli` in `apps/web` devDependencies — Wrong Package

- **File:** `apps/web/package.json`, line 47
- **Issue:** `"@nestjs/cli": "^11.0.0"` is in the web app's devDependencies. The web is a Next.js app and has no use for the NestJS CLI. This is almost certainly a copy-paste error from the API package.json.
- **Fix:** Remove `@nestjs/cli` from `apps/web/package.json` devDependencies.

### [DEP-3] `zod` Version Inconsistency Across Packages

- **Files:**
  - `packages/shared/package.json`, line 12: `"zod": "^3.24.0"`
  - `apps/mobile/package.json`, line 51: `"zod": "^3.24.0"`
  - `apps/web/package.json`, line 44: `"zod": "^3.25.76"` (higher patch)
- **Issue:** Web uses a newer zod version than shared. While semver allows this, it can lead to subtle divergence in validation behaviour between web (which uses zod directly) and shared schemas (which may resolve to a slightly older version if pnpm deduplication doesn't collapse them).
- **Fix:** Align all to `"^3.25.76"` or add `zod` to `pnpm.overrides` in root `package.json`.

### [DEP-4] `typescript` Version Inconsistency

- **Files:**
  - `apps/web/package.json`, line 59: `"typescript": "^5.8.0"`
  - `apps/api/package.json`, line 72: `"typescript": "^5.9.0"`
  - `apps/mobile/package.json`, line 62: `"typescript": "^5.9.0"`
  - `packages/shared/package.json`, line 15: `"typescript": "^5.9.0"`
- **Issue:** Web is on `^5.8.0` while the rest of the monorepo is on `^5.9.0`. This can cause type-checking divergence when shared types use features stabilised in 5.9.
- **Fix:** Pin web to `^5.9.0` to match the monorepo.

### [DEP-5] `tailwindcss: ^3.4.0` in Mobile Without `nativewind`

- **File:** `apps/mobile/package.json`, line 61
- **Issue:** Tailwind CSS v3 is listed as a devDependency in the mobile app, but `nativewind` (the React Native Tailwind adapter) is not installed as a dependency. The root layout (`app/_layout.tsx`) has a commented-out `import '../global.css'` with the note "NativeWind disabled for SDK 54 compatibility". The tailwind devDependency is therefore unused dead weight.
- **Fix:** Either remove `tailwindcss` from mobile devDependencies, or properly integrate NativeWind when SDK 54 support is confirmed.

### [ENV-1] `CORS_ORIGINS` Not in `.env.example`

- **Files:** `apps/api/src/common/env.validation.ts`, line 29; `apps/api/.env.example` (missing)
- **Issue:** `CORS_ORIGINS` is silently defaulted to `http://localhost:3001` in env validation. In production, this must be set to the actual web domain (e.g., `https://app.kitek.pl`). Because it's not in `.env.example`, operators may never know to set it and end up with a broken CORS policy in production.
- **Fix:** Add `CORS_ORIGINS=http://localhost:3001` to `apps/api/.env.example` with a comment explaining production usage.

### [ENV-2] `apps/web` Has No `.env.example` Despite Requiring `API_URL`

- **Files:** `apps/web/src/app/api/[...path]/route.ts`, line 3; `apps/web/src/app/api/auth/login/route.ts`, line 3 (and 4 other route files)
- **Issue:** All web API proxy routes read `process.env.API_URL` at runtime. This variable has no `.env.example`, no documentation, and no validation. A developer setting up the web app for the first time will not know they need `API_URL=http://localhost:3000`.
- **Fix:** Create `apps/web/.env.example`:
```
API_URL=http://localhost:3000
```

### [ENV-3] `COMPANY_PHONE` Referenced in Code But Missing from `.env.example`

- **File:** `apps/api/src/notifications/notifications.service.ts`, line 43
- **Issue:** `this.config.get<string>('COMPANY_PHONE', '+48 500 000 000')` has a placeholder default. The real company phone number belongs in configuration, not a hardcoded default that will silently be sent in SMS notifications if the env var is absent.
- **Fix:** Add `COMPANY_PHONE=+48XXXXXXXXX` to `apps/api/.env.example` and `env.validation.ts` production requirements.

### [ENV-4] Root `.env.example` and `apps/api/.env.example` Are Duplicated and Drift

- **Files:** `.env.example` (root); `apps/api/.env.example`
- **Issue:** Both files exist with the same purpose (documenting API env vars) but have diverged. Root `.env.example` uses `S3_REGION=us-east-1`; API `.env.example` uses `S3_REGION=auto`. Root has `APP_URL` without `PORT`; API has both. This confuses which file is authoritative.
- **Fix:** Either: (a) delete root `.env.example` and make `apps/api/.env.example` the only source of truth; or (b) make root the canonical file and have API `.env.example` extend/reference it.

### [DOCKER-1] `docker-compose.yml` Uses `minio/minio:latest` and `axllent/mailpit:latest`

- **File:** `docker-compose.yml`, lines 29 and 41
- **Issue:** Pinned image versions for postgres (`16-alpine`) and redis (`7-alpine`) but `latest` for MinIO and Mailpit. Unpinned `latest` tags can silently pull breaking API changes during `docker compose pull`.
- **Fix:** Pin to specific versions, e.g., `minio/minio:RELEASE.2025-01-20T14-49-07Z` and `axllent/mailpit:v1.21`.

### [DOCKER-2] `docker-compose.yml` MinIO Has No Health Check

- **File:** `docker-compose.yml`, lines 28–38
- **Issue:** Postgres and Redis both have `healthcheck` stanzas. MinIO has none. Any `depends_on: condition: service_healthy` referencing MinIO would fail silently because MinIO is never marked healthy.
- **Fix:** Add:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### [DOCKER-3] `docker-compose.yml` Has No `api` or `web` Service

- **File:** `docker-compose.yml` (entire file)
- **Issue:** The compose file only defines infrastructure services (postgres, redis, minio, mailpit). There is no `api` or `web` service definition. A developer cannot run the full stack with a single `docker compose up`. The intended workflow is to run services separately (e.g., `pnpm dev`), which is reasonable but undocumented.
- **Fix:** Either document this as intentional (infrastructure-only compose) in a README, or add `api` and `web` service definitions for production-like local testing.

### [DOCKER-4] API Dockerfile Does Not Copy `tsconfig.base.json`

- **File:** `apps/api/Dockerfile`, line 18
- **Issue:** Line 18 copies `package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json` but `apps/api/tsconfig.json` extends `../../tsconfig.base.json` (i.e., the root `tsconfig.base.json`). The root `tsconfig.json` file does not exist — only `tsconfig.base.json` does. This means the copy of `tsconfig.json` on line 18 copies a non-existent file (which would silently succeed in Docker), and `tsconfig.base.json` is never copied. The same applies to `apps/web/Dockerfile`.
- **Actual situation:** The build step works because `pnpm --filter @rentapp/api build` uses `nest-cli.json` which uses the API's own `tsconfig.json`, which resolves `../../tsconfig.base.json` relative to the WORKDIR. But `tsconfig.base.json` is never explicitly copied — it only works if pnpm hoists it in the workspace or if the current build happens to have it.
- **Fix:** Add `COPY tsconfig.base.json ./` to the build stage in both Dockerfiles.

### [CI-1] Mobile App Excluded from CI (No Lint, Typecheck, or Test)

- **File:** `.github/workflows/ci.yml` (entire file)
- **Issue:** CI only runs lint, typecheck, and tests for `@rentapp/api` and `web`. The `@rentapp/mobile` app is entirely absent from CI. TypeScript errors, failing tests, and lint violations in the mobile app will never be caught automatically.
- **Fix:** Add mobile steps to CI:
```yaml
- name: Typecheck Mobile
  run: pnpm --filter @rentapp/mobile exec tsc --noEmit

- name: Test Mobile
  run: pnpm --filter @rentapp/mobile test
```
Note: Mobile lint (`expo lint`) requires a different setup; it can be added conditionally.

### [CI-2] E2E Tests Not Run in CI

- **Files:** `apps/api/test/*.e2e-spec.ts` (13 files); `.github/workflows/ci.yml`
- **Issue:** There are 13 e2e test files covering all major API modules. None of them are executed in CI. The CI only runs unit/spec tests via `pnpm --filter @rentapp/api test:no-coverage`. This means contract tests, auth flows, and integration paths are never automatically validated.
- **Fix:** Add an e2e step to CI after the unit test step, using the already-provisioned postgres service:
```yaml
- name: Run migrations for e2e
  run: pnpm --filter @rentapp/api exec prisma migrate deploy

- name: E2E Tests
  run: pnpm --filter @rentapp/api test:e2e
```
Note: Redis service (fix from INFRA-1) must also be in place for e2e tests involving queues.

### [CI-3] CI Test Step Runs Without Coverage — Coverage Threshold Not Enforced in CI

- **Files:** `.github/workflows/ci.yml`, line 71 (`test:no-coverage`); `apps/api/jest.config.ts`, lines 10–14
- **Issue:** `jest.config.ts` has `coverageThreshold: { global: { statements: 35 } }` but CI uses `test:no-coverage` which skips coverage collection entirely. The threshold is never enforced in the automated pipeline.
- **Fix:** Either run `test` (with coverage) in CI and accept the ~10s overhead, or add a dedicated `test:coverage` step that fails if below threshold.

### [TURBO-1] `turbo.json` Missing `outputs` for `test` and `lint` Tasks

- **File:** `turbo.json`, lines 6–7
- **Issue:** `lint` and `test` tasks have no `outputs` defined. Turbo caches task outputs. Without explicit `outputs: []`, Turbo may not correctly cache or restore test results across runs, causing false cache hits or missed re-runs when source changes.
- **Fix:**
```json
"lint": { "dependsOn": ["^build"], "outputs": [] },
"test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] }
```

### [TURBO-2] No `typecheck` Task in `turbo.json`

- **File:** `turbo.json`
- **Issue:** CI runs typecheck as separate explicit steps (`pnpm --filter @rentapp/api exec tsc --noEmit`), bypassing Turbo's dependency graph. A `typecheck` task defined in `turbo.json` would enable `turbo typecheck` to run typechecking across all packages in dependency order, with caching.
- **Fix:**
```json
"typecheck": { "dependsOn": ["^build"], "outputs": [] }
```
And add `"typecheck": "tsc --noEmit"` to each app's `package.json`.

---

## LOW (Code Quality / Maintainability)

### [SHARED-1] `ContractAnnexDto` Exists But No `CreateAnnexSchema` in Shared

- **File:** `packages/shared/src/types/contract.types.ts`, line 24; `packages/shared/src/schemas/contract.schemas.ts`
- **Issue:** The shared package exports `ContractAnnexDto` (the response type) but has no `CreateAnnexSchema` (the input validation schema). The API's `CreateAnnexDto` (`apps/api/src/contracts/dto/create-annex.dto.ts`) is defined only in the API using class-validator, not from a shared Zod schema. The web/mobile cannot reuse or validate annex creation input without duplicating the schema.
- **Fix:** Add `CreateAnnexSchema` to `packages/shared/src/schemas/contract.schemas.ts`.

### [SHARED-2] `PaginatedResponse` Type Not in Shared Package

- **Files:** `apps/api/src/notifications/notifications.service.ts`, lines 368 and 403 (`return { data, total, page, limit }`)
- **Issue:** The pagination envelope `{ data: T[], total: number, page: number, limit: number }` is returned inline from the notifications service but is not a shared type. Each consumer (web hooks, mobile hooks) must independently type this response shape.
- **Fix:** Add to `packages/shared/src/types/` a `PaginatedResponse<T>` interface and export from `index.ts`.

### [SHARED-3] Audit Types Not Exported from Shared Package

- **File:** `packages/shared/src/index.ts`
- **Issue:** The audit module (`apps/api/src/audit/`) has its own internal types. The web's `use-audit.ts` hook constructs types locally. No `AuditLogDto` or `AuditAction` enum is shared.
- **Fix:** Create `packages/shared/src/types/audit.types.ts` and export it from `index.ts`.

### [SHARED-4] `RENTAL_STATUS_COLORS` in Mobile References Undefined `CANCELLED` Status

- **File:** `apps/mobile/src/lib/constants.ts`, line 13
- **Issue:** `RENTAL_STATUS_COLORS` includes a `CANCELLED: '#DC2626'` entry, but `RentalStatus` enum in `packages/shared/src/types/rental.types.ts` has no `CANCELLED` value (only `DRAFT`, `ACTIVE`, `EXTENDED`, `RETURNED`). This phantom status will never match and is a dead entry that also indicates the enum was changed at some point without updating this map.
- **Fix:** Remove `CANCELLED` from `RENTAL_STATUS_COLORS` or add it to `RentalStatus` if it's a planned status.

### [SHARED-5] `photo.types.ts` Mixes Types and Zod Schemas in a Types File

- **File:** `packages/shared/src/types/photo.types.ts`, lines 65–94
- **Issue:** The file contains Zod schemas (`damagePinSchema`, `createWalkthroughSchema`, `uploadPhotoSchema`, `createDamageReportSchema`) alongside TypeScript interfaces. The convention elsewhere is to separate types (`types/`) from schemas (`schemas/`). This creates an inconsistency — the photo schemas are not in `schemas/` and consumers importing from `schemas/` won't find them there.
- **Fix:** Move the Zod schemas to a new `packages/shared/src/schemas/photo.schemas.ts` file and update `index.ts`.

### [MOBILE-1] `app.config.ts` EAS `projectId` Is a Placeholder String

- **File:** `apps/mobile/app.config.ts`, line 45
- **Issue:** `eas: { projectId: 'kitek-rental' }` — EAS project IDs must be UUIDs (e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`), not human-readable slugs. A slug value will cause `eas build` to fail with an authentication error. The real project UUID must be obtained from `expo.dev` after creating the project.
- **Fix:** Replace with the actual UUID from the EAS dashboard. Store in `.env` or an Expo secret if it should not be committed.

### [MOBILE-2] `eas.json` Production Profile Uses `distribution: "internal"` Instead of Store

- **File:** `apps/mobile/eas.json`, lines 29–34
- **Issue:** The production build profile has `"distribution": "internal"` — this means production builds are distributed via EAS internal distribution (ad-hoc), not the App Store/Google Play. If the intent is to release to stores, this must be `"store"`. With `"internal"`, builds cannot be submitted to the App Store automatically.
- **Fix:** If app store distribution is intended, change to `"distribution": "store"`. The `submit.production` block is already empty (`{}`), which also means the `eas submit` step would need configuration.

### [MOBILE-3] `@sentry/react-native` Installed but Sentry Never Initialized

- **File:** `apps/mobile/app/_layout.tsx`; `apps/mobile/package.json`, line 22
- **Issue:** `@sentry/react-native` is a production dependency and the Sentry plugin is registered in `app.config.ts` (line 39), which adds native code. However, `app/_layout.tsx` never calls `Sentry.init()`. The SDK is present and hooking into the native layer but collecting nothing because it was never initialized with a DSN. The `eas.json` production profile also has no `SENTRY_DSN` env var.
- **Fix:** Either: (a) initialize Sentry in `_layout.tsx` with `EXPO_PUBLIC_SENTRY_DSN` from environment, or (b) remove the `@sentry/react-native` dependency and plugin if crash reporting is not yet needed.

### [QUALITY-1] API Coverage Threshold at 35% — Too Low for a Production System

- **File:** `apps/api/jest.config.ts`, lines 10–14
- **Issue:** Statement coverage threshold is 35%, and it's not enforced in CI (see CI-3). For a production application handling rental contracts, customer PII, and financial transactions, this is insufficient.
- **Fix:** Raise threshold gradually (target: 60%+ statements) and enforce in CI.

### [QUALITY-2] `web` Has No Coverage Configuration

- **File:** `apps/web/vitest.config.ts`
- **Issue:** No `coverage` block is defined in the Vitest config. Coverage is never measured or enforced for the web app. The web test suite (4 test files) has no coverage baseline.
- **Fix:** Add coverage config:
```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  thresholds: { statements: 40 },
}
```

### [QUALITY-3] Scattered `any` Types Across API Services

- **Files:**
  - `apps/api/src/customers/customers.service.ts`, lines 101, 108, 109, 125, 177, 217
  - `apps/api/src/portal/strategies/portal-jwt.strategy.ts`, line 16
  - `apps/api/src/cepik/cepik.service.ts`, lines 93, 155, 160
  - `apps/api/src/audit/audit.interceptor.ts`, line 16
- **Issue:** Multiple services use `any` types for Prisma return values and strategy `validate()` callbacks. With strict TypeScript and Prisma's generated types, these should be fully typed.
- **Fix:** Use `Prisma.XxxGetPayload<>` types (pattern already established in `rentals.service.ts` lines 37–48) consistently across all services.

### [QUALITY-4] Health Controller Accesses Private Field via Type Cast

- **File:** `apps/api/src/health/health.controller.ts`, line 35
- **Issue:** `Promise.resolve((this.storage as any).s3Available)` — the `s3Available` field in `StorageService` is declared `private`. Rather than casting to `any`, `StorageService` should expose a public getter or a dedicated `isAvailable(): boolean` method.
- **Fix:** Add `get available(): boolean { return this.s3Available; }` to `StorageService` and update the health controller to use `this.storage.available`.

### [QUALITY-5] `HealthModule` Missing Dependency Imports

- **File:** `apps/api/src/health/health.module.ts`
- **Issue:** `HealthController` constructor injects `PrismaService`, `StorageService`, and `ConfigService`. However, `HealthModule` only declares `controllers: [HealthController]` with no `imports`. The controller works only because `PrismaModule`, `StorageModule`, and `ConfigModule` are registered globally in `AppModule`. This is fragile — if the global registration changes, `HealthModule` will silently break.
- **Fix:** Add `imports: [PrismaModule, StorageModule, ConfigModule]` to `HealthModule` for explicitness.

---

## Summary Table

| ID | Severity | Area | Description |
|---|---|---|---|
| SEC-1 | CRITICAL | Security | `apps/api/.env` not gitignored, contains live credentials |
| SEC-2 | CRITICAL | Security | Portal JWT reuses main `JWT_ACCESS_SECRET` |
| SEC-3 | CRITICAL | Security | Company data hard-coded in `contracts.service.ts` |
| SEC-4 | CRITICAL | Security | Zero-value `FIELD_ENCRYPTION_KEY` placeholder in `.env.example` |
| INFRA-1 | HIGH | CI | Redis not provisioned as CI service despite `REDIS_URL` env var |
| INFRA-2 | HIGH | Deployment | No `prisma migrate deploy` in deploy pipeline or Dockerfile CMD |
| INFRA-3 | HIGH | Deployment | No `railway.toml` for web service, no health check |
| INFRA-4 | HIGH | CI/CD | `deploy-web.yml` has no post-deploy health check |
| INFRA-5 | HIGH | Docker | Puppeteer Chromium cache not in production image — PDF will fail |
| INFRA-6 | HIGH | CI/CD | `sleep 30` hardcoded in deploy pipeline health check |
| INFRA-7 | HIGH | Config | SMTP auth not configured — mail will fail in production |
| DEP-1 | MEDIUM | Dependencies | `bullmq` declared but unused (only `bull` is used) |
| DEP-2 | MEDIUM | Dependencies | `@nestjs/cli` in web devDependencies — wrong package |
| DEP-3 | MEDIUM | Dependencies | `zod` version skew between packages |
| DEP-4 | MEDIUM | Dependencies | `typescript` version skew (web on 5.8 vs rest on 5.9) |
| DEP-5 | MEDIUM | Dependencies | `tailwindcss` in mobile without NativeWind |
| ENV-1 | MEDIUM | Config | `CORS_ORIGINS` missing from `.env.example` |
| ENV-2 | MEDIUM | Config | `apps/web` has no `.env.example` despite requiring `API_URL` |
| ENV-3 | MEDIUM | Config | `COMPANY_PHONE` in code but not in `.env.example` |
| ENV-4 | MEDIUM | Config | Root and API `.env.example` duplicated and diverged |
| DOCKER-1 | MEDIUM | Docker | MinIO and Mailpit use unpinned `:latest` tags |
| DOCKER-2 | MEDIUM | Docker | MinIO has no health check in `docker-compose.yml` |
| DOCKER-3 | MEDIUM | Docker | Compose is infrastructure-only — no API/web services |
| DOCKER-4 | MEDIUM | Docker | `tsconfig.base.json` not explicitly copied in Dockerfiles |
| CI-1 | MEDIUM | CI | Mobile app not in CI (no lint, typecheck, test) |
| CI-2 | MEDIUM | CI | E2E tests (13 files) not run in CI |
| CI-3 | MEDIUM | CI | Coverage threshold not enforced in CI |
| TURBO-1 | LOW | Monorepo | `lint` and `test` tasks missing `outputs` in `turbo.json` |
| TURBO-2 | LOW | Monorepo | No `typecheck` task in `turbo.json` |
| SHARED-1 | LOW | Shared | `CreateAnnexSchema` missing from shared package |
| SHARED-2 | LOW | Shared | `PaginatedResponse<T>` type not shared |
| SHARED-3 | LOW | Shared | Audit types not exported from shared package |
| SHARED-4 | LOW | Shared | `CANCELLED` status in mobile constants but not in `RentalStatus` enum |
| SHARED-5 | LOW | Shared | Zod schemas in `photo.types.ts` should be in `schemas/` |
| MOBILE-1 | LOW | Mobile | EAS `projectId` is a slug placeholder, not a UUID |
| MOBILE-2 | LOW | Mobile | Production EAS profile uses `internal` instead of `store` |
| MOBILE-3 | LOW | Mobile | Sentry installed and native-hooked but never initialized |
| QUALITY-1 | LOW | Quality | API coverage threshold only 35%, not enforced in CI |
| QUALITY-2 | LOW | Quality | Web has no coverage configuration |
| QUALITY-3 | LOW | Quality | Scattered `any` types across API services |
| QUALITY-4 | LOW | Quality | Health controller accesses `private` field via `as any` cast |
| QUALITY-5 | LOW | Quality | `HealthModule` missing explicit dependency imports |

---

*Infrastructure audit: 2026-03-27*
