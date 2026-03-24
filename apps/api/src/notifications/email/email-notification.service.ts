import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailNotificationService {
  rentalConfirmationHtml(rental: {
    customer: { firstName: string; lastName: string };
    vehicle: { registration: string };
    startDate: Date | string;
    endDate: Date | string;
    dailyRateNet: number;
  }): { subject: string; html: string } {
    const startFormatted = this.formatDate(rental.startDate);
    const endFormatted = this.formatDate(rental.endDate);
    const dailyRate = (rental.dailyRateNet / 100).toFixed(2);

    const subject = `Potwierdzenie wynajmu pojazdu ${rental.vehicle.registration}`;
    const html = `
      <p>Szanowny/a ${rental.customer.firstName} ${rental.customer.lastName},</p>
      <p>Potwierdzamy wynajem pojazdu <strong>${rental.vehicle.registration}</strong>.</p>
      <p>Szczegoly wynajmu:</p>
      <ul>
        <li>Data rozpoczecia: ${startFormatted}</li>
        <li>Data zakonczenia: ${endFormatted}</li>
        <li>Stawka dobowa netto: ${dailyRate} PLN</li>
      </ul>
      <p>Dziekujemy za wybor naszych uslug.</p>
      <p>KITEK - Wynajem Pojazdow</p>
    `.trim();

    return { subject, html };
  }

  insuranceExpiryHtml(
    vehicle: { registration: string; make: string; model: string },
    expiryDate: Date,
    daysUntil: number,
  ): { subject: string; html: string } {
    const dateFormatted = this.formatDate(expiryDate);
    const subject = `ALERT: Ubezpieczenie pojazdu ${vehicle.registration} wygasa za ${daysUntil} dni (${dateFormatted})`;
    const html = `
      <p>Ubezpieczenie pojazdu <strong>${vehicle.registration}</strong> (${vehicle.make} ${vehicle.model}) wygasa za <strong>${daysUntil} dni</strong>.</p>
      <p>Data wygasniecia: ${dateFormatted}</p>
      <p>Prosimy o niezwloczne odnowienie polisy.</p>
      <p>KITEK - Wynajem Pojazdow</p>
    `.trim();

    return { subject, html };
  }

  inspectionExpiryHtml(
    vehicle: { registration: string; make: string; model: string },
    expiryDate: Date,
    daysUntil: number,
  ): { subject: string; html: string } {
    const dateFormatted = this.formatDate(expiryDate);
    const subject = `ALERT: Przeglad pojazdu ${vehicle.registration} wygasa za ${daysUntil} dni (${dateFormatted})`;
    const html = `
      <p>Przeglad techniczny pojazdu <strong>${vehicle.registration}</strong> (${vehicle.make} ${vehicle.model}) wygasa za <strong>${daysUntil} dni</strong>.</p>
      <p>Data wygasniecia: ${dateFormatted}</p>
      <p>Prosimy o umowienie przegladu.</p>
      <p>KITEK - Wynajem Pojazdow</p>
    `.trim();

    return { subject, html };
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('pl-PL', {
      timeZone: 'Europe/Warsaw',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
