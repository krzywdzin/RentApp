import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@rentapp/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { RentalDriversService } from './rental-drivers.service';
import { CreateRentalDriverDto } from './dto/create-rental-driver.dto';

@Controller('rentals/:rentalId/driver')
export class RentalDriversController {
  constructor(private rentalDriversService: RentalDriversService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async create(
    @Param('rentalId', ParseUUIDPipe) rentalId: string,
    @Body() dto: CreateRentalDriverDto,
  ) {
    const driver = await this.rentalDriversService.create(rentalId, dto);
    return {
      ...driver,
      __audit: {
        entityType: 'RentalDriver',
        entityId: driver.id,
        action: 'CREATE',
      },
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findByRental(
    @Param('rentalId', ParseUUIDPipe) rentalId: string,
  ) {
    const driver = await this.rentalDriversService.findByRentalId(rentalId);
    if (!driver) {
      return null;
    }
    return driver;
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async delete(
    @Param('rentalId', ParseUUIDPipe) rentalId: string,
  ) {
    await this.rentalDriversService.delete(rentalId);
  }
}
