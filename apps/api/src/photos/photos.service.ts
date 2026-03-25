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
      throw new ConflictException(
        `A ${dto.type} walkthrough already exists for this rental`,
      );
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

    // Upload to MinIO
    await this.storage.upload(photoKey, fullBuffer, 'image/jpeg');
    await this.storage.upload(thumbnailKey, thumbBuffer, 'image/jpeg');

    // Create DB record
    return this.prisma.walkthroughPhoto.create({
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

    const pairs: PhotoComparisonPair[] = [];

    for (const position of allPositions) {
      const handoverPhoto = handoverWt?.photos?.find(
        (p: WalkthroughPhoto) => p.position === position,
      );
      const returnPhoto = returnWt?.photos?.find(
        (p: WalkthroughPhoto) => p.position === position,
      );

      let handover: PhotoComparisonPair['handover'] = null;
      let returnData: PhotoComparisonPair['return'] = null;

      if (handoverPhoto) {
        handover = {
          photoUrl: await this.storage.getPresignedDownloadUrl(
            handoverPhoto.photoKey,
          ),
          thumbnailUrl: await this.storage.getPresignedDownloadUrl(
            handoverPhoto.thumbnailKey,
          ),
        };
      }

      if (returnPhoto) {
        returnData = {
          photoUrl: await this.storage.getPresignedDownloadUrl(
            returnPhoto.photoKey,
          ),
          thumbnailUrl: await this.storage.getPresignedDownloadUrl(
            returnPhoto.thumbnailKey,
          ),
        };
      }

      pairs.push({
        position,
        handover,
        return: returnData,
      });
    }

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

    // Delete old MinIO objects
    await this.storage.delete(existingPhoto.photoKey);
    await this.storage.delete(existingPhoto.thumbnailKey);

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

    // Upload new files (same keys as old)
    await this.storage.upload(existingPhoto.photoKey, fullBuffer, 'image/jpeg');
    await this.storage.upload(existingPhoto.thumbnailKey, thumbBuffer, 'image/jpeg');

    // Update DB record
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
