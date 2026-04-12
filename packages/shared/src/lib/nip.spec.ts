import { isValidNip } from './nip';

describe('isValidNip', () => {
  it('returns true for valid NIP (Ministry of Finance: 5261040828)', () => {
    expect(isValidNip('5261040828')).toBe(true);
  });

  it('returns true for valid NIP (7740001454)', () => {
    expect(isValidNip('7740001454')).toBe(true);
  });

  it('returns false for invalid checksum (1234567890)', () => {
    expect(isValidNip('1234567890')).toBe(false);
  });

  it('returns false for 9-digit string', () => {
    expect(isValidNip('123456789')).toBe(false);
  });

  it('returns false for 11-digit string', () => {
    expect(isValidNip('12345678901')).toBe(false);
  });

  it('returns false for non-numeric string', () => {
    expect(isValidNip('abcdefghij')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidNip('')).toBe(false);
  });
});
