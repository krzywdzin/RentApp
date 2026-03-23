import { IsString, IsUUID, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;

  @IsUUID()
  deviceId!: string;
}
