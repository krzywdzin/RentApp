---
status: investigating
trigger: "Email and SMS notifications have never worked"
created: 2026-03-31T12:00:00Z
updated: 2026-03-31T12:00:00Z
---

## Current Focus

hypothesis: Production environment has dev/localhost mail config and SMS in test mode - notifications infrastructure is fully built but never configured for production
test: Compare production env vars against what services need
expecting: MAIL_HOST=localhost, SMSAPI_TEST_MODE=true in production
next_action: Document all findings and present configuration checklist

## Symptoms

expected: 1) Email with client panel sent after rental creation/approval 2) SMS to client on approval 3) Reminder SMS/emails when rent is ending
actual: None of these features work - never sent a real email or SMS
errors: Not checked yet
reproduction: Approve a rental or trigger any notification
started: Never worked - features built but never fully configured

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-03-31T12:00:00Z
  checked: Full notification system architecture
  found: Complete notification system exists - listeners (rental.created, rental.activated, rental.extended), cron scanner (daily 8am), Bull queues for SMS/EMAIL, Prisma notification model, alert config system
  implication: The code is fully implemented - this is a configuration/deployment issue

- timestamp: 2026-03-31T12:01:00Z
  checked: apps/api/.env.remote-backup (production env snapshot)
  found: |
    MAIL_HOST=localhost
    MAIL_PORT=1025
    MAIL_FROM=noreply@rentapp.local
    SMSAPI_TOKEN=CA4b29WbmAn7QtgBZYyKifvKLPzL0iGje0vCtVNg (present but...)
    SMSAPI_TEST_MODE=true
    No MAIL_USER or MAIL_PASS set
    APP_URL=http://localhost:3000
    No COMPANY_PHONE set (defaults to +48 500 000 000)
    No PORTAL_JWT_SECRET set
  implication: Production Railway deployment has localhost mail settings (Mailpit dev config) and SMS is explicitly in test mode. Emails would fail to connect; SMS would be test-only.

- timestamp: 2026-03-31T12:02:00Z
  checked: Mail service (apps/api/src/mail/mail.service.ts)
  found: Uses nodemailer with MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM. Has 5s connect timeout, 10s socket timeout. Methods: sendSetupPasswordEmail, sendResetPasswordEmail, sendContractEmail, sendRaw, sendAnnexEmail.
  implication: Mail service is correct but configured for Mailpit dev server in production

- timestamp: 2026-03-31T12:03:00Z
  checked: SMS service (apps/api/src/notifications/sms/sms.service.ts)
  found: Uses SMSAPI (smsapi.pl, NOT Twilio). Token exists in production env. SMSAPI_TEST_MODE=true means SMSes are simulated, not actually sent. Sender name configured as "RentApp".
  implication: SMS provider is smsapi.pl (Polish SMS gateway), NOT Twilio. Has a real token but test mode prevents actual delivery.

- timestamp: 2026-03-31T12:04:00Z
  checked: Event emitters in rentals.service.ts
  found: rental.created emitted at line 139, rental.activated at line 227, rental.extended at line 375
  implication: Events ARE being emitted - listeners should trigger

- timestamp: 2026-03-31T12:05:00Z
  checked: Bull queues and Redis
  found: BullModule.forRootAsync uses REDIS_URL. Production has Upstash Redis URL. Queues registered for SMS and EMAIL with 3 attempts + exponential backoff.
  implication: Queue infrastructure should work if Redis is connected

- timestamp: 2026-03-31T12:06:00Z
  checked: Cron alert scanner
  found: Runs daily at 8:00 AM. Scans for return reminders (1 day before), overdue rentals, insurance expiry (30/7 days), inspection expiry (30/7 days). Uses AlertConfig to check if each type is enabled.
  implication: Cron-based reminders are implemented and should run if ScheduleModule is active

## Resolution

root_cause: |
  The notification system is FULLY IMPLEMENTED in code but has TWO critical production configuration gaps:

  1. **EMAIL: Production uses localhost:1025 (Mailpit dev server)**
     - MAIL_HOST=localhost, MAIL_PORT=1025 in production Railway env
     - No MAIL_USER or MAIL_PASS configured
     - MAIL_FROM=noreply@rentapp.local (not a real domain)
     - Emails silently fail because there's no SMTP server at localhost:1025 on Railway

  2. **SMS: SMSAPI_TEST_MODE=true in production**
     - Has a real SMSAPI token (CA4b29Wb...)
     - But test mode means messages are simulated, never actually delivered
     - Sender name "RentApp" may need verification with SMSAPI

  3. **APP_URL=http://localhost:3000 in production**
     - Client portal links in emails would point to localhost
     - Should be the real production URL

fix: |
  Set the following environment variables on Railway:

  ### EMAIL (choose an SMTP provider - e.g., Gmail, SendGrid, Mailgun, or hosting provider's SMTP):
  MAIL_HOST=<smtp-server>          # e.g., smtp.gmail.com, smtp.sendgrid.net
  MAIL_PORT=587                    # TLS port (or 465 for SSL)
  MAIL_USER=<smtp-username>
  MAIL_PASS=<smtp-password>
  MAIL_FROM=noreply@kitek.pl       # Use real domain

  ### SMS:
  SMSAPI_TEST_MODE=false           # Enable real SMS delivery
  SMSAPI_SENDER_NAME=KITEK         # Must be registered/verified in SMSAPI panel

  ### General:
  APP_URL=https://app.kitek.pl     # Real production URL
  COMPANY_PHONE=535 766 666        # For SMS templates

verification: Awaiting user to configure env vars and test
files_changed: []
