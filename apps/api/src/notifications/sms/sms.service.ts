import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMSAPI } from 'smsapi';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private smsapi: SMSAPI | null = null;
  private readonly testMode: boolean;
  private readonly senderName: string;

  constructor(private readonly config: ConfigService) {
    this.testMode =
      this.config.get<string>('SMSAPI_TEST_MODE', 'false') === 'true';
    this.senderName = this.config.get<string>('SMSAPI_SENDER_NAME', 'Test');
  }

  private getClient(): SMSAPI | null {
    if (!this.smsapi) {
      const token = this.config.get<string>('SMSAPI_TOKEN');
      if (!token) {
        this.logger.warn('SMSAPI_TOKEN not configured, SMS sending disabled');
        return null;
      }
      // Polish accounts require the .pl endpoint; default SDK uses smsapi.io
      this.smsapi = new SMSAPI(token, 'https://api.smsapi.pl/api');
    }
    return this.smsapi;
  }

  normalizePhone(phone: string): string {
    // Strip +, spaces, dashes
    let normalized = phone.replace(/[+\s-]/g, '');
    // Prepend 48 country code if 9-digit Polish number
    if (normalized.length === 9) {
      normalized = '48' + normalized;
    }
    return normalized;
  }

  async send(to: string, message: string): Promise<string> {
    const client = this.getClient();
    if (!client) {
      this.logger.warn(`SMS not sent to ${to}: SMSAPI client not available`);
      return 'skipped';
    }

    const normalized = this.normalizePhone(to);
    try {
      const result = await client.sms.sendSms(normalized, message, {
        from: this.senderName,
        test: this.testMode ? true : undefined,
      } as Record<string, unknown>);
      const messageId = result?.list?.[0]?.id ?? 'unknown';
      this.logger.log(
        `SMS sent to ${normalized} (messageId: ${messageId}, testMode: ${this.testMode})`,
      );
      return String(messageId);
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${normalized}: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
