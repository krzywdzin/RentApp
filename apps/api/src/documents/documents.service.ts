import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import sharp from 'sharp';
import type {
  CustomerDocumentDto,
  CustomerFileDto,
  CustomerFileType,
  DocumentPhotoDto,
  DocumentSide,
  DocumentType,
} from '@rentapp/shared';

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'report.pdf';
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async uploadPhoto(
    customerId: string,
    type: DocumentType,
    side: DocumentSide,
    file: Express.Multer.File,
    scannedById: string,
  ) {
    const photoKey = `documents/${customerId}/${type}/${side}.jpg`;
    const thumbKey = `documents/${customerId}/${type}/${side}_thumb.jpg`;

    // Check for existing document to delete old keys
    const existing = await this.prisma.customerDocument.findUnique({
      where: { customerId_type: { customerId, type } },
    });

    if (existing) {
      const oldPhotoKey = side === 'front' ? existing.frontPhotoKey : existing.backPhotoKey;
      const oldThumbKey = side === 'front' ? existing.frontThumbKey : existing.backThumbKey;
      if (oldPhotoKey) {
        await this.storage
          .delete(oldPhotoKey)
          .catch((err) =>
            this.logger.warn(`Failed to delete old photo key ${oldPhotoKey}: ${err.message}`),
          );
      }
      if (oldThumbKey) {
        await this.storage
          .delete(oldThumbKey)
          .catch((err) =>
            this.logger.warn(`Failed to delete old thumb key ${oldThumbKey}: ${err.message}`),
          );
      }
    }

    // Upload full-size photo
    await this.storage.upload(photoKey, file.buffer, file.mimetype);

    // Generate and upload thumbnail
    const thumbBuffer = await sharp(file.buffer)
      .rotate()
      .resize(320, undefined, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();
    await this.storage.upload(thumbKey, thumbBuffer, 'image/jpeg');

    // Build upsert data based on side
    const sideData =
      side === 'front'
        ? { frontPhotoKey: photoKey, frontThumbKey: thumbKey }
        : { backPhotoKey: photoKey, backThumbKey: thumbKey };

    const now = new Date();

    const createData =
      side === 'front'
        ? {
            customerId,
            type,
            scannedById,
            scannedAt: now,
            frontPhotoKey: photoKey,
            frontThumbKey: thumbKey,
          }
        : {
            customerId,
            type,
            scannedById,
            scannedAt: now,
            frontPhotoKey: '', // placeholder -- front upload will overwrite
            backPhotoKey: photoKey,
            backThumbKey: thumbKey,
          };

    const record = await this.prisma.customerDocument.upsert({
      where: { customerId_type: { customerId, type } },
      create: createData,
      update: {
        ...sideData,
        scannedById,
        scannedAt: now,
      },
    });

    return record;
  }

  async getDocuments(customerId: string): Promise<CustomerDocumentDto[]> {
    const documents = await this.prisma.customerDocument.findMany({
      where: { customerId },
    });

    const result: CustomerDocumentDto[] = await Promise.all(
      documents.map(async (doc: any) => {
        const photos: DocumentPhotoDto[] = [];

        if (doc.frontPhotoKey) {
          const url = await this.storage.getPresignedDownloadUrl(doc.frontPhotoKey);
          const thumbnailUrl = doc.frontThumbKey
            ? await this.storage.getPresignedDownloadUrl(doc.frontThumbKey)
            : null;
          photos.push({ side: 'front', url, thumbnailUrl });
        }

        if (doc.backPhotoKey) {
          const url = await this.storage.getPresignedDownloadUrl(doc.backPhotoKey);
          const thumbnailUrl = doc.backThumbKey
            ? await this.storage.getPresignedDownloadUrl(doc.backThumbKey)
            : null;
          photos.push({ side: 'back', url, thumbnailUrl });
        }

        return {
          id: doc.id,
          customerId: doc.customerId,
          type: doc.type as DocumentType,
          photos,
          scannedAt: doc.scannedAt.toISOString(),
          scannedById: doc.scannedById,
        };
      }),
    );

    return result;
  }

  async uploadCustomerFile(
    customerId: string,
    type: CustomerFileType,
    file: Express.Multer.File,
    uploadedById: string,
  ): Promise<CustomerFileDto> {
    const fileName = safeFileName(file.originalname || 'kierowca-gov-report.pdf');
    const fileKey = `documents/${customerId}/${type}/${Date.now()}-${fileName}`;

    const record = await this.prisma.customerFile.create({
      data: {
        customerId,
        type,
        fileKey,
        fileName,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById,
      },
    });

    try {
      await this.storage.upload(fileKey, file.buffer, file.mimetype);
    } catch (uploadError) {
      await this.prisma.customerFile.delete({ where: { id: record.id } }).catch(() => {});
      throw uploadError;
    }

    return this.toCustomerFileDto(record);
  }

  async getCustomerFiles(customerId: string): Promise<CustomerFileDto[]> {
    const files = await this.prisma.customerFile.findMany({
      where: { customerId },
      orderBy: { uploadedAt: 'desc' },
    });

    return Promise.all(files.map((file: any) => this.toCustomerFileDto(file)));
  }

  private async toCustomerFileDto(file: any): Promise<CustomerFileDto> {
    const url = await this.storage.getPresignedDownloadUrl(file.fileKey);
    return {
      id: file.id,
      customerId: file.customerId,
      type: file.type as CustomerFileType,
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      uploadedAt: file.uploadedAt.toISOString(),
      uploadedById: file.uploadedById,
      url,
    };
  }

  async deleteDocumentsByCustomerId(customerId: string): Promise<void> {
    const documents = await this.prisma.customerDocument.findMany({
      where: { customerId },
    });

    // Collect all R2 keys and delete them
    const deletePromises: Promise<void>[] = [];
    for (const doc of documents) {
      if (doc.frontPhotoKey) deletePromises.push(this.storage.delete(doc.frontPhotoKey));
      if (doc.frontThumbKey) deletePromises.push(this.storage.delete(doc.frontThumbKey));
      if (doc.backPhotoKey) deletePromises.push(this.storage.delete(doc.backPhotoKey));
      if (doc.backThumbKey) deletePromises.push(this.storage.delete(doc.backThumbKey));
    }
    await Promise.allSettled(deletePromises);

    await this.prisma.customerDocument.deleteMany({
      where: { customerId },
    });
  }

  async deleteCustomerFilesByCustomerId(customerId: string): Promise<void> {
    const files = await this.prisma.customerFile.findMany({
      where: { customerId },
    });

    await Promise.allSettled(files.map((file: any) => this.storage.delete(file.fileKey)));
    await this.prisma.customerFile.deleteMany({
      where: { customerId },
    });
  }
}
