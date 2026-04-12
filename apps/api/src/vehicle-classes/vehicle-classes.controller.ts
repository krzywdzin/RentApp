import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@rentapp/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { VehicleClassesService } from './vehicle-classes.service';
import { CreateVehicleClassDto } from './dto/create-vehicle-class.dto';
import { UpdateVehicleClassDto } from './dto/update-vehicle-class.dto';

@Controller('vehicle-classes')
export class VehicleClassesController {
  constructor(private vehicleClassesService: VehicleClassesService) {}

  @Get()
  async findAll() {
    return this.vehicleClassesService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateVehicleClassDto) {
    return this.vehicleClassesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleClassDto,
  ) {
    return this.vehicleClassesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicleClassesService.remove(id);
  }
}
