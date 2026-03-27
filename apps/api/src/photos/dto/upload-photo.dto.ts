import { IsString, IsOptional, IsNumber, Min, Max, IsDateString, MaxLength } from 'class-validator';

export class UploadPhotoDto {
  @IsString()
  @MaxLength(50)
  position!: string;

  @IsDateString()
  capturedAt!: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  gpsLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  gpsLng?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;
}
