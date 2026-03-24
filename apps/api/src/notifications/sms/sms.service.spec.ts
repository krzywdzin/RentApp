import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

jest.mock('smsapi', () => ({
  SMSAPI: jest.fn().mockImplementation(() => ({
    sms: {
      sendSms: jest.fn().mockResolvedValue({ list: [{ id: 'sms-123' }] }),
    },
  })),
}));

describe('SmsService', () => {
  let service: SmsService;
  let smsapiInstance: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-token'),
            get: jest.fn().mockImplementation((key: string, def?: string) => {
              if (key === 'SMSAPI_TEST_MODE') return 'false';
              if (key === 'SMSAPI_SENDER_NAME') return 'KITEK';
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
    // Access the internal smsapi instance
    smsapiInstance = (service as any).smsapi;
  });

  it('should normalize phone: strip +, spaces, dashes', () => {
    expect(service.normalizePhone('+48 605-123-456')).toBe('48605123456');
    expect(service.normalizePhone('48-605-123-456')).toBe('48605123456');
  });

  it('should prepend 48 to 9-digit numbers', () => {
    expect(service.normalizePhone('605123456')).toBe('48605123456');
  });

  it('should send SMS via smsapi.pl SDK', async () => {
    const messageId = await service.send('+48605123456', 'Test message');
    expect(smsapiInstance.sms.sendSms).toHaveBeenCalledWith(
      '48605123456',
      'Test message',
      expect.objectContaining({ from: 'KITEK' }),
    );
    expect(messageId).toBe('sms-123');
  });

  it('should pass test=1 when SMSAPI_TEST_MODE is true', async () => {
    // Re-create service with test mode enabled
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-token'),
            get: jest.fn().mockImplementation((key: string, def?: string) => {
              if (key === 'SMSAPI_TEST_MODE') return 'true';
              if (key === 'SMSAPI_SENDER_NAME') return 'KITEK';
              return def;
            }),
          },
        },
      ],
    }).compile();

    const testService = module.get<SmsService>(SmsService);
    const testSmsapi = (testService as any).smsapi;

    await testService.send('605123456', 'Test');
    expect(testSmsapi.sms.sendSms).toHaveBeenCalledWith(
      '48605123456',
      'Test',
      expect.objectContaining({ test: true }),
    );
  });

  it('should use SMSAPI_SENDER_NAME as from field', async () => {
    await service.send('605123456', 'Test');
    expect(smsapiInstance.sms.sendSms).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ from: 'KITEK' }),
    );
  });

  it('should return message ID on success', async () => {
    const id = await service.send('605123456', 'Test');
    expect(id).toBe('sms-123');
  });

  it('should throw on smsapi error', async () => {
    smsapiInstance.sms.sendSms.mockRejectedValueOnce(
      new Error('API Error'),
    );
    await expect(service.send('605123456', 'Test')).rejects.toThrow(
      'API Error',
    );
  });
});
