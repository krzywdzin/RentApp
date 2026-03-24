# Phase 7: Photo and Damage Documentation - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Structured vehicle photo capture at handover and return with interactive SVG damage marking. Covers: 8-position photo walkthrough wizard, 5-view SVG damage diagram with tap-to-pin interaction, side-by-side photo and damage comparison views, photo metadata (GPS, timestamp), thumbnail generation, and MinIO storage. This phase adds the photo/damage domain to the existing API and mobile app (Phase 6). Admin panel views for comparison are included; customer portal access is not.

</domain>

<decisions>
## Implementation Decisions

### Photo walkthrough structure
- **8 fixed positions** required: Front, Rear, Left side, Right side, Interior front, Interior rear, Dashboard/mileage, Trunk
- **All 8 required** — no skipping allowed, employee must complete all before submitting
- **Retake allowed** — employee can replace a photo before submitting; once submitted, locked
- **Extra freeform photos** allowed after completing the 8 required positions (tagged with free-text label)
- **Wizard UI** — one position at a time, step-by-step flow with progress indicator
- **Reference images** — each wizard step shows a small example photo so employee knows the expected angle
- **Any employee** can perform the walkthrough (not just the rental creator) — different employees may handle handover vs return
- **Timing** — handover walkthrough during rental activation (DRAFT → ACTIVE), return walkthrough during return process
- **Edit window** — 1 hour after submission to add/replace photos, then locked permanently
- **Photos link to damage pins** — each damage pin on the SVG can optionally have an associated close-up photo

### SVG damage diagram
- **5 views**: Top-down, Front, Rear, Left side, Right side — employee swipes between views
- **Generic car outline** — one universal SVG for all vehicles (fleet is ~100 standard cars)
- **Tap-to-place pin** interaction: tap location → numbered pin appears → modal opens with damage type, severity, note, optional photo attachment
- **Damage types** (predefined dropdown, Polish labels): Rysa (Scratch), Wgniecenie (Dent), Pekniecie (Crack), Uszkodzenie lakieru (Paint damage), Uszkodzony element (Broken part), Brakujacy element (Missing part), Inne (Other)
- **Severity per pin**: Minor, Moderate, Severe
- **Filled out after photo walkthrough** — sequential flow: photos first, then damage diagram
- **No damage confirmation** — if no damage found, employee must explicitly confirm "no damage" before proceeding (creates a positive record)

### Handover vs Return comparison
- **Side-by-side photo pairs** — each position shows handover photo on left, return photo on right, with navigation through all 8 positions
- **Side-by-side damage diagrams** — handover diagram on left, return on right; same SVG view; existing damage pins shown in gray, new damage pins in red
- **Pre-loaded existing damage** — return damage diagram starts with handover pins pre-loaded as gray/locked pins; employee adds new damage on top
- **Accessible to Employee + Admin** — both can view comparisons (employees during return, admins for dispute review)

### Photo metadata & storage
- **Resize to max 2048px** (longest edge) before upload — balances quality with storage for ~100 car fleet
- **Thumbnails generated** — ~400px thumbnail created on upload for grid views and comparison; full-size on tap/zoom
- **GPS best-effort** — capture GPS coordinates if available, store null if not; don't block walkthrough for missing GPS
- **Timestamp** — auto-captured at photo time (device clock)
- **Retention** — photos kept forever (as long as rental record exists); storage is cheap, photos are evidence for disputes
- **Storage** — MinIO via existing StorageService, path-based keys (e.g., `photos/{rentalId}/handover/front.jpg`)

### Claude's Discretion
- Exact MinIO key structure and naming convention
- Thumbnail generation approach (server-side vs client-side resize)
- SVG artwork creation (the 5 vehicle view outlines)
- Reference image assets for the walkthrough wizard
- Database model design (PhotoWalkthrough, DamageReport entities)
- Photo upload flow (direct to MinIO vs through API)
- How damage pins are serialized/stored (JSON structure)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — PHOTO-01, PHOTO-02, PHOTO-03 (photo walkthrough), DMG-01, DMG-02 (damage marking)

### Existing storage infrastructure
- `apps/api/src/storage/storage.service.ts` — MinIO/S3 storage service (upload, download, presigned URLs, delete)
- `apps/api/src/storage/storage.module.ts` — Global StorageModule

### Rental integration
- `apps/api/src/rentals/rentals.service.ts` — Rental state machine, activation and return flows
- `apps/api/src/rentals/dto/return-rental.dto.ts` — Current return DTO with area inspection (text-based) — photos extend this
- `apps/api/prisma/schema.prisma` — Current schema; Rental model has handoverData/returnData Json fields

### Prior phase decisions
- `.planning/phases/04-contract-and-pdf/04-CONTEXT.md` — Contract has `damageSketchKey` for freeform sketch in PDF; Phase 7's SVG diagrams are a separate, more structured system

### Project context
- `.planning/PROJECT.md` — Fleet scale (~100 cars, ~10 employees), Polish market

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StorageService` — upload/download/delete/presignedUrl for MinIO; reuse for photo and thumbnail storage
- `AuditInterceptor` — auto-captures mutations; will log photo and damage operations
- `EventEmitter2` — can emit events when walkthrough is completed for downstream triggers
- `ReturnRentalDto` with `AreaInspectionDto` — existing text-based inspection; photo walkthrough extends this

### Established Patterns
- NestJS module: module + controller + service + DTOs
- Prisma: UUID PKs, relations, Json columns for flexible data (used in handoverData/returnData)
- MinIO: `rentapp/` bucket with path-based keys
- Global `StorageModule` — no explicit imports needed in feature modules

### Integration Points
- `apps/api/src/app.module.ts` — Register PhotosModule and DamageModule (or combined PhotoDocumentationModule)
- `apps/api/prisma/schema.prisma` — Add photo and damage models with Rental relation
- `apps/api/src/rentals/` — Walkthrough tied to rental activation and return state transitions
- `packages/shared/src/types/` — Add photo and damage types
- Mobile app (Phase 6) — Photo walkthrough wizard UI and SVG diagram interaction

</code_context>

<specifics>
## Specific Ideas

- Wizard-style step-by-step photo capture — one position at a time, with reference images showing expected angle
- Damage pins are numbered (#1, #2...) with type + severity + optional note + optional linked photo
- Return damage diagram pre-loads handover pins as gray/locked — employee only adds NEW damage in red
- Employee explicitly confirms "no damage" when vehicle is clean — creates a positive inspection record
- 1-hour edit window after walkthrough submission, then permanently locked
- Side-by-side comparison for both photos (per position) and damage diagrams (per SVG view)

</specifics>

<deferred>
## Deferred Ideas

- Vehicle-type-specific SVG outlines (sedan, SUV, van) — use generic outline for v1, consider per-type in v2
- Customer access to photo comparison in customer portal — keep employee + admin only for v1
- AI-assisted damage detection from photos — explicitly out of scope (listed in REQUIREMENTS.md out-of-scope)
- Offline photo capture with background sync — deferred to v2 (OFFL-01, OFFL-02)

</deferred>

---

*Phase: 07-photo-and-damage-documentation*
*Context gathered: 2026-03-24*
