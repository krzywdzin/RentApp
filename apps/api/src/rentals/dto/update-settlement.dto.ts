import { IsEnum, IsOptional, IsInt, IsString, Min } from 'class-validator';
import { SettlementStatus } from '@rentapp/shared';

export class UpdateSettlementDto {
  @IsEnum(SettlementStatus)
  settlementStatus!: SettlementStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  settlementAmount?: number;

  @IsOptional()
  @IsString()
  settlementNotes?: string;
}
