import {
  Controller,
  Post,
  Get,
  Param,
  ParseUUIDPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@rentapp/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { DocumentsService } from './documents.service';

@Controller('customers')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // RODO: zdjęcia dokumentów klienta nie są przechowywane na backendzie.
  // Endpoint pozostaje zgłaszając 410 Gone dla defensive-coding — gdyby
  // jakikolwiek klient (starsza apka, web) próbował przesłać zdjęcie,
  // otrzyma deterministyczną odmowę zamiast niecichego zapisu.
  @Post(':customerId/documents/:type/:side')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async uploadDocumentPhoto() {
    throw new HttpException(
      'Document photos are not stored server-side (RODO / GDPR). OCR data is extracted on-device and images stay on the device.',
      HttpStatus.GONE,
    );
  }

  // Read-only access pozostaje tylko dla ADMIN, aby można było przejrzeć
  // i wyczyścić ewentualne legacy dane wgrane przed zmianą.
  @Get(':customerId/documents')
  @Roles(UserRole.ADMIN)
  async getDocuments(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.documentsService.getDocuments(customerId);
  }
}
