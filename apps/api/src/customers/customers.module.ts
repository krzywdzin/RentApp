import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { RetentionService } from './retention.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, RetentionService],
  exports: [CustomersService],
})
export class CustomersModule {}
