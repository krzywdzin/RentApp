import { encrypt, decrypt, hmacIndex, EncryptedValue } from './field-encryption';

describe('Field Encryption', () => {
  const TEST_KEY = 'a'.repeat(64);

  beforeAll(() => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY;
  });

  afterAll(() => {
    delete process.env.FIELD_ENCRYPTION_KEY;
  });

  describe('encrypt', () => {
    it('returns object with ciphertext, iv, and tag as base64 strings', () => {
      const result = encrypt('test-value');
      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('tag');
      // Verify base64 format
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      expect(result.ciphertext).toMatch(base64Regex);
      expect(result.iv).toMatch(base64Regex);
      expect(result.tag).toMatch(base64Regex);
    });

    it('produces different ciphertext for same input (unique IV each time)', () => {
      const result1 = encrypt('same-input');
      const result2 = encrypt('same-input');
      expect(result1.ciphertext).not.toEqual(result2.ciphertext);
      expect(result1.iv).not.toEqual(result2.iv);
    });
  });

  describe('decrypt', () => {
    it('roundtrips correctly: decrypt(encrypt(value)) === value', () => {
      const original = 'test-value';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('throws error when ciphertext is tampered', () => {
      const encrypted = encrypt('test-value');
      const tampered: EncryptedValue = {
        ...encrypted,
        ciphertext: Buffer.from('tampered-data').toString('base64'),
      };
      expect(() => decrypt(tampered)).toThrow();
    });

    it('throws error when decrypting with wrong key', () => {
      const encrypted = encrypt('test-value');
      // Change to different valid key
      process.env.FIELD_ENCRYPTION_KEY = 'b'.repeat(64);
      expect(() => decrypt(encrypted)).toThrow();
      // Restore original key
      process.env.FIELD_ENCRYPTION_KEY = TEST_KEY;
    });
  });

  describe('hmacIndex', () => {
    it('returns consistent hex string for same input', () => {
      const hash1 = hmacIndex('12345678901');
      const hash2 = hmacIndex('12345678901');
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    });

    it('returns different hashes for different inputs', () => {
      const hash1 = hmacIndex('12345678901');
      const hash2 = hmacIndex('12345678902');
      expect(hash1).not.toBe(hash2);
    });
  });
});
