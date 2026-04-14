import { parseIdCard } from '../parse-id-card';

describe('parseIdCard', () => {
  it('extracts PESEL from text containing 11-digit number', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'DOWÓD OSOBISTY',
      'Kowalski',
      'Jan',
      'ABC123456',
      '02271409876',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.pesel).toBe('02271409876');
  });

  it('extracts documentNumber in 3-letter + 6-digit format', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'DOWÓD OSOBISTY',
      'Kowalski',
      'Jan',
      'ABC123456',
      '02271409876',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.documentNumber).toBe('ABC123456');
  });

  it('extracts lastName as first name-like line', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'DOWÓD OSOBISTY',
      'Kowalski',
      'Jan',
      'ABC123456',
      '02271409876',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.lastName).toBe('Kowalski');
  });

  it('extracts firstName as second name-like line', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'DOWÓD OSOBISTY',
      'Kowalski',
      'Jan',
      'ABC123456',
      '02271409876',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.firstName).toBe('Jan');
  });

  it('returns null for fields not found in garbled text', () => {
    const ocrTexts = ['xxx yyy zzz', '12345 abc', '!@#$%^'];
    const result = parseIdCard(ocrTexts);
    expect(result.firstName).toBeNull();
    expect(result.lastName).toBeNull();
    expect(result.pesel).toBeNull();
    expect(result.documentNumber).toBeNull();
  });

  it('handles empty input arrays gracefully', () => {
    const result = parseIdCard([]);
    expect(result.firstName).toBeNull();
    expect(result.lastName).toBeNull();
    expect(result.pesel).toBeNull();
    expect(result.documentNumber).toBeNull();
  });

  it('extracts only PESEL and documentNumber when no name-like lines exist', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'DOWÓD OSOBISTY',
      'ABC654321',
      '98010112345',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.pesel).toBe('98010112345');
    expect(result.documentNumber).toBe('ABC654321');
    expect(result.firstName).toBeNull();
    expect(result.lastName).toBeNull();
  });

  it('does not match a 12-digit number as PESEL', () => {
    const ocrTexts = ['123456789012'];
    const result = parseIdCard(ocrTexts);
    expect(result.pesel).toBeNull();
  });

  it('handles Polish diacritics in names', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'Wójcik',
      'Łukasz',
      'DEF789012',
      '85032156789',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.lastName).toBe('Wójcik');
    expect(result.firstName).toBe('Łukasz');
  });
});
