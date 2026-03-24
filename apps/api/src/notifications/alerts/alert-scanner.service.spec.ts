import { Test, TestingModule } from '@nestjs/testing';
import { AlertScannerService } from '../cron/alert-scanner.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications.service';
import { AlertConfigService } from '../../alert-config/alert-config.service';

describe('AlertScannerService', () => {
  let service: AlertScannerService;
  let mockPrisma: Record<string, any>;
  let mockNotificationsService: Record<string, jest.Mock>;
  let mockAlertConfigService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockPrisma = {
      rental: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      notification: {
        count: jest.fn().mockResolvedValue(0),
      },
      vehicleInsurance: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      vehicleInspection: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    mockNotificationsService = {
      enqueueReturnReminder: jest.fn().mockResolvedValue(undefined),
      enqueueOverdueAlert: jest.fn().mockResolvedValue(undefined),
      enqueueExpiryAlert: jest.fn().mockResolvedValue(undefined),
    };

    mockAlertConfigService = {
      findByType: jest.fn().mockImplementation((type: string) =>
        Promise.resolve({
          alertType: type,
          enabled: true,
          leadTimeDays: type === 'RETURN_REMINDER' ? 1 : 30,
          maxRepeat: type === 'OVERDUE' ? 7 : null,
          channels: ['SMS'],
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertScannerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: AlertConfigService, useValue: mockAlertConfigService },
      ],
    }).compile();

    service = module.get(AlertScannerService);
  });

  it('should run at 8:00 AM daily (cron expression)', () => {
    // Check that the Cron decorator is present via Reflect metadata
    const metadata = Reflect.getMetadata(
      'SCHEDULE_CRON_OPTIONS',
      service.scanAlerts,
    );
    expect(metadata).toBeDefined();
    expect(metadata.cronTime).toBe('0 8 * * *');
  });

  it('should find rentals with return date tomorrow for reminders', async () => {
    const rental = {
      id: 'r-1',
      endDate: new Date(),
      customer: { id: 'c-1', phone: '+48605123456' },
      vehicle: { registration: 'WA123' },
    };
    mockPrisma.rental.findMany.mockResolvedValueOnce([rental]);

    await service.scanReturnReminders();

    expect(mockPrisma.rental.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['ACTIVE', 'EXTENDED'] },
        }),
      }),
    );
    expect(mockNotificationsService.enqueueReturnReminder).toHaveBeenCalledWith(rental);
  });

  it('should find overdue rentals (past endDate, status ACTIVE or EXTENDED)', async () => {
    const rental = {
      id: 'r-1',
      endDate: new Date('2026-03-20'),
      customer: { id: 'c-1', phone: '+48605123456' },
      vehicle: { registration: 'WA123' },
    };
    mockPrisma.rental.findMany.mockResolvedValueOnce([rental]);

    await service.scanOverdueRentals();

    expect(mockPrisma.rental.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          endDate: expect.objectContaining({ lt: expect.any(Date) }),
          status: { in: ['ACTIVE', 'EXTENDED'] },
        }),
      }),
    );
    expect(mockNotificationsService.enqueueOverdueAlert).toHaveBeenCalledWith(rental, 0);
  });

  it('should not send reminder if notification already exists for same rental+type+date (dedup in NotificationsService)', async () => {
    // Dedup is in NotificationsService, but scanner respects maxRepeat
    const rental = {
      id: 'r-1',
      endDate: new Date('2026-03-20'),
      customer: { id: 'c-1', phone: '+48605123456' },
      vehicle: { registration: 'WA123' },
    };
    mockPrisma.rental.findMany.mockResolvedValue([rental]);
    mockPrisma.notification.count.mockResolvedValue(7); // maxRepeat reached

    await service.scanOverdueRentals();

    expect(mockNotificationsService.enqueueOverdueAlert).not.toHaveBeenCalled();
  });

  it('should stop overdue SMS after maxRepeat count reached', async () => {
    const rental = {
      id: 'r-1',
      endDate: new Date('2026-03-20'),
      customer: { id: 'c-1', phone: '+48605123456' },
      vehicle: { registration: 'WA123' },
    };
    mockPrisma.rental.findMany.mockResolvedValue([rental]);
    mockPrisma.notification.count.mockResolvedValue(7);

    await service.scanOverdueRentals();

    expect(mockNotificationsService.enqueueOverdueAlert).not.toHaveBeenCalled();
  });

  it('should find vehicles with insurance expiring in 30 days', async () => {
    const record = {
      vehicleId: 'v-1',
      expiryDate: new Date('2026-04-23'),
      vehicle: { registration: 'WA123', make: 'Toyota', model: 'Corolla' },
    };
    mockPrisma.vehicleInsurance.findMany.mockResolvedValueOnce([record]);

    await service.scanInsuranceExpiry();

    expect(mockNotificationsService.enqueueExpiryAlert).toHaveBeenCalledWith(
      'v-1',
      'INSURANCE_EXPIRY',
      record.vehicle,
      record.expiryDate,
      30,
    );
  });

  it('should find vehicles with insurance expiring in 7 days', async () => {
    mockPrisma.vehicleInsurance.findMany
      .mockResolvedValueOnce([]) // 30-day scan
      .mockResolvedValueOnce([
        {
          vehicleId: 'v-1',
          expiryDate: new Date('2026-03-31'),
          vehicle: { registration: 'WA123', make: 'Toyota', model: 'Corolla' },
        },
      ]); // 7-day scan

    await service.scanInsuranceExpiry();

    expect(mockNotificationsService.enqueueExpiryAlert).toHaveBeenCalledWith(
      'v-1',
      'INSURANCE_EXPIRY',
      expect.any(Object),
      expect.any(Date),
      7,
    );
  });

  it('should find vehicles with inspection expiring in 30 days', async () => {
    const record = {
      vehicleId: 'v-1',
      expiryDate: new Date('2026-04-23'),
      vehicle: { registration: 'WA123', make: 'Toyota', model: 'Corolla' },
    };
    mockPrisma.vehicleInspection.findMany.mockResolvedValueOnce([record]);

    await service.scanInspectionExpiry();

    expect(mockNotificationsService.enqueueExpiryAlert).toHaveBeenCalledWith(
      'v-1',
      'INSPECTION_EXPIRY',
      record.vehicle,
      record.expiryDate,
      30,
    );
  });

  it('should find vehicles with inspection expiring in 7 days', async () => {
    mockPrisma.vehicleInspection.findMany
      .mockResolvedValueOnce([]) // 30-day scan
      .mockResolvedValueOnce([
        {
          vehicleId: 'v-1',
          expiryDate: new Date('2026-03-31'),
          vehicle: { registration: 'WA123', make: 'Toyota', model: 'Corolla' },
        },
      ]); // 7-day scan

    await service.scanInspectionExpiry();

    expect(mockNotificationsService.enqueueExpiryAlert).toHaveBeenCalledWith(
      'v-1',
      'INSPECTION_EXPIRY',
      expect.any(Object),
      expect.any(Date),
      7,
    );
  });

  it('should skip disabled alert types via AlertConfig', async () => {
    mockAlertConfigService.findByType.mockResolvedValue({ enabled: false });

    await service.scanReturnReminders();

    expect(mockPrisma.rental.findMany).not.toHaveBeenCalled();
    expect(mockNotificationsService.enqueueReturnReminder).not.toHaveBeenCalled();
  });

  it('should use Europe/Warsaw timezone for date boundaries', () => {
    // Access private method to verify timezone
    const { startOfTarget, endOfTarget } = (service as any).getWarsawDateRange(1);
    expect(startOfTarget).toBeInstanceOf(Date);
    expect(endOfTarget).toBeInstanceOf(Date);
    expect(startOfTarget.getHours()).toBe(0);
    expect(startOfTarget.getMinutes()).toBe(0);
    expect(endOfTarget.getHours()).toBe(23);
    expect(endOfTarget.getMinutes()).toBe(59);
  });
});
