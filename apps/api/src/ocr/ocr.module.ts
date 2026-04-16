import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { json } from 'express';
import { ConfigModule } from '@nestjs/config';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';

@Module({
  imports: [ConfigModule],
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Allow larger body for base64 ID card images
    consumer
      .apply(json({ limit: '10mb' }))
      .forRoutes({ path: 'ocr/*path', method: RequestMethod.POST });
  }
}
