import { isValidPesel } from './pesel.validator';

describe('isValidPesel', () => {
  it('should return true for a valid PESEL (44051401359)', () => {
    expect(isValidPesel('44051401359')).toBe(true);
  });

  it('should return true for another valid PESEL (02070803628)', () => {
    expect(isValidPesel('02070803628')).toBe(true);
  });

  it('should return false for an invalid checksum digit', () => {
    // Change last digit from 9 to 8
    expect(isValidPesel('44051401358')).toBe(false);
  });

  it('should return false for a non-11-digit string', () => {
    expect(isValidPesel('1234567890')).toBe(false);
    expect(isValidPesel('123456789012')).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(isValidPesel('')).toBe(false);
  });

  it('should return false for a string with letters', () => {
    expect(isValidPesel('4405140135a')).toBe(false);
    expect(isValidPesel('abcdefghijk')).toBe(false);
  });
});
