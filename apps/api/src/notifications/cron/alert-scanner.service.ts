import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications.service';
import { AlertConfigService } from '../../alert-config/alert-config.service';

@Injectable()
export class AlertScannerService {
  private readonly logger = new Logger(AlertScannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly alertConfigService: AlertConfigService,
  ) {}

  @Cron('0 8 * * *')
  async scanAlerts() {
    this.logger.log('Starting daily alert scan');
    await this.scanReturnReminders();
    await this.scanOverdueRentals();
    await this.scanInsuranceExpiry();
    await this.scanInspectionExpiry();
    this.logger.log('Daily alert scan complete');
  }

  async scanReturnReminders(): Promise<void> {
    const config = await this.alertConfigService.findByType('RETURN_REMINDER');
    if (!config?.enabled) {
      this.logger.debug('RETURN_REMINDER alerts disabled, skipping');
      return;
    }

    const leadTimeDays = config.leadTimeDays ?? 1;
    const { startOfTarget, endOfTarget } =
      this.getWarsawDateRange(leadTimeDays);

    const rentals = await this.prisma.rental.findMany({
      where: {
        endDate: { gte: startOfTarget, lte: endOfTarget },
        status: { in: ['ACTIVE', 'EXTENDED'] },
      },
      include: { customer: true, vehicle: true },
    });

    for (const rental of rentals) {
      try {
        await this.notificationsService.enqueueReturnReminder(rental);
      } catch (error: any) {
        this.logger.error(
          `Failed to enqueue return reminder for rental ${rental.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Scanned ${rentals.length} rentals for return reminders`,
    );
  }

  async scanOverdueRentals(): Promise<void> {
    const config = await this.alertConfigService.findByType('OVERDUE');
    if (!config?.enabled) {
      this.logger.debug('OVERDUE alerts disabled, skipping');
      return;
    }

    const maxRepeat = config.maxRepeat ?? 7;
    const now = new Date();

    const rentals = await this.prisma.rental.findMany({
      where: {
        endDate: { lt: now },
        status: { in: ['ACTIVE', 'EXTENDED'] },
      },
      include: { customer: true, vehicle: true },
    });

    for (const rental of rentals) {
      try {
        const existingCount = await this.prisma.notification.count({
          where: {
            type: 'OVERDUE',
            relatedEntityId: rental.id,
            status: { in: ['SENT', 'PENDING', 'SENDING'] },
          },
        });

        if (existingCount >= maxRepeat) {
          this.logger.debug(
            `Overdue notifications for rental ${rental.id} reached maxRepeat (${maxRepeat}), skipping`,
          );
          continue;
        }

        await this.notificationsService.enqueueOverdueAlert(
          rental,
          existingCount,
        );
      } catch (error: any) {
        this.logger.error(
          `Failed to enqueue overdue alert for rental ${rental.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Scanned ${rentals.length} rentals for overdue alerts`,
    );
  }

  async scanInsuranceExpiry(): Promise<void> {
    const config =
      await this.alertConfigService.findByType('INSURANCE_EXPIRY');
    if (!config?.enabled) {
      this.logger.debug('INSURANCE_EXPIRY alerts disabled, skipping');
      return;
    }

    await this.scanExpiryForDays('INSURANCE_EXPIRY', 30);
    await this.scanExpiryForDays('INSURANCE_EXPIRY', 7);
  }

  async scanInspectionExpiry(): Promise<void> {
    const config =
      await this.alertConfigService.findByType('INSPECTION_EXPIRY');
    if (!config?.enabled) {
      this.logger.debug('INSPECTION_EXPIRY alerts disabled, skipping');
      return;
    }

    await this.scanExpiryForDays('INSPECTION_EXPIRY', 30);
    await this.scanExpiryForDays('INSPECTION_EXPIRY', 7);
  }

  private async scanExpiryForDays(
    alertType: 'INSURANCE_EXPIRY' | 'INSPECTION_EXPIRY',
    daysUntil: number,
  ): Promise<void> {
    const { startOfTarget, endOfTarget } =
      this.getWarsawDateRange(daysUntil);

    const isInsurance = alertType === 'INSURANCE_EXPIRY';

    const records = isInsurance
      ? await this.prisma.vehicleInsurance.findMany({
          where: { expiryDate: { gte: startOfTarget, lte: endOfTarget } },
          include: { vehicle: true },
        })
      : await this.prisma.vehicleInspection.findMany({
          where: { expiryDate: { gte: startOfTarget, lte: endOfTarget } },
          include: { vehicle: true },
        });

    for (const record of records) {
      try {
        await this.notificationsService.enqueueExpiryAlert(
          record.vehicleId,
          alertType,
          record.vehicle,
          record.expiryDate,
          daysUntil,
        );
      } catch (error: any) {
        this.logger.error(
          `Failed to enqueue ${alertType} alert for vehicle ${record.vehicleId}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Scanned ${records.length} vehicles for ${alertType} at ${daysUntil} days`,
    );
  }

  private getWarsawDateRange(daysFromNow: number): {
    startOfTarget: Date;
    endOfTarget: Date;
  } {
    const TIMEZONE = 'Europe/Warsaw';

    // Get current date in Warsaw timezone (YYYY-MM-DD)
    const now = new Date();
    const warsawStr = now.toLocaleDateString('en-CA', {
      timeZone: TIMEZONE,
    }); // YYYY-MM-DD
    const [year, month, day] = warsawStr.split('-').map(Number);

    // Add daysFromNow to get target date
    const target = new Date(Date.UTC(year, month - 1, day + daysFromNow));
    const targetStr = target.toISOString().split('T')[0]; // YYYY-MM-DD

    // Get Warsaw UTC offset for start-of-day and end-of-day of target date
    // by formatting a date at that point and extracting the offset
    const getWarsawOffset = (date: Date): number => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: TIMEZONE,
        timeZoneName: 'shortOffset',
      }).formatToParts(date);
      const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
      // tzPart is like "GMT+1" or "GMT+2"
      const match = tzPart.match(/GMT([+-]\d+)/);
      return match ? parseInt(match[1], 10) : 1;
    };

    // Start of day in Warsaw = midnight Warsaw time, converted to UTC
    const startOfTarget = new Date(`${targetStr}T00:00:00Z`);
    const startOffset = getWarsawOffset(startOfTarget);
    startOfTarget.setUTCHours(-startOffset, 0, 0, 0);

    // End of day in Warsaw = 23:59:59.999 Warsaw time, converted to UTC
    const endOfTarget = new Date(`${targetStr}T00:00:00Z`);
    const endOffset = getWarsawOffset(
      new Date(`${targetStr}T23:59:59Z`),
    );
    endOfTarget.setUTCHours(23 - endOffset, 59, 59, 999);

    return { startOfTarget, endOfTarget };
  }
}
