# API Backend Audit

**Analysis Date:** 2026-03-27
**Scope:** `apps/api/src/`

---

## Summary

The API is in good structural shape overall. Auth, roles, and global guards are properly layered. Prisma transactions are used consistently for multi-table writes. DTOs with class-validator cover most inputs. The main risk areas are: a destructive GDPR retention cron that skips an active-rentals safety check, a contract-number generation race condition, N+1 presigned-URL loops in the vehicles controller, missing UUID validation on several params, hardcoded company details, loose TypeScript (`any`) in a number of places, and several minor but real security gaps in the portal and SMS services.

---

## 1. Race Conditions

### 1.1 Contract Number Generation
**File:** `apps/api/src/contracts/contracts.service.ts` lines 79–92
**Severity:** HIGH

`generateContractNumber` counts existing contracts for the day and adds 1. This runs outside the `prisma.contract.create` transaction. Two concurrent requests will count the same value and produce a duplicate contract number — which will then fail on the unique constraint (`contractNumber` is `@unique`), causing a 500 for one of the callers instead of a proper conflict response.

**Fix approach:** Move the sequence number into the transaction, or use a database sequence / advisory lock. Alternatively, generate the number inside `$transaction` using `tx.contract.count` and `tx.contract.create` atomically.

---

### 1.2 Notification Create + Update Two-Step
**File:** `apps/api/src/notifications/notifications.service.ts` lines 84–113, 138–168, 195–228, 252–277
**Severity:** LOW

Every SMS/email enqueue does: `notification.create` with empty `message`, then `notification.update` with the message. If the process dies between the two, a PENDING notification with no message sits permanently in the queue and the SMS processor sends an empty string to SMSAPI.

**Fix approach:** Set the message in the `create` call directly.

---

## 2. Missing Authorization Checks

### 2.1 Portal Rental ID Not Validated as UUID
**File:** `apps/api/src/portal/portal.controller.ts` line 31
**Severity:** LOW

```typescript
@Get('rentals/:id')
async getRentalDetail(@Req() req: PortalRequest, @Param('id') id: string) {
```

`@Param('id')` has no `ParseUUIDPipe`. The service does check ownership (`rental.customerId !== customerId`) but passing a malformed string wastes a DB round-trip and produces an inconsistent error response.

**Fix approach:** Add `@Param('id', ParseUUIDPipe)`.

---

### 2.2 Users PATCH/:id Missing UUID Validation
**File:** `apps/api/src/users/users.controller.ts` lines 33–39

```typescript
@Patch(':id')
async update(@Param('id') id: string, ...)
```

No `ParseUUIDPipe`. Same for `POST(':id/reset-password')` at line 42.

**Fix approach:** Add `@Param('id', ParseUUIDPipe)` to both handlers.

---

### 2.3 Alert Config PATCH/:alertType Accepts Arbitrary Strings
**File:** `apps/api/src/alert-config/alert-config.controller.ts` line 17
**Severity:** LOW

`@Param('alertType')` is a raw string. Any caller (ADMIN role only, so low severity) can probe non-existent alert types and receive 404 detail. An enum allowlist would be cleaner.

---

### 2.4 Self-Update Not Prevented for Users
**File:** `apps/api/src/users/users.controller.ts` lines 33–40
**Severity:** MEDIUM

An ADMIN can update their own role (e.g., demote themselves — low risk) but more importantly there is no guard preventing an ADMIN from deactivating themselves (`isActive: false`), which would lock out the last admin. The service has no active-admin-count check before deactivation.

---

### 2.5 Portal JWT Uses Same Secret as Employee JWT
**File:** `apps/api/src/portal/strategies/portal-jwt.strategy.ts` lines 9–11
**Severity:** MEDIUM

`PortalJwtStrategy` uses `JWT_ACCESS_SECRET` — the same secret used for staff JWTs. If an employee JWT is stolen it cannot be used on portal routes (the `type !== 'portal'` check at line 18 rejects it), but a portal token crafted with the same secret would be accepted by the employee `JwtStrategy` since that strategy does NOT check `payload.type`. A customer who obtained their raw portal JWT could call any employee API endpoint.

**Fix approach:** Use a separate `JWT_PORTAL_SECRET` env var for portal tokens.

---

## 3. TypeScript Type Safety Issues

### 3.1 Widespread `any` Usage
**Files (non-exhaustive):**
- `apps/api/src/customers/customers.service.ts` lines 101, 108, 110, 125 — `Record<string, any>`, `(existing as any)`, `dto[field]`
- `apps/api/src/audit/audit.service.ts` line 24 — `changesJson: entry.changes as any`
- `apps/api/src/cepik/cepik.service.ts` lines 85, 92, 155 — `result: result as any`, `toDto(verification: any)`
- `apps/api/src/portal/strategies/portal-jwt.strategy.ts` line 16 — `validate(payload: any)`
- `apps/api/src/notifications/listeners/rental-activated.listener.ts` line 16 — `payload: { rental: any }`

These suppress real type errors. Specific risks: `cepik.service.ts toDto(verification: any)` means a wrong Prisma return type goes undetected at compile time.

---

### 3.2 Non-null Assertion Without Guard
**File:** `apps/api/src/rentals/rentals.service.ts` lines 263, 415, 431
**Severity:** MEDIUM

`updated!` is used after re-fetching inside `processReturn` (line 263) and `rollback` (line 415) without checking for null. If the record was deleted concurrently between the transaction and the re-fetch, these lines throw an unhandled `TypeError: Cannot spread null`.

```typescript
// line 263
return {
  ...updated!,   // ← not null-checked
```

**Fix approach:** Add `if (!updated) throw new NotFoundException(...)` after the re-fetch.

---

### 3.3 `toDto` in `ContractsService` Has Unsafe Date Coercion
**File:** `apps/api/src/contracts/contracts.service.ts` lines 632–633
```typescript
createdAt: contract.createdAt?.toISOString() ?? contract.createdAt,
updatedAt: contract.updatedAt?.toISOString() ?? contract.updatedAt,
```

The fallback returns the raw `Date` object (not a string) when `toISOString()` is unavailable, which violates the `ContractDto` type that declares `string`. This can only happen if Prisma returns something unexpected, but the TS compiler accepts it silently because of the `??` union.

---

## 4. Security Concerns

### 4.1 Hardcoded Company PII in Source Code
**File:** `apps/api/src/contracts/contracts.service.ts` lines 101–107
**Severity:** HIGH

```typescript
company: {
  name: 'KITEK',
  owner: 'Pawel Romanowski',
  address: 'ul. Sieradzka 18, 87-100 Torun',
  phone: '535 766 666 / 602 367 100',
},
```

Real personal name, address, and phone number are hardcoded and committed to the repository. This is a GDPR concern and makes data changes require a code deploy.

**Fix approach:** Move to env vars: `COMPANY_NAME`, `COMPANY_OWNER`, `COMPANY_ADDRESS`, `COMPANY_PHONE`.

---

### 4.2 Auth Setup/Reset Token Uses Single DB Column for Two Flows
**File:** `apps/api/src/users/users.service.ts` lines 117–143; `apps/api/src/auth/auth.service.ts` lines 148–151
**Severity:** MEDIUM

Password setup (72h expiry) and password reset (1h expiry) both write to `setupToken`/`setupTokenExpiry`. `resetPassword` in `auth.service.ts` literally calls `setupPassword` (line 150–151). If an admin triggers a password setup for a new user, then the user later requests a password reset, the 1h reset overwrites the 72h setup token silently. The user gets a new 1h window, the setup email link (still in their inbox for up to 71 more hours) becomes invalid.

This is minor UX but the deeper concern: `setupPassword` scans ALL users with a valid token (`findMany`) and verifies each one with argon2 (line 110–128). With many users or malicious timing, this is an O(N) argon2 scan per unauthenticated request.

**Fix approach:** Separate columns for setup vs. reset tokens, or better: store token → userId mapping in Redis.

---

### 4.3 `signatureBase64` Size Not Validated in DTO
**File:** `apps/api/src/contracts/dto/sign-contract.dto.ts` lines 7–9
**Severity:** MEDIUM

`signatureBase64` is a plain `@IsString()` with no `@MaxLength`. A caller can send a multi-megabyte string. The body parser is capped at 10 MB (`main.ts` line 21), so an outright DoS is blocked, but a 9.9 MB "signature" goes all the way to S3.

**Fix approach:** Add `@MaxLength(500000)` (approx 375 KB decoded PNG).

---

### 4.4 `damageSketchBase64` Size Not Validated
**File:** `apps/api/src/contracts/dto/create-contract.dto.ts` line 27
**Severity:** LOW

Same issue as 4.3 — `@IsString()` with no length limit.

---

### 4.5 Health Endpoint Uses `$queryRawUnsafe`
**File:** `apps/api/src/health/health.controller.ts` line 33
**Severity:** LOW

```typescript
this.prisma.$queryRawUnsafe('SELECT 1'),
```

This is safe because there is no user input, but the `$queryRawUnsafe` call will trigger Prisma's unsafe query warning in development and static analysis tools. Use `$queryRaw\`SELECT 1\`` instead.

---

### 4.6 Portal Token Exchanged Without Rate Limiting
**File:** `apps/api/src/portal/portal-auth.controller.ts` lines 11–15
**Severity:** MEDIUM

The `/portal/auth/exchange` endpoint is `@Public()` (bypasses JWT guard) and inherits only the global throttle of 100 req/60s, shared across all IPs via ThrottlerGuard. There is no per-`customerId` or per-IP sub-throttle on this endpoint. A brute-force attack on `customerId` + token is partially mitigated by argon2 verify cost, but should have a tighter `@Throttle` decorator.

**Fix approach:** Add `@Throttle({ default: { limit: 5, ttl: 60000 } })` to this controller.

---

### 4.7 `SmsService` Calls `getOrThrow` for SMSAPI_TOKEN
**File:** `apps/api/src/notifications/sms/sms.service.ts` line 13
**Severity:** MEDIUM

`getOrThrow('SMSAPI_TOKEN')` will throw at module initialization time if the token is missing — even in development environments where SMS is never used. `env.validation.ts` only warns (does not block) if `SMSAPI_TOKEN` is absent in production (line 49). In non-production environments this causes a crash at startup when the notifications module loads.

**Fix approach:** Use `config.get('SMSAPI_TOKEN', '')` and initialize the SMSAPI client lazily in `send()`, guarded by a null check.

---

### 4.8 Storage Service Exposes Local Filesystem Paths via API
**File:** `apps/api/src/storage/storage.service.ts` lines 97–99
```typescript
return `/storage/${encodeURIComponent(key)}`;
```

When S3 is unavailable, presigned URLs become `/storage/<encoded-key>`. This route is not defined in the codebase — it would return 404 in production. But more importantly, the `key` parameter comes from DB values that include paths like `vehicles/uuid/documents/...`. If a `/storage` static-serve route is ever added, path traversal is possible because `encodeURIComponent` does not prevent `../` after decoding.

---

## 5. Missing Error Handling

### 5.1 `processReturn` Emits Event Before Confirming DB Write
**File:** `apps/api/src/rentals/rentals.service.ts` lines 231–261
**Severity:** MEDIUM

The `$transaction` at line 231 does NOT return the updated rental (it `await`s but discards). The method then re-fetches with `findUnique` (line 249) and emits `rental.returned` (line 255) before using the re-fetched value. If the re-fetch returns `null` (concurrent delete), the event is emitted with `rentalId` but the return value at line 263 uses `updated!` unsafely.

---

### 5.2 Photo Upload Race: Storage Upload Before DB Record
**File:** `apps/api/src/photos/photos.service.ts` lines 95–111
**Severity:** LOW

Files are uploaded to MinIO (`storage.upload` lines 95–96) before the DB record is created (`prisma.walkthroughPhoto.create` line 99). If the DB insert fails, the S3 objects are orphaned with no cleanup.

**Fix approach:** Wrap in a transaction pattern: attempt DB insert first, then upload to S3, or implement a cleanup on DB error.

---

### 5.3 `replacePhoto` Does Not Restore Old Files on Failure
**File:** `apps/api/src/photos/photos.service.ts` lines 252–284
**Severity:** LOW

Old S3 objects are deleted (lines 252–253) before new ones are uploaded (lines 272–273). If the new upload fails, the old photos are gone permanently.

**Fix approach:** Upload new files first, update DB, then delete old files.

---

### 5.4 `importFleet` Queries DB Inside a Loop — N+1
**File:** `apps/api/src/vehicles/vehicles.service.ts` lines 264–274
**Severity:** MEDIUM

```typescript
for (let i = 0; i < rows.length; i++) {
  ...
  const existing = await this.prisma.vehicle.findUnique({  // ← per-row DB hit
    where: { registration },
  });
```

For a 500-row import, this is 500+ sequential DB queries before any creates. On a 100ms connection, that is 50+ seconds.

**Fix approach:** Pre-fetch all registrations in a single `findMany` before the loop, build a `Set`, and check membership in memory.

---

### 5.5 `getVehicle` in `findAll` + `toDto` — N+1 Presigned URLs
**File:** `apps/api/src/vehicles/vehicles.controller.ts` (implicit via `VehiclesService.toDto`)
**Severity:** MEDIUM

`toDto` issues S3 presigned URL requests for: `photoKey`, each `document.fileKey`, `insurance.documentKey`, `inspection.documentKey`. The `GET /vehicles` endpoint calls `findAll` (returns all vehicles with includes) and then the caller must call `toDto` per vehicle. In the controller today, `findAll` returns raw Prisma objects — `toDto` is only called explicitly from the controller in `update`. However, if `findAll` were to run `toDto` per vehicle for a fleet of 50 vehicles with 3 documents each, that is 200+ S3 presign calls per request.

Currently the controller returns raw DB objects (not running `toDto`), so the client receives `photoKey` strings not URLs. This is an inconsistency — the `findOne` endpoint also returns raw DB objects without calling `toDto`. The `toDto` method exists but is only called in `update`.

**Fix approach:** Decide on one response shape. If URLs are needed, run `toDto` but cache the presigned URL or return the S3 key and let the client request a presigned URL on demand.

---

### 5.6 `getComparison` in `PhotosService` — N+1 Presigned URLs
**File:** `apps/api/src/photos/photos.service.ts` lines 157–218
**Severity:** MEDIUM

For each photo position (up to 10+ positions), the method makes 4 sequential S3 presign calls (handover photo, handover thumbnail, return photo, return thumbnail). For a full comparison with 10 positions, that is 40 serial S3 round-trips.

**Fix approach:** Run all presign calls in `Promise.all`.

---

### 5.7 `enqueueExpiryAlert` — N+1 DB Inserts Inside Loop
**File:** `apps/api/src/notifications/notifications.service.ts` lines 293–343
**Severity:** MEDIUM

For each vehicle with an expiring insurance/inspection, the method iterates over all ADMIN users and creates a `notification` + `inAppNotification` per admin per vehicle inside a nested loop. With 5 admins and 10 expiring vehicles, that is 100 individual DB inserts per scan.

**Fix approach:** Use `createMany` where possible, or batch the operations.

---

## 6. Missing Pagination

### 6.1 `GET /rentals` — No Pagination
**File:** `apps/api/src/rentals/rentals.service.ts` lines 144–161
**Severity:** MEDIUM

`findAll` returns all rentals matching the filter with no `take`/`skip`. A company with thousands of rentals will return unbounded results.

**Fix approach:** Add `page`/`limit` query params to `RentalsQueryDto` and apply `take`/`skip`.

---

### 6.2 `GET /customers` — No Pagination
**File:** `apps/api/src/customers/customers.service.ts` lines 84–88
**Severity:** MEDIUM

`findAll` returns all customers. Same issue.

---

### 6.3 `GET /vehicles` — No Pagination
**File:** `apps/api/src/vehicles/vehicles.service.ts` lines 54–61
**Severity:** LOW

Vehicles are bounded by fleet size (typically < 100), so this is lower urgency, but the pattern is inconsistent.

---

### 6.4 `GET /contracts` — No Pagination
**File:** `apps/api/src/contracts/contracts.service.ts` lines 450–456
**Severity:** MEDIUM

Same issue.

---

### 6.5 `GET /audit` — Pagination Exists But Uses `offset` Not `page`
**File:** `apps/api/src/audit/audit.service.ts` lines 30–60
**Severity:** LOW

`findAll` takes `limit`/`offset` (raw offset). The rest of the API uses `page`/`limit`. Inconsistency makes frontend integration harder.

---

## 7. Hardcoded Values

### 7.1 Company Data
**File:** `apps/api/src/contracts/contracts.service.ts` lines 101–107
See issue 4.1 above.

---

### 7.2 Annex PDF VAT Rate Hardcoded to 23%
**File:** `apps/api/src/contracts/contracts.service.ts` line 548
```typescript
newTotalPriceGross: data.newTotalPriceNet
  ? Math.round(data.newTotalPriceNet * 1.23)  // ← hardcoded 23%
  : undefined,
```

The rental already stores `vatRate` as a field. This calculation ignores it. If a rental has a different VAT rate, the annex PDF will show the wrong gross.

**Fix approach:** Pass the rental's `vatRate` into `createAnnex` and use it here.

---

### 7.3 Token Expiry Values Duplicated
**File:** `apps/api/src/users/users.service.ts` lines 24, 100, 130
**Severity:** LOW

`72 * 60 * 60 * 1000` (setup) and `1 * 60 * 60 * 1000` (reset) are inlined in three different methods. Extract as named constants.

---

### 7.4 SMSAPI Endpoint Hardcoded
**File:** `apps/api/src/notifications/sms/sms.service.ts` line 15
```typescript
this.smsapi = new SMSAPI(token, 'https://api.smsapi.pl/api');
```

The API endpoint is hardcoded. If SMSAPI changes their URL or the business moves to `.com`, this requires a code change.

**Fix approach:** `SMSAPI_ENDPOINT` env var with the current value as default.

---

## 8. Missing Input Validation

### 8.1 `CalendarQueryDto` Allows Arbitrary Date Range
**File:** `apps/api/src/rentals/dto/calendar-query.dto.ts`
**Severity:** LOW

`from` and `to` are validated as ISO8601 but there is no check that `from < to` or that the range is bounded. A client requesting a 10-year calendar window triggers a full rental table scan for that period.

**Fix approach:** Add `@IsDateString()`, ensure `to > from`, and add a max range (e.g., 6 months).

---

### 8.2 `NotificationQueryDto.isRead` Is `string` Not `boolean`
**File:** `apps/api/src/notifications/dto/notification-query.dto.ts` line 18
```typescript
isRead?: string; // 'true' | 'false'
```

Compared as string in service (line 355–356). The validator does not restrict this to `'true'|'false'`. Any string passes. Should use `@IsIn(['true', 'false'])` or transform to boolean.

---

### 8.3 `UploadPhotoDto.position` Is Unbounded String
**File:** `apps/api/src/photos/dto/upload-photo.dto.ts` line 4–5
```typescript
@IsString()
position!: string;
```

No `@MaxLength` and no validation against allowed positions. The service checks `(PHOTO_POSITIONS as readonly string[]).includes(dto.position)` to decide the storage key, but any string can be passed — it becomes `extra_<uuid>` in storage with no length limit on the position value itself.

**Fix approach:** Add `@MaxLength(50)`.

---

### 8.4 `CreateRentalDto` Does Not Validate `startDate < endDate`
**File:** `apps/api/src/rentals/dto/create-rental.dto.ts`
**Severity:** LOW

Both dates are `@IsISO8601()` but the DTO does not enforce `startDate < endDate`. The service computes `days = Math.max(1, ...)` (line 83), silently clamping a reversed date range to 1 day. This hides the client error.

**Fix approach:** Add a custom `@ValidateIf` or a class-level `@ValidateNested` cross-field constraint.

---

### 8.5 `CreateVehicleDto.make` and `.model` Have No `@MaxLength`
**File:** `apps/api/src/vehicles/dto/create-vehicle.dto.ts` lines 52–55
**Severity:** LOW

Unbounded strings stored in DB varchar columns.

---

### 8.6 Vehicle Document Label Validated Only in Controller, Not DTO
**File:** `apps/api/src/vehicles/vehicles.controller.ts` lines 137–141
```typescript
if (!label || !DOCUMENT_LABELS.includes(label)) {
  throw new BadRequestException(...)
}
```

Validation is in the controller handler, not in a DTO. This is fine functionally but breaks the convention used everywhere else and means the validation is not tested via DTO unit tests.

---

## 9. Incorrect or Missing HTTP Status Codes

### 9.1 `DELETE /rentals/:id` Returns 200 Not 204
**File:** `apps/api/src/rentals/rentals.controller.ts` lines 128–143
**Severity:** LOW

A delete that returns body data technically can be 200, but the REST convention for a successful delete with no meaningful response body is 204. The current response includes the full rental object plus `__audit` metadata, so 200 is defensible — but the `__audit` is stripped before returning, leaving the full rental as the response body.

---

### 9.2 `PATCH /notifications/in-app/read-all` Route Conflict
**File:** `apps/api/src/notifications/notifications.controller.ts` lines 39–43
**Severity:** MEDIUM

The route `PATCH /notifications/in-app/read-all` is registered AFTER `PATCH /notifications/in-app/:id/read` (line 31). NestJS resolves routes in registration order. `read-all` would be matched by the `:id` dynamic segment first if NestJS does not properly sort literal vs. dynamic segments. NestJS does prioritize literal segments over params in most cases, but this should be verified — if `read-all` is accidentally matched as `id = 'read-all'`, the `markAsRead` call will fail with a DB error (no notification with id `'read-all'`) rather than marking all as read.

**Fix approach:** Place the static route before the parameterized route in the controller definition (move `markAllAsRead` above `markAsRead`).

---

## 10. Missing Transaction Handling

### 10.1 `createAnnex` Is Not Transactional
**File:** `apps/api/src/contracts/contracts.service.ts` lines 478–598
**Severity:** MEDIUM

The annex creation creates a DB record (`prisma.contractAnnex.create`, line 520), then attempts PDF generation and upload (lines 529–587), then updates the annex record. If the PDF upload succeeds but the final `prisma.contractAnnex.update` (line 584) fails, the S3 object and DB record are inconsistent. There is no rollback of the S3 upload.

This is a hard problem (S3 and DB cannot share a transaction), but at minimum the `contractAnnex.create` and the subsequent `contractAnnex.update` should be a single operation, not two. The annex record is created before the PDF is ready, which means a brief window where the annex exists with no `pdfKey`.

---

### 10.2 `RetentionService` Deletes Customers Without Active-Rental Guard
**File:** `apps/api/src/customers/retention.service.ts` lines 12–40
**Severity:** HIGH

The comment on line 16 explicitly acknowledges this: `// In Phase 3+, also check that customer has no active rentals`. The current code hard-deletes all archived + expired customers. The `Customer → Rental` relation uses `onDelete: Restrict` in Prisma (no cascade defined in schema), so Prisma will throw `P2003` (foreign key constraint) if the customer has rentals. The `deleteMany` call has no explicit check and will fail partially if some customers have rentals and others do not.

**Actual risk:** Customers with rentals are not deleted (FK prevents it), but the `deleteMany` may delete partial batches silently while throwing on the failing records. The `result.count` logged will be inaccurate.

**Fix approach:** Filter out customers with any rental before deletion:
```typescript
where: { id: { in: ids }, rentals: { none: {} } }
```

---

## 11. Dead Code / Unused Items

### 11.1 `User.failedAttempts` and `User.lockedUntil` Schema Fields Unused
**File:** `apps/api/prisma/schema.prisma` lines (User model)
**Severity:** LOW

The User model has `failedAttempts: Int @default(0)` and `lockedUntil: DateTime?` but these are never read or written by `AuthService`. Instead, auth uses Redis keys (`attempts:<email>`, `lockout:<email>`). The DB columns are dead weight that may confuse future developers.

---

### 11.2 `PhotoWalkthrough.noDamage` Field Shadowed by `DamageReport.noDamageConfirmed`
**File:** `apps/api/prisma/schema.prisma` (PhotoWalkthrough model)
**Severity:** LOW

`PhotoWalkthrough` has `noDamage Boolean @default(false)` which is never set anywhere in the codebase. `DamageService.confirmNoDamage` sets `DamageReport.noDamageConfirmed` instead. The `noDamage` field on `PhotoWalkthrough` is dead.

---

### 11.3 `CepikController.override` Calls `findOne` Twice
**File:** `apps/api/src/cepik/cepik.controller.ts` lines 53–54
```typescript
const existing = await this.cepikService.findOne(id);
const updated = await this.cepikService.overrideVerification(id, ...);
```

`overrideVerification` calls `findOne` again internally (line 107 in `cepik.service.ts`). The first `findOne` call is redundant — it is only used to capture the old status for the audit payload. This is a double DB hit.

---

### 11.4 `CUSTOMER` Role in `UserRole` Enum Is Never Used
**File:** `apps/api/prisma/schema.prisma`

The `UserRole.CUSTOMER` enum value exists in the Prisma schema but the only roles assigned to users are `ADMIN` and `EMPLOYEE`. Customers are identified by the portal JWT `type: 'portal'` field, not by a DB user role. This dead enum value creates confusion.

---

## 12. Logging Issues

### 12.1 `console.error` in `AuditInterceptor` Instead of NestJS Logger
**File:** `apps/api/src/audit/audit.interceptor.ts` lines 41, 74
```typescript
console.error('Audit log failed:', err);
```

The rest of the codebase uses `new Logger(...)`. `console.error` bypasses NestJS structured logging, which means audit failures are invisible in production log aggregators that parse JSON logs.

**Fix approach:** Add `private readonly logger = new Logger(AuditInterceptor.name)` and use `this.logger.error(...)`.

---

### 12.2 `AuthService` Has No Logger
**File:** `apps/api/src/auth/auth.service.ts`
**Severity:** LOW

Lockout events, failed login attempts, and token reuse detections are security-relevant but none are logged. These are exactly the events that a SIEM or security monitoring tool would want to see.

**Fix approach:** Add `Logger` and log: login success, failed attempt + count, lockout triggered, token reuse detected.

---

### 12.3 Redis Connection Errors in `AuthService` Are Silent
**File:** `apps/api/src/auth/auth.service.ts` line 23
```typescript
this.redis = new Redis(this.config.get<string>('REDIS_URL')!);
```

The Redis client is initialized without error event handlers. If Redis becomes unavailable at runtime, `ioredis` emits an `error` event that crashes the Node.js process unless handled. The `HealthController` creates its own Redis client with `this.redis.on('error', () => {})` (line 23 of health controller), but `AuthService`'s client has no handler.

**Fix approach:**
```typescript
this.redis = new Redis(this.config.get<string>('REDIS_URL')!);
this.redis.on('error', (err) => this.logger.error('Redis error', err));
```

---

## 13. Configuration Issues

### 13.1 `FIELD_ENCRYPTION_KEY` Not Required in Development
**File:** `apps/api/src/common/env.validation.ts` lines 40–44
**Severity:** MEDIUM

`FIELD_ENCRYPTION_KEY` is only required in production. In development, if it is absent, `field-encryption.ts` `getKey()` throws `Error: FIELD_ENCRYPTION_KEY must be a 64-character hex string` at runtime when the first customer is created. This gives a confusing 500 error rather than a clear startup failure.

**Fix approach:** Move `FIELD_ENCRYPTION_KEY` to the always-required list, or at minimum set a deterministic development fallback that warns loudly.

---

### 13.2 `APP_URL` Not Validated at Startup
**File:** `apps/api/src/common/env.validation.ts`
**Severity:** LOW

`APP_URL` is used in `mail.service.ts`, `portal.service.ts`, and `contracts.service.ts` but is not in the required or optional-with-defaults list. If unset, `config.get('APP_URL')` returns `undefined`, and setup-password emails contain `undefined/setup-password?token=...`.

**Fix approach:** Add to `optionalDefaults` with value `'http://localhost:3001'`.

---

### 13.3 `S3_ACCESS_KEY` and `S3_SECRET_KEY` Default to `minioadmin`
**File:** `apps/api/src/storage/storage.service.ts` lines 33–37
**Severity:** MEDIUM

The default credentials `minioadmin`/`minioadmin` are the well-known MinIO defaults. In a misconfigured production environment where env vars are not set, the API will attempt to connect to production MinIO with these default credentials. They should not be in source code.

**Fix approach:** Remove the defaults — force configuration via env vars. The `env.validation.ts` already supports setting required-in-production vars.

---

## 14. Missing Database Indexes

### 14.1 `Contract.createdById` Has No Index
**File:** `apps/api/prisma/schema.prisma` (Contract model)

Queries filtering by `createdById` (e.g., "all contracts created by this employee") have no index to support them.

---

### 14.2 `CepikVerification.status` Has No Index
**File:** `apps/api/prisma/schema.prisma` (CepikVerification model)

No index on `status`. Queries filtering `status = 'FAILED'` for admin review do a full table scan.

---

### 14.3 `Notification.createdAt` Index Missing for Log Queries
**File:** `apps/api/prisma/schema.prisma` (Notification model)

`getNotificationLog` orders by `createdAt desc` with no filter — the `@@index([type, relatedEntityId, scheduledFor])` does not cover this pattern.

Note: `@@index([status])` and `@@index([createdAt])` do exist on `InAppNotification` but not on `Notification`.

---

### 14.4 `WalkthroughPhoto` Position Lookup Has Index via Unique Constraint Only
**File:** `apps/api/prisma/schema.prisma`

`@@unique([walkthroughId, position])` creates a unique index which covers point lookups. This is fine.

---

## 15. Test Coverage Gaps

### 15.1 `ContractsService` Has No Unit Tests
**Severity:** HIGH

There is no `contracts.service.spec.ts`. The contracts service is the most complex service (660 lines), handles PDF generation, signature collection, status transitions, portal token generation, email dispatch, and rental auto-activation. Zero test coverage.

---

### 15.2 `PortalService` Has No Unit Tests
**Severity:** MEDIUM

No spec file for `portal.service.ts`. Token exchange, ownership verification, and presigned URL generation are untested.

---

### 15.3 `AuthService` Has No Unit Tests
**Severity:** MEDIUM

The auth service handles login, lockout, refresh token rotation, setup/reset password flows. No spec file.

---

### 15.4 `RetentionService` Has No Unit Tests
**Severity:** MEDIUM

The service that hard-deletes customer records for GDPR compliance has no test coverage. An accidental query change could delete too many or too few records silently.

---

### 15.5 `StorageService` Has No Unit Tests
**Severity:** LOW

The local filesystem fallback path is entirely untested.

---

### 15.6 Existing Specs Use Mocked Everything
**Files:** `apps/api/src/vehicles/vehicles.service.spec.ts`, `apps/api/src/rentals/rentals.service.spec.ts`

A quick check shows specs exist but the pattern needs verification — if all external dependencies are mocked with no integration assertions, edge cases like the rental overlap query (raw SQL) are untested.

---

## 16. Miscellaneous Issues

### 16.1 `toDto` in `CustomersService` Is `public` and Typed `any`
**File:** `apps/api/src/customers/customers.service.ts` line 217
```typescript
toDto(customer: any): CustomerDto {
```

`toDto` accepts `any`, which means a caller passing a wrong object silently produces a broken DTO. Since encryption fields are accessed directly, a missing `peselEncrypted` field throws at runtime with a cryptic error.

**Fix approach:** Type the parameter as `Prisma.CustomerGetPayload<...>` or the full Prisma-generated type.

---

### 16.2 `AuditInterceptor` Fallback Logs `request.body` as `new` Value
**File:** `apps/api/src/audit/audit.interceptor.ts` lines 58–76

The comment on lines 55–63 explains this is a known limitation from "Phase 1". For updates, the fallback records `{ old: null, new: request.body }` — this means every update audit log shows `old: null`, which defeats the purpose of an audit trail for updates. All update operations in controllers now attach `__audit` metadata correctly, so the fallback is mostly triggered by endpoints that don't set `__audit`. Identifying and fixing those is lower priority but the code comment should be updated to reflect current state.

---

### 16.3 `getWarsawDateRange` Uses Local System `setHours` for UTC Dates
**File:** `apps/api/src/notifications/cron/alert-scanner.service.ts` lines 176–194
**Severity:** LOW

The method correctly extracts the Warsaw date string (line 182), then creates a `Date` object and calls `setHours(0,0,0,0)` (lines 190–191). `setHours` uses the **system local time**, not Warsaw time. If the server runs in UTC (as is standard on Railway/Docker), `setHours(0,0,0,0)` sets midnight UTC, not midnight Warsaw. The two differ by 1–2 hours (CET/CEST). This means a return reminder cron that runs at 08:00 Warsaw may miss rentals ending on that day if the server is in UTC.

**Fix approach:** Use `date-fns-tz` `startOfDay` with timezone, or construct the UTC equivalent of Warsaw midnight explicitly.

---

### 16.4 Portal JWT `req.user` Interface Is Manually Typed
**File:** `apps/api/src/portal/portal.controller.ts` lines 7–12
```typescript
interface PortalRequest extends Request {
  user: { customerId: string; sub: string; };
}
```

The `PortalJwtStrategy.validate` returns `{ customerId: payload.sub, type: 'portal' }` (line 19 of portal-jwt.strategy.ts), which has no `sub` field. The `PortalRequest.user.sub` field will always be `undefined`. If any code reads `req.user.sub` it gets undefined silently.

---

### 16.5 `vehicles/vehicles.controller.ts` Route Order: `import` Before `import/template`
**File:** `apps/api/src/vehicles/vehicles.controller.ts` lines 46–83
**Severity:** LOW

`POST /vehicles/import` (line 46) and `GET /vehicles/import/template` (line 70) are defined before `GET /vehicles/:id` (line 85). This is correct in NestJS (literal routes take priority). But `GET /vehicles/import/template` could be misrouted if NestJS version changes. The safer pattern is to always put static routes first in the controller.

---

*Audit completed: 2026-03-27*
