import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend client initialized');
    } else {
      this.logger.warn('RESEND_API_KEY not configured, email sending disabled');
    }
    this.fromEmail = this.config.get<string>('MAIL_FROM', 'noreply@kitek.pl');
  }

  private async send(
    to: string,
    subject: string,
    html: string,
    attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`Email not sent to ${to}: Resend client not available`);
      return;
    }

    try {
      const resendAttachments = attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
      }));

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
        attachments: resendAttachments,
      });

      if (error) {
        this.logger.error(`Resend API error for ${to}: ${error.message}`);
        throw new Error(error.message);
      }

      this.logger.log(`Email sent to ${to} (id: ${data?.id})`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async sendSetupPasswordEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.config.get('APP_URL');
    const link = `${appUrl}/setup-password?token=${token}`;
    await this.send(
      to,
      'RentApp - Ustaw haslo do konta',
      `<p>Czesc ${name},</p><p>Twoje konto zostalo utworzone. Kliknij ponizszy link aby ustawic haslo:</p><p><a href="${link}">${link}</a></p><p>Link wygasa za 72 godziny.</p>`,
    );
  }

  async sendResetPasswordEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.config.get('APP_URL');
    const link = `${appUrl}/reset-password?token=${token}`;
    await this.send(
      to,
      'RentApp - Reset hasla',
      `<p>Czesc ${name},</p><p>Kliknij ponizszy link aby zresetowac haslo:</p><p><a href="${link}">${link}</a></p><p>Link wygasa za 1 godzine.</p>`,
    );
  }

  async sendContractEmail(
    to: string,
    customerName: string,
    vehicleRegistration: string,
    contractNumber: string,
    pdfBuffer: Buffer,
    portalUrl?: string,
  ): Promise<void> {
    const portalSection = portalUrl
      ? `<p style="margin-top:16px">Twoj portal klienta: <a href="${portalUrl}">Otworz portal</a></p><p style="font-size:12px;color:#666">Link wazny przez 30 dni.</p>`
      : '';
    await this.send(
      to,
      'RentApp - Umowa najmu pojazdu ' + vehicleRegistration,
      `<p>Szanowny/a ${customerName},</p><p>W zalaczniku przesylamy umowe najmu pojazdu ${vehicleRegistration} (nr ${contractNumber}).</p>${portalSection}<p>Prosimy o zachowanie tego dokumentu.</p><p>KITEK - Wynajem Pojazdow</p>`,
      [
        {
          filename: `umowa-${contractNumber.replace(/\//g, '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    );
  }

  async sendRaw(to: string, subject: string, html: string): Promise<void> {
    await this.send(to, subject, html);
  }

  async sendAnnexEmail(
    to: string,
    customerName: string,
    contractNumber: string,
    annexNumber: number,
    pdfBuffer: Buffer,
  ): Promise<void> {
    await this.send(
      to,
      `RentApp - Aneks nr ${annexNumber} do umowy ${contractNumber}`,
      `<p>Szanowny/a ${customerName},</p><p>W zalaczniku przesylamy aneks nr ${annexNumber} do umowy ${contractNumber}.</p><p>Prosimy o zachowanie tego dokumentu.</p><p>KITEK - Wynajem Pojazdow</p>`,
      [
        {
          filename: `aneks-${annexNumber}-${contractNumber.replace(/\//g, '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    );
  }
}
