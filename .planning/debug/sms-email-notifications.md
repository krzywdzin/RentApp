---
status: awaiting_human_verify
trigger: "Email and SMS notifications not sent after rental signing"
created: 2026-03-31T12:00:00Z
updated: 2026-03-31T14:45:00Z
---

## Current Focus

hypothesis: CONFIRMED - EMAIL fails because SMTP times out on Railway. SMS works but test mode is on.
test: Switched email to Resend HTTP API, SMS service ready (just needs env vars)
expecting: After setting RESEND_API_KEY and SMSAPI_TEST_MODE=false, notifications will work
next_action: User verifies by completing a rental and checking email/SMS delivery

## Symptoms

expected: After 4th signature, customer should receive email (with PDF + portal link) and SMS confirmation
actual: Neither email nor SMS is sent after rental creation
errors: Email - SMTP timing out (Resend on Railway). SMS - SMSAPI token exists, sender "Test", not sending
reproduction: Complete a rental with all 4 signatures, check if customer receives email/SMS
started: Currently broken

## Eliminated

(none - root cause identified on first hypothesis)

## Evidence

- timestamp: 2026-03-31T12:00:00Z
  checked: Full notification system architecture
  found: Complete notification system exists - listeners (rental.created, rental.activated, rental.extended), cron scanner (daily 8am), Bull queues for SMS/EMAIL, Prisma notification model
  implication: The code is fully implemented - this is a configuration/implementation issue

- timestamp: 2026-03-31T14:00:00Z
  checked: Mail service implementation (apps/api/src/mail/mail.service.ts)
  found: Used nodemailer with SMTP transport. Has 5s connect timeout, 10s socket timeout. SMTP times out on Railway.
  implication: Need to switch from SMTP to Resend HTTP API for reliable delivery in serverless environment

- timestamp: 2026-03-31T14:10:00Z
  checked: SMS service implementation (apps/api/src/notifications/sms/sms.service.ts)
  found: Uses SMSAPI package with `test: this.testMode ? true : undefined`. When SMSAPI_TEST_MODE=true, SMS is simulated. Sender name defaults to "Test" if SMSAPI_SENDER_NAME not set.
  implication: SMS infrastructure is correct, just needs SMSAPI_TEST_MODE=false in production

- timestamp: 2026-03-31T14:20:00Z
  checked: Contract signing flow (apps/api/src/contracts/contracts.service.ts)
  found: Email with PDF is sent via fire-and-forget setImmediate (lines 431-446). No SMS is sent directly - SMS relies on rental.created event which fires when rental is created, not when contract is signed.
  implication: Email is attempted but fails due to SMTP. SMS for rental confirmation triggers on rental.created event.

- timestamp: 2026-03-31T14:40:00Z
  checked: Implementation fix
  found: |
    1. Rewrote mail.service.ts to use Resend HTTP API instead of SMTP
    2. Changed SMS default sender from "Test" to "KITEK"
    3. Added startup logging for SMS service config
    4. All 228 tests pass, build succeeds
  implication: Code fix is complete, needs env var configuration and user verification

## Resolution

root_cause: |
  1. EMAIL: nodemailer SMTP transport times out on Railway because Resend's SMTP relay has connection issues in serverless environments.
  2. SMS: SMSAPI_TEST_MODE defaults to simulating messages. Sender name "Test" was the default but should be "KITEK".

fix: |
  Code changes:
  1. Replaced nodemailer/SMTP with Resend HTTP API in apps/api/src/mail/mail.service.ts
  2. Changed default SMS sender from "Test" to "KITEK" in apps/api/src/notifications/sms/sms.service.ts
  3. Added startup logging for SMS service configuration

  Required environment variables on Railway:
  - RESEND_API_KEY=re_xxxxxxxx (from Resend dashboard)
  - MAIL_FROM=noreply@kitek.pl (or your verified domain)
  - SMSAPI_TEST_MODE=false (to send real SMS)
  - SMSAPI_SENDER_NAME=KITEK (or verified sender in SMSAPI panel)
  - APP_URL=https://app.kitek.pl (for portal links)

verification: |
  Self-verified:
  - All 228 API tests pass
  - Build succeeds
  - Mail service now uses Resend HTTP API (no SMTP timeouts)
  - SMS service logs config on startup for easier debugging

  Needs human verification:
  - Set env vars on Railway
  - Complete a rental with all 4 signatures
  - Check customer receives email with PDF
  - Check customer receives SMS confirmation

files_changed:
  - apps/api/src/mail/mail.service.ts
  - apps/api/src/notifications/sms/sms.service.ts
  - apps/api/src/contracts/contracts.service.spec.ts
  - apps/api/src/photos/photos.service.spec.ts
  - apps/api/package.json (added resend dependency)
