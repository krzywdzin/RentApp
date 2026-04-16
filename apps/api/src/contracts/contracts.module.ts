import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { json } from 'express';
import { RentalsModule } from '../rentals/rentals.module';
import { CustomersModule } from '../customers/customers.module';
import { MailModule } from '../mail/mail.module';
import { PortalModule } from '../portal/portal.module';
import { SettingsModule } from '../settings/settings.module';
import { RentalDriversModule } from '../rental-drivers/rental-drivers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { PdfService } from './pdf/pdf.service';
import { PdfEncryptionService } from './pdf/pdf-encryption.service';
import { RentalExtendedListener } from './listeners/rental-extended.listener';

@Module({
  imports: [RentalsModule, CustomersModule, MailModule, PortalModule, SettingsModule, RentalDriversModule, NotificationsModule],
  controllers: [ContractsController],
  providers: [ContractsService, PdfService, PdfEncryptionService, RentalExtendedListener],
  exports: [ContractsService, PdfService],
})
export class ContractsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Allow larger body for signature PNG base64 uploads on the sign endpoint
    consumer
      .apply(json({ limit: '10mb' }))
      .forRoutes({ path: 'contracts/:id/sign', method: RequestMethod.POST });
  }
}
