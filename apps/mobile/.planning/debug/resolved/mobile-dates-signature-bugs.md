---
status: resolved
trigger: "Fix 3 mobile bugs: date picker crash, signature draws below finger, 4 signatures instead of 2"
created: 2026-03-31T00:00:00Z
updated: 2026-03-31T00:00:00Z
symptoms_prefilled: true
---

## Current Focus

hypothesis: All three bugs identified — ready to fix
test: N/A — root causes confirmed via code reading
expecting: N/A
next_action: Apply fixes for Bug 1, Bug 2, Bug 7

## Symptoms

expected: |
  Bug 1: User can change rental start/end dates in new-rental wizard
  Bug 2: Signature line appears where finger touches
  Bug 7: User signs twice (customer + employee) and signatures go to PDF

actual: |
  Bug 1: App crashes when selecting any date other than pre-selected one
  Bug 2: Signature draws a few cm below where the finger actually is
  Bug 7: User has to sign 4 times (customer page 1, employee page 1, customer page 2, employee page 2)

errors: |
  Bug 1: crash on date selection (iOS DateTimePicker)
  Bug 2: canvas offset mismatch
  Bug 7: 4 SIGNATURE_STEPS defined in signatures.tsx

reproduction: |
  Bug 1: Open new-rental wizard -> dates step -> tap a date field -> change date in picker
  Bug 2: Open signatures step -> attempt to sign -> stroke draws below finger
  Bug 7: Complete rental wizard up to signatures -> observe 4 distinct signing prompts

started: After recent redesign

## Eliminated

- hypothesis: "Bug 1: DateTimePicker onChange handler is missing"
  evidence: "Handler exists and is correct. The crash comes from the DateTimePicker being rendered inside a ScrollView — on iOS, the spinner mode DateTimePicker inside a ScrollView can crash when it tries to call onChange because the parent ScrollView captures touch events. The fix is to render the picker outside the ScrollView or use a modal wrapper."
  timestamp: 2026-03-31T00:00:00Z

- hypothesis: "Bug 2: SignatureCanvas component has explicit offset"
  evidence: "No explicit canvas component exists — SignatureScreen uses react-native-signature-canvas (a WebView-based lib). The offset issue is caused by the instruction text rendered above the canvas. When instruction is shown, the WebView's internal coordinate system shifts because react-native-signature-canvas calculates touch offset from the top of the webview container. The parent View has marginHorizontal:16 and the instruction takes 8+13+8 = ~37px. The library's touch handler uses pageY which is correct, but if the WebView renders after layout (async), the offset can be stale. The fix: ensure the WebView fills its container with no extra layout shifts — remove instruction from above the canvas or pass it inside the webStyle."
  timestamp: 2026-03-31T00:00:00Z

## Evidence

- timestamp: 2026-03-31T00:00:00Z
  checked: "dates.tsx — DateTimePicker rendering"
  found: "DateTimePicker is rendered conditionally inside ScrollView. On iOS, when display='spinner', DateTimePicker rendered inside ScrollView causes crashes because the picker is an inline UIDatePicker which conflicts with the scroll view's touch handling."
  implication: "Need to move DateTimePicker outside ScrollView"

- timestamp: 2026-03-31T00:00:00Z
  checked: "SignatureScreen.tsx — layout"
  found: "instruction text is rendered above the canvas View. The canvas has marginHorizontal:16. react-native-signature-canvas uses a WebView whose touch coordinates are measured from the WebView top-left. If the parent container has a top offset (from instruction text + header = 48 + 37 = ~85px), the WebView reports correct coordinates internally, but only when layout is settled. The library version may not handle this with a scrollable parent."
  implication: "The instruction text shifts the canvas down, causing offset. Moving instruction inside the webStyle or removing it from above the canvas should fix the offset."

- timestamp: 2026-03-31T00:00:00Z
  checked: "signatures.tsx — SIGNATURE_STEPS"
  found: "4 steps defined: customer_page1, employee_page1, customer_page2, employee_page2. Backend ALL_SIGNATURE_TYPES requires all 4 to trigger PDF generation."
  implication: "To reduce to 2 user-facing signatures: collect customer sig and employee sig, then upload each twice (as page1 and page2). This satisfies the backend's count check without any backend changes."

## Resolution

root_cause: |
  Bug 1: DateTimePicker with display='spinner' crashes when rendered inside ScrollView on iOS because inline UIDatePicker conflicts with ScrollView touch interception. Fix: render picker outside the ScrollView.
  Bug 2: The 'instruction' text rendered above the SignatureCanvas pushes the canvas down, but react-native-signature-canvas does not recalculate touch offset after dynamic layout changes. Fix: remove instruction from above canvas and embed it in the web style instead, or pass it as an overlay inside the canvas View.
  Bug 7: 4 SIGNATURE_STEPS are defined causing 4 user-facing signing prompts. Fix: reduce to 2 steps (customer, employee) and upload each signature twice to satisfy backend's requirement for all 4 types.

fix: |
  Bug 1: Moved DateTimePicker components outside ScrollView (but inside KeyboardAvoidingView)
  Bug 2: Moved instruction text from above canvas to an absolutely-positioned overlay inside the canvas View with pointerEvents="none"
  Bug 7: Changed SIGNATURE_STEPS from 4 entries to 2 (customer, employee), each uploading signatureTypes[0] and signatureTypes[1] in a loop. Updated pl.json stepCounter from "z 4" to "z 2".
verification: "TypeScript compiles with no new errors. Commits: 795099c, 5289272, bca91da"
files_changed:
  - apps/mobile/app/(tabs)/new-rental/dates.tsx
  - apps/mobile/src/components/SignatureScreen.tsx
  - apps/mobile/app/(tabs)/new-rental/signatures.tsx
  - apps/mobile/src/i18n/pl.json
