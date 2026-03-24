import { Test, TestingModule } from '@nestjs/testing';
import { RentalActivatedNotificationListener } from './rental-activated.listener';
import { NotificationsService } from '../notifications.service';
import { EVENT_LISTENER_METADATA } from '@nestjs/event-emitter/dist/constants';

describe('RentalActivatedNotificationListener', () => {
  let listener: RentalActivatedNotificationListener;
  let notificationsService: { sendRentalConfirmationEmail: jest.Mock };

  beforeEach(async () => {
    notificationsService = {
      sendRentalConfirmationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalActivatedNotificationListener,
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    listener = module.get(RentalActivatedNotificationListener);
  });

  it('should listen to rental.activated event', () => {
    const metadata = Reflect.getMetadata(
      EVENT_LISTENER_METADATA,
      listener.handleRentalActivated,
    );
    expect(metadata).toBeDefined();
    expect(metadata[0]?.event).toBe('rental.activated');
  });

  it('should call sendRentalConfirmationEmail with rental data', async () => {
    const rental = {
      id: 'rental-1',
      customer: { email: 'jan@test.com', firstName: 'Jan', lastName: 'K' },
      vehicle: { registration: 'WA123' },
      startDate: new Date(),
      endDate: new Date(),
      dailyRateNet: 10000,
    };

    await listener.handleRentalActivated({ rental });
    expect(notificationsService.sendRentalConfirmationEmail).toHaveBeenCalledWith(rental);
  });

  it('should not throw on notification failure (non-blocking)', async () => {
    notificationsService.sendRentalConfirmationEmail.mockRejectedValueOnce(
      new Error('Email service down'),
    );

    await expect(
      listener.handleRentalActivated({ rental: {} as any }),
    ).resolves.not.toThrow();
  });
});
