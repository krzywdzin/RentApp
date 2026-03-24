# Phase 7: Photo and Damage Documentation - Research

**Researched:** 2026-03-24
**Domain:** Image upload/processing, interactive SVG damage marking, NestJS file handling
**Confidence:** HIGH

## Summary

Phase 7 adds structured photo capture and interactive damage marking to the existing NestJS API. The backend needs new Prisma models (PhotoWalkthrough, WalkthroughPhoto, DamageReport, DamagePin), endpoints for photo upload with server-side resizing via Sharp, and comparison query endpoints. The mobile app (Phase 6) will provide the wizard UI and SVG interaction -- this research focuses on the API-side data model, upload pipeline, and SVG asset preparation.

The existing codebase already has a proven `FileInterceptor` + `memoryStorage` + `StorageService` pattern in `VehiclesController`. Phase 7 reuses this pattern for photo uploads, adding Sharp for server-side resize and thumbnail generation. Damage pins are stored as a JSON array in a DamageReport model, with coordinates relative to the SVG viewBox.

**Primary recommendation:** Use Sharp for server-side image processing (resize to 2048px + 400px thumbnail), store photos in MinIO with path-based keys, store damage pins as typed JSON in Prisma, and create simple static SVG assets for the 5 vehicle views.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 8 fixed photo positions: Front, Rear, Left side, Right side, Interior front, Interior rear, Dashboard/mileage, Trunk -- all required, no skipping
- Wizard UI: one position at a time, step-by-step with progress indicator and reference images
- Retake allowed before submission; 1-hour edit window after submission, then permanently locked
- Extra freeform photos allowed after completing the 8 required positions
- Any employee can perform walkthrough (not just rental creator)
- 5 SVG views: Top-down, Front, Rear, Left side, Right side -- generic car outline for all vehicles
- Tap-to-place pin interaction with damage type (7 predefined Polish labels), severity (Minor/Moderate/Severe), note, optional photo
- "No damage" explicit confirmation creates positive record
- Damage diagram filled after photo walkthrough (sequential flow)
- Return damage diagram pre-loads handover pins as gray/locked; new damage in red
- Side-by-side comparison for both photos (per position) and damage diagrams (per SVG view)
- Resize to max 2048px longest edge before upload; 400px thumbnails
- GPS best-effort (null if unavailable); timestamp auto-captured
- Retention: photos kept forever (as long as rental exists)
- Storage: MinIO via existing StorageService

### Claude's Discretion
- Exact MinIO key structure and naming convention
- Thumbnail generation approach (server-side vs client-side resize)
- SVG artwork creation (the 5 vehicle view outlines)
- Reference image assets for the walkthrough wizard
- Database model design (PhotoWalkthrough, DamageReport entities)
- Photo upload flow (direct to MinIO vs through API)
- How damage pins are serialized/stored (JSON structure)

### Deferred Ideas (OUT OF SCOPE)
- Vehicle-type-specific SVG outlines (sedan, SUV, van) -- use generic for v1
- Customer access to photo comparison in customer portal
- AI-assisted damage detection from photos
- Offline photo capture with background sync (OFFL-01, OFFL-02)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PHOTO-01 | Structured photo walkthrough at handover and return | PhotoWalkthrough model + 8-position enum + upload endpoint with Sharp processing |
| PHOTO-02 | Each photo has timestamp and GPS metadata | EXIF extraction via Sharp metadata or exifr; stored in WalkthroughPhoto model fields |
| PHOTO-03 | Photos linked to rental with side-by-side comparison | Rental relation + comparison endpoint returning handover/return photo pairs per position |
| DMG-01 | Interactive SVG damage diagram with tap-pin-photo | DamageReport model + DamagePin JSON array with coordinates, type, severity, optional photoKey |
| DMG-02 | Side-by-side damage diagram comparison (handover vs return) | Comparison endpoint returning both reports; return report includes handover pins as locked |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sharp | 0.34.5 | Server-side image resize + thumbnail generation | De facto Node.js image processing; fast, libvips-based, handles JPEG/PNG/WebP |
| multer | 2.1.1 | Multipart file upload parsing | Already used in project via @nestjs/platform-express FileInterceptor |
| @prisma/client | ^6.0.0 | Database ORM with JSON column support | Already in project; Prisma Json type for damage pin storage |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| exifr | 7.1.3 | EXIF/GPS metadata extraction from photos | Extract GPS coordinates from uploaded JPEG files before resize strips EXIF |
| class-validator | ^0.14.0 | DTO validation | Already in project; validate upload metadata DTOs |
| uuid | ^11.0.0 | Generate unique photo filenames | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sharp (server-side) | Client-side resize before upload | Server-side is more reliable and consistent; client can send originals |
| exifr | sharp.metadata() | Sharp gives basic EXIF but exifr is more reliable for GPS extraction |
| JSON column for pins | Separate DamagePin table | JSON is simpler for this use case; pins are always loaded with their report |

**Installation:**
```bash
cd apps/api && pnpm add sharp exifr && pnpm add -D @types/sharp
```

**Note:** `@types/sharp` may not be needed if sharp ships its own types (it does as of v0.33+). Verify after install.

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
  photos/
    photos.module.ts           # PhotosModule (includes damage)
    photos.controller.ts       # Upload, list, comparison endpoints
    photos.service.ts          # Upload pipeline, resize, metadata extraction
    damage.controller.ts       # Damage report CRUD, comparison
    damage.service.ts          # Damage report business logic
    dto/
      upload-photo.dto.ts      # Position, rentalId, walkthroughType
      create-damage-report.dto.ts
      create-damage-pin.dto.ts
    constants/
      photo-positions.ts       # PHOTO_POSITIONS enum
      damage-types.ts          # DAMAGE_TYPES, SEVERITY_LEVELS
    pipes/
      image-validation.pipe.ts # Validate file type and size
packages/shared/src/types/
  photo.types.ts               # PhotoPosition, WalkthroughType, DamageType, etc.
apps/api/prisma/
  schema.prisma                # Add PhotoWalkthrough, WalkthroughPhoto, DamageReport models
```

### Pattern 1: Photo Upload Pipeline
**What:** Upload photo through API, extract EXIF/GPS, resize with Sharp, generate thumbnail, store both in MinIO
**When to use:** Every photo upload (walkthrough position or freeform)
**Example:**
```typescript
// photos.service.ts
async uploadPhoto(
  file: Express.Multer.File,
  dto: UploadPhotoDto,
  userId: string,
): Promise<WalkthroughPhoto> {
  // 1. Extract GPS metadata BEFORE resize (resize strips EXIF)
  const gps = await this.extractGps(file.buffer);

  // 2. Resize to max 2048px longest edge
  const resized = await sharp(file.buffer)
    .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  // 3. Generate 400px thumbnail
  const thumbnail = await sharp(file.buffer)
    .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();

  // 4. Upload both to MinIO
  const photoKey = `photos/${dto.rentalId}/${dto.walkthroughType}/${dto.position}.jpg`;
  const thumbKey = `photos/${dto.rentalId}/${dto.walkthroughType}/${dto.position}_thumb.jpg`;
  await this.storage.upload(photoKey, resized, 'image/jpeg');
  await this.storage.upload(thumbKey, thumbnail, 'image/jpeg');

  // 5. Create database record
  return this.prisma.walkthroughPhoto.create({
    data: {
      walkthroughId: dto.walkthroughId,
      position: dto.position,
      photoKey,
      thumbnailKey: thumbKey,
      gpsLat: gps?.latitude ?? null,
      gpsLng: gps?.longitude ?? null,
      capturedAt: new Date(dto.capturedAt),
      uploadedById: userId,
    },
  });
}
```

### Pattern 2: MinIO Key Structure
**What:** Path-based keys for organized photo storage
**Convention:**
```
photos/{rentalId}/handover/front.jpg
photos/{rentalId}/handover/front_thumb.jpg
photos/{rentalId}/handover/extra_{uuid}.jpg
photos/{rentalId}/return/front.jpg
photos/{rentalId}/return/front_thumb.jpg
damage/{rentalId}/handover/pin_{pinNumber}.jpg
damage/{rentalId}/return/pin_{pinNumber}.jpg
```

### Pattern 3: Damage Pin JSON Structure
**What:** Damage pins stored as typed JSON array in DamageReport
**Example:**
```typescript
// Stored in DamageReport.pins (Prisma Json column)
interface DamagePin {
  pinNumber: number;           // Sequential: 1, 2, 3...
  svgView: 'top' | 'front' | 'rear' | 'left' | 'right';
  x: number;                   // 0-100 percentage of SVG viewBox width
  y: number;                   // 0-100 percentage of SVG viewBox height
  damageType: DamageType;      // 'scratch' | 'dent' | 'crack' | etc.
  severity: 'minor' | 'moderate' | 'severe';
  note?: string;
  photoKey?: string;           // Optional close-up photo in MinIO
  isPreExisting?: boolean;     // true for gray/locked pins from handover
}
```

### Pattern 4: Edit Window Enforcement
**What:** 1-hour edit window after walkthrough submission
**Example:**
```typescript
private isEditable(walkthrough: PhotoWalkthrough): boolean {
  if (!walkthrough.submittedAt) return true; // Not yet submitted
  const hourMs = 60 * 60 * 1000;
  return Date.now() - walkthrough.submittedAt.getTime() < hourMs;
}
```

### Anti-Patterns to Avoid
- **Storing photos as base64 in the database:** Always use MinIO object storage; DB should only hold keys/paths
- **Processing images synchronously in the request:** Sharp is fast enough for single-image resize, but never resize in a transaction
- **Coupling photo upload to rental state transition:** Keep photo upload as separate endpoint; state transition references the walkthrough
- **Using absolute pixel coordinates for damage pins:** Use percentage-based coordinates (0-100) relative to SVG viewBox to be resolution-independent

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image resize/thumbnail | Manual canvas or ffmpeg | sharp | Handles orientation, color profiles, formats; 10x faster than ImageMagick |
| GPS extraction from JPEG | Manual EXIF binary parsing | exifr | EXIF spec is complex; GPS coordinate parsing has DMS/DD conversion |
| File upload parsing | Manual multipart parsing | multer (via FileInterceptor) | Already integrated in NestJS; handles streaming, limits, filtering |
| SVG vehicle outlines | Drawing from scratch | Adapt existing open-source car SVG assets | Use simplified SVG paths from open car outline assets |
| UUID generation | Custom ID scheme | uuid v4 | Already in project for freeform photo naming |

**Key insight:** The upload-process-store pipeline is the core complexity. Sharp handles the image processing reliably; the real engineering is in the data model design, edit window logic, and comparison query structure.

## Common Pitfalls

### Pitfall 1: EXIF Data Lost After Resize
**What goes wrong:** Sharp strips EXIF metadata during resize by default. If you resize first then try to extract GPS, you get nothing.
**Why it happens:** Sharp's default behavior removes metadata for smaller output size.
**How to avoid:** Extract GPS coordinates from the original buffer BEFORE any Sharp processing.
**Warning signs:** All GPS values are null despite photos having location data.

### Pitfall 2: Image Orientation Issues
**What goes wrong:** Photos appear rotated in the browser even though they look correct on the phone.
**Why it happens:** Phone cameras store rotation in EXIF orientation tag; some viewers auto-rotate, others don't.
**How to avoid:** Sharp's `.rotate()` (with no args) auto-applies EXIF orientation. Call it before resize: `sharp(buffer).rotate().resize(...)`.
**Warning signs:** Landscape photos appearing as portrait or vice versa.

### Pitfall 3: Percentage Coordinates vs Pixel Coordinates for Damage Pins
**What goes wrong:** Pins appear in wrong positions on different screen sizes.
**Why it happens:** Using absolute pixel coordinates that depend on rendered SVG size.
**How to avoid:** Store pin coordinates as percentages (0-100) of the SVG viewBox dimensions. The mobile app converts tap position to percentage; rendering converts back.
**Warning signs:** Pins shift when viewed on admin panel vs mobile.

### Pitfall 4: Race Condition on Edit Window
**What goes wrong:** Employee replaces a photo at 59:59 and the upload completes after the window closes.
**Why it happens:** Checking editability at request start but upload takes time.
**How to avoid:** Check editability at request start (optimistic). For a 1-hour window on a ~10-employee fleet, this edge case is acceptable. Don't over-engineer with distributed locks.
**Warning signs:** N/A -- pragmatic acceptance for small fleet.

### Pitfall 5: Large File Upload Timeout
**What goes wrong:** Original phone photos (8-12MB) cause upload timeouts.
**Why it happens:** Default body-parser limits and timeouts too small.
**How to avoid:** Set multer limit to 20MB (generous for originals); Sharp compresses server-side. Configure request timeout appropriately.
**Warning signs:** 413 or timeout errors on photo upload.

### Pitfall 6: Missing Walkthrough Completeness Validation
**What goes wrong:** Walkthrough is "submitted" with only 5 of 8 photos.
**Why it happens:** No server-side validation that all 8 positions are covered.
**How to avoid:** On walkthrough submission, query all photos and validate all 8 positions are present. Reject incomplete submissions.
**Warning signs:** Incomplete walkthroughs in database.

## Code Examples

### GPS Extraction with exifr
```typescript
import * as exifr from 'exifr';

async extractGps(buffer: Buffer): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const gps = await exifr.gps(buffer);
    if (gps?.latitude && gps?.longitude) {
      return { latitude: gps.latitude, longitude: gps.longitude };
    }
    return null;
  } catch {
    return null; // GPS not available -- best effort
  }
}
```

### NestJS File Upload Controller (follows existing VehiclesController pattern)
```typescript
@Post(':walkthroughId/photos')
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
@UseInterceptors(
  FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for originals
    fileFilter: (_req, file, cb) => {
      cb(null, /^image\/(jpeg|png|heic|heif)$/i.test(file.mimetype));
    },
  }),
)
async uploadPhoto(
  @Param('walkthroughId', ParseUUIDPipe) walkthroughId: string,
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: UploadPhotoDto,
  @CurrentUser() user: any,
) {
  if (!file) throw new BadRequestException('Image file is required');
  return this.photosService.uploadPhoto(file, { ...dto, walkthroughId }, user.sub);
}
```

### Prisma Schema Additions
```prisma
enum WalkthroughType {
  HANDOVER
  RETURN
}

model PhotoWalkthrough {
  id              String           @id @default(uuid())
  rentalId        String
  type            WalkthroughType
  performedById   String
  submittedAt     DateTime?
  noDamage        Boolean          @default(false)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  rental          Rental           @relation(fields: [rentalId], references: [id])
  performedBy     User             @relation("WalkthroughPerformedBy", fields: [performedById], references: [id])
  photos          WalkthroughPhoto[]
  damageReport    DamageReport?

  @@unique([rentalId, type])
  @@index([rentalId])
  @@map("photo_walkthroughs")
}

model WalkthroughPhoto {
  id              String           @id @default(uuid())
  walkthroughId   String
  position        String           // 'front', 'rear', ... or 'extra'
  label           String?          // Free-text label for extra photos
  photoKey        String           // MinIO key for full-size
  thumbnailKey    String           // MinIO key for thumbnail
  gpsLat          Float?
  gpsLng          Float?
  capturedAt      DateTime
  uploadedAt      DateTime         @default(now())
  uploadedById    String

  walkthrough     PhotoWalkthrough @relation(fields: [walkthroughId], references: [id], onDelete: Cascade)
  uploadedBy      User             @relation("PhotoUploadedBy", fields: [uploadedById], references: [id])

  @@unique([walkthroughId, position])
  @@index([walkthroughId])
  @@map("walkthrough_photos")
}

model DamageReport {
  id              String           @id @default(uuid())
  walkthroughId   String           @unique
  pins            Json             // DamagePin[] -- see JSON structure above
  noDamageConfirmed Boolean        @default(false)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  walkthrough     PhotoWalkthrough @relation(fields: [walkthroughId], references: [id], onDelete: Cascade)

  @@map("damage_reports")
}
```

### Comparison Endpoint
```typescript
@Get('rentals/:rentalId/comparison')
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
async getComparison(@Param('rentalId', ParseUUIDPipe) rentalId: string) {
  return this.photosService.getComparison(rentalId);
  // Returns: {
  //   handover: { walkthrough, photos: [...], damageReport },
  //   return: { walkthrough, photos: [...], damageReport },
  //   photoComparison: [{ position, handover: { url, thumbnail }, return: { url, thumbnail } }],
  //   damageComparison: { handoverPins: [...], returnPins: [...], newPins: [...] }
  // }
}
```

### Shared Types
```typescript
// packages/shared/src/types/photo.types.ts

export const PHOTO_POSITIONS = [
  'front', 'rear', 'left_side', 'right_side',
  'interior_front', 'interior_rear', 'dashboard', 'trunk',
] as const;
export type PhotoPosition = typeof PHOTO_POSITIONS[number];

export const WALKTHROUGH_TYPES = ['HANDOVER', 'RETURN'] as const;
export type WalkthroughType = typeof WALKTHROUGH_TYPES[number];

export const DAMAGE_TYPES = [
  'scratch',     // Rysa
  'dent',        // Wgniecenie
  'crack',       // Pekniecie
  'paint_damage', // Uszkodzenie lakieru
  'broken_part', // Uszkodzony element
  'missing_part', // Brakujacy element
  'other',       // Inne
] as const;
export type DamageType = typeof DAMAGE_TYPES[number];

export const SEVERITY_LEVELS = ['minor', 'moderate', 'severe'] as const;
export type SeverityLevel = typeof SEVERITY_LEVELS[number];

export const SVG_VIEWS = ['top', 'front', 'rear', 'left', 'right'] as const;
export type SvgView = typeof SVG_VIEWS[number];

export interface DamagePin {
  pinNumber: number;
  svgView: SvgView;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  damageType: DamageType;
  severity: SeverityLevel;
  note?: string;
  photoKey?: string;
  isPreExisting?: boolean;
}

export interface PhotoComparisonPair {
  position: PhotoPosition;
  handover: { photoUrl: string; thumbnailUrl: string } | null;
  return: { photoUrl: string; thumbnailUrl: string } | null;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ImageMagick/GM for Node.js | sharp (libvips) | 2020+ | 4-5x faster, lower memory, native Node bindings |
| Manual EXIF parsing | exifr library | 2021+ | Reliable GPS extraction, handles all EXIF variants |
| Base64 in DB | Object storage (MinIO/S3) | Industry standard | Scalable, CDN-compatible, no DB bloat |
| Separate DamagePin table rows | JSON column | Prisma Json type | Simpler queries, pins always loaded with report, no N+1 |

## Open Questions

1. **SVG Asset Creation**
   - What we know: Need 5 views of a generic car outline (top, front, rear, left, right)
   - What's unclear: Whether to create from scratch, use an open-source car SVG, or generate simplified paths
   - Recommendation: Create minimal SVG outlines in the codebase (5 small files, ~50 lines each). A simple car silhouette is sufficient. Can be hand-drawn in an SVG editor or adapted from open-source auto outlines.

2. **Reference Images for Walkthrough Wizard**
   - What we know: Each wizard step should show an example photo of expected angle
   - What's unclear: Whether to use real photos or illustrated guides
   - Recommendation: Use simple placeholder illustrations (bundled as static assets in the mobile app). Real reference photos can be added later by the business.

3. **HEIC/HEIF Support**
   - What we know: iPhones capture in HEIC format by default
   - What's unclear: Whether sharp handles HEIC on all platforms
   - Recommendation: Sharp supports HEIC input on macOS/Linux with libvips >= 8.14. Include HEIC in accepted mimetypes; Sharp will convert to JPEG on output. Test on the deployment platform.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 (unit) + Jest e2e with Supertest |
| Config file | `apps/api/package.json` (unit), `apps/api/test/jest-e2e.json` (e2e) |
| Quick run command | `cd apps/api && pnpm test -- --testPathPattern=photos` |
| Full suite command | `cd apps/api && pnpm test && pnpm test:e2e` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PHOTO-01 | Upload photo for each of 8 positions; reject incomplete submission | unit | `cd apps/api && pnpm test -- --testPathPattern=photos.service.spec` | Wave 0 |
| PHOTO-02 | Extract GPS and timestamp; store metadata | unit | `cd apps/api && pnpm test -- --testPathPattern=photos.service.spec` | Wave 0 |
| PHOTO-03 | Comparison endpoint returns handover+return pairs with presigned URLs | unit + e2e | `cd apps/api && pnpm test:e2e -- --testPathPattern=photos` | Wave 0 |
| DMG-01 | Create damage report with pins; validate pin structure | unit | `cd apps/api && pnpm test -- --testPathPattern=damage.service.spec` | Wave 0 |
| DMG-02 | Comparison returns both reports; return includes pre-existing pins | unit | `cd apps/api && pnpm test -- --testPathPattern=damage.service.spec` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && pnpm test -- --testPathPattern="photos|damage"`
- **Per wave merge:** `cd apps/api && pnpm test && pnpm test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/photos/photos.service.spec.ts` -- covers PHOTO-01, PHOTO-02, PHOTO-03
- [ ] `apps/api/src/photos/damage.service.spec.ts` -- covers DMG-01, DMG-02
- [ ] `apps/api/test/photos.e2e-spec.ts` -- covers PHOTO-03 e2e
- [ ] Sharp and exifr installed: `cd apps/api && pnpm add sharp exifr`

*(Existing test infrastructure pattern -- jest with mocked PrismaService and StorageService -- is well established. Follow the contracts.service.spec.ts pattern for mocking.)*

## Sources

### Primary (HIGH confidence)
- Project codebase: `apps/api/src/vehicles/vehicles.controller.ts` -- existing FileInterceptor + memoryStorage + StorageService pattern
- Project codebase: `apps/api/src/storage/storage.service.ts` -- MinIO/S3 client with upload, getPresignedDownloadUrl, getBuffer, delete
- Project codebase: `apps/api/prisma/schema.prisma` -- existing Prisma schema with Json columns, UUID PKs, relation patterns
- npm registry: sharp@0.34.5, exifr@7.1.3, multer@2.1.1 (verified via `npm view`)

### Secondary (MEDIUM confidence)
- [NestJS file upload guide (Feb 2026)](https://oneuptime.com/blog/post/2026-02-02-nestjs-file-uploads/view) -- FileInterceptor + Sharp pipe pattern
- [NestJS + Sharp image manipulation](https://www.telerik.com/blogs/image-manipulation-nestjs-sharp) -- resize and thumbnail generation patterns
- [NestJS optimized image pipe](https://dev.to/andersonjoseph/nestjs-creating-a-pipe-to-optimize-uploaded-images-5b3h) -- SharpPipe pattern for NestJS

### Tertiary (LOW confidence)
- None -- all findings verified against codebase patterns and npm registry

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- sharp and multer are established; versions verified against npm
- Architecture: HIGH -- follows exact patterns already in the codebase (VehiclesController upload, StorageService)
- Pitfalls: HIGH -- EXIF stripping and orientation are well-documented sharp behaviors
- Data model: MEDIUM -- Prisma schema design is a recommendation; may need adjustment during implementation

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain, no fast-moving changes expected)
