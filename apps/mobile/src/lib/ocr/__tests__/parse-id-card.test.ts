import { parseIdCard } from '../parse-id-card';

describe('parseIdCard', () => {
  it('extracts PESEL from text containing 11-digit number', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'DOWÓD OSOBISTY',
      'NAZWISKO/SURNAME',
      'Kowalski',
      'IMIĘ/NAME',
      'Jan',
      'ABC123456',
      '02271409876',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.pesel).toBe('02271409876');
  });

  it('extracts documentNumber in 3-letter + 6-digit format', () => {
    const ocrTexts = [
      'NAZWISKO/SURNAME',
      'Kowalski',
      'IMIĘ/NAME',
      'Jan',
      'ABC123456',
      '02271409876',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.documentNumber).toBe('ABC123456');
  });

  it('extracts names using label-based strategy (NAZWISKO/IMIĘ)', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'DOWÓD OSOBISTY',
      'NAZWISKO/SURNAME',
      'KOWALSKI',
      'IMIĘ/NAME',
      'JAN',
      'ABC123456',
      '02271409876',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.lastName).toBe('Kowalski');
    expect(result.firstName).toBe('Jan');
  });

  it('handles label with just NAZWISKO and IMIĘ (no English)', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'NAZWISKO',
      'WÓJCIK',
      'IMIĘ',
      'ŁUKASZ',
      'DEF789012',
      '85032156789',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.lastName).toBe('Wójcik');
    expect(result.firstName).toBe('Łukasz');
  });

  it('handles inline label format (NAZWISKO KOWALSKI)', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'NAZWISKO KOWALSKI',
      'IMIĘ JAN',
      'ABC123456',
      '02271409876',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.lastName).toBe('Kowalski');
    expect(result.firstName).toBe('Jan');
  });

  it('falls back to name-like line filtering when no labels found', () => {
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

  it('does not match a 12-digit number as PESEL', () => {
    const ocrTexts = ['123456789012'];
    const result = parseIdCard(ocrTexts);
    expect(result.pesel).toBeNull();
  });

  it('handles ALL CAPS names with Polish diacritics via labels', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'NAZWISKO/SURNAME',
      'WÓJCIK',
      'IMIĘ/NAME',
      'ŁUKASZ',
      'DEF789012',
      '85032156789',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.lastName).toBe('Wójcik');
    expect(result.firstName).toBe('Łukasz');
  });

  it('handles mixed case OCR output with labels', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'Nazwisko/Surname',
      'NOWAK',
      'Imię/Name',
      'ANNA',
      'GHI345678',
      '90050512345',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.lastName).toBe('Nowak');
    expect(result.firstName).toBe('Anna');
  });

  it('ignores short garbage OCR fragments like "pl" or "rp"', () => {
    const ocrTexts = [
      'RZECZPOSPOLITA POLSKA',
      'pl',
      'rp',
      'NAZWISKO',
      'KOWALSKI',
      'IMIĘ',
      'JAN',
      'ABC123456',
      '02271409876',
    ];
    const result = parseIdCard(ocrTexts);
    expect(result.lastName).toBe('Kowalski');
    expect(result.firstName).toBe('Jan');
  });
});
