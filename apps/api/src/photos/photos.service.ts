import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import exifr from 'exifr';
import { v4 as uuidv4 } from 'uuid';
import { PHOTO_POSITIONS, type PhotoComparisonPair } from '@rentapp/shared';
import { WalkthroughPhoto } from '@prisma/client';
import { CreateWalkthroughDto } from './dto/create-walkthrough.dto';
import { UploadPhotoDto } from './dto/upload-photo.dto';

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {}

  async createWalkthrough(dto: CreateWalkthroughDto, userId: string) {
    const existing = await this.prisma.photoWalkthrough.findFirst({
      where: { rentalId: dto.rentalId, type: dto.type },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.photoWalkthrough.create({
      data: {
        rentalId: dto.rentalId,
        type: dto.type,
        performedById: userId,
      },
    });
  }

  async uploadPhoto(
    walkthroughId: string,
    file: Express.Multer.File,
    dto: UploadPhotoDto,
    userId: string,
  ) {
    const walkthrough = await this.prisma.photoWalkthrough.findUnique({
      where: { id: walkthroughId },
    });

    if (!walkthrough) {
      throw new NotFoundException('Walkthrough not found');
    }

    if (!this.isEditable(walkthrough)) {
      throw new BadRequestException('Edit window has expired');
    }

    // Extract GPS BEFORE any Sharp processing
    const gps = await this.extractGps(file.buffer);

    // Full-size image: max 2048px
    const fullBuffer = await sharp(file.buffer)
      .rotate()
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Thumbnail: max 400px
    const thumbBuffer = await sharp(file.buffer)
      .rotate()
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    // Build storage keys
    const typePath = walkthrough.type.toLowerCase();
    const isRequiredPosition = (PHOTO_POSITIONS as readonly string[]).includes(dto.position);
    const positionKey = isRequiredPosition
      ? dto.position
      : `extra_${uuidv4()}`;

    const photoKey = `photos/${walkthrough.rentalId}/${typePath}/${positionKey}.jpg`;
    const thumbnailKey = `photos/${walkthrough.rentalId}/${typePath}/${positionKey}_thumb.jpg`;

    // Create DB record FIRST (so no orphaned S3 objects if DB fails)
    const record = await this.prisma.walkthroughPhoto.create({
      data: {
        walkthroughId,
        position: dto.position,
        photoKey,
        thumbnailKey,
        gpsLat: gps?.latitude ?? null,
        gpsLng: gps?.longitude ?? null,
        capturedAt: new Date(dto.capturedAt),
        uploadedById: userId,
        label: dto.label,
      },
    });

    // Upload to MinIO -- clean up DB record if S3 upload fails
    try {
      await this.storage.upload(photoKey, fullBuffer, 'image/jpeg');
      await this.storage.upload(thumbnailKey, thumbBuffer, 'image/jpeg');
    } catch (uploadError) {
      this.logger.warn(
        `S3 upload failed, cleaning up DB record ${record.id}: ${(uploadError as Error).message}`,
      );
      await this.prisma.walkthroughPhoto.delete({ where: { id: record.id } });
      throw uploadError;
    }

    return record;
  }

  async submitWalkthrough(walkthroughId: string, userId: string) {
    const walkthrough = await this.prisma.photoWalkthrough.findUnique({
      where: { id: walkthroughId },
    });

    if (!walkthrough) {
      throw new NotFoundException('Walkthrough not found');
    }

    const photos = await this.prisma.walkthroughPhoto.findMany({
      where: { walkthroughId },
    });

    const coveredPositions = new Set(photos.map((p: WalkthroughPhoto) => p.position));
    const missingPositions = PHOTO_POSITIONS.filter(
      (pos) => !coveredPositions.has(pos),
    );

    if (missingPositions.length > 0) {
      throw new BadRequestException(
        `Incomplete: missing positions: ${missingPositions.join(', ')}`,
      );
    }

    return this.prisma.photoWalkthrough.update({
      where: { id: walkthroughId },
      data: { submittedAt: new Date() },
    });
  }

  async getWalkthrough(walkthroughId: string) {
    const walkthrough = await this.prisma.photoWalkthrough.findUnique({
      where: { id: walkthroughId },
      include: { photos: true, damageReport: true },
    });

    if (!walkthrough) {
      throw new NotFoundException('Walkthrough not found');
    }

    return walkthrough;
  }

  async getComparison(rentalId: string): Promise<PhotoComparisonPair[]> {
    const handoverWt = await this.prisma.photoWalkthrough.findFirst({
      where: { rentalId, type: 'HANDOVER' },
      include: { photos: true },
    });

    const returnWt = await this.prisma.photoWalkthrough.findFirst({
      where: { rentalId, type: 'RETURN' },
      include: { photos: true },
    });

    // Collect all positions from both walkthroughs
    const allPositions = new Set<string>();
    if (handoverWt?.photos) {
      handoverWt.photos.forEach((p: WalkthroughPhoto) => allPositions.add(p.position));
    }
    if (returnWt?.photos) {
      returnWt.photos.forEach((p: WalkthroughPhoto) => allPositions.add(p.position));
    }

    const positions = Array.from(allPositions);

    // Generate all presigned URLs in parallel instead of sequentially
    const pairs = await Promise.all(
      positions.map(async (position) => {
        const handoverPhoto = handoverWt?.photos?.find(
          (p: WalkthroughPhoto) => p.position === position,
        );
        const returnPhoto = returnWt?.photos?.find(
          (p: WalkthroughPhoto) => p.position === position,
        );

        // Collect all URL promises for this position (up to 4)
        const urlPromises: Record<string, Promise<string> | null> = {
          handoverPhotoUrl: handoverPhoto
            ? this.storage.getPresignedDownloadUrl(handoverPhoto.photoKey)
            : null,
          handoverThumbUrl: handoverPhoto
            ? this.storage.getPresignedDownloadUrl(handoverPhoto.thumbnailKey)
            : null,
          returnPhotoUrl: returnPhoto
            ? this.storage.getPresignedDownloadUrl(returnPhoto.photoKey)
            : null,
          returnThumbUrl: returnPhoto
            ? this.storage.getPresignedDownloadUrl(returnPhoto.thumbnailKey)
            : null,
        };

        const [handoverPhotoUrl, handoverThumbUrl, returnPhotoUrl, returnThumbUrl] =
          await Promise.all([
            urlPromises.handoverPhotoUrl,
            urlPromises.handoverThumbUrl,
            urlPromises.returnPhotoUrl,
            urlPromises.returnThumbUrl,
          ]);

        const handover: PhotoComparisonPair['handover'] = handoverPhoto
          ? { photoUrl: handoverPhotoUrl!, thumbnailUrl: handoverThumbUrl! }
          : null;

        const returnData: PhotoComparisonPair['return'] = returnPhoto
          ? { photoUrl: returnPhotoUrl!, thumbnailUrl: returnThumbUrl! }
          : null;

        return { position, handover, return: returnData } as PhotoComparisonPair;
      }),
    );

    return pairs;
  }

  async replacePhoto(
    walkthroughId: string,
    position: string,
    file: Express.Multer.File,
    dto: UploadPhotoDto,
    userId: string,
  ) {
    const walkthrough = await this.prisma.photoWalkthrough.findUnique({
      where: { id: walkthroughId },
    });

    if (!walkthrough) {
      throw new NotFoundException('Walkthrough not found');
    }

    if (!this.isEditable(walkthrough)) {
      throw new BadRequestException('Edit window has expired');
    }

    const existingPhoto = await this.prisma.walkthroughPhoto.findUnique({
      where: {
        walkthroughId_position: { walkthroughId, position },
      },
    });

    if (!existingPhoto) {
      throw new NotFoundException(`No photo found for position: ${position}`);
    }

    // Extract GPS from new image
    const gps = await this.extractGps(file.buffer);

    // Process new image
    const fullBuffer = await sharp(file.buffer)
      .rotate()
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const thumbBuffer = await sharp(file.buffer)
      .rotate()
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    // 1. Upload new files FIRST (same keys -- overwrites old)
    await this.storage.upload(existingPhoto.photoKey, fullBuffer, 'image/jpeg');
    await this.storage.upload(existingPhoto.thumbnailKey, thumbBuffer, 'image/jpeg');

    // 2. Update DB record
    return this.prisma.walkthroughPhoto.update({
      where: { id: existingPhoto.id },
      data: {
        gpsLat: gps?.latitude ?? null,
        gpsLng: gps?.longitude ?? null,
        capturedAt: new Date(dto.capturedAt),
        uploadedById: userId,
      },
    });
  }

  isEditable(walkthrough: { submittedAt: Date | null }): boolean {
    if (!walkthrough.submittedAt) return true;
    const oneHourMs = 60 * 60 * 1000;
    return Date.now() - walkthrough.submittedAt.getTime() < oneHourMs;
  }

  async extractGps(
    buffer: Buffer,
  ): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const gps = await exifr.gps(buffer);
      if (gps && gps.latitude != null && gps.longitude != null) {
        return { latitude: gps.latitude, longitude: gps.longitude };
      }
      return null;
    } catch (err) {
      this.logger.warn('Failed to extract GPS from EXIF', err);
      return null;
    }
  }
}
