import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserRole, DocumentType, DocumentSide, DOCUMENT_SIDES } from '@rentapp/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';

const TYPE_MAP: Record<string, DocumentType> = {
  'id-card': 'ID_CARD',
  'driver-license': 'DRIVER_LICENSE',
};

@Controller('customers')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post(':customerId/documents/:type/:side')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
        cb(null, allowed.includes(file.mimetype.toLowerCase()));
      },
    }),
  )
  async uploadDocumentPhoto(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('type') type: string,
    @Param('side') side: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    const documentType = TYPE_MAP[type];
    if (!documentType) {
      throw new BadRequestException(
        `Invalid document type "${type}". Expected: ${Object.keys(TYPE_MAP).join(', ')}`,
      );
    }

    if (!DOCUMENT_SIDES.includes(side as DocumentSide)) {
      throw new BadRequestException(
        `Invalid side "${side}". Expected: ${DOCUMENT_SIDES.join(', ')}`,
      );
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.documentsService.uploadPhoto(
      customerId,
      documentType,
      side as DocumentSide,
      file,
      userId,
    );
  }

  @Get(':customerId/documents')
  @Roles(UserRole.ADMIN)
  async getDocuments(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.documentsService.getDocuments(customerId);
  }

  @Post(':customerId/files/driver-gov-report')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        cb(null, file.mimetype.toLowerCase() === 'application/pdf');
      },
    }),
  )
  async uploadDriverGovReport(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    return this.documentsService.uploadCustomerFile(customerId, 'DRIVER_GOV_REPORT', file, userId);
  }

  @Get(':customerId/files')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getCustomerFiles(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.documentsService.getCustomerFiles(customerId);
  }
}
