---
phase: 08-notifications-and-alerts
plan: 01
subsystem: api
tags: [bullmq, smsapi, notifications, prisma, redis, bull]

requires:
  - phase: 01-auth-and-foundation
    provides: PrismaModule, ConfigService, User model, Roles decorator
  - phase: 04-contracts-and-pdf
    provides: MailService with nodemailer transporter

provides:
  - Notification, InAppNotification, AlertConfig Prisma models
  - Shared notification types and Zod schemas in @rentapp/shared
  - SmsService wrapping smsapi.pl SDK with phone normalization
  - BullMQ queue registration (notifications-sms, notifications-email) with exponential backoff
  - SMS Polish template functions (returnReminder, overdue, extension)
  - AlertConfig CRUD endpoints (admin-only)
  - AlertConfig seed with 6 default rules
  - Wave 0 test stubs (55 it.todo behaviors)

affects: [08-02-PLAN, mobile-notifications, admin-dashboard-alerts]

tech-stack:
  added: [smsapi, bull, @types/bull]
  patterns: [BullMQ queue processor pattern, AlertConfig seed-on-init]

key-files:
  created:
    - apps/api/src/notifications/notifications.module.ts
    - apps/api/src/notifications/sms/sms.service.ts
    - apps/api/src/notifications/sms/sms.processor.ts
    - apps/api/src/notifications/email/email.processor.ts
    - apps/api/src/notifications/constants/sms-templates.ts
    - apps/api/src/notifications/constants/notification-types.ts
    - apps/api/src/alert-config/alert-config.service.ts
    - apps/api/src/alert-config/alert-config.controller.ts
    - apps/api/src/alert-config/alert-config.module.ts
    - packages/shared/src/types/notification.types.ts
    - packages/shared/src/schemas/notification.schemas.ts
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/src/app.module.ts
    - apps/api/src/mail/mail.service.ts
    - packages/shared/src/index.ts

key-decisions:
  - "smsapi.pl endpoint override: SDK defaults to smsapi.io, Polish accounts need api.smsapi.pl/api"
  - "BullModule.forRootAsync with url field (Bull v4), not connection field (BullMQ v5)"
  - "Added sendRaw method to MailService for generic notification email delivery"
  - "bull package installed as peer dependency for @nestjs/bull v11"
  - "AlertConfig channels stored as JSON string in Prisma Json field"

patterns-established:
  - "BullMQ processor pattern: @Processor decorator with @Process and @OnQueueFailed handlers"
  - "AlertConfig seed-on-init: OnModuleInit upsert for idempotent default config seeding"
  - "Phone normalization: strip +/spaces/dashes, prepend 48 for 9-digit Polish numbers"

requirements-completed: [NOTIF-01, NOTIF-02, NOTIF-03, ALERT-01, ALERT-02]

duration: 6min
completed: 2026-03-24
---

# Phase 8 Plan 01: Notification Infrastructure Summary

**BullMQ queues with smsapi.pl SMS service, Notification/AlertConfig Prisma models, Polish SMS templates, and admin AlertConfig CRUD**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-24T19:39:12Z
- **Completed:** 2026-03-24T19:45:22Z
- **Tasks:** 2
- **Files modified:** 28

## Accomplishments
- Notification, InAppNotification, and AlertConfig models added to Prisma schema with proper indexes
- SmsService wrapping smsapi.pl SDK with phone normalization, test mode, and configurable sender name
- BullMQ SMS and email queue processors with 3-retry exponential backoff (60s base delay)
- AlertConfig CRUD with admin-only access and 6 default configs seeded on module init
- 55 it.todo() test stubs across 9 spec files (7 unit + 2 e2e) for Wave 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema, shared types, BullMQ registration, SmsService, AlertConfig module** - `cb61380` (feat)
2. **Task 2: Wave 0 test stubs for all notification and alert spec files** - `a030a3d` (test)

## Files Created/Modified
- `apps/api/prisma/schema.prisma` - Added Notification, InAppNotification, AlertConfig models and enums
- `packages/shared/src/types/notification.types.ts` - NotificationChannel, NotificationStatus, NotificationType enums and DTOs
- `packages/shared/src/schemas/notification.schemas.ts` - UpdateAlertConfig and NotificationQuery Zod schemas
- `apps/api/src/notifications/sms/sms.service.ts` - smsapi.pl SDK wrapper with phone normalization
- `apps/api/src/notifications/sms/sms.processor.ts` - BullMQ processor for SMS queue
- `apps/api/src/notifications/email/email.processor.ts` - BullMQ processor for email queue
- `apps/api/src/notifications/constants/sms-templates.ts` - Polish SMS template functions
- `apps/api/src/notifications/constants/notification-types.ts` - Queue names and default alert configs
- `apps/api/src/notifications/notifications.module.ts` - Module with BullMQ queue registration
- `apps/api/src/alert-config/alert-config.service.ts` - CRUD + seed defaults on init
- `apps/api/src/alert-config/alert-config.controller.ts` - Admin-only GET/PATCH endpoints
- `apps/api/src/alert-config/alert-config.module.ts` - AlertConfig feature module
- `apps/api/src/app.module.ts` - BullModule.forRootAsync + NotificationsModule + AlertConfigModule
- `apps/api/src/mail/mail.service.ts` - Added sendRaw method for notification emails

## Decisions Made
- smsapi.pl endpoint override needed: SDK defaults to smsapi.io, Polish accounts require `https://api.smsapi.pl/api`
- Used `BullModule.forRootAsync` with `url` field (Bull v4 interface), not `connection` field (BullMQ v5)
- Added `sendRaw(to, subject, html)` to MailService for generic notification email delivery (Rule 3 - blocking dependency)
- Installed `bull` as peer dependency for `@nestjs/bull` v11 (which wraps Bull, not BullMQ despite project having bullmq)
- AlertConfig `channels` stored as JSON string in Prisma `Json` field

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added sendRaw method to MailService**
- **Found during:** Task 1 (EmailProcessor implementation)
- **Issue:** EmailProcessor needs generic email sending, MailService only had specific methods (sendContractEmail, etc.)
- **Fix:** Added `sendRaw(to, subject, html)` method to MailService using existing transporter
- **Files modified:** apps/api/src/mail/mail.service.ts
- **Verification:** Build passes, EmailProcessor compiles
- **Committed in:** cb61380 (Task 1 commit)

**2. [Rule 3 - Blocking] Installed bull peer dependency**
- **Found during:** Task 1 (build verification)
- **Issue:** @nestjs/bull v11 requires `bull` as peer dependency, only `bullmq` was installed
- **Fix:** `pnpm add bull --filter @rentapp/api`
- **Files modified:** apps/api/package.json, pnpm-lock.yaml
- **Verification:** Build passes, Bull types resolve
- **Committed in:** cb61380 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed BullModule.forRootAsync config shape**
- **Found during:** Task 1 (build verification)
- **Issue:** Plan specified `connection: { url }` (BullMQ v5 format), but @nestjs/bull uses Bull v4 `url` field
- **Fix:** Changed to `{ url: config.getOrThrow('REDIS_URL') }` at root level
- **Files modified:** apps/api/src/app.module.ts
- **Verification:** Build passes
- **Committed in:** cb61380 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for correct compilation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations.

## User Setup Required
None - smsapi.pl requires SMSAPI_TOKEN, SMSAPI_TEST_MODE, and SMSAPI_SENDER_NAME env vars, but these are optional for development (test mode default).

## Next Phase Readiness
- Notification infrastructure fully scaffolded, ready for Plan 02 to wire up event listeners, cron scanner, and notification orchestration
- All test stubs in place for Plan 02 to implement
- AlertConfig seeded with 6 default rules for scanner to consume

---
*Phase: 08-notifications-and-alerts*
*Completed: 2026-03-24*
