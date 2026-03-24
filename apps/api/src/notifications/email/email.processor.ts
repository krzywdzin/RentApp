import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { NOTIFICATION_QUEUES } from '../constants/notification-types';

interface EmailJobData {
  notificationId: string;
  to: string;
  subject: string;
  html: string;
}

@Processor(NOTIFICATION_QUEUES.EMAIL)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  @Process()
  async handleEmail(job: Job<EmailJobData>) {
    const { notificationId, to, subject, html } = job.data;

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENDING', attempts: { increment: 1 } },
    });

    await this.mailService.sendRaw(to, subject, html);

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENT', sentAt: new Date() },
    });

    this.logger.log(`Email notification ${notificationId} sent to ${to}`);
  }

  @OnQueueFailed()
  async handleFailed(job: Job<EmailJobData>, error: Error) {
    const { notificationId } = job.data;
    this.logger.error(
      `Email job ${job.id} failed (attempt ${job.attemptsMade}): ${error.message}`,
    );

    if (job.attemptsMade >= 3) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED', errorMessage: error.message },
      });
    }
  }
}
