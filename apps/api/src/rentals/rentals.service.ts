import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
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

export interface OverlapConflict {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

const RENTAL_INCLUDE = {
  vehicle: true,
  customer: true,
} as const;

export type RentalWithRelations = Prisma.RentalGetPayload<{
  include: typeof RENTAL_INCLUDE;
}>;

export interface RentalAuditResult extends RentalWithRelations {
  __audit: {
    action: string;
    entityType: string;
    entityId: string;
    changes: Record<string, unknown>;
  };
}

@Injectable()
export class RentalsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    dto: CreateRentalDto,
    userId: string,
  ): Promise<RentalWithRelations | { rental: null; conflicts: OverlapConflict[] }> {
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
    const rental = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
          handoverData: dto.handoverData ? (dto.handoverData as unknown as Prisma.InputJsonValue) : undefined,
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

  async findAll(status?: RentalStatus, customerId?: string, vehicleId?: string): Promise<RentalWithRelations[]> {
    const where: Prisma.RentalWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    return this.prisma.rental.findMany({
      where,
      include: RENTAL_INCLUDE,
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string): Promise<RentalWithRelations> {
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
  ): Promise<RentalWithRelations> {
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
    const updated = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedRental = await tx.rental.update({
        where: { id },
        data: {
          status: RentalStatus.ACTIVE,
          handoverData: dto.handoverData ? (dto.handoverData as unknown as Prisma.InputJsonValue) : undefined,
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

  async processReturn(id: string, dto: ReturnRentalDto, userId: string): Promise<RentalAuditResult> {
    // 1. Find rental with vehicle
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: RENTAL_INCLUDE,
    });
    if (!rental) {
      throw new NotFoundException(`Rental with ID "${id}" not found`);
    }

    // 2. Validate transition (only ACTIVE and EXTENDED can return)
    const oldStatus = rental.status;
    validateTransition(rental.status as RentalStatus, RentalStatus.RETURNED);

    // 3. Transaction: update rental + vehicle
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.rental.update({
        where: { id },
        data: {
          status: RentalStatus.RETURNED,
          returnMileage: dto.returnMileage,
          returnData: dto.returnData ? (dto.returnData as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          ...(dto.notes ? { notes: dto.notes } : {}),
        },
      });

      await tx.vehicle.update({
        where: { id: rental.vehicleId },
        data: { status: 'AVAILABLE' },
      });
    });

    // 4. Re-fetch with includes for full data (handoverData + returnData)
    const updated = await this.prisma.rental.findUnique({
      where: { id },
      include: RENTAL_INCLUDE,
    });
    if (!updated) {
      throw new NotFoundException('Rental not found after processing return');
    }

    // 5. Emit event
    this.eventEmitter.emit('rental.returned', {
      rentalId: id,
      vehicleId: rental.vehicleId,
      customerId: rental.customerId,
      returnedBy: userId,
    });

    // 6. Return with audit metadata
    return {
      ...updated,
      __audit: {
        action: 'rental.return',
        entityType: 'Rental',
        entityId: id,
        changes: { status: { old: oldStatus, new: RentalStatus.RETURNED } },
      },
    };
  }

  async extend(id: string, dto: ExtendRentalDto, userId: string): Promise<RentalAuditResult> {
    // 1. Find rental
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: RENTAL_INCLUDE,
    });
    if (!rental) {
      throw new NotFoundException(`Rental with ID "${id}" not found`);
    }

    // 2. Validate transition
    const oldStatus = rental.status;
    validateTransition(rental.status as RentalStatus, RentalStatus.EXTENDED);

    // 3. Parse and validate newEndDate
    const newEndDate = new Date(dto.newEndDate);
    if (newEndDate <= rental.startDate) {
      throw new BadRequestException('New end date must be after start date');
    }

    // 4. Check overlaps with new date range
    const conflicts = await this.checkOverlap(
      rental.vehicleId,
      rental.startDate,
      newEndDate,
      id,
    );
    if (conflicts.length > 0) {
      throw new ConflictException({
        message: 'Extension would cause scheduling conflict',
        conflicts,
      });
    }

    // 5. Calculate new pricing
    const newDays = Math.max(
      1,
      Math.ceil(
        (newEndDate.getTime() - rental.startDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    let totalPriceNet: number;
    let totalPriceGross: number;
    let dailyRateNet = rental.dailyRateNet;

    if (dto.totalPriceNet != null) {
      // Admin override
      totalPriceNet = dto.totalPriceNet;
      totalPriceGross = Math.round(totalPriceNet * (1 + rental.vatRate / 100));
    } else {
      const pricing = calculatePricing({
        dailyRateNet: rental.dailyRateNet,
        days: newDays,
        vatRate: rental.vatRate,
      });
      totalPriceNet = pricing.totalPriceNet;
      totalPriceGross = pricing.totalPriceGross;
      dailyRateNet = pricing.dailyRateNet;
    }

    // 6. Transaction: update rental
    const updated = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return tx.rental.update({
        where: { id },
        data: {
          status: RentalStatus.EXTENDED,
          endDate: newEndDate,
          dailyRateNet,
          totalPriceNet,
          totalPriceGross,
          ...(dto.notes ? { notes: dto.notes } : {}),
        },
        include: RENTAL_INCLUDE,
      });
    });

    // 7. Emit event
    this.eventEmitter.emit('rental.extended', {
      rentalId: id,
      customerId: rental.customerId,
      newEndDate: newEndDate.toISOString(),
      extendedBy: userId,
    });

    // 8. Return with audit metadata
    return {
      ...updated,
      __audit: {
        action: 'rental.extend',
        entityType: 'Rental',
        entityId: id,
        changes: {
          status: { old: oldStatus, new: RentalStatus.EXTENDED },
          endDate: { old: rental.endDate, new: newEndDate },
        },
      },
    };
  }

  async rollback(id: string, dto: RollbackRentalDto, userId: string): Promise<RentalAuditResult> {
    // 1. Find rental
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: RENTAL_INCLUDE,
    });
    if (!rental) {
      throw new NotFoundException(`Rental with ID "${id}" not found`);
    }

    // 2. Validate admin rollback transition
    const oldStatus = rental.status as RentalStatus;
    validateTransition(oldStatus, dto.targetStatus, true);

    // 3. Determine vehicle status side effect
    const vehicleStatus =
      dto.targetStatus === RentalStatus.DRAFT ? 'AVAILABLE' : 'RENTED';

    // 4. Determine if we should clear return data
    const clearReturnData = oldStatus === RentalStatus.RETURNED;

    // 5. Transaction: update rental + vehicle
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.rental.update({
        where: { id },
        data: {
          status: dto.targetStatus,
          ...(clearReturnData
            ? { returnMileage: null, returnData: Prisma.JsonNull }
            : {}),
        },
      });

      await tx.vehicle.update({
        where: { id: rental.vehicleId },
        data: { status: vehicleStatus },
      });
    });

    // 6. Re-fetch
    const updated = await this.prisma.rental.findUnique({
      where: { id },
      include: RENTAL_INCLUDE,
    });
    if (!updated) {
      throw new NotFoundException('Rental not found after rollback');
    }

    // 7. Emit event
    this.eventEmitter.emit('rental.rolledBack', {
      rentalId: id,
      from: oldStatus,
      to: dto.targetStatus,
      reason: dto.reason,
      rolledBackBy: userId,
    });

    // 8. Return with audit metadata
    return {
      ...updated,
      __audit: {
        action: 'rental.rollback',
        entityType: 'Rental',
        entityId: id,
        changes: {
          status: { old: oldStatus, new: dto.targetStatus },
          reason: dto.reason,
        },
      },
    };
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
          customerName: `${r.customer.firstName} ${r.customer.lastName}`,
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

  async delete(id: string): Promise<RentalWithRelations> {
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: RENTAL_INCLUDE,
    });
    if (!rental) {
      throw new NotFoundException(`Rental with ID "${id}" not found`);
    }

    if (rental.status !== RentalStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT rentals can be deleted');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.contractSignature.deleteMany({
        where: { contract: { rentalId: id } },
      });
      await tx.contract.deleteMany({
        where: { rentalId: id },
      });
      await tx.rental.delete({
        where: { id },
      });
    });

    return rental;
  }

  async checkOverlap(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeRentalId?: string,
  ): Promise<OverlapConflict[]> {
    const conflicts = await this.prisma.$queryRaw<OverlapConflict[]>`
      SELECT id, "startDate", "endDate", status
      FROM rentals
      WHERE "vehicleId" = ${vehicleId}
        AND status NOT IN ('RETURNED')
        AND tstzrange("startDate", "endDate", '[)') && tstzrange(${startDate}::timestamptz, ${endDate}::timestamptz, '[)')
        AND (${excludeRentalId}::text IS NULL OR id::text != ${excludeRentalId}::text)
    `;

    return conflicts;
  }
}
