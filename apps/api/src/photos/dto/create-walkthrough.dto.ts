import { IsEnum, IsUUID } from 'class-validator';

export class CreateWalkthroughDto {
  @IsUUID()
  rentalId!: string;

  @IsEnum(['HANDOVER', 'RETURN'])
  type!: 'HANDOVER' | 'RETURN';
}
