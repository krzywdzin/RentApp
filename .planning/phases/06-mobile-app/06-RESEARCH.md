# Phase 6: Mobile App - Research

**Researched:** 2026-03-24
**Domain:** React Native / Expo cross-platform mobile app
**Confidence:** HIGH

## Summary

Phase 6 delivers a cross-platform mobile app (Android + iOS) for field employees using Expo SDK 52 with the New Architecture enabled. The app consumes the existing REST API (Phases 1-4) and provides the complete rental workflow: login with biometric re-auth, customer lookup/creation, vehicle selection, contract signing with digital signature capture, and vehicle return processing.

The stack is fully locked by CONTEXT.md decisions: Expo SDK 52, Expo Router, NativeWind v4, TanStack Query + Zustand, React Hook Form + Zod (shared schemas), and EAS Build for internal distribution. The app lives at `apps/mobile` in the existing Turborepo/pnpm monorepo. Research confirms all major libraries are compatible with SDK 52, with one notable caveat around `@gorhom/bottom-sheet` requiring a custom backdrop workaround on SDK 52. A comprehensive UI spec (06-UI-SPEC.md) already exists with screen inventory, component inventory, copywriting, and interaction patterns.

**Primary recommendation:** Structure the build as: (1) Expo project scaffold + monorepo wiring, (2) auth + navigation shell, (3) dashboard + rental list, (4) rental creation wizard with signature capture, (5) vehicle return wizard. Use the existing `@rentapp/shared` Zod schemas directly in React Hook Form for client-side validation matching the API.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Expo SDK 52** with New Architecture (Fabric + TurboModules) enabled
- **Expo Router** (file-based routing) for navigation
- **NativeWind** (Tailwind CSS for React Native) for styling
- **TanStack Query** for server state (API calls, caching, refetch) + **Zustand** for local UI state (form drafts, navigation)
- **React Hook Form + Zod** for forms -- reuses Zod schemas from `@rentapp/shared`
- **expo-secure-store** for JWT token storage (encrypted keychain/keystore)
- **react-native-signature-canvas** for signature capture (WebView-based, PNG output)
- **Jest + React Native Testing Library** for testing
- **Sentry** (sentry-expo) for crash reporting from day one
- Minimum OS: **iOS 15+ / Android 10+**
- Located at **`apps/mobile`** in the Turborepo monorepo
- **pnpm workspace** dependency on `@rentapp/shared` (direct workspace link)
- **EAS Build** from start -- cloud builds for Android APK and iOS IPA
- **Internal distribution** via EAS (link/QR code) -- no app store for ~10 employees
- **Environment-based config** via `app.config.ts` + EAS Build profiles (dev/staging/prod API URLs)
- **Light mode only** -- dark mode deferred
- **i18n wired from start** -- expo-localization + i18next, Polish as default
- **Biometric authentication** (Face ID / fingerprint) for quick re-login
- **Bottom tab bar** with tabs: Home (dashboard), + New Rental, Rentals list, Profile/Settings
- **Step-by-step wizard** for rental creation (5 steps) and vehicle return (5 steps)
- **4 signatures total** on separate screens with full-screen landscape canvas
- **Auto-save draft** to device storage (Zustand persist)
- **Graceful offline degradation** -- cached data shown offline, mutations blocked
- **REST API** consumption -- no GraphQL, no BFF for mobile
- **No in-app PDF viewing** -- contracts via admin panel or customer email

### Claude's Discretion
- Damage sketch groundwork for Phase 7 (stub screen in return wizard vs skip entirely)
- Push notification infrastructure (basic expo-notifications setup vs defer entirely to Phase 8)
- Exact bottom tab icons and naming
- Loading states and skeleton screens
- Error screen designs
- Pull-to-refresh behavior
- Date/time picker component choice

### Deferred Ideas (OUT OF SCOPE)
- Full offline mode with mutation queue -- v2 requirement (OFFL-01, OFFL-02)
- Dark mode -- add later if employees request it
- In-app PDF viewer for contracts -- web/email access sufficient for now
- Vehicle photos in vehicle selection grid -- depends on Phase 7 photo infrastructure
- Push notifications -- Phase 8 scope
- App Store / Play Store distribution -- consider when scaling beyond internal use
- Multi-language support -- v1 is Polish only, but i18n is wired for future expansion

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOB-01 | Cross-platform mobile app (Android + iOS) with login and employee functions | Expo SDK 52 with New Architecture, Expo Router tabs, expo-secure-store for JWT, expo-local-authentication for biometrics |
| MOB-02 | Employee can search/add customer, select vehicle, fill contract, capture signature, submit rental | 5-step rental wizard with React Hook Form + Zod validation, react-native-signature-canvas for signatures, TanStack Query mutations |
| MOB-03 | Employee can process vehicle return with mileage and inspection | 5-step return wizard consuming existing return API endpoint, numeric mileage input with validation |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | ~52.0.49 | SDK framework | Locked decision. SDK 52 is stable with New Architecture enabled by default. Based on RN 0.76. |
| expo-router | ~4.0.x (SDK 52 compatible) | File-based navigation | Locked decision. Built on React Navigation, provides (tabs) layout and Stack per tab. |
| nativewind | ^4.2.3 | Tailwind CSS for RN | Locked decision. v4 uses jsxImportSource transform. Requires tailwindcss ^3.4.x as peer. |
| @tanstack/react-query | ^5.95 | Server state management | Locked decision. Handles API caching, refetch, optimistic updates. |
| zustand | ^5.0 | Local UI state | Locked decision. Lightweight store for wizard drafts, navigation state. Supports async persist middleware. |
| react-hook-form | ^7.72 | Form management | Locked decision. Works with @hookform/resolvers for Zod integration. |
| @hookform/resolvers | ^5.2 | Zod resolver for RHF | Bridges Zod schemas from @rentapp/shared into React Hook Form. |
| react-native-signature-canvas | ^5.0.2 | Signature capture | Locked decision. WebView-based canvas, PNG output. Works with Expo. |
| @sentry/react-native | ^8.5 | Crash reporting | Replaces deprecated sentry-expo. Official Sentry SDK for React Native. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @gorhom/bottom-sheet | ^5.2.8 | Bottom sheet modals | Customer creation modal, filter panels. Requires custom backdrop workaround on SDK 52. |
| react-native-reanimated | ^4.2 (SDK 52 bundled) | Animations | Peer dependency for bottom-sheet, NativeWind. Ships with Expo SDK 52. |
| react-native-gesture-handler | ^2.30 (SDK 52 bundled) | Gesture handling | Peer dependency for bottom-sheet, navigation. Ships with Expo SDK 52. |
| @react-native-community/datetimepicker | ^9.1 | Native date/time picker | Rental wizard step 3 (start/end dates). Native pickers per platform. |
| react-native-toast-message | ^2.3 | Toast notifications | Success/error feedback throughout app. |
| lucide-react-native | ^1.6 | Icons | Matches admin panel (lucide-react). Tab bar icons, action icons. |
| expo-secure-store | SDK 52 | Encrypted storage | JWT refresh token storage in iOS Keychain / Android Keystore. |
| expo-local-authentication | SDK 52 | Biometric auth | Face ID / fingerprint for quick re-login. |
| expo-screen-orientation | SDK 52 | Orientation lock | Lock to landscape for signature screens, portrait for rest. |
| expo-haptics | SDK 52 | Haptic feedback | Light impact on signature confirm, step completion. |
| expo-localization | SDK 52 | Locale detection | Detect device locale for i18next initialization. |
| i18next | ^25.10 | i18n framework | Polish string externalization. All UI copy in translation files. |
| react-i18next | ^16.6 | React bindings for i18n | useTranslation hook for components. |
| @react-native-community/netinfo | ^12.0 | Network detection | Offline banner, mutation blocking when disconnected. |
| @react-native-async-storage/async-storage | ^3.0 | Async storage | Zustand persist middleware backend for wizard drafts. |
| axios | ^1.x | HTTP client | API requests with interceptors for auth token injection and 401 refresh. |
| react-native-safe-area-context | SDK 52 bundled | Safe area insets | Required by NativeWind and navigation. |
| react-native-svg | ^15.15 | SVG rendering | Required by lucide-react-native for icon rendering. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @gorhom/bottom-sheet | React Native Modal | Modal lacks swipe-to-dismiss and snap points, but avoids SDK 52 compat issues. Bottom-sheet is better UX with known workaround. |
| react-native-signature-canvas | expo-gl custom canvas | More control but requires building signature logic from scratch. WebView approach is proven and simpler. |
| axios | fetch (built-in) | Fetch is zero-dependency but lacks interceptors natively. Axios interceptor pattern is well-established for token refresh. |
| sentry-expo (deprecated) | @sentry/react-native | sentry-expo is now deprecated. @sentry/react-native is the official replacement and has better Expo support. |

**Installation (initial scaffold):**
```bash
# From monorepo root, create Expo app
npx create-expo-app@latest apps/mobile --template blank-typescript

# From apps/mobile, install dependencies
cd apps/mobile
pnpm add @tanstack/react-query zustand react-hook-form @hookform/resolvers \
  nativewind react-native-reanimated react-native-gesture-handler \
  react-native-safe-area-context react-native-screens \
  @gorhom/bottom-sheet react-native-signature-canvas \
  @react-native-community/datetimepicker react-native-toast-message \
  lucide-react-native react-native-svg \
  i18next react-i18next expo-localization \
  expo-secure-store expo-local-authentication expo-screen-orientation expo-haptics \
  @react-native-community/netinfo @react-native-async-storage/async-storage \
  @sentry/react-native axios zod
pnpm add -D tailwindcss@^3.4 @types/react @testing-library/react-native jest

# Add workspace dependency
# In apps/mobile/package.json: "@rentapp/shared": "workspace:*"
```

**Note on Expo SDK version:** The latest Expo SDK is 55 (as of March 2026). CONTEXT.md locks to SDK 52, which is stable and well-supported but 3 major versions behind. This is acceptable for an internal tool but should be noted for future upgrades.

**Note on sentry-expo:** CONTEXT.md mentions `sentry-expo`, but this package is deprecated. Use `@sentry/react-native` (v8.5+) instead, which has official Expo support via config plugin.

## Architecture Patterns

### Recommended Project Structure

```
apps/mobile/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout (providers, auth gate)
│   ├── login.tsx                 # Login screen
│   ├── (tabs)/                   # Bottom tab navigator
│   │   ├── _layout.tsx           # Tab bar configuration
│   │   ├── index.tsx             # Home/Dashboard tab
│   │   ├── new-rental/           # New Rental tab (wizard)
│   │   │   ├── _layout.tsx       # Stack layout for wizard
│   │   │   ├── index.tsx         # Step 1: Customer
│   │   │   ├── vehicle.tsx       # Step 2: Vehicle
│   │   │   ├── dates.tsx         # Step 3: Dates & pricing
│   │   │   ├── contract.tsx      # Step 4: Contract review
│   │   │   ├── signatures.tsx    # Step 5: Signature flow
│   │   │   └── success.tsx       # Success screen
│   │   ├── rentals/              # Rentals tab
│   │   │   ├── _layout.tsx       # Stack layout
│   │   │   ├── index.tsx         # Rental list
│   │   │   └── [id].tsx          # Rental detail
│   │   └── profile.tsx           # Profile/Settings tab
│   └── return/                   # Return wizard (modal stack)
│       ├── _layout.tsx           # Stack layout for return wizard
│       ├── [rentalId].tsx        # Step 1: Confirm rental
│       ├── mileage.tsx           # Step 2: Mileage entry
│       ├── checklist.tsx         # Step 3: Damage checklist
│       ├── notes.tsx             # Step 4: Additional notes
│       └── confirm.tsx           # Step 5: Review & confirm
├── src/
│   ├── api/                      # API layer
│   │   ├── client.ts             # Axios instance with interceptors
│   │   ├── auth.api.ts           # Auth endpoints
│   │   ├── customers.api.ts      # Customer endpoints
│   │   ├── vehicles.api.ts       # Vehicle endpoints
│   │   ├── rentals.api.ts        # Rental endpoints
│   │   └── contracts.api.ts      # Contract + signature endpoints
│   ├── hooks/                    # TanStack Query hooks
│   │   ├── use-auth.ts           # Login, refresh, biometric
│   │   ├── use-customers.ts      # Customer queries & mutations
│   │   ├── use-vehicles.ts       # Vehicle queries
│   │   ├── use-rentals.ts        # Rental queries & mutations
│   │   └── use-contracts.ts      # Contract & signature mutations
│   ├── stores/                   # Zustand stores
│   │   ├── auth.store.ts         # Auth state (tokens, user)
│   │   ├── rental-draft.store.ts # Wizard draft with persist
│   │   └── return-draft.store.ts # Return wizard draft
│   ├── components/               # Shared UI components
│   │   ├── AppButton.tsx
│   │   ├── AppInput.tsx
│   │   ├── AppCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── WizardStepper.tsx
│   │   ├── SearchBar.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ConfirmationDialog.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   └── SignatureScreen.tsx
│   ├── i18n/                     # Internationalization
│   │   ├── index.ts              # i18next config
│   │   └── pl.json               # Polish translations
│   ├── providers/                # React context providers
│   │   ├── QueryProvider.tsx     # TanStack Query provider
│   │   └── AuthProvider.tsx      # Auth state gate
│   └── lib/                      # Utilities
│       ├── constants.ts          # API URLs, app config
│       ├── format.ts             # Date/currency formatters
│       └── network.ts            # NetInfo utilities
├── app.config.ts                 # Expo config (dynamic, env-based)
├── eas.json                      # EAS Build profiles
├── tailwind.config.js            # Tailwind config for NativeWind
├── metro.config.js               # Metro config with NativeWind + monorepo
├── babel.config.js               # Babel config with NativeWind preset
├── nativewind-env.d.ts           # NativeWind TypeScript declarations
├── tsconfig.json                 # TypeScript config
├── jest.config.ts                # Jest config
└── package.json
```

### Pattern 1: Axios API Client with Token Refresh

**What:** Centralized axios instance with request/response interceptors for automatic JWT handling.
**When to use:** Every API call from the mobile app.

```typescript
// src/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Request interceptor: attach access token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 with refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const { data } = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        );
        await SecureStore.setItemAsync('accessToken', data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        router.replace('/login');
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };
```

### Pattern 2: TanStack Query Hooks with Shared Types

**What:** Type-safe query/mutation hooks consuming API endpoints with types from `@rentapp/shared`.
**When to use:** Every data-fetching component.

```typescript
// src/hooks/use-rentals.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Rental } from '@rentapp/shared';

export const rentalKeys = {
  all: ['rentals'] as const,
  list: (filters?: { status?: string }) => [...rentalKeys.all, 'list', filters] as const,
  detail: (id: string) => [...rentalKeys.all, 'detail', id] as const,
};

export function useRentals(filters?: { status?: string }) {
  return useQuery({
    queryKey: rentalKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<Rental[]>('/rentals', { params: filters });
      return data;
    },
  });
}

export function useCreateRental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRentalDto) => {
      const { data } = await apiClient.post<Rental>('/rentals', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}
```

### Pattern 3: Zustand Draft Store with Persist

**What:** Wizard state persisted to AsyncStorage so employees can resume after interruption.
**When to use:** Rental creation wizard and return wizard.

```typescript
// src/stores/rental-draft.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RentalDraft {
  step: number;
  customerId?: string;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
  dailyRate?: number;
  rodoConcent?: boolean;
  signatures: string[];  // uploaded signature URLs
}

interface RentalDraftStore {
  draft: RentalDraft;
  setStep: (step: number) => void;
  updateDraft: (partial: Partial<RentalDraft>) => void;
  clearDraft: () => void;
}

const initialDraft: RentalDraft = { step: 0, signatures: [] };

export const useRentalDraftStore = create<RentalDraftStore>()(
  persist(
    (set) => ({
      draft: initialDraft,
      setStep: (step) => set((s) => ({ draft: { ...s.draft, step } })),
      updateDraft: (partial) => set((s) => ({ draft: { ...s.draft, ...partial } })),
      clearDraft: () => set({ draft: initialDraft }),
    }),
    {
      name: 'rental-draft',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Pattern 4: Signature Screen with Orientation Lock

**What:** Full-screen landscape signature capture with orientation management.
**When to use:** Each of the 4 signature captures in the rental wizard.

```typescript
// src/components/SignatureScreen.tsx
import { useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';

interface Props {
  title: string;
  stepLabel: string;
  onConfirm: (base64: string) => void;
  onBack: () => void;
}

export function SignatureScreen({ title, stepLabel, onConfirm, onBack }: Props) {
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const handleConfirm = (signature: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onConfirm(signature);  // base64 PNG data
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  return (
    <View className="flex-1 bg-white">
      <View className="h-12 flex-row items-center justify-between px-4">
        <Text className="text-base font-semibold text-zinc-900">{title}</Text>
        <Text className="text-sm text-zinc-500">{stepLabel}</Text>
      </View>
      <Text className="px-4 text-sm text-zinc-500">
        Prosze zlozyc podpis w wyznaczonym polu
      </Text>
      <View className="flex-1 mx-4 my-2 border border-zinc-200 rounded-xl overflow-hidden">
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleConfirm}
          penColor="black"
          minWidth={2}
          maxWidth={3}
          webStyle={`.m-signature-pad { box-shadow: none; border: none; }
            .m-signature-pad--body { border: none; }
            .m-signature-pad--footer { display: none; }`}
        />
      </View>
      <View className="flex-row justify-between px-4 pb-4">
        <Pressable onPress={handleClear} className="h-12 px-6 items-center justify-center rounded-xl border border-zinc-200">
          <Text className="text-base text-zinc-900">Wyczysc podpis</Text>
        </Pressable>
        <Pressable
          onPress={() => signatureRef.current?.readSignature()}
          className="h-12 px-6 items-center justify-center rounded-xl bg-blue-600"
        >
          <Text className="text-base text-white font-semibold">Zatwierdz podpis</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

### Pattern 5: Auth Provider with Biometric Re-login

**What:** Root-level auth gate that checks stored tokens on launch and offers biometric re-login.
**When to use:** App root layout.

```typescript
// In app/_layout.tsx root
// Check SecureStore for tokens on mount
// If tokens exist + biometric enrolled -> prompt biometric
// If biometric succeeds -> set auth state, navigate to tabs
// If no tokens or biometric fails -> show login screen
// Wrap entire app in QueryClientProvider + AuthProvider
```

### Anti-Patterns to Avoid

- **Storing tokens in AsyncStorage:** AsyncStorage is unencrypted. Always use expo-secure-store for JWT tokens.
- **Global axios instance without interceptor queue:** Multiple simultaneous 401s will fire multiple refresh requests. The queue pattern above prevents this.
- **Calling API directly in components:** Always go through TanStack Query hooks for caching, deduplication, and loading state management.
- **Hardcoding API URLs:** Use `EXPO_PUBLIC_*` env vars via app.config.ts for environment switching.
- **Synchronous SecureStore reads in render:** SecureStore is async. Use it in effects or interceptors, not in render paths.
- **Forgetting to restore portrait on signature screen unmount:** Always clean up orientation lock in useEffect return.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom tabs navigation | Custom tab bar from scratch | Expo Router `(tabs)` layout | File-based routing is declarative, handles deep links, back button, etc. |
| Token refresh logic | Manual fetch + retry | Axios interceptor queue pattern | Race conditions with concurrent 401s are tricky. Queue pattern is battle-tested. |
| Encrypted token storage | AsyncStorage + custom encryption | expo-secure-store | Uses iOS Keychain and Android Keystore natively. Custom encryption will be weaker. |
| Signature capture | Custom canvas with expo-gl | react-native-signature-canvas | WebView-based canvas handles touch events, pressure, smoothing out of the box. |
| Date/time pickers | Custom date wheel/calendar | @react-native-community/datetimepicker | Native pickers respect platform conventions, locale, and accessibility. |
| Pull-to-refresh | Custom scroll detection | RefreshControl (React Native built-in) | Native pull-to-refresh behavior with platform-correct animations. |
| Network detection | Custom fetch polling | @react-native-community/netinfo | Native network change listeners, handles edge cases (captive portals, etc.) |
| Form validation | Custom validation functions | React Hook Form + @rentapp/shared Zod schemas | Single source of truth. Same schemas validate on API and mobile. |
| Toast notifications | Custom animated overlay | react-native-toast-message | Handles queuing, auto-dismiss, gestures, safe area. |

**Key insight:** The mobile app is a pure API consumer. Most complexity is in UX orchestration (wizards, offline handling, signature flow), not data processing. Use proven libraries for all infrastructure concerns and focus implementation effort on the wizard flows and user experience.

## Common Pitfalls

### Pitfall 1: @gorhom/bottom-sheet Backdrop Lag on SDK 52
**What goes wrong:** BottomSheetBackdrop causes layout shift and sluggish animation when using Expo SDK 52 with New Architecture.
**Why it happens:** Incompatibility between the built-in backdrop component and Fabric renderer in RN 0.76.
**How to avoid:** Implement a custom backdrop component using `GestureDetector` and `Animated.View` from react-native-reanimated instead of the built-in `BottomSheetBackdrop`. See [GitHub discussion #2094](https://github.com/gorhom/react-native-bottom-sheet/discussions/2094).
**Warning signs:** Bottom sheet opens slowly, visible layout shift on iOS, backdrop doesn't animate smoothly.

### Pitfall 2: pnpm Monorepo + EAS Build Symlink Issues
**What goes wrong:** EAS Build fails to resolve workspace dependencies or installs wrong package manager.
**Why it happens:** EAS historically assumed Yarn. pnpm symlinks and virtual store can confuse the build system.
**How to avoid:** (1) Ensure `node-linker=hoisted` in `.npmrc` for EAS compatibility. (2) Specify `"packageManager": "pnpm@10.6.0"` in root package.json (already done). (3) Use `expo-doctor` to validate dependency resolution. (4) Test EAS Build early -- don't wait until all features are done.
**Warning signs:** Build fails with "cannot resolve module", wrong lockfile detected, missing workspace packages.

### Pitfall 3: NativeWind v4 Configuration Order
**What goes wrong:** Styles don't apply, className prop shows warnings, or Metro bundler errors.
**Why it happens:** NativeWind v4 requires specific configuration in babel.config.js (preset), metro.config.js (withNativeWind wrapper), and a CSS entry file. Missing any step breaks styling silently.
**How to avoid:** Follow exact setup order: (1) tailwind.config.js with content paths including `app/**/*.tsx` and `src/**/*.tsx`, (2) babel.config.js with `nativewind/babel` preset, (3) metro.config.js with `withNativeWind` from nativewind/metro, (4) global.css with `@tailwind` directives, (5) import global.css in root layout, (6) nativewind-env.d.ts for TypeScript.
**Warning signs:** `className` prop has no effect, NativeWind warning in console, "unknown property" warnings.

### Pitfall 4: Signature Canvas WebView Blank on Android
**What goes wrong:** Signature canvas renders as blank white rectangle on some Android devices.
**Why it happens:** WebView hardware acceleration conflicts, or missing android permissions for WebView.
**How to avoid:** Set `androidHardwareAccelerationDisabled={false}` in webViewProps. Ensure `react-native-webview` is properly linked. Test on physical Android device early (emulator WebView can differ).
**Warning signs:** Canvas visible on iOS but blank on Android, no touch response on canvas.

### Pitfall 5: SecureStore Size Limits
**What goes wrong:** Storing too much data in SecureStore silently fails or throws.
**Why it happens:** SecureStore has a 2KB value limit on iOS. JWTs are typically under 1KB each, but storing additional data can exceed limits.
**How to avoid:** Only store access token, refresh token, and device ID in SecureStore. Use AsyncStorage for non-sensitive data like wizard drafts and preferences.
**Warning signs:** SecureStore.setItemAsync returns without error but getItemAsync returns null.

### Pitfall 6: Orientation Lock Not Working on iPad
**What goes wrong:** `expo-screen-orientation` lockAsync is ignored on iPad.
**Why it happens:** iPad respects multitasking and orientation settings differently. By default, iPad allows all orientations.
**How to avoid:** Set `"requiresFullScreen": true` in app.config.ts ios section, and set orientation constraints in info.plist via config plugin. For this internal app targeting phones, consider setting global portrait lock in app.config.ts and only unlocking for signature screen.
**Warning signs:** Signature screen stays portrait on iPad, or app rotates unexpectedly on iPad.

### Pitfall 7: TanStack Query Cache Stale After Background
**What goes wrong:** App returns from background showing stale data (old rental status, etc.).
**Why it happens:** Default staleTime is 0 but queries only refetch on mount/focus if configured.
**How to avoid:** Enable `refetchOnWindowFocus` (via `useAppState` hook on React Native) and set appropriate staleTime (30s for lists, 5min for reference data like vehicles). Use `focusManager` from TanStack Query with AppState listener.
**Warning signs:** Employee sees "active" rental that was already returned by another employee.

## Code Examples

### Expo Router Tab Layout

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Home, PlusCircle, List, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',  // blue-600
        tabBarInactiveTintColor: '#71717A', // zinc-500
        tabBarStyle: { height: 64, paddingBottom: 8 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pulpit',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="new-rental"
        options={{
          title: 'Nowy wynajem',
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="rentals"
        options={{
          title: 'Wynajmy',
          tabBarIcon: ({ color, size }) => <List color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

### NativeWind Metro Configuration

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: watch shared packages
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
```

### App Config with EAS Profiles

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'KITEK Rental',
  slug: 'kitek-rental',
  version: '1.0.0',
  orientation: 'portrait',
  newArchEnabled: true,
  icon: './assets/icon.png',
  splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#FFFFFF' },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'pl.kitek.rental',
    infoPlist: { NSFaceIDUsageDescription: 'Uzywamy Face ID do szybkiego logowania' },
  },
  android: {
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#FFFFFF' },
    package: 'pl.kitek.rental',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-local-authentication',
    'expo-screen-orientation',
    ['@sentry/react-native/expo', { organization: 'kitek', project: 'mobile' }],
  ],
  extra: {
    eas: { projectId: 'your-eas-project-id' },
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  },
});
```

### EAS Build Configuration

```json
// eas.json
{
  "cli": { "version": ">= 15.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "http://192.168.x.x:3000" }
    },
    "staging": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://staging-api.kitek.pl" }
    },
    "production": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://api.kitek.pl" }
    }
  }
}
```

### i18next Configuration

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import pl from './pl.json';

i18n.use(initReactI18next).init({
  resources: { pl: { translation: pl } },
  lng: 'pl',
  fallbackLng: 'pl',
  interpolation: { escapeValue: false },
});

export default i18n;
```

### TanStack Query + AppState for Refetch on Focus

```typescript
// src/providers/QueryProvider.tsx
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,  // 30 seconds
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

// Wire up AppState to focusManager for React Native
function onAppStateChange(status: string) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| sentry-expo | @sentry/react-native with Expo config plugin | 2024 | sentry-expo is deprecated. Must use @sentry/react-native v8+ |
| NativeWind v2 (Babel plugin) | NativeWind v4 (jsxImportSource + Metro) | 2024 | Different configuration. v4 requires metro.config.js with withNativeWind |
| Manual Metro monorepo config | Expo SDK 52 auto-monorepo detection | Nov 2024 | Metro auto-configures for pnpm workspaces. Still need watchFolders for shared packages |
| Old Architecture (Bridge) | New Architecture (Fabric + TurboModules) default | SDK 52 (Nov 2024) | Enabled by default. Better performance, concurrent rendering support |
| React Navigation manual setup | Expo Router file-based routing | SDK 49+ | Declarative routing, automatic deep links, type-safe navigation |

**Deprecated/outdated:**
- `sentry-expo`: Deprecated, replaced by `@sentry/react-native` with Expo config plugin
- NativeWind v2 setup guides: v4 has completely different configuration approach
- Manual Metro workspace config: SDK 52 auto-detects monorepo structure

## Open Questions

1. **Exact refresh token API contract**
   - What we know: Backend uses JWT with refresh tokens stored as argon2 hashes in Redis (24h TTL). Rotation on each use.
   - What's unclear: Exact request/response shape for `/auth/refresh`. Does it expect `refreshToken` in body or cookie? Response shape.
   - Recommendation: Check `apps/api/src/auth/auth.controller.ts` during implementation. Mobile sends refresh token in request body (no BFF proxy like admin panel).

2. **Signature upload API endpoint**
   - What we know: MinIO storage exists, contract module has signature endpoints. Phase 4 implemented signature upsert.
   - What's unclear: Exact multipart upload endpoint path and response format.
   - Recommendation: Check `apps/api/src/contracts/` during implementation for the signature upload endpoint.

3. **@gorhom/bottom-sheet stability on SDK 52**
   - What we know: Multiple GitHub issues report lag and rendering problems. Workarounds exist.
   - What's unclear: Whether v5.2.8 has resolved these issues or if custom backdrop is still needed.
   - Recommendation: Test early in Wave 0. If issues persist, implement custom backdrop. Fallback: use React Native Modal for customer creation (less ideal UX but functional).

4. **Damage sketch stub for Phase 7**
   - What we know: Return wizard has a checklist step. Phase 7 will add damage marking with SVG diagrams.
   - Recommendation: Include the checklist with yes/no toggles and notes field as specified. Do NOT add a stub SVG diagram screen -- it adds complexity without value. Phase 7 can insert a new step into the wizard.

5. **Push notification infrastructure**
   - Recommendation: Defer entirely to Phase 8. No expo-notifications setup in this phase. Adding the config plugin and token registration now would be premature and untestable without backend notification service.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + React Native Testing Library |
| Config file | `apps/mobile/jest.config.ts` (Wave 0 creation) |
| Quick run command | `cd apps/mobile && pnpm test -- --testPathPattern=<pattern> --bail` |
| Full suite command | `cd apps/mobile && pnpm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOB-01a | Login form submits credentials, stores tokens | unit | `pnpm test -- --testPathPattern=use-auth` | No -- Wave 0 |
| MOB-01b | Biometric prompt on app launch when enrolled | unit | `pnpm test -- --testPathPattern=AuthProvider` | No -- Wave 0 |
| MOB-01c | Tab navigation renders 4 tabs | unit | `pnpm test -- --testPathPattern=TabLayout` | No -- Wave 0 |
| MOB-02a | Customer search queries API with debounce | unit | `pnpm test -- --testPathPattern=use-customers` | No -- Wave 0 |
| MOB-02b | Rental wizard advances through 5 steps with validation | unit | `pnpm test -- --testPathPattern=rental-wizard` | No -- Wave 0 |
| MOB-02c | Signature canvas captures and calls upload API | unit | `pnpm test -- --testPathPattern=SignatureScreen` | No -- Wave 0 |
| MOB-02d | Draft persists to AsyncStorage and restores | unit | `pnpm test -- --testPathPattern=rental-draft` | No -- Wave 0 |
| MOB-03a | Return wizard validates mileage >= handover | unit | `pnpm test -- --testPathPattern=return-wizard` | No -- Wave 0 |
| MOB-03b | Return submission calls API and transitions rental | unit | `pnpm test -- --testPathPattern=use-rentals` | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `cd apps/mobile && pnpm test -- --bail --changedSince=HEAD~1`
- **Per wave merge:** `cd apps/mobile && pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/mobile/jest.config.ts` -- Jest config with react-native preset, module name mappers for NativeWind
- [ ] `apps/mobile/src/__mocks__/` -- Mocks for expo-secure-store, expo-local-authentication, expo-haptics, expo-screen-orientation
- [ ] `apps/mobile/src/test-utils.tsx` -- Custom render with QueryClientProvider, i18n provider for test isolation
- [ ] Framework install: `pnpm add -D jest @testing-library/react-native @testing-library/jest-native jest-expo @types/jest`

## Sources

### Primary (HIGH confidence)
- [Expo SDK 52 changelog](https://expo.dev/changelog/2024-11-12-sdk-52) -- New Architecture default, monorepo auto-config
- [Expo Router tabs documentation](https://docs.expo.dev/router/advanced/tabs/) -- File-based tab navigation
- [Expo monorepo guide](https://docs.expo.dev/guides/monorepos/) -- pnpm workspace support, Metro auto-config
- [NativeWind installation guide](https://www.nativewind.dev/docs/getting-started/installation) -- v4 setup steps
- [Expo ScreenOrientation docs](https://docs.expo.dev/versions/latest/sdk/screen-orientation/) -- lockAsync API
- npm registry -- all version numbers verified via `npm view <pkg> version`

### Secondary (MEDIUM confidence)
- [EAS Build with monorepos](https://docs.expo.dev/build-reference/build-with-monorepos/) -- pnpm EAS compatibility
- [TanStack Query token refresh patterns](https://github.com/TanStack/query/discussions/3653) -- Interceptor queue approach
- [react-native-signature-canvas GitHub](https://github.com/YanYuanFE/react-native-signature-canvas) -- WebView canvas API, Expo compatibility

### Tertiary (LOW confidence)
- [@gorhom/bottom-sheet SDK 52 issues](https://github.com/expo/expo/issues/32357) -- Compatibility problems and workarounds. May be resolved in latest patch. Needs validation during implementation.
- [pnpm + EAS build issues](https://github.com/expo/eas-cli/issues/3247) -- Symlink resolution. May be fixed in recent EAS CLI versions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries are locked decisions with verified versions. Only uncertainty is bottom-sheet SDK 52 compat.
- Architecture: HIGH -- Expo Router file-based routing and TanStack Query patterns are well-documented.
- Pitfalls: MEDIUM -- Based on GitHub issues and community reports. Some may be resolved in latest patches.

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (30 days -- stack is stable, Expo SDK 52 is not cutting-edge)
