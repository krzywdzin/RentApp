import { IsEnum } from 'class-validator';
import { DOCUMENT_TYPES, DOCUMENT_SIDES, DocumentType, DocumentSide } from '@rentapp/shared';

export class UploadDocumentParamsDto {
  customerId: string;

  @IsEnum(DOCUMENT_TYPES)
  type: DocumentType;

  @IsEnum(DOCUMENT_SIDES)
  side: DocumentSide;
}
