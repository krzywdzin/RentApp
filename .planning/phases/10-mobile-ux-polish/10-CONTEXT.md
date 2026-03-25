# Phase 10: Mobile UX Polish - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds loading, empty, and error states to all mobile screens that currently lack them. Scope is limited to UX feedback improvements — no new features, no API changes, no new screens. The existing LoadingSkeleton component and Toast utility are the primary building blocks.

</domain>

<decisions>
## Implementation Decisions

### Loading States
- Use the existing `LoadingSkeleton` component with appropriate variants (list-item, card) — same pattern as dashboard and rental list screens
- Vehicle selection, return mileage, and return confirm screens get loading skeletons matching their layout structure
- Loading skeletons render when `isLoading` is true from React Query hooks

### Empty & Search States
- Customer search shows "Wpisz minimum 2 znaki aby wyszukac" hint text below the search input when query length < 2
- Search-in-progress indicator: small ActivityIndicator inside the search input area (right side) while `isFetching` is true
- Dashboard greeting fallback: use email prefix when `user.name` is empty/undefined

### Error States
- Rental detail screen: when `isError` is true, show an error card with "Nie udalo sie zaladowac danych" message and a "Sprobuj ponownie" retry button that calls `refetch()`
- PDF open failure in success screen: wrap `Linking.openURL` catch with `Toast.show({ type: 'error', text1: 'Nie udalo sie otworzyc PDF' })`
- All error messages in Polish, matching existing app tone

### Guard Rails
- Return wizard steps (mileage, checklist, confirm) check for `rentalId` from store on mount — if null, redirect to rentals tab using `router.replace('/(tabs)/rentals')`
- OfflineBanner added to return wizard `_layout.tsx` above the slot, same pattern as tabs layout
- Return status guard shows Polish label (e.g., "Zwrocony" instead of "RETURNED") using a status-to-label mapping object

### Claude's Discretion
- Specific skeleton layout structure per screen (number of items, arrangement)
- Animation style for skeletons (reuse whatever LoadingSkeleton already does)
- Exact positioning of search spinner indicator

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LoadingSkeleton` component at `apps/mobile/src/components/LoadingSkeleton.tsx` — supports variants (list-item, card, text) and count prop
- `Toast` from react-native-toast-message — already configured in root layout providers
- `OfflineBanner` component — already used in `apps/mobile/app/(tabs)/_layout.tsx`
- `EmptyState` component — already used in dashboard, rentals list, customer search, vehicle selection
- `useReturnDraftStore` — Zustand store with `rentalId` field for return wizard state

### Established Patterns
- Loading: `if (isLoading) return <LoadingSkeleton variant="..." count={N} />`
- Error toast: `Toast.show({ type: 'error', text1: '...', text2: '...' })`
- Query hooks: all use React Query with `isLoading`, `isError`, `error`, `refetch` available
- Styling: React Native StyleSheet API (NativeWind removed in Phase 9.1)

### Integration Points
- `apps/mobile/app/(tabs)/new-rental/vehicle.tsx` — needs loading skeleton
- `apps/mobile/app/(tabs)/new-rental/index.tsx` — needs search hint and spinner
- `apps/mobile/app/(tabs)/rentals/[id].tsx` — needs error state with retry
- `apps/mobile/app/return/mileage.tsx` — needs loading + rentalId guard
- `apps/mobile/app/return/confirm.tsx` — needs loading + rentalId guard
- `apps/mobile/app/return/checklist.tsx` — needs rentalId guard
- `apps/mobile/app/return/_layout.tsx` — needs OfflineBanner
- `apps/mobile/app/(tabs)/new-rental/success.tsx` — needs PDF error toast
- `apps/mobile/app/return/[rentalId].tsx` — needs Polish status labels
- `apps/mobile/app/(tabs)/index.tsx` — needs greeting fallback

</code_context>

<specifics>
## Specific Ideas

No specific requirements — apply standard UX patterns consistently across all screens following existing app conventions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
