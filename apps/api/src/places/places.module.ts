import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';

@Module({
  imports: [ConfigModule],
  controllers: [PlacesController],
  providers: [PlacesService],
})
export class PlacesModule {}
