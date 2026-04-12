# Phase 35: Google Places Integration - Research

**Researched:** 2026-04-12
**Domain:** Google Places Autocomplete (backend proxy + mobile UI + DB schema + display)
**Confidence:** HIGH

## Summary

This phase adds Google Places autocomplete for pickup and return locations in the mobile rental wizard. The architecture is: mobile calls a backend proxy (`GET /places/autocomplete`), which calls Google Places API (legacy format) server-side, keeping the API key secure. Selected locations are stored as JSON fields (`pickupLocation`, `returnLocation`) on the Rental model and displayed in rental detail views (mobile + web).

The recommended approach uses `react-native-google-places-autocomplete` v2.6.4 with its `requestUrl` prop set to `useOnPlatform: "all"`, routing all requests through the NestJS backend. The backend proxy translates requests to Google's Places Autocomplete legacy API (`GET https://maps.googleapis.com/maps/api/place/autocomplete/json`), adds the API key, applies country bias (PL), and returns the raw Google response. No session tokens are needed for the legacy autocomplete endpoint at this usage scale (the $200/month free credit covers approximately 70K autocomplete calls).

**Primary recommendation:** Use `react-native-google-places-autocomplete` with backend proxy (`requestUrl` prop), store `{ address, placeId }` JSON on Rental, display as read-only text in detail views.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Inline text field with dropdown suggestions (like Google Maps) -- not a modal
- Two separate fields: one for pickup location, one for return location
- Fields appear on the **dates step** of mobile wizard (alongside dates, rate, deposit)
- Save: formatted address string + Google `place_id`
- Two new fields on Rental: `pickupLocation` (JSON with address + placeId) and `returnLocation` (JSON with address + placeId)
- place_id enables opening location in Google Maps later if needed
- Google Places API key stays on backend -- mobile calls proxy endpoint
- Proxy endpoint: `GET /places/autocomplete?input=...` returns suggestions

### Claude's Discretion
- Exact proxy endpoint design (session tokens, country bias to PL)
- How to display saved locations in rental detail views (web + mobile)
- Debounce timing for autocomplete input
- What to show when Google Places returns no results

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NAJEM-02 | Worker can select pickup location from Google Places autocomplete | `react-native-google-places-autocomplete` with `requestUrl` proxy; `pickupLocation` field on dates.tsx |
| NAJEM-03 | Worker can select return location from Google Places autocomplete | Same component, second instance for `returnLocation` field on dates.tsx |
| NAJEM-04 | Selected location saved with rental and visible in details | New `pickupLocation`/`returnLocation` JSON columns on Rental; display in mobile `[id].tsx` and web `[id]/page.tsx` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-native-google-places-autocomplete` | 2.6.4 | Autocomplete UI component for mobile | 60K+ weekly npm downloads; pure JS (no native deps); works in Expo Go; `requestUrl` prop supports backend proxy routing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node native `fetch` | Built-in (Node 22) | Backend HTTP calls to Google Places API | In PlacesService to call Google API; no need for axios or @nestjs/axios |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-native-google-places-autocomplete` | Custom autocomplete with `AppInput` + `FlatList` | More work, no pre-built dropdown behavior, but full styling control. Only consider if the library's styling proves incompatible with the app's design system. |
| `react-native-google-places-autocomplete` | `react-native-google-places-textinput` | Newer, uses Places API (New), but much smaller community (< 1K weekly downloads), less battle-tested |
| Node `fetch` | `@nestjs/axios` (HttpModule) | Adds a dependency; native fetch is stable in Node 22 and sufficient for simple GET proxy |

**Installation:**
```bash
# Mobile
cd apps/mobile && npm install react-native-google-places-autocomplete
```

No new API dependencies needed -- Node 22 native `fetch` is used for the proxy.

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/places/
  places.module.ts           # NestJS module, imports ConfigModule
  places.controller.ts       # GET /places/autocomplete?input=...
  places.service.ts           # Calls Google Places API via fetch
  dto/autocomplete-query.dto.ts  # Input validation (min 3 chars, max 100)

packages/shared/src/types/
  rental.types.ts            # Add PlaceLocation interface + update RentalDto

apps/mobile/src/components/
  PlacesAutocomplete.tsx     # Wrapper around GooglePlacesAutocomplete with project styles

apps/api/prisma/
  schema.prisma              # Add pickupLocation/returnLocation Json? on Rental
```

### Pattern 1: Backend Proxy for Google Places
**What:** NestJS controller receives autocomplete query from mobile, calls Google Places API server-side, returns raw response.
**When to use:** Always -- API key must never reach the client.
**Example:**
```typescript
// apps/api/src/places/places.service.ts
@Injectable()
export class PlacesService {
  private readonly apiKey: string;
  private readonly logger = new Logger(PlacesService.name);

  constructor(private config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('GOOGLE_PLACES_API_KEY');
  }

  async autocomplete(input: string, sessionToken?: string): Promise<any> {
    const params = new URLSearchParams({
      input,
      key: this.apiKey,
      components: 'country:pl',
      language: 'pl',
      types: 'address',
    });
    if (sessionToken) params.append('sessiontoken', sessionToken);

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
    const res = await fetch(url);
    if (!res.ok) {
      this.logger.error(`Google Places API error: ${res.status}`);
      throw new Error('Places API error');
    }
    return res.json();
  }
}
```

### Pattern 2: Library Proxy Configuration (Mobile)
**What:** `react-native-google-places-autocomplete` uses `requestUrl` prop with `useOnPlatform: "all"` to route ALL requests through our backend.
**When to use:** For every GooglePlacesAutocomplete instance.
**Example:**
```typescript
// apps/mobile/src/components/PlacesAutocomplete.tsx
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { API_URL } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';

interface Props {
  label: string;
  value: string | null;
  onSelect: (data: { address: string; placeId: string }) => void;
}

export function PlacesAutocomplete({ label, value, onSelect }: Props) {
  const { accessToken } = useAuth();

  return (
    <GooglePlacesAutocomplete
      placeholder={label}
      onPress={(data) => {
        onSelect({
          address: data.description,
          placeId: data.place_id,
        });
      }}
      query={{
        key: '', // Empty -- proxy adds the key server-side
        language: 'pl',
        components: 'country:pl',
        types: 'address',
      }}
      requestUrl={{
        useOnPlatform: 'all',
        url: `${API_URL}/places`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }}
      debounce={400}
      minLength={3}
      fetchDetails={false} // We only need description + place_id
      enablePoweredByContainer={false}
      textInputProps={{
        // Style to match AppInput
      }}
      styles={{
        // Custom styles matching app theme
      }}
    />
  );
}
```

### Pattern 3: JSON Column for Location Data (Prisma)
**What:** Store location as `Json?` column on Rental (same pattern as `handoverData`).
**When to use:** For `pickupLocation` and `returnLocation`.
**Example:**
```prisma
model Rental {
  // ... existing fields
  pickupLocation   Json?    // { address: string, placeId: string }
  returnLocation   Json?    // { address: string, placeId: string }
}
```

```typescript
// packages/shared/src/types/rental.types.ts
export interface PlaceLocation {
  address: string;
  placeId: string;
}
```

### Anti-Patterns to Avoid
- **Embedding Google API key in mobile app:** API key exposed in JS bundle, no rate limiting, billing risk. Always proxy through backend.
- **Calling Place Details API for every selection:** Unnecessary cost. The autocomplete response already includes `description` (formatted address) and `place_id`. Only call Place Details if you need lat/lng (not needed per requirements).
- **Storing only `place_id` without address string:** Place IDs can change over time. Always store the formatted address alongside it so the rental record remains readable even if the place_id expires.
- **No debounce on autocomplete input:** Every keystroke = billable API call. Always debounce (400ms minimum).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Autocomplete dropdown UI | Custom FlatList + TextInput with positioning, keyboard handling, z-index | `react-native-google-places-autocomplete` | Dropdown positioning, keyboard avoidance, scroll inside scroll, touch handling are surprisingly complex on mobile |
| Google API response parsing | Custom response mapper | Library handles it natively | Response format is stable and the library already maps predictions correctly |
| Debouncing | Custom setTimeout/clearTimeout | Library's built-in `debounce` prop | Already implemented with proper cleanup |

**Key insight:** The autocomplete dropdown UX (positioning above keyboard, handling scroll within scroll, dismissing on outside tap) is deceptively complex. The library handles all of this. Custom building only makes sense if styling is impossible to match.

## Common Pitfalls

### Pitfall 1: requestUrl Proxy Must Mirror Google's Response Format
**What goes wrong:** Backend proxy returns a custom/simplified response, but the library expects EXACT Google Places API response format.
**Why it happens:** Developer simplifies the proxy response for "cleanliness."
**How to avoid:** The proxy endpoint must forward the raw Google response JSON without transformation. The library parses `predictions[].description` and `predictions[].place_id` from the standard format.
**Warning signs:** Autocomplete dropdown shows empty/undefined items.

### Pitfall 2: requestUrl Path Must Match Google's Endpoint Structure
**What goes wrong:** The library appends `/place/autocomplete/json?...` to the `requestUrl.url` value. If the proxy URL doesn't account for this, requests 404.
**Why it happens:** The library constructs the full URL as `${requestUrl.url}/place/autocomplete/json?input=...&key=...`.
**How to avoid:** The backend controller must handle `GET /places/place/autocomplete/json` (note the path the library constructs), OR set `requestUrl.url` to the base that makes the full path work. The simplest approach: set `requestUrl.url` to `${API_URL}/places` and create a controller route for `place/autocomplete/json` under the `/places` prefix.
**Warning signs:** Network errors, 404 responses in the mobile console.

### Pitfall 3: Google Places API Billing Without Budget Cap
**What goes wrong:** No billing alerts set; unexpected charges accumulate.
**Why it happens:** Testing + development + production usage without monitoring.
**How to avoid:** Set Google Cloud billing budget alert at $10/month. The $200/month free credit should cover usage for a ~10 employee fleet, but monitor anyway. Use `components: 'country:pl'` and `types: 'address'` to reduce irrelevant results and wasted keystrokes.
**Warning signs:** Google Cloud billing dashboard showing unexpected charges.

### Pitfall 4: ScrollView Conflict on dates.tsx
**What goes wrong:** The autocomplete dropdown renders inside the existing `ScrollView` on dates.tsx, causing nested scroll issues -- dropdown scrolls the parent instead of its own list.
**Why it happens:** `GooglePlacesAutocomplete` renders its own scrollable list, but it's nested inside the page's ScrollView.
**How to avoid:** Use `listViewDisplayed="auto"` and set `keyboardShouldPersistTaps="handled"` on the parent ScrollView (already set in dates.tsx). May need `nestedScrollEnabled={true}` on the library's internal ListView. If positioning is problematic, consider `renderRow` prop to limit results to 3-4 items to avoid scroll conflict.
**Warning signs:** Dropdown suggestions not tappable, or tapping a suggestion scrolls the page instead.

### Pitfall 5: Empty/No Results UX
**What goes wrong:** User types an address that returns no results; nothing happens and they're confused.
**Why it happens:** Library shows nothing when predictions array is empty.
**How to avoid:** Use `listEmptyComponent` prop to show "Brak wynikow -- wpisz pelniejszy adres" message. Also consider `predefinedPlaces` prop to add commonly-used pickup locations (e.g., the rental office address).
**Warning signs:** Workers report the autocomplete "doesn't work" for certain addresses.

## Code Examples

### Backend Proxy Controller
```typescript
// apps/api/src/places/places.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlacesService } from './places.service';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlacesController {
  constructor(private placesService: PlacesService) {}

  // The library calls: /places/place/autocomplete/json?input=...&key=...
  @Get('place/autocomplete/json')
  async autocomplete(
    @Query('input') input: string,
    @Query('sessiontoken') sessionToken?: string,
  ) {
    if (!input || input.length < 2) {
      return { predictions: [], status: 'OK' };
    }
    return this.placesService.autocomplete(input, sessionToken);
  }
}
```

### Shared Type for Location
```typescript
// packages/shared/src/types/rental.types.ts
export interface PlaceLocation {
  address: string;
  placeId: string;
}

// Add to RentalDto:
export interface RentalDto {
  // ... existing fields
  pickupLocation: PlaceLocation | null;
  returnLocation: PlaceLocation | null;
}
```

### Zod Schema Extension
```typescript
// packages/shared/src/schemas/rental.schemas.ts
const PlaceLocationSchema = z.object({
  address: z.string().min(1).max(500),
  placeId: z.string().min(1).max(300),
}).nullable().optional();

// Add to CreateRentalSchema:
pickupLocation: PlaceLocationSchema,
returnLocation: PlaceLocationSchema,
```

### Draft Store Extension
```typescript
// apps/mobile/src/stores/rental-draft.store.ts
// Add to RentalDraft interface:
pickupLocation: { address: string; placeId: string } | null;
returnLocation: { address: string; placeId: string } | null;

// Add to initialDraft:
pickupLocation: null,
returnLocation: null,
```

### Display in Mobile Rental Detail
```typescript
// In apps/mobile/app/(tabs)/rentals/[id].tsx, add after Dates card:
{(rental.pickupLocation || rental.returnLocation) && (
  <AppCard cardStyle={s.mb12}>
    <Text style={s.sectionLabel}>Lokalizacje</Text>
    {rental.pickupLocation && (
      <>
        <Text style={s.smallLabel}>Miejsce wydania</Text>
        <Text style={s.mainText}>{rental.pickupLocation.address}</Text>
      </>
    )}
    {rental.returnLocation && (
      <>
        <Text style={s.smallLabel}>Miejsce zdania</Text>
        <Text style={s.mainText}>{rental.returnLocation.address}</Text>
      </>
    )}
  </AppCard>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Places API (Legacy) GET endpoints | Places API (New) POST endpoints | March 2025 | New API has different pricing and session model; legacy still fully supported |
| No session tokens | Session tokens bundle autocomplete + details | 2023+ | Cost optimization; not critical at our scale |
| API key in mobile app | Backend proxy | Industry best practice | Key security + billing control |

**Deprecated/outdated:**
- Google Places API legacy endpoints are NOT deprecated (confirmed April 2026), but new features only come to the New API
- `react-native-google-places-autocomplete` uses legacy API format -- this is fine for our use case

## Open Questions

1. **Exact requestUrl path behavior**
   - What we know: Library appends `/place/autocomplete/json?...` to the `requestUrl.url` value
   - What's unclear: Exact URL construction may vary by library version; needs testing
   - Recommendation: Test with a simple proxy early in implementation; log incoming requests to see exact paths

2. **Styling compatibility with app design system**
   - What we know: Library supports extensive `styles` prop for customization
   - What's unclear: Whether the dropdown can be styled to perfectly match the warm/cream/sage design system without heavy overrides
   - Recommendation: If styling proves impossible, fall back to custom component using AppInput + FlatList + the same backend proxy

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (existing) |
| Config file | `apps/api/jest.config.ts` (unit), `apps/api/test/jest-e2e.json` (e2e) |
| Quick run command | `cd apps/api && npx jest --testPathPattern places -x` |
| Full suite command | `cd apps/api && npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAJEM-02 | Autocomplete proxy returns suggestions for pickup | unit | `cd apps/api && npx jest places.service.spec -x` | No -- Wave 0 |
| NAJEM-03 | Autocomplete proxy returns suggestions for return | unit | Same service test -- same proxy endpoint | No -- Wave 0 |
| NAJEM-04 | Location fields saved on rental creation | unit | `cd apps/api && npx jest rentals.service.spec -x` | Existing file, needs new test case |
| NAJEM-04 | Location visible in rental GET response | e2e | `cd apps/api && npx jest --config test/jest-e2e.json --testPathPattern rentals -x` | Existing file, needs new test case |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern places -x`
- **Per wave merge:** `cd apps/api && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/places/places.service.spec.ts` -- covers NAJEM-02/03 (mock fetch, verify Google API call params)
- [ ] Update `apps/api/test/rentals.e2e-spec.ts` -- add test for location fields in create + GET
- [ ] `.env.example` -- add `GOOGLE_PLACES_API_KEY` placeholder

## Sources

### Primary (HIGH confidence)
- `react-native-google-places-autocomplete` npm: v2.6.4 verified via `npm view` -- [npm](https://www.npmjs.com/package/react-native-google-places-autocomplete)
- Google Places Autocomplete (New) official docs -- [developers.google.com](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete)
- Google Places session pricing -- [developers.google.com](https://developers.google.com/maps/documentation/places/web-service/session-pricing)
- Codebase inspection: `dates.tsx`, `rental-draft.store.ts`, `create-rental.dto.ts`, `schema.prisma`, `vehicle-classes.module.ts` (NestJS module pattern), `client.ts` (apiClient)

### Secondary (MEDIUM confidence)
- `react-native-google-places-autocomplete` requestUrl proxy usage -- [Medium article](https://medium.com/@jcast5008/using-rest-apis-with-react-native-google-places-autocomplete-library-requesturl-54d50c9cbd24)
- GitHub README for requestUrl prop -- [GitHub](https://github.com/FaridSafi/react-native-google-places-autocomplete)

### Tertiary (LOW confidence)
- Exact URL path construction by the library when using `requestUrl` -- needs runtime verification during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- library is well-established, proxy pattern is standard
- Architecture: HIGH -- follows existing NestJS module patterns exactly, JSON column pattern proven in codebase
- Pitfalls: HIGH -- billing and proxy format pitfalls are well-documented
- requestUrl behavior: MEDIUM -- documented but exact path construction needs runtime testing

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable domain, no fast-moving dependencies)
