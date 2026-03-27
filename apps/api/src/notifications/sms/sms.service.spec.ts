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

  function createConfigValue(overrides: Record<string, string> = {}) {
    const defaults: Record<string, string> = {
      SMSAPI_TOKEN: 'test-token',
      SMSAPI_TEST_MODE: 'false',
      SMSAPI_SENDER_NAME: 'KITEK',
    };
    const merged = { ...defaults, ...overrides };
    return {
      get: jest.fn().mockImplementation((key: string, def?: string) => {
        return merged[key] ?? def;
      }),
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: ConfigService, useValue: createConfigValue() },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
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
    // Lazy init creates client on first send
    const smsapiInstance = (service as any).smsapi;
    expect(smsapiInstance).toBeDefined();
    expect(smsapiInstance.sms.sendSms).toHaveBeenCalledWith(
      '48605123456',
      'Test message',
      expect.objectContaining({ from: 'KITEK' }),
    );
    expect(messageId).toBe('sms-123');
  });

  it('should pass test=true when SMSAPI_TEST_MODE is true', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: ConfigService, useValue: createConfigValue({ SMSAPI_TEST_MODE: 'true' }) },
      ],
    }).compile();

    const testService = module.get<SmsService>(SmsService);
    await testService.send('605123456', 'Test');

    const testSmsapi = (testService as any).smsapi;
    expect(testSmsapi.sms.sendSms).toHaveBeenCalledWith(
      '48605123456',
      'Test',
      expect.objectContaining({ test: true }),
    );
  });

  it('should use SMSAPI_SENDER_NAME as from field', async () => {
    await service.send('605123456', 'Test');
    const smsapiInstance = (service as any).smsapi;
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
    // Trigger lazy init first
    await service.send('605123456', 'Test');
    const smsapiInstance = (service as any).smsapi;
    smsapiInstance.sms.sendSms.mockRejectedValueOnce(
      new Error('API Error'),
    );
    await expect(service.send('605123456', 'Test')).rejects.toThrow(
      'API Error',
    );
  });

  it('should return skipped when SMSAPI_TOKEN is not configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: ConfigService, useValue: createConfigValue({ SMSAPI_TOKEN: '' }) },
      ],
    }).compile();

    const noTokenService = module.get<SmsService>(SmsService);
    const result = await noTokenService.send('605123456', 'Test');
    expect(result).toBe('skipped');
    expect((noTokenService as any).smsapi).toBeNull();
  });
});
