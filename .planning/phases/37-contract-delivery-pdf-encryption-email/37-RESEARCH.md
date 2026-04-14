# Phase 37: Contract Delivery -- PDF Encryption & Email - Research

**Researched:** 2026-04-14
**Domain:** PDF encryption (RC4-128), SMS delivery, email subject formatting
**Confidence:** HIGH

## Summary

Phase 37 adds three post-processing features to the existing contract/annex delivery flow: (1) encrypt PDF buffers with password = vehicle registration number before email attachment, (2) send password via SMS (never in email), and (3) make email subjects informative with insurance case numbers. All data needed (registration, phone, insuranceCaseNumber) already exists in frozenData. The encryption library (@pdfsmaller/pdf-encrypt-lite) is a 7KB pure-JS package with zero dependencies -- confirmed available on npm at v1.0.2.

The existing code has clear integration points: contract email at contracts.service.ts line ~550 (fire-and-forget via setImmediate) and annex email at line ~730 (awaited). SmsService and Bull queue infrastructure already exist. The key challenge is the RODO-mandated invariant: NEVER send unencrypted PDF -- encryption must succeed before email send, with retry on failure.

**Primary recommendation:** Create a thin PdfEncryptionService that wraps @pdfsmaller/pdf-encrypt-lite, then modify the contract/annex email flows to encrypt-then-send with SMS password notification after successful delivery.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- SMS password message: Minimal factual tone: "Haslo do PDF umowy: TO 12345. KITEK" -- short, just the fact. No greeting, no extra context. SMS only sent AFTER successful encryption + email delivery.
- Email subject format: With insurance case number: "RentApp - Sprawa {caseNumber} - Umowa najmu {registration}". Without: keep current format "RentApp - Umowa najmu pojazdu {registration}". Annexes: "RentApp - Sprawa {caseNumber} - Aneks nr {N} do umowy {contractNumber}" when case exists.
- Encryption error handling: NEVER send unencrypted PDF to customer (RODO absolute). Retry encryption with backoff until successful. If consistently fails, log error for admin but DO NOT send unencrypted email. SMS only sent after successful encryption + email send.
- Annex handling: Also encrypted with same password. Annex email subjects include insurance case number. Customer receives new SMS with password EVERY time annex is sent. Same encryption + SMS flow as main contract.

### Claude's Discretion
- Exact retry strategy (interval, max retries, backoff pattern) for encryption failures
- SMS timing relative to email (parallel or sequential)
- Whether to use a queue/job for retry logic or inline retry
- @pdfsmaller/pdf-encrypt-lite integration details (RC4-128 per STATE.md decision)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UMOWA-05 | PDF umowy jest szyfrowany haslem rownym numerowi rejestracyjnemu pojazdu | PdfEncryptionService wrapping @pdfsmaller/pdf-encrypt-lite; password = frozenData.vehicle.registration |
| UMOWA-06 | Informacja o hasle do PDF wysylana jest SMS-em przy wynajmie (nie w emailu) | SmsService.send() already exists; Bull queue with retry; triggered after successful email delivery |
| UMOWA-07 | Tytul emaila z umowa zawiera nr sprawy ubezpieczeniowej (jesli jest) + nr rejestracyjny pojazdu | Modify sendContractEmail/sendAnnexEmail subject construction; insuranceCaseNumber available in frozenData |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @pdfsmaller/pdf-encrypt-lite | 1.0.2 | RC4-128 PDF encryption | Decided in STATE.md; pure JS, zero deps, 7KB, works on Railway (no native qpdf needed) |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| smsapi | existing | SMS delivery via smsapi.pl | Password notification SMS |
| @nestjs/bull + bull | existing | Job queue with retry | SMS queue already has 3 retries + exponential backoff |
| resend | existing | Email delivery via Resend API | Contract/annex email with encrypted PDF attachment |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @pdfsmaller/pdf-encrypt-lite | pdf-lib-with-encrypt | Heavier (2MB+), not suitable for Railway; decision already locked |
| Inline retry | Bull queue for encryption retry | Overkill -- encryption is CPU-only, no network; inline retry with 3 attempts is sufficient |

**Installation:**
```bash
cd apps/api && npm install @pdfsmaller/pdf-encrypt-lite@1.0.2
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/contracts/
  pdf/
    pdf.service.ts           # Existing PDF generation
    pdf-encryption.service.ts # NEW: wraps @pdfsmaller/pdf-encrypt-lite
  contracts.service.ts        # Modified: encrypt before email, add SMS trigger
  contracts.module.ts         # Modified: import NotificationsModule for SmsService
apps/api/src/mail/
  mail.service.ts             # Modified: accept insuranceCaseNumber for subject
```

### Pattern 1: PdfEncryptionService (Thin Wrapper)
**What:** Dedicated service encapsulating encryption logic with retry
**When to use:** All PDF encryption before email send
**Example:**
```typescript
// Source: @pdfsmaller/pdf-encrypt-lite npm README + NestJS conventions
import { Injectable, Logger } from '@nestjs/common';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';

@Injectable()
export class PdfEncryptionService {
  private readonly logger = new Logger(PdfEncryptionService.name);
  private readonly MAX_RETRIES = 3;

  async encrypt(pdfBuffer: Buffer, password: string): Promise<Buffer> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const uint8 = new Uint8Array(pdfBuffer);
        const encrypted = await encryptPDF(uint8, password);
        return Buffer.from(encrypted);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `PDF encryption attempt ${attempt}/${this.MAX_RETRIES} failed: ${lastError.message}`,
        );
        if (attempt < this.MAX_RETRIES) {
          await new Promise(r => setTimeout(r, attempt * 500)); // 500ms, 1s, 1.5s
        }
      }
    }
    throw new Error(`PDF encryption failed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
  }
}
```

### Pattern 2: Encrypt-then-Send Flow
**What:** Encryption MUST succeed before email is dispatched; SMS only after email success
**When to use:** Both contract and annex delivery
**Example flow:**
```typescript
// In contracts.service.ts -- contract email flow
const encryptedPdf = await this.pdfEncryptionService.encrypt(pdfBuffer, vehicleReg);
await this.mailService.sendContractEmail(/* ... encryptedPdf ... */);
// Only after both succeed:
await this.smsService.send(customerPhone, `Haslo do PDF umowy: ${vehicleReg}. KITEK`);
```

### Pattern 3: Email Subject with Insurance Case Number
**What:** Conditional subject format based on presence of insuranceCaseNumber
**When to use:** sendContractEmail and sendAnnexEmail
**Example:**
```typescript
// In mail.service.ts
const subject = insuranceCaseNumber
  ? `RentApp - Sprawa ${insuranceCaseNumber} - Umowa najmu ${vehicleRegistration}`
  : `RentApp - Umowa najmu pojazdu ${vehicleRegistration}`;
```

### Anti-Patterns to Avoid
- **Sending email before encryption completes:** Violates RODO. Encryption MUST be awaited, not fire-and-forget.
- **Including password in email body/subject:** Password goes ONLY via SMS, never in email.
- **Skipping SMS on annex:** Every annex send requires its own SMS with the password.
- **Catching encryption error and sending unencrypted:** NEVER fall through to send on encryption failure.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF encryption | Custom RC4 implementation | @pdfsmaller/pdf-encrypt-lite | Cryptographic correctness, PDF structure handling, reader compatibility |
| SMS delivery + retry | Custom retry loop for SMS | Existing Bull SMS queue | Already has 3 retries, exponential backoff, failure tracking in Notification table |
| Phone normalization | Custom phone parsing | SmsService.normalizePhone() | Already handles Polish +48/9-digit formats |

## Common Pitfalls

### Pitfall 1: Buffer/Uint8Array Mismatch
**What goes wrong:** @pdfsmaller/pdf-encrypt-lite expects Uint8Array input, but pdf.service.ts returns Buffer.
**Why it happens:** Node.js Buffer is a Uint8Array subclass but some libraries check with instanceof.
**How to avoid:** Always convert: `new Uint8Array(pdfBuffer)` before passing to encryptPDF, then `Buffer.from(result)` for the output.
**Warning signs:** "Invalid input" or "Expected Uint8Array" errors.

### Pitfall 2: Fire-and-Forget Contract Email Cannot Stay Fire-and-Forget
**What goes wrong:** Current contract email is fire-and-forget (setImmediate, line 550). But now we need to know if email succeeded before sending SMS.
**Why it happens:** The encrypt-email-SMS chain requires sequential success confirmation.
**How to avoid:** Keep setImmediate for non-blocking (don't block contract signing response), but inside the setImmediate, the encrypt -> email -> SMS chain must be sequential (awaited). This is already the pattern -- setImmediate wraps a promise chain.
**Warning signs:** SMS sent but email actually failed.

### Pitfall 3: Annex Email Is Awaited (Different Pattern from Contract)
**What goes wrong:** Contract email uses setImmediate (fire-and-forget), but annex email is directly awaited (line 730). Both need encryption + SMS, but the wrapping differs.
**Why it happens:** Contract signing must return immediately; annex creation can wait.
**How to avoid:** Apply encryption + SMS to both flows, respecting each flow's async pattern.
**Warning signs:** Encryption applied to one but not the other.

### Pitfall 4: Customer Phone Availability
**What goes wrong:** SMS requires customer phone, but it may not be in the email-sending context.
**Why it happens:** sendContractEmail currently only passes email-related params.
**How to avoid:** frozenData.customer.phone is already populated (confirmed in contracts.service.ts line ~132). Pass it through the delivery flow.
**Warning signs:** Undefined phone number, SMS silently skipped.

### Pitfall 5: Registration Number as Password -- Spaces
**What goes wrong:** Polish registration like "TO 12345" has a space. User might type it without space.
**Why it happens:** PDF password is exact-match; if user types "TO12345" it won't open.
**How to avoid:** SMS message shows the exact password with space (as stored in frozenData). Decide if password should include the space or not -- recommend including it as-is from the database, since that's what appears on the vehicle.
**Warning signs:** Customer can't open PDF because password format mismatch.

## Code Examples

### Existing Contract Email Integration Point (contracts.service.ts ~540-565)
```typescript
// CURRENT (no encryption):
setImmediate(() => {
  this.mailService.sendContractEmail(
    customerEmail, customerName, vehicleReg, contractNumber, pdfBuffer, portalUrl,
  ).then(() => { /* log */ }).catch((error) => { /* log */ });
});

// AFTER (with encryption + SMS):
setImmediate(() => {
  this.pdfEncryptionService.encrypt(pdfBuffer, vehicleReg)
    .then((encryptedPdf) =>
      this.mailService.sendContractEmail(
        customerEmail, customerName, vehicleReg, contractNumber,
        encryptedPdf, portalUrl, insuranceCaseNumber,
      )
    )
    .then(() => {
      // SMS only after successful email
      const customerPhone = frozenData.customer.phone;
      if (customerPhone) {
        return this.smsService.send(customerPhone, `Haslo do PDF umowy: ${vehicleReg}. KITEK`);
      }
    })
    .then(() => { this.logger.log(`Contract email + SMS sent for ${contractNumber}`); })
    .catch((error) => {
      this.logger.error(`Failed contract delivery for ${contractNumber}: ${error.message}`);
      // PDF NOT sent if encryption fails -- RODO compliant
    });
});
```

### Existing Annex Email Integration Point (contracts.service.ts ~725-743)
```typescript
// CURRENT (no encryption):
await this.mailService.sendAnnexEmail(customerEmail, customerName, contractNumber, annexNumber, pdfBuffer);

// AFTER (with encryption + SMS):
const encryptedPdf = await this.pdfEncryptionService.encrypt(pdfBuffer, vehicleReg);
await this.mailService.sendAnnexEmail(
  customerEmail, customerName, contractNumber, annexNumber, encryptedPdf, insuranceCaseNumber,
);
// SMS after successful email
const customerPhone = frozenData.customer.phone;
if (customerPhone) {
  await this.smsService.send(customerPhone, `Haslo do PDF umowy: ${vehicleReg}. KITEK`);
}
```

### MailService Subject Changes
```typescript
// sendContractEmail -- add insuranceCaseNumber param
async sendContractEmail(
  to: string, customerName: string, vehicleRegistration: string,
  contractNumber: string, pdfBuffer: Buffer, portalUrl?: string,
  insuranceCaseNumber?: string | null,  // NEW
): Promise<void> {
  const subject = insuranceCaseNumber
    ? `RentApp - Sprawa ${insuranceCaseNumber} - Umowa najmu ${vehicleRegistration}`
    : `RentApp - Umowa najmu pojazdu ${vehicleRegistration}`;
  // ... rest unchanged, use `subject` variable
}

// sendAnnexEmail -- add insuranceCaseNumber param
async sendAnnexEmail(
  to: string, customerName: string, contractNumber: string,
  annexNumber: number, pdfBuffer: Buffer,
  insuranceCaseNumber?: string | null,  // NEW
): Promise<void> {
  const subject = insuranceCaseNumber
    ? `RentApp - Sprawa ${insuranceCaseNumber} - Aneks nr ${annexNumber} do umowy ${contractNumber}`
    : `RentApp - Aneks nr ${annexNumber} do umowy ${contractNumber}`;
  // ... rest unchanged
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| qpdf native binary | Pure JS encryption (@pdfsmaller/pdf-encrypt-lite) | Feb 2026 | No native deps needed on Railway |
| AES-256 PDF encryption | RC4-128 | Ongoing | RC4-128 has universal reader compatibility (PDF 1.4); AES-256 requires PDF 2.0 support |

**Notes on RC4-128:**
- RC4 is considered cryptographically weak by modern standards, but PDF encryption's threat model is casual access prevention (RODO compliance for personal data), not defense against determined attackers.
- RC4-128 is supported by ALL PDF readers (Adobe, Preview, Chrome, Firefox, mobile viewers). AES-256 has spotty support in older/mobile readers.
- The decision to use RC4-128 was already made and locked in STATE.md.

## Open Questions

1. **Password format with spaces**
   - What we know: Vehicle registration "TO 12345" has a space. frozenData stores it as-is.
   - What's unclear: Should the password include the space or strip it?
   - Recommendation: Use as-is (with space) -- it matches what the customer sees on the vehicle and in the SMS. Stripping would create confusion.

2. **SMS for annex -- message text**
   - What we know: Contract SMS says "Haslo do PDF umowy: {reg}. KITEK"
   - What's unclear: Should annex SMS say "umowy" or "aneksu"?
   - Recommendation: Use "Haslo do PDF umowy: {reg}. KITEK" for both -- the password is the same, and "umowy" is the umbrella term. Keeps it simple.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via @nestjs/testing) |
| Config file | apps/api/jest config in package.json |
| Quick run command | `cd apps/api && npx jest --testPathPattern contracts.service.spec --no-coverage -t "encrypt"` |
| Full suite command | `cd apps/api && npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UMOWA-05 | PDF buffer is encrypted before email attachment | unit | `cd apps/api && npx jest --no-coverage -t "encrypt"` | No -- Wave 0 |
| UMOWA-05 | Encryption failure prevents email send | unit | `cd apps/api && npx jest --no-coverage -t "encrypt.*fail"` | No -- Wave 0 |
| UMOWA-06 | SMS sent after successful email with correct message | unit | `cd apps/api && npx jest --no-coverage -t "SMS.*password"` | No -- Wave 0 |
| UMOWA-06 | SMS NOT sent if email fails | unit | `cd apps/api && npx jest --no-coverage -t "SMS.*not.*sent"` | No -- Wave 0 |
| UMOWA-07 | Email subject includes insurance case number when present | unit | `cd apps/api && npx jest --no-coverage -t "subject.*insurance"` | No -- Wave 0 |
| UMOWA-07 | Email subject uses default format when no case number | unit | `cd apps/api && npx jest --no-coverage -t "subject.*default"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && npx jest --no-coverage --testPathPattern contracts`
- **Per wave merge:** `cd apps/api && npx jest --no-coverage`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `apps/api/src/contracts/pdf/pdf-encryption.service.spec.ts` -- covers UMOWA-05 (encryption unit tests)
- [ ] Update `apps/api/src/contracts/contracts.service.spec.ts` -- covers UMOWA-05/06/07 (integration of encrypt + email + SMS + subject)
- [ ] Update `apps/api/src/mail/mail.service.spec.ts` (if exists) or inline tests -- covers UMOWA-07 (subject format)
- [ ] Install @pdfsmaller/pdf-encrypt-lite before tests can run

## Sources

### Primary (HIGH confidence)
- npm registry: @pdfsmaller/pdf-encrypt-lite v1.0.2 -- verified via `npm view`, zero deps, 49.1KB unpacked
- Project source code: contracts.service.ts, mail.service.ts, sms.service.ts, sms.processor.ts -- read directly

### Secondary (MEDIUM confidence)
- [npm package page](https://www.npmjs.com/package/@pdfsmaller/pdf-encrypt-lite) -- API: `encryptPDF(pdfBytes: Uint8Array, userPassword: string, ownerPassword?: string): Promise<Uint8Array>`
- [PDFSmaller.com](https://pdfsmaller.com/protect-pdf) -- confirms RC4-128 encryption, battle-tested on production

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- library verified on npm, API confirmed via web search, decision locked in STATE.md
- Architecture: HIGH -- all integration points read directly from source code, patterns are straightforward
- Pitfalls: HIGH -- identified from direct code analysis (Buffer/Uint8Array, fire-and-forget vs awaited patterns)

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable domain, library unlikely to change)
