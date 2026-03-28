import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PHOTO_POSITIONS } from '@rentapp/shared';
import exifr from 'exifr';

// Mock sharp
const sharpChain = {
  rotate: jest.fn().mockReturnThis(),
  resize: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
};
jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(() => sharpChain),
}));

// Mock exifr
jest.mock('exifr', () => ({
  __esModule: true,
  default: { gps: jest.fn() },
}));

// Mock uuid
jest.mock('uuid', () => ({ v4: () => 'test-uuid-1234' }));

describe('PhotosService', () => {
  let service: PhotosService;
  let prisma: any;
  let storageService: any;

  const mockFile = {
    buffer: Buffer.from('test-image'),
    mimetype: 'image/jpeg',
    originalname: 'photo.jpg',
    size: 1024,
  } as Express.Multer.File;

  const mockWalkthrough = {
    id: 'wt-1',
    rentalId: 'rental-1',
    type: 'HANDOVER',
    performedById: 'user-1',
    submittedAt: null,
    noDamage: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      photoWalkthrough: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      walkthroughPhoto: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    storageService = {
      upload: jest.fn().mockResolvedValue('key'),
      getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://presigned-url'),
      getBuffer: jest.fn().mockResolvedValue(Buffer.from('data')),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotosService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<PhotosService>(PhotosService);
  });

  // PHOTO-01: Walkthrough creation
  describe('createWalkthrough()', () => {
    it('creates a HANDOVER walkthrough for a rental', async () => {
      prisma.photoWalkthrough.findFirst.mockResolvedValue(null);
      prisma.photoWalkthrough.create.mockResolvedValue(mockWalkthrough);

      const result = await service.createWalkthrough(
        { rentalId: 'rental-1', type: 'HANDOVER' },
        'user-1',
      );

      expect(prisma.photoWalkthrough.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          rentalId: 'rental-1',
          type: 'HANDOVER',
          performedById: 'user-1',
        }),
      });
      expect(result).toEqual(mockWalkthrough);
    });

    it('creates a RETURN walkthrough for a rental', async () => {
      prisma.photoWalkthrough.findFirst.mockResolvedValue(null);
      const returnWt = { ...mockWalkthrough, type: 'RETURN' };
      prisma.photoWalkthrough.create.mockResolvedValue(returnWt);

      const result = await service.createWalkthrough(
        { rentalId: 'rental-1', type: 'RETURN' },
        'user-1',
      );

      expect(prisma.photoWalkthrough.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'RETURN' }),
      });
      expect(result.type).toBe('RETURN');
    });

    it('throws ConflictException if walkthrough type already exists for rental', async () => {
      prisma.photoWalkthrough.findFirst.mockResolvedValue(mockWalkthrough);

      await expect(
        service.createWalkthrough({ rentalId: 'rental-1', type: 'HANDOVER' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  // PHOTO-01: Photo upload
  describe('uploadPhoto()', () => {
    beforeEach(() => {
      prisma.photoWalkthrough.findUnique.mockResolvedValue(mockWalkthrough);
      (exifr.gps as jest.Mock).mockResolvedValue({ latitude: 50.06, longitude: 19.94 });
    });

    it('resizes image to max 2048px and generates 400px thumbnail', async () => {
      prisma.walkthroughPhoto.create.mockResolvedValue({ id: 'photo-1' });

      await service.uploadPhoto('wt-1', mockFile, {
        position: 'front',
        capturedAt: '2026-03-24T12:00:00Z',
      }, 'user-1');

      const sharpModule = require('sharp');
      expect(sharpModule.default).toHaveBeenCalledWith(mockFile.buffer);
      expect(sharpChain.rotate).toHaveBeenCalled();
      expect(sharpChain.resize).toHaveBeenCalledWith(2048, 2048, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      expect(sharpChain.resize).toHaveBeenCalledWith(400, 400, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      expect(sharpChain.jpeg).toHaveBeenCalledWith({ quality: 85 });
      expect(sharpChain.jpeg).toHaveBeenCalledWith({ quality: 75 });
    });

    it('extracts GPS coordinates from EXIF before resize', async () => {
      prisma.walkthroughPhoto.create.mockResolvedValue({ id: 'photo-1' });

      await service.uploadPhoto('wt-1', mockFile, {
        position: 'front',
        capturedAt: '2026-03-24T12:00:00Z',
      }, 'user-1');

      expect(exifr.gps).toHaveBeenCalledWith(mockFile.buffer);
      expect(prisma.walkthroughPhoto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          gpsLat: 50.06,
          gpsLng: 19.94,
        }),
      });
    });

    it('stores GPS as null when EXIF has no GPS data', async () => {
      (exifr.gps as jest.Mock).mockResolvedValue(null);
      prisma.walkthroughPhoto.create.mockResolvedValue({ id: 'photo-1' });

      await service.uploadPhoto('wt-1', mockFile, {
        position: 'front',
        capturedAt: '2026-03-24T12:00:00Z',
      }, 'user-1');

      expect(prisma.walkthroughPhoto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          gpsLat: null,
          gpsLng: null,
        }),
      });
    });

    it('uploads full-size and thumbnail to MinIO with correct keys', async () => {
      prisma.walkthroughPhoto.create.mockResolvedValue({ id: 'photo-1' });

      await service.uploadPhoto('wt-1', mockFile, {
        position: 'front',
        capturedAt: '2026-03-24T12:00:00Z',
      }, 'user-1');

      expect(storageService.upload).toHaveBeenCalledTimes(2);
      expect(storageService.upload).toHaveBeenCalledWith(
        'photos/rental-1/handover/front.jpg',
        Buffer.from('resized'),
        'image/jpeg',
      );
      expect(storageService.upload).toHaveBeenCalledWith(
        'photos/rental-1/handover/front_thumb.jpg',
        Buffer.from('resized'),
        'image/jpeg',
      );
    });

    it('creates WalkthroughPhoto record with correct metadata', async () => {
      prisma.walkthroughPhoto.create.mockResolvedValue({ id: 'photo-1' });

      await service.uploadPhoto('wt-1', mockFile, {
        position: 'front',
        capturedAt: '2026-03-24T12:00:00Z',
      }, 'user-1');

      expect(prisma.walkthroughPhoto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          walkthroughId: 'wt-1',
          position: 'front',
          photoKey: 'photos/rental-1/handover/front.jpg',
          thumbnailKey: 'photos/rental-1/handover/front_thumb.jpg',
          uploadedById: 'user-1',
        }),
      });
    });

    it('stores capturedAt timestamp from DTO', async () => {
      prisma.walkthroughPhoto.create.mockResolvedValue({ id: 'photo-1' });

      await service.uploadPhoto('wt-1', mockFile, {
        position: 'front',
        capturedAt: '2026-03-24T12:00:00Z',
      }, 'user-1');

      expect(prisma.walkthroughPhoto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          capturedAt: new Date('2026-03-24T12:00:00Z'),
        }),
      });
    });

    it('rejects upload if walkthrough is submitted and past edit window', async () => {
      const expiredWt = {
        ...mockWalkthrough,
        submittedAt: new Date(Date.now() - 90 * 60 * 1000), // 90 min ago
      };
      prisma.photoWalkthrough.findUnique.mockResolvedValue(expiredWt);

      await expect(
        service.uploadPhoto('wt-1', mockFile, {
          position: 'front',
          capturedAt: '2026-03-24T12:00:00Z',
        }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows upload if walkthrough is submitted but within 1-hour edit window', async () => {
      const recentWt = {
        ...mockWalkthrough,
        submittedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      };
      prisma.photoWalkthrough.findUnique.mockResolvedValue(recentWt);
      prisma.walkthroughPhoto.create.mockResolvedValue({ id: 'photo-1' });

      await expect(
        service.uploadPhoto('wt-1', mockFile, {
          position: 'front',
          capturedAt: '2026-03-24T12:00:00Z',
        }, 'user-1'),
      ).resolves.toBeDefined();
    });
  });

  // PHOTO-01: Walkthrough submission
  describe('submitWalkthrough()', () => {
    const allPhotos = PHOTO_POSITIONS.map((pos) => ({
      id: `photo-${pos}`,
      position: pos,
      photoKey: `photos/rental-1/handover/${pos}.jpg`,
    }));

    it('submits walkthrough when all 8 required positions have photos', async () => {
      prisma.photoWalkthrough.findUnique.mockResolvedValue(mockWalkthrough);
      prisma.walkthroughPhoto.findMany.mockResolvedValue(allPhotos);
      prisma.photoWalkthrough.update.mockResolvedValue({
        ...mockWalkthrough,
        submittedAt: new Date(),
      });

      const result = await service.submitWalkthrough('wt-1', 'user-1');

      expect(prisma.photoWalkthrough.update).toHaveBeenCalledWith({
        where: { id: 'wt-1' },
        data: { submittedAt: expect.any(Date) },
      });
      expect(result.submittedAt).toBeDefined();
    });

    it('rejects submission with fewer than 8 required position photos', async () => {
      prisma.photoWalkthrough.findUnique.mockResolvedValue(mockWalkthrough);
      const partialPhotos = allPhotos.slice(0, 5); // only 5 photos
      prisma.walkthroughPhoto.findMany.mockResolvedValue(partialPhotos);

      await expect(
        service.submitWalkthrough('wt-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.submitWalkthrough('wt-1', 'user-1'),
      ).rejects.toThrow(/missing positions/i);
    });

    it('sets submittedAt to current timestamp', async () => {
      prisma.photoWalkthrough.findUnique.mockResolvedValue(mockWalkthrough);
      prisma.walkthroughPhoto.findMany.mockResolvedValue(allPhotos);
      const now = new Date();
      prisma.photoWalkthrough.update.mockResolvedValue({
        ...mockWalkthrough,
        submittedAt: now,
      });

      await service.submitWalkthrough('wt-1', 'user-1');

      const updateCall = prisma.photoWalkthrough.update.mock.calls[0][0];
      const submittedAt = updateCall.data.submittedAt;
      expect(submittedAt).toBeInstanceOf(Date);
      expect(Math.abs(submittedAt.getTime() - Date.now())).toBeLessThan(5000);
    });

    it('allows extra photos beyond the 8 required positions', async () => {
      prisma.photoWalkthrough.findUnique.mockResolvedValue(mockWalkthrough);
      const photosWithExtra = [
        ...allPhotos,
        { id: 'photo-extra', position: 'custom_angle', photoKey: 'extra.jpg' },
      ];
      prisma.walkthroughPhoto.findMany.mockResolvedValue(photosWithExtra);
      prisma.photoWalkthrough.update.mockResolvedValue({
        ...mockWalkthrough,
        submittedAt: new Date(),
      });

      await expect(service.submitWalkthrough('wt-1', 'user-1')).resolves.toBeDefined();
    });
  });

  // PHOTO-02: Photo comparison
  describe('getComparison()', () => {
    it('returns paired handover and return photos by position', async () => {
      const handoverWt = {
        ...mockWalkthrough,
        photos: [
          { position: 'front', photoKey: 'h-front.jpg', thumbnailKey: 'h-front_thumb.jpg' },
          { position: 'rear', photoKey: 'h-rear.jpg', thumbnailKey: 'h-rear_thumb.jpg' },
        ],
      };
      const returnWt = {
        id: 'wt-2',
        rentalId: 'rental-1',
        type: 'RETURN',
        photos: [
          { position: 'front', photoKey: 'r-front.jpg', thumbnailKey: 'r-front_thumb.jpg' },
          { position: 'rear', photoKey: 'r-rear.jpg', thumbnailKey: 'r-rear_thumb.jpg' },
        ],
      };
      prisma.photoWalkthrough.findFirst
        .mockResolvedValueOnce(handoverWt)
        .mockResolvedValueOnce(returnWt);

      const result = await service.getComparison('rental-1');

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe('front');
      expect(result[0].handover).toEqual({
        photoUrl: 'https://presigned-url',
        thumbnailUrl: 'https://presigned-url',
      });
      expect(result[0].return).toEqual({
        photoUrl: 'https://presigned-url',
        thumbnailUrl: 'https://presigned-url',
      });
    });

    it('returns presigned URLs for photo and thumbnail', async () => {
      const handoverWt = {
        ...mockWalkthrough,
        photos: [
          { position: 'front', photoKey: 'h-front.jpg', thumbnailKey: 'h-front_thumb.jpg' },
        ],
      };
      prisma.photoWalkthrough.findFirst
        .mockResolvedValueOnce(handoverWt)
        .mockResolvedValueOnce(null);

      await service.getComparison('rental-1');

      expect(storageService.getPresignedDownloadUrl).toHaveBeenCalledWith('h-front.jpg');
      expect(storageService.getPresignedDownloadUrl).toHaveBeenCalledWith('h-front_thumb.jpg');
    });

    it('returns null for positions missing in either walkthrough', async () => {
      const handoverWt = {
        ...mockWalkthrough,
        photos: [
          { position: 'front', photoKey: 'h-front.jpg', thumbnailKey: 'h-front_thumb.jpg' },
        ],
      };
      const returnWt = {
        id: 'wt-2',
        rentalId: 'rental-1',
        type: 'RETURN',
        photos: [
          { position: 'rear', photoKey: 'r-rear.jpg', thumbnailKey: 'r-rear_thumb.jpg' },
        ],
      };
      prisma.photoWalkthrough.findFirst
        .mockResolvedValueOnce(handoverWt)
        .mockResolvedValueOnce(returnWt);

      const result = await service.getComparison('rental-1');

      const frontPair = result.find((p: any) => p.position === 'front');
      const rearPair = result.find((p: any) => p.position === 'rear');
      expect(frontPair?.handover).toBeDefined();
      expect(frontPair?.return).toBeNull();
      expect(rearPair?.handover).toBeNull();
      expect(rearPair?.return).toBeDefined();
    });
  });

  // PHOTO-01: Photo replacement
  describe('replacePhoto()', () => {
    const existingPhoto = {
      id: 'photo-1',
      walkthroughId: 'wt-1',
      position: 'front',
      photoKey: 'photos/rental-1/handover/front.jpg',
      thumbnailKey: 'photos/rental-1/handover/front_thumb.jpg',
    };

    it('replaces existing photo within edit window', async () => {
      const recentWt = {
        ...mockWalkthrough,
        submittedAt: new Date(Date.now() - 30 * 60 * 1000),
      };
      prisma.photoWalkthrough.findUnique.mockResolvedValue(recentWt);
      prisma.walkthroughPhoto.findUnique.mockResolvedValue(existingPhoto);
      prisma.walkthroughPhoto.update.mockResolvedValue({ ...existingPhoto });
      (exifr.gps as jest.Mock).mockResolvedValue(null);

      await expect(
        service.replacePhoto('wt-1', 'front', mockFile, {
          position: 'front',
          capturedAt: '2026-03-24T12:00:00Z',
        }, 'user-1'),
      ).resolves.toBeDefined();

      // replacePhoto uses overwrite pattern (same S3 keys), no delete calls
      expect(storageService.upload).toHaveBeenCalledTimes(2);
      expect(storageService.upload).toHaveBeenCalledWith(
        'photos/rental-1/handover/front.jpg',
        expect.any(Buffer),
        'image/jpeg',
      );
      expect(storageService.upload).toHaveBeenCalledWith(
        'photos/rental-1/handover/front_thumb.jpg',
        expect.any(Buffer),
        'image/jpeg',
      );
    });

    it('rejects replacement after edit window expires', async () => {
      const expiredWt = {
        ...mockWalkthrough,
        submittedAt: new Date(Date.now() - 90 * 60 * 1000),
      };
      prisma.photoWalkthrough.findUnique.mockResolvedValue(expiredWt);

      await expect(
        service.replacePhoto('wt-1', 'front', mockFile, {
          position: 'front',
          capturedAt: '2026-03-24T12:00:00Z',
        }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('overwrites old MinIO objects with new uploads (same keys)', async () => {
      prisma.photoWalkthrough.findUnique.mockResolvedValue(mockWalkthrough);
      prisma.walkthroughPhoto.findUnique.mockResolvedValue(existingPhoto);
      prisma.walkthroughPhoto.update.mockResolvedValue({ ...existingPhoto });
      (exifr.gps as jest.Mock).mockResolvedValue(null);

      await service.replacePhoto('wt-1', 'front', mockFile, {
        position: 'front',
        capturedAt: '2026-03-24T12:00:00Z',
      }, 'user-1');

      // Overwrite pattern: upload to same keys, no delete needed
      expect(storageService.upload).toHaveBeenCalledWith(
        'photos/rental-1/handover/front.jpg',
        expect.any(Buffer),
        'image/jpeg',
      );
      expect(storageService.upload).toHaveBeenCalledWith(
        'photos/rental-1/handover/front_thumb.jpg',
        expect.any(Buffer),
        'image/jpeg',
      );
    });
  });
});
