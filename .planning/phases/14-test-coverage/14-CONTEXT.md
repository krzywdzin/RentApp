# Phase 14: Test Coverage - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Add automated test coverage for critical UI paths and enforce API coverage thresholds. Web admin gets component tests (Vitest + React Testing Library), mobile gets smoke tests (jest-expo + RNTL), and API gets coverage thresholds in Jest config. No new features.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure/testing phase.

**Web Admin Tests (TEST-01):**
- Set up Vitest + React Testing Library + jsdom for apps/web
- Create component tests for 4 critical pages: dashboard, rental list, vehicle list, customer list
- Tests verify: component renders without crash, key UI elements present, loading states shown, error states shown
- Mock API calls with MSW or simple query client wrapper
- Test files colocated next to pages or in __tests__ directory

**Mobile Smoke Tests (TEST-02):**
- Use existing jest-expo + @testing-library/react-native (already installed as devDependencies)
- Create jest.config.js if not present (based on jest-expo preset)
- Smoke tests for: login screen, dashboard, rental list, at least one wizard step
- Tests verify: component renders without crash (no thrown errors)
- Mock expo-router, async-storage, and API client

**API Coverage Thresholds (TEST-03):**
- Add coverageThreshold to apps/api/jest.config.ts
- Set minimum statement coverage (e.g., 60% as starting point — can be raised later)
- Ensure `npm test` in apps/api fails if coverage drops below threshold
- Add --coverage flag to test script or configure collectCoverage in jest config

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- apps/api already has 23 unit test files and 12 e2e test files with Jest
- apps/mobile has jest-expo and @testing-library/react-native in devDependencies but no test files
- apps/web has no test infrastructure at all

### Established Patterns
- API tests: Jest 29 + ts-jest + @nestjs/testing + supertest
- API jest.config.ts exists with moduleNameMapper and collectCoverageFrom
- Mobile has jest-expo preset available

### Integration Points
- apps/web/package.json — add vitest, @testing-library/react, jsdom devDependencies
- apps/web/vitest.config.ts — new config file
- apps/api/jest.config.ts — add coverageThreshold
- apps/mobile/jest.config.js — create or verify config

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard test infrastructure setup.

</specifics>

<deferred>
## Deferred Ideas

- Full E2E tests with Playwright — too heavy for v1.1
- Visual regression tests — future milestone

</deferred>
