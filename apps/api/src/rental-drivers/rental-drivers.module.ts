import { Module } from '@nestjs/common';
import { RentalDriversService } from './rental-drivers.service';

@Module({
  providers: [RentalDriversService],
  exports: [RentalDriversService],
})
export class RentalDriversModule {}
