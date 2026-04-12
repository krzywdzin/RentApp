import { Module } from '@nestjs/common';
import { VehicleClassesController } from './vehicle-classes.controller';
import { VehicleClassesService } from './vehicle-classes.service';

@Module({
  controllers: [VehicleClassesController],
  providers: [VehicleClassesService],
  exports: [VehicleClassesService],
})
export class VehicleClassesModule {}
