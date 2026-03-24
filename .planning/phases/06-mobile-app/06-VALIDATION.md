---
phase: 06
slug: mobile-app
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest (unit via react-native preset) |
| **Config file** | `apps/mobile/package.json` |
| **Quick run command** | `cd apps/mobile && npx expo export --platform web` |
| **Full suite command** | `cd apps/mobile && npx tsc --noEmit && npx expo export --platform web` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/mobile && npx tsc --noEmit`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Wave 0 Requirements

- [ ] `apps/mobile/` directory scaffold with Expo SDK 52
- [ ] `apps/mobile/package.json` with dependencies
- [ ] `npx tsc --noEmit` passes with empty app

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Signature canvas UX | MOB-02 | Requires physical device | Draw signature on canvas, verify PNG quality |
| Camera capture | MOB-02 | Requires device camera | Take photo, verify upload to MinIO |
| Login persistence | MOB-01 | Requires app restart | Login, force-close, reopen — verify session persists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
