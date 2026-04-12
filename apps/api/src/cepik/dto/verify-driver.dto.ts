import { IsUUID, IsString, IsOptional } from 'class-validator';

export class VerifyDriverDto {
  @IsUUID()
  driverId!: string;

  @IsUUID()
  rentalId!: string;

  @IsString()
  @IsOptional()
  requiredCategory?: string = 'B';
}
