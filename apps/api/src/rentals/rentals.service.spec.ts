import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { PrismaService } from '../prisma/prisma.service';
import { RentalStatus } from '@rentapp/shared';

const mockPrisma = {
  rental: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
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
    it('should return paginated rentals', async () => {
      const rentals = [baseDraftRental()];
      mockPrisma.rental.findMany.mockResolvedValue(rentals);
      mockPrisma.rental.count.mockResolvedValue(1);

      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
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

  // --- processReturn ---

  describe('processReturn', () => {
    it('should return an ACTIVE rental with mileage and set vehicle to AVAILABLE', async () => {
      const activeRental = baseDraftRental({
        status: RentalStatus.ACTIVE,
        vehicle: { ...mockVehicle, status: 'RENTED' },
      });
      const returnedRental = baseDraftRental({
        status: RentalStatus.RETURNED,
        returnMileage: 55000,
        returnData: null,
        vehicle: { ...mockVehicle, status: 'AVAILABLE' },
        handoverData: { mileage: 50000 },
      });

      mockPrisma.rental.findUnique
        .mockResolvedValueOnce(activeRental) // first call: find
        .mockResolvedValueOnce(returnedRental); // second call: re-fetch
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.update.mockResolvedValue(returnedRental);
      mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: 'AVAILABLE' });

      const result = await service.processReturn(
        RENTAL_ID,
        { returnMileage: 55000 },
        USER_ID,
      );

      expect(result.status).toBe(RentalStatus.RETURNED);
      expect(result.returnMileage).toBe(55000);
      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'AVAILABLE' }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rental.returned',
        expect.objectContaining({ rentalId: RENTAL_ID }),
      );
    });

    it('should return an EXTENDED rental and set vehicle to AVAILABLE', async () => {
      const extendedRental = baseDraftRental({
        status: RentalStatus.EXTENDED,
        vehicle: { ...mockVehicle, status: 'RENTED' },
      });
      const returnedRental = baseDraftRental({
        status: RentalStatus.RETURNED,
        returnMileage: 60000,
        vehicle: { ...mockVehicle, status: 'AVAILABLE' },
      });

      mockPrisma.rental.findUnique
        .mockResolvedValueOnce(extendedRental)
        .mockResolvedValueOnce(returnedRental);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.update.mockResolvedValue(returnedRental);
      mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: 'AVAILABLE' });

      const result = await service.processReturn(
        RENTAL_ID,
        { returnMileage: 60000 },
        USER_ID,
      );

      expect(result.status).toBe(RentalStatus.RETURNED);
    });

    it('should throw BadRequestException when returning a DRAFT rental', async () => {
      const draftRental = baseDraftRental({ status: RentalStatus.DRAFT });
      mockPrisma.rental.findUnique.mockResolvedValue(draftRental);

      await expect(
        service.processReturn(RENTAL_ID, { returnMileage: 55000 }, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should store returnData and include handoverData in response for comparison', async () => {
      const inspectionData = {
        mileage: 55000,
        areas: [{ area: 'front', condition: 'good' }],
      };
      const activeRental = baseDraftRental({
        status: RentalStatus.ACTIVE,
        handoverData: { mileage: 50000 },
        vehicle: { ...mockVehicle, status: 'RENTED' },
      });
      const returnedRental = baseDraftRental({
        status: RentalStatus.RETURNED,
        returnMileage: 55000,
        returnData: inspectionData,
        handoverData: { mileage: 50000 },
        vehicle: { ...mockVehicle, status: 'AVAILABLE' },
      });

      mockPrisma.rental.findUnique
        .mockResolvedValueOnce(activeRental)
        .mockResolvedValueOnce(returnedRental);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.update.mockResolvedValue(returnedRental);
      mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: 'AVAILABLE' });

      const result = await service.processReturn(
        RENTAL_ID,
        { returnMileage: 55000, returnData: inspectionData as any },
        USER_ID,
      );

      expect(result.returnData).toEqual(inspectionData);
      expect(result.handoverData).toEqual({ mileage: 50000 });
    });

    it('should work without returnData (only mileage required)', async () => {
      const activeRental = baseDraftRental({
        status: RentalStatus.ACTIVE,
        vehicle: { ...mockVehicle, status: 'RENTED' },
      });
      const returnedRental = baseDraftRental({
        status: RentalStatus.RETURNED,
        returnMileage: 55000,
        returnData: null,
        vehicle: { ...mockVehicle, status: 'AVAILABLE' },
      });

      mockPrisma.rental.findUnique
        .mockResolvedValueOnce(activeRental)
        .mockResolvedValueOnce(returnedRental);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.update.mockResolvedValue(returnedRental);
      mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: 'AVAILABLE' });

      const result = await service.processReturn(
        RENTAL_ID,
        { returnMileage: 55000 },
        USER_ID,
      );

      expect(result.status).toBe(RentalStatus.RETURNED);
      expect(result.returnMileage).toBe(55000);
    });

    it('should throw NotFoundException for non-existent rental', async () => {
      mockPrisma.rental.findUnique.mockResolvedValue(null);

      await expect(
        service.processReturn('non-existent', { returnMileage: 55000 }, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // --- extend ---

  describe('extend', () => {
    it('should extend an ACTIVE rental with recalculated pricing', async () => {
      const activeRental = baseDraftRental({
        status: RentalStatus.ACTIVE,
        dailyRateNet: 10000,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-06'),
      });
      const extendedRental = baseDraftRental({
        status: RentalStatus.EXTENDED,
        endDate: new Date('2026-04-10'),
        dailyRateNet: 10000,
        totalPriceNet: 90000,
        totalPriceGross: 110700,
      });

      mockPrisma.rental.findUnique.mockResolvedValue(activeRental);
      mockPrisma.$queryRaw.mockResolvedValue([]); // no overlaps
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.update.mockResolvedValue(extendedRental);

      const result = await service.extend(
        RENTAL_ID,
        { newEndDate: '2026-04-10T00:00:00Z' },
        USER_ID,
      );

      expect(result.status).toBe(RentalStatus.EXTENDED);
      expect(mockPrisma.rental.update).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rental.extended',
        expect.objectContaining({ rentalId: RENTAL_ID }),
      );
    });

    it('should extend an EXTENDED rental (stays EXTENDED)', async () => {
      const extendedRental = baseDraftRental({
        status: RentalStatus.EXTENDED,
        dailyRateNet: 10000,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-10'),
      });
      const reExtended = baseDraftRental({
        status: RentalStatus.EXTENDED,
        endDate: new Date('2026-04-15'),
        dailyRateNet: 10000,
        totalPriceNet: 140000,
      });

      mockPrisma.rental.findUnique.mockResolvedValue(extendedRental);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.update.mockResolvedValue(reExtended);

      const result = await service.extend(
        RENTAL_ID,
        { newEndDate: '2026-04-15T00:00:00Z' },
        USER_ID,
      );

      expect(result.status).toBe(RentalStatus.EXTENDED);
    });

    it('should use totalPriceNet override when provided', async () => {
      const activeRental = baseDraftRental({
        status: RentalStatus.ACTIVE,
        dailyRateNet: 10000,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-06'),
      });
      const extendedRental = baseDraftRental({
        status: RentalStatus.EXTENDED,
        endDate: new Date('2026-04-10'),
        totalPriceNet: 75000,
      });

      mockPrisma.rental.findUnique.mockResolvedValue(activeRental);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.update.mockResolvedValue(extendedRental);

      await service.extend(
        RENTAL_ID,
        { newEndDate: '2026-04-10T00:00:00Z', totalPriceNet: 75000 },
        USER_ID,
      );

      expect(mockPrisma.rental.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ totalPriceNet: 75000 }),
        }),
      );
    });

    it('should throw BadRequestException for DRAFT rental', async () => {
      const draftRental = baseDraftRental({ status: RentalStatus.DRAFT });
      mockPrisma.rental.findUnique.mockResolvedValue(draftRental);

      await expect(
        service.extend(RENTAL_ID, { newEndDate: '2026-04-10T00:00:00Z' }, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when extension causes overlap', async () => {
      const activeRental = baseDraftRental({
        status: RentalStatus.ACTIVE,
        dailyRateNet: 10000,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-06'),
      });
      const conflicts = [
        { id: 'other-rental', startDate: new Date('2026-04-08'), endDate: new Date('2026-04-12'), status: 'ACTIVE' },
      ];

      mockPrisma.rental.findUnique.mockResolvedValue(activeRental);
      mockPrisma.$queryRaw.mockResolvedValue(conflicts);

      await expect(
        service.extend(RENTAL_ID, { newEndDate: '2026-04-10T00:00:00Z' }, USER_ID),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for non-existent rental', async () => {
      mockPrisma.rental.findUnique.mockResolvedValue(null);

      await expect(
        service.extend('non-existent', { newEndDate: '2026-04-10T00:00:00Z' }, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // --- rollback ---

  describe('rollback', () => {
    it('should rollback RETURNED to ACTIVE and set vehicle to RENTED', async () => {
      const returnedRental = baseDraftRental({
        status: RentalStatus.RETURNED,
        returnMileage: 55000,
        returnData: { mileage: 55000 },
        vehicle: { ...mockVehicle, status: 'AVAILABLE' },
      });
      const rolledBackRental = baseDraftRental({
        status: RentalStatus.ACTIVE,
        returnMileage: null,
        returnData: null,
        vehicle: { ...mockVehicle, status: 'RENTED' },
      });

      mockPrisma.rental.findUnique
        .mockResolvedValueOnce(returnedRental)
        .mockResolvedValueOnce(rolledBackRental);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.update.mockResolvedValue(rolledBackRental);
      mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: 'RENTED' });

      const result = await service.rollback(
        RENTAL_ID,
        { targetStatus: RentalStatus.ACTIVE, reason: 'Wrongly marked as returned' },
        USER_ID,
      );

      expect(result.status).toBe(RentalStatus.ACTIVE);
      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'RENTED' }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rental.rolledBack',
        expect.objectContaining({
          rentalId: RENTAL_ID,
          from: RentalStatus.RETURNED,
          to: RentalStatus.ACTIVE,
          reason: 'Wrongly marked as returned',
        }),
      );
    });

    it('should rollback EXTENDED to ACTIVE', async () => {
      const extendedRental = baseDraftRental({
        status: RentalStatus.EXTENDED,
        vehicle: { ...mockVehicle, status: 'RENTED' },
      });
      const rolledBackRental = baseDraftRental({
        status: RentalStatus.ACTIVE,
        vehicle: { ...mockVehicle, status: 'RENTED' },
      });

      mockPrisma.rental.findUnique
        .mockResolvedValueOnce(extendedRental)
        .mockResolvedValueOnce(rolledBackRental);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.update.mockResolvedValue(rolledBackRental);
      mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: 'RENTED' });

      const result = await service.rollback(
        RENTAL_ID,
        { targetStatus: RentalStatus.ACTIVE, reason: 'Extension was a mistake' },
        USER_ID,
      );

      expect(result.status).toBe(RentalStatus.ACTIVE);
    });

    it('should rollback ACTIVE to DRAFT and set vehicle to AVAILABLE', async () => {
      const activeRental = baseDraftRental({
        status: RentalStatus.ACTIVE,
        vehicle: { ...mockVehicle, status: 'RENTED' },
      });
      const rolledBackRental = baseDraftRental({
        status: RentalStatus.DRAFT,
        vehicle: { ...mockVehicle, status: 'AVAILABLE' },
      });

      mockPrisma.rental.findUnique
        .mockResolvedValueOnce(activeRental)
        .mockResolvedValueOnce(rolledBackRental);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.update.mockResolvedValue(rolledBackRental);
      mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: 'AVAILABLE' });

      const result = await service.rollback(
        RENTAL_ID,
        { targetStatus: RentalStatus.DRAFT, reason: 'Created by mistake' },
        USER_ID,
      );

      expect(result.status).toBe(RentalStatus.DRAFT);
      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'AVAILABLE' }),
        }),
      );
    });

    it('should throw BadRequestException when rolling back from DRAFT', async () => {
      const draftRental = baseDraftRental({ status: RentalStatus.DRAFT });
      mockPrisma.rental.findUnique.mockResolvedValue(draftRental);

      await expect(
        service.rollback(
          RENTAL_ID,
          { targetStatus: RentalStatus.ACTIVE, reason: 'Invalid' },
          USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent rental', async () => {
      mockPrisma.rental.findUnique.mockResolvedValue(null);

      await expect(
        service.rollback(
          'non-existent',
          { targetStatus: RentalStatus.ACTIVE, reason: 'Test' },
          USER_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should clear returnMileage and returnData when rolling back from RETURNED', async () => {
      const returnedRental = baseDraftRental({
        status: RentalStatus.RETURNED,
        returnMileage: 55000,
        returnData: { mileage: 55000 },
        vehicle: { ...mockVehicle, status: 'AVAILABLE' },
      });
      const rolledBackRental = baseDraftRental({
        status: RentalStatus.ACTIVE,
        returnMileage: null,
        returnData: null,
        vehicle: { ...mockVehicle, status: 'RENTED' },
      });

      mockPrisma.rental.findUnique
        .mockResolvedValueOnce(returnedRental)
        .mockResolvedValueOnce(rolledBackRental);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.rental.update.mockResolvedValue(rolledBackRental);
      mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: 'RENTED' });

      await service.rollback(
        RENTAL_ID,
        { targetStatus: RentalStatus.ACTIVE, reason: 'Test' },
        USER_ID,
      );

      expect(mockPrisma.rental.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            returnMileage: null,
            returnData: expect.anything(),
          }),
        }),
      );
    });
  });
});
