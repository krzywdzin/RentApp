import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@rentapp/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { ActivateRentalDto } from './dto/activate-rental.dto';
import { ExtendRentalDto } from './dto/extend-rental.dto';
import { ReturnRentalDto } from './dto/return-rental.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { RollbackRentalDto } from './dto/rollback-rental.dto';

@Controller('rentals')
export class RentalsController {
  constructor(private rentalsService: RentalsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async create(
    @Body() dto: CreateRentalDto,
    @CurrentUser('id') userId: string,
  ) {
    const rental = await this.rentalsService.create(dto, userId);
    return {
      ...rental,
      __audit: {
        action: 'rental.create',
        entityType: 'Rental',
        entityId: rental.id,
        changes: {},
      },
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findAll() {
    return this.rentalsService.findAll();
  }

  @Get('calendar')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getCalendar(@Query() query: CalendarQueryDto) {
    return this.rentalsService.getCalendar(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rentalsService.findOne(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActivateRentalDto,
    @CurrentUser('id') userId: string,
  ) {
    const rental = await this.rentalsService.activate(id, dto, userId);
    return {
      ...rental,
      __audit: {
        action: 'rental.activate',
        entityType: 'Rental',
        entityId: id,
        changes: { status: { old: 'DRAFT', new: 'ACTIVE' } },
      },
    };
  }

  @Patch(':id/return')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async processReturn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnRentalDto,
    @CurrentUser('id') userId: string,
  ) {
    const rental = await this.rentalsService.processReturn(id, dto, userId);
    return {
      ...rental,
      __audit: {
        action: 'rental.return',
        entityType: 'Rental',
        entityId: id,
        changes: { status: { old: rental.status, new: 'RETURNED' } },
      },
    };
  }

  @Patch(':id/extend')
  @Roles(UserRole.ADMIN)
  async extend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtendRentalDto,
    @CurrentUser('id') userId: string,
  ) {
    const rental = await this.rentalsService.extend(id, dto, userId);
    return {
      ...rental,
      __audit: {
        action: 'rental.extend',
        entityType: 'Rental',
        entityId: id,
        changes: { endDate: { old: null, new: rental.endDate } },
      },
    };
  }

  @Patch(':id/rollback')
  @Roles(UserRole.ADMIN)
  async rollback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RollbackRentalDto,
    @CurrentUser('id') userId: string,
  ) {
    const rental = await this.rentalsService.rollback(id, dto, userId);
    return {
      ...rental,
      __audit: {
        action: 'rental.rollback',
        entityType: 'Rental',
        entityId: id,
        changes: { status: { old: null, new: rental.status }, reason: dto.reason },
      },
    };
  }
}
