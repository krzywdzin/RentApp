---
phase: quick
plan: 260328-otq
type: execute
wave: 1
depends_on: []
files_modified: [apps/api/.env, .env]
autonomous: false
must_haves:
  truths:
    - "API unit tests run and pass with jest"
    - "Web unit tests run and pass with vitest"
    - "API e2e tests run against local PostgreSQL and pass"
  artifacts:
    - path: "apps/api/coverage"
      provides: "API test coverage report"
    - path: "apps/web/coverage"
      provides: "Web test coverage report"
  key_links:
    - from: "docker-compose.yml"
      to: "apps/api/.env DATABASE_URL"
      via: "local postgres on port 5432"
      pattern: "localhost:5432"
---

<objective>
Configure and run all application tests: API unit tests (jest), web unit tests (vitest), and API e2e tests (jest + local DB).

Purpose: Verify the full test suite passes and identify any broken tests or missing configuration.
Output: All test suites green, coverage reports generated.
</objective>

<execution_context>
@/Users/antonio/.claude/get-shit-done/workflows/execute-plan.md
@/Users/antonio/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@docker-compose.yml
@apps/api/jest.config.ts
@apps/api/test/jest-e2e.json
@apps/web/vitest.config.ts
@.env.example
</context>

<tasks>

<task type="auto">
  <name>Task 1: Start local infrastructure and configure env for local DB</name>
  <files>apps/api/.env, .env</files>
  <action>
1. The current .env files point to remote Neon DB and Upstash Redis. For running tests locally, we need local services.

2. Start docker-compose services (postgres, redis, minio, mailpit):
   ```
   docker compose up -d
   ```
   Wait for health checks to pass (postgres, redis, minio).

3. Create a backup of the current apps/api/.env (copy to apps/api/.env.remote-backup) and root .env (copy to .env.remote-backup).

4. Update apps/api/.env to use local services:
   - DATABASE_URL=postgresql://rentapp:rentapp@localhost:5432/rentapp?schema=public
   - REDIS_URL=redis://localhost:6379
   Keep all other values the same.

5. Update root .env similarly for DATABASE_URL and REDIS_URL.

6. Run prisma migrate deploy to set up the local database schema:
   ```
   cd apps/api && npx prisma migrate deploy
   ```

7. Verify DB connection works:
   ```
   cd apps/api && npx prisma db execute --stdin <<< "SELECT 1"
   ```
  </action>
  <verify>
    <automated>docker compose ps --format json | head -10 && cd apps/api && npx prisma db execute --stdin <<< "SELECT 1"</automated>
  </verify>
  <done>Docker services running (postgres, redis, minio, mailpit), local DB migrated, .env files pointing to local services</done>
</task>

<task type="auto">
  <name>Task 2: Run unit tests for API and Web</name>
  <files></files>
  <action>
1. Run API unit tests with coverage:
   ```
   cd apps/api && pnpm test
   ```
   This runs `jest --coverage` against src/**/*.spec.ts files.
   The coverage threshold is 35% statements.

2. Run Web unit tests with coverage:
   ```
   cd apps/web && pnpm test
   ```
   This runs `vitest run` against src/**/*.test.{ts,tsx} files.
   The coverage threshold is 30% statements.

3. Capture output of both runs. If any tests fail, diagnose the root cause:
   - Missing mocks or outdated imports
   - Type mismatches from recent refactoring (Phase 26 changes)
   - Missing environment variables

4. If tests fail due to fixable issues (e.g., import paths changed), fix them. If they fail due to environmental issues, document what needs to change.
  </action>
  <verify>
    <automated>cd /Users/antonio/Documents/RentApp/apps/api && pnpm test 2>&1 | tail -20 && echo "---WEB---" && cd /Users/antonio/Documents/RentApp/apps/web && pnpm test 2>&1 | tail -20</automated>
  </verify>
  <done>API unit tests pass with 35%+ statement coverage. Web unit tests pass with 30%+ statement coverage. Any failures documented with root cause.</done>
</task>

<task type="auto">
  <name>Task 3: Run API e2e tests against local database</name>
  <files></files>
  <action>
1. Ensure local postgres is running and migrated (from Task 1).

2. Run API e2e tests:
   ```
   cd apps/api && pnpm test:e2e
   ```
   This runs jest with test/jest-e2e.json config against test/*.e2e-spec.ts files.
   E2e tests run with maxWorkers=1 (sequential).

3. E2e tests may need:
   - A running API server (check if tests bootstrap NestJS app internally via TestingModule)
   - Seed data or clean DB between tests
   - Redis connection for session/cache tests

4. If tests fail, diagnose:
   - Connection issues: verify DATABASE_URL points to local postgres
   - Missing services: ensure redis, minio are running
   - Timeout issues: e2e tests may need longer timeout
   - Schema issues: ensure migrations are up to date

5. Document results: which tests pass, which fail, and why.
  </action>
  <verify>
    <automated>cd /Users/antonio/Documents/RentApp/apps/api && pnpm test:e2e 2>&1 | tail -30</automated>
  </verify>
  <done>E2e test results documented. Passing tests confirmed, failing tests diagnosed with clear root cause and fix path.</done>
</task>

</tasks>

<verification>
- `docker compose ps` shows all 4 services healthy
- `pnpm test` in apps/api exits 0 with coverage above 35%
- `pnpm test` in apps/web exits 0 with coverage above 30%
- `pnpm test:e2e` in apps/api runs to completion (pass or documented failures)
</verification>

<success_criteria>
- Local infrastructure running via docker-compose
- API unit tests: all passing, coverage report generated
- Web unit tests: all passing, coverage report generated
- API e2e tests: run attempted, results documented
- Any failures have clear diagnosis and fix path
</success_criteria>

<output>
After completion, create `.planning/quick/260328-otq-configure-and-run-application-tests-unit/260328-otq-SUMMARY.md`
</output>
