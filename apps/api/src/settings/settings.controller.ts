import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@rentapp/shared';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':key')
  async get(@Param('key') key: string) {
    const value = await this.settingsService.get(key);
    if (value === null) {
      throw new NotFoundException(`Setting "${key}" not found`);
    }
    return { key, value };
  }

  @Put(':key')
  @Roles(UserRole.ADMIN)
  async set(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ) {
    await this.settingsService.set(key, dto.value);
    return { key, value: dto.value };
  }
}
