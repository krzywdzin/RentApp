import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { PrismaService } from '../prisma/prisma.service';
import { RentalStatus } from '@rentapp/shared';

const mockPrisma = {
  rental: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  vehicle: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  customer: {
    findUnique: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

const VEHICLE_ID = '00000000-0000-4000-8000-000000000001';
const CUSTOMER_ID = '00000000-0000-4000-8000-000000000002';
const USER_ID = '00000000-0000-4000-8000-000000000003';
const RENTAL_ID = '00000000-0000-4000-8000-000000000010';

const mockVehicle = {
  id: VEHICLE_ID,
  registration: 'WE12345',
  make: 'Toyota',
  model: 'Corolla',
  status: 'AVAILABLE',
  isArchived: false,
};

const mockCustomer = {
  id: CUSTOMER_ID,
  firstName: 'Jan',
  lastName: 'Kowalski',
};

function baseDraftRental(overrides: Record<string, unknown> = {}) {
  return {
    id: RENTAL_ID,
    vehicleId: VEHICLE_ID,
    customerId: CUSTOMER_ID,
    createdById: USER_ID,
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-04-06'),
    status: RentalStatus.DRAFT,
    dailyRateNet: 10000,
    totalPriceNet: 50000,
    totalPriceGross: 61500,
    vatRate: 23,
    handoverData: null,
    returnData: null,
    returnMileage: null,
    notes: null,
    overrodeConflict: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    vehicle: mockVehicle,
    customer: mockCustomer,
    ...overrides,
  };
}

describe('RentalsService', () => {
  let service: RentalsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<RentalsService>(RentalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Creation ---

  describe('create', () => {
    it('should create a rental in DRAFT status by default', async () => {
      const rental = baseDraftRental();
      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.create.mockResolvedValue(rental);

      const result = await service.create(
        {
          vehicleId: VEHICLE_ID,
          customerId: CUSTOMER_ID,
          startDate: '2026-04-01T00:00:00Z',
          endDate: '2026-04-06T00:00:00Z',
          dailyRateNet: 10000,
        },
        USER_ID,
      );

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('conflicts');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rental.created',
        expect.any(Object),
      );
    });

    it('should create a rental in ACTIVE status when requested, setting vehicle to RENTED', async () => {
      const rental = baseDraftRental({
        status: RentalStatus.ACTIVE,
        handoverData: { mileage: 50000 },
      });
      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.create.mockResolvedValue(rental);
      mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: 'RENTED' });

      const result = await service.create(
        {
          vehicleId: VEHICLE_ID,
          customerId: CUSTOMER_ID,
          startDate: '2026-04-01T00:00:00Z',
          endDate: '2026-04-06T00:00:00Z',
          dailyRateNet: 10000,
          status: RentalStatus.ACTIVE,
          handoverData: { mileage: 50000 },
        },
        USER_ID,
      );

      expect(result).toBeDefined();
      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'RENTED' }),
        }),
      );
    });

    it('should calculate pricing from daily rate', async () => {
      const rental = baseDraftRental({
        dailyRateNet: 10000,
        totalPriceNet: 50000,
        totalPriceGross: 61500,
      });
      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.create.mockResolvedValue(rental);

      await service.create(
        {
          vehicleId: VEHICLE_ID,
          customerId: CUSTOMER_ID,
          startDate: '2026-04-01T00:00:00Z',
          endDate: '2026-04-06T00:00:00Z',
          dailyRateNet: 10000,
        },
        USER_ID,
      );

      expect(mockPrisma.rental.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dailyRateNet: 10000,
            totalPriceNet: 50000,
            totalPriceGross: 61500,
          }),
        }),
      );
    });

    it('should calculate pricing from total price', async () => {
      const rental = baseDraftRental({
        dailyRateNet: 10000,
        totalPriceNet: 50000,
        totalPriceGross: 61500,
      });
      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.create.mockResolvedValue(rental);

      await service.create(
        {
          vehicleId: VEHICLE_ID,
          customerId: CUSTOMER_ID,
          startDate: '2026-04-01T00:00:00Z',
          endDate: '2026-04-06T00:00:00Z',
          totalPriceNet: 50000,
        },
        USER_ID,
      );

      expect(mockPrisma.rental.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dailyRateNet: 10000,
            totalPriceNet: 50000,
          }),
        }),
      );
    });

    it('should detect overlapping rentals and return conflicts when overrideConflict is false', async () => {
      const conflicting = [
        { id: 'conflict-1', startDate: new Date('2026-04-03'), endDate: new Date('2026-04-08'), status: 'ACTIVE' },
      ];
      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.$queryRaw.mockResolvedValue(conflicting);

      const result = await service.create(
        {
          vehicleId: VEHICLE_ID,
          customerId: CUSTOMER_ID,
          startDate: '2026-04-01T00:00:00Z',
          endDate: '2026-04-06T00:00:00Z',
          dailyRateNet: 10000,
        },
        USER_ID,
      );

      expect(result).toHaveProperty('conflicts');
      expect((result as any).conflicts).toHaveLength(1);
      expect((result as any).rental).toBeNull();
    });

    it('should allow creation with override when overlap exists', async () => {
      const conflicting = [
        { id: 'conflict-1', startDate: new Date('2026-04-03'), endDate: new Date('2026-04-08'), status: 'ACTIVE' },
      ];
      const rental = baseDraftRental({ overrodeConflict: true });
      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.$queryRaw.mockResolvedValue(conflicting);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.create.mockResolvedValue(rental);

      const result = await service.create(
        {
          vehicleId: VEHICLE_ID,
          customerId: CUSTOMER_ID,
          startDate: '2026-04-01T00:00:00Z',
          endDate: '2026-04-06T00:00:00Z',
          dailyRateNet: 10000,
          overrideConflict: true,
        },
        USER_ID,
      );

      expect(result).not.toHaveProperty('conflicts');
      expect(mockPrisma.rental.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ overrodeConflict: true }),
        }),
      );
    });
  });

  // --- State machine / activate ---

  describe('activate', () => {
    it('should transition DRAFT to ACTIVE and set vehicle to RENTED', async () => {
      const draftRental = baseDraftRental();
      const activeRental = baseDraftRental({
        status: RentalStatus.ACTIVE,
        handoverData: { mileage: 45000 },
      });
      mockPrisma.rental.findUnique.mockResolvedValue(draftRental);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.update.mockResolvedValue(activeRental);
      mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: 'RENTED' });

      const result = await service.activate(
        RENTAL_ID,
        { handoverData: { mileage: 45000 } },
        USER_ID,
      );

      expect(result).toBeDefined();
      expect(mockPrisma.rental.update).toHaveBeenCalled();
      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'RENTED' }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rental.activated',
        expect.any(Object),
      );
    });

    it('should throw BadRequestException for non-DRAFT rental', async () => {
      const activeRental = baseDraftRental({ status: RentalStatus.ACTIVE });
      mockPrisma.rental.findUnique.mockResolvedValue(activeRental);

      await expect(
        service.activate(RENTAL_ID, { handoverData: { mileage: 45000 } }, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // --- findAll / findOne ---

  describe('findAll', () => {
    it('should return all rentals', async () => {
      const rentals = [baseDraftRental()];
      mockPrisma.rental.findMany.mockResolvedValue(rentals);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(mockPrisma.rental.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a rental by id', async () => {
      const rental = baseDraftRental();
      mockPrisma.rental.findUnique.mockResolvedValue(rental);

      const result = await service.findOne(RENTAL_ID);
      expect(result.id).toBe(RENTAL_ID);
    });

    it('should throw NotFoundException for non-existent id', async () => {
      mockPrisma.rental.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- checkOverlap ---

  describe('checkOverlap', () => {
    it('should use raw SQL with tstzrange for overlap detection', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.checkOverlap(
        VEHICLE_ID,
        new Date('2026-04-01'),
        new Date('2026-04-06'),
      );

      expect(result).toEqual([]);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return conflicting rentals', async () => {
      const conflicts = [
        { id: 'c1', startDate: new Date('2026-04-03'), endDate: new Date('2026-04-08'), status: 'ACTIVE' },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(conflicts);

      const result = await service.checkOverlap(
        VEHICLE_ID,
        new Date('2026-04-01'),
        new Date('2026-04-06'),
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c1');
    });

    it('should exclude a specific rental id when provided', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await service.checkOverlap(
        VEHICLE_ID,
        new Date('2026-04-01'),
        new Date('2026-04-06'),
        RENTAL_ID,
      );

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });
  });

  // --- Calendar ---

  describe('getCalendar', () => {
    it('should return calendar data grouped by vehicle', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([mockVehicle]);
      mockPrisma.rental.findMany.mockResolvedValue([
        baseDraftRental({
          status: RentalStatus.ACTIVE,
          customer: mockCustomer,
        }),
      ]);

      const result = await service.getCalendar({
        from: '2026-04-01T00:00:00Z',
        to: '2026-04-30T00:00:00Z',
      });

      expect(result).toHaveProperty('vehicles');
      expect(result).toHaveProperty('period');
      expect(result.vehicles).toHaveLength(1);
      expect(result.vehicles[0].rentals).toHaveLength(1);
      expect(result.vehicles[0].registration).toBe('WE12345');
    });

    it('should return empty rentals array for vehicles with no rentals in range', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([mockVehicle]);
      mockPrisma.rental.findMany.mockResolvedValue([]);

      const result = await service.getCalendar({
        from: '2026-05-01T00:00:00Z',
        to: '2026-05-31T00:00:00Z',
      });

      expect(result.vehicles).toHaveLength(1);
      expect(result.vehicles[0].rentals).toHaveLength(0);
    });
  });
});
