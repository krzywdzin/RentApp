import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { UserRole } from '@rentapp/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { DamageService } from './damage.service';
import { CreateDamageReportDto } from './dto/create-damage-report.dto';
import { CreateDamagePinDto } from './dto/create-damage-pin.dto';

@Controller('damage-reports')
export class DamageController {
  constructor(private readonly damageService: DamageService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async createOrUpdateReport(@Body() dto: CreateDamageReportDto) {
    return this.damageService.createOrUpdateReport(dto);
  }

  @Get('walkthrough/:walkthroughId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getReport(@Param('walkthroughId', ParseUUIDPipe) walkthroughId: string) {
    return this.damageService.getReport(walkthroughId);
  }

  @Get('comparison/:rentalId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getDamageComparison(@Param('rentalId', ParseUUIDPipe) rentalId: string) {
    return this.damageService.getDamageComparison(rentalId);
  }

  @Post(':walkthroughId/pins')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async addPin(
    @Param('walkthroughId', ParseUUIDPipe) walkthroughId: string,
    @Body() pin: CreateDamagePinDto,
  ) {
    return this.damageService.addPin(walkthroughId, pin);
  }

  @Delete(':walkthroughId/pins/:pinNumber')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async removePin(
    @Param('walkthroughId', ParseUUIDPipe) walkthroughId: string,
    @Param('pinNumber', ParseIntPipe) pinNumber: number,
  ) {
    return this.damageService.removePin(walkthroughId, pinNumber);
  }

  @Post(':walkthroughId/no-damage')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async confirmNoDamage(@Param('walkthroughId', ParseUUIDPipe) walkthroughId: string) {
    return this.damageService.confirmNoDamage(walkthroughId);
  }
}
