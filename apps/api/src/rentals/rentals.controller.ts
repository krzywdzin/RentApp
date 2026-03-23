import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { UserRole, RentalStatus } from '@rentapp/shared';
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
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.rentalsService.create(dto, userId);

    // If overlap detected and no override, return 409 Conflict
    if (result.conflicts) {
      res.status(HttpStatus.CONFLICT);
      return { conflicts: result.conflicts };
    }

    res.status(HttpStatus.CREATED);
    return {
      ...result,
      __audit: {
        action: 'rental.create',
        entityType: 'Rental',
        entityId: result.id,
        changes: { status: result.status },
      },
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findAll(@Query('status') status?: RentalStatus) {
    return this.rentalsService.findAll(status);
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
    return this.rentalsService.processReturn(id, dto, userId);
  }

  @Patch(':id/extend')
  @Roles(UserRole.ADMIN)
  async extend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtendRentalDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rentalsService.extend(id, dto, userId);
  }

  @Patch(':id/rollback')
  @Roles(UserRole.ADMIN)
  async rollback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RollbackRentalDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rentalsService.rollback(id, dto, userId);
  }
}
