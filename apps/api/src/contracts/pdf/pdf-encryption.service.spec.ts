import { PdfEncryptionService } from './pdf-encryption.service';

jest.mock('@pdfsmaller/pdf-encrypt-lite', () => ({
  encryptPDF: jest.fn(),
}));

import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';

const mockEncryptPDF = encryptPDF as jest.MockedFunction<typeof encryptPDF>;

describe('PdfEncryptionService', () => {
  let service: PdfEncryptionService;

  beforeEach(() => {
    service = new PdfEncryptionService();
    jest.clearAllMocks();
    // Speed up retry delays in tests
    jest.spyOn(global, 'setTimeout').mockImplementation((fn: () => void) => {
      fn();
      return 0 as unknown as NodeJS.Timeout;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return an encrypted Buffer on success', async () => {
    const inputBuffer = Buffer.from('fake-pdf-content');
    const encryptedUint8 = new Uint8Array([1, 2, 3, 4]);
    mockEncryptPDF.mockResolvedValueOnce(encryptedUint8);

    const result = await service.encrypt(inputBuffer, 'TO 12345');

    expect(result).toBeInstanceOf(Buffer);
    expect(result).toEqual(Buffer.from(encryptedUint8));
  });

  it('should convert Buffer to Uint8Array before passing to encryptPDF', async () => {
    const inputBuffer = Buffer.from('fake-pdf-content');
    const encryptedUint8 = new Uint8Array([1, 2, 3]);
    mockEncryptPDF.mockResolvedValueOnce(encryptedUint8);

    await service.encrypt(inputBuffer, 'TO 12345');

    expect(mockEncryptPDF).toHaveBeenCalledTimes(1);
    const callArg = mockEncryptPDF.mock.calls[0][0];
    expect(callArg).toBeInstanceOf(Uint8Array);
    expect(callArg).not.toBeInstanceOf(Buffer);
    expect(Buffer.from(callArg)).toEqual(inputBuffer);
  });

  it('should retry on failure up to MAX_RETRIES times then throw', async () => {
    const inputBuffer = Buffer.from('fake-pdf-content');
    mockEncryptPDF
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockRejectedValueOnce(new Error('fail 3'));

    await expect(service.encrypt(inputBuffer, 'TO 12345')).rejects.toThrow(
      'PDF encryption failed after 3 attempts: fail 3',
    );
    expect(mockEncryptPDF).toHaveBeenCalledTimes(3);
  });

  it('should succeed on second attempt after first failure', async () => {
    const inputBuffer = Buffer.from('fake-pdf-content');
    const encryptedUint8 = new Uint8Array([5, 6, 7]);
    mockEncryptPDF
      .mockRejectedValueOnce(new Error('transient error'))
      .mockResolvedValueOnce(encryptedUint8);

    const result = await service.encrypt(inputBuffer, 'TO 12345');

    expect(result).toBeInstanceOf(Buffer);
    expect(result).toEqual(Buffer.from(encryptedUint8));
    expect(mockEncryptPDF).toHaveBeenCalledTimes(2);
  });

  it('should never return unencrypted buffer on failure (throws instead)', async () => {
    const inputBuffer = Buffer.from('fake-pdf-content');
    mockEncryptPDF
      .mockRejectedValueOnce(new Error('persistent error'))
      .mockRejectedValueOnce(new Error('persistent error'))
      .mockRejectedValueOnce(new Error('persistent error'));

    await expect(service.encrypt(inputBuffer, 'TO 12345')).rejects.toThrow(
      'PDF encryption failed after 3 attempts: persistent error',
    );
    // encryptPDF was called 3 times (all retries exhausted)
    expect(mockEncryptPDF).toHaveBeenCalledTimes(3);
  });
});
