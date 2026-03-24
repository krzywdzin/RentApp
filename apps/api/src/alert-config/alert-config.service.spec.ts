import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AlertConfigService } from './alert-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_ALERT_CONFIGS } from '../notifications/constants/notification-types';

describe('AlertConfigService', () => {
  let service: AlertConfigService;
  let mockPrisma: Record<string, any>;

  beforeEach(async () => {
    mockPrisma = {
      alertConfig: {
        upsert: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([
          { alertType: 'RETURN_REMINDER', enabled: true, leadTimeDays: 1 },
          { alertType: 'OVERDUE', enabled: true, leadTimeDays: 0 },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          alertType: 'RETURN_REMINDER',
          enabled: true,
          leadTimeDays: 1,
          channels: JSON.stringify(['SMS']),
          maxRepeat: null,
        }),
        update: jest.fn().mockImplementation(({ data }) => ({
          alertType: 'RETURN_REMINDER',
          enabled: data.enabled ?? true,
          leadTimeDays: data.leadTimeDays ?? 1,
          channels: data.channels ?? JSON.stringify(['SMS']),
          maxRepeat: data.maxRepeat ?? null,
        })),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertConfigService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(AlertConfigService);
  });

  it('should seed default configs on module init', async () => {
    await service.seedDefaults();
    expect(mockPrisma.alertConfig.upsert).toHaveBeenCalledTimes(
      DEFAULT_ALERT_CONFIGS.length,
    );
  });

  it('should not overwrite existing configs on re-seed', async () => {
    await service.seedDefaults();
    for (const call of mockPrisma.alertConfig.upsert.mock.calls) {
      expect(call[0].update).toEqual({});
    }
  });

  it('should return all alert configs', async () => {
    const result = await service.findAll();
    expect(result).toHaveLength(2);
    expect(mockPrisma.alertConfig.findMany).toHaveBeenCalledWith({
      orderBy: { alertType: 'asc' },
    });
  });

  it('should update enabled flag for alert type', async () => {
    const result = await service.update('RETURN_REMINDER', { enabled: false });
    expect(mockPrisma.alertConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { alertType: 'RETURN_REMINDER' },
        data: expect.objectContaining({ enabled: false }),
      }),
    );
    expect(result).toBeDefined();
  });

  it('should update leadTimeDays for alert type', async () => {
    await service.update('RETURN_REMINDER', { leadTimeDays: 3 });
    expect(mockPrisma.alertConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ leadTimeDays: 3 }),
      }),
    );
  });

  it('should update channels for alert type', async () => {
    await service.update('RETURN_REMINDER', {
      channels: ['SMS', 'EMAIL'],
    });
    expect(mockPrisma.alertConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          channels: JSON.stringify(['SMS', 'EMAIL']),
        }),
      }),
    );
  });

  it('should update maxRepeat for overdue alert type', async () => {
    mockPrisma.alertConfig.findUnique.mockResolvedValue({
      alertType: 'OVERDUE',
      enabled: true,
      maxRepeat: 7,
    });

    await service.update('OVERDUE', { maxRepeat: 10 });
    expect(mockPrisma.alertConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ maxRepeat: 10 }),
      }),
    );
  });

  it('should throw NotFoundException for unknown alert type', async () => {
    mockPrisma.alertConfig.findUnique.mockResolvedValue(null);

    await expect(
      service.update('UNKNOWN_TYPE', { enabled: false }),
    ).rejects.toThrow(NotFoundException);
  });
});
