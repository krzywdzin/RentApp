import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { AlertConfigService } from './alert-config.service';
import { UpdateAlertConfigDto } from '../notifications/dto/update-alert-config.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@rentapp/shared';

@Controller('alert-configs')
export class AlertConfigController {
  constructor(private readonly alertConfigService: AlertConfigService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.alertConfigService.findAll();
  }

  @Patch(':alertType')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('alertType') alertType: string,
    @Body() dto: UpdateAlertConfigDto,
  ) {
    return this.alertConfigService.update(alertType, dto);
  }
}
