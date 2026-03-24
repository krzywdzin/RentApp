import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { CreateWalkthroughDto } from './dto/create-walkthrough.dto';
import { UploadPhotoDto } from './dto/upload-photo.dto';

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {}

  async createWalkthrough(dto: CreateWalkthroughDto, userId: string) {
    throw new NotImplementedException('createWalkthrough not yet implemented');
  }

  async uploadPhoto(
    walkthroughId: string,
    file: Express.Multer.File,
    dto: UploadPhotoDto,
    userId: string,
  ) {
    throw new NotImplementedException('uploadPhoto not yet implemented');
  }

  async submitWalkthrough(walkthroughId: string, userId: string) {
    throw new NotImplementedException('submitWalkthrough not yet implemented');
  }

  async getWalkthrough(walkthroughId: string) {
    throw new NotImplementedException('getWalkthrough not yet implemented');
  }

  async getComparison(rentalId: string) {
    throw new NotImplementedException('getComparison not yet implemented');
  }

  async replacePhoto(
    walkthroughId: string,
    position: string,
    file: Express.Multer.File,
    dto: UploadPhotoDto,
    userId: string,
  ) {
    throw new NotImplementedException('replacePhoto not yet implemented');
  }

  isEditable(walkthrough: { submittedAt: Date | null }): boolean {
    if (!walkthrough.submittedAt) return true;
    const oneHourMs = 60 * 60 * 1000;
    return Date.now() - walkthrough.submittedAt.getTime() < oneHourMs;
  }

  async extractGps(buffer: Buffer): Promise<{ lat: number; lng: number } | null> {
    throw new NotImplementedException('extractGps not yet implemented');
  }
}
