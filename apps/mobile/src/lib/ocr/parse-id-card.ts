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
  // OCR often returns ALL CAPS — normalize to title case for matching
  // Exclude known headers, labels, and non-name lines
  const excludePattern =
    /RZECZPOSPOLITA|DOWÓD|DOWOD|POLSKA|POLAND|IDENTITY|CARD|KARTA|TOŻSAMOŚCI|TOZSAMOSCI|REPUBLIC|SURNAME|NAME|DATE|NATIONALITY|SEX|OBYWATELSTWO|PLEC|PŁEĆ|DATA|NAZWISKO|IMION|IMIĘ|PESEL|WIEK|NR\s*DOK|DOKUMENT|ORGAN|WYDAJĄCY|WAŻN|WAZN|URODZENIA/i;

  const nameLines = ocrTexts
    .map((line) => line.trim())
    .filter((line) => {
      return (
        line.length >= 2 &&
        line.length <= 30 &&
        !excludePattern.test(line) &&
        !/\d/.test(line) &&
        /^[A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż-]+$/i.test(line)
      );
    })
    .map((name) =>
      name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
    );

  return {
    firstName: nameLines[1] ?? null,
    lastName: nameLines[0] ?? null,
    pesel: peselMatch?.[0] ?? null,
    documentNumber: docNumMatch?.[0] ?? null,
  };
}
