import { Module } from '@nestjs/common';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';
import { DraftCleanupService } from './draft-cleanup.service';

@Module({
  controllers: [RentalsController],
  providers: [RentalsService, DraftCleanupService],
  exports: [RentalsService],
})
export class RentalsModule {}
