import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { RentalDto, CalendarResponse } from '@rentapp/shared';
import { CreateRentalDto } from './dto/create-rental.dto';
import { ActivateRentalDto } from './dto/activate-rental.dto';
import { ExtendRentalDto } from './dto/extend-rental.dto';
import { ReturnRentalDto } from './dto/return-rental.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { RollbackRentalDto } from './dto/rollback-rental.dto';

@Injectable()
export class RentalsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // TODO: Implement in Plan 02
  async create(dto: CreateRentalDto, userId: string): Promise<RentalDto> {
    throw new Error('Not implemented');
  }

  // TODO: Implement in Plan 02
  async findAll(): Promise<RentalDto[]> {
    throw new Error('Not implemented');
  }

  // TODO: Implement in Plan 02
  async findOne(id: string): Promise<RentalDto> {
    throw new Error('Not implemented');
  }

  // TODO: Implement in Plan 02
  async activate(id: string, dto: ActivateRentalDto, userId: string): Promise<RentalDto> {
    throw new Error('Not implemented');
  }

  // TODO: Implement in Plan 02
  async processReturn(id: string, dto: ReturnRentalDto, userId: string): Promise<RentalDto> {
    throw new Error('Not implemented');
  }

  // TODO: Implement in Plan 02
  async extend(id: string, dto: ExtendRentalDto, userId: string): Promise<RentalDto> {
    throw new Error('Not implemented');
  }

  // TODO: Implement in Plan 02
  async rollback(id: string, dto: RollbackRentalDto, userId: string): Promise<RentalDto> {
    throw new Error('Not implemented');
  }

  // TODO: Implement in Plan 03
  async getCalendar(query: CalendarQueryDto): Promise<CalendarResponse> {
    throw new Error('Not implemented');
  }

  // TODO: Implement in Plan 02
  async checkOverlap(vehicleId: string, startDate: Date, endDate: Date, excludeRentalId?: string): Promise<boolean> {
    throw new Error('Not implemented');
  }
}
