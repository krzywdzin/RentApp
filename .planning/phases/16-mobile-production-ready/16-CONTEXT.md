# Phase 16: Mobile Production Ready - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix mobile app for production: dynamic API URL, keyboard handling, photo walkthrough in rental wizard, EAS Build config. No new screens beyond photo capture.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Use KeyboardAvoidingView + ScrollView for keyboard handling on form screens
- Photo walkthrough step goes between contract review and signatures in the wizard
- Use expo-camera for photo capture with position tagging
- EAS profiles: development (internal), preview (APK), production (AAB)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Photo types in packages/shared/src/types/photo.types.ts (PHOTO_POSITIONS, WALKTHROUGH_TYPES)
- API endpoints already exist: POST /walkthroughs, POST /walkthroughs/{id}/photos
- SignatureScreen component pattern for multi-step capture
- useRentalDraftStore (Zustand) for wizard state

### Established Patterns
- Expo Router file-based routing in app/(tabs)/new-rental/
- React Query hooks in src/hooks/
- NativeWind for styling
- react-native-toast-message for user feedback

### Integration Points
- app/(tabs)/new-rental/ — wizard flow (index→vehicle→dates→contract→signatures)
- src/api/client.ts — hardcoded API_URL needs to use config
- app.config.ts — EXPO_PUBLIC_API_URL in extra

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard mobile production hardening.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
