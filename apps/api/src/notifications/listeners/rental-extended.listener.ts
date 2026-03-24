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
  }) {
    try {
      await this.notificationsService.sendExtensionSms(
        payload.customerId,
        payload.newEndDate,
        payload.rentalId,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send extension SMS: ${error.message}`,
      );
      // Non-blocking
    }
  }
}
