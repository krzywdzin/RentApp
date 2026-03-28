---
phase: quick
plan: 260328-plc
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/api/test/portal.e2e-spec.ts
  - apps/api/test/auth.e2e-spec.ts
  - apps/api/test/rentals.e2e-spec.ts
  - apps/api/test/customers.e2e-spec.ts
autonomous: true
requirements: [e2e-fix]

must_haves:
  truths:
    - "All 12 e2e test suites pass (124/124 tests)"
    - "Portal tests do not hit 429 rate limit during execution"
    - "Auth refresh and role tests pass with correct status codes"
    - "Rentals and customers GET endpoints tested against paginated response shape"
  artifacts:
    - path: "apps/api/test/portal.e2e-spec.ts"
      provides: "Portal e2e tests with rate limit bypass"
    - path: "apps/api/test/auth.e2e-spec.ts"
      provides: "Auth e2e tests with correct refresh/role assertions"
    - path: "apps/api/test/rentals.e2e-spec.ts"
      provides: "Rentals e2e tests using paginated response shape"
    - path: "apps/api/test/customers.e2e-spec.ts"
      provides: "Customers e2e tests using paginated response shape"
  key_links:
    - from: "apps/api/test/portal.e2e-spec.ts"
      to: "Redis rate limit keys"
      via: "redis.flushdb() or del throttler keys before each exchange call"
      pattern: "redis\\.(flushdb|del)"
    - from: "apps/api/test/rentals.e2e-spec.ts"
      to: "GET /rentals paginated response"
      via: "res.body.data instead of res.body"
      pattern: "res\\.body\\.data"
---

<objective>
Fix all 4 pre-existing e2e test failures so the full e2e suite passes 124/124.

Purpose: Establish green baseline for all e2e tests after Phase 22 pagination refactoring and Phase 20 portal rate limiting changes.
Output: All 4 test files updated with correct assertions matching current API response shapes and rate limit handling.
</objective>

<execution_context>
@/Users/antonio/.claude/get-shit-done/workflows/execute-plan.md
@/Users/antonio/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/260328-otq-configure-and-run-application-tests-unit/260328-otq-SUMMARY.md

<interfaces>
<!-- Current API response shapes from service layer -->

From apps/api/src/rentals/rentals.service.ts (findAll):
```typescript
async findAll(query: RentalsQueryDto): Promise<{ data: RentalWithRelations[]; total: number; page: number; limit: number }>
```

From apps/api/src/customers/customers.service.ts (findAll):
```typescript
async findAll(query: CustomersQueryDto): Promise<{ data: CustomerDto[]; total: number; page: number; limit: number }>
```

From apps/api/src/portal/portal-auth.controller.ts:
```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 req/min on exchange endpoint
```

From apps/api/src/auth/auth.controller.ts:
```typescript
@Public()
@Post('refresh')
async refresh(@Body() dto: RefreshTokenDto, @Headers('authorization') authHeader: string)
// extracts userId from expired token via decode (no verify)
```

From apps/api/src/app.module.ts:
```typescript
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])  // global 100 req/min
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix portal rate limit and auth JWT test failures</name>
  <files>apps/api/test/portal.e2e-spec.ts, apps/api/test/auth.e2e-spec.ts</files>
  <action>
**Portal suite (7 tests) -- 429 rate limit fix:**

The portal exchange endpoint has `@Throttle({ default: { limit: 5, ttl: 60000 } })`. The `getPortalJwt()` helper is called 6+ times across tests, exceeding the 5 req/min limit.

Fix: In the portal test's `beforeAll`, after `redis = new Redis(process.env.REDIS_URL!)`, store the redis instance. Then modify `getPortalJwt()` to flush the throttler keys before each exchange call by deleting all keys matching the throttler pattern. The simplest approach: call `await redis.flushdb()` inside `getPortalJwt()` BEFORE the exchange POST (but AFTER generating the token via portalService). Alternatively, delete just `throttler:*` keys with `const keys = await redis.keys('*throttler*'); if (keys.length) await redis.del(...keys);`. The `redis.flushdb()` approach is simpler since each test already calls `redis.flushdb()` in beforeAll -- but it might clear refresh tokens. Use the targeted key deletion approach:

```typescript
async function getPortalJwt(forCustomerId: string): Promise<string> {
  const portalUrl = await portalService.generatePortalToken(forCustomerId);
  const urlObj = new URL(portalUrl);
  const rawToken = urlObj.searchParams.get('token')!;

  // Clear rate-limit keys to avoid 429 during rapid test execution
  const throttlerKeys = await redis.keys('*throttler*');
  if (throttlerKeys.length > 0) await redis.del(...throttlerKeys);

  const res = await request(app.getHttpServer())
    .post('/portal/auth/exchange')
    .send({ token: rawToken, customerId: forCustomerId })
    .expect(200);

  return res.body.accessToken;
}
```

Also clear throttler keys before the first 4 direct exchange tests (lines 291-352) that don't use `getPortalJwt`. Add a `beforeEach` to the exchange describe block:

```typescript
describe('POST /portal/auth/exchange', () => {
  beforeEach(async () => {
    const throttlerKeys = await redis.keys('*throttler*');
    if (throttlerKeys.length > 0) await redis.del(...throttlerKeys);
  });
  // ... existing tests
});
```

**Auth suite (4 tests) -- refresh and role fix:**

Run the auth tests first to see exact error messages. The likely issues are:

(a) **Refresh returns 400**: Check if the `ValidationPipe({ whitelist: true })` without `transform: true` is stripping or failing to validate fields. The auth test at line 45 uses `new ValidationPipe({ whitelist: true })` while other passing tests use `new ValidationPipe({ whitelist: true, transform: true })`. Add `transform: true` to the auth test's ValidationPipe to match the production config pattern used by other test files.

(b) **POST /users returns 401 instead of 403**: This means the JWT token from loginAdmin() is not being accepted by the JwtGuard. Check if the auth test's `loginAdmin()` returns a valid token. Ensure the test env has matching `JWT_ACCESS_SECRET`. The issue may be that the token is signed with a secret that doesn't match what JwtStrategy reads. Run the test and examine the actual error. If the JWT is valid but there's a rate limit issue (auth controller has `@Throttle({ default: { limit: 10, ttl: 60000 } })`), add redis throttler key clearing in the auth test as well.

Add to auth test's `beforeAll` after redis setup: flush throttler keys. Also add `transform: true` to the ValidationPipe:

```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

If the auth tests still fail after these changes, investigate the actual error response body to determine the root cause and fix accordingly. The executor MUST run the tests and read the actual error output before applying fixes.
  </action>
  <verify>
    <automated>cd apps/api && npx jest --config test/jest-e2e.json --testPathPattern="portal.e2e|auth.e2e" --verbose --no-coverage 2>&1 | tail -30</automated>
  </verify>
  <done>All 7 portal tests and all 4 auth tests (previously: 13 tests, now categorized as ~15 including lockout/setup/reset) pass without 429 or 401/400 errors</done>
</task>

<task type="auto">
  <name>Task 2: Fix rentals and customers pagination response shape assertions</name>
  <files>apps/api/test/rentals.e2e-spec.ts, apps/api/test/customers.e2e-spec.ts</files>
  <action>
**Customers suite (1 test) -- paginated response fix:**

The test `GET /customers returns array with decrypted PII` (line 225-240) expects:
```typescript
expect(Array.isArray(res.body)).toBe(true);
expect(res.body.length).toBe(1);
expect(res.body[0].pesel).toBe(VALID_PESEL);
```

But `GET /customers` now returns `{ data: CustomerDto[], total: number, page: number, limit: number }`.

Update to:
```typescript
expect(res.body).toHaveProperty('data');
expect(res.body).toHaveProperty('total');
expect(res.body).toHaveProperty('page');
expect(Array.isArray(res.body.data)).toBe(true);
expect(res.body.data.length).toBe(1);
expect(res.body.total).toBe(1);
expect(res.body.data[0].pesel).toBe(VALID_PESEL);
```

**Rentals suite (2 tests) -- paginated response fix:**

Test 1: `GET /rentals > should list rentals` (line 289-298) expects:
```typescript
expect(Array.isArray(res.body)).toBe(true);
expect(res.body.length).toBeGreaterThanOrEqual(1);
```

Update to:
```typescript
expect(res.body).toHaveProperty('data');
expect(res.body).toHaveProperty('total');
expect(Array.isArray(res.body.data)).toBe(true);
expect(res.body.data.length).toBeGreaterThanOrEqual(1);
```

Test 2: `GET /rentals/:id > should return rental by id with vehicle and customer` (line 321-338) gets a rental ID from the list endpoint:
```typescript
const rentalId = listRes.body[0].id;
```

Update to:
```typescript
const rentalId = listRes.body.data[0].id;
```

These are the only assertions that need updating. All other rental tests (POST, PATCH activate/return/extend/rollback, calendar) use direct endpoint responses that haven't changed.
  </action>
  <verify>
    <automated>cd apps/api && npx jest --config test/jest-e2e.json --testPathPattern="rentals.e2e|customers.e2e" --verbose --no-coverage 2>&1 | tail -30</automated>
  </verify>
  <done>All 2 rentals tests and 1 customers test that were failing now pass. Full rentals suite passes all tests, full customers suite passes all tests.</done>
</task>

<task type="auto">
  <name>Task 3: Run full e2e suite to confirm 124/124 green</name>
  <files></files>
  <action>
Run the complete e2e test suite to confirm all 12 suites and 124 tests pass:

```bash
cd apps/api && npx jest --config test/jest-e2e.json --verbose --no-coverage
```

If any tests still fail, debug and fix. Common issues to watch for:
- Rate limit 429s in other suites (add throttler key clearing if needed)
- Stale data from parallel test execution (ensure proper cleanup)
- Port conflicts from previous test runs

If all tests pass, also verify the API starts correctly:
```bash
cd apps/api && npx nest build && timeout 15 node dist/main.js &
sleep 5
curl -s http://localhost:3000/health | jq .
kill %1
```

Expected: `{ "status": "ok" }` from health endpoint.
  </action>
  <verify>
    <automated>cd apps/api && npx jest --config test/jest-e2e.json --no-coverage 2>&1 | grep -E "Test Suites:|Tests:" | head -2</automated>
  </verify>
  <done>All 12 e2e test suites pass (124/124 tests). API starts and responds to health check.</done>
</task>

</tasks>

<verification>
- `cd apps/api && npx jest --config test/jest-e2e.json --no-coverage` shows 12 suites, 124 tests passing
- No 429 Too Many Requests errors in portal tests
- No 400/401 unexpected status codes in auth tests
- Rentals and customers tests use `res.body.data` for paginated endpoints
</verification>

<success_criteria>
- 12/12 e2e test suites passing
- 124/124 individual tests passing
- Zero test failures from rate limiting, pagination response shape, or JWT validation
- API health endpoint returns 200
</success_criteria>

<output>
After completion, create `.planning/quick/260328-plc-fix-4-pre-existing-e2e-test-failures-and/260328-plc-SUMMARY.md`
</output>
