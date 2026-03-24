import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from './sms.service';
import { NOTIFICATION_QUEUES } from '../constants/notification-types';

interface SmsJobData {
  notificationId: string;
  phone: string;
  message: string;
}

@Processor(NOTIFICATION_QUEUES.SMS)
export class SmsProcessor {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly prisma: PrismaService,
  ) {}

  @Process()
  async handleSms(job: Job<SmsJobData>) {
    const { notificationId, phone, message } = job.data;

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENDING', attempts: { increment: 1 } },
    });

    await this.smsService.send(phone, message);

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENT', sentAt: new Date() },
    });

    this.logger.log(`SMS notification ${notificationId} sent to ${phone}`);
  }

  @OnQueueFailed()
  async handleFailed(job: Job<SmsJobData>, error: Error) {
    const { notificationId } = job.data;
    this.logger.error(
      `SMS job ${job.id} failed (attempt ${job.attemptsMade}): ${error.message}`,
    );

    if (job.attemptsMade >= 3) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED', errorMessage: error.message },
      });
    }
  }
}
