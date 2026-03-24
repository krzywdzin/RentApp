import { Module } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { PhotosController } from './photos.controller';
import { DamageService } from './damage.service';
import { DamageController } from './damage.controller';

@Module({
  controllers: [PhotosController, DamageController],
  providers: [PhotosService, DamageService],
  exports: [PhotosService, DamageService],
})
export class PhotosModule {}
