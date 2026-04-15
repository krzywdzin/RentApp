import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class RentalExtendedNotificationListener {
  private readonly logger = new Logger(
    RentalExtendedNotificationListener.name,
  );

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent('rental.extended')
  async handleRentalExtended(payload: {
    rentalId: string;
    customerId: string;
    newEndDate: string;
    extendedBy: string;
    totalPriceGross?: number;
    dailyRateNet?: number;
  }) {
    try {
      await this.notificationsService.sendExtensionSms(
        payload.customerId,
        payload.newEndDate,
        payload.rentalId,
        payload.totalPriceGross,
        payload.dailyRateNet,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send extension SMS: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Non-blocking
    }
  }
}
