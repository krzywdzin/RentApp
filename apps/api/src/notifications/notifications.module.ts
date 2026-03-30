import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { AlertConfigModule } from '../alert-config/alert-config.module';
import { SmsService } from './sms/sms.service';
import { SmsProcessor } from './sms/sms.processor';
import { EmailProcessor } from './email/email.processor';
import { EmailNotificationService } from './email/email-notification.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { RentalActivatedNotificationListener } from './listeners/rental-activated.listener';
import { RentalCreatedNotificationListener } from './listeners/rental-created.listener';
import { RentalExtendedNotificationListener } from './listeners/rental-extended.listener';
import { AlertScannerService } from './cron/alert-scanner.service';
import { NOTIFICATION_QUEUES } from './constants/notification-types';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    AlertConfigModule,
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUES.SMS,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 },
      },
    }),
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUES.EMAIL,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 },
      },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    SmsService,
    SmsProcessor,
    EmailProcessor,
    EmailNotificationService,
    NotificationsService,
    RentalActivatedNotificationListener,
    RentalCreatedNotificationListener,
    RentalExtendedNotificationListener,
    AlertScannerService,
  ],
  exports: [SmsService, NotificationsService],
})
export class NotificationsModule {}
