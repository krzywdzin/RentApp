# Phase 37: Contract Delivery -- PDF Encryption & Email - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Post-process generated contract PDFs with password encryption (RODO compliance), send the password via SMS (never in email), and make email subjects informative for inbox filtering. Applies to both contracts and annexes.

</domain>

<decisions>
## Implementation Decisions

### SMS password message
- Minimal factual tone: "Haslo do PDF umowy: TO 12345. KITEK" -- short, just the fact
- No greeting, no extra context -- SMS should be concise
- SMS only sent AFTER successful encryption + email delivery

### SMS timing
- Claude's Discretion: pick approach that makes most sense technically (parallel or sequential with email)

### Email subject format
- With insurance case number: "RentApp - Sprawa {caseNumber} - Umowa najmu {registration}" -- case number prominent for inbox filtering
- Without insurance case number: keep current format "RentApp - Umowa najmu pojazdu {registration}" -- no change
- Same pattern for annexes: "RentApp - Sprawa {caseNumber} - Aneks nr {N} do umowy {contractNumber}" when case exists

### Encryption error handling
- NEVER send unencrypted PDF to customer -- RODO requirement is absolute
- Retry encryption with backoff until successful -- don't give up
- If encryption consistently fails, log error for admin investigation but DO NOT send unencrypted email
- SMS only sent after successful encryption + email send

### Annex handling
- Annexes are ALSO encrypted with same password (vehicle registration number)
- Annex email subjects include insurance case number (same format as contract emails)
- Customer receives a new SMS with password EVERY time an annex is sent (not just first time)
- Same encryption + SMS flow as main contract

### Claude's Discretion
- Exact retry strategy (interval, max retries, backoff pattern) for encryption failures
- SMS timing relative to email (parallel or sequential)
- Whether to use a queue/job for retry logic or inline retry
- @pdfsmaller/pdf-encrypt-lite integration details (RC4-128 per STATE.md decision)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PDF generation and email delivery
- `apps/api/src/contracts/contracts.service.ts` -- Main contract creation flow, sendContractEmail call at line 551 (fire-and-forget via setImmediate)
- `apps/api/src/contracts/pdf/pdf.service.ts` -- PDF buffer generation
- `apps/api/src/mail/mail.service.ts` -- Resend API integration, sendContractEmail and sendAnnexEmail methods

### SMS delivery
- `apps/api/src/notifications/sms/sms.service.ts` -- smsapi.pl integration, send(to, message) method

### Prior decisions
- `.planning/STATE.md` -- Decision: @pdfsmaller/pdf-encrypt-lite (RC4-128, pure JS, no qpdf on Railway)
- `.planning/ROADMAP.md` -- Phase 37 depends on Phase 34 (PDF template finalized)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MailService.sendContractEmail()` -- accepts pdfBuffer, needs encryption applied BEFORE passing buffer
- `MailService.sendAnnexEmail()` -- same pattern, accepts pdfBuffer for annex
- `SmsService.send(to, message)` -- ready to use for password SMS
- `SmsProcessor` (Bull queue) -- existing queue infrastructure for async SMS

### Established Patterns
- Fire-and-forget email via `setImmediate` in contracts.service.ts (line 550)
- SMS via smsapi.pl with Polish phone normalization
- Email via Resend API with attachments
- Contract frozen data contains vehicle.registration (password source) and insuranceCaseNumber

### Integration Points
- `contracts.service.ts` line ~540-560: where PDF buffer is passed to sendContractEmail -- encryption goes here
- `sendContractEmail` signature needs insuranceCaseNumber parameter for subject
- `sendAnnexEmail` needs same encryption + subject changes
- SMS password send triggered alongside email delivery

</code_context>

<specifics>
## Specific Ideas

- Password = vehicle registration number (e.g., "TO 12345") -- already available in frozenData.vehicle.registration
- SMS text must be in Polish, minimal: "Haslo do PDF umowy: {registration}. KITEK"
- @pdfsmaller/pdf-encrypt-lite is a newer library (Feb 2026) -- validate encrypted PDF opens correctly in common readers before shipping

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 37-contract-delivery-pdf-encryption-email*
*Context gathered: 2026-04-14*
