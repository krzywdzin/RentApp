# Phase 4: Contract and PDF - Research

**Researched:** 2026-03-24
**Domain:** PDF generation, digital signatures, contract management (NestJS backend)
**Confidence:** HIGH

## Summary

Phase 4 implements the digital rental contract flow: contract data model, signature capture (PNG from canvas), PDF generation from Handlebars HTML templates rendered via Puppeteer, automatic email delivery with PDF attachment, and contract amendments (aneksy) for rental extensions. The existing paper contract template (2 pages) defines the exact structure -- page 1 is the rental agreement with personal data, vehicle info, RODO consent, mileage, and signatures; page 2 contains 21 numbered rental conditions, a vehicle damage sketch area, and a final acceptance signature.

The stack is straightforward: Handlebars compiles HTML templates with contract data, Puppeteer renders them to PDF with full Polish character support via UTF-8 and embedded fonts, nodemailer sends the PDF as a buffer attachment, and MinIO stores both signature PNGs and generated PDFs. The Prisma schema extends with Contract and ContractSignature models linked to Rental.

**Primary recommendation:** Use Handlebars + Puppeteer with a singleton browser instance managed as a NestJS provider. Keep the HTML template as a `.hbs` file in the source tree. Generate PDFs as in-memory buffers (never write to disk). Store in MinIO and email in a single transaction-like flow.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Source template:** Existing paper contract at `.planning/phases/04-contract-and-pdf/contract-template.pdf` -- 2 pages
- **Page 1 content:** Header (KITEK company info), parties (Wynajmujacy + Klient), rental dates/times, vehicle info, customer personal data (imie, adres, dowod, PESEL, prawo jazdy), vehicle handover confirmation with mileage, RODO consent, signatures
- **Page 2 content:** 21 numbered conditions (WARUNKI NAJMU POJAZDU), vehicle damage sketch area, commitments (ZOBOWIAZUJE SIE DO), damage notes, final signature
- **RODO consent:** Checkbox consent -- customer must explicitly confirm before signing. Timestamp stored as proof.
- **Conditions text:** Mostly fixed, but 3 fields are editable per rental: Kaucja (deposit), Daily rate (stawka za dobe) -- auto-filled, Late return fee -- configurable
- **Vehicle damage sketch:** Interactive canvas -- employee draws/marks damage on a vehicle outline. Saved as image, embedded in PDF.
- **Auto-filled from rental data:** Customer name, address, ID docs, vehicle registration/make/model, dates, pricing
- **Two signatures per contract:** Page 1 (contract) + Page 2 (conditions acceptance). Matches paper template layout.
- **Both parties sign:** Customer signature + Employee (witness) signature. Both drawn on canvas.
- **Drawing only:** Canvas with finger/stylus. No typed name fallback. Saved as PNG.
- **Audit metadata captured:** Timestamp, device info, content hash (SHA-256 of contract data at signing time), witness employee ID (from JWT)
- **Signature stored:** PNG image in MinIO, reference on Contract record
- **Clean digital version:** Same data and sections as paper template but modern digital layout. Not pixel-perfect reproduction.
- **Polish characters:** Full support required
- **Email delivery:** Automatic after both signatures captured -- PDF generated and emailed immediately. No manual send step.
- **Email via:** Existing MailService (nodemailer) with PDF attachment
- **Annex triggered by:** `rental.extended` event (EventEmitter2 from Phase 3)
- **Annex versioning:** Each annex is numbered (Aneks nr 1, 2, ...) and linked to original contract
- **Annex PDF:** Separate document, emailed to customer automatically

### Claude's Discretion
- PDF template engine (Handlebars + Puppeteer vs alternatives)
- PDF storage structure (MinIO keys, DB model)
- Annex content scope (minimal vs full regeneration)
- Annex signature requirements
- Vehicle damage sketch -- vehicle outline image or freeform canvas
- Contract data model design (Contract entity in Prisma)
- Signature canvas implementation details

### Deferred Ideas (OUT OF SCOPE)
- Vehicle outline template for damage marking -- could be a standardized SVG with hotspots (future enhancement)
- Digital contract editing after signing -- out of scope, contracts are immutable after signature
- Multi-language contracts -- Polish only for v1
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | Employee can fill out a digital rental contract with customer data, vehicle info, and rental terms | Contract data model auto-fills from Rental+Customer+Vehicle; editable fields for kaucja, daily rate, late fee; Handlebars template with placeholders |
| CONT-02 | Customer signs contract digitally (finger/stylus) with audit metadata (timestamp, device, content hash, witness employee ID) | Canvas-based signature capture as PNG; SHA-256 hash of serialized contract data at signing time; metadata stored in ContractSignature model |
| CONT-03 | System generates PDF from signed contract matching existing template with Polish character support | Handlebars HTML template + Puppeteer page.pdf(); UTF-8 charset + embedded web font (e.g., Inter or Roboto) for full Polish diacritics |
| CONT-04 | PDF is automatically emailed to customer after signing | Extend MailService with sendContractEmail(); nodemailer attachments API with Buffer content; triggered after final signature |
| CONT-05 | System stores contract versions -- annexes for extensions | ContractAnnex model linked to parent Contract; triggered by `rental.extended` event; separate PDF generated and emailed |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| puppeteer | 24.40.0 | Headless Chrome for HTML-to-PDF rendering | Industry standard for server-side PDF generation; full CSS3/JS support; accurate rendering |
| handlebars | 4.7.8 | HTML template compilation with data binding | Simple, logic-less templates; perfect for contract layouts; well-tested with Puppeteer |
| nodemailer | 6.x (existing) | Email delivery with PDF attachment | Already in project; native Buffer attachment support |
| @aws-sdk/client-s3 | 3.x (existing) | PDF and signature image storage in MinIO | Already in project via StorageService |
| crypto (Node built-in) | N/A | SHA-256 content hashing for audit trail | Already used in field-encryption.ts; no additional dependency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @nestjs/event-emitter | 3.x (existing) | Listen for `rental.extended` to trigger annex creation | Already configured globally in AppModule |
| class-validator | 0.14.x (existing) | DTO validation for contract creation/signing | Already in project |
| uuid | 11.x (existing) | Generate unique contract numbers | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Puppeteer | pdf-lib | Lower-level, no CSS/HTML support -- would need manual layout code |
| Puppeteer | @react-pdf/renderer | React dependency, SSR complexity, not needed for backend-only |
| Handlebars | EJS | Both work; Handlebars is simpler and more explicit about logic separation |
| Puppeteer (full) | puppeteer-core | Lighter (no bundled Chromium), but requires system Chrome -- use puppeteer-core in production Docker images |

**Installation:**
```bash
cd apps/api && pnpm add puppeteer handlebars
```

**Production note:** In Docker, switch to `puppeteer-core` and install Chromium via apt to reduce image size. Use `PUPPETEER_EXECUTABLE_PATH` env var.

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
  contracts/
    contracts.module.ts          # NestJS module
    contracts.controller.ts      # REST endpoints
    contracts.service.ts         # Business logic + orchestration
    dto/
      create-contract.dto.ts     # Contract creation (auto-fill + editable fields)
      sign-contract.dto.ts       # Signature submission (base64 PNG + metadata)
      create-annex.dto.ts        # Annex creation data
    pdf/
      pdf.service.ts             # Puppeteer singleton + render logic
      templates/
        contract.hbs             # Page 1 + Page 2 HTML template
        annex.hbs                # Annex template
        styles.css               # Shared PDF styles (embedded in templates)
    listeners/
      rental-extended.listener.ts  # EventEmitter2 handler for annex creation
```

### Pattern 1: Puppeteer Singleton Browser
**What:** Single Chromium browser instance managed via NestJS lifecycle hooks
**When to use:** Always -- launching a browser per request costs 500ms-2s and 100-300MB RAM
**Example:**
```typescript
// Source: verified pattern from NestJS + Puppeteer community
@Injectable()
export class PdfService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser;

  async onModuleInit() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    });
  }

  async onModuleDestroy() {
    await this.browser?.close();
  }

  async generatePdf(html: string): Promise<Buffer> {
    const page = await this.browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.evaluateHandle('document.fonts.ready');
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }
}
```

### Pattern 2: Handlebars Template Compilation
**What:** Compile `.hbs` template once, render with data for each contract
**When to use:** Every PDF generation
**Example:**
```typescript
import * as Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

// Compile once at module init
const templateSource = readFileSync(
  join(__dirname, 'templates', 'contract.hbs'),
  'utf-8',
);
const template = Handlebars.compile(templateSource);

// Render per contract
const html = template({
  company: { name: 'KITEK', owner: 'Pawel Romanowski', ... },
  customer: { firstName, lastName, address, pesel, idNumber, ... },
  vehicle: { make, model, registration, ... },
  rental: { startDate, endDate, dailyRateNet, ... },
  signatures: { customerPage1: base64Png, employeePage1: base64Png, ... },
  damageSketch: base64Png,
  conditions: { deposit: '500 zl', dailyRate: '150 zl netto', lateFee: '300 zl netto' },
  rodoConsent: { accepted: true, timestamp: '2026-03-24T14:30:00Z' },
});
```

### Pattern 3: Content Hash for Audit Trail
**What:** SHA-256 hash of serialized contract data frozen at signing time
**When to use:** Before each signature capture -- hash proves what the signer saw
**Example:**
```typescript
import * as crypto from 'crypto';

function generateContentHash(contractData: Record<string, any>): string {
  // Deterministic serialization -- sort keys
  const serialized = JSON.stringify(contractData, Object.keys(contractData).sort());
  return crypto.createHash('sha256').update(serialized, 'utf-8').digest('hex');
}
```

### Pattern 4: Nodemailer PDF Attachment from Buffer
**What:** Send PDF as email attachment without writing to disk
**When to use:** After PDF generation, before returning response
**Example:**
```typescript
// Source: nodemailer.com/message/attachments
await this.transporter.sendMail({
  from: this.config.get('MAIL_FROM'),
  to: customerEmail,
  subject: 'RentApp - Umowa najmu pojazdu',
  html: `<p>W zalaczniku umowa najmu pojazdu ${vehicleRegistration}.</p>`,
  attachments: [{
    filename: `umowa-${contractNumber}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf',
  }],
});
```

### Pattern 5: EventEmitter Listener for Annex Creation
**What:** Listen for `rental.extended` event to auto-create contract annex
**When to use:** When rental is extended (Phase 3 already emits this event)
**Example:**
```typescript
@Injectable()
export class RentalExtendedListener {
  constructor(private contractsService: ContractsService) {}

  @OnEvent('rental.extended')
  async handleRentalExtended(payload: {
    rentalId: string;
    customerId: string;
    newEndDate: string;
    extendedBy: string;
  }) {
    await this.contractsService.createAnnex(payload.rentalId, {
      newEndDate: payload.newEndDate,
      createdById: payload.extendedBy,
    });
  }
}
```

### Anti-Patterns to Avoid
- **Launching browser per request:** 500ms-2s startup + 100-300MB per process. Use singleton.
- **Writing PDF to filesystem:** Use in-memory buffers. Disk I/O is slow and requires cleanup.
- **Storing signatures as base64 in DB:** Large blobs in PostgreSQL hurt query performance. Store PNG in MinIO, reference key in DB.
- **Using RGB hex colors in Handlebars templates:** The `#` character conflicts with Handlebars syntax. Use `rgb()` notation in CSS or escape with `\#`.
- **Generating PDF before all signatures collected:** PDF must include all 4 signatures (customer + employee on both pages). Generate only after final signature.
- **Re-decrypting PII in template rendering:** Decrypt once when building contract data object, pass plaintext to template. Never store decrypted PII in DB.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF layout engine | Custom canvas/coordinate math | Handlebars HTML + Puppeteer | CSS handles layout, fonts, page breaks automatically |
| Email attachments | Raw SMTP with MIME encoding | nodemailer `attachments` array | MIME encoding is error-prone, nodemailer handles it |
| Content hashing | Custom serialization | `JSON.stringify` with sorted keys + `crypto.createHash('sha256')` | Deterministic, standard, verifiable |
| Font embedding in PDF | Manual font subsetting | Puppeteer's Chrome engine | Chrome handles font rendering, subsetting, and embedding |
| Polish character encoding | Manual encoding tables | UTF-8 HTML + web fonts | Chrome natively supports all Unicode; just use proper charset and fonts |
| Signature storage | Base64 in PostgreSQL JSON | MinIO upload + DB key reference | Keeps DB lean; MinIO handles large binary objects efficiently |

**Key insight:** Puppeteer effectively makes "HTML+CSS" your PDF layout language. Any layout achievable in a browser is achievable in a PDF. Do not try to build PDF layouts programmatically.

## Common Pitfalls

### Pitfall 1: Polish Characters Rendering as Boxes or Question Marks
**What goes wrong:** PDF shows empty rectangles or `?` instead of characters like a, c, e, l, n, o, s, z, z
**Why it happens:** Puppeteer's bundled Chromium may not have fonts with Polish diacritics, especially in Docker/CI
**How to avoid:** (1) Include `<meta charset="UTF-8">` in template, (2) Use a web font (Google Fonts Inter or Roboto) with `@import` or embedded `@font-face`, (3) Wait for fonts to load: `await page.evaluateHandle('document.fonts.ready')`, (4) In Docker, install `fonts-liberation` or embed the font file
**Warning signs:** PDF renders correctly on macOS dev but breaks in CI/Docker

### Pitfall 2: Handlebars `#` Color Conflict
**What goes wrong:** Handlebars throws compilation error on hex colors like `#333333`
**Why it happens:** `#` is Handlebars block helper syntax
**How to avoid:** Use `rgb(51, 51, 51)` instead of `#333333` in all CSS within `.hbs` templates. Alternatively, put CSS in a separate file and inline it before compilation.
**Warning signs:** Template compilation errors mentioning unexpected block helper

### Pitfall 3: Browser Instance Memory Leak
**What goes wrong:** Memory grows over time, eventually OOM crash
**Why it happens:** Pages not properly closed after PDF generation
**How to avoid:** Always use `try/finally` with `page.close()`. Consider periodic browser restart (e.g., every 100 PDFs or on error).
**Warning signs:** Gradual memory increase in production monitoring

### Pitfall 4: Race Condition on Concurrent PDF Generation
**What goes wrong:** Two contract PDFs generated simultaneously produce corrupt output or crash
**Why it happens:** Single browser instance, multiple simultaneous page.pdf() calls
**How to avoid:** Each request creates its own `page` (Puppeteer pages are isolated). The singleton browser handles concurrency natively -- just create separate pages. Do NOT share pages between requests.
**Warning signs:** Intermittent PDF corruption under load

### Pitfall 5: Signature Image Not Appearing in PDF
**What goes wrong:** Signature areas show as broken images in the PDF
**Why it happens:** Template references an external URL or file path that Puppeteer cannot access when rendering `setContent`
**How to avoid:** Embed signature images as base64 data URIs directly in the HTML: `<img src="data:image/png;base64,${signatureBase64}" />`
**Warning signs:** Images appear in browser preview but not in generated PDF

### Pitfall 6: Content Hash Mismatch After Signing
**What goes wrong:** Verification of signed contract fails because hash doesn't match
**Why it happens:** Non-deterministic JSON serialization (key order varies), or floating-point pricing differences
**How to avoid:** Use sorted-key serialization. Freeze contract data as a JSON snapshot in the DB at creation time. Hash the frozen snapshot, not a re-assembled object.
**Warning signs:** Hash verification fails on re-check even though data appears identical

## Code Examples

### Contract Prisma Schema Extension
```prisma
// Add to apps/api/prisma/schema.prisma

enum ContractStatus {
  DRAFT           // Created, awaiting signatures
  PARTIALLY_SIGNED // Some signatures collected
  SIGNED          // All signatures collected, PDF generated
  VOIDED          // Cancelled/voided
}

model Contract {
  id              String          @id @default(uuid())
  contractNumber  String          @unique
  rentalId        String
  createdById     String
  status          ContractStatus  @default(DRAFT)

  // Frozen contract data snapshot (used for rendering + hash verification)
  contractData    Json
  contentHash     String          // SHA-256 of contractData at creation

  // Editable condition fields
  depositAmount   Int?            // Kaucja in grosze
  dailyRateNet    Int             // Stawka za dobe in grosze
  lateFeeNet      Int?            // Oplata za spoznienie in grosze

  // RODO consent
  rodoConsentAt   DateTime?

  // Damage sketch
  damageSketchKey String?         // MinIO key for damage sketch image

  // Generated PDF
  pdfKey          String?         // MinIO key for final PDF
  pdfGeneratedAt  DateTime?

  // Email delivery
  emailSentAt     DateTime?
  emailSentTo     String?

  rental          Rental          @relation(fields: [rentalId], references: [id])
  createdBy       User            @relation("ContractCreatedBy", fields: [createdById], references: [id])
  signatures      ContractSignature[]
  annexes         ContractAnnex[]

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([rentalId])
  @@index([status])
  @@map("contracts")
}

model ContractSignature {
  id              String    @id @default(uuid())
  contractId      String
  signatureType   String    // 'customer_page1' | 'employee_page1' | 'customer_page2' | 'employee_page2'
  signerRole      String    // 'customer' | 'employee'
  signerId        String?   // User ID for employee, null for customer

  // Signature image
  signatureKey    String    // MinIO key for PNG

  // Audit metadata
  contentHash     String    // SHA-256 hash at time of signing
  deviceInfo      String?   // User-Agent or device identifier
  ipAddress       String?
  signedAt        DateTime  @default(now())

  contract        Contract  @relation(fields: [contractId], references: [id])

  @@unique([contractId, signatureType])
  @@index([contractId])
  @@map("contract_signatures")
}

model ContractAnnex {
  id              String    @id @default(uuid())
  contractId      String
  annexNumber     Int       // Sequential: 1, 2, 3...

  // What changed
  changes         Json      // { newEndDate, newDailyRate, newTotalPrice, ... }

  // PDF
  pdfKey          String?
  pdfGeneratedAt  DateTime?

  // Email delivery
  emailSentAt     DateTime?

  contract        Contract  @relation(fields: [contractId], references: [id])

  createdAt       DateTime  @default(now())

  @@unique([contractId, annexNumber])
  @@index([contractId])
  @@map("contract_annexes")
}
```

### Handlebars Template Structure (contract.hbs)
```html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; font-size: 11px; color: rgb(33, 33, 33); }

    .page { width: 210mm; min-height: 297mm; padding: 15mm; page-break-after: always; }
    .page:last-child { page-break-after: avoid; }

    .header { text-align: center; margin-bottom: 10mm; }
    .company-info { font-size: 10px; color: rgb(100, 100, 100); }
    .title { font-size: 16px; font-weight: 700; margin: 5mm 0; }

    .field-row { display: flex; margin: 2mm 0; }
    .field-label { font-weight: 600; min-width: 40mm; }
    .field-value { border-bottom: 1px dotted rgb(150, 150, 150); flex: 1; }

    .signature-block { display: inline-block; width: 45%; text-align: center; margin-top: 10mm; }
    .signature-img { height: 20mm; }
    .signature-label { font-size: 9px; margin-top: 2mm; border-top: 1px solid rgb(0,0,0); padding-top: 1mm; }

    .conditions { font-size: 10px; }
    .conditions ol { padding-left: 5mm; }
    .conditions li { margin-bottom: 2mm; }

    .damage-sketch { text-align: center; margin: 5mm 0; }
    .damage-sketch img { max-width: 100%; max-height: 80mm; }

    .rodo-consent { font-size: 9px; margin-top: 5mm; padding: 3mm; border: 1px solid rgb(200,200,200); }
  </style>
</head>
<body>
  <!-- PAGE 1: Contract -->
  <div class="page">
    <div class="header">
      <div class="company-info">
        KITEK - Pawel Romanowski<br>
        ul. Sieradzka 18, 87-100 Torun<br>
        Tel. 535 766 666 / 602 367 100
      </div>
      <div class="title">UMOWA NAJMU POJAZDU</div>
    </div>

    <!-- Contract parties, dates, vehicle, customer data, mileage -->
    <!-- ... template fields with {{customer.firstName}}, {{vehicle.registration}}, etc. -->

    <div class="rodo-consent">
      Wyrazam zgode na przetwarzanie moich danych osobowych...
      {{#if rodoConsent.accepted}}
      <br>Zgoda wyrazona: {{formatDate rodoConsent.timestamp}}
      {{/if}}
    </div>

    <div style="display: flex; justify-content: space-between;">
      <div class="signature-block">
        {{#if signatures.employeePage1}}
        <img class="signature-img" src="data:image/png;base64,{{signatures.employeePage1}}" />
        {{/if}}
        <div class="signature-label">(Podpis Wynajmujacego)</div>
      </div>
      <div class="signature-block">
        {{#if signatures.customerPage1}}
        <img class="signature-img" src="data:image/png;base64,{{signatures.customerPage1}}" />
        {{/if}}
        <div class="signature-label">(Podpis Klienta - Kierowcy)</div>
      </div>
    </div>
  </div>

  <!-- PAGE 2: Conditions + Damage + Final Signature -->
  <div class="page">
    <div class="title">WARUNKI NAJMU POJAZDU</div>
    <div class="conditions">
      <ol>
        <li>Wymagane jest ukonczenie 21 lat...</li>
        <!-- ... 21 numbered conditions with {{conditions.deposit}}, {{conditions.dailyRate}}, {{conditions.lateFee}} -->
      </ol>
    </div>

    <div class="damage-sketch">
      <h4>Uwagi uszkodzen pojazdu:</h4>
      {{#if damageSketch}}
      <img src="data:image/png;base64,{{damageSketch}}" />
      {{/if}}
    </div>

    <p><strong>Zapoznalem sie z trescia i akceptuje powyzsze warunki.</strong></p>
    <div class="signature-block">
      {{#if signatures.customerPage2}}
      <img class="signature-img" src="data:image/png;base64,{{signatures.customerPage2}}" />
      {{/if}}
      <div class="signature-label">Podpis Najemcy</div>
    </div>
  </div>
</body>
</html>
```

### Contract Number Generation
```typescript
// Format: KITEK/YYYY/MMDD/XXXX (sequential per day)
function generateContractNumber(sequenceToday: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = String(sequenceToday).padStart(4, '0');
  return `KITEK/${year}/${month}${day}/${seq}`;
}
```

## Recommended Decisions (Claude's Discretion Areas)

### PDF Template Engine: Handlebars + Puppeteer
**Recommendation:** Use Handlebars for template compilation and Puppeteer for PDF rendering.
**Rationale:** This is the most widely used pattern for server-side PDF generation in Node.js. Handlebars provides clean separation of template and data. Puppeteer gives full CSS3 layout control including page breaks, fonts, and embedded images. The combination is well-documented and battle-tested.

### PDF Storage Structure
**Recommendation:** MinIO with path-based keys + DB references.
```
contracts/{rentalId}/{contractId}.pdf
contracts/{rentalId}/signatures/{signatureType}.png
contracts/{rentalId}/damage-sketch.png
contracts/{rentalId}/annexes/{annexId}.pdf
```
**Rationale:** Groups all contract artifacts under rental ID for easy retrieval and cleanup.

### Annex Content Scope: Minimal
**Recommendation:** Annexes should be minimal documents containing: annex number, reference to original contract, what changed (new end date, recalculated pricing), and signatures (employee only -- annex is an administrative extension, not a new agreement).
**Rationale:** Polish rental practice treats annexes (aneksy) as amendments to the original contract, not replacements. A full contract regeneration would be legally confusing. The annex only needs to document the delta.

### Annex Signature Requirements: Employee Only
**Recommendation:** Annexes require only the employee signature (as the rental extension is an administrative action initiated by the company). Customer acknowledgment is via SMS notification (Phase 8) and email with the annex PDF.
**Rationale:** Polish civil law allows unilateral contract amendments when the amendment benefits or is neutral to the customer (extending a rental at the same rate). The customer already signed the original agreeing to extension terms. If the business later requires customer countersignature, the infrastructure supports adding it.

### Vehicle Damage Sketch: Freeform Canvas
**Recommendation:** Simple freeform drawing canvas (no vehicle outline template for v1). The employee draws/writes damage notes freely on a blank canvas, which is saved as a PNG.
**Rationale:** The paper template has a simple "przod / tyl" (front/back) area with freehand notes. A vehicle outline SVG is listed as a deferred idea. Freeform canvas matches the existing paper workflow and avoids the complexity of interactive SVG hotspots.

### Contract Data Model
See the Prisma schema in Code Examples above. Key design decisions:
- `contractData` (Json) stores a frozen snapshot of all contract fields at creation time -- this is what the PDF is generated from and what the content hash is computed against
- `contentHash` is SHA-256 of the frozen `contractData`, proving document integrity
- 4 signatures per contract (customer+employee on page 1, customer+employee on page 2) stored as separate `ContractSignature` records
- RODO consent tracked with explicit timestamp
- Contract status state machine: DRAFT -> PARTIALLY_SIGNED -> SIGNED -> (VOIDED)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PDFKit/pdf-lib manual layout | Puppeteer HTML-to-PDF | ~2020 | HTML+CSS is the layout language; no coordinate math |
| wkhtmltopdf | Puppeteer | ~2019 | wkhtmltopdf uses old WebKit; Puppeteer uses modern Chrome |
| File-system temp files for PDFs | In-memory Buffer pipeline | ~2021 | No disk I/O, no cleanup, better for containers |
| puppeteer (full, 200MB+) | puppeteer-core + system Chrome | ~2022 | Much smaller Docker images; share system Chromium |

**Deprecated/outdated:**
- `html-pdf` / `phantom-pdf`: Based on PhantomJS which is abandoned since 2018
- `wkhtmltopdf`: Old WebKit engine, poor CSS3 support, maintenance mode

## Open Questions

1. **Puppeteer in Docker**
   - What we know: puppeteer-core + system Chromium is the standard approach
   - What's unclear: Exact Docker base image and apt packages needed for this project's deployment
   - Recommendation: Use `puppeteer` (full) for development; document the puppeteer-core Docker switch as a production task in a later phase

2. **Concurrent PDF generation limits**
   - What we know: Each page uses ~50-100MB RAM; singleton browser handles parallel pages
   - What's unclear: Expected concurrency (how many contracts generated simultaneously)
   - Recommendation: Start with no limit; add a semaphore if memory issues arise (rental car business unlikely to have high concurrency)

3. **Exact conditions text**
   - What we know: PDF text extraction gives us all 21 conditions from the paper template
   - What's unclear: Whether business wants any wording changes for the digital version
   - Recommendation: Copy conditions verbatim from extracted text; make it easy to edit (stored as Handlebars template, not hardcoded)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x (existing) |
| Config file | `apps/api/jest.config.ts` (unit), `apps/api/test/jest-e2e.json` (e2e) |
| Quick run command | `cd apps/api && pnpm test -- --testPathPattern=contracts` |
| Full suite command | `cd apps/api && pnpm test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | Create contract with auto-filled data from rental | unit + e2e | `cd apps/api && pnpm test -- --testPathPattern=contracts.service` | No -- Wave 0 |
| CONT-02 | Submit signature with audit metadata, verify content hash | unit + e2e | `cd apps/api && pnpm test -- --testPathPattern=contracts` | No -- Wave 0 |
| CONT-03 | Generate PDF with Polish characters from template | unit | `cd apps/api && pnpm test -- --testPathPattern=pdf.service` | No -- Wave 0 |
| CONT-04 | Email sent with PDF attachment after final signature | unit + e2e | `cd apps/api && pnpm test -- --testPathPattern=contracts` | No -- Wave 0 |
| CONT-05 | Annex created on rental.extended event, separate PDF emailed | unit + e2e | `cd apps/api && pnpm test -- --testPathPattern=contracts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && pnpm test -- --testPathPattern=contracts`
- **Per wave merge:** `cd apps/api && pnpm test:e2e`
- **Phase gate:** Full e2e suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/contracts/contracts.service.spec.ts` -- covers CONT-01, CONT-02, CONT-04, CONT-05
- [ ] `apps/api/src/contracts/pdf/pdf.service.spec.ts` -- covers CONT-03
- [ ] `apps/api/test/contracts.e2e-spec.ts` -- e2e covering full contract flow
- [ ] Prisma schema migration for Contract, ContractSignature, ContractAnnex models

## Sources

### Primary (HIGH confidence)
- Existing codebase: `apps/api/src/mail/mail.service.ts`, `apps/api/src/storage/storage.service.ts`, `apps/api/prisma/schema.prisma`, `apps/api/src/rentals/rentals.service.ts`, `apps/api/src/customers/customers.service.ts`
- Contract template text extracted via `pdftotext` from `.planning/phases/04-contract-and-pdf/contract-template.pdf`
- npm registry: puppeteer 24.40.0, handlebars 4.7.8 (verified 2026-03-24)
- [Nodemailer attachments docs](https://nodemailer.com/message/attachments) -- Buffer attachment API

### Secondary (MEDIUM confidence)
- [NestJS + Puppeteer PDF pattern](https://medium.com/@mprasad96/from-html-templates-to-well-formatted-pdfs-using-puppeteer-and-nestjs-1263bdff641c) -- Service architecture
- [Puppeteer Unicode fonts](https://medium.com/@surasith_aof/generate-pdf-support-non-latin-fonts-with-puppeteer-d6ca6c982f1c) -- Font loading strategy
- [Puppeteer issue #3668](https://github.com/puppeteer/puppeteer/issues/3668) -- Unicode font rendering in PDFs
- [SHA-256 for digital signatures](https://www.esignglobal.com/blog/sha-256-hashing-algorithm-digital-signatures) -- Audit trail best practices
- [Puppeteer singleton pattern](https://gist.github.com/Big-al/3fecac52b1629b5839fdedea995ef94f) -- Performance optimization

### Tertiary (LOW confidence)
- Annex signature requirements (employee-only) -- based on general Polish civil law practice, not verified with legal counsel

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- puppeteer + handlebars is the dominant Node.js PDF pattern; verified current versions
- Architecture: HIGH -- follows established NestJS module patterns from existing codebase (Phases 1-3)
- Pitfalls: HIGH -- well-documented issues with Polish characters, Handlebars color syntax, and browser memory
- Contract data model: MEDIUM -- schema design follows existing patterns but is new domain
- Annex requirements: LOW -- Polish legal practice assumption, not verified with lawyer

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain, no fast-moving dependencies)
