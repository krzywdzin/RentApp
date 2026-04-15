import { Controller, Post, Body } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { ParseOcrDto } from './dto/parse-ocr.dto';
import { ParseOcrImageDto } from './dto/parse-ocr-image.dto';
import type { IdCardOcrFields, DriverLicenseOcrFields } from '@rentapp/shared';

@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('parse-id-card-image')
  async parseIdCardImage(@Body() dto: ParseOcrImageDto): Promise<IdCardOcrFields> {
    return this.ocrService.parseIdCardImage(dto.imageBase64);
  }

  @Post('parse-driver-license-image')
  async parseDriverLicenseImage(@Body() dto: ParseOcrImageDto): Promise<DriverLicenseOcrFields> {
    return this.ocrService.parseDriverLicenseImage(dto.imageBase64);
  }

  @Post('parse-id-card')
  async parseIdCard(@Body() dto: ParseOcrDto): Promise<IdCardOcrFields> {
    return this.ocrService.parseIdCard(dto.texts);
  }

  @Post('parse-driver-license')
  async parseDriverLicense(@Body() dto: ParseOcrDto): Promise<DriverLicenseOcrFields> {
    return this.ocrService.parseDriverLicense(dto.texts);
  }
}
