# Phase 8: Notifications and Alerts - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated SMS (smsapi.pl) and email notifications for rental lifecycle events, plus a configurable alert system that proactively warns about upcoming deadlines (return dates, insurance expiry, vehicle inspections). Covers backend notification infrastructure, SMS integration, alert detection cron, in-app notification model, and configurable rules. Admin panel UI for viewing alerts is Phase 5; mobile notification display is Phase 6.

</domain>

<decisions>
## Implementation Decisions

### SMS Message Content & Triggers
- **Provider:** smsapi.pl (locked business requirement). Sender ID registration needed before go-live.
- **Tone:** Short & formal, max ~160 chars where possible (may extend to 2 segments for reminders)
- **Language:** Polish
- **Company phone number:** Included in every SMS. Sourced from `COMPANY_PHONE` environment variable.
- **SMS triggers (customer-facing):**
  - Return reminder (1 day before) — includes return date + TIME, extension possibility mention, company phone
  - Overdue alert (daily while overdue, max 7 days configurable) — urgent tone, return time, contact number
  - Extension confirmation (on `rental.extended` event) — new return date + time
- **NOT triggered by SMS:** Rental confirmation (handled by email only)
- **Return reminder content must include:** return hour (not just date), info about extension possibility ("w celu przedluzenia prosimy o kontakt pod nr..."), company phone

### Alert Detection & Timing
- **Detection method:** Daily cron job scan at 8:00 AM
- **Cron scans for:**
  - Rentals with return date = tomorrow (return reminder SMS)
  - Rentals past return date with status != RETURNED (overdue SMS, daily)
  - Vehicles with insurance expiring in 30 or 7 days (two-stage alert)
  - Vehicles with inspection (przeglad) due in 30 or 7 days (two-stage alert)
- **Event-driven (immediate):** Extension confirmation SMS sent immediately on `rental.extended` event, not via cron
- **Send time:** 8:00 AM for cron-based notifications. Immediate for event-driven (extension).

### Alert Recipients
- **Customer SMS:** Return reminder, overdue, extension confirmation
- **Admin only:** Insurance expiry, inspection deadlines (email + in-app)
- **No employee alerts** for vehicle deadlines in v1

### Notification Delivery & Tracking
- **Notification log table:** Every notification logged with: type, channel (SMS/email/in-app), recipient, status (PENDING/SENT/FAILED), timestamp, related entity (rentalId/vehicleId)
- **Retry policy:** 3 retries with exponential backoff (1min, 5min, 15min). After 3 failures → status = FAILED
- **No delivery receipts** from smsapi.pl in v1 — status tracks send attempt, not actual delivery
- **In-app notifications:** Bell icon with unread count. Notification list endpoint (API). Mark as read/dismiss. UI built in Phase 5/6, API + model built here.

### Configurable Rules Engine
- **Configuration depth:** Toggle (enable/disable) + timing adjustment per alert type. No full rule builder.
- **Storage:** AlertConfig database table with rows per alert type: `enabled` (bool), `leadTimeDays` (int), `channels` (JSON array), `maxRepeat` (int for overdue cap)
- **Default rules seeded on first run:**
  - Return reminder: enabled, 1 day before, SMS
  - Overdue alert: enabled, daily, max 7 days, SMS
  - Extension confirmation: enabled, immediate, SMS
  - Insurance expiry: enabled, 30 + 7 days, email + in-app
  - Inspection due: enabled, 30 + 7 days, email + in-app
- **Admin edits via API** — UI in Phase 5
- **No customer opt-out** in v1

### Email Notifications
- **Extend existing MailService** (nodemailer) with notification-specific templates
- **Email triggers:**
  - Rental confirmation (on `rental.activated`) — rental details, dates, vehicle info
  - Insurance/inspection alerts to admin — vehicle details, expiry date, urgency level
- **Contract PDF email** already handled by Phase 4 — not duplicated here

### Claude's Discretion
- smsapi.pl SDK vs REST API integration approach
- Notification log table schema details
- In-app notification data model (Prisma)
- AlertConfig table schema and seed migration
- Cron implementation (@nestjs/schedule vs custom)
- Email template structure for notification emails
- Retry mechanism implementation (Bull queue vs in-process)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — smsapi.pl requirement, company context (Polish market, ~100 vehicles, ~10 employees)
- `.planning/REQUIREMENTS.md` — NOTIF-01, NOTIF-02, NOTIF-03, ALERT-01, ALERT-02 with acceptance criteria

### Existing code (Phase 1-3)
- `apps/api/src/mail/mail.service.ts` — Existing MailService (nodemailer) to extend with notification emails
- `apps/api/src/mail/mail.module.ts` — MailModule to export for NotificationsModule
- `apps/api/src/rentals/rentals.service.ts` — Event emissions: `rental.created`, `rental.activated`, `rental.returned`, `rental.extended`, `rental.rolledBack`
- `apps/api/src/app.module.ts` — EventEmitterModule.forRoot() already configured, ScheduleModule.forRoot() already configured
- `apps/api/prisma/schema.prisma` — Current schema to extend with Notification + AlertConfig models
- `apps/api/src/vehicles/` — Vehicle model with insurance and inspection date fields for alert scanning

### Prior phase decisions
- `.planning/phases/03-rental-lifecycle/03-CONTEXT.md` — Extension emits `rental.extended` event with customerId, newEndDate
- `.planning/phases/04-contract-and-pdf/04-CONTEXT.md` — Contract PDF email delivery already in Phase 4 via MailService

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MailService` — nodemailer transport, extend with `sendRentalConfirmation()`, `sendAlertEmail()` methods
- `EventEmitter2` — already in AppModule, listen for `rental.activated`, `rental.extended` events
- `ScheduleModule` (@nestjs/schedule) — already registered in AppModule for cron jobs (used by RODO cleanup in Phase 2)
- `AuditInterceptor` — auto-captures notification-related mutations

### Established Patterns
- NestJS module: module + controller + service + DTOs
- Prisma: UUID PKs, relations, Json columns, enum types
- EventEmitter2 for cross-module communication (rental events)
- @Cron decorator from @nestjs/schedule (used in customers module for RODO cleanup)

### Integration Points
- `apps/api/src/app.module.ts` — Register NotificationsModule
- `apps/api/prisma/schema.prisma` — Add Notification, InAppNotification, AlertConfig models
- `apps/api/src/rentals/` — Listen for rental events to trigger notifications
- `apps/api/src/vehicles/` — Query vehicles for insurance/inspection deadline scanning
- `packages/shared/src/types/` — Add notification types
- `packages/shared/src/schemas/` — Add notification Zod schemas

</code_context>

<specifics>
## Specific Ideas

- SMS przypomnienie o zwrocie musi zawierac godzine zwrotu (nie tylko date) + informacje o mozliwosci przedluzenia najmu + nr telefonu kontaktowego
- Numer telefonu firmy z env COMPANY_PHONE — w kazdym SMS-ie
- Alerty o ubezpieczeniu/przegladzie dwuetapowe: 30 dni + 7 dni przed wygasnieciem
- Overdue SMS codziennie do 7 dni (konfigurowalne) — nie jednorazowo
- Konfiguracja alertow w bazie danych — admin moze wlaczyc/wylaczyc i zmienic timing przez API
- Brak opt-out klienta z SMS w v1

</specifics>

<deferred>
## Deferred Ideas

- Customer SMS opt-out — future enhancement, RODO consideration
- smsapi.pl delivery receipts (webhook integration) — v2 for accurate delivery tracking
- Push notifications (mobile) — Phase 6 can add push channel alongside SMS
- Full rule builder UI (condition + channel + timing) — v2 if toggle + timing proves insufficient
- Scheduled notifications at custom times (not just 8:00 AM) — v2

</deferred>

---

*Phase: 08-notifications-and-alerts*
*Context gathered: 2026-03-24*
