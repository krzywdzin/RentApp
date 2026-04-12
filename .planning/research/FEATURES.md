# Feature Landscape: v3.0 Client Features & Contract Enhancements

**Domain:** Car rental management software (Polish market, B2B internal tool)
**Researched:** 2026-04-12
**Context:** 17 new features requested by client for existing production system (v2.3)

## Table Stakes

Features that any serious Polish car rental system must have. Their absence makes the product feel incomplete for the operator's daily work.

| # | Feature | Why Expected | Complexity | Depends On |
|---|---------|--------------|------------|------------|
| 4 | Company client support (NIP) | Every Polish rental company rents to businesses. Invoice with NIP is a legal requirement for B2B. All competitors (RentCarSoft, Easy Rent, CorCode) support this. | Low | Customer model, contract PDF template |
| 5 | Client terms acceptance (checkbox) | RODO/GDPR compliance and liability protection. Standard in all Polish rental contracts. Already have `rodoConsentAt` on Contract but need explicit terms acceptance flow. | Low | Contract signing flow (mobile) |
| 8 | Client address in mobile app | Address is required on every Polish rental contract. Field exists on Customer model (`address`) but is not exposed in mobile rental wizard -- worker cannot complete a proper contract in the field. | Low | Customer model (field exists, needs mobile UI) |
| 11 | VAT payer status (100%/50%/no) | Polish tax law: companies deducting 100% VAT on cars need different documentation than 50% or non-VAT-payers. Business clients will ask about this. | Low | Company client support (#4), Rental model |
| 13 | Second driver (full data + CEPiK) | Industry standard in Poland. Enterprise, Avis, and all major operators require all drivers listed on the contract with full documentation. Insurance invalidated if unlisted driver causes accident. Additional drivers must provide same docs as primary + meet age/license requirements. | Medium | Customer model, CEPiK verification (exists), Contract PDF |
| 14 | Custom terms notes field (in PDF) | Workers need per-rental conditions ("no cross-border", "snow tires included", "max 500km/day"). Every competitor has free-text conditions on contract. | Low | Contract PDF template |
| 9 | Email subject = case number + registration | Basic operational hygiene. Insurance companies and fleet managers filter emails by vehicle registration and case number. Current generic subjects get lost in inboxes. | Low | Email sending service (exists) |
| 10 | Hide VIN/production year from client | Standard practice in Polish rental industry. Clients don't need VIN (privacy/theft concern). Production year hidden to prevent perceived value judgments. Customer portal and client-facing PDF affected. | Low | Customer portal, contract PDF |

**Notes:** Features 4, 5, 8, 11, 14 are simple model/form additions -- they extend existing flows. Feature 13 is the most complex table-stakes item because it replicates the full customer data entry + CEPiK verification flow, but all building blocks exist.

## Differentiators

Features that go beyond what Polish competitors (RentCarSoft, Easy Rent, CorCode) typically offer. These create genuine operational advantage.

| # | Feature | Value Proposition | Complexity | Depends On |
|---|---------|-------------------|------------|------------|
| 1 | Document scanning (OCR) of Polish ID + driver's license | Eliminates manual data entry of PESEL, name, address, ID number, license number. Worker photographs document, data auto-fills. Saves 2-3 min per rental. Polish ID cards have MRZ zones readable programmatically. No Polish competitor advertises this. | High | Camera access (exists), OCR cloud service, Customer model |
| 15 | Return protocol implementation | Structured return process with checklist matching client's template. Goes beyond current minimal returnData JSON to a proper protocol document with fuel level, accessories checklist, cleanliness, structured damage assessment. Generates separate return PDF. | Medium-High | PhotoWalkthrough RETURN type (exists), PDF generation, new data model |
| 16 | Rental settlement tracking | Tracks deposit, payments, damage charges, refunds, balance. Currently zero financial tracking post-rental. Critical operational gap -- admin has no visibility into which rentals are fully paid. Dashboard shows unsettled rentals with aging. | Medium | Rental model, web admin panel |
| 17 | Encrypted PDF (password = registration) | Genuine RODO/GDPR compliance improvement. Contract PDFs contain PESEL, address, ID numbers -- sensitive personal data sent via email. Password protection with registration number (communicated via SMS) adds real security layer. | Medium | PDF generation (exists), SMS service (exists) |
| 6 | Pickup/return location (Google Places) | Professional touch for delivery/collection service. Logs exact address with autocomplete. Useful as evidence for insurance claims (proves where handover occurred). | Medium | Google Places API key, mobile UI |
| 2 | Vehicle classification system | Enables pricing by class, availability filtering, upselling. Admin defines classes (economy, comfort, premium, SUV). Improves fleet organization as fleet grows. | Low-Med | Vehicle model, admin panel |

## Operational Enhancements

Workflow improvements that bridge gaps in current system. Not differentiators per se, but address real operator pain points.

| # | Feature | Value Proposition | Complexity | Depends On |
|---|---------|-------------------|------------|------------|
| 3 | Editable rental terms (2nd contract page) | Each rental can have custom terms (insurance excess, mileage limits, fuel policy, geographic restrictions). Currently hardcoded in PDF template. Operator wants per-rental control. | Medium | Contract PDF template, rental form, possibly rich-text storage |
| 7 | Insurance case number field | Tracks which rentals are insurance replacement vehicles (very common in Poland -- OC claims give victim a replacement car). Links rental to insurance claim for billing/reference. | Low | Rental model |
| 12 | VAT collection notification on return | Reminds worker to collect VAT documentation/receipt from client at vehicle return. Prevents revenue leakage on VAT-deductible rentals. | Low | Notification system (exists), VAT status (#11) |

## Anti-Features

Features to explicitly NOT build in v3.0.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Automated NIP/REGON company lookup | Polish REGON API (BIR1) is free but unreliable with downtime and rate limits. Adds external dependency for data that worker already has on the client's business card. | Validate NIP format client-side using checksum algorithm (use `validate-polish` library). Worker enters company name manually. |
| AI-powered custom OCR model | Training a custom model for Polish documents is expensive overkill. Cloud APIs (Google Vision, Azure Document Intelligence) have pre-built ID document extractors that handle MRZ zones well. | Use cloud OCR API with pre-built document type recognition. |
| Full offline OCR processing | On-device OCR models for Polish documents don't exist in quality. Expo doesn't support heavy ML models well. | Require connectivity for OCR. Store photos locally, upload when connected, process server-side. |
| Multi-driver unlimited | Supporting N arbitrary drivers adds complexity (dynamic form arrays, N CEPiK checks, PDF layout issues). Client asked for second driver only. | Support exactly one second driver. If third driver needed, use custom notes field. |
| Automated settlement/invoicing integration | No accounting system to integrate with. Building invoice generation adds tax compliance burden. | Track payments manually in settlement panel. Export data for accountant. |

## Feature Dependencies

```
[4] Company client (NIP)
  --> [11] VAT payer status (needs isCompany context)
    --> [12] VAT notification on return (needs VAT status)

[8] Client address in mobile --> [1] Document OCR (OCR auto-fills address field)

[7] Insurance case number --> [9] Email subject formatting (includes case # if present)

[3] Editable rental terms + [14] Custom notes --> both modify contract PDF page 2
  (should ship together to avoid double PDF template rework)

[13] Second driver --> reuses Customer model + CEPiK verification (both exist)
  --> modifies Contract PDF (add second driver section)

[15] Return protocol --> extends existing PhotoWalkthrough RETURN type
  --> needs its own PDF template

[16] Settlement tracking --> standalone new model
  --> informs [12] VAT notification logic

[17] Encrypted PDF --> post-processes existing PDF generation pipeline
  --> needs SMS service (exists) to send password
```

**Critical dependency chains:**
1. **NIP chain:** 4 -> 11 -> 12 (must ship in order)
2. **PDF template chain:** 3 + 14 + 10 + 13 all modify the contract PDF (batch together)
3. **Email chain:** 7 -> 9 (case number must exist before email subject uses it)

## Complexity Assessment

### Low Complexity (1-2 days each)
Schema field addition + mobile/web form field + optional PDF template tweak.

| Feature | What Changes |
|---------|-------------|
| 4 - Company client | Add `isCompany: Boolean`, `companyName: String?`, `nipNumber: String?` to Customer. Checkbox toggles company fields in mobile form. NIP checksum validation. Update contract PDF "Wynajmujacy" section. |
| 5 - Terms acceptance | Add `termsAcceptedAt: DateTime?` to Contract. Scrollable terms text + checkbox in mobile signing wizard (before signature step). Block signing until accepted. |
| 7 - Insurance case # | Add `insuranceCaseNumber: String?` to Rental. Optional text field in rental creation form. Display in rental detail views. |
| 8 - Client address | Address field already on Customer model. Add address input to mobile rental wizard customer step. Pre-fill if returning customer. |
| 9 - Email subject | Modify email service template: subject = `[${insuranceCaseNumber || contractNumber}] ${vehicleRegistration}`. ~10 lines of code. |
| 10 - Hide VIN/year from client | Add field exclusion to customer portal API serialization. Remove VIN/year from client-facing PDF section. Keep in admin/worker views. |
| 14 - Custom notes | Add `customTermsNotes: String?` to Rental or Contract. Textarea in mobile form. Render as additional paragraph in PDF terms section. |
| 12 - VAT notification | Add Bull queue job: on rental status change to RETURNED, check customer VAT status, if applicable send in-app notification to return worker. |

### Medium Complexity (3-5 days each)
New UI components, external API integration, or new data models.

| Feature | What Changes |
|---------|-------------|
| 2 - Vehicle classes | New `VehicleClass` model (id, name, description, sortOrder). Admin CRUD panel. FK `classId` on Vehicle. Filter/group in vehicle list. Optional: default daily rate per class. |
| 3 - Editable terms | Default terms template (admin-editable in web panel, stored as `RentalTermsTemplate`). Per-rental override: `customTerms: String?` (rich text or structured JSON) on Contract. PDF renderer reads custom terms or falls back to default. |
| 6 - Google Places | Install `react-native-google-places-autocomplete`. Add `pickupLocation` and `returnLocation` (JSON: address, placeId, lat, lng) to Rental. Location picker component in mobile rental wizard. Google Places API key in env. Billing: ~$2.83 per 1000 autocomplete requests. |
| 11 - VAT status | Add `vatPayerType` enum (FULL_100, PARTIAL_50, NONE) to Customer or Rental. Affects contract PDF VAT breakdown display. Does NOT change price calculation (VAT rate stays 23%), only changes how it's presented to client. |
| 13 - Second driver | Add `secondDriverId: String?` FK on Rental -> Customer. Reuse customer search/create flow in mobile wizard ("Add second driver" step). Trigger CEPiK check for second driver. Add second driver data block to contract PDF. Second driver signs contract (reuse signature component). |
| 16 - Settlement | New `RentalSettlement` model: rentalId, depositAmount, depositPaidAt, additionalCharges (JSON array), payments (JSON array or separate model), status (PENDING/PARTIAL/SETTLED/DISPUTED), settledAt, notes. Web panel: settlement tab on rental detail. Dashboard widget: unsettled rentals. |
| 17 - Encrypted PDF | After PDF generation, post-process with `node-qpdf2` (wraps qpdf binary) or `pdf-lib` to add AES-256 password. Password = vehicle registration number (lowercase, no spaces). Send SMS: "Haslo do umowy: {registration}". Store encrypted version, send encrypted via email. |

### High Complexity (5-10 days)
New service integration, significant UI work, or entirely new workflow.

| Feature | What Changes |
|---------|-------------|
| 1 - Document OCR | **Camera UI:** Photo capture component for front of ID card + front of driver's license (2 captures minimum). **Server-side:** Upload image to Google Cloud Vision API or Azure Document Intelligence with Polish ID document type. **Parsing:** Extract from MRZ: surname, given names, document number, PESEL (encoded in MRZ), expiry date, nationality. Extract from VIZ: address (only on Polish ID, not in MRZ). For license: number, categories, issue date, issuing authority. **Auto-fill:** Map parsed fields to Customer form, display for worker review/correction. **Storage:** Save original photos as customer document attachments. **Edge cases:** Poor lighting, glare, damaged documents, old format IDs (pre-2019 vs post-2019 Polish ID layouts differ). |
| 15 - Return protocol | **New model:** `ReturnProtocol` with structured fields: returnMileage, fuelLevel (enum: FULL/3_4/HALF/1_4/EMPTY), cleanlinessRating, accessoriesChecklist (JSON: spareTire, documents, keys, jack, triangleWarning), additionalCharges (JSON), workerNotes, clientNotes. **Mobile wizard:** Multi-step return flow (mileage -> fuel -> damage map -> accessories -> charges -> notes -> signatures). **PDF:** Separate return protocol PDF matching client's template. **Integration:** Links to existing PhotoWalkthrough RETURN + DamageReport. **Signatures:** Both worker and client sign return protocol. |

## User Flow Analysis

### Document OCR Flow (Feature 1)
```
Worker taps "Scan Document" on customer step
  -> Camera opens for ID card front
  -> Photo captured + displayed for confirmation
  -> Upload to OCR service (needs connectivity)
  -> Parsed fields shown in editable form:
     - First name, Last name (from MRZ)
     - PESEL (from MRZ, 3rd line)
     - ID number (from MRZ)
     - ID expiry date (from MRZ)
     - Address (from VIZ -- lower reliability)
  -> Worker corrects any errors, confirms
  -> Camera opens for driver's license front
  -> Same flow: parse license number, categories, dates
  -> All fields auto-filled in customer form
  -> Document photos saved as attachments
```
**Key decisions:** Worker MUST be able to correct every field (OCR is never 100%). Address extraction from VIZ zone has lower accuracy than MRZ fields. Require connectivity (no offline OCR). Polish ID cards issued after 2019-03-04 have different layout than older ones -- both must be handled.

### Second Driver Flow (Feature 13)
```
During rental creation, after primary customer step:
  -> "Dodaj drugiego kierowce" button appears
  -> Search existing customer (phone/PESEL/name)
     OR create new customer (same form as primary)
  -> CEPiK verification runs for second driver
  -> Second driver data appears in contract preview
  -> At signing: second driver signs after primary
  -> Contract PDF includes second driver section
```
**Key decisions:** Second driver stored as full Customer record (reusable for future rentals). Second driver MUST sign the contract (Polish rental industry standard -- all listed drivers sign). CEPiK check is mandatory for second driver, same as primary.

### Return Protocol Flow (Feature 15)
```
Worker opens active rental, taps "Return"
  -> Step 1: Record return mileage + date/time
  -> Step 2: Fuel level selection (visual gauge)
  -> Step 3: Damage inspection (existing SVG damage map)
  -> Step 4: Accessories checklist (checkboxes)
  -> Step 5: Cleanliness rating + notes
  -> Step 6: Additional charges (optional line items)
  -> Step 7: Client reviews + signs return protocol
  -> Step 8: Worker signs
  -> Return protocol PDF generated + emailed
  -> Rental status -> RETURNED
```
**Currently:** Return flow exists but is minimal (returnData JSON blob, returnMileage int, damage map). This feature replaces the unstructured approach with a formal protocol document.

### Settlement Tracking Flow (Feature 16)
```
Admin opens rental detail in web panel:
  -> "Rozliczenie" tab shows:
     - Rental cost: dailyRateNet x days = totalNet + VAT = totalGross
     - Deposit: amount, collected date, method
     - Additional charges: fuel, damage, late fee (line items)
     - Payments received: amount, date, method (line items)
     - Balance: calculated (total + charges - deposit - payments)
     - Status: PENDING / PARTIAL / SETTLED / DISPUTED
  -> Admin adds payment entries as received
  -> Admin can add charge entries (damage, fuel, cleaning)
  -> Dashboard widget: unsettled rentals sorted by age
```

## MVP Recommendation for v3.0

### Phase 1: Quick wins + PDF template batch (~1 week)
Ship together because they're all low-complexity and many touch the same PDF template.
1. **[8] Client address in mobile** -- unblocks complete contracts
2. **[4] Company client (NIP)** -- unblocks business rentals
3. **[5] Terms acceptance checkbox** -- RODO compliance
4. **[7] Insurance case number** -- tracks replacement rentals
5. **[14] Custom terms notes** -- per-rental conditions
6. **[9] Email subject formatting** -- depends on #7
7. **[10] Hide VIN/year from client** -- privacy fix

### Phase 2: Business logic + contract enhancements (~1.5 weeks)
Features that change pricing display, add contract sections, or need the NIP chain.
1. **[11] VAT payer status** -- depends on #4
2. **[12] VAT notification on return** -- depends on #11
3. **[3] Editable rental terms** -- PDF template rework
4. **[13] Second driver** -- reuses existing CEPiK
5. **[2] Vehicle classification** -- admin panel feature

### Phase 3: Infrastructure features (~1.5 weeks)
External API integrations and new data models.
1. **[6] Google Places location** -- external API
2. **[16] Settlement tracking** -- new model + web panel
3. **[17] Encrypted PDF** -- post-processing pipeline

### Phase 4: High-complexity differentiators (~2 weeks)
1. **[1] Document OCR scanning** -- highest complexity, highest impact
2. **[15] Return protocol** -- new workflow + PDF generation

**Phase ordering rationale:**
- Phase 1 ships fast wins that immediately improve daily operations and batches PDF template changes
- Phase 2 builds on Phase 1 (NIP chain, PDF already modified)
- Phase 3 is independent infrastructure that doesn't block Phase 4
- Phase 4 is last because OCR and return protocol are self-contained, benefit from stable contract/rental changes, and are the riskiest features

## Sources

- [Nomora - 10 Best Car Rental Software 2026](https://www.nomora.io/blog/car-rental-software-solutions-2026)
- [RentCarSoft - System dla wypozyczalni](https://rentcarsoft.pl/o_systemie/)
- [CorCode - System zarzadzania wypozyczalnia](https://corcode.com/)
- [Enterprise Poland - General Conditions of Car Rental](https://www.enterpriserentacar.pl/en/help/general-conditions-of-car-rental-in-poland.html)
- [Auto Europe - Poland Driving Information](https://www.autoeurope.com/driving-information/poland/)
- [Record360 - Vehicle Inspection Checklist](https://record360.com/blog/what-to-check-when-renting-a-car-an-inspection-checklist/)
- [node-qpdf2 - PDF encryption for Node.js](https://www.npmjs.com/package/node-qpdf2)
- [react-native-google-places-autocomplete](https://www.npmjs.com/package/react-native-google-places-autocomplete)
- [validate-polish - NIP/PESEL/REGON validation](https://github.com/radarsu/validate-polish)
- [Polish REGON API (BIR1)](https://api.stat.gov.pl/Home/RegonApi?lang=en)
- [Avis Poland - Location Specific Conditions](https://production.rent-at-avis.com/avisonline/terms.nsf/TermsByCountryAndLngCategories/PL-GB-Common?OpenDocument=)
