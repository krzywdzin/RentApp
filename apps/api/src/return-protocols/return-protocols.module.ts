import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { json } from 'express';
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
export class ReturnProtocolsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Return protocols ship two base64 PNG signatures in a single JSON body.
    // Global limit is 1 MB (main.ts); raise to 10 MB for this route, mirroring contracts/:id/sign.
    consumer
      .apply(json({ limit: '10mb' }))
      .forRoutes({ path: 'return-protocols', method: RequestMethod.POST });
  }
}
