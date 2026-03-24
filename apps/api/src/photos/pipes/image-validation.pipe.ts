import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
  private readonly maxSize = 20 * 1024 * 1024; // 20MB

  transform(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Image file is required');
    if (!this.allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, HEIC`);
    }
    if (file.size > this.maxSize) {
      throw new BadRequestException(`File too large: ${file.size} bytes. Maximum: ${this.maxSize} bytes`);
    }
    return file;
  }
}
