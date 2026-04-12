import { IsValidNipConstraint } from './nip.validator';

describe('IsValidNipConstraint', () => {
  const constraint = new IsValidNipConstraint();

  it('should return true for a valid NIP (5261040828)', () => {
    expect(constraint.validate('5261040828')).toBe(true);
  });

  it('should return true for another valid NIP (7740001454)', () => {
    expect(constraint.validate('7740001454')).toBe(true);
  });

  it('should return false for an invalid NIP (1234567890)', () => {
    expect(constraint.validate('1234567890')).toBe(false);
  });

  it('should return false for a non-10-digit string', () => {
    expect(constraint.validate('123456789')).toBe(false);
    expect(constraint.validate('12345678901')).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(constraint.validate('')).toBe(false);
  });

  it('should return false for non-string values', () => {
    expect(constraint.validate(null as unknown as string)).toBe(false);
    expect(constraint.validate(undefined as unknown as string)).toBe(false);
    expect(constraint.validate(12345 as unknown as string)).toBe(false);
  });

  it('should provide a default error message', () => {
    expect(constraint.defaultMessage()).toBe('Invalid NIP number');
  });
});
