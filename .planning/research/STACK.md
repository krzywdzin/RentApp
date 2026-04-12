# Technology Stack Additions for v3.0

**Project:** RentApp v3.0 — Client Features & Contract Enhancements
**Researched:** 2026-04-12
**Scope:** NEW libraries only. Existing stack (Expo 54, React Native 0.81, NestJS 11, Prisma 6, Puppeteer 24, etc.) is validated and unchanged.

## Recommended Stack Additions

### 1. OCR — On-Device Text Recognition (Mobile)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `expo-text-extractor` | ^2.0.0 | On-device OCR for Polish ID cards and driver licenses | Uses Google ML Kit (Android) + Apple Vision (iOS). Expo Modules architecture (SDK 52+, confirmed compatible with SDK 54). Simple API: `extractTextFromImage(uri)` returns string array. Zero cloud dependency — works offline, no per-scan cost. Polish uses Latin script — fully supported by both engines. Published Feb 2026, actively maintained. |

**How it works:**
1. User takes photo with existing `expo-image-picker` (already in project)
2. Pass image URI to `expo-text-extractor`
3. Parse extracted text blocks on the client to find name, PESEL, ID number, expiry date
4. Pre-fill customer form fields

**Why NOT other options:**
- `react-native-mlkit-ocr` — Last published 3 years ago (2023), unmaintained, incompatible with New Architecture
- `expo-ocr` (barthap) — Experimental, fewer commits, less actively maintained
- Scanbot SDK / Dynamsoft — Commercial license ($$$), overkill for reading a few fields from known document types
- Cloud OCR (Google Vision API, AWS Textract) — Adds per-scan cost, requires network, privacy concern with ID documents staying on-device is important
- `react-native-executorch` useOCR — Heavier dependency (ML model download), more complex setup than ML Kit wrapper

**Important implementation note:** This is general OCR, not structured document parsing. The app must implement regex/parsing logic to extract fields:
- PESEL pattern: 11 consecutive digits
- Polish ID number (dowod osobisty): 3 letters + 6 digits (e.g., ABC123456)
- Driver license number: varies, but parseable
- Name/surname: from text blocks near field labels
- Polish ID cards and driver licenses have standardized layouts — field positions are predictable

**Build requirement:** Requires EAS Build (native module). Will NOT work in Expo Go — must use development build.

**Confidence:** MEDIUM — Library is Expo-compatible and maintained. Polish Latin-script text recognition is well-supported. Parsing accuracy depends on implementation quality and photo quality. Recommend building a parsing utility with unit tests for Polish document patterns.

---

### 2. Google Places Autocomplete (Mobile + Web)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `react-native-google-places-autocomplete` | ^2.6.4 | Location autocomplete for pickup/return locations (mobile) | De facto standard: 60K+ weekly npm downloads, 110 contributors, actively maintained (v2.6.4 published early 2026). Pure JS — no native modules, works in Expo without dev client. Battle-tested with Expo SDK 54. |

**For the web admin panel (Next.js):**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `react-google-places-autocomplete` | ^4.1.0 | Location autocomplete in web admin panel | Same Google Places API, React-specific wrapper for web. Different library than the RN one — uses the Maps JavaScript API directly. |

**Backend / API key management:**
- Create a Google Cloud project, enable "Places API (New)" 
- Create an API key restricted to Places API
- For mobile: pass API key directly to the component (standard pattern for Places Autocomplete)
- For web: restrict API key by HTTP referrer
- Store selected place data (formatted address + place_id + coordinates) in the rental record

**Pricing (March 2025 changes):**
- Autocomplete sessions terminating in Place Details (Essentials): first 12 requests billed, then free within session
- Essentials SKU: 10,000 free billable events/month
- For a ~100 car fleet with ~10 employees, usage will comfortably stay within free tier
- Use session tokens to bundle autocomplete requests (the library handles this)

**Why NOT other options:**
- `expo-google-places-autocomplete` (alanjhughes) — Uses native Places SDK, requires dev client + more complex native build config, more setup for the same result
- Custom fetch implementation — Reinventing session management and UI
- `react-native-google-places-textinput` — Newer, less battle-tested, smaller community

**Confidence:** HIGH — Most popular RN places library, well-documented, straightforward integration.

---

### 3. PDF Encryption with Password (API Backend)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@pdfsmaller/pdf-encrypt-lite` | ^1.0.0 | Password-protect generated PDF contracts | **Pure JavaScript**, zero dependencies, ~7KB. RC4-128 encryption. No binary to install on Railway. Works with existing Puppeteer PDF buffer — encrypt in-memory after generation. |

**How it integrates with existing PdfService:**
```typescript
// In pdf.service.ts — add after generateContractPdf()
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';

async generateEncryptedContractPdf(data: ContractPdfData, password: string): Promise<Buffer> {
  const pdfBuffer = await this.generateContractPdf(data);
  const pdfUint8 = new Uint8Array(pdfBuffer);
  const encrypted = encryptPDF(pdfUint8, { userPassword: password });
  return Buffer.from(encrypted);
}
// password = vehicle registration number (e.g., "WA12345")
// SMS notification tells customer the password
```

**Why this over alternatives:**
- `node-qpdf2` — Requires `qpdf` binary installed in deployment environment. Railway Nixpacks would need custom Dockerfile or apt package. AES-256 is nice but overkill — we're protecting casual access (password = registration number), not state secrets.
- `pdf-encrypt-decrypt` — Uses Go FFI, complex native dependency
- `muhammara` / `hummus` — Heavy PDF manipulation libraries, overkill for just adding encryption
- Puppeteer native — Does NOT support PDF encryption (confirmed via GitHub issues #657, #6120)
- `pdf-lib` — Does NOT support encryption natively

**Upgrade path:** If AES-256 is ever required, switch to `node-qpdf2` (^4.0.0) which supports AES-256 encryption but requires the `qpdf` binary on the server.

**Confidence:** HIGH — Pure JS library, simple integration point with existing Puppeteer PDF generation. RC4-128 is adequate for the business requirement (password = registration plate for casual access protection).

---

### 4. Editable Rental Terms — Rich Text Editor (Web Admin Only)

**Critical architectural insight:** This does NOT need a mobile rich text editor. The workflow is:
1. Admin edits rental terms template in the **web panel** (Next.js) — rich text editor needed here
2. Terms are stored as HTML in the database
3. Mobile app **displays** terms (read-only) for customer acceptance — use existing WebView
4. Terms HTML is injected into the Handlebars contract PDF template

**Web Admin — Rich Text Editor:**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@tiptap/react` | ^2.11.0 | Rich text editor for rental terms in Next.js admin | Built on ProseMirror. Headless (fully customizable UI — matches existing shadcn design). Output: HTML — directly usable in Handlebars PDF templates. Active maintenance, large community. Free core (paid collaboration features not needed). |
| `@tiptap/starter-kit` | ^2.11.0 | Essential extensions bundle | Bold, italic, lists, headings, paragraphs — everything needed for rental terms. |
| `@tiptap/pm` | ^2.11.0 | ProseMirror peer dependency | Required by TipTap. |

**Mobile — Display Only (NO new dependency):**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `react-native-webview` | ~13.15.0 (existing) | Render HTML terms for customer review | Already installed. Render stored HTML in a styled WebView with acceptance checkbox below. Zero new dependencies. |

**Why NOT a mobile rich text editor:**
- `@10play/tentap-editor` — TipTap-based for RN, requires Expo dev client for full features, complex setup, completely unnecessary since editing is admin-only
- `react-native-enriched` (Software Mansion) — New Architecture required, powerful but overkill for display-only
- `@siposdani87/expo-rich-text-editor` — WebView-based editor, unnecessary complexity

**Data flow:**
1. Admin writes/edits terms via TipTap editor (web) -> stored as HTML string in database (e.g., `rentalTermsHtml` column)
2. Mobile fetches terms HTML -> displays in WebView (read-only) with acceptance checkbox
3. PDF generation: inject terms HTML into Handlebars template via `{{{rentalTermsHtml}}}` (triple-stache for unescaped HTML)
4. Per-rental overrides: admin can customize terms for specific rental, stored on the rental record

**Confidence:** HIGH — TipTap is the standard React rich text editor. WebView display is trivial. HTML output maps directly to existing Handlebars PDF pipeline.

---

## Complete Installation Summary

### Mobile (`apps/mobile`)

```bash
npx expo install expo-text-extractor
npm install react-native-google-places-autocomplete
```

**Note:** `expo-text-extractor` requires EAS Build (contains native code). Development builds needed, Expo Go insufficient.

### Web Admin (`apps/web`)

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install react-google-places-autocomplete
```

### API Backend (`apps/api`)

```bash
npm install @pdfsmaller/pdf-encrypt-lite
```

### Infrastructure Requirements

| Requirement | For | Action | Cost |
|-------------|-----|--------|------|
| Google Places API key | Location autocomplete | Enable Places API in Google Cloud Console. Create restricted API key. | Free tier (10K events/month) — sufficient |
| Google Cloud project | API key | Create project if not existing | Free |

**No new infrastructure needed** — no new binaries, no new services, no new databases.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| OCR | `expo-text-extractor` | `react-native-mlkit-ocr` | Unmaintained since 2023, pre-New Architecture |
| OCR | `expo-text-extractor` | Cloud OCR (Google Vision) | Per-scan cost, requires network, ID privacy concern |
| OCR | `expo-text-extractor` | Scanbot SDK | Commercial license, overkill |
| Places (mobile) | `react-native-google-places-autocomplete` | `expo-google-places-autocomplete` | Requires native SDK setup, no advantage for text autocomplete |
| Places (web) | `react-google-places-autocomplete` | Raw Google Maps JS API | More boilerplate for same result |
| PDF encryption | `@pdfsmaller/pdf-encrypt-lite` | `node-qpdf2` | Binary dependency on server; upgrade path exists if needed |
| PDF encryption | `@pdfsmaller/pdf-encrypt-lite` | `pdf-lib` | pdf-lib has NO encryption support |
| Rich text (web) | `@tiptap/react` | Quill / Slate / Draft.js | TipTap: best DX, headless (fits shadcn), HTML output, active maintenance |
| Rich text (mobile) | WebView (existing) | `@10play/tentap-editor` | Display-only use case — no editor needed on mobile |

---

## What NOT to Add

| Temptation | Why Avoid |
|------------|-----------|
| Mobile rich text editor | Terms editing is admin-only (web). Mobile just displays HTML in WebView. Adding an editor library adds ~2MB+ and significant complexity for zero benefit. |
| Cloud OCR service | ID documents should stay on-device for privacy. ML Kit/Vision accuracy is sufficient for Latin-script Polish documents. |
| Google Maps SDK (full) | Only need Places Autocomplete, not map rendering. Pure JS library is sufficient and avoids native SDK complexity. |
| pdf-lib for encryption | pdf-lib does NOT support encryption. This is a common misconception. |
| Commercial OCR/scanning SDK | Licensing cost unjustified for reading a few standardized fields from Polish ID cards and driver licenses. |
| Upgrading Expo SDK to 55 for this milestone | SDK 54 supports everything needed. Upgrade is a separate effort with breaking changes (New Architecture only in SDK 55). |

---

## Sources

- [expo-text-extractor GitHub](https://github.com/pchalupa/expo-text-extractor) — v2.0.0, Feb 2026, Expo SDK 52+ compatible
- [react-native-google-places-autocomplete npm](https://www.npmjs.com/package/react-native-google-places-autocomplete) — v2.6.4, 60K+ weekly downloads
- [Google Places API Pricing (March 2025)](https://developers.google.com/maps/billing-and-pricing/pricing) — New pricing with free tiers
- [Google Places Autocomplete Session Pricing](https://developers.google.com/maps/documentation/places/web-service/session-pricing)
- [Puppeteer PDF encryption issue #6120](https://github.com/puppeteer/puppeteer/issues/6120) — Confirmed not supported
- [Puppeteer PDF meta/password issue #657](https://github.com/puppeteer/puppeteer/issues/657) — Confirmed not supported
- [@pdfsmaller/pdf-encrypt-lite npm](https://www.npmjs.com/package/@pdfsmaller/pdf-encrypt-lite) — Pure JS, RC4-128, zero deps
- [node-qpdf2 GitHub](https://github.com/Sparticuz/node-qpdf2) — AES-256 via qpdf binary (upgrade path)
- [TipTap documentation](https://tiptap.dev/) — Headless rich text editor for React
- [Expo rich text editing guide](https://docs.expo.dev/guides/editing-richtext/) — Confirms no default RN rich text solution
- [10tap-editor GitHub](https://github.com/10play/10tap-editor) — Evaluated, not recommended (mobile editor unnecessary)
- [react-native-mlkit-ocr npm](https://www.npmjs.com/package/react-native-mlkit-ocr) — Last published 2023, unmaintained
