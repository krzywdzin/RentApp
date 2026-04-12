import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VehicleClassesService } from './vehicle-classes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VehicleClassesService', () => {
  let service: VehicleClassesService;
  let prisma: {
    vehicleClass: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    vehicle: {
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      vehicleClass: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      vehicle: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleClassesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<VehicleClassesService>(VehicleClassesService);
  });

  describe('findAll', () => {
    it('should return all vehicle classes ordered by name', async () => {
      const classes = [
        { id: '1', name: 'Economy' },
        { id: '2', name: 'Premium' },
      ];
      prisma.vehicleClass.findMany.mockResolvedValue(classes);

      const result = await service.findAll();

      expect(result).toEqual(classes);
      expect(prisma.vehicleClass.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should create and return a vehicle class', async () => {
      const created = { id: '1', name: 'Premium' };
      prisma.vehicleClass.create.mockResolvedValue(created);

      const result = await service.create({ name: 'Premium' });

      expect(result).toEqual(created);
      expect(prisma.vehicleClass.create).toHaveBeenCalledWith({
        data: { name: 'Premium' },
      });
    });

    it('should throw ConflictException on duplicate name (P2002)', async () => {
      const error = new Error('Unique constraint failed');
      (error as any).code = 'P2002';
      prisma.vehicleClass.create.mockRejectedValue(error);

      await expect(service.create({ name: 'Premium' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update and return a vehicle class', async () => {
      const updated = { id: '1', name: 'Nowa' };
      prisma.vehicleClass.update.mockResolvedValue(updated);

      const result = await service.update('1', { name: 'Nowa' });

      expect(result).toEqual(updated);
    });

    it('should throw ConflictException on duplicate name (P2002)', async () => {
      const error = new Error('Unique constraint failed');
      (error as any).code = 'P2002';
      prisma.vehicleClass.update.mockRejectedValue(error);

      await expect(service.update('1', { name: 'Existing' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when class not found (P2025)', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      prisma.vehicleClass.update.mockRejectedValue(error);

      await expect(service.update('999', { name: 'Nowa' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a class with no vehicles', async () => {
      prisma.vehicle.count.mockResolvedValue(0);
      const deleted = { id: '1', name: 'Economy' };
      prisma.vehicleClass.delete.mockResolvedValue(deleted);

      const result = await service.remove('1');

      expect(result).toEqual(deleted);
      expect(prisma.vehicle.count).toHaveBeenCalledWith({
        where: { vehicleClassId: '1' },
      });
    });

    it('should throw ConflictException when vehicles are assigned', async () => {
      prisma.vehicle.count.mockResolvedValue(3);

      await expect(service.remove('1')).rejects.toThrow(ConflictException);
    });
  });
});
