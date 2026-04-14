import { Module } from '@nestjs/common';
import { ContractsModule } from '../contracts/contracts.module';
import { MailModule } from '../mail/mail.module';
import { ReturnProtocolsService } from './return-protocols.service';
import { ReturnProtocolsController } from './return-protocols.controller';

@Module({
  imports: [ContractsModule, MailModule],
  controllers: [ReturnProtocolsController],
  providers: [ReturnProtocolsService],
  exports: [ReturnProtocolsService],
})
export class ReturnProtocolsModule {}
