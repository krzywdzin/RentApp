import { Module } from '@nestjs/common';
import { CepikController } from './cepik.controller';
import { CepikService } from './cepik.service';

@Module({
  controllers: [CepikController],
  providers: [CepikService],
  exports: [CepikService],
})
export class CepikModule {}
