import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@rentapp/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CepikService } from './cepik.service';
import { VerifyLicenseDto } from './dto/verify-license.dto';
import { OverrideCepikDto } from './dto/override-cepik.dto';

@Controller('cepik')
export class CepikController {
  constructor(private cepikService: CepikService) {}

  @Post('verify')
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN)
  async verify(
    @Body() dto: VerifyLicenseDto,
    @CurrentUser('id') userId: string,
  ) {
    const verification = await this.cepikService.verify(
      dto.customerId,
      dto.rentalId,
      userId,
      dto.firstName,
      dto.lastName,
      dto.licenseNumber,
      dto.requiredCategory,
    );

    return {
      ...verification,
      __audit: {
        entityType: 'CepikVerification',
        entityId: verification.id,
        action: 'CREATE',
      },
    };
  }

  @Post('verify/:id/override')
  @Roles(UserRole.ADMIN)
  async override(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OverrideCepikDto,
    @CurrentUser('id') adminId: string,
  ) {
    const existing = await this.cepikService.findOne(id);
    const updated = await this.cepikService.overrideVerification(
      id,
      dto.reason,
      adminId,
    );

    return {
      ...updated,
      __audit: {
        entityType: 'CepikVerification',
        entityId: id,
        action: 'UPDATE',
        changes: {
          status: { old: existing.status, new: 'OVERRIDDEN' },
          overrideReason: { old: null, new: dto.reason },
        },
      },
    };
  }

  @Get('verify/rental/:rentalId')
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN)
  async findByRental(@Param('rentalId', ParseUUIDPipe) rentalId: string) {
    return this.cepikService.findByRental(rentalId);
  }
}
