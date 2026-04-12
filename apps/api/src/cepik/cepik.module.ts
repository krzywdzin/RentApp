import { Module } from '@nestjs/common';
import { CepikController } from './cepik.controller';
import { CepikService } from './cepik.service';
import { RentalDriversModule } from '../rental-drivers/rental-drivers.module';

@Module({
  imports: [RentalDriversModule],
  controllers: [CepikController],
  providers: [CepikService],
  exports: [CepikService],
})
export class CepikModule {}
