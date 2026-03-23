import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  RentalStatus,
  CalendarResponse,
  CalendarVehicleEntry,
  CalendarRentalEntry,
} from '@rentapp/shared';
import { CreateRentalDto } from './dto/create-rental.dto';
import { ActivateRentalDto } from './dto/activate-rental.dto';
import { ExtendRentalDto } from './dto/extend-rental.dto';
import { ReturnRentalDto } from './dto/return-rental.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { RollbackRentalDto } from './dto/rollback-rental.dto';
import { validateTransition } from './constants/rental-transitions';
import { calculatePricing } from './utils/pricing';

interface OverlapConflict {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

const RENTAL_INCLUDE = {
  vehicle: true,
  customer: true,
};

@Injectable()
export class RentalsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    dto: CreateRentalDto,
    userId: string,
  ): Promise<any> {
    // 1. Validate vehicle exists and is not RETIRED
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID "${dto.vehicleId}" not found`);
    }
    if (vehicle.status === 'RETIRED') {
      throw new BadRequestException('Cannot create rental for a retired vehicle');
    }

    // 2. Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${dto.customerId}" not found`);
    }

    // 3. Calculate days
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const days = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    // 4. Calculate pricing
    const pricing = calculatePricing({
      totalPriceNet: dto.totalPriceNet,
      dailyRateNet: dto.dailyRateNet,
      days,
      vatRate: dto.vatRate,
    });

    // 5. Check overlap
    const conflicts = await this.checkOverlap(dto.vehicleId, startDate, endDate);

    // 6. If conflicts and no override, return conflict response
    if (conflicts.length > 0 && !dto.overrideConflict) {
      return { rental: null, conflicts };
    }

    // 7. Create in transaction
    const status = dto.status ?? RentalStatus.DRAFT;
    const rental = await this.prisma.$transaction(async (tx: any) => {
      const created = await tx.rental.create({
        data: {
          vehicleId: dto.vehicleId,
          customerId: dto.customerId,
          createdById: userId,
          startDate,
          endDate,
          status,
          dailyRateNet: pricing.dailyRateNet,
          totalPriceNet: pricing.totalPriceNet,
          totalPriceGross: pricing.totalPriceGross,
          vatRate: pricing.vatRate,
          handoverData: dto.handoverData ? (dto.handoverData as any) : undefined,
          notes: dto.notes,
          overrodeConflict: conflicts.length > 0,
        },
        include: RENTAL_INCLUDE,
      });

      // If ACTIVE, update vehicle status
      if (status === RentalStatus.ACTIVE) {
        await tx.vehicle.update({
          where: { id: dto.vehicleId },
          data: { status: 'RENTED' },
        });
      }

      return created;
    });

    // 8. Emit event
    this.eventEmitter.emit('rental.created', { rental });

    // 9. Return
    return rental;
  }

  async findAll(status?: RentalStatus): Promise<any[]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.rental.findMany({
      where,
      include: RENTAL_INCLUDE,
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string): Promise<any> {
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: RENTAL_INCLUDE,
    });
    if (!rental) {
      throw new NotFoundException(`Rental with ID "${id}" not found`);
    }
    return rental;
  }

  async activate(
    id: string,
    dto: ActivateRentalDto,
    userId: string,
  ): Promise<any> {
    // 1. Find rental
    const rental = await this.prisma.rental.findUnique({
      where: { id },
    });
    if (!rental) {
      throw new NotFoundException(`Rental with ID "${id}" not found`);
    }

    // 2. Validate transition
    validateTransition(rental.status as RentalStatus, RentalStatus.ACTIVE);

    // 3. Transaction: update rental + vehicle
    const updated = await this.prisma.$transaction(async (tx: any) => {
      const updatedRental = await tx.rental.update({
        where: { id },
        data: {
          status: RentalStatus.ACTIVE,
          handoverData: dto.handoverData ? (dto.handoverData as any) : undefined,
        },
        include: RENTAL_INCLUDE,
      });

      await tx.vehicle.update({
        where: { id: rental.vehicleId },
        data: { status: 'RENTED' },
      });

      return updatedRental;
    });

    // 4. Emit event
    this.eventEmitter.emit('rental.activated', { rental: updated });

    // 5. Return
    return updated;
  }

  // TODO: Implement in Plan 03
  async processReturn(id: string, dto: ReturnRentalDto, userId: string): Promise<any> {
    throw new Error('Not implemented');
  }

  // TODO: Implement in Plan 03
  async extend(id: string, dto: ExtendRentalDto, userId: string): Promise<any> {
    throw new Error('Not implemented');
  }

  // TODO: Implement in Plan 03
  async rollback(id: string, dto: RollbackRentalDto, userId: string): Promise<any> {
    throw new Error('Not implemented');
  }

  async getCalendar(query: CalendarQueryDto): Promise<CalendarResponse> {
    const from = new Date(query.from);
    const to = new Date(query.to);

    // 1. Find all non-archived vehicles
    const vehicles = await this.prisma.vehicle.findMany({
      where: { isArchived: false },
      orderBy: { registration: 'asc' },
    });

    // 2. Find all rentals in the date range
    const rentals = await this.prisma.rental.findMany({
      where: {
        startDate: { lte: to },
        endDate: { gte: from },
      },
      include: { customer: true },
      orderBy: { startDate: 'asc' },
    });

    // 3. Group rentals by vehicleId
    const rentalsByVehicle = new Map<string, typeof rentals>();
    for (const rental of rentals) {
      const existing = rentalsByVehicle.get(rental.vehicleId) || [];
      existing.push(rental);
      rentalsByVehicle.set(rental.vehicleId, existing);
    }

    // 4. Build calendar response
    const calendarVehicles: CalendarVehicleEntry[] = vehicles.map((v) => {
      const vehicleRentals = rentalsByVehicle.get(v.id) || [];

      const calendarRentals: CalendarRentalEntry[] = vehicleRentals.map((r) => {
        // Check if this rental overlaps with any other rental for the same vehicle
        const hasConflict = vehicleRentals.some(
          (other) =>
            other.id !== r.id &&
            other.startDate < r.endDate &&
            other.endDate > r.startDate,
        );

        return {
          id: r.id,
          startDate: r.startDate.toISOString(),
          endDate: r.endDate.toISOString(),
          status: r.status as RentalStatus,
          customerName: `${(r as any).customer.firstName} ${(r as any).customer.lastName}`,
          hasConflict,
        };
      });

      return {
        id: v.id,
        registration: v.registration,
        make: v.make,
        model: v.model,
        rentals: calendarRentals,
      };
    });

    return {
      vehicles: calendarVehicles,
      period: { from: query.from, to: query.to },
    };
  }

  async checkOverlap(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeRentalId?: string,
  ): Promise<OverlapConflict[]> {
    const conflicts = await this.prisma.$queryRaw<OverlapConflict[]>`
      SELECT id, start_date as "startDate", end_date as "endDate", status
      FROM rentals
      WHERE vehicle_id = ${vehicleId}
        AND status NOT IN ('RETURNED')
        AND tstzrange(start_date, end_date, '[)') && tstzrange(${startDate}::timestamptz, ${endDate}::timestamptz, '[)')
        AND (${excludeRentalId}::text IS NULL OR id::text != ${excludeRentalId}::text)
    `;

    return conflicts;
  }
}
