---
status: awaiting_human_verify
trigger: "Signature draws ~2cm offset from actual finger position (right and down)"
created: 2026-03-31T10:00:00Z
updated: 2026-03-31T10:30:00Z
---

## Current Focus

hypothesis: Canvas intrinsic dimensions set at wrong time - resizeCanvas() called before landscape orientation lock completes, causing wrong ratio between CSS size and canvas pixel dimensions
test: Add window.resize listener to call resizeCanvas, OR delay resizeCanvas until layout is stable
expecting: Fixing the resize timing will align touch coordinates with drawing position
next_action: Modify webStyle to add resize listener that calls resizeCanvas on orientation change

## Symptoms

expected: Signature should draw exactly where finger touches the canvas
actual: Signature draws ~2cm offset to the right and down from finger position
errors: No error messages, visual offset only
reproduction: Open signature screen, try to sign - drawing appears offset from touch point
started: Regression - was fixed before but broke again

## Eliminated

## Evidence

- timestamp: 2026-03-31T10:01:00Z
  checked: SignatureScreen.tsx code structure
  found: Canvas container has marginHorizontal: 16 (line 164) which shifts the WebView position
  implication: Touch coordinates in WebView are relative to WebView origin, but visual position is offset by margin - this could cause offset

- timestamp: 2026-03-31T10:05:00Z
  checked: react-native-signature-canvas library source (index.js, h5/html.js, h5/js/app.js, h5/js/signature_pad.js)
  found: SignaturePad._createPoint uses canvas.getBoundingClientRect() to convert touch coords. resizeCanvas() sets canvas.width/height based on clientWidth/Height * devicePixelRatio and applies context.scale(ratio, ratio)
  implication: If resizeCanvas() is not called at the right time, canvas dimensions could mismatch causing coordinate offset

- timestamp: 2026-03-31T10:06:00Z
  checked: resizeCanvas() call location in app.js
  found: resizeCanvas() is only called ONCE at initialization (line 49 in app.js). There is NO window resize listener
  implication: If WebView dimensions change after initial load (e.g., due to landscape orientation lock), canvas won't resize and coordinates will be wrong

- timestamp: 2026-03-31T10:15:00Z
  checked: Race condition between orientation lock and WebView initialization
  found: SignatureScreen locks to landscape in useEffect on mount, but WebView also mounts immediately. The orientation change is async and may complete AFTER WebView calls resizeCanvas()
  implication: CONFIRMED ROOT CAUSE - WebView initializes with portrait dimensions, then screen rotates to landscape. Canvas intrinsic dimensions are based on portrait size, but CSS stretches to landscape. Touch coordinates dont match drawing coordinates

## Resolution

root_cause: Race condition between orientation lock and WebView initialization. The SignatureCanvas WebView was mounting and calling resizeCanvas() with portrait-mode dimensions before the landscape orientation lock completed. When the screen rotated to landscape, the canvas CSS size changed but the canvas intrinsic dimensions remained portrait-sized. This caused a mismatch where touch coordinates (relative to CSS box) did not map correctly to canvas drawing coordinates.

fix: Delay rendering SignatureCanvas until AFTER the orientation lock is confirmed. Added isLandscape state that starts false and is set to true only after ScreenOrientation.lockAsync() completes plus a 100ms stabilization delay. The SignatureCanvas is conditionally rendered only when isLandscape is true. A loading indicator is shown while waiting.

verification: Code compiles (tsc --noEmit), no new lint errors. Needs human verification on device.
files_changed: ["apps/mobile/src/components/SignatureScreen.tsx"]
