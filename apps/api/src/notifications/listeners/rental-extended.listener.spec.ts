import { Test, TestingModule } from '@nestjs/testing';
import { RentalExtendedNotificationListener } from './rental-extended.listener';
import { NotificationsService } from '../notifications.service';
import { EVENT_LISTENER_METADATA } from '@nestjs/event-emitter/dist/constants';

describe('RentalExtendedNotificationListener', () => {
  let listener: RentalExtendedNotificationListener;
  let notificationsService: { sendExtensionSms: jest.Mock };

  beforeEach(async () => {
    notificationsService = {
      sendExtensionSms: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalExtendedNotificationListener,
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    listener = module.get(RentalExtendedNotificationListener);
  });

  it('should listen to rental.extended event', () => {
    const metadata = Reflect.getMetadata(
      EVENT_LISTENER_METADATA,
      listener.handleRentalExtended,
    );
    expect(metadata).toBeDefined();
    expect(metadata[0]?.event).toBe('rental.extended');
  });

  it('should call sendExtensionSms with customerId and newEndDate', async () => {
    const payload = {
      rentalId: 'rental-1',
      customerId: 'customer-1',
      newEndDate: '2026-04-01T14:00:00.000Z',
      extendedBy: 'user-1',
    };

    await listener.handleRentalExtended(payload);
    expect(notificationsService.sendExtensionSms).toHaveBeenCalledWith(
      'customer-1',
      '2026-04-01T14:00:00.000Z',
      'rental-1',
      undefined,
      undefined,
    );
  });

  it('should not throw on notification failure (non-blocking)', async () => {
    notificationsService.sendExtensionSms.mockRejectedValueOnce(
      new Error('SMS service down'),
    );

    await expect(
      listener.handleRentalExtended({
        rentalId: 'r-1',
        customerId: 'c-1',
        newEndDate: '2026-04-01',
        extendedBy: 'u-1',
      }),
    ).resolves.not.toThrow();
  });
});
