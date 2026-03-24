import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { EmailNotificationService } from './email/email-notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATION_QUEUES } from './constants/notification-types';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockPrisma: Record<string, any>;
  let mockSmsQueue: { add: jest.Mock };
  let mockEmailQueue: { add: jest.Mock };
  let mockEmailNotificationService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockPrisma = {
      notification: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      inAppNotification: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'in-app-1' }),
        update: jest.fn().mockResolvedValue({ id: 'in-app-1', isRead: true }),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        count: jest.fn().mockResolvedValue(3),
      },
      customer: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'cust-1',
          phone: '+48605123456',
          email: 'jan@test.com',
          firstName: 'Jan',
          lastName: 'Kowalski',
        }),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    mockSmsQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    mockEmailQueue = { add: jest.fn().mockResolvedValue({ id: 'job-2' }) };

    mockEmailNotificationService = {
      rentalConfirmationHtml: jest.fn().mockReturnValue({
        subject: 'Potwierdzenie wynajmu pojazdu WA123',
        html: '<p>Confirmation</p>',
      }),
      insuranceExpiryHtml: jest.fn().mockReturnValue({
        subject: 'ALERT: Ubezpieczenie',
        html: '<p>Insurance</p>',
      }),
      inspectionExpiryHtml: jest.fn().mockReturnValue({
        subject: 'ALERT: Przeglad',
        html: '<p>Inspection</p>',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken(NOTIFICATION_QUEUES.SMS), useValue: mockSmsQueue },
        { provide: getQueueToken(NOTIFICATION_QUEUES.EMAIL), useValue: mockEmailQueue },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('+48 500 000 000'),
          },
        },
        { provide: EmailNotificationService, useValue: mockEmailNotificationService },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('should create notification record and enqueue SMS job for extension', async () => {
    await service.sendExtensionSms('cust-1', '2026-04-01T14:00:00.000Z', 'rental-1');

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'EXTENSION',
          channel: 'SMS',
          recipientPhone: '+48605123456',
        }),
      }),
    );
    expect(mockSmsQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: 'notif-1',
        phone: '+48605123456',
      }),
    );
  });

  it('should create notification record and enqueue email job for rental confirmation', async () => {
    const rental = {
      id: 'rental-1',
      customer: { email: 'jan@test.com', firstName: 'Jan', lastName: 'K' },
      vehicle: { registration: 'WA123' },
      startDate: new Date(),
      endDate: new Date(),
      dailyRateNet: 10000,
    };

    await service.sendRentalConfirmationEmail(rental);

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'RENTAL_CONFIRMATION',
          channel: 'EMAIL',
        }),
      }),
    );
    expect(mockEmailQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: 'notif-1',
        to: 'jan@test.com',
      }),
    );
  });

  it('should create notification record and enqueue SMS job for return reminder', async () => {
    const rental = {
      id: 'rental-1',
      endDate: new Date('2026-03-25T14:00:00.000Z'),
      customer: { id: 'cust-1', phone: '+48605123456' },
      vehicle: { registration: 'WA123' },
    };

    await service.enqueueReturnReminder(rental);

    expect(mockPrisma.notification.create).toHaveBeenCalled();
    expect(mockSmsQueue.add).toHaveBeenCalled();
  });

  it('should deduplicate: skip if notification exists for same entity+type+date', async () => {
    mockPrisma.notification.findFirst.mockResolvedValueOnce({ id: 'existing' });

    const rental = {
      id: 'rental-1',
      endDate: new Date(),
      customer: { id: 'cust-1', phone: '+48605123456' },
      vehicle: { registration: 'WA123' },
    };

    await service.enqueueReturnReminder(rental);

    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    expect(mockSmsQueue.add).not.toHaveBeenCalled();
  });

  it('should get paginated in-app notifications for user', async () => {
    mockPrisma.inAppNotification.findMany.mockResolvedValue([
      { id: '1', title: 'Test' },
    ]);
    mockPrisma.inAppNotification.count.mockResolvedValue(1);

    const result = await service.getInAppNotifications('user-1', {
      page: 1,
      limit: 20,
    });

    expect(result).toEqual({
      data: [{ id: '1', title: 'Test' }],
      total: 1,
      page: 1,
      limit: 20,
    });
  });

  it('should return unread count for user', async () => {
    mockPrisma.inAppNotification.count.mockResolvedValue(5);
    const count = await service.getUnreadCount('user-1');
    expect(count).toBe(5);
    expect(mockPrisma.inAppNotification.count).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRead: false },
    });
  });

  it('should mark single in-app notification as read', async () => {
    await service.markAsRead('notif-1', 'user-1');
    expect(mockPrisma.inAppNotification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1', userId: 'user-1' },
      data: expect.objectContaining({ isRead: true }),
    });
  });

  it('should mark all in-app notifications as read for user', async () => {
    await service.markAllAsRead('user-1');
    expect(mockPrisma.inAppNotification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRead: false },
      data: expect.objectContaining({ isRead: true }),
    });
  });
});
