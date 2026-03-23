import { IsEnum, IsString, MinLength } from 'class-validator';
import { RentalStatus } from '@rentapp/shared';

export class RollbackRentalDto {
  @IsEnum(RentalStatus)
  targetStatus!: RentalStatus;

  @IsString()
  @MinLength(1)
  reason!: string;
}
