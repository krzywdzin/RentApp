import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ContractsService } from '../contracts.service';

@Injectable()
export class RentalExtendedListener {
  private readonly logger = new Logger(RentalExtendedListener.name);

  constructor(private contractsService: ContractsService) {}

  @OnEvent('rental.extended')
  async handleRentalExtended(payload: {
    rentalId: string;
    customerId: string;
    newEndDate: string;
    extendedBy: string;
  }) {
    this.logger.log(`Rental ${payload.rentalId} extended, creating annex`);
    try {
      await this.contractsService.createAnnex(payload.rentalId, {
        newEndDate: payload.newEndDate,
        createdById: payload.extendedBy,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to create annex for rental ${payload.rentalId}: ${error.message}`,
      );
      // Do not throw - annex failure should not block rental extension
    }
  }
}
