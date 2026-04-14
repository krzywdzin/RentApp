import { z } from 'zod';
import { DOCUMENT_TYPES, DOCUMENT_SIDES } from '../types/document.types';

export const documentTypeSchema = z.enum(DOCUMENT_TYPES);
export const documentSideSchema = z.enum(DOCUMENT_SIDES);

export const uploadDocumentPhotoSchema = z.object({
  type: documentTypeSchema,
  side: documentSideSchema,
});
