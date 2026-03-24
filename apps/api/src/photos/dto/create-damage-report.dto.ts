import { IsUUID, IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDamagePinDto } from './create-damage-pin.dto';

export class CreateDamageReportDto {
  @IsUUID()
  walkthroughId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDamagePinDto)
  @IsOptional()
  pins?: CreateDamagePinDto[];

  @IsBoolean()
  @IsOptional()
  noDamageConfirmed?: boolean;
}
