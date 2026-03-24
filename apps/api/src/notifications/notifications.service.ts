import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { EmailNotificationService } from './email/email-notification.service';
import { NOTIFICATION_QUEUES } from './constants/notification-types';
import {
  returnReminderSms,
  overdueSms,
  extensionSms,
} from './constants/sms-templates';
import { NotificationQueryDto } from './dto/notification-query.dto';

function formatDateWarsaw(date: Date | string): { date: string; time: string } {
  const d = new Date(date);
  const formatted = d.toLocaleString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  // pl-PL format: "24.03.2026, 14:00"
  const [datePart, timePart] = formatted.split(', ');
  return { date: datePart, time: timePart };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(NOTIFICATION_QUEUES.SMS) private readonly smsQueue: Queue,
    @InjectQueue(NOTIFICATION_QUEUES.EMAIL) private readonly emailQueue: Queue,
    private readonly config: ConfigService,
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  private get companyPhone(): string {
    return this.config.get<string>('COMPANY_PHONE', '+48 500 000 000');
  }

  private async isDuplicate(
    type: string,
    relatedEntityId: string,
    scheduledDate: Date,
  ): Promise<boolean> {
    const startOfDay = new Date(scheduledDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.prisma.notification.findFirst({
      where: {
        type,
        relatedEntityId,
        scheduledFor: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'SENDING', 'SENT'] },
      },
    });
    return !!existing;
  }

  // --- SMS notification methods ---

  async sendExtensionSms(
    customerId: string,
    newEndDate: string,
    rentalId: string,
  ): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer?.phone) {
      this.logger.warn(
        `Cannot send extension SMS: customer ${customerId} has no phone`,
      );
      return;
    }

    const notification = await this.prisma.notification.create({
      data: {
        type: 'EXTENSION',
        channel: 'SMS',
        recipientId: customerId,
        recipientPhone: customer.phone,
        relatedEntityType: 'Rental',
        relatedEntityId: rentalId,
        status: 'PENDING',
        scheduledFor: new Date(),
      },
    });

    const { date, time } = formatDateWarsaw(newEndDate);
    const message = extensionSms({
      newReturnDate: date,
      newReturnTime: time,
      companyPhone: this.companyPhone,
    });

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: { message },
    });

    await this.smsQueue.add({
      notificationId: notification.id,
      phone: customer.phone,
      message,
    });

    this.logger.log(`Extension SMS enqueued for rental ${rentalId}`);
  }

  async enqueueReturnReminder(rental: {
    id: string;
    endDate: Date | string;
    customer: { id: string; phone: string | null };
    vehicle: { registration: string };
  }): Promise<void> {
    if (await this.isDuplicate('RETURN_REMINDER', rental.id, new Date())) {
      this.logger.debug(
        `Duplicate return reminder for rental ${rental.id}, skipping`,
      );
      return;
    }

    if (!rental.customer.phone) {
      this.logger.warn(
        `Cannot send return reminder: customer ${rental.customer.id} has no phone`,
      );
      return;
    }

    const notification = await this.prisma.notification.create({
      data: {
        type: 'RETURN_REMINDER',
        channel: 'SMS',
        recipientId: rental.customer.id,
        recipientPhone: rental.customer.phone,
        relatedEntityType: 'Rental',
        relatedEntityId: rental.id,
        status: 'PENDING',
        scheduledFor: new Date(),
      },
    });

    const { date, time } = formatDateWarsaw(rental.endDate);
    const message = returnReminderSms({
      returnDate: date,
      returnTime: time,
      companyPhone: this.companyPhone,
    });

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: { message },
    });

    await this.smsQueue.add({
      notificationId: notification.id,
      phone: rental.customer.phone,
      message,
    });

    this.logger.log(`Return reminder enqueued for rental ${rental.id}`);
  }

  async enqueueOverdueAlert(
    rental: {
      id: string;
      endDate: Date | string;
      customer: { id: string; phone: string | null };
      vehicle: { registration: string };
    },
    overdueCount: number,
  ): Promise<void> {
    if (await this.isDuplicate('OVERDUE', rental.id, new Date())) {
      this.logger.debug(
        `Duplicate overdue alert for rental ${rental.id}, skipping`,
      );
      return;
    }

    if (!rental.customer.phone) {
      this.logger.warn(
        `Cannot send overdue alert: customer ${rental.customer.id} has no phone`,
      );
      return;
    }

    const notification = await this.prisma.notification.create({
      data: {
        type: 'OVERDUE',
        channel: 'SMS',
        recipientId: rental.customer.id,
        recipientPhone: rental.customer.phone,
        relatedEntityType: 'Rental',
        relatedEntityId: rental.id,
        status: 'PENDING',
        scheduledFor: new Date(),
      },
    });

    const { date, time } = formatDateWarsaw(rental.endDate);
    const message = overdueSms({
      returnDate: date,
      returnTime: time,
      companyPhone: this.companyPhone,
    });

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: { message },
    });

    await this.smsQueue.add({
      notificationId: notification.id,
      phone: rental.customer.phone,
      message,
    });

    this.logger.log(
      `Overdue alert #${overdueCount + 1} enqueued for rental ${rental.id}`,
    );
  }

  // --- Email notification methods ---

  async sendRentalConfirmationEmail(rental: {
    id: string;
    customer: {
      email: string | null;
      firstName: string;
      lastName: string;
    };
    vehicle: { registration: string };
    startDate: Date | string;
    endDate: Date | string;
    dailyRateNet: number;
  }): Promise<void> {
    if (!rental.customer.email) {
      this.logger.warn(
        `Cannot send rental confirmation: customer has no email`,
      );
      return;
    }

    const notification = await this.prisma.notification.create({
      data: {
        type: 'RENTAL_CONFIRMATION',
        channel: 'EMAIL',
        recipientEmail: rental.customer.email,
        relatedEntityType: 'Rental',
        relatedEntityId: rental.id,
        status: 'PENDING',
        scheduledFor: new Date(),
      },
    });

    const { subject, html } =
      this.emailNotificationService.rentalConfirmationHtml(rental);

    await this.emailQueue.add({
      notificationId: notification.id,
      to: rental.customer.email,
      subject,
      html,
    });

    this.logger.log(
      `Rental confirmation email enqueued for rental ${rental.id}`,
    );
  }

  async enqueueExpiryAlert(
    vehicleId: string,
    alertType: 'INSURANCE_EXPIRY' | 'INSPECTION_EXPIRY',
    vehicle: { registration: string; make: string; model: string },
    expiryDate: Date,
    daysUntil: number,
  ): Promise<void> {
    if (await this.isDuplicate(alertType, vehicleId, new Date())) {
      this.logger.debug(
        `Duplicate ${alertType} alert for vehicle ${vehicleId}, skipping`,
      );
      return;
    }

    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
    });

    for (const admin of admins) {
      const notification = await this.prisma.notification.create({
        data: {
          type: alertType,
          channel: 'EMAIL',
          recipientId: admin.id,
          recipientEmail: admin.email,
          relatedEntityType: 'Vehicle',
          relatedEntityId: vehicleId,
          status: 'PENDING',
          scheduledFor: new Date(),
        },
      });

      const { subject, html } =
        alertType === 'INSURANCE_EXPIRY'
          ? this.emailNotificationService.insuranceExpiryHtml(
              vehicle,
              expiryDate,
              daysUntil,
            )
          : this.emailNotificationService.inspectionExpiryHtml(
              vehicle,
              expiryDate,
              daysUntil,
            );

      await this.emailQueue.add({
        notificationId: notification.id,
        to: admin.email,
        subject,
        html,
      });

      // Create in-app notification
      const titlePrefix =
        alertType === 'INSURANCE_EXPIRY' ? 'Ubezpieczenie' : 'Przeglad';
      await this.prisma.inAppNotification.create({
        data: {
          userId: admin.id,
          title: `${titlePrefix} wygasa - ${vehicle.registration}`,
          body: `${titlePrefix} pojazdu ${vehicle.registration} (${vehicle.make} ${vehicle.model}) wygasa za ${daysUntil} dni.`,
          type: alertType,
          linkUrl: `/vehicles/${vehicleId}`,
        },
      });
    }

    this.logger.log(
      `${alertType} alerts enqueued for vehicle ${vehicleId} (${daysUntil} days)`,
    );
  }

  // --- In-app notification methods ---

  async getInAppNotifications(userId: string, query: NotificationQueryDto) {
    const { page = 1, limit = 20, isRead } = query;
    const where: Record<string, unknown> = { userId };
    if (isRead === 'true') where.isRead = true;
    if (isRead === 'false') where.isRead = false;

    const [data, total] = await Promise.all([
      this.prisma.inAppNotification.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inAppNotification.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.inAppNotification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.inAppNotification.update({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // --- Notification log (admin) ---

  async getNotificationLog(query: NotificationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count(),
    ]);
    return { data, total, page, limit };
  }
}
