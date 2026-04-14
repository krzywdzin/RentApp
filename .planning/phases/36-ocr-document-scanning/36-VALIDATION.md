---
phase: 36
slug: ocr-document-scanning
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 36 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (API), jest + React Testing Library (mobile) |
| **Config file** | `apps/api/jest.config.ts`, `apps/mobile/jest.config.ts` |
| **Quick run command** | `pnpm --filter api test -- --passWithNoTests` |
| **Full suite command** | `pnpm --filter api test && pnpm --filter mobile test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter api test -- --passWithNoTests`
- **After every plan wave:** Run `pnpm --filter api test && pnpm --filter mobile test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 36-01-01 | 01 | 1 | DOC-06 | unit | `pnpm --filter api test -- documents.service` | ❌ W0 | ⬜ pending |
| 36-01-02 | 01 | 1 | DOC-01,DOC-02,DOC-06 | unit | `pnpm --filter api test -- documents.service` | ❌ W0 | ⬜ pending |
| 36-02-01 | 02 | 2 | DOC-01,DOC-02 | unit+manual | `pnpm --filter mobile test -- ocr/__tests__` (parsers); camera capture is manual | ❌ W0 | ⬜ pending |
| 36-02-02 | 02 | 2 | DOC-03,DOC-04 | unit | `pnpm --filter mobile test -- ocr/__tests__` | ❌ W0 | ⬜ pending |
| 36-02-03 | 02 | 2 | DOC-05 | manual | N/A (confirmation screen UI) | N/A | ⬜ pending |
| 36-03-01 | 03 | 2 | DOC-06 | manual | N/A (admin panel UI) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/documents/documents.service.spec.ts` — stubs for DOC-06 (upload, storage, retrieval) — created by Plan 01 Task 2
- [ ] `apps/mobile/src/lib/ocr/__tests__/parse-id-card.test.ts` — stubs for DOC-03 (ID card OCR extraction)
- [ ] `apps/mobile/src/lib/ocr/__tests__/parse-driver-license.test.ts` — stubs for DOC-04 (license OCR extraction)

*Existing test infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Camera capture with guide overlay | DOC-01, DOC-02 | Requires physical device camera | Open rental wizard → customer step → tap "Skanuj dowod" → verify overlay appears, photo captures |
| OCR extraction accuracy on real documents | DOC-03, DOC-04 | Requires real document images + ML Kit runtime | Capture ID card photo → verify fields populate on confirmation screen |
| Confirmation screen field editing | DOC-05 | UI interaction on device | After OCR → modify a field → submit → verify corrected data saved |
| Document photos in admin panel | DOC-06 | Web panel UI | Open customer detail → verify "Dokumenty" section shows thumbnails |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
