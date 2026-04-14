# Phase 39: Return Protocol - Research

**Researched:** 2026-04-14
**Domain:** PDF generation, mobile wizard extension, signature capture, email delivery
**Confidence:** HIGH

## Summary

Phase 39 implements the return protocol ("Protokol Zdawczo-Odbiorczy Samochodu") -- a formal single-page PDF document generated when a vehicle is returned. The implementation follows established patterns from Phase 34 (contract PDF generation via Puppeteer + Handlebars), Phase 37 (email delivery), and the existing mobile return wizard (Phase 38).

The template is simple: a single-page document with 7 numbered fields (5 auto-filled from rental data, 1 chip selector for cleanliness, 1 free-text field), plus two signature lines. The PDF is NOT encrypted (unlike contracts). The system generates it, stores it in R2, emails it to the customer, and makes it downloadable from the web admin panel.

**Primary recommendation:** Follow the existing contract PDF pipeline exactly (Handlebars template -> Puppeteer -> R2 upload -> email via Resend). Add a dedicated `ReturnProtocol` model in Prisma for clean separation. Extend the mobile return wizard with 3 new steps (protocol form, customer signature, worker signature) before the existing confirm step.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Title: "PROTOKOL ZDAWCZO - ODBIORCZY SAMOCHODU"
- Header: hardcoded "KITEK Pawel Romanowski", www.p-romanowski.pl, Tel. (+48) 602 367 100
- 7 fields: Zdajacy (read-only auto-fill), Data i godzina zwrotu (auto-fill), Marka i model samochodu (auto-fill), Numer rejestracyjny (auto-fill), Miejsce odbioru (auto-fill from returnLocation), Czystosc pojazdu (chip selector: Czysty/Brudny/Do mycia + optional note), Inne (free-text multiline)
- Two signatures: Zdajacy (customer) + Odbierajacy (worker)
- Reuse existing SignatureScreen component
- PDF generated using existing PdfService (Puppeteer HTML -> PDF)
- NOT encrypted (unlike contract PDF)
- Sent to customer by email (same MailService pattern)
- No SMS password notification
- Downloadable from web admin panel
- New step in return wizard, after damage photos
- Email subject follows existing pattern with registration plate

### Claude's Discretion
- Exact HTML/CSS layout of the PDF template
- How to store protocol data (new model vs fields on Rental)
- Whether to store protocol PDF in R2 or generate on demand
- Signature image positioning in PDF

### Deferred Ideas (OUT OF SCOPE)
- Sending protocol PDF separately to client (NAJEM-F01 in v4.0)
- Configurable company header from admin settings
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ZWROT-01 | Przy zwrocie pojazdu generowany jest protokol zwrotu wg wzoru klienta | Full pipeline: mobile form + signatures -> API endpoint -> Handlebars template -> Puppeteer PDF -> R2 storage -> email delivery -> web download |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| Puppeteer | HTML -> PDF rendering | Already used by PdfService for contracts/annexes |
| Handlebars | HTML template engine | Already used for contract.hbs and annex.hbs |
| Resend | Email delivery with PDF attachment | Already used by MailService |
| react-native-signature-canvas | Signature capture | Already used by SignatureScreen component |
| @aws-sdk/client-s3 | R2/MinIO storage | Already used by StorageService |
| Prisma | Database ORM | Project standard |
| Zustand | Mobile state (return draft store) | Project standard |

No new dependencies needed. Everything is already in the project.

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
  return-protocols/
    return-protocols.module.ts
    return-protocols.service.ts
    return-protocols.controller.ts
    dto/
      create-return-protocol.dto.ts
    pdf/
      templates/
        return-protocol.hbs        # Handlebars template matching client PDF
apps/mobile/app/return/
    protocol.tsx                   # Protocol form step (cleanliness + notes)
    protocol-sign-customer.tsx     # Customer signature
    protocol-sign-worker.tsx       # Worker signature
    confirm.tsx                    # Existing confirm step (updated totalSteps)
apps/web/src/app/(admin)/wynajmy/[id]/
    page.tsx                       # Add protocol download button to rental detail
```

### Pattern 1: New Prisma Model for ReturnProtocol
**What:** Dedicated `ReturnProtocol` model rather than adding fields to Rental
**When to use:** When protocol data is a distinct document with its own lifecycle
**Rationale:** Clean separation, mirrors Contract model pattern, supports future extensibility (NAJEM-F01)

```prisma
model ReturnProtocol {
  id              String   @id @default(uuid())
  rentalId        String   @unique
  customerName    String            // frozen: Zdajacy
  returnDateTime  DateTime          // frozen: Data i godzina zwrotu
  vehicleMakeModel String           // frozen: Marka i model samochodu
  vehicleRegistration String        // frozen: Numer rejestracyjny
  returnLocation  String?           // frozen: Miejsce odbioru
  cleanliness     String            // CZYSTY | BRUDNY | DO_MYCIA
  cleanlinessNote String?           // optional note for cleanliness
  otherNotes      String?  @db.Text // Inne
  customerSignatureKey String       // R2 key for customer signature PNG
  workerSignatureKey   String       // R2 key for worker signature PNG
  pdfKey          String?           // R2 key for generated PDF
  pdfGeneratedAt  DateTime?
  emailSentAt     DateTime?
  createdById     String
  createdAt       DateTime @default(now())

  rental          Rental   @relation(fields: [rentalId], references: [id])
  createdBy       User     @relation("ProtocolCreatedBy", fields: [createdById], references: [id])

  @@map("return_protocols")
}
```

### Pattern 2: PDF Generation Pipeline (reuse PdfService)
**What:** Add `generateReturnProtocolPdf()` to PdfService, compile return-protocol.hbs on init
**When to use:** Same pattern as contract and annex PDF generation

```typescript
// Add to PdfService.onModuleInit():
const protocolSource = readFileSync(
  join(__dirname, 'templates', 'return-protocol.hbs'), 'utf-8'
);
this.returnProtocolTemplate = Handlebars.compile(protocolSource);

// New method:
async generateReturnProtocolPdf(data: ReturnProtocolPdfData): Promise<Buffer> {
  const html = this.returnProtocolTemplate(data);
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
```

### Pattern 3: Mobile Wizard Extension
**What:** Insert 3 new steps into return wizard after damage-map, before confirm
**Current wizard flow (5 steps):**
1. [rentalId] - Confirm rental
2. mileage - Return mileage
3. damage-map - Damage inspection
4. notes - Notes (currently step 4, skipping checklist which is empty)
5. confirm - Review & submit

**New wizard flow (8 steps):**
1. [rentalId] - Confirm rental
2. mileage - Return mileage
3. damage-map - Damage inspection
4. notes - Notes
5. protocol - Protocol form (cleanliness + inne)
6. protocol-sign-customer - Customer signature
7. protocol-sign-worker - Worker signature
8. confirm - Review & submit (now generates protocol)

**Key decision:** totalSteps changes from 5 to 8. WizardStepper component already accepts currentStep/totalSteps props.

### Pattern 4: Return Draft Store Extension
**What:** Add protocol fields to existing `useReturnDraftStore`

```typescript
interface ReturnDraft {
  // ... existing fields ...
  protocolCleanliness: 'CZYSTY' | 'BRUDNY' | 'DO_MYCIA' | null;
  protocolCleanlinessNote: string;
  protocolOtherNotes: string;
  protocolCustomerSignature: string | null;  // base64
  protocolWorkerSignature: string | null;    // base64
}
```

### Pattern 5: Email Delivery (fire-and-forget, no encryption)
**What:** Follow contract email pattern but simpler -- no encryption, no SMS
**Key difference from contract flow:** Protocol email is fire-and-forget using setImmediate, same as contract. But NO encryption step and NO SMS notification.

```typescript
// In return-protocols.service.ts after PDF upload:
setImmediate(() => {
  this.mailService.sendReturnProtocolEmail(
    customerEmail, customerName, vehicleRegistration, pdfBuffer
  ).catch((error) => {
    this.logger.error(`Failed to send protocol email: ${error.message}`);
  });
});
```

### Pattern 6: Web Admin Download
**What:** Add protocol download button to rental detail page's existing tabs
**Where:** `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx`
**How:** New API endpoint `GET /return-protocols/:rentalId/download` returns presigned URL. Add a "Protokol zwrotu" section or button visible when rental has status RETURNED and protocol exists.

### Anti-Patterns to Avoid
- **Storing protocol data on Rental model:** Rental already has many fields; a dedicated model is cleaner and mirrors Contract pattern
- **Generating PDF on demand instead of storing:** Store in R2 for instant download and email re-send capability
- **Encrypting protocol PDF:** Context explicitly says NOT encrypted -- it's a simpler, less sensitive document
- **Blocking return on email failure:** Email must be fire-and-forget (setImmediate pattern from contracts)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom PDF lib | Existing PdfService (Puppeteer + Handlebars) | Proven pattern, already running in prod |
| Signature capture | Custom canvas | Existing SignatureScreen component | Handles orientation lock, haptics, empty detection |
| Email sending | Custom SMTP | Existing MailService (Resend) | Rate limiting, error handling, attachment support |
| File storage | Custom upload | Existing StorageService (R2/MinIO) | Presigned URLs, local fallback, bucket init |
| State persistence | useState + AsyncStorage | Existing Zustand return-draft store | Persist middleware, hydration hooks |

## Common Pitfalls

### Pitfall 1: Wizard Step Count Mismatch
**What goes wrong:** Adding new screens to return wizard without updating totalSteps in all screens, causing WizardStepper to show wrong progress
**Why it happens:** totalSteps is passed as a prop to WizardStepper on each screen independently
**How to avoid:** Extract totalSteps as a constant (e.g., `RETURN_WIZARD_TOTAL_STEPS = 8`) shared across all return wizard screens
**Warning signs:** Stepper shows 3/5 on what should be 3/8

### Pitfall 2: Signature Orientation Race Condition
**What goes wrong:** SignatureCanvas renders before landscape orientation is confirmed, causing touch offset
**Why it happens:** Expo orientation lock is async
**How to avoid:** Reuse existing SignatureScreen component which already handles this with isLandscape state gate
**Warning signs:** Signature draws offset from finger position

### Pitfall 3: Return Flow Timing -- Protocol Before or After Return
**What goes wrong:** Generating protocol after the return API call means the rental is already RETURNED when protocol fails
**Why it happens:** Unclear flow ordering
**How to avoid:** Protocol data (signatures, cleanliness, notes) should be submitted AS PART of the return API call. The return endpoint creates the protocol record, generates PDF, and transitions rental status in one transaction. Protocol PDF and email are fire-and-forget (post-transaction).
**Warning signs:** Orphaned RETURNED rentals without protocol records

### Pitfall 4: Template Path Resolution in Production
**What goes wrong:** Handlebars template not found in production build
**Why it happens:** `__dirname` resolves differently in compiled output; template files need to be in the build output
**How to avoid:** Follow existing contract template pattern -- templates are in `pdf/templates/` alongside the service, and the NestJS build copies them. Verify the template is included in the dist output.
**Warning signs:** "ENOENT" errors in production logs

### Pitfall 5: Missing returnLocation Data
**What goes wrong:** Protocol field 5 (Miejsce odbioru) is empty when worker didn't set return location
**Why it happens:** returnLocation is optional (Json? in schema), set via Google Places autocomplete
**How to avoid:** Handle null gracefully in both the mobile form (show "Nie podano" or allow manual entry) and the PDF template (show dash or empty)
**Warning signs:** Empty field in generated PDF

### Pitfall 6: Layout Mismatch with Expo Router
**What goes wrong:** New screens not registered in `_layout.tsx`, causing navigation errors
**Why it happens:** Expo Router requires explicit Stack.Screen entries for beforeRemove listeners
**How to avoid:** Add all 3 new screens (protocol, protocol-sign-customer, protocol-sign-worker) to `apps/mobile/app/return/_layout.tsx`
**Warning signs:** "Screen not found" navigation errors

## Code Examples

### Handlebars Template for Return Protocol
```handlebars
{{!-- return-protocol.hbs --}}
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; font-size: 13px; color: #333; }
    .page { width: 210mm; min-height: 297mm; padding: 20mm; }
    .header { margin-bottom: 10mm; }
    .company-name { font-size: 13px; font-weight: 600; }
    .company-url { font-size: 11px; color: #0066cc; }
    .company-phone { font-size: 11px; }
    .title { font-size: 18px; font-weight: 700; margin: 15mm 0 10mm; }
    .field { margin: 4mm 0; }
    .field-num { font-weight: 700; display: inline; }
    .field-label { font-weight: 700; display: inline; }
    .field-value { display: inline; }
    .field-dots { border-bottom: 1px dotted #666; display: inline-block; min-width: 60mm; }
    .signatures { display: flex; justify-content: space-between; margin-top: 25mm; }
    .sig-block { width: 45%; text-align: center; }
    .sig-img { height: 20mm; max-width: 100%; }
    .sig-dots { border-top: 1px dotted #333; padding-top: 2mm; }
    .sig-label { font-size: 11px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="company-name">KITEK Pawel Romanowski</div>
      <div class="company-url">www.p-romanowski.pl</div>
      <div class="company-phone">Tel. (+48) 602 367 100</div>
    </div>
    <div class="title">PROTOKOL ZDAWCZO - ODBIORCZY SAMOCHODU</div>
    <div class="field"><span class="field-num">1. </span><span class="field-label">Zdajacy:</span> <span class="field-value">{{customerName}}</span></div>
    <div class="field"><span class="field-num">2. </span><span class="field-label">Data i godzina zwrotu:</span> <span class="field-value">{{formatDateTime returnDateTime}}</span></div>
    <div class="field"><span class="field-num">3. </span><span class="field-label">Marka i model samochodu:</span> <span class="field-value">{{vehicleMakeModel}}</span></div>
    <div class="field"><span class="field-num">4. </span><span class="field-label">Numer rejestracyjny:</span> <span class="field-value">{{vehicleRegistration}}</span></div>
    <div class="field"><span class="field-num">5. </span><span class="field-label">Miejsce odbioru:</span> <span class="field-value">{{#if returnLocation}}{{returnLocation}}{{else}}-{{/if}}</span></div>
    <div class="field"><span class="field-num">6. </span><span class="field-label">Czystosc pojazdu:</span> <span class="field-value">{{cleanlinessLabel}}{{#if cleanlinessNote}} ({{cleanlinessNote}}){{/if}}</span></div>
    <div class="field"><span class="field-num">7. </span><span class="field-label">Inne:</span> <span class="field-value">{{#if otherNotes}}{{otherNotes}}{{else}}-{{/if}}</span></div>
    <div class="signatures">
      <div class="sig-block">
        {{#if customerSignature}}<img class="sig-img" src="{{customerSignature}}" />{{/if}}
        <div class="sig-dots"></div>
        <div class="sig-label">Zdajacy (data i podpis)</div>
      </div>
      <div class="sig-block">
        {{#if workerSignature}}<img class="sig-img" src="{{workerSignature}}" />{{/if}}
        <div class="sig-dots"></div>
        <div class="sig-label">Odbierajacy (data i podpis)</div>
      </div>
    </div>
  </div>
</body>
</html>
```

### MailService Extension
```typescript
async sendReturnProtocolEmail(
  to: string,
  customerName: string,
  vehicleRegistration: string,
  pdfBuffer: Buffer,
  insuranceCaseNumber?: string | null,
): Promise<void> {
  const subject = insuranceCaseNumber
    ? `RentApp - Sprawa ${insuranceCaseNumber} - Protokol zwrotu ${vehicleRegistration}`
    : `RentApp - Protokol zwrotu pojazdu ${vehicleRegistration}`;
  await this.send(
    to,
    subject,
    `<p>Szanowny/a ${customerName},</p><p>W zalaczniku przesylamy protokol zdawczo-odbiorczy pojazdu ${vehicleRegistration}.</p><p>Prosimy o zachowanie tego dokumentu.</p><p>KITEK - Wynajem Pojazdow</p>`,
    [{
      filename: `protokol-zwrotu-${vehicleRegistration}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  );
}
```

### Return Draft Store Extension
```typescript
// Add to ReturnDraft interface:
protocolCleanliness: 'CZYSTY' | 'BRUDNY' | 'DO_MYCIA' | null;
protocolCleanlinessNote: string;
protocolOtherNotes: string;
protocolCustomerSignature: string | null;
protocolWorkerSignature: string | null;

// Add to initialDraft:
protocolCleanliness: null,
protocolCleanlinessNote: '',
protocolOtherNotes: '',
protocolCustomerSignature: null,
protocolWorkerSignature: null,
```

### CreateReturnProtocolDto
```typescript
export class CreateReturnProtocolDto {
  @IsString() rentalId!: string;
  @IsEnum(['CZYSTY', 'BRUDNY', 'DO_MYCIA']) cleanliness!: string;
  @IsOptional() @IsString() cleanlinessNote?: string;
  @IsOptional() @IsString() otherNotes?: string;
  @IsString() customerSignatureBase64!: string;
  @IsString() workerSignatureBase64!: string;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Paper protocol signed by hand | Digital protocol with e-signatures + PDF | This phase | Eliminates paper, enables instant email delivery |

**Project evolution:**
- Phase 34 established Puppeteer + Handlebars PDF pipeline
- Phase 37 added PDF encryption + SMS (NOT needed here)
- Phase 38 added return wizard steps (mileage, damage, notes, confirm)
- Phase 39 extends return wizard with protocol + signatures

## Open Questions

1. **Should protocol creation be part of the return API call or a separate endpoint?**
   - What we know: Currently `PATCH /rentals/:id/return` handles the return. Protocol adds signatures and extra data.
   - What's unclear: Whether to extend ReturnRentalDto or create a separate `POST /return-protocols` endpoint
   - Recommendation: Use a separate `POST /return-protocols` endpoint called from the confirm step BEFORE the existing return call. This keeps the return endpoint clean and mirrors the Contract model pattern. The confirm step calls: 1) create protocol, 2) return rental. If protocol creation fails, rental stays ACTIVE.

2. **ReturnLocation format in the protocol**
   - What we know: returnLocation is `Json?` in schema, set via Google Places (Phase 35). Format is `{ address: string, placeId: string, ... }`
   - What's unclear: Exact shape of the stored JSON
   - Recommendation: Extract `address` field from the JSON for the protocol. Handle null gracefully with "-" in PDF.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (API), Jest + React Native Testing Library (mobile) |
| Config file | `apps/api/jest.config.ts`, `apps/mobile/jest.config.ts` |
| Quick run command | `cd apps/api && npx jest --testPathPattern=return-protocol -x` |
| Full suite command | `cd apps/api && npx jest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ZWROT-01a | Protocol PDF generation with correct fields | unit | `cd apps/api && npx jest return-protocols.service.spec -x` | No - Wave 0 |
| ZWROT-01b | Protocol creation endpoint (validation, auth) | unit | `cd apps/api && npx jest return-protocols.controller.spec -x` | No - Wave 0 |
| ZWROT-01c | Protocol email sent after creation | unit | `cd apps/api && npx jest return-protocols.service.spec -x` | No - Wave 0 |
| ZWROT-01d | Cleanliness chip selector in mobile | manual-only | Manual: open return wizard, verify chips | N/A |
| ZWROT-01e | Signature capture in mobile | manual-only | Manual: sign on device, verify image | N/A |
| ZWROT-01f | Protocol download from web admin | manual-only | Manual: open rental detail, click download | N/A |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --testPathPattern=return-protocol -x`
- **Per wave merge:** `cd apps/api && npx jest && cd ../web && npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/return-protocols/return-protocols.service.spec.ts` -- covers ZWROT-01a, ZWROT-01c
- [ ] `apps/api/src/return-protocols/return-protocols.controller.spec.ts` -- covers ZWROT-01b

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `apps/api/src/contracts/pdf/pdf.service.ts` -- existing PDF generation pattern
- Codebase analysis: `apps/api/src/contracts/contracts.service.ts` -- contract creation + email flow
- Codebase analysis: `apps/api/src/mail/mail.service.ts` -- email delivery with attachments
- Codebase analysis: `apps/mobile/src/components/SignatureScreen.tsx` -- signature capture component
- Codebase analysis: `apps/mobile/app/return/` -- existing return wizard (6 screens)
- Codebase analysis: `apps/mobile/src/stores/return-draft.store.ts` -- return draft Zustand store
- Codebase analysis: `apps/api/prisma/schema.prisma` -- Rental model with returnLocation Json?
- Client template: `.planning/phases/39-return-protocol/return-protocol-template.pdf` -- visual reference

### Secondary (MEDIUM confidence)
- None needed -- all patterns are established in the codebase

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, no new dependencies
- Architecture: HIGH - follows established Contract/PDF/email patterns exactly
- Pitfalls: HIGH - identified from existing codebase patterns and prior phase decisions

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable -- no external dependencies changing)
