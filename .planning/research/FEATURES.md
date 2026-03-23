# Feature Landscape

**Domain:** Car Rental Management System (Polish market, ~100 cars, ~10 employees)
**Researched:** 2026-03-23

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Digital rental contract with signature** | Core workflow -- replaces paper. Every Polish competitor (RentCarSoft, EasyRent) has this. Without it, the app has no reason to exist. | High | Must reproduce existing PDF template. Signature via finger/stylus on mobile. Generate PDF, email to customer. |
| **Vehicle database (fleet registry)** | Operators need a single source of truth for every car: registration, VIN, mileage, insurance expiry, inspection dates. | Medium | Seed from spreadsheet import. Fields: registration, VIN, make/model, mileage, segment, insurance expiry, inspection expiry, status. |
| **Rental calendar / timeline** | Visual overview of which car is rented when. Prevents double-booking and shows fleet utilization at a glance. Every competitor has an interactive calendar as the primary UI. | High | Interactive timeline (Gantt-style). Filter by vehicle, status, date range. Color-coded statuses (reserved, active, overdue, returned). |
| **Customer database** | Must store personal data per contract (name, PESEL, ID, license). Returning customers should auto-fill. | Medium | Search by name, phone, PESEL. Link to rental history. GDPR-compliant data retention policies. |
| **Photo documentation (before/after)** | Industry standard for dispute resolution. Record360, DAMAGE iD, and all serious rental systems include timestamped vehicle photos at checkout and return. | High | Structured photo flow: walk-around capture at handover and return. Timestamp + GPS metadata. Link photos to specific rental. Mark damage areas on vehicle diagram. |
| **SMS notifications (smsapi.pl)** | Business requirement. Competitors integrate SMS for reminders, confirmations, and overdue alerts. Polish market uses SMS heavily (not push notifications) because customers are not app users. | Low | Templated messages: rental confirmation, return reminder (1 day before), overdue alert. Admin triggers for ad-hoc SMS. |
| **PDF generation and email delivery** | Contract must become a PDF matching the existing template and be emailed to customer immediately after signing. This is the end-to-end paperless promise. | Medium | Server-side PDF rendering from template. Attach to email. Store copy linked to rental record. |
| **Admin web panel** | Back-office needs full CRUD on all entities, search, filtering, and overview dashboards. Desktop-first. | High | Responsive but desktop-optimized. Role: admin. Full access to all data. Bulk operations (search, filter, export). |
| **Audit trail (who did what)** | Business requirement -- must know which employee performed each action. Required for accountability in a multi-employee operation. | Medium | Log every mutation: who, what, when. Display in admin panel per rental, per vehicle, per employee. Immutable log. |
| **User authentication with roles** | Separate access for admin vs field worker vs customer. Standard security expectation. | Medium | Roles: admin (full access), employee (mobile app, limited web), customer (portal read-only). Session management, password reset. |
| **Rental extension workflow** | Rentals frequently extend. Admin must extend dates, auto-generate updated contract or addendum, and send SMS to customer. | Medium | Extend end date, recalculate cost, notify customer via SMS. Log as audit event. |
| **Return processing** | Structured return: capture return photos, record mileage, note damages, mark rental as completed. | Medium | Checklist-driven return flow on mobile. Compare against checkout state. Flag discrepancies. |

## Differentiators

Features that set the product apart. Not expected by default, but create competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **CEPiK 2.0 driver verification** | Unique to custom-built systems. No off-the-shelf Polish rental software advertises direct CEPiK integration yet (they rely on manual checks). Verifies license validity, suspensions, and restrictions in real-time before contract signing. | High | API available since Feb 2025. Access via biurocepik2.0@cyfra.gov.pl, 2-3 week onboarding. Requires: name, license blank number. Returns: suspension status, validity. Fallback needed if API unavailable. |
| **Fully offline-capable mobile app** | Field workers hand over cars in parking lots, airports, hotels -- not always with good connectivity. Competing systems (RentCarSoft) require constant connection. Offline contract signing + photo capture + sync later = real field advantage. | High | Queue mutations locally. Sync on reconnect. Conflict resolution strategy needed. Photos upload in background. |
| **Interactive damage marking on vehicle diagram** | Beyond just photos: tap on a car silhouette to mark exact damage locations. Creates a visual record that's unambiguous in disputes. Some international players (Record360) have this, but Polish market competitors do not. | Medium | SVG vehicle diagram overlay. Tap to drop pins. Attach per-pin photo. Compare checkout vs return diagrams side-by-side. |
| **Customer self-service portal** | Simple web portal where customer views their contracts, return dates, and rental history. Link sent in contract email. Reduces inbound calls ("when is my return date?"). Polish competitors offer this but as a premium add-on. | Low | Read-only. Auth via magic link or simple login. View: active rentals, history, contract PDFs. No booking capability (out of scope). |
| **Automated alert system (multi-channel)** | Proactive alerts for: overdue returns, insurance expiry, vehicle inspection due, license expiry approaching. Goes beyond simple SMS reminders to a rule-based notification engine. | Medium | Rule engine: condition + channel (email, SMS, in-app) + timing. Configurable by admin. Covers both customer-facing (return reminders) and internal (maintenance, insurance). |
| **Vehicle maintenance and cost tracking** | Track service history, costs per vehicle, insurance claims. Enables fleet cost analysis and informed replacement decisions. Competitors have this as a core module. | Medium | Service log per vehicle. Cost categories: fuel, maintenance, insurance, fines. Dashboard with per-vehicle profitability. Not MVP -- defer to later phase. |
| **Reporting and analytics dashboard** | Fleet utilization rates, revenue per vehicle, employee performance, seasonal trends. Turns operational data into business intelligence. | Medium | Pre-built reports: utilization %, revenue by period, overdue frequency. Export to PDF/XLS. Admin-only. |
| **Quick customer onboarding (ID/license scan)** | OCR scan of ID card and driver's license to auto-fill contract fields. Reduces manual entry time from 3-5 minutes to seconds. International solutions (HQ Rental) have this. | High | Camera capture + OCR (on-device or API). Parse Polish ID card and driver's license formats. Auto-fill form fields. Manual correction step required. |

## Anti-Features

Features to explicitly NOT build. These are in the PROJECT.md out-of-scope or would add complexity without matching the business model.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Online payments** | Business explicitly settles with customers directly (cash, transfer outside the system). Adding payment processing adds PCI compliance burden, payment gateway fees, and refund handling complexity for zero user demand. | Record payment status manually (paid/unpaid/partial). Admin marks payment received. |
| **Customer self-booking / online reservations** | Rentals happen on-site, not online. Building a booking engine implies availability management, cancellation policies, and deposit handling -- massive scope for unused functionality. | Employee creates all rentals. Customer portal is read-only. |
| **Multi-language support** | Polish-only market, v1. Internationalization adds translation overhead to every UI string, error message, PDF template, and SMS template. | Hardcode Polish. Structure code so i18n is possible later but don't implement it. |
| **Accounting system integration** | No existing accounting system to integrate with. Building integrations (e.g., to Faktura VAT systems) before the core product works is premature. | Export rental/financial data as CSV/XLS. Manual import into accounting software. |
| **GPS vehicle tracking** | Requires hardware (GPS trackers) in every vehicle, cellular data plans, and real-time map infrastructure. Massive cost and complexity for a 100-car fleet that does local rentals. | Track last known mileage at checkout/return. No real-time tracking. |
| **Dynamic pricing engine** | Algorithmic pricing based on demand, season, vehicle age -- adds complexity and unpredictability. This business uses fixed rate cards. | Fixed pricing tiers configured by admin. Per-vehicle or per-segment rates. Manual price override per rental. |
| **AI damage detection** | Emerging tech (AiRentoSoft, Proofr) but immature, expensive, and overkill for 100-car fleet. False positives cause more disputes than they resolve at this scale. | Manual photo comparison. Structured damage marking on vehicle diagram. Human judgment. |
| **Chat / messaging module** | RentCarSoft has a built-in chat. For a 10-employee operation with direct customer relationships, this adds support infrastructure (notifications, read receipts, history) for a problem solved by phone calls and SMS. | SMS for notifications. Phone for conversations. No in-app chat. |

## Feature Dependencies

```
Authentication & Roles
  --> Admin Web Panel
  --> Mobile App (employee)
  --> Customer Portal

Vehicle Database
  --> Rental Calendar (needs vehicle data)
  --> Photo Documentation (links to vehicle)
  --> Maintenance Tracking (per vehicle)

Customer Database
  --> Digital Contract (needs customer data)
  --> SMS Notifications (needs phone number)
  --> Customer Portal (needs customer identity)

Digital Contract + Signature
  --> PDF Generation (contract becomes PDF)
  --> Email Delivery (PDF sent to customer)
  --> Customer Portal (displays contract)

Photo Documentation
  --> Return Processing (compare checkout vs return photos)
  --> Damage Marking (annotate on diagram)

Rental Calendar
  --> Alert System (triggers from calendar dates)
  --> Rental Extension (modifies calendar entry)
  --> SMS Reminders (triggered by upcoming return dates)

CEPiK 2.0 Integration
  --> Digital Contract (verify before signing)
  (independent -- can be added to existing contract flow later)

Audit Trail
  (cross-cutting -- attaches to all write operations)
  (implement early, hard to retrofit)
```

## MVP Recommendation

**Phase 1 -- Core Rental Workflow (must ship together to be usable):**
1. Authentication with roles (admin, employee)
2. Vehicle database with fleet registry
3. Customer database with search
4. Digital contract with signature capture
5. PDF generation and email delivery
6. Rental calendar with status tracking
7. Audit trail (implement from day one -- painful to add later)

**Phase 2 -- Field Operations:**
8. Photo documentation (checkout/return capture)
9. Return processing workflow
10. SMS notifications via smsapi.pl
11. Rental extension workflow

**Phase 3 -- Differentiation:**
12. Customer self-service portal
13. CEPiK 2.0 driver verification
14. Interactive damage marking on vehicle diagram
15. Automated multi-channel alert system

**Defer to later phases:**
- Vehicle maintenance/cost tracking -- useful but not core rental workflow
- Reporting dashboard -- needs operational data to be meaningful
- Offline mobile capability -- high complexity, validate need first
- OCR document scanning -- nice-to-have optimization, not workflow-critical

**Rationale:** The MVP must complete one full rental cycle end-to-end (create rental, sign contract, generate PDF, track on calendar) before adding ancillary features. Photo documentation comes in Phase 2 because it's essential for the field workflow but the system is usable without it for initial validation. CEPiK is Phase 3 because it has external dependency (2-3 week API access onboarding) and the rental workflow functions without it.

## Sources

- [RentCarSoft features](https://rentcarsoft.pl/funkcjonalnosci/) -- Polish market competitor, comprehensive feature set
- [Easy Rent features](https://easy-rent.pl/funkcje-programu-do-obslugi-wypozyczalni-samochodow/) -- Polish market competitor feature list
- [CEPiK 2.0 API via Cabgo](https://cabgo.pl/weryfikacja-prawa-jazdy-cepik-2-0-przez-api/) -- CEPiK API availability and integration details
- [CEPiK API Portal](http://www.cepik.gov.pl/interfejs-dla-cepik) -- Official CEPiK API documentation portal
- [DigitalHR CEPiK integration](https://digitalhr.pl/nowosci/uprawnienia-kierowcow-poprzez-api-w-systemie-cepik/) -- CEPiK API access process details
- [Record360 vehicle inspections](https://record360.com/) -- Industry standard for digital vehicle inspection
- [DAMAGE iD](https://www.damageid.com/) -- Vehicle damage documentation platform
- [AiRentoSoft AI damage detection](https://airentosoft.com/AI-powered-damage-detection) -- AI-powered damage detection capabilities
- [Capterra car rental software](https://www.capterra.com/car-rental-software/) -- Market overview of rental software
- [HQ Rental Software](https://hqrentalsoftware.com/) -- International rental management features
- [Yo-Rent fleet management challenges](https://www.yo-rent.com/blog/challenges-in-managing-car-rental-fleet-and-how-rental-software-solves-them/) -- Common pitfalls in fleet management
