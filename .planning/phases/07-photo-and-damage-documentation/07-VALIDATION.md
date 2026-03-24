---
phase: 7
slug: photo-and-damage-documentation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | apps/api/jest.config.ts, apps/api/test/jest-e2e.json |
| **Quick run command** | `cd apps/api && npx jest --testPathPattern=photo\|damage --passWithNoTests` |
| **Full suite command** | `cd apps/api && npx jest --passWithNoTests && npx jest --config test/jest-e2e.json --passWithNoTests` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx jest --testPathPattern=photo\|damage --passWithNoTests`
- **After every plan wave:** Run `cd apps/api && npx jest --passWithNoTests && npx jest --config test/jest-e2e.json --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | PHOTO-01 | unit | `npx jest --testPathPattern=photo-walkthrough` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | PHOTO-02 | unit | `npx jest --testPathPattern=photo-walkthrough` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | DMG-01 | unit | `npx jest --testPathPattern=damage` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | DMG-02 | unit | `npx jest --testPathPattern=damage` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | PHOTO-03 | e2e | `npx jest --config test/jest-e2e.json --testPathPattern=photo` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | DMG-01,DMG-02 | e2e | `npx jest --config test/jest-e2e.json --testPathPattern=damage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/photos/photos.service.spec.ts` — stubs for PHOTO-01, PHOTO-02
- [ ] `apps/api/src/damage/damage.service.spec.ts` — stubs for DMG-01, DMG-02
- [ ] `apps/api/test/photos.e2e-spec.ts` — stubs for PHOTO-03 (side-by-side comparison)
- [ ] `apps/api/test/damage.e2e-spec.ts` — stubs for DMG-01, DMG-02 (diagram endpoints)
- [ ] `sharp` and `exifr` packages installed

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SVG tap-to-pin interaction | DMG-01 | Mobile touch interaction requires device testing | Open mobile app, tap on SVG diagram, verify pin placement and modal |
| Photo wizard step-by-step flow | PHOTO-01 | Camera integration requires device | Walk through all 8 positions on mobile device |
| GPS metadata capture | PHOTO-02 | Requires real GPS hardware | Take photo outdoors, verify GPS coordinates in metadata |
| Side-by-side photo comparison UI | PHOTO-03 | Visual layout verification | Compare handover vs return photos in mobile and admin panel |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
