import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PhotosService } from './photos.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

describe('PhotosService', () => {
  let service: PhotosService;
  let prisma: any;
  let storageService: any;

  beforeEach(async () => {
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
    it.todo('creates a HANDOVER walkthrough for a rental');
    it.todo('creates a RETURN walkthrough for a rental');
    it.todo('throws ConflictException if walkthrough type already exists for rental');
  });

  // PHOTO-01: Photo upload
  describe('uploadPhoto()', () => {
    it.todo('resizes image to max 2048px and generates 400px thumbnail');
    it.todo('extracts GPS coordinates from EXIF before resize');
    it.todo('stores GPS as null when EXIF has no GPS data');
    it.todo('uploads full-size and thumbnail to MinIO with correct keys');
    it.todo('creates WalkthroughPhoto record with correct metadata');
    it.todo('stores capturedAt timestamp from DTO');
    it.todo('rejects upload if walkthrough is submitted and past edit window');
    it.todo('allows upload if walkthrough is submitted but within 1-hour edit window');
  });

  // PHOTO-01: Walkthrough submission
  describe('submitWalkthrough()', () => {
    it.todo('submits walkthrough when all 8 required positions have photos');
    it.todo('rejects submission with fewer than 8 required position photos');
    it.todo('sets submittedAt to current timestamp');
    it.todo('allows extra photos beyond the 8 required positions');
  });

  // PHOTO-02: Photo comparison
  describe('getComparison()', () => {
    it.todo('returns paired handover and return photos by position');
    it.todo('returns presigned URLs for photo and thumbnail');
    it.todo('returns null for positions missing in either walkthrough');
  });

  // PHOTO-01: Photo replacement
  describe('replacePhoto()', () => {
    it.todo('replaces existing photo within edit window');
    it.todo('rejects replacement after edit window expires');
    it.todo('deletes old MinIO objects before uploading new ones');
  });
});
