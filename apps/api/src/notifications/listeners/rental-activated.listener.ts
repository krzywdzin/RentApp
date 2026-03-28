import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class RentalActivatedNotificationListener {
  private readonly logger = new Logger(
    RentalActivatedNotificationListener.name,
  );

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent('rental.activated')
  async handleRentalActivated(payload: {
    rental: {
      id: string;
      customer: { email: string | null; firstName: string; lastName: string };
      vehicle: { registration: string };
      startDate: Date | string;
      endDate: Date | string;
      dailyRateNet: number;
    };
  }) {
    try {
      await this.notificationsService.sendRentalConfirmationEmail(
        payload.rental,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send rental confirmation: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Non-blocking
    }
  }
}
