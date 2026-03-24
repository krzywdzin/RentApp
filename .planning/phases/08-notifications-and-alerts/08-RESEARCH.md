# Phase 8: Notifications and Alerts - Research

**Researched:** 2026-03-24
**Domain:** SMS integration (smsapi.pl), email notifications, cron-based alert detection, BullMQ retry queues
**Confidence:** HIGH

## Summary

Phase 8 adds automated SMS notifications via smsapi.pl, extends the existing MailService with notification-specific emails, implements a daily cron job for alert detection (return reminders, overdue, insurance/inspection expiry), and builds an in-app notification model with configurable alert rules. The project already has `@nestjs/schedule`, `EventEmitterModule`, `@nestjs/bull`, and `bullmq` installed, so the infrastructure is ready.

The smsapi.pl integration uses the official `smsapi` npm package (v2.1.3, TypeScript-native) with OAuth token authentication against the Polish endpoint (`api.smsapi.pl`). Notification delivery uses BullMQ queues (already in package.json) for reliable retry with exponential backoff. The cron job at 8:00 AM scans for upcoming returns, overdue rentals, and vehicle deadline alerts, then enqueues notifications for processing.

**Primary recommendation:** Use BullMQ queue for all notification dispatch (SMS + email) with 3 retries and exponential backoff. Keep the cron scanner lightweight (query + enqueue), and let queue workers handle actual delivery and logging.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **SMS Provider:** smsapi.pl (locked business requirement). Sender ID registration needed before go-live.
- **SMS Tone:** Short & formal, max ~160 chars, Polish language. Company phone (COMPANY_PHONE env var) in every SMS.
- **SMS Triggers:** Return reminder (1 day before), overdue alert (daily, max 7 days configurable), extension confirmation (immediate on rental.extended). Rental confirmation is email-only, NOT SMS.
- **Return reminder content:** Must include return hour (not just date), extension possibility info, company phone.
- **Alert Detection:** Daily cron at 8:00 AM. Insurance/inspection: two-stage (30 days + 7 days).
- **Alert Recipients:** Customer SMS for return/overdue/extension. Admin-only for insurance/inspection (email + in-app).
- **Notification Log:** Every notification logged with type, channel, recipient, status (PENDING/SENT/FAILED), timestamp, related entity.
- **Retry Policy:** 3 retries with exponential backoff (1min, 5min, 15min). After 3 failures -> FAILED.
- **No delivery receipts** from smsapi.pl in v1.
- **In-app notifications:** Bell icon unread count, list endpoint, mark as read/dismiss. API + model here, UI in Phase 5/6.
- **Configurable Rules:** AlertConfig table with enable/disable + timing per alert type. No full rule builder.
- **Default rules seeded on first run** (see CONTEXT.md for full list).
- **Email notifications:** Extend existing MailService. Rental confirmation on rental.activated. Insurance/inspection alerts to admin.
- **Contract PDF email** already handled by Phase 4 -- not duplicated here.
- **No customer SMS opt-out** in v1.

### Claude's Discretion
- smsapi.pl SDK vs REST API integration approach
- Notification log table schema details
- In-app notification data model (Prisma)
- AlertConfig table schema and seed migration
- Cron implementation (@nestjs/schedule vs custom)
- Email template structure for notification emails
- Retry mechanism implementation (Bull queue vs in-process)

### Deferred Ideas (OUT OF SCOPE)
- Customer SMS opt-out -- future enhancement, RODO consideration
- smsapi.pl delivery receipts (webhook integration) -- v2 for accurate delivery tracking
- Push notifications (mobile) -- Phase 6 can add push channel alongside SMS
- Full rule builder UI (condition + channel + timing) -- v2 if toggle + timing proves insufficient
- Scheduled notifications at custom times (not just 8:00 AM) -- v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTIF-01 | System sends SMS via smsapi.pl: rental confirmation(?), return reminder (1 day before), overdue alert | smsapi npm SDK v2.1.3 with OAuth, BullMQ queue for reliable delivery, cron scanner for time-based triggers. Note: CONTEXT.md clarifies rental confirmation is email-only, not SMS. |
| NOTIF-02 | System sends email with PDF contract attachment and rental confirmations | Extend existing MailService with sendRentalConfirmation(). Contract PDF email already in Phase 4. |
| NOTIF-03 | Extension sends SMS with new return date | Listen to existing rental.extended event, enqueue SMS job immediately (not cron). |
| ALERT-01 | Auto-generate alerts: approaching return, overdue, expiring insurance, upcoming inspection | Daily cron job at 8:00 AM queries rentals + vehicles, creates Notification records, enqueues delivery jobs. Two-stage for insurance/inspection (30d + 7d). |
| ALERT-02 | Multi-channel alerts (email + SMS + in-app) with configurable rules | AlertConfig table with per-type enable/disable, timing, channels. InAppNotification model for bell icon. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| smsapi | 2.1.3 | SMS sending via smsapi.pl | Official TypeScript SDK, actively maintained (Nov 2025), Apache-2.0 |
| @nestjs/bull | 11.0.4 | BullMQ integration for NestJS | Already in package.json, provides @Process/@InjectQueue decorators |
| bullmq | 5.71.0 | Redis-backed job queue with retry | Already in package.json, exponential backoff built-in |
| @nestjs/schedule | 6.1.1 | Cron job scheduling | Already registered in AppModule, @Cron decorator pattern established |
| @nestjs/event-emitter | 3.0.1 | Cross-module event handling | Already in AppModule, @OnEvent pattern established in contracts module |
| nodemailer | 6.x | Email sending | Already used by MailService, extend with new methods |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ioredis | 5.x | Redis client for BullMQ | Already in package.json, BullMQ dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| smsapi SDK | Direct REST API (fetch) | SDK handles auth, retries, types; REST is lighter but more boilerplate |
| BullMQ queue | In-process retry (setTimeout) | BullMQ survives process restart, has built-in backoff, dead letter queue |
| @nestjs/schedule cron | BullMQ repeatable jobs | @nestjs/schedule is simpler, already established in codebase; BullMQ repeatable adds complexity for no gain on single-instance |

**Recommendation on discretion items:**
- **Use smsapi SDK** (not raw REST): TypeScript types, handles auth header, simpler error handling.
- **Use BullMQ queue** (not in-process retry): Survives process restarts, built-in exponential backoff, notification log updates on completion/failure via job events. Already installed.
- **Use @nestjs/schedule cron** (already established pattern in RetentionService).

**Installation:**
```bash
pnpm add smsapi --filter @rentapp/api
```

Note: `@nestjs/bull`, `bullmq`, `ioredis`, `@nestjs/schedule`, `@nestjs/event-emitter`, and `nodemailer` are already in `apps/api/package.json`.

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
  notifications/
    notifications.module.ts          # Imports MailModule, registers Bull queue
    notifications.controller.ts      # In-app notification CRUD endpoints
    notifications.service.ts         # Orchestration: create notification records, enqueue jobs
    sms/
      sms.service.ts                 # smsapi.pl SDK wrapper (send, test mode)
      sms.processor.ts              # BullMQ @Process handler for SMS queue
    email/
      email-notification.service.ts  # Extends MailService calls for notification emails
      email.processor.ts            # BullMQ @Process handler for email queue
    listeners/
      rental-activated.listener.ts   # @OnEvent('rental.activated') -> email confirmation
      rental-extended.listener.ts    # @OnEvent('rental.extended') -> SMS extension confirmation
    cron/
      alert-scanner.service.ts       # @Cron daily 8AM: scan rentals + vehicles, enqueue
    dto/
      notification-query.dto.ts      # Query params for in-app notification list
      update-alert-config.dto.ts     # DTO for admin alert config updates
    constants/
      sms-templates.ts               # Polish SMS message templates
      notification-types.ts          # Enum/const for notification types
  alert-config/
    alert-config.module.ts           # Admin CRUD for alert configuration
    alert-config.controller.ts       # GET/PATCH alert config endpoints
    alert-config.service.ts          # Read/update AlertConfig, seed defaults
```

### Pattern 1: Event-Driven Notification Trigger
**What:** Rental lifecycle events trigger immediate notifications via EventEmitter2
**When to use:** Extension confirmation (immediate SMS), rental activation (email)
**Example:**
```typescript
// Source: established pattern in contracts/listeners/rental-extended.listener.ts
@Injectable()
export class RentalExtendedNotificationListener {
  private readonly logger = new Logger(RentalExtendedNotificationListener.name);

  constructor(private notificationsService: NotificationsService) {}

  @OnEvent('rental.extended')
  async handleRentalExtended(payload: {
    rentalId: string;
    customerId: string;
    newEndDate: string;
    extendedBy: string;
  }) {
    try {
      await this.notificationsService.sendExtensionSms(
        payload.customerId,
        payload.newEndDate,
        payload.rentalId,
      );
    } catch (error: any) {
      this.logger.error(`Failed to send extension SMS: ${error.message}`);
      // Non-blocking: notification failure should not break rental flow
    }
  }
}
```

### Pattern 2: Cron Scanner + Queue Enqueue
**What:** Daily cron scans database for conditions, creates Notification records, enqueues delivery jobs
**When to use:** Return reminders, overdue alerts, insurance/inspection expiry
**Example:**
```typescript
// Source: established pattern in customers/retention.service.ts
@Injectable()
export class AlertScannerService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron('0 8 * * *') // Daily at 8:00 AM
  async scanAlerts() {
    await this.scanReturnReminders();
    await this.scanOverdueRentals();
    await this.scanInsuranceExpiry();
    await this.scanInspectionExpiry();
  }

  private async scanReturnReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Set to start of day for date comparison
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    const rentals = await this.prisma.rental.findMany({
      where: {
        endDate: { gte: startOfTomorrow, lte: endOfTomorrow },
        status: { in: ['ACTIVE', 'EXTENDED'] },
      },
      include: { customer: true, vehicle: true },
    });

    for (const rental of rentals) {
      await this.notificationsService.enqueueReturnReminder(rental);
    }
  }
}
```

### Pattern 3: BullMQ Queue Worker with Retry
**What:** Queue processors handle actual SMS/email delivery with automatic retry
**When to use:** All notification delivery
**Example:**
```typescript
import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bullmq';

@Processor('notifications-sms')
export class SmsProcessor {
  constructor(
    private smsService: SmsService,
    private prisma: PrismaService,
  ) {}

  @Process()
  async handleSms(job: Job<{ notificationId: string; phone: string; message: string }>) {
    const { notificationId, phone, message } = job.data;

    // Update status to SENDING
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENDING' },
    });

    // Send via smsapi.pl
    await this.smsService.send(phone, message);

    // Update status to SENT
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENT', sentAt: new Date() },
    });
  }

  @OnQueueFailed()
  async handleFailed(job: Job, error: Error) {
    if (job.attemptsMade >= 3) {
      await this.prisma.notification.update({
        where: { id: job.data.notificationId },
        data: { status: 'FAILED', errorMessage: error.message },
      });
    }
  }
}
```

### Pattern 4: smsapi.pl SDK Usage
**What:** Thin wrapper around official smsapi SDK
**When to use:** All SMS sending
**Example:**
```typescript
import { SMSAPI } from 'smsapi';

@Injectable()
export class SmsService {
  private readonly smsapi: SMSAPI;
  private readonly testMode: boolean;
  private readonly senderName: string;

  constructor(private config: ConfigService) {
    this.smsapi = new SMSAPI(this.config.getOrThrow('SMSAPI_TOKEN'));
    this.testMode = this.config.get('SMSAPI_TEST_MODE', 'false') === 'true';
    this.senderName = this.config.get('SMSAPI_SENDER_NAME', 'Test');
  }

  async send(to: string, message: string): Promise<string> {
    // smsapi.pl uses Polish endpoint
    const result = await this.smsapi.sms.sendSms(to, message, {
      from: this.senderName,
      test: this.testMode ? 1 : undefined,
    });
    return result.list?.[0]?.id ?? 'unknown';
  }
}
```

### Anti-Patterns to Avoid
- **Sending notifications synchronously in request handlers:** Always enqueue via BullMQ. Never make the HTTP response wait for SMS delivery.
- **Catching and silencing queue errors:** Log failures and update notification status. BullMQ handles retry; do not add manual setTimeout retry logic.
- **Querying all rentals in cron scanner:** Always filter by date range and status. The fleet is ~100 vehicles but queries should still be efficient.
- **Hardcoding SMS message content:** Use template functions with parameter interpolation. Polish content must be configurable.
- **Duplicating notification sends:** The cron scanner must check if a notification was already sent for the same entity + type + date to prevent duplicate messages on re-runs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SMS delivery | HTTP client + auth + retry | smsapi npm SDK | Handles OAuth, types, error parsing |
| Job queue + retry | setTimeout chains or in-process loops | BullMQ via @nestjs/bull | Survives restarts, built-in backoff, visibility |
| Cron scheduling | setInterval or node-cron | @nestjs/schedule @Cron decorator | Already integrated, handles lifecycle, established pattern |
| Exponential backoff | Manual delay calculation | BullMQ `backoff: { type: 'exponential', delay: 60000 }` | Built-in, configurable, battle-tested |

**Key insight:** The project already has BullMQ and @nestjs/bull installed but not yet used. This phase is the natural place to activate queue infrastructure for reliable notification delivery.

## Common Pitfalls

### Pitfall 1: Duplicate Notifications on Cron Re-run
**What goes wrong:** If the 8AM cron runs, partially fails, and runs again (or the process restarts), the same return reminders get sent twice.
**Why it happens:** Cron scanner creates notifications without checking if one already exists for that entity + type + date.
**How to avoid:** Before enqueuing, check `Notification` table for existing record with same `relatedEntityId + type + scheduledDate`. Use a unique constraint or a findFirst check.
**Warning signs:** Customers complaining about duplicate SMS messages.

### Pitfall 2: smsapi.pl Polish Endpoint vs Global
**What goes wrong:** SMS fails with auth error or goes to wrong account.
**Why it happens:** smsapi.pl (Polish) uses `api.smsapi.pl` endpoint, not `api.smsapi.com`. The npm SDK defaults may point to .com.
**How to avoid:** Check SDK configuration for base URL override. The smsapi SDK may need `server` option or equivalent to point to `api.smsapi.pl`. Test with `test=1` parameter first.
**Warning signs:** 401/403 errors despite correct token.

### Pitfall 3: Phone Number Format
**What goes wrong:** SMS fails because phone number format is wrong.
**Why it happens:** smsapi.pl expects numbers with country prefix (48XXXXXXXXX for Poland) without the + sign. Customer phone in DB may be stored as "+48 605 123 456" or "605123456".
**How to avoid:** Normalize phone numbers before sending: strip +, spaces, dashes. Prepend 48 if 9-digit number without prefix.
**Warning signs:** ERROR:13 (invalid number) from smsapi.

### Pitfall 4: BullMQ Redis Connection Not Configured
**What goes wrong:** Queue fails to initialize because Redis connection is not configured for Bull.
**Why it happens:** BullModule.forRoot() needs Redis host/port configuration. The project uses ioredis for auth tokens but Bull needs its own config.
**How to avoid:** Register `BullModule.forRoot({ redis: { host, port } })` in AppModule or NotificationsModule with ConfigService values.
**Warning signs:** Connection refused errors on module init.

### Pitfall 5: Overdue SMS Sent Beyond Max Days
**What goes wrong:** Customer receives overdue SMS daily forever.
**Why it happens:** No cap on overdue repeat count.
**How to avoid:** AlertConfig.maxRepeat (default: 7). Count existing overdue notifications for this rental before sending. Stop when count >= maxRepeat.
**Warning signs:** Angry customer calls after 2 weeks of daily SMS.

### Pitfall 6: Cron Runs Before Midnight Date Boundary
**What goes wrong:** "Return tomorrow" reminder fires for wrong rentals due to timezone.
**Why it happens:** Date comparison uses UTC but business operates in Europe/Warsaw (UTC+1/+2).
**How to avoid:** All date comparisons in the cron scanner must account for Europe/Warsaw timezone. Use explicit timezone-aware date boundaries.
**Warning signs:** Reminders sent a day early or late, especially around DST transitions.

## Code Examples

### Prisma Schema: Notification Model
```prisma
// Recommended schema for notification log
enum NotificationChannel {
  SMS
  EMAIL
  IN_APP
}

enum NotificationStatus {
  PENDING
  SENDING
  SENT
  FAILED
}

model Notification {
  id                String              @id @default(uuid())
  type              String              // e.g. RETURN_REMINDER, OVERDUE, EXTENSION, INSURANCE_EXPIRY, INSPECTION_EXPIRY, RENTAL_CONFIRMATION
  channel           NotificationChannel
  recipientId       String?             // userId or customerId
  recipientPhone    String?             // for SMS
  recipientEmail    String?             // for email
  status            NotificationStatus  @default(PENDING)
  message           String?             // SMS body or email subject
  errorMessage      String?
  relatedEntityType String?             // 'Rental' or 'Vehicle'
  relatedEntityId   String?
  scheduledFor      DateTime?           // when it was supposed to send
  sentAt            DateTime?
  attempts          Int                 @default(0)

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([relatedEntityType, relatedEntityId])
  @@index([type, relatedEntityId, scheduledFor])  // dedup index
  @@index([status])
  @@index([recipientId])
  @@map("notifications")
}
```

### Prisma Schema: InAppNotification Model
```prisma
model InAppNotification {
  id          String    @id @default(uuid())
  userId      String    // admin user who sees it
  title       String
  body        String
  type        String    // same as Notification.type
  linkUrl     String?   // e.g. /vehicles/{id} or /rentals/{id}
  isRead      Boolean   @default(false)
  readAt      DateTime?

  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])

  @@index([userId, isRead])
  @@index([createdAt])
  @@map("in_app_notifications")
}
```

### Prisma Schema: AlertConfig Model
```prisma
model AlertConfig {
  id            String   @id @default(uuid())
  alertType     String   @unique  // RETURN_REMINDER, OVERDUE, EXTENSION, INSURANCE_EXPIRY, INSPECTION_EXPIRY
  enabled       Boolean  @default(true)
  leadTimeDays  Int      @default(1)     // days before event to send
  channels      Json     @default("[\"SMS\"]")  // JSON array of channels
  maxRepeat     Int?     // for overdue: max daily sends

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("alert_configs")
}
```

### BullMQ Module Registration
```typescript
// In notifications.module.ts or app.module.ts
import { BullModule } from '@nestjs/bull';

BullModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    redis: {
      host: config.getOrThrow('REDIS_HOST'),
      port: config.get<number>('REDIS_PORT', 6379),
    },
  }),
  inject: [ConfigService],
}),
BullModule.registerQueue(
  {
    name: 'notifications-sms',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 60000 }, // 1min, 2min, 4min (close to 1/5/15)
    },
  },
  {
    name: 'notifications-email',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 60000 },
    },
  },
),
```

### SMS Template Functions (Polish)
```typescript
// constants/sms-templates.ts
export function returnReminderSms(params: {
  returnDate: string; // formatted date
  returnTime: string; // formatted time e.g. "14:00"
  companyPhone: string;
}): string {
  return `Przypomnienie: zwrot pojazdu ${params.returnDate} do godz. ${params.returnTime}. W celu przedluzenia prosimy o kontakt pod nr ${params.companyPhone}`;
}

export function overdueSms(params: {
  returnDate: string;
  returnTime: string;
  companyPhone: string;
}): string {
  return `PILNE: Termin zwrotu pojazdu minal (${params.returnDate}, ${params.returnTime}). Prosimy o niezwloczny zwrot lub kontakt: ${params.companyPhone}`;
}

export function extensionSms(params: {
  newReturnDate: string;
  newReturnTime: string;
  companyPhone: string;
}): string {
  return `Wynajem zostal przedluzony. Nowy termin zwrotu: ${params.newReturnDate} do godz. ${params.newReturnTime}. Kontakt: ${params.companyPhone}`;
}
```

### In-App Notification API Endpoints
```typescript
// notifications.controller.ts
@Controller('notifications')
export class NotificationsController {
  @Get('in-app')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getInAppNotifications(
    @CurrentUser() user: { id: string },
    @Query() query: NotificationQueryDto,
  ) { /* paginated list, filter by isRead */ }

  @Get('in-app/unread-count')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getUnreadCount(@CurrentUser() user: { id: string }) { /* { count: number } */ }

  @Patch('in-app/:id/read')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async markAsRead(@Param('id') id: string) { /* set isRead=true, readAt=now */ }

  @Patch('in-app/read-all')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async markAllAsRead(@CurrentUser() user: { id: string }) { /* bulk update */ }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| In-process retry with setTimeout | BullMQ queue with built-in backoff | BullMQ 4.x+ (2023) | Survives restarts, observable, scalable |
| Manual HTTP to smsapi.pl | Official smsapi npm SDK v2.x | v2.0 (2024) | TypeScript types, maintained, handles auth |
| node-cron package | @nestjs/schedule with @Cron decorator | NestJS 8+ | Native integration, lifecycle-aware |

**Deprecated/outdated:**
- smsapi npm v1.x: Old callback-based API. v2.x is promise-based with TypeScript.
- `smsapi-pl` npm package: Community fork, less maintained. Use official `smsapi` package instead.
- `@nestjs/bull` with old `bull` package: The project correctly uses `bullmq` (v5) which is the successor.

## Open Questions

1. **smsapi SDK base URL for .pl endpoint**
   - What we know: smsapi.pl uses `api.smsapi.pl`, the SDK may default to `api.smsapi.com`
   - What's unclear: Whether the SDK constructor accepts a server/baseUrl option for Polish endpoint
   - Recommendation: Check SDK source or test with `test=1` mode during implementation. May need to pass `{ server: 'https://api.smsapi.pl' }` to constructor.

2. **BullModule.forRoot() placement**
   - What we know: The project has no existing BullModule registration. Redis config exists for auth tokens.
   - What's unclear: Whether REDIS_HOST/REDIS_PORT env vars are already set or need new ones (BULL_REDIS_HOST?)
   - Recommendation: Reuse existing Redis config (same instance). Register BullModule.forRoot() in AppModule for global availability.

3. **User relation on InAppNotification**
   - What we know: User model needs an `inAppNotifications` relation added
   - What's unclear: Whether Phase 5 (admin panel) already added any notification-related fields
   - Recommendation: Add the relation in this phase's migration. Phase 5/6 builds UI on top.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x |
| Config file | `apps/api/package.json` (unit), `apps/api/test/jest-e2e.json` (e2e) |
| Quick run command | `pnpm --filter @rentapp/api test -- --testPathPattern=notifications` |
| Full suite command | `pnpm --filter @rentapp/api test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTIF-01 | SMS sent for return reminder + overdue via smsapi.pl | unit | `pnpm --filter @rentapp/api test -- --testPathPattern=sms.service.spec -x` | Wave 0 |
| NOTIF-01 | Cron scanner finds rentals due tomorrow and overdue | unit | `pnpm --filter @rentapp/api test -- --testPathPattern=alert-scanner.service.spec -x` | Wave 0 |
| NOTIF-02 | Email sent on rental.activated with confirmation | unit | `pnpm --filter @rentapp/api test -- --testPathPattern=email-notification.service.spec -x` | Wave 0 |
| NOTIF-03 | Extension event triggers SMS with new date | unit | `pnpm --filter @rentapp/api test -- --testPathPattern=rental-extended.listener.spec -x` | Wave 0 |
| ALERT-01 | Auto-generate alerts for insurance/inspection expiry | unit | `pnpm --filter @rentapp/api test -- --testPathPattern=alert-scanner.service.spec -x` | Wave 0 |
| ALERT-02 | AlertConfig enables/disables channels and timing | unit | `pnpm --filter @rentapp/api test -- --testPathPattern=alert-config.service.spec -x` | Wave 0 |
| ALERT-02 | In-app notification CRUD (list, unread count, mark read) | unit | `pnpm --filter @rentapp/api test -- --testPathPattern=notifications.service.spec -x` | Wave 0 |
| ALL | E2E notification endpoints | e2e | `pnpm --filter @rentapp/api test:e2e -- --testPathPattern=notifications -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @rentapp/api test -- --testPathPattern=notifications -x`
- **Per wave merge:** `pnpm --filter @rentapp/api test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/notifications/sms/sms.service.spec.ts` -- covers NOTIF-01, NOTIF-03 (SMS send, phone normalization)
- [ ] `apps/api/src/notifications/cron/alert-scanner.service.spec.ts` -- covers NOTIF-01, ALERT-01 (cron scan logic)
- [ ] `apps/api/src/notifications/notifications.service.spec.ts` -- covers ALERT-02 (notification CRUD, dedup, enqueue)
- [ ] `apps/api/src/notifications/listeners/rental-extended.listener.spec.ts` -- covers NOTIF-03
- [ ] `apps/api/src/notifications/listeners/rental-activated.listener.spec.ts` -- covers NOTIF-02
- [ ] `apps/api/src/alert-config/alert-config.service.spec.ts` -- covers ALERT-02 (config CRUD, seed)
- [ ] `apps/api/test/notifications.e2e-spec.ts` -- covers ALL (e2e endpoints)
- [ ] BullMQ must be mocked in unit tests (no Redis dependency). SmsService must be mocked (no real SMS).

## Sources

### Primary (HIGH confidence)
- [smsapi npm package](https://www.npmjs.com/package/smsapi) - v2.1.3, TypeScript, Apache-2.0
- [smsapi GitHub](https://github.com/smsapi/smsapi-javascript-client) - Usage examples, Nov 2025 release
- [SMSAPI REST API docs](https://www.smsapi.com/docs) - Endpoints, auth, test mode, error codes
- Existing codebase: `apps/api/src/customers/retention.service.ts` - @Cron pattern
- Existing codebase: `apps/api/src/contracts/listeners/rental-extended.listener.ts` - @OnEvent pattern
- Existing codebase: `apps/api/src/mail/mail.service.ts` - MailService to extend
- Existing codebase: `apps/api/package.json` - @nestjs/bull 11.0.4, bullmq 5.x already installed

### Secondary (MEDIUM confidence)
- [NestJS Queues docs](https://docs.nestjs.com/techniques/queues) - BullMQ integration patterns
- [BullMQ retry patterns](https://dev.to/woovi/how-to-effectively-use-retry-policies-with-bulljsbullmq-45h9) - Exponential backoff config
- [SMSAPI.pl Polish endpoint](https://www.smsapi.pl/docs/) - Confirmed api.smsapi.pl base URL

### Tertiary (LOW confidence)
- smsapi SDK `server` constructor option for .pl endpoint - needs verification during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed or verified on npm registry
- Architecture: HIGH - follows established codebase patterns (@Cron, @OnEvent, module structure)
- Pitfalls: HIGH - based on real codebase analysis (phone format, timezone, dedup, Redis config)
- smsapi.pl SDK .pl endpoint config: LOW - needs testing during implementation

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain, established libraries)
