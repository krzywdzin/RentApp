# Domain Pitfalls

**Domain:** Car rental management system (Polish market)
**Researched:** 2026-03-23

## Critical Pitfalls

Mistakes that cause rewrites, legal liability, or major issues.

### Pitfall 1: Scanning/Storing Full Identity Document Images

**What goes wrong:** The system captures and stores full scans or photos of dowod osobisty (ID card), including photo, CAN number, and other data beyond what is necessary for the rental contract. UODO (Polish data protection authority) has ruled this violates the RODO data minimization principle (Art. 5(1)(c) GDPR).

**Why it happens:** It feels natural to "just photograph the ID" for verification. Developers implement a simple camera capture without understanding that storing the full document image is legally distinct from recording specific data fields.

**Consequences:** Fines up to millions of PLN. In August 2025, ING Bank was fined over 18 million PLN for systematic copying of identity documents. Glovo's Polish entity was fined 5.9 million PLN for similar violations. A car rental company is not exempt.

**Prevention:**
- Capture individual data fields (name, PESEL, ID number, issuing authority, issue date) as structured text input -- not as document scans.
- For driver's license: photographing the license to verify driving rights can be considered proportionate and justified (RODO Art. 6(1)(b) and 6(1)(f)), but storage duration must be limited and justified.
- Implement a clear data retention policy: delete personal data after the rental period plus any legally required retention period (typically statute of limitations for claims -- 3 years for business contracts in Poland).
- Never store CAN numbers from ID cards.

**Detection (warning signs):** A feature spec that says "scan dowod" or "photograph ID card" without specifying exactly which fields are captured and stored.

**Phase relevance:** Must be resolved in Phase 1 (data model design). Retrofitting data minimization into a system that already stores full document images requires data migration and potential UODO notification.

**Confidence:** HIGH -- based on UODO enforcement decisions and official guidance.

---

### Pitfall 2: Digital Signature Without Legal Standing

**What goes wrong:** The app collects a finger/stylus drawn signature and embeds it in a PDF, but the resulting document has weak legal standing because the signature type and contract formation process were not designed with Polish eIDAS regulations in mind.

**Why it happens:** Developers implement a simple canvas drawing component and assume "a signature is a signature." Polish law recognizes three levels of electronic signature (SES, AES, QES) under eIDAS, each with different legal weight.

**Consequences:** In a dispute, the customer could argue the contract is not binding. For car rental agreements, Polish law does not require written form (forma pisemna) -- oral agreements are valid. However, the entire point of the system is to have enforceable documentation. A weak signature process undermines this.

**Prevention:**
- Car rental contracts (umowa najmu) do not require written form under pain of invalidity in Polish law, so a Simple Electronic Signature (SES) -- the drawn signature -- is legally admissible as evidence.
- However, strengthen evidentiary value by: (1) capturing a timestamp with the signature, (2) logging device info and IP, (3) including a hash of the contract content at signing time, (4) sending the signed PDF immediately to the customer's email as confirmation.
- Store the full audit trail: who signed, when, on which device, which employee facilitated.
- Do NOT claim the signature is a "qualified electronic signature" (QES) -- it is not. Frame it correctly in the contract text as an electronic signature per Art. 25 eIDAS.
- Include a clause in the contract where the customer acknowledges and accepts the electronic form.

**Detection (warning signs):** Contract template that references "podpis wlasnoręczny" (handwritten signature) without adapting language for electronic context. No audit metadata stored alongside the signature.

**Phase relevance:** Phase 1-2 (contract template design + signature implementation). The contract template wording and signature capture must be designed together.

**Confidence:** HIGH -- based on Polish eIDAS implementation, Docusign/PandaDoc legal guides for Poland, and Polish civil code provisions on contract form.

---

### Pitfall 3: PESEL and Personal Data Stored Without Encryption at Rest

**What goes wrong:** The database stores PESEL, ID numbers, and driver's license numbers in plaintext. A database breach exposes all customer identity data, triggering mandatory UODO notification (72 hours) and potential fines.

**Why it happens:** Developers treat these as regular string fields. The urgency to ship features pushes encryption "to later." Standard ORMs and database setups do not encrypt individual fields by default.

**Consequences:** Data breach notification obligations. Potential UODO fines. Reputational destruction for a local business. PESEL is essentially a permanent identifier (like SSN) -- once leaked, it cannot be changed.

**Prevention:**
- Encrypt sensitive fields (PESEL, nr dowodu, nr prawa jazdy) at the application level before storage. Use AES-256-GCM or similar.
- Separate encryption keys from the database (use environment variables or a key management service).
- Implement column-level encryption for these specific fields, not just disk encryption (which does not protect against SQL injection or application-level breaches).
- Ensure search functionality works with encrypted data (e.g., store a HMAC hash for lookup, decrypt only for display).
- Audit trail: log who accessed decrypted personal data and when.

**Detection (warning signs):** Database schema where PESEL is a VARCHAR without any encryption wrapper. No key management strategy in the architecture document.

**Phase relevance:** Phase 1 (database design). Must be built in from the start. Retrofitting encryption requires data migration and potential downtime.

**Confidence:** HIGH -- RODO requirement, UODO enforcement patterns.

---

### Pitfall 4: CEPiK API Treated as Real-Time Dependency

**What goes wrong:** The rental workflow blocks on a CEPiK API call to verify driver's license. CEPiK is a government API -- it has maintenance windows, can be slow, and may be unavailable. When it is down, employees cannot complete rentals.

**Why it happens:** The happy-path design assumes the API is always available. The CEPiK API is free and accessible, so developers integrate it directly into the rental flow without fallback planning.

**Consequences:** Employee in the field cannot complete a rental because the verification step hangs or fails. Lost revenue. Frustrated customers waiting in the parking lot.

**Prevention:**
- Design CEPiK verification as asynchronous/non-blocking. Allow the rental to proceed with a "verification pending" status.
- Implement a fallback: manual verification (employee visually checks the driver's license and records the details). Flag these rentals for later CEPiK confirmation when the API is available.
- Cache recent verification results (a driver verified yesterday is likely still valid today).
- Monitor CEPiK API health with circuit breaker pattern -- after N failures, automatically switch to manual mode and alert the admin.
- Note: CEPiK API access requires application to biurocepik2.0@cyfra.gov.pl. The approval process timeline is unknown. Build the system to work without CEPiK first.

**Detection (warning signs):** Rental creation flow that has a hard dependency on an external API call. No "degraded mode" in the workflow design.

**Phase relevance:** Design the fallback in Phase 1 (workflow design). Implement CEPiK integration in a later phase as an enhancement, not a blocker.

**Confidence:** MEDIUM -- CEPiK API availability characteristics are based on general government API patterns and limited public documentation. The access process (email application) suggests it is not a self-service, instant-access API.

---

### Pitfall 5: Double-Booking / Calendar Race Conditions

**What goes wrong:** Two employees simultaneously assign the same car to different customers for overlapping dates. The calendar shows the car as available to both because the reservation is not committed until the contract is signed.

**Why it happens:** With ~10 employees in the field using mobile apps, concurrent access to the same fleet data is inevitable. Simple SELECT-then-INSERT patterns without locking allow race conditions.

**Consequences:** Two customers show up for the same car. One must be turned away. Unprofessional, potential conflict, lost revenue.

**Prevention:**
- Use database-level constraints: a unique constraint or exclusion constraint on (vehicle_id, date_range) that prevents overlapping bookings at the database level (PostgreSQL supports range types and exclusion constraints natively with `EXCLUDE USING gist`).
- Implement optimistic locking with version numbers on vehicle availability records.
- Show real-time or near-real-time availability in the app (WebSocket or polling with short intervals).
- Add a "hold" mechanism: when an employee starts a rental for a vehicle, place a temporary 15-minute hold that other employees can see.
- Buffer time between rentals (e.g., 1-2 hours) for cleaning and inspection.

**Detection (warning signs):** No database-level constraint preventing overlapping date ranges for the same vehicle. Availability check done only at the application level.

**Phase relevance:** Phase 1 (database schema design) for constraints. Phase 2 (mobile app) for real-time availability display.

**Confidence:** HIGH -- well-documented problem in all booking/reservation systems.

---

## Moderate Pitfalls

### Pitfall 6: Polish Character Encoding in PDF Generation

**What goes wrong:** Generated PDF contracts display garbled text instead of Polish diacritics (ą, ę, ó, ś, ź, ż, ć, ń, ł). The standard 14 PDF fonts do not support Polish characters.

**Why it happens:** Default PDF libraries use built-in fonts that only support ASCII/Latin-1. Developers test with "Jan Kowalski" (no diacritics) and miss the issue until production.

**Prevention:**
- Use a PDF generation approach that supports UTF-8 with embedded fonts (e.g., Puppeteer/Chromium rendering HTML-to-PDF, or a library like pdf-lib with explicitly embedded Polish-compatible fonts).
- Embed a font that covers Polish characters (DejaVu Sans, Roboto, or Lato all work).
- Test PDF generation with maximally diacritical test data: "Małgorzata Łączkowska-Źrebięcka, ul. Żółkiewskiego 13/4, Łódź."
- Include font embedding in the CI/CD test suite -- generate a test PDF and validate character rendering.

**Detection (warning signs):** PDF generation tests using only ASCII names. No explicit font embedding in the PDF generation configuration.

**Phase relevance:** Phase 2 (PDF generation feature). Must be validated before the contract template is finalized.

**Confidence:** HIGH -- extensively documented issue in PDF generation libraries (dompdf, jsPDF, etc.).

---

### Pitfall 7: SMS Character Encoding Eating Message Budgets

**What goes wrong:** SMS messages containing Polish diacritics (ą, ę, etc.) switch from GSM-7 encoding (160 chars/segment) to UCS-2 encoding (70 chars/segment). A 120-character reminder with one "ą" becomes a 2-segment message, doubling the cost.

**Why it happens:** Developers write natural Polish text in SMS templates without considering encoding economics. SMSAPI.pl has a `nounicode` parameter that strips diacritics, but if not enabled, Polish characters trigger UCS-2.

**Prevention:**
- Use SMSAPI's `nounicode=1` parameter to automatically transliterate Polish diacritics (ą->a, ę->e, etc.). This keeps messages in GSM-7 encoding at 160 chars/segment.
- Write SMS templates using ASCII-safe Polish (e.g., "Przypominamy o zwrocie samochodu" instead of using special characters).
- Monitor SMS costs -- a sudden doubling often indicates encoding issues.
- Note SMSAPI rate limit: 100 requests/second per IP. Unlikely to be a problem at this scale (~100 cars) but implement queuing anyway.
- Sender ID is limited to 11 alphanumeric characters and requires manual verification (business hours Mon-Fri 8-17). Register the sender name early -- the default is "Test."

**Detection (warning signs):** SMS templates with Polish diacritics and no `nounicode` parameter. No sender ID registered before launch.

**Phase relevance:** Phase 2-3 (SMS integration). Register sender ID as a non-technical task in Phase 1.

**Confidence:** HIGH -- directly from SMSAPI.pl documentation.

---

### Pitfall 8: Photo Storage Without Compression or Lifecycle Management

**What goes wrong:** Each rental generates 20-40 high-resolution photos (vehicle condition before/after). At ~100 rentals/month, uncompressed photos accumulate to hundreds of GB within months. Storage costs balloon. App performance degrades when loading photo galleries.

**Why it happens:** The initial implementation stores original camera images (3-8 MB each from modern phones) without server-side compression. No lifecycle policy moves old photos to cheaper storage tiers.

**Prevention:**
- Compress photos on the device before upload: resize to max 1920px on the longest edge, JPEG quality 80%. This typically reduces 5MB to ~300KB with acceptable quality for damage documentation.
- Generate thumbnails server-side for gallery views (200px, ~20KB each).
- Implement storage lifecycle: keep full-resolution photos for the rental period + 1 year (statute of limitations for visible damage claims), then move to cold storage or delete.
- Use presigned URLs for direct-to-storage uploads (S3 or equivalent) to avoid routing through the application server.
- Tag photos with metadata: rental_id, vehicle_id, timestamp, before/after, employee_id.

**Detection (warning signs):** No image compression in the upload pipeline. No storage cost projections in the architecture document. Photos stored as BLOBs in the database.

**Phase relevance:** Phase 2 (photo documentation feature). Design the storage strategy before implementation.

**Confidence:** HIGH -- standard mobile app image management concern, validated by scale math.

---

### Pitfall 9: No Offline Capability for Field Workers

**What goes wrong:** The mobile app requires constant internet connectivity. Employees in parking garages, rural areas, or dead zones cannot complete rentals. The app shows spinners or errors, and the employee resorts to paper.

**Why it happens:** Building offline-first is significantly harder than online-only. The initial MVP is built assuming connectivity, and offline is "added later" -- which often means never, because retrofitting offline sync is architecturally invasive.

**Prevention:**
- Design for offline from the start, even if the first implementation is online-only. This means: local-first data model, sync queue for pending operations, conflict resolution strategy.
- Critical offline flows: creating a rental (draft), capturing photos, capturing signatures. These must work without connectivity.
- Sync strategy: queue operations locally, sync when connectivity returns. For this scale (~10 employees), "last write wins" with employee identification is likely sufficient -- true conflicts are rare.
- Pre-cache vehicle fleet data and active rentals on app startup.
- Display clear connectivity status in the UI so employees know when they are operating offline.

**Detection (warning signs):** All API calls are fire-and-forget with no local persistence layer. No "pending sync" concept in the data model.

**Phase relevance:** Architecture decision in Phase 1. Implementation in Phase 2 (mobile app). Even if offline is not in MVP, the data model must accommodate it.

**Confidence:** MEDIUM -- severity depends on actual connectivity conditions at rental locations. Discuss with the business owner whether poor connectivity is a real problem.

---

### Pitfall 10: Audit Trail as an Afterthought

**What goes wrong:** The audit trail is implemented as simple log messages rather than a structured, queryable record. When the business owner asks "which employee extended this rental on Tuesday?" there is no reliable way to answer.

**Why it happens:** Audit logging feels like a cross-cutting concern that can be "added later." But retroactively adding audit trails means historical actions are unrecoverable.

**Prevention:**
- Implement audit logging from day one as a first-class data model: `audit_events` table with (event_id, user_id, action, entity_type, entity_id, timestamp, before_state, after_state, ip_address, device_info).
- Every mutation to rentals, contracts, vehicles, and customer data must create an audit record.
- Make audit records immutable (append-only, no UPDATE or DELETE on the audit table).
- Build a simple audit viewer in the admin panel from the start.
- This is especially important for RODO compliance: you need to demonstrate who accessed personal data and when.

**Detection (warning signs):** No `audit_events` or equivalent table in the schema. Audit implemented via application logs (grep-based, not queryable).

**Phase relevance:** Phase 1 (database schema and API middleware). Must be wired in before any business logic is written.

**Confidence:** HIGH -- explicit business requirement in PROJECT.md ("Auth z audit trailem").

---

## Minor Pitfalls

### Pitfall 11: Contract Template Drift

**What goes wrong:** The PDF template and the digital contract form diverge over time. The business updates the paper template but the digital version is not updated (or vice versa). Customers receive contracts with different terms depending on channel.

**Prevention:**
- Use a single source of truth for the contract template -- an HTML/Handlebars template that generates both the on-screen form and the PDF.
- Version the contract template with a version number displayed on each generated contract.
- Implement a template update workflow: business owner uploads new template -> admin reviews -> deploy.

**Phase relevance:** Phase 2 (contract/PDF generation).

---

### Pitfall 12: Timezone and Date Handling for Rental Periods

**What goes wrong:** Rental start/end times are stored ambiguously. Poland observes CET/CEST daylight saving time. A rental starting at "14:00" near a DST transition could be interpreted differently, causing 1-hour billing disputes.

**Prevention:**
- Store all timestamps in UTC with timezone info (ISO 8601 with offset).
- Display in Polish local time (Europe/Warsaw).
- For rental duration calculations, use a proper date-time library that handles DST (e.g., date-fns-tz, Luxon).
- Define billing periods based on calendar days, not 24-hour blocks, to avoid DST edge cases.

**Phase relevance:** Phase 1 (data model). Use UTC from the start.

---

### Pitfall 13: Customer Portal Security with Email-Based Access

**What goes wrong:** The customer portal uses a "magic link" sent via email. If the link token is predictable, does not expire, or grants access to other customers' data, it becomes a security vulnerability.

**Prevention:**
- Use cryptographically random tokens (at least 32 bytes, URL-safe base64).
- Tokens expire after 24 hours and are single-use for authentication (issue a session after first use).
- Scope access strictly: a customer can only see their own rentals.
- Rate-limit magic link requests to prevent enumeration.
- Include the customer's email in the token validation to prevent token reuse across accounts.

**Phase relevance:** Phase 3 (customer portal). Security design during Phase 1.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data model design | Storing full document scans instead of structured fields | Define exactly which fields are captured from each document type. No image capture of ID cards. |
| Data model design | No encryption for PESEL/ID numbers | Implement field-level encryption from day one. |
| Data model design | No audit trail table | Add `audit_events` as part of initial schema. |
| Contract/signature | Weak legal standing of digital signature | Include timestamp, device info, hash; adapt contract language for electronic form. |
| CEPiK integration | Hard dependency on government API | Design as async/optional. Build manual fallback first. |
| PDF generation | Polish character encoding failures | Embed UTF-8 fonts explicitly. Test with maximum-diacritical data. |
| SMS integration | Diacritics doubling message costs | Use `nounicode=1`. Register sender ID early (manual process). |
| Photo documentation | Uncompressed photos, no lifecycle policy | Compress on device, thumbnails on server, lifecycle policies for old photos. |
| Mobile app | No offline support despite field-worker use case | Design local-first data model even if online-only MVP. |
| Calendar/scheduling | Double-booking race conditions | Database-level exclusion constraints on (vehicle, date_range). |
| Customer portal | Insecure magic link implementation | Cryptographic tokens, expiry, single-use, strict scoping. |

## Sources

- [UODO on document scanning legality](https://auraco.pl/blog/skany-dokumentow-osobistych-praktyczny-przewodnik/) -- MEDIUM confidence
- [UODO fine against ING Bank (18M PLN) for document copying](https://uodo.gov.pl/decyzje/DKN.5131.1.2025) -- HIGH confidence
- [UODO fine against Glovo (5.9M PLN)](https://kicb.pl/ponad-58-mln-zl-kary-dla-wlasciciela-glovo-za-skanowanie-dokumentow/) -- HIGH confidence
- [CEPiK API driver verification](https://chandonwaller.pl/api-weryfikacja-uprawnien-kierowcy/) -- MEDIUM confidence
- [CEPiK API access: biurocepik2.0@cyfra.gov.pl](http://www.cepik.gov.pl/interfejs-dla-cepik) -- HIGH confidence (official portal)
- [Electronic signature legality in Poland (eIDAS)](https://www.docusign.com/products/electronic-signature/legality/poland) -- HIGH confidence
- [PandaDoc: e-signature law Poland](https://www.pandadoc.com/electronic-signature-law/poland/) -- HIGH confidence
- [Car rental contract form requirements (Polish law)](https://poradnikprzedsiebiorcy.pl/-wzor-umowa-najmu-samochodu-z-omowieniem) -- MEDIUM confidence
- [SMSAPI.pl integration docs](https://www.smsapi.com/blog/sms-api-integration-checklist/) -- HIGH confidence
- [SMSAPI.pl FAQ on encoding and rate limits](https://www.smsapi.com/blog/tech-support-sms-communication-faq/) -- HIGH confidence
- [Polish diacritics in PDF generation (dompdf issue)](https://github.com/dompdf/dompdf/discussions/3172) -- HIGH confidence
- [Double-booking prevention system design](https://itnext.io/solving-double-booking-at-scale-system-design-patterns-from-top-tech-companies-4c5a3311d8ea) -- HIGH confidence
- [GDPR enforcement in Poland](https://cms.law/en/int/publication/gdpr-enforcement-tracker-report/poland) -- HIGH confidence
- [Poland SMS features and restrictions](https://api.support.vonage.com/hc/en-us/articles/204017553-Poland-SMS-Features-and-Restrictions) -- MEDIUM confidence
