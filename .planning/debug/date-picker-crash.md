---
status: awaiting_human_verify
trigger: "Date picker crashes app when changing rental duration from default 24h"
created: 2026-03-31T12:00:00Z
updated: 2026-03-31T12:10:00Z
---

## Current Focus

hypothesis: iOS DateTimePicker 8.4.x has known bug (issue #996) - EXC_ARITHMETIC crash with minimumDate prop
test: Check if minimumDate prop is causing the crash and if removing/adjusting it fixes the issue
expecting: The minimumDate prop on line 217 and 226 triggers the known iOS crash
next_action: Design fix that avoids the minimumDate crash while maintaining date validation

## Symptoms

expected: Changing rental duration should update the dates without crashing
actual: App crashes when changing rental duration from default 24h
errors: Crash on date change in rental wizard
reproduction: Open new rental wizard, go to dates step, try to change duration from 24h
started: Currently broken

## Eliminated

## Evidence

- timestamp: 2026-03-31T12:01:00Z
  checked: dates.tsx full file
  found: DateTimePicker moved outside ScrollView (prior fix). Pickers use startDate/endDate from watch(). handleStartDateChange has dependency on endDate from watch().
  implication: The endDate in handleStartDateChange callback may be stale due to closure over watch() value

- timestamp: 2026-03-31T12:02:00Z
  checked: rental-draft.store.ts
  found: Store has startDate/endDate as string|null. dates.tsx converts to Date objects with fallback to new Date() if null.
  implication: Store is not the issue - conversion happens in dates.tsx

- timestamp: 2026-03-31T12:03:00Z
  checked: git history for dates.tsx
  found: Commit 795099c moved pickers outside ScrollView to fix iOS crash. The crash was caused by UIDatePicker conflicting with ScrollView touch events.
  implication: Prior fix addressed ScrollView conflict but issue persists - different root cause

- timestamp: 2026-03-31T12:04:00Z
  checked: Web search for iOS spinner crash issues
  found: Known issues with iOS DateTimePicker spinner: (1) crashes on rapid date changes (NSGenericException), (2) issues with min/max date props on iOS, (3) onChange deprecated in favor of onValueChange
  implication: The issue may be related to prop updates during interaction or minimumDate calculation

- timestamp: 2026-03-31T12:05:00Z
  checked: GitHub issue search for datetimepicker 8.4 minimumDate crash
  found: Issue #996 - EXC_ARITHMETIC crash when minimumDate prop is used on iOS in version 8.4.3. Issue #951 - crash when showing timePicker after hiding datePicker with minimumDate set.
  implication: STRONG EVIDENCE - minimumDate prop on iOS causes crashes in datetimepicker 8.4.x

## Resolution

root_cause: iOS DateTimePicker 8.4.x has a known bug (GitHub issue #996) where using minimumDate prop causes EXC_ARITHMETIC crash. Lines 217 and 226 use minimumDate which triggers this crash when user interacts with the picker.
fix: Remove minimumDate prop from iOS pickers (keep on Android for UX) and validate date constraints in onChange handlers instead. Show toast if user selects invalid date.
verification: TypeScript compiles without errors. Awaiting human verification on iOS device.
files_changed: [apps/mobile/app/(tabs)/new-rental/dates.tsx]
