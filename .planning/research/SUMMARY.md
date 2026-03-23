# Project Research Summary

**Project:** RentApp - System Zarzadzania Wypozyczalnia Samochodow
**Domain:** Car Rental Management System (Polish market, ~100 vehicles, ~10 employees)
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

RentApp is a car rental management system for a small Polish fleet operator. The core product is a field-first workflow: employees in parking lots create digital rental contracts on a mobile app, capture customer signatures, photograph vehicle condition, generate PDFs, and send them to customers -- replacing a fully paper-based process. The admin back-office manages fleet, calendar, and customer data via a web panel. Experts build this as a TypeScript monorepo with a React Native (Expo) mobile app, a Next.js web admin panel, and a NestJS API backed by PostgreSQL. This is a well-understood domain with established patterns, and the recommended stack is entirely mainstream with high-confidence version choices (Expo SDK 55, Next.js 16, NestJS 11, Prisma 7).

The recommended approach is a modular monolith backend with clear domain boundaries (vehicles, rentals, contracts, notifications), a background job queue (BullMQ/Redis) for all async work (PDF generation, SMS, email), and presigned-URL photo uploads to object storage. The rental lifecycle should be modeled as a strict state machine. The monorepo (Turborepo) shares TypeScript types and Zod validation schemas between all three client apps and the API, preventing contract drift. The system should be deployable on Railway (PaaS) with minimal DevOps overhead.

The key risks are legal, not technical. Polish GDPR (RODO) enforcement is aggressive -- ING Bank was fined 18M PLN and Glovo 5.9M PLN for improper document scanning. The system must never store full ID card images, must encrypt PESEL and personal identifiers at the field level, and must implement data retention policies from day one. The digital signature (finger-drawn SES) is legally sufficient for rental contracts under Polish law, but requires proper audit metadata (timestamp, device info, content hash) to have evidentiary value. CEPiK 2.0 driver verification is a differentiator but must be treated as optional/async since the government API requires a multi-week approval process and may be unreliable.

## Key Findings

### Recommended Stack

A full-TypeScript monorepo with three client apps and one backend API. React shares the same version (19.2) across mobile and web, and Zod schemas are shared for validation consistency.

**Core technologies:**
- **React Native + Expo SDK 55:** Cross-platform mobile app for field employees. Managed workflow with EAS builds. Includes camera, image picker, and file system modules out of the box.
- **Next.js 16:** Web admin panel and customer portal (same app, separate route groups). Server components, App Router, Tailwind v4 + shadcn/ui for rapid UI development.
- **NestJS 11:** Structured TypeScript backend. Module-per-domain pattern matches the feature set perfectly. Built-in validation, guards, interceptors for audit trail.
- **Prisma 7.4:** Pure TypeScript ORM (Rust engine dropped). Schema-first with auto-generated types. Significant performance improvements over v6.
- **PostgreSQL 16:** Primary database. JSONB for contract data snapshots, exclusion constraints for double-booking prevention, pgcrypto for field-level encryption.
- **Redis 7 + BullMQ:** Background job queue for PDF generation, SMS, email. Also used for session storage.
- **Puppeteer + Handlebars:** Server-side PDF generation with pixel-perfect Polish character support. HTML/CSS template approach matches the existing paper contract template.
- **smsapi.pl:** Official Polish SMS provider with Node.js SDK. Business requirement.

### Expected Features

**Must have (table stakes):**
- Digital rental contract with signature capture and PDF generation
- Vehicle fleet database (registration, VIN, mileage, insurance, inspection dates)
- Interactive rental calendar with double-booking prevention
- Customer database with PESEL, ID, license data (encrypted)
- Photo documentation (before/after vehicle condition)
- SMS notifications via smsapi.pl (reminders, confirmations, overdue alerts)
- PDF email delivery to customers
- Admin web panel with full CRUD
- Audit trail (who did what, when, immutable)
- Authentication with roles (admin, employee, customer)
- Rental extension and return processing workflows

**Should have (differentiators):**
- CEPiK 2.0 driver license verification (unique in Polish market)
- Customer self-service portal (read-only, magic link access)
- Interactive damage marking on vehicle diagram (SVG overlay)
- Automated multi-channel alert system (insurance expiry, inspection due, overdue returns)

**Defer (v2+):**
- Offline mobile capability (high complexity, validate need first)
- Vehicle maintenance and cost tracking
- Reporting and analytics dashboard
- OCR document scanning for ID/license auto-fill
- Online payments, self-booking, multi-language, GPS tracking, AI damage detection (anti-features)

### Architecture Approach

A modular monolith backend (single NestJS app with domain modules) serving three client apps. All heavy work (PDF, SMS, email) is async via BullMQ. Photos bypass the API entirely via presigned URL uploads to S3/MinIO. The rental lifecycle follows a strict state machine (draft -> active -> extended -> returned -> closed). An NestJS interceptor provides automatic audit logging for all mutations.

**Major components:**
1. **Auth and Audit Module** -- JWT authentication, role-based access, immutable audit trail
2. **Rental Lifecycle Module** -- State machine for the full rental cycle, links vehicle + customer + contract
3. **Contract and PDF Module** -- Digital contract creation, signature embedding, Puppeteer PDF generation, email delivery
4. **Fleet Management Module** -- Vehicle CRUD, status tracking, availability with exclusion constraints
5. **Photo and Damage Module** -- Presigned URL upload, damage annotation on SVG diagrams, photo lifecycle management
6. **Notifications Module** -- BullMQ-backed SMS (smsapi.pl), email (Nodemailer), cron-triggered reminders

### Critical Pitfalls

1. **RODO violation from document scanning** -- Never store full ID card images. Capture structured text fields only. Fines reach millions of PLN. Design the data model correctly in Phase 1.
2. **PESEL stored unencrypted** -- Implement AES-256-GCM field-level encryption for all PII (PESEL, ID number, license number) from day one. Store HMAC hashes for search. Cannot be retrofitted easily.
3. **Digital signature without audit metadata** -- The finger-drawn signature (SES) is legally admissible but must include timestamp, device info, content hash, and employee witness ID. Adapt contract language for electronic form.
4. **Double-booking race conditions** -- Use PostgreSQL exclusion constraints (`EXCLUDE USING gist`) on (vehicle_id, date_range). Application-level checks alone are insufficient with concurrent mobile users.
5. **CEPiK as a hard dependency** -- Design as async/optional with manual fallback. The API requires weeks for access approval and may be unreliable. Build the rental flow to work without it.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Data Model
**Rationale:** Everything depends on the database schema, auth, and audit trail. Legal pitfalls (RODO, encryption, data minimization) must be addressed in the data model before any business logic is written. This is also when to start the CEPiK API access application (2-3 week approval) and register the SMSAPI sender ID (manual process, business hours only).
**Delivers:** NestJS project scaffold, PostgreSQL schema with encrypted PII fields, auth module (JWT + roles), audit trail interceptor, Turborepo monorepo setup, shared types/validation package, Docker dev environment (PostgreSQL, Redis, MinIO).
**Addresses:** Authentication with roles, audit trail, vehicle database (schema), customer database (schema).
**Avoids:** PESEL stored unencrypted (Pitfall 3), no audit trail (Pitfall 10), timezone issues (Pitfall 12).

### Phase 2: Core Rental Workflow (API + Admin Panel)
**Rationale:** The rental lifecycle is the core business process and the integration point for all other features. Building the API endpoints and admin panel together validates the data model and establishes the end-to-end contract from frontend to database.
**Delivers:** Vehicle CRUD, customer CRUD, rental lifecycle with state machine, rental calendar with double-booking prevention, basic admin panel (Next.js + shadcn/ui) with fleet management and calendar views.
**Addresses:** Vehicle database, customer database, rental calendar, admin web panel.
**Avoids:** Double-booking race conditions (Pitfall 5), free-form status updates (Anti-pattern 3).

### Phase 3: Contract, Signature, and PDF
**Rationale:** The digital contract is the product's reason to exist. It depends on the rental lifecycle (Phase 2) and requires the signature capture, PDF generation pipeline, and email delivery to be built together as a cohesive flow.
**Delivers:** Contract template (Handlebars), signature capture on web (admin-created contracts), Puppeteer PDF generation via BullMQ, email delivery with PDF attachment, contract versioning.
**Addresses:** Digital rental contract with signature, PDF generation and email delivery.
**Avoids:** Polish character encoding in PDFs (Pitfall 6), hardcoded contract template (Anti-pattern 4), weak signature legal standing (Pitfall 2).

### Phase 4: Mobile App (Field Operations)
**Rationale:** The mobile app is the primary user interface for field employees but depends on a stable API (Phases 1-3). Building mobile after the API is proven avoids rework. This phase delivers the field-first workflow: customer selection, contract signing, photo capture.
**Delivers:** Expo React Native app with auth flow, customer lookup/creation, vehicle selection, contract form with signature capture, photo capture with presigned URL upload, rental submission.
**Addresses:** Photo documentation (before/after), return processing workflow, mobile field workflow.
**Avoids:** No offline architecture consideration (Pitfall 9 -- design local-first even if online-only initially), photo storage bloat (Pitfall 8 -- compress on device).

### Phase 5: Notifications and Alerts
**Rationale:** SMS and email notifications are a business requirement and depend on the rental lifecycle and contact data being in place. This phase also adds the rental extension workflow which triggers notifications.
**Delivers:** SMS integration (smsapi.pl), email notifications, return reminder cron jobs, rental extension workflow with auto-notification, overdue alerts.
**Addresses:** SMS notifications, rental extension workflow, automated alert system.
**Avoids:** SMS encoding cost doubling (Pitfall 7 -- use nounicode=1).

### Phase 6: Differentiation Features
**Rationale:** These features set RentApp apart from competitors but are not required for the core rental workflow. CEPiK access should be approved by now (applied in Phase 1). Customer portal is low complexity and high value.
**Delivers:** CEPiK 2.0 driver verification (with manual fallback), customer self-service portal (magic link auth, read-only), interactive damage marking on vehicle SVG diagram.
**Addresses:** CEPiK verification, customer portal, damage marking.
**Avoids:** CEPiK as hard dependency (Pitfall 4 -- async with fallback), insecure magic links (Pitfall 13 -- cryptographic tokens with expiry).

### Phase 7: Polish and Scale
**Rationale:** Once the core system is operational, add features that improve efficiency and provide business intelligence.
**Delivers:** Reporting dashboard (utilization, revenue, trends), vehicle maintenance/cost tracking, photo lifecycle management (cold storage migration), performance optimization.
**Addresses:** Reporting and analytics, vehicle maintenance tracking.

### Phase Ordering Rationale

- **Phases 1-3 form the critical path:** Schema -> rental lifecycle -> contract PDF. Each depends on the previous. No parallelization possible.
- **Phase 4 (mobile) after Phase 3 (contract):** The mobile app is the primary interface but building it against an unstable API causes rework. The admin panel in Phase 2-3 validates the API first.
- **Phase 5 (notifications) after Phase 4 (mobile):** SMS reminders and extension workflows are meaningful only after rentals are being created via the mobile app.
- **Phase 6 (differentiation) last before polish:** CEPiK requires external approval (started in Phase 1), customer portal is low-effort high-value, damage marking enhances the photo system from Phase 4.
- **Non-technical tasks to start in Phase 1:** CEPiK API application, SMSAPI sender ID registration, contract template legal review with a lawyer.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Contract/PDF):** The existing paper contract template must be analyzed to design the Handlebars template. Legal review needed for electronic signature clause wording. Puppeteer resource requirements on Railway need validation.
- **Phase 4 (Mobile App):** Offline architecture decisions (even if online-only MVP) need validation with the business owner about field connectivity conditions. React Native Skia integration for damage marking needs prototyping.
- **Phase 6 (CEPiK):** API access process and response format need validation once access is granted. The exact fields available for driver verification are documented but may differ in practice.

Phases with standard patterns (skip deep research):
- **Phase 1 (Foundation):** Standard NestJS + Prisma + PostgreSQL setup. Well-documented.
- **Phase 2 (Core CRUD + Calendar):** Standard REST CRUD with state machine. FullCalendar/react-big-calendar are mature.
- **Phase 5 (Notifications):** SMSAPI has an official Node.js SDK. BullMQ + Nodemailer are standard patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against official release pages. Version matrix is current as of March 2026. Expo SDK 55, Next.js 16, NestJS 11, Prisma 7.4 are all stable releases. |
| Features | HIGH | Feature landscape validated against two Polish competitors (RentCarSoft, EasyRent) and international references (Record360, HQ Rental). Anti-features are well-justified. |
| Architecture | HIGH | Modular monolith with BullMQ async processing is the standard pattern for this domain and scale. Database schema covers all identified entities. |
| Pitfalls | HIGH | Critical pitfalls backed by UODO enforcement decisions (ING 18M PLN, Glovo 5.9M PLN), official SMSAPI documentation, and well-documented booking system patterns. |

**Overall confidence:** HIGH

### Gaps to Address

- **CEPiK API access timeline:** The approval process (email to biurocepik2.0@cyfra.gov.pl) has an unknown timeline. Start immediately but plan for it to not be available until Phase 6 or later. Build the entire system to function without it.
- **Existing contract template:** The paper contract template needs to be digitized into a Handlebars template. This requires input from the business owner and potentially legal review for electronic adaptation.
- **Offline requirement validation:** Pitfall 9 (no offline capability) is rated MEDIUM confidence because actual field connectivity conditions are unknown. The business owner should confirm whether employees regularly encounter dead zones. The architecture should accommodate offline regardless, but the implementation priority depends on this answer.
- **Railway hosting for Puppeteer:** Puppeteer requires a Chromium binary (~200MB). Verify that Railway's container environment supports this and that cold start times are acceptable. Alternative: use a dedicated PDF generation service or switch to a lighter PDF library if Puppeteer is too heavy.
- **Photo storage cost projections:** At 20-40 photos per rental, ~100 rentals/month, ~300KB per compressed photo, storage grows at ~1-4GB/month. Manageable, but lifecycle policies should be defined before launch.

## Sources

### Primary (HIGH confidence)
- Expo SDK 55 changelog: https://expo.dev/changelog/sdk-55
- NestJS releases: https://github.com/nestjs/nest/releases
- Prisma v7 announcement: https://www.prisma.io/blog/announcing-prisma-orm-7-0-0
- Next.js releases: https://github.com/vercel/next.js/releases
- UODO fine against ING Bank: https://uodo.gov.pl/decyzje/DKN.5131.1.2025
- UODO fine against Glovo: https://kicb.pl/ponad-58-mln-zl-kary-dla-wlasciciela-glovo-za-skanowanie-dokumentow/
- CEPiK API documentation: https://api.cepik.gov.pl/doc
- CEPiK access portal: https://www.gov.pl/web/cepik/api-dla-centralnej-ewidencji-pojazdow-i-kierowcow-api-do-cepik
- SMSAPI integration docs: https://www.smsapi.com/blog/sms-api-integration-checklist/
- Electronic signature legality Poland (Docusign): https://www.docusign.com/products/electronic-signature/legality/poland
- Electronic signature legality Poland (PandaDoc): https://www.pandadoc.com/electronic-signature-law/poland/

### Secondary (MEDIUM confidence)
- RentCarSoft features: https://rentcarsoft.pl/funkcjonalnosci/
- Easy Rent features: https://easy-rent.pl/funkcje-programu-do-obslugi-wypozyczalni-samochodow/
- CEPiK API via Cabgo: https://cabgo.pl/weryfikacja-prawa-jazdy-cepik-2-0-przez-api/
- UODO document scanning guidance: https://auraco.pl/blog/skany-dokumentow-osobistych-praktyczny-przewodnik/
- Railway hosting: https://railway.app
- Poland SMS restrictions (Vonage): https://api.support.vonage.com/hc/en-us/articles/204017553

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
