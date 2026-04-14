const mockSend = jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null });

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

describe('MailService', () => {
  let service: MailService;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockConfig = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const values: Record<string, string> = {
          RESEND_API_KEY: 'test-api-key',
          MAIL_FROM: 'test@kitek.pl',
        };
        return values[key] ?? defaultValue;
      }),
    } as unknown as ConfigService;

    service = new MailService(mockConfig);
  });

  describe('sendContractEmail', () => {
    const baseArgs = {
      to: 'customer@example.com',
      customerName: 'Jan Kowalski',
      vehicleRegistration: 'TO 12345',
      contractNumber: 'K/2026/001',
      pdfBuffer: Buffer.from('fake-pdf'),
    };

    it('should set subject with insurance case number when provided', async () => {
      await service.sendContractEmail(
        baseArgs.to,
        baseArgs.customerName,
        baseArgs.vehicleRegistration,
        baseArgs.contractNumber,
        baseArgs.pdfBuffer,
        undefined,
        'ABC123',
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArg = mockSend.mock.calls[0][0];
      expect(callArg.subject).toBe(
        'RentApp - Sprawa ABC123 - Umowa najmu TO 12345',
      );
    });

    it('should set default subject when no insuranceCaseNumber provided', async () => {
      await service.sendContractEmail(
        baseArgs.to,
        baseArgs.customerName,
        baseArgs.vehicleRegistration,
        baseArgs.contractNumber,
        baseArgs.pdfBuffer,
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArg = mockSend.mock.calls[0][0];
      expect(callArg.subject).toBe(
        'RentApp - Umowa najmu pojazdu TO 12345',
      );
    });

    it('should set default subject when insuranceCaseNumber is null', async () => {
      await service.sendContractEmail(
        baseArgs.to,
        baseArgs.customerName,
        baseArgs.vehicleRegistration,
        baseArgs.contractNumber,
        baseArgs.pdfBuffer,
        undefined,
        null,
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArg = mockSend.mock.calls[0][0];
      expect(callArg.subject).toBe(
        'RentApp - Umowa najmu pojazdu TO 12345',
      );
    });
  });

  describe('sendAnnexEmail', () => {
    const baseArgs = {
      to: 'customer@example.com',
      customerName: 'Jan Kowalski',
      contractNumber: 'K/2026/001',
      annexNumber: 1,
      pdfBuffer: Buffer.from('fake-pdf'),
    };

    it('should set subject with insurance case number when provided', async () => {
      await service.sendAnnexEmail(
        baseArgs.to,
        baseArgs.customerName,
        baseArgs.contractNumber,
        baseArgs.annexNumber,
        baseArgs.pdfBuffer,
        'ABC123',
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArg = mockSend.mock.calls[0][0];
      expect(callArg.subject).toBe(
        'RentApp - Sprawa ABC123 - Aneks nr 1 do umowy K/2026/001',
      );
    });

    it('should set default subject when no insuranceCaseNumber provided', async () => {
      await service.sendAnnexEmail(
        baseArgs.to,
        baseArgs.customerName,
        baseArgs.contractNumber,
        baseArgs.annexNumber,
        baseArgs.pdfBuffer,
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArg = mockSend.mock.calls[0][0];
      expect(callArg.subject).toBe(
        'RentApp - Aneks nr 1 do umowy K/2026/001',
      );
    });
  });
});
