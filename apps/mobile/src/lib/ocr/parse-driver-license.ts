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

  // License number: Polish format like "12345/67/8901" or "12345 / 67 / 8901" — tolerate spaces around slashes
  const licenseNumMatch = fullText.match(/\d{5}\s*\/\s*\d{2}\s*\/\s*\d{4}/);

  // Categories: B, B+E, A, A2, AM, C, D, etc.
  // Word boundaries prevent matching single letters inside words (e.g., "A" in "JAZDY")
  // Order matters -- longer patterns first to avoid partial matches
  const categoryMatch = fullText.match(
    /(?<![A-Za-z])(?:AM|A1|A2|A|B1|B\+E|BE|B|C1\+E|C1|C\+E|CE|C|D1\+E|D1|D\+E|DE|D|T)(?:\s*[,]?\s*(?:AM|A1|A2|A|B1|B\+E|BE|B|C1\+E|C1|C\+E|CE|C|D1\+E|D1|D\+E|DE|D|T))*(?![A-Za-z])/,
  );

  // Expiry date: DD.MM.YYYY or DD/MM/YYYY
  // Use lookbehind to avoid matching inside license numbers (e.g., 12345/67/8901)
  // Pick the latest valid date (expiry is always the furthest in the future)
  const dateMatches =
    fullText.match(/(?<!\d[/])\b\d{2}[./]\d{2}[./]\d{4}\b/g) ?? [];

  let expiryDate: string | null = null;
  let latestTs = -Infinity;

  for (const raw of dateMatches) {
    const parts = raw.split(/[./]/);
    if (parts.length !== 3) continue;
    const [dd, mm, yyyy] = parts;
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (isNaN(d.getTime())) continue;
    const day = d.getDate();
    const month = d.getMonth() + 1;
    if (day !== Number(dd) || month !== Number(mm)) continue;
    if (d.getTime() > latestTs) {
      latestTs = d.getTime();
      expiryDate = `${yyyy}-${mm}-${dd}`;
    }
  }

  return {
    licenseNumber: licenseNumMatch?.[0]?.replace(/\s/g, '') ?? null,
    categories: categoryMatch?.[0]?.replace(/\s+/g, ', ') ?? null,
    expiryDate,
  };
}
