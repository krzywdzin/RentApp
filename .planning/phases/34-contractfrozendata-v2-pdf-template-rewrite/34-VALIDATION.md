---
phase: 34
slug: contractfrozendata-v2-pdf-template-rewrite
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 34 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (API), vitest (shared) |
| **Config file** | `apps/api/jest.config.ts`, `packages/shared/vitest.config.ts` |
| **Quick run command** | `pnpm --filter api test -- --testPathPattern` |
| **Full suite command** | `pnpm --filter api test && pnpm --filter shared test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick test for modified module
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 34-01-01 | 01 | 1 | UMOWA-01..04 | unit | `pnpm --filter api test -- --testPathPattern app-settings` | ❌ W0 | ⬜ pending |
| 34-01-02 | 01 | 1 | NAJEM-05..07 | unit | `pnpm --filter api test -- --testPathPattern rental-driver` | ❌ W0 | ⬜ pending |
| 34-02-01 | 02 | 2 | KLIENT-05, FLOTA-04..05, UMOWA-01..04 | unit | `pnpm --filter api test -- --testPathPattern contracts` | ✅ exists | ⬜ pending |
| 34-03-01 | 03 | 2 | NAJEM-05..07 | integration | `pnpm --filter api test -- --testPathPattern cepik` | ✅ exists | ⬜ pending |
| 34-04-01 | 04 | 3 | UMOWA-03 | grep | `grep -c "termsAcceptedAt" apps/mobile/app/(tabs)/new-rental/signatures.tsx` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] AppSettings service spec (new module)
- [ ] RentalDriver service spec (new module)
- [ ] ContractFrozenData v2 builder tests

*Existing test infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF renders company/NIP correctly | KLIENT-05 | Visual PDF output | Generate contract for company rental, open PDF, verify NIP visible |
| PDF hides VIN/year | FLOTA-04, FLOTA-05 | Visual PDF output | Generate contract, verify no VIN or year in PDF |
| TipTap editor saves/loads terms | UMOWA-01 | Rich text editor UX | Edit default terms in web panel, verify HTML saved correctly |
| Terms display in mobile WebView | UMOWA-02 | Mobile WebView rendering | Create rental in mobile, verify terms appear in WebView |
| Terms acceptance checkbox blocks signing | UMOWA-03 | Mobile interaction flow | Try to sign without checkbox, verify blocked |
| Second driver appears in PDF | NAJEM-07 | Visual PDF output | Add second driver, generate contract, verify section in PDF |
| Second driver signature capture | NAJEM-05 | Mobile signature flow | Add second driver, verify additional signature steps appear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
