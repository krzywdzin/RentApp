import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertConfigService } from './alert-config.service';
import { AlertConfigController } from './alert-config.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AlertConfigController],
  providers: [AlertConfigService],
  exports: [AlertConfigService],
})
export class AlertConfigModule {}
