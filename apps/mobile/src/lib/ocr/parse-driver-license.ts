import type { DriverLicenseOcrFields } from '@rentapp/shared';

/**
 * Parse Polish driver license (prawo jazdy) OCR text into structured fields.
 *
 * Expected fields: licenseNumber, categories, expiryDate.
 *
 * @param ocrTexts Array of text blocks from expo-text-extractor
 */
export function parseDriverLicense(
  ocrTexts: string[],
): DriverLicenseOcrFields {
  const fullText = ocrTexts.join('\n');

  // License number: Polish format like "12345/67/8901" or "12345/12/1234"
  const licenseNumMatch = fullText.match(/\d{5}\/\d{2}\/\d{4}/);

  // Categories: B, B+E, A, A2, AM, C, D, etc.
  // Word boundaries prevent matching single letters inside words (e.g., "A" in "JAZDY")
  // Order matters -- longer patterns first to avoid partial matches
  const categoryMatch = fullText.match(
    /(?<![A-Za-z])(?:AM|A1|A2|A|B1|B\+E|BE|B|C1\+E|C1|C\+E|CE|C|D1\+E|D1|D\+E|DE|D|T)(?:\s*[,]?\s*(?:AM|A1|A2|A|B1|B\+E|BE|B|C1\+E|C1|C\+E|CE|C|D1\+E|D1|D\+E|DE|D|T))*(?![A-Za-z])/,
  );

  // Expiry date: DD.MM.YYYY or DD/MM/YYYY
  // Use lookbehind to avoid matching inside license numbers (e.g., 12345/67/8901)
  // Typically: dates[0] = DOB, dates[1] = issue date (4a), dates[2] = expiry date (4b)
  const dates =
    fullText.match(/(?<!\d[/])\b\d{2}[./]\d{2}[./]\d{4}\b/g) ?? [];
  const expiryRaw =
    dates.length >= 3
      ? dates[2]
      : dates.length === 2
        ? dates[1]
        : dates[0] ?? null;

  let expiryDate: string | null = null;
  if (expiryRaw) {
    const parts = expiryRaw.split(/[./]/);
    if (parts.length === 3) {
      expiryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return {
    licenseNumber: licenseNumMatch?.[0] ?? null,
    categories: categoryMatch?.[0]?.replace(/\s+/g, ', ') ?? null,
    expiryDate,
  };
}
