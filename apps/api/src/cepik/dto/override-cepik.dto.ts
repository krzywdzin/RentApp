import { IsString, MinLength } from 'class-validator';

export class OverrideCepikDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}
