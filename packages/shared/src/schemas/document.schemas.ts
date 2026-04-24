import { z } from 'zod';
import { DOCUMENT_TYPES, DOCUMENT_SIDES, CUSTOMER_FILE_TYPES } from '../types/document.types';

export const documentTypeSchema = z.enum(DOCUMENT_TYPES);
export const documentSideSchema = z.enum(DOCUMENT_SIDES);

export const uploadDocumentPhotoSchema = z.object({
  type: documentTypeSchema,
  side: documentSideSchema,
});

export const customerFileTypeSchema = z.enum(CUSTOMER_FILE_TYPES);
