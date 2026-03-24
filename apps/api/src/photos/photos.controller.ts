import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserRole } from '@rentapp/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PhotosService } from './photos.service';
import { CreateWalkthroughDto } from './dto/create-walkthrough.dto';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { ImageValidationPipe } from './pipes/image-validation.pipe';

@Controller('walkthroughs')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async createWalkthrough(
    @Body() dto: CreateWalkthroughDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.photosService.createWalkthrough(dto, userId);
  }

  @Post(':id/photos')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
        cb(null, allowed.includes(file.mimetype.toLowerCase()));
      },
    }),
  )
  async uploadPhoto(
    @Param('id', ParseUUIDPipe) walkthroughId: string,
    @UploadedFile(ImageValidationPipe) file: Express.Multer.File,
    @Body() dto: UploadPhotoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.photosService.uploadPhoto(walkthroughId, file, dto, userId);
  }

  @Post(':id/submit')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async submitWalkthrough(
    @Param('id', ParseUUIDPipe) walkthroughId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.photosService.submitWalkthrough(walkthroughId, userId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getWalkthrough(@Param('id', ParseUUIDPipe) walkthroughId: string) {
    return this.photosService.getWalkthrough(walkthroughId);
  }

  @Get('rentals/:rentalId/comparison')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getComparison(@Param('rentalId', ParseUUIDPipe) rentalId: string) {
    return this.photosService.getComparison(rentalId);
  }

  @Put(':id/photos/:position')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
        cb(null, allowed.includes(file.mimetype.toLowerCase()));
      },
    }),
  )
  async replacePhoto(
    @Param('id', ParseUUIDPipe) walkthroughId: string,
    @Param('position') position: string,
    @UploadedFile(ImageValidationPipe) file: Express.Multer.File,
    @Body() dto: UploadPhotoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.photosService.replacePhoto(walkthroughId, position, file, dto, userId);
  }
}
