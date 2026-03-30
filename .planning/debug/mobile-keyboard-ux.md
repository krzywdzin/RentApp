---
status: awaiting_human_verify
trigger: "Keyboard covers input fields on mobile form screens, scroll issues prevent users from seeing what they type."
created: 2026-03-29T00:00:00Z
updated: 2026-03-29T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Multiple form screens missing KeyboardAvoidingView
test: Audited all 11 screens with input fields
expecting: N/A - root cause confirmed
next_action: Apply fixes to all affected screens

## Symptoms

expected: All form screens should properly handle keyboard appearance - inputs should scroll into view and not be obscured
actual: Keyboard covers input fields, scroll issues on form screens
errors: No errors, UX problem
reproduction: Open any form screen in mobile app, tap an input field near the bottom of the screen
started: Discovered during live testing

## Eliminated

## Evidence

- timestamp: 2026-03-29
  checked: All form screens in mobile app
  found: |
    AUDIT RESULTS:
    1. login.tsx - HAS KeyboardAvoidingView + ScrollView with keyboardShouldPersistTaps. OK but uses flex:1 on scrollContent instead of flexGrow:1.
    2. new-rental/index.tsx (customer step) - Modal with ScrollView but NO KeyboardAvoidingView inside modal. 7 input fields can be covered by keyboard.
    3. new-rental/vehicle.tsx - SearchBar only, uses FlatList. Low risk but no KeyboardAvoidingView.
    4. new-rental/dates.tsx - HAS KeyboardAvoidingView + ScrollView. OK.
    5. new-rental/contract.tsx - HAS KeyboardAvoidingView + ScrollView. OK (no text inputs though).
    6. new-rental/photos.tsx - No text inputs. OK.
    7. new-rental/signatures.tsx - No text inputs (signature pad). OK.
    8. return/[rentalId].tsx - No text inputs. OK.
    9. return/mileage.tsx - HAS ScrollView but NO KeyboardAvoidingView. Input for mileage can be covered.
    10. return/checklist.tsx - HAS ScrollView but NO KeyboardAvoidingView. TextInput for damage notes can be covered.
    11. return/notes.tsx - HAS ScrollView but NO KeyboardAvoidingView. TextArea for notes can be covered.
    12. return/confirm.tsx - No text inputs. OK.
    13. profile.tsx - No text inputs. OK.
  implication: |
    4 screens need KeyboardAvoidingView added:
    - new-rental/index.tsx (inside the Modal)
    - return/mileage.tsx
    - return/checklist.tsx
    - return/notes.tsx
    Plus login.tsx ScrollView contentContainerStyle should use flexGrow instead of flex for proper keyboard scrolling.

## Resolution

root_cause: Multiple form screens with text inputs lack KeyboardAvoidingView wrapping, causing the keyboard to cover input fields when they are focused. Affected screens are new-rental/index.tsx (modal), return/mileage.tsx, return/checklist.tsx, and return/notes.tsx.
fix: Add KeyboardAvoidingView with platform-specific behavior (padding for iOS, height for Android) to all affected screens. Add keyboardShouldPersistTaps="handled" where missing. Fix login.tsx scrollContent to use flexGrow instead of flex. Fix dates.tsx and contract.tsx to use 'height' behavior on Android instead of undefined.
verification: TypeScript compiles with zero errors.
files_changed:
  - apps/mobile/app/(tabs)/new-rental/index.tsx
  - apps/mobile/app/(tabs)/new-rental/dates.tsx
  - apps/mobile/app/(tabs)/new-rental/contract.tsx
  - apps/mobile/app/return/mileage.tsx
  - apps/mobile/app/return/checklist.tsx
  - apps/mobile/app/return/notes.tsx
  - apps/mobile/app/login.tsx
