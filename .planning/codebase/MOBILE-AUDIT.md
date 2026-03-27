# Mobile App Audit

**Analysis Date:** 2026-03-27
**Scope:** `apps/mobile/` — all TypeScript/TSX source files, tests, config

---

## Critical Bugs

### BUG-01: Rental/Contract creation runs again if re-tapped after first-signature failure
**File:** `app/(tabs)/new-rental/signatures.tsx` — lines 100–115

`handleCreateRentalAndContract` is called when `currentIndex === 0 && !activeContractId`. After a failed first attempt the `rentalId` / `contractId` state variables stay `null` (they are set only on success). If the user taps "Zatwierdz podpis" a second time the rental **is created again**, producing a duplicate rental.

**Fix:** Set a local `isCreating` flag or persist failed-creation state so a second tap does not fire a second mutation.

---

### BUG-02: `isSubmitting` state is set but `setIsUploading(false)` executes afterwards in `finally`, leaving `isSubmitting` permanently `true`
**File:** `app/(tabs)/new-rental/signatures.tsx` — lines 164–213

When all 4 signatures succeed the code does `setIsSubmitting(true)` then continues inside the same try block. The `finally` block runs `setIsUploading(false)`, but `setIsSubmitting` is never reset to `false` before navigation. If navigation fails or is slow the UI is stuck in a loading state with no recovery path.

**Fix:** Clear both flags in `finally`, or use a single combined loading flag.

---

### BUG-03: `useEffect` missing `mileageText` in dependency array causes stale restore
**File:** `app/return/mileage.tsx` — lines 31–34

```ts
useEffect(() => {
  if (draftMileage != null && mileageText === '') {
    setMileageText(String(draftMileage));
  }
}, [draftMileage]); // mileageText missing from deps
```

`mileageText` is read inside the effect but not listed as a dependency. React lint rules would flag this. The practical effect is that typing a value and then triggering a re-render via another store update can wipe the typed value by re-running the effect with a stale `mileageText === ''` evaluation.

**Fix:** Add `mileageText` to the dependency array, or initialize `useState` directly from `draftMileage` and remove the effect entirely (the `useState` initializer already does this correctly on line 24).

---

### BUG-04: `useEffect` in `ReturnChecklistScreen` has empty dependency array, ignoring `draftChecklist`
**File:** `app/return/checklist.tsx` — lines 35–46

```ts
useEffect(() => {
  if (Object.keys(draftChecklist).length > 0) {
    // merges draftChecklist into local state
  }
}, []); // draftChecklist missing from deps
```

The effect only runs once on mount. If the user navigates back and `draftChecklist` is updated by another screen, the local state is never re-synced. Additionally, the same merge logic is already performed in the `useState` initializer on lines 23–30, making this `useEffect` entirely redundant.

**Fix:** Remove the `useEffect` entirely; the lazy initializer on `useState` already handles it correctly.

---

### BUG-05: `SearchBar` local state diverges from parent `value` prop on external reset
**File:** `src/components/SearchBar.tsx` — lines 12–13

```ts
const [localValue, setLocalValue] = useState(value);
```

The local state is only initialized from the `value` prop once. If the parent resets `value` to `''` (e.g., navigating back), `localValue` keeps the old text — the clear button shows the old query and the input appears filled. This affects the vehicle search and rental search bars.

**Fix:** Add a `useEffect` that syncs `localValue` when the prop changes, or make the component fully controlled and remove internal debounce state.

---

### BUG-06: Biometric authentication does not navigate to `/login` if `logout()` fails
**File:** `src/providers/AuthProvider.tsx` — lines 51–57

```ts
LocalAuthentication.authenticateAsync({ ... }).then((result) => {
  if (!result.success) {
    useAuthStore.getState().logout(); // async, fire-and-forget
  }
  setBiometricChecked(true);
  setIsReady(true);  // isReady becomes true before logout clears tokens
});
```

`logout()` is `async` but is called without `await`. `setIsReady(true)` executes immediately, so the navigation guard runs while the user is still authenticated — briefly showing protected screens before the state update propagates.

**Fix:** `await` the logout call, or chain `.then(() => { setBiometricChecked(true); setIsReady(true); })`.

---

### BUG-07: Return-wizard navigation guard fires on initial render before `rentalId` is set
**File:** `app/return/mileage.tsx` — lines 37–41, `app/return/checklist.tsx` — lines 48–52, `app/return/confirm.tsx` — lines 30–34

All three screens have:
```ts
useEffect(() => {
  if (!rentalId) {
    router.replace('/(tabs)/rentals');
  }
}, [rentalId, router]);
```

On the very first render `rentalId` is read from the store. If the store has not yet rehydrated from AsyncStorage (Zustand `persist` is async), `rentalId` is transiently `null`, causing an immediate redirect before the actual value is loaded.

**Fix:** Wait for store hydration (`useReturnDraftStore.persist.hasHydrated()`) before the guard fires, or use a "hydrated" gate state.

---

## TypeScript / Type-Safety Issues

### TS-01: Unsafe `as any` casts in three locations
**Files:**
- `app/(tabs)/new-rental/index.tsx` line 100: `router.push(route as any)` — bypasses Expo Router's typed routes
- `app/(tabs)/new-rental/signatures.tsx` line 180: FormData file entry cast `as any` — silences a known React Native limitation but hides the type mismatch
- `src/components/WizardStepper.tsx` line 22: `{ width: \`${progress}%\` as any }` — `width` in RN StyleSheet accepts `DimensionValue` which includes strings; the cast is unnecessary

**Fix:** Use typed Expo Router `href` parameter types; for FormData, create a type declaration file (`react-native-form-data.d.ts`) with an augmented `FormData.append` overload.

---

### TS-02: `err: any` type in signatures step catch block
**File:** `app/(tabs)/new-rental/signatures.tsx` line 105

```ts
} catch (err: any) {
  console.error(...);
  Toast.show({ text2: err?.response?.data?.message ?? ... });
```

`catch (err: any)` turns off all type checking on the error object. The access chain `err?.response?.data?.message` is not type-guarded.

**Fix:** Type the error as `unknown` and narrow it, or use an Axios error guard (`isAxiosError(err)`).

---

### TS-03: `useLocalSearchParams` may return `undefined` for `id`
**File:** `app/(tabs)/rentals/[id].tsx` line 15, 18

```ts
const { id } = useLocalSearchParams<{ id: string }>();
// ...
const { data: rental, ... } = useRental(id ?? '');
```

Passing `''` to `useRental` results in an API call to `/rentals/` (no ID) because `enabled: !!id` is `true` for a non-empty string — but a UUID `id` from `useLocalSearchParams` is always typed as `string | string[]`. The `string[]` case is not handled.

**Fix:** `const safeId = Array.isArray(id) ? id[0] : (id ?? '');`

---

### TS-04: `RentalWithRelations` duplicates fields already present in `RentalDto`
**File:** `src/api/rentals.api.ts` lines 10–27

`RentalWithRelations` extends `RentalDto` and adds inline types for `vehicle` and `customer`. If `RentalDto` from `@rentapp/shared` is updated (e.g., adds `returnData`, `returnMileage`), the inline extension does not automatically inherit the new fields. `rental.returnData` and `rental.returnMileage` are accessed in `app/(tabs)/rentals/[id].tsx` at lines 141–154 but are not declared in `RentalWithRelations`.

**Fix:** Replace the inline extension with proper shared types imported from `@rentapp/shared`.

---

### TS-05: `handleBeforeRemove` event parameter typed manually without import
**Files:** `app/(tabs)/new-rental/_layout.tsx` line 17, `app/return/_layout.tsx` line 19

```ts
(e: { preventDefault: () => void; data: { action: unknown } })
```

This custom inline type works but doesn't match the actual `EventArg` type from `expo-router`/`@react-navigation/native`. If the event shape changes this silently breaks.

**Fix:** Import and use the proper `EventArg` type from `@react-navigation/native`.

---

## Security Concerns

### SEC-01: PDF URL is exposed unauthenticated
**File:** `src/api/contracts.api.ts` lines 37–39

```ts
getPdfUrl: (contractId: string): string => {
  return `${apiClient.defaults.baseURL}/contracts/${contractId}/pdf`;
},
```

`getPdfUrl` returns a plain HTTP URL with no auth header. It is then passed to `Linking.openURL()` in `app/(tabs)/new-rental/success.tsx` line 22. The browser/system PDF viewer opens the URL without the Bearer token, so the endpoint must be public or use a signed URL. If the API requires authentication for PDF access, this will fail silently with a 401 in the browser.

**Recommendation:** Use a server-issued short-lived signed URL, or fetch the PDF as a blob with the auth header and write it to a temp file.

---

### SEC-02: Biometric preference stored in unencrypted AsyncStorage
**File:** `src/stores/auth.store.ts` lines 32–35

The `biometric_enabled` flag is stored in plain `AsyncStorage`. While this is not a secret token, it controls whether the biometric prompt appears. An attacker with file-system access to the device could disable biometric enforcement by writing `false` to this key.

**Recommendation:** Store the biometric preference in `SecureStore` alongside the tokens.

---

### SEC-03: `deviceInfo` field is a hardcoded string
**File:** `app/(tabs)/new-rental/signatures.tsx` line 136

```ts
deviceInfo: 'mobile-app',
```

This is sent to the server as part of signature metadata. It provides no actual device identification, making audit trails meaningless.

**Recommendation:** Use `expo-device` to populate a real device identifier.

---

### SEC-04: `overrideConflict: true` is hardcoded on rental creation
**File:** `app/(tabs)/new-rental/signatures.tsx` line 76

```ts
overrideConflict: true,
```

Rental creation always overrides vehicle availability conflicts silently. The user receives no warning that the vehicle was double-booked.

**Recommendation:** First attempt with `overrideConflict: false`; only set `true` after explicit user confirmation.

---

## Missing Error Handling

### ERR-01: No error state handling in rental detail screen for missing `returnData`
**File:** `app/(tabs)/rentals/[id].tsx` lines 141–155

```ts
{isReturned && rental.returnData && (
  ...
  {rental.returnData.generalNotes && (
```

`rental.returnData` is accessed but not typed on `RentalWithRelations`. If the API returns a rental with `status: 'RETURNED'` but `returnData: null`, the check silently hides the section with no indication to the user that return data is missing.

---

### ERR-02: Photo upload errors are swallowed silently in loop
**File:** `app/(tabs)/new-rental/signatures.tsx` lines 170–196

Individual photo upload failures inside the `for...of` loop cause the `catch (photoError)` at the outer level to fire, which cancels any remaining photos. Each photo that fails is not retried individually; only a generic toast is shown. The partial upload state (some photos uploaded, some not) is not tracked.

---

### ERR-03: `returnRental` API call has no retry logic
**File:** `app/return/confirm.tsx` lines 62–108; `src/hooks/use-rentals.ts` lines 40–49

`useReturnRental` has no `retry` configuration, so a transient network failure on the final submit loses all return wizard data entered by the user. Unlike signatures (which have explicit retry with backoff), the return submit relies on a single attempt.

**Fix:** Add `retry: 2` to the mutation options, or implement retry logic similar to the signature upload pattern.

---

### ERR-04: `authApi.getMe()` call in `initialize()` has no distinction between network error and invalid token
**File:** `src/stores/auth.store.ts` lines 73–86

Both a network outage and an invalid/expired token hit the same `catch` block, which clears all tokens and sets `isAuthenticated: false`. A user who opens the app with a valid token but temporarily offline gets logged out.

**Fix:** Check `isAxiosError(e) && e.response?.status === 401` before clearing tokens.

---

### ERR-05: `Linking.openURL` failure is only caught by a try/catch with a Toast, but no check for `canOpenURL`
**File:** `app/(tabs)/new-rental/success.tsx` lines 19–31

`Linking.canOpenURL` should be called before `Linking.openURL` for non-HTTP schemes, per React Native documentation. For HTTP URLs on modern iOS this is less critical but still good practice.

---

## Missing Input Validation

### VAL-01: Daily rate field accepts non-numeric input silently
**File:** `app/(tabs)/new-rental/dates.tsx` lines 182–196

The `dailyRateNet` input uses `keyboardType="decimal-pad"` but has no Zod schema validation — the form uses manual `handleSubmit` validation (lines 105–112). The `parseFloat` call on line 56 can produce `NaN` if the user enters `"."` or `"1.2.3"`, and `pricing.rateGrosze` becomes `0` with no visual error on the rate field itself.

**Fix:** Add a Zod `z.string().regex(/^\d+(\.\d{1,2})?$/)` rule so `react-hook-form` shows an inline error.

---

### VAL-02: Return mileage allows extremely large values with no upper bound check
**File:** `app/return/mileage.tsx` lines 64–77

Only the lower bound (`returnMileage >= handoverMileage`) is validated. A user can enter `999999999`, which would be accepted and sent to the API.

**Fix:** Add an upper bound check (e.g., `returnMileage - handoverMileage <= 10000`) and show an error for implausible values.

---

### VAL-03: Customer PESEL input has `maxLength={11}` but no PESEL checksum validation
**File:** `app/(tabs)/new-rental/index.tsx` lines 273–287

PESEL has a well-defined checksum algorithm. The field accepts any 11 digits including invalid PESEL numbers.

**Fix:** Add a PESEL validator to the `CreateCustomerSchema` on the shared package, or add a custom `superRefine` rule.

---

### VAL-04: `startDate` minimum is `new Date()` but does not account for already-started rentals on draft resume
**File:** `app/(tabs)/new-rental/dates.tsx` line 159

```ts
minimumDate={new Date()}
```

When resuming a draft where `draft.startDate` is set to a past datetime, the `DateTimePicker` clamps the start date to "now" but the form still holds the original past value (initialized in `defaultValues`). The displayed and stored values diverge silently.

---

## Performance Issues

### PERF-01: Dashboard renders upcoming-returns list with `Array.map` inside `ScrollView` instead of `FlatList`
**File:** `app/(tabs)/index.tsx` lines 231–238

```tsx
{upcomingReturns.map((rental) => (
  <View key={rental.id}>
    {renderUpcomingItem({ item: rental })}
  </View>
))}
```

All upcoming-return cards are rendered eagerly inside a non-virtualised `ScrollView`. A fleet with many upcoming returns will mount all cards simultaneously.

**Fix:** Replace with a `FlatList` for the upcoming section, or keep a hard cap (e.g., `upcomingReturns.slice(0, 10)`).

---

### PERF-02: `renderUpcomingItem` is defined with `useCallback` but called as a plain function, not passed to FlatList
**File:** `app/(tabs)/index.tsx` lines 99–119, 233

`renderUpcomingItem` is wrapped with `useCallback` (which adds overhead) but is called inline as `renderUpcomingItem({ item: rental })` rather than being passed to a `FlatList` as `renderItem`. The memoization provides no benefit in this usage pattern.

---

### PERF-03: `useRentals()` is called twice — on Dashboard and Rentals tab — with no shared cache key for filtered vs. unfiltered
**Files:** `app/(tabs)/index.tsx` line 53, `app/(tabs)/rentals/index.tsx` line 35

Both screens call `useRentals()` with no filters, resulting in the same cache key (`['rentals', 'list', undefined]`). This is actually correct caching behavior — the issue is that the Dashboard also fetches **all** rentals (not just active ones) to compute stats, then filters client-side. With a large dataset this is wasteful. Should be noted as a future scaling concern.

---

### PERF-04: `LoadingSkeleton` creates new `Animated.Value` instances on every render cycle
**File:** `src/components/LoadingSkeleton.tsx` lines 19–38

`PulsingBlock` is not memoized. The parent `LoadingSkeleton` uses `Array.from({ length: count })` which creates a new array on each render, so when the parent re-renders every `PulsingBlock` unmounts and remounts, restarting the animation.

**Fix:** Wrap `PulsingBlock` in `React.memo` and ensure `LoadingSkeleton` uses stable keys.

---

## UI/UX Issues

### UX-01: Bottom bar buttons are covered by the iOS home indicator on devices with `paddingBottom: 32` without safe area awareness
**Files:** Multiple screens — `app/(tabs)/new-rental/dates.tsx` line 280, `app/(tabs)/new-rental/contract.tsx` line 194, `app/return/[rentalId].tsx` line 166, `app/return/mileage.tsx` line 145, `app/return/notes.tsx` line 77, `app/return/confirm.tsx` line 226, `app/(tabs)/rentals/[id].tsx` line 209

All absolute-positioned bottom bars use a hardcoded `paddingBottom: 32` instead of using the bottom safe area inset. On iPhone 15 (home indicator area is 34pt) the button is clipped by the home indicator on some screen sizes. The correct approach is to use `useSafeAreaInsets().bottom` or `<SafeAreaView edges={['bottom']}>` wrapping the bottom bar.

---

### UX-02: `StatusBadge` displays raw status string for unknown statuses
**File:** `src/components/StatusBadge.tsx` line 27

```ts
const label = badgeStyle.label || status;
```

If an unrecognised status comes from the API (e.g., `'PENDING'`), the raw English constant is shown to Polish-speaking users instead of a localised fallback.

---

### UX-03: `SignatureScreen` has no user feedback when `handleEmpty` fires (user taps confirm on empty canvas)
**File:** `src/components/SignatureScreen.tsx` lines 64–66

```ts
const handleEmpty = useCallback(() => {
  // User tried to confirm empty canvas -- do nothing
}, []);
```

No toast, no visual cue — the button appears to do nothing. On a touchscreen the user may assume the app is frozen and tap repeatedly.

**Fix:** Show a brief `Toast.show({ type: 'info', text1: 'Podpis jest pusty' })`.

---

### UX-04: `SignatureScreen` "Wyczysc podpis" button is hardcoded Polish string instead of using i18n key
**File:** `src/components/SignatureScreen.tsx` lines 108, 116

Both "Wyczysc podpis" and "Zatwierdz podpis" are hardcoded. The `signatures.clear` and `signatures.confirm` keys already exist in `src/i18n/pl.json` (lines 50–51).

---

### UX-05: Checklist item labels in `constants.ts` are hardcoded Polish strings without diacritics
**File:** `src/lib/constants.ts` lines 16–25

```ts
{ key: 'bodywork', label: 'Karoseria' },
{ key: 'interior', label: 'Wnetrze' },   // missing ę
{ key: 'lights',   label: 'Oswietlenie' }, // missing Ó
{ key: 'cleanliness', label: 'Czystosc' }, // missing ść
{ key: 'fuel',     label: 'Paliwo' },
```

Several labels are missing Polish diacritical characters: `Wnetrze` should be `Wnętrze`, `Oswietlenie` → `Oświetlenie`, `Czystosc` → `Czystość`.  This pattern of missing diacritics also appears in `src/i18n/pl.json` throughout (e.g., `"Brak polaczenia"`, `"Szukaj po nazwisku, telefonie lub PESEL..."`).

---

### UX-06: `ErrorBoundary` "Sprobuj ponownie" resets `hasError` to `false` but does not clear the React component tree
**File:** `src/components/ErrorBoundary.tsx` lines 29–31

Calling `setState({ hasError: false })` causes `ErrorBoundary.render()` to return `this.props.children` again — but the child tree that threw is the **same** instance. If the error is deterministic (e.g., a bad prop value), the same error will be thrown immediately and the boundary catches it again in an infinite loop.

**Fix:** Increment a `key` prop on the child subtree to force remount on retry.

---

### UX-07: `OfflineBanner` is not rendered inside the root `SafeAreaProvider` context — it may overlap the status bar on Android
**File:** `app/(tabs)/_layout.tsx` line 14, `app/return/_layout.tsx` line 29

`OfflineBanner` is placed above the `<Tabs>` / `<Stack>` navigator without a `SafeAreaView`. On Android the banner can render under the status bar, making it partially invisible.

**Fix:** Wrap `OfflineBanner` with `<SafeAreaView edges={['top']}>`, or use `useSafeAreaInsets().top` to add padding.

---

### UX-08: "Pomin zdjecia" skip button only appears when `photoCount === 0`; once one photo is taken there is no way to remove it
**File:** `app/(tabs)/new-rental/photos.tsx` lines 118–122

If the user accidentally takes a wrong photo, there is no delete/retake option — tapping the photo card takes a new photo and overwrites the URI, which works for replacement, but there is no explicit indication of this to the user. Additionally, the thumbnail does not show a loading state while the camera picker is active.

---

### UX-09: Wizard `WIZARD_LABELS` array is defined independently in each step file instead of a shared constant
**Files:** `app/(tabs)/new-rental/index.tsx` line 22, `vehicle.tsx` line 18, `dates.tsx` line 18, `contract.tsx` line 13, `photos.tsx` line 14, `signatures.tsx` (no label array but same total=6)

The same 6-element array `['Klient', 'Pojazd', 'Daty', 'Umowa', 'Zdjecia', 'Podpisy']` is copy-pasted into every wizard step. If a step is renamed or reordered, every file must be updated.

**Fix:** Extract to `src/lib/constants.ts` as `RENTAL_WIZARD_LABELS`.

---

### UX-10: Dashboard stat cards are in a horizontal scroll with no scroll indicator or affordance hint
**File:** `app/(tabs)/index.tsx` lines 175–199

`showsHorizontalScrollIndicator={false}` hides the only visual cue that more stat cards exist. The third card (`todayReturns`) may be partially hidden on narrow phones.

---

## Accessibility Issues

### A11Y-01: `Pressable` filter chips lack `accessibilityRole` and `accessibilityState`
**File:** `app/(tabs)/rentals/index.tsx` lines 124–142

Filter chip `Pressable` elements have no `accessibilityRole="radio"` or `accessibilityState={{ selected: isActive }}`. Screen readers cannot convey the selected state.

---

### A11Y-02: `SearchBar` `TextInput` has no `accessibilityLabel`
**File:** `src/components/SearchBar.tsx`

The search input has a `placeholder` but no `accessibilityLabel`. On iOS VoiceOver reads placeholder text, but on Android TalkBack requires an explicit label.

---

### A11Y-03: `AppInput` label `Text` is not associated with the `TextInput` via `nativeID`/`accessibilityLabelledBy`
**File:** `src/components/AppInput.tsx`

The visible label text is a separate `Text` node with no programmatic link to the `TextInput`. Screen readers treat them as unrelated elements.

**Fix:** Add `nativeID` to the `Text` and `accessibilityLabelledBy` to the `TextInput`.

---

### A11Y-04: Stat cards on Dashboard have no accessibility label for their numeric values
**File:** `app/(tabs)/index.tsx` lines 181–199

The stat cards render a label and a number but have no `accessibilityLabel` combining both. A screen reader will read "Aktywne wynajmy" and "3" as separate items with no context.

---

## State Management Issues

### STATE-01: `rentalId` and `contractId` are held in local component `useState` during the signatures flow, not in the draft store
**File:** `app/(tabs)/new-rental/signatures.tsx` lines 62–63

If the app is backgrounded and the component unmounts between signatures, the `rentalId` and `contractId` are lost. On remount `currentIndex` is reset to `0` (also in local state) and the first signature triggers a second rental creation.

**Fix:** Persist `rentalId` and `contractId` into the `rental-draft` Zustand store so they survive remount.

---

### STATE-02: `currentIndex` signature step is local state and not persisted
**File:** `app/(tabs)/new-rental/signatures.tsx` line 53

Same issue as STATE-01: if the user backgrounds the app mid-signature (e.g., to check email), the component can remount at step 0. The user must re-sign from the beginning even though the first 1-2 signatures were already uploaded to the server.

---

### STATE-03: Draft `step` field does not reflect photos step (5) — photos step uses hardcoded `step: 5` but signature step resumes from step 4
**File:** `app/(tabs)/new-rental/index.tsx` lines 92–99

The draft resume `stepRoutes` map:
```ts
const stepRoutes: Record<number, string> = {
  1: '/(tabs)/new-rental/vehicle',
  2: '/(tabs)/new-rental/dates',
  3: '/(tabs)/new-rental/contract',
  4: '/(tabs)/new-rental/signatures', // step 4 goes to signatures, skipping photos
};
```

Step `4` routes directly to signatures, skipping the photos step. Yet `photos.tsx` sets `step: 5` on "Dalej". If a user has `draft.step === 4` (set when entering photos), they resume at signatures — but `draft.photoUris` may be empty since photos step was skipped.

---

### STATE-04: `logout()` in `auth.store.ts` does not clear `biometricEnabled` from memory state
**File:** `src/stores/auth.store.ts` lines 37–53

On logout, `biometricEnabled` stays `true` in memory. The next `initialize()` call reloads it from AsyncStorage, so the practical impact is small — but if the store is reused without re-initialization (e.g., in tests), `biometricEnabled` leaks across sessions.

---

## Navigation Issues

### NAV-01: `beforeRemove` discard dialog intercepts only the first screen in each wizard, not intermediate steps
**Files:** `app/(tabs)/new-rental/_layout.tsx` lines 32–38, `app/return/_layout.tsx` lines 37–42

The `beforeRemove` listener is attached only to the `index` screen (new rental) and `[rentalId]` screen (return). Tapping the hardware back button on `vehicle`, `dates`, `contract`, `photos` steps navigates back without the discard confirmation, potentially losing partial draft data without user awareness.

---

### NAV-02: `router.dismissAll()` is called after return submission but this dismisses the entire modal stack — on iOS, if the return flow was opened from a rental detail, the user lands on an empty screen
**File:** `app/return/confirm.tsx` line 98

`router.dismissAll()` dismisses all modals. If the user was at `/rentals/[id]` and tapped "Rozpocznij zwrot", they go through the return flow and then `dismissAll()` sends them back to whatever was under all the modals — potentially the rentals list or dashboard but not the rental detail they came from. The intended destination (`/(tabs)/rentals`) is what `router.dismissAll()` lands on only if the modal stack root is the rentals tab.

**Fix:** Use `router.replace('/(tabs)/rentals')` explicitly after clearing the draft.

---

### NAV-03: Draft resume dialog shows for any non-zero `draft.customerId` but does not validate if the customer still exists
**File:** `app/(tabs)/new-rental/index.tsx` lines 54–58

If a customer was created and selected but then deleted from the backend (rare but possible), resuming the draft proceeds to vehicle selection with a stale customer ID. The rental creation will fail at the signatures step with a cryptic server error.

---

## Hardcoded Values

### HC-01: VAT rate is hardcoded at 23% in three separate locations
**Files:**
- `app/(tabs)/new-rental/dates.tsx` line 62: `const totalGrossGrosze = Math.round(totalNetGrosze * 1.23);`
- `app/(tabs)/new-rental/contract.tsx` line 28: `Math.round(totalNetGrosze * 1.23);`
- `app/(tabs)/new-rental/signatures.tsx` line 75: `vatRate: 23,`
- `src/lib/format.ts` line 39: `formatGross(netGrosze: number, vatRate = 23)`

**Fix:** Define `DEFAULT_VAT_RATE = 23` in `src/lib/constants.ts` and reference it everywhere.

---

### HC-02: Magic numbers for time durations scattered across codebase
**Files:**
- `app/(tabs)/new-rental/dates.tsx` lines 36, 78, 177: `86400000` (one day in ms) appears 3 times
- `app/(tabs)/index.tsx` line 83: `3` (days for "upcoming returns" threshold) — no explanation in code
- `src/providers/AuthProvider.tsx` line 81: `#2563EB` hardcoded spinner color (duplicates tab bar active color)

**Fix:** Extract to named constants: `const ONE_DAY_MS = 86_400_000`, `const UPCOMING_RETURN_THRESHOLD_DAYS = 3`.

---

### HC-03: API base URL fallback `'http://localhost:3000'` is embedded in two places
**Files:** `src/lib/constants.ts` line 4, `src/api/client.ts` line 97 (inline `axios.post` for token refresh)

The token refresh in `client.ts` line 97 constructs the refresh URL directly: `` `${API_URL}/auth/refresh` ``. This is fine, but `API_URL` is imported from `constants.ts` which fallbacks to `localhost`. If the `extra.apiUrl` env var is not set in production builds, all API calls silently target `localhost`.

**Fix:** Add a build-time assertion that `EXPO_PUBLIC_API_URL` is defined for non-development builds.

---

### HC-04: EAS project ID is `'kitek-rental'` (a slug, not a UUID)
**File:** `app.config.ts` line 45

```ts
eas: { projectId: 'kitek-rental' },
```

EAS project IDs must be UUIDs. Using a slug here will cause `eas build` to fail or reference the wrong project. This suggests EAS builds have not been run since this was set.

---

## Dead Code / Unused Items

### DEAD-01: `isSubmitting` state in signatures is set but never read in the UI
**File:** `app/(tabs)/new-rental/signatures.tsx` lines 55, 165, 212

`const [isSubmitting, setIsSubmitting] = useState(false)` is set to `true` at line 165 but the `loading` prop passed to `<SignatureScreen>` is `isUploading || isSubmitting` (line 248). The distinction between uploading and submitting is never surfaced to the user and `isSubmitting` is never reset.

---

### DEAD-02: `snapPoints` comment refers to removed BottomSheet dependency
**File:** `app/(tabs)/new-rental/index.tsx` line 113

```ts
// snapPoints removed - using Modal instead of BottomSheet
```

`@gorhom/bottom-sheet` is still listed as a dependency in `package.json` line 16 but is not imported anywhere in the codebase. It is an unused production dependency.

**Fix:** Remove `@gorhom/bottom-sheet` from `package.json`.

---

### DEAD-03: `useAuthContext` hook exported from `AuthProvider` is never used
**File:** `src/providers/AuthProvider.tsx` lines 19–21

```ts
export function useAuthContext() {
  return useContext(AuthContext);
}
```

No file in `app/` or `src/` imports `useAuthContext`. The `AuthContext` only exposes `{ isReady: boolean }` which is already covered by direct store access.

---

### DEAD-04: `FlatList` is imported but not used in dashboard
**File:** `app/(tabs)/index.tsx` line 3

```ts
import { FlatList, ... } from 'react-native';
```

`FlatList` is imported but the upcoming-returns list uses `Array.map` inside a `ScrollView`. This is both an unused import and a performance issue (see PERF-01).

---

### DEAD-05: `rentals/_layout.tsx` appears to be empty/stub
**File:** `app/(tabs)/rentals/_layout.tsx`

Not read — let me verify.

---

## Testing Gaps

### TEST-01: All four test files only test render and static text — zero interaction or mutation tests
**Files:** `__tests__/login.test.tsx`, `__tests__/dashboard.test.tsx`, `__tests__/rental-list.test.tsx`, `__tests__/new-rental-customer-step.test.tsx`

Tests verify that strings appear but never:
- Fire `onPress` events on buttons
- Submit forms and assert mutations are called
- Test error states (network failure, validation failure)
- Test loading states

---

### TEST-02: Test assertions on i18n keys rather than rendered text, indicating i18n is not initialised in test environment
**Files:** `__tests__/dashboard.test.tsx` line 38: `expect(getByText('dashboard.greeting')).toBeTruthy()`

The test asserts the raw i18n key string, not the Polish translation. This means either i18n is not initialised in tests (the key falls through to the key itself) or the test is asserting the wrong thing. Either way the test would pass even if the translation key was misspelled.

**Fix:** Import and call `i18n.init()` in `src/test/setup.js`, then assert on translated text.

---

### TEST-03: Return wizard screens have zero test coverage
**Files:** `app/return/[rentalId].tsx`, `mileage.tsx`, `checklist.tsx`, `notes.tsx`, `confirm.tsx`

No tests exist for the return flow despite it being the most state-heavy and mutation-critical path.

---

### TEST-04: `SignaturesStep` has zero tests
**File:** `app/(tabs)/new-rental/signatures.tsx`

The most complex screen in the app (rental creation, contract creation, 4 signature uploads with retry, photo upload) has no tests.

---

### TEST-05: `test-utils.tsx` wraps only `QueryClientProvider` — no `AuthProvider`, `SafeAreaProvider`, or i18n
**File:** `src/test/test-utils.tsx`

Components that use `useTranslation()` or `useSafeAreaInsets()` will throw or produce incorrect output in tests that use `renderWithProviders`.

---

## Inconsistent Patterns

### INC-01: Some screens use `SafeAreaView` with `edges={['top']}`, others use no `edges` prop
**Files:**
- `app/return/[rentalId].tsx` line 39: `<SafeAreaView style={s.safeArea}>` (no edges)
- `app/(tabs)/index.tsx` line 122: `<SafeAreaView style={s.safeArea} edges={['top']}>` (top only)
- `app/(tabs)/new-rental/success.tsx` line 44: `<SafeAreaView edges={['top', 'bottom']}>` (both)

No consistent rule for which edges to apply. Bottom safe area is often missing (see UX-01).

---

### INC-02: Error strings in `[id].tsx` detail screen are hardcoded Polish, not i18n keys
**File:** `app/(tabs)/rentals/[id].tsx` lines 37–46

```tsx
<Text style={s.errorTitle}>Nie udalo sie zaladowac danych</Text>
<Text style={s.errorSub}>Sprawdz polaczenie i sprobuj ponownie</Text>
<AppButton title="Sprobuj ponownie" ... />
```

All other screens use `t('errors.network')` etc. The i18n `errors` namespace has matching keys available.

---

### INC-03: Return wizard steps each define their own `WizardStepper` with `totalSteps={5}` while new-rental wizard uses `totalSteps={6}` — inconsistent stepper labelling
**File:** `app/return/[rentalId].tsx` line 41 — `WizardStepper` called without `labels` prop; all return steps omit labels, while new-rental steps always pass `WIZARD_LABELS`. The label display behaviour is therefore different between the two wizards.

---

### INC-04: `AppCard` `onPress` prop uses `() => void` but some callers pass `undefined` explicitly via ternary, others pass nothing
**Files:** `app/(tabs)/new-rental/vehicle.tsx` line 117: `onPress={isSelectable ? () => handleSelectVehicle(item) : undefined}`

Passing `undefined` renders a `View` (non-interactive). This is the correct approach, but the pattern is inconsistently applied — other cards in the same screen context pass a no-op or omit `onPress`.

---

### INC-05: `handleBeforeRemove` is used in layouts but the event is not cancelled for intermediate wizard steps
**Files:** `app/(tabs)/new-rental/_layout.tsx`, `app/return/_layout.tsx`

The pattern attempts to intercept back-navigation to show a discard prompt, but `e.preventDefault()` is called only when `hasDraftData` is truthy. The discard confirmation fires but then `router.back()` inside `onConfirm` calls back navigation again — without re-triggering `beforeRemove` since the prevention was lifted. This is correct Expo Router behavior, but the discard callback calls `router.back()` which may navigate to an unexpected screen if the back stack has entries from outside the wizard group.

---

## Minor Issues

- `app/(tabs)/rentals/[id].tsx` line 104: Text `"Przebieg:"` is hardcoded Polish without an i18n key; same pattern at `app/return/[rentalId].tsx` line 103.
- `app/(tabs)/rentals/[id].tsx` lines 122–125: Duration pluralisation uses a manual `durationDays === 1 ? 'dzien' : 'dni'` ternary; `i18next` has a `_plural` key system that handles this.
- `app/(tabs)/new-rental/dates.tsx` line 177: `minimumDate={new Date(startDate.getTime() + 3600000)}` uses 1-hour minimum rental window hardcoded inline; should be a named constant.
- `src/lib/format.ts` line 4: `formatDate` and `formatDateTime` do not handle invalid date strings — `new Date('invalid')` returns `Invalid Date` and the format functions return `"NaN.NaN.NaN"`.
- `app/return/confirm.tsx` line 53: `distanceDriven` is calculated as `returnMileage - handoverMileage` and defaults to `0` if `returnMileage` is `null`. The value `0` is passed to `formatMileage(0)` and displayed as `"0 km"`, misleading the user into thinking no distance was driven when actually no value was entered.
- `src/i18n/pl.json` line 25: `"customerSearch": "Szukaj po nazwisku, telefonie lub PESEL..."` — the search API (`customersApi.searchCustomers`) only searches by `lastName` (line 13 of `customers.api.ts`), not phone or PESEL. The placeholder text is misleading.

---

*Mobile audit: 2026-03-27*
