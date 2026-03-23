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
}
