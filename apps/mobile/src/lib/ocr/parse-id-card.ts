import type { IdCardOcrFields } from '@rentapp/shared';

/**
 * Parse Polish ID card (dowod osobisty) OCR text into structured fields.
 *
 * Expected fields: firstName, lastName, PESEL, documentNumber.
 * Address is NOT on modern Polish ID cards (since 2015) -- must be entered manually.
 *
 * @param ocrTexts Array of text blocks from expo-text-extractor
 */
export function parseIdCard(ocrTexts: string[]): IdCardOcrFields {
  const fullText = ocrTexts.join('\n');

  // PESEL: exactly 11 consecutive digits (not part of a longer number)
  const peselMatch = fullText.match(/(?<!\d)\d{11}(?!\d)/);

  // Document number: 3 uppercase letters + 6 digits (e.g., ABC123456)
  const docNumMatch = fullText.match(/[A-Z]{3}\d{6}/);

  // Names: filter lines that look like Polish proper names
  // Exclude known headers, labels, and non-name lines
  const nameLines = ocrTexts.filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 1 &&
      !/RZECZPOSPOLITA|DOWÓD|DOWOD|POLSKA|POLAND|IDENTITY|CARD|KARTA|Surname|Name|Date|Nationality|Sex|Obywatelstwo|Plec|Data|Nazwisko|Imion|PESEL|Nr\s*dok/i.test(
        trimmed,
      ) &&
      /^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+$/.test(trimmed)
    );
  });

  return {
    firstName: nameLines[1]?.trim() ?? null,
    lastName: nameLines[0]?.trim() ?? null,
    pesel: peselMatch?.[0] ?? null,
    documentNumber: docNumMatch?.[0] ?? null,
  };
}
