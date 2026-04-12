import { Module } from '@nestjs/common';
import { RentalDriversController } from './rental-drivers.controller';
import { RentalDriversService } from './rental-drivers.service';

@Module({
  controllers: [RentalDriversController],
  providers: [RentalDriversService],
  exports: [RentalDriversService],
})
export class RentalDriversModule {}
