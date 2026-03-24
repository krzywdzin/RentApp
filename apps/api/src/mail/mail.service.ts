import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT'),
      secure: false,
    });
  }

  async sendSetupPasswordEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.config.get('APP_URL');
    const link = `${appUrl}/setup-password?token=${token}`;
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to,
      subject: 'RentApp - Ustaw haslo do konta',
      html: `<p>Czesc ${name},</p><p>Twoje konto zostalo utworzone. Kliknij ponizszy link aby ustawic haslo:</p><p><a href="${link}">${link}</a></p><p>Link wygasa za 72 godziny.</p>`,
    });
  }

  async sendResetPasswordEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.config.get('APP_URL');
    const link = `${appUrl}/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to,
      subject: 'RentApp - Reset hasla',
      html: `<p>Czesc ${name},</p><p>Kliknij ponizszy link aby zresetowac haslo:</p><p><a href="${link}">${link}</a></p><p>Link wygasa za 1 godzine.</p>`,
    });
  }

  async sendContractEmail(
    to: string,
    customerName: string,
    vehicleRegistration: string,
    contractNumber: string,
    pdfBuffer: Buffer,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to,
      subject: 'RentApp - Umowa najmu pojazdu ' + vehicleRegistration,
      html: `<p>Szanowny/a ${customerName},</p><p>W zalaczniku przesylamy umowe najmu pojazdu ${vehicleRegistration} (nr ${contractNumber}).</p><p>Prosimy o zachowanie tego dokumentu.</p><p>KITEK - Wynajem Pojazdow</p>`,
      attachments: [
        {
          filename: `umowa-${contractNumber.replace(/\//g, '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  async sendRaw(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to,
      subject,
      html,
    });
  }

  async sendAnnexEmail(
    to: string,
    customerName: string,
    contractNumber: string,
    annexNumber: number,
    pdfBuffer: Buffer,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to,
      subject: `RentApp - Aneks nr ${annexNumber} do umowy ${contractNumber}`,
      html: `<p>Szanowny/a ${customerName},</p><p>W zalaczniku przesylamy aneks nr ${annexNumber} do umowy ${contractNumber}.</p><p>Prosimy o zachowanie tego dokumentu.</p><p>KITEK - Wynajem Pojazdow</p>`,
      attachments: [
        {
          filename: `aneks-${annexNumber}-${contractNumber.replace(/\//g, '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }
}
