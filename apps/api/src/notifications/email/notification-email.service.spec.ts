import { EmailNotificationService } from './email-notification.service';

describe('EmailNotificationService', () => {
  let service: EmailNotificationService;

  beforeEach(() => {
    service = new EmailNotificationService();
  });

  it('should return subject containing vehicle registration for rental confirmation', () => {
    const result = service.rentalConfirmationHtml({
      customer: { firstName: 'Jan', lastName: 'Kowalski' },
      vehicle: { registration: 'WA12345' },
      startDate: new Date('2026-03-20'),
      endDate: new Date('2026-03-25'),
      dailyRateNet: 15000,
    });

    expect(result.subject).toContain('WA12345');
    expect(result.subject).toContain('Potwierdzenie wynajmu');
  });

  it('should include customer name, dates, and daily rate in confirmation HTML', () => {
    const result = service.rentalConfirmationHtml({
      customer: { firstName: 'Jan', lastName: 'Kowalski' },
      vehicle: { registration: 'WA12345' },
      startDate: new Date('2026-03-20'),
      endDate: new Date('2026-03-25'),
      dailyRateNet: 15000,
    });

    expect(result.html).toContain('Jan Kowalski');
    expect(result.html).toContain('150.00');
    expect(result.html).toContain('KITEK');
  });

  it('should return subject containing "Ubezpieczenie" and registration for insurance expiry', () => {
    const result = service.insuranceExpiryHtml(
      { registration: 'WA12345', make: 'Toyota', model: 'Corolla' },
      new Date('2026-04-23'),
      30,
    );

    expect(result.subject).toContain('Ubezpieczenie');
    expect(result.subject).toContain('WA12345');
    expect(result.subject).toContain('30 dni');
  });

  it('should return subject containing "Przeglad" and registration for inspection expiry', () => {
    const result = service.inspectionExpiryHtml(
      { registration: 'WA12345', make: 'Toyota', model: 'Corolla' },
      new Date('2026-04-23'),
      7,
    );

    expect(result.subject).toContain('Przeglad');
    expect(result.subject).toContain('WA12345');
    expect(result.subject).toContain('7 dni');
  });
});
