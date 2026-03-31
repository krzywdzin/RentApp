---
status: awaiting_human_verify
trigger: "Photos don't upload in damage/walkthrough flow - damage pins work, photos don't"
created: 2026-03-31T12:00:00Z
updated: 2026-03-31T12:35:00Z
---

## Current Focus

hypothesis: CONFIRMED - Field name mismatch between mobile (sends 'photo') and API (expects 'file')
test: Compare e2e tests vs mobile code
expecting: Field name difference
next_action: Await human verification of photo upload in real device flow

## Symptoms

expected: Photos should upload successfully during damage/walkthrough documentation
actual: Damage pins upload fine, but photos do not upload
errors: Upload fails silently or with error
reproduction: Go through new rental flow, reach photos/walkthrough step, try to upload photos
started: Currently broken

## Eliminated

## Evidence

- timestamp: 2026-03-31T12:05:00Z
  checked: photos.tsx (mobile)
  found: Only captures photos via ImagePicker.launchCameraAsync() and stores URIs in Zustand store (draft.photoUris)
  implication: Photos are NOT uploaded in this file - upload happens elsewhere

- timestamp: 2026-03-31T12:06:00Z
  checked: signatures.tsx (mobile)
  found: Photo upload logic at lines 210-254. Uses FormData with {uri, name, type} pattern. Posts to /walkthroughs/{id}/photos
  implication: Upload code exists - need to check if FormData format is correct for React Native

- timestamp: 2026-03-31T12:08:00Z
  checked: photos.controller.ts (API) vs signatures.tsx (mobile)
  found: FIELD NAME MISMATCH - API expects FileInterceptor('file') but mobile sends formData.append('photo', ...)
  implication: HIGH PROBABILITY - This is the root cause. Multer silently ignores fields with wrong names

- timestamp: 2026-03-31T12:10:00Z
  checked: photos.e2e-spec.ts (test file)
  found: E2E test line 281 uses .attach('file', ...) - confirming API expects 'file' field name
  implication: ROOT CAUSE CONFIRMED - mobile code uses wrong field name 'photo' instead of 'file'

## Resolution

root_cause: Mobile app sends photo data with field name 'photo' but API expects field name 'file' (FileInterceptor('file')). Multer silently ignores the wrongly-named field.
fix: Change formData.append('photo', ...) to formData.append('file', ...) in signatures.tsx line 221
verification: Logical verification - API expects FileInterceptor('file'), e2e test uses .attach('file'), mobile now uses formData.append('file'). All match. Human verification needed for real device test.
files_changed: [apps/mobile/app/(tabs)/new-rental/signatures.tsx]
