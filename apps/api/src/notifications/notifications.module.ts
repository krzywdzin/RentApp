import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { SmsService } from './sms/sms.service';
import { SmsProcessor } from './sms/sms.processor';
import { EmailProcessor } from './email/email.processor';
import { NOTIFICATION_QUEUES } from './constants/notification-types';

@Module({
  imports: [
    PrismaModule,
    MailModule,
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
  providers: [SmsService, SmsProcessor, EmailProcessor],
  exports: [SmsService],
})
export class NotificationsModule {}
