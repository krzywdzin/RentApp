import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class RentalCreatedNotificationListener {
  private readonly logger = new Logger(
    RentalCreatedNotificationListener.name,
  );

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent('rental.created')
  async handleRentalCreated(payload: {
    rental: {
      id: string;
      customer: {
        id: string;
        email: string | null;
        firstName: string;
        lastName: string;
        phone: string | null;
      };
      vehicle: { registration: string };
      startDate: Date | string;
      endDate: Date | string;
      dailyRateNet: number;
    };
  }) {
    try {
      await Promise.all([
        this.notificationsService.sendRentalConfirmationEmail(payload.rental),
        this.notificationsService.sendRentalCreatedSms(payload.rental),
      ]);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send rental created notifications: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Non-blocking
    }
  }
}
