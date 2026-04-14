import { parseDriverLicense } from '../parse-driver-license';

describe('parseDriverLicense', () => {
  it('extracts licenseNumber from "12345/67/8901" format', () => {
    const ocrTexts = [
      'PRAWO JAZDY',
      'DRIVING LICENCE',
      'Kowalski',
      'Jan',
      '15.03.1990',
      '01.06.2020',
      '15.06.2030',
      '12345/67/8901',
      'B',
    ];
    const result = parseDriverLicense(ocrTexts);
    expect(result.licenseNumber).toBe('12345/67/8901');
  });

  it('extracts categories "B" from text containing category patterns', () => {
    const ocrTexts = [
      'PRAWO JAZDY',
      '12345/67/8901',
      '15.03.1990',
      '01.06.2020',
      '15.06.2030',
      'B',
    ];
    const result = parseDriverLicense(ocrTexts);
    expect(result.categories).toBe('B');
  });

  it('extracts multiple categories', () => {
    const ocrTexts = [
      'PRAWO JAZDY',
      '12345/67/8901',
      '15.03.1990',
      '01.06.2020',
      '15.06.2030',
      'B C D',
    ];
    const result = parseDriverLicense(ocrTexts);
    expect(result.categories).toBe('B, C, D');
  });

  it('extracts expiryDate in ISO format from "15.06.2030"', () => {
    const ocrTexts = [
      'PRAWO JAZDY',
      '12345/67/8901',
      '15.03.1990',
      '01.06.2020',
      '15.06.2030',
      'B',
    ];
    const result = parseDriverLicense(ocrTexts);
    expect(result.expiryDate).toBe('2030-06-15');
  });

  it('returns null for fields not found', () => {
    const ocrTexts = ['some garbled text', 'xyz abc 123'];
    const result = parseDriverLicense(ocrTexts);
    expect(result.licenseNumber).toBeNull();
    expect(result.categories).toBeNull();
    expect(result.expiryDate).toBeNull();
  });

  it('handles empty input arrays gracefully', () => {
    const result = parseDriverLicense([]);
    expect(result.licenseNumber).toBeNull();
    expect(result.categories).toBeNull();
    expect(result.expiryDate).toBeNull();
  });

  it('handles date with slash separator', () => {
    const ocrTexts = [
      '15/03/1990',
      '01/06/2020',
      '15/06/2030',
    ];
    const result = parseDriverLicense(ocrTexts);
    expect(result.expiryDate).toBe('2030-06-15');
  });

  it('extracts B+E category', () => {
    const ocrTexts = [
      'PRAWO JAZDY',
      '12345/67/8901',
      'B+E',
    ];
    const result = parseDriverLicense(ocrTexts);
    expect(result.categories).toBe('B+E');
  });
});
