import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

// Mock sharp
const sharpChain = {
  rotate: jest.fn().mockReturnThis(),
  resize: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumb')),
};
jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(() => sharpChain),
}));

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: any;
  let storage: any;

  const mockFile = {
    buffer: Buffer.from('test-image'),
    mimetype: 'image/jpeg',
    originalname: 'photo.jpg',
    size: 1024,
  } as Express.Multer.File;

  const mockDocument = {
    id: 'doc-1',
    customerId: 'cust-1',
    type: 'ID_CARD',
    frontPhotoKey: 'documents/cust-1/ID_CARD/front.jpg',
    frontThumbKey: 'documents/cust-1/ID_CARD/front_thumb.jpg',
    backPhotoKey: null,
    backThumbKey: null,
    scannedAt: new Date('2026-01-01'),
    scannedById: 'user-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      customerDocument: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    storage = {
      upload: jest.fn().mockResolvedValue('key'),
      getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://presigned-url'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('uploadPhoto', () => {
    it('stores file to R2 with correct key pattern and upserts CustomerDocument', async () => {
      prisma.customerDocument.findUnique.mockResolvedValue(null);
      prisma.customerDocument.upsert.mockResolvedValue(mockDocument);

      const result = await service.uploadPhoto('cust-1', 'ID_CARD', 'front', mockFile, 'user-1');

      expect(storage.upload).toHaveBeenCalledWith(
        'documents/cust-1/ID_CARD/front.jpg',
        expect.any(Buffer),
        'image/jpeg',
      );
      // Thumbnail upload
      expect(storage.upload).toHaveBeenCalledWith(
        'documents/cust-1/ID_CARD/front_thumb.jpg',
        expect.any(Buffer),
        'image/jpeg',
      );
      expect(prisma.customerDocument.upsert).toHaveBeenCalled();
      expect(result).toEqual(mockDocument);
    });

    it('sets frontPhotoKey for front side', async () => {
      prisma.customerDocument.findUnique.mockResolvedValue(null);
      prisma.customerDocument.upsert.mockResolvedValue(mockDocument);

      await service.uploadPhoto('cust-1', 'ID_CARD', 'front', mockFile, 'user-1');

      const upsertCall = prisma.customerDocument.upsert.mock.calls[0][0];
      expect(upsertCall.create.frontPhotoKey).toBe('documents/cust-1/ID_CARD/front.jpg');
      expect(upsertCall.create.frontThumbKey).toBe('documents/cust-1/ID_CARD/front_thumb.jpg');
    });

    it('sets backPhotoKey for back side', async () => {
      prisma.customerDocument.findUnique.mockResolvedValue(null);
      prisma.customerDocument.upsert.mockResolvedValue({
        ...mockDocument,
        backPhotoKey: 'documents/cust-1/ID_CARD/back.jpg',
        backThumbKey: 'documents/cust-1/ID_CARD/back_thumb.jpg',
      });

      await service.uploadPhoto('cust-1', 'ID_CARD', 'back', mockFile, 'user-1');

      const upsertCall = prisma.customerDocument.upsert.mock.calls[0][0];
      expect(upsertCall.update.backPhotoKey).toBe('documents/cust-1/ID_CARD/back.jpg');
      expect(upsertCall.update.backThumbKey).toBe('documents/cust-1/ID_CARD/back_thumb.jpg');
    });

    it('deletes old R2 key when re-uploading same type+side', async () => {
      prisma.customerDocument.findUnique.mockResolvedValue({
        ...mockDocument,
        frontPhotoKey: 'documents/cust-1/ID_CARD/front.jpg',
        frontThumbKey: 'documents/cust-1/ID_CARD/front_thumb.jpg',
      });
      prisma.customerDocument.upsert.mockResolvedValue(mockDocument);

      await service.uploadPhoto('cust-1', 'ID_CARD', 'front', mockFile, 'user-1');

      expect(storage.delete).toHaveBeenCalledWith('documents/cust-1/ID_CARD/front.jpg');
      expect(storage.delete).toHaveBeenCalledWith('documents/cust-1/ID_CARD/front_thumb.jpg');
    });
  });

  describe('getDocuments', () => {
    it('returns all CustomerDocument records with presigned URLs', async () => {
      prisma.customerDocument.findMany.mockResolvedValue([mockDocument]);

      const result = await service.getDocuments('cust-1');

      expect(prisma.customerDocument.findMany).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('doc-1');
      expect(result[0].photos).toBeDefined();
      expect(result[0].photos.length).toBeGreaterThan(0);
      expect(storage.getPresignedDownloadUrl).toHaveBeenCalled();
    });
  });

  describe('deleteDocumentsByCustomerId', () => {
    it('removes CustomerDocument records and deletes R2 keys', async () => {
      prisma.customerDocument.findMany.mockResolvedValue([mockDocument]);
      prisma.customerDocument.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteDocumentsByCustomerId('cust-1');

      expect(storage.delete).toHaveBeenCalledWith('documents/cust-1/ID_CARD/front.jpg');
      expect(storage.delete).toHaveBeenCalledWith('documents/cust-1/ID_CARD/front_thumb.jpg');
      expect(prisma.customerDocument.deleteMany).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
      });
    });
  });
});
