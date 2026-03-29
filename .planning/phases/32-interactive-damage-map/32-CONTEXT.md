# Phase 32: Interactive Damage Map - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the text-based damage checklist in the mobile return wizard with an interactive SVG car diagram. Workers tap body parts to mark damage, each tap opens a modal for damage type + notes. Backend API is already fully implemented.

</domain>

<decisions>
## Implementation Decisions

### SVG Car Diagram Component
- Create reusable `CarDamageMap` component using react-native-svg (already installed, v15.12.1)
- Show a top-down car outline with tappable body zones (hood, roof, trunk, left/right doors, bumpers, etc.)
- Each zone is an SVG path/polygon that responds to press events
- Marked damage points display as colored circles/pins on the car outline
- Use the existing `DamagePin` type from `packages/shared/src/types/photo.types.ts` (has x/y coordinates 0-100, svgView, damageType, severity, note)
- Simplified to single "top" view for v2.3 (multi-view is complex — defer front/rear/side views)

### Damage Detail Modal
- On zone tap: show React Native modal with damage type picker (scratch/dent/crack/other) + notes text input
- Damage types from shared constants: scratch, dent, crack, paint_damage, broken_part, missing_part, other
- Severity: simplified to just damage type + notes (skip severity picker for now — default to "minor")
- Save creates a DamagePin with x/y coordinates based on the tapped zone center

### Return Wizard Integration
- Replace Step 3 (checklist.tsx) with new damage-map.tsx screen
- Create a PhotoWalkthrough (type: RETURN) before saving damage pins
- Add damage API client functions to mobile (POST /damage-reports, POST pins)
- Store walkthrough ID and pins in return-draft.store.ts
- "Brak uszkodzeń" (No damage) button calls POST /damage-reports/:walkthroughId/no-damage

### Claude's Discretion
- Exact SVG paths for car body zones (hood, doors, bumpers, etc.)
- Whether to use Pressable overlays or SVG onPress events for touch handling
- Animation/visual feedback on damage pin placement
- Zone naming and Polish labels for body parts

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DamagePin` interface in `packages/shared/src/types/photo.types.ts` — full type definition
- `DamageReport` model in Prisma schema — pins as JSON array
- `damage.controller.ts` — full CRUD API for damage reports and pins
- `react-native-svg` v15.12.1 already installed
- `return-draft.store.ts` — Zustand store for return wizard state

### Established Patterns
- Return wizard: sequential screens in `app/return/` with shared Zustand store
- Modal components: existing patterns with React Native Modal
- API clients: axios-based in `apps/mobile/src/api/`

### Integration Points
- `app/return/[rentalId].tsx` → mileage → **damage-map (new)** → notes → confirm
- `return-draft.store.ts` needs walkthroughId + damage pins fields
- API: POST /walkthroughs (create return walkthrough), POST /damage-reports/:walkthroughId/pins
- `confirm.tsx` already submits return data — needs to include walkthrough reference

</code_context>

<specifics>
## Specific Ideas

- Replace current damage checklist with interactive SVG car diagram (explicit requirement)
- Each tap opens small modal: damage type (scratch/dent/crack/other) + notes
- Shows marked damage points visually on the car outline
- Worker taps on car body part to mark damage

</specifics>

<deferred>
## Deferred Ideas

- Multi-view car diagram (front, rear, left, right side views) — single top view for v2.3
- Photo attachment per damage pin
- Severity picker (default to minor for now)

</deferred>
