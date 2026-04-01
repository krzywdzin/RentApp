import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { RetentionService } from './retention.service';
import { PortalModule } from '../portal/portal.module';

@Module({
  imports: [PortalModule],
  controllers: [CustomersController],
  providers: [CustomersService, RetentionService],
  exports: [CustomersService],
})
export class CustomersModule {}
