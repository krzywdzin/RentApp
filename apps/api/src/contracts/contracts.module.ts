import { Module } from '@nestjs/common';
import { RentalsModule } from '../rentals/rentals.module';
import { CustomersModule } from '../customers/customers.module';
import { MailModule } from '../mail/mail.module';
import { PortalModule } from '../portal/portal.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { PdfService } from './pdf/pdf.service';
import { RentalExtendedListener } from './listeners/rental-extended.listener';

@Module({
  imports: [RentalsModule, CustomersModule, MailModule, PortalModule],
  controllers: [ContractsController],
  providers: [ContractsService, PdfService, RentalExtendedListener],
  exports: [ContractsService],
})
export class ContractsModule {}
