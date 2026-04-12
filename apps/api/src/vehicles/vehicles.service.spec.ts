import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { VehicleStatus, FuelType, TransmissionType } from '@rentapp/shared';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let prisma: Record<string, any>;
  let storage: Record<string, any>;

  const mockVehicle = {
    id: '00000000-0000-4000-a000-000000000001',
    registration: 'WE12345',
    vin: 'WVWZZZ3CZWE123456',
    make: 'Volkswagen',
    model: 'Golf',
    year: 2022,
    color: 'Silver',
    fuelType: FuelType.PETROL,
    transmission: TransmissionType.MANUAL,
    seatCount: 5,
    mileage: 45000,
    notes: null,
    status: VehicleStatus.AVAILABLE,
    photoKey: null,
    isArchived: false,
    insurance: null,
    inspection: null,
    documents: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      vehicle: {
        create: jest.fn().mockResolvedValue(mockVehicle),
        findMany: jest.fn().mockResolvedValue([mockVehicle]),
        findUnique: jest.fn().mockResolvedValue(mockVehicle),
        update: jest.fn().mockResolvedValue(mockVehicle),
      },
      vehicleDocument: {
        create: jest.fn().mockResolvedValue({
          id: 'doc-1',
          vehicleId: mockVehicle.id,
          label: 'insurance_policy',
          fileKey: 'vehicles/1/documents/insurance_policy-uuid.pdf',
          fileName: 'policy.pdf',
          mimeType: 'application/pdf',
        }),
      },
    };

    storage = {
      upload: jest.fn().mockResolvedValue('key'),
      getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://presigned-url'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  it('create() calls prisma.vehicle.create with correct data shape including nested insurance', async () => {
    const dto = {
      registration: 'WE12345',
      vin: 'WVWZZZ3CZWE123456',
      make: 'Volkswagen',
      model: 'Golf',
      year: 2022,
      fuelType: FuelType.PETROL,
      transmission: TransmissionType.MANUAL,
      vehicleClassId: '00000000-0000-0000-0000-000000000001',
      insurance: {
        companyName: 'PZU',
        policyNumber: 'ABC123',
        expiryDate: '2026-12-31',
        coverageType: 'OC' as any,
      },
    };

    await service.create(dto);

    expect(prisma.vehicle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          registration: 'WE12345',
          vin: 'WVWZZZ3CZWE123456',
          insurance: expect.objectContaining({
            create: expect.objectContaining({
              companyName: 'PZU',
              policyNumber: 'ABC123',
            }),
          }),
        }),
        include: expect.objectContaining({
          insurance: true,
          inspection: true,
          documents: true,
        }),
      }),
    );
  });

  it('findAll() filters by isArchived: false by default', async () => {
    await service.findAll();

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isArchived: false },
      }),
    );
  });

  it('findAll("all") does NOT filter by isArchived', async () => {
    await service.findAll('all');

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
  });

  it('findAll("archived") filters by isArchived: true', async () => {
    await service.findAll('archived');

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isArchived: true },
      }),
    );
  });

  it('findOne() throws NotFoundException for non-existent ID', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(null);

    await expect(service.findOne('nonexistent-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update() builds correct oldValues diff', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
    prisma.vehicle.update.mockResolvedValue({
      ...mockVehicle,
      color: 'Red',
      mileage: 50000,
    });

    const result = await service.update(mockVehicle.id, {
      color: 'Red',
      mileage: 50000,
    });

    expect(result.oldValues).toEqual(
      expect.objectContaining({
        color: { old: 'Silver', new: 'Red' },
        mileage: { old: 45000, new: 50000 },
      }),
    );
  });

  it('update() rejects status change to RENTED (BadRequestException)', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

    await expect(
      service.update(mockVehicle.id, { status: VehicleStatus.RENTED }),
    ).rejects.toThrow(BadRequestException);
  });

  it('update() rejects reactivating RETIRED vehicle to AVAILABLE (BadRequestException)', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      ...mockVehicle,
      status: VehicleStatus.RETIRED,
    });

    await expect(
      service.update(mockVehicle.id, { status: VehicleStatus.AVAILABLE }),
    ).rejects.toThrow(BadRequestException);
  });

  it('update() allows setting status to SERVICE', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
    prisma.vehicle.update.mockResolvedValue({
      ...mockVehicle,
      status: VehicleStatus.SERVICE,
    });

    const result = await service.update(mockVehicle.id, {
      status: VehicleStatus.SERVICE,
    });

    expect(result.vehicle.status).toBe(VehicleStatus.SERVICE);
  });

  it('archive() sets isArchived=true and status=RETIRED', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
    prisma.vehicle.update.mockResolvedValue({
      ...mockVehicle,
      isArchived: true,
      status: VehicleStatus.RETIRED,
    });

    const result = await service.archive(mockVehicle.id);

    expect(prisma.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isArchived: true, status: VehicleStatus.RETIRED },
      }),
    );
    expect(result.isArchived).toBe(true);
    expect(result.status).toBe(VehicleStatus.RETIRED);
  });

  it('update() rejects status change to RESERVED (BadRequestException)', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

    await expect(
      service.update(mockVehicle.id, { status: VehicleStatus.RESERVED }),
    ).rejects.toThrow(BadRequestException);
  });
});
