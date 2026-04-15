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
  const lines = ocrTexts.map((l) => l.trim()).filter((l) => l.length > 0);

  // PESEL: exactly 11 consecutive digits (not part of a longer number)
  const peselMatch = fullText.match(/(?<!\d)\d{11}(?!\d)/);

  // Document number: 3 letters + 6 digits (e.g., ABC123456) — case-insensitive for OCR
  const docNumMatch = fullText.match(/[A-Za-z]{3}\d{6}/);

  // Strategy 1: Label-based extraction (most reliable)
  // Polish ID cards have bilingual labels like "NAZWISKO / SURNAME" or
  // "IMIĘ (IMIONA) / GIVEN NAMES" — value follows on the next non-label line
  let lastName: string | null = null;
  let firstName: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for surname label, then scan forward for first real name value
    if (/NAZWISKO|SURNAME/i.test(line) && !lastName) {
      const value = findNextNameValue(lines, i + 1);
      if (value) lastName = toTitleCase(value);
    }
    // Look for first name label, then scan forward for first real name value
    if (
      (/IMI[EĘŹ]|IMION/i.test(line) || (/\bNAME/i.test(line) && !/SURNAME|NAZWISKO/i.test(line))) &&
      !firstName
    ) {
      const value = findNextNameValue(lines, i + 1);
      if (value) firstName = toTitleCase(value);
    }
  }

  // Strategy 2: Label and value on the same line (e.g., "NAZWISKO KOWALSKI")
  if (!lastName) {
    const surnameInline = fullText.match(
      /(?:NAZWISKO|SURNAME)[^\S\n]*[:/]?[^\S\n]*([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż' -]*[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż'])/i,
    );
    if (surnameInline) lastName = toTitleCase(surnameInline[1]);
  }
  if (!firstName) {
    const nameInline = fullText.match(
      /(?:IMI[EĘŹ]|IMION\w*)[^\S\n]*[:/]?[^\S\n]*([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż' -]*[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż'])/i,
    );
    if (nameInline) firstName = toTitleCase(nameInline[1]);
  }

  // Strategy 3: Fallback — filter name-like lines (least reliable)
  if (!lastName || !firstName) {
    const headerPattern =
      /RZECZPOSPOLITA|DOW[OÓ]D|POLSKA|POLAND|IDENTITY|CARD|KARTA|TO[ZŻ]SAMO|REPUBLIC|SURNAME|GIVEN|NAMES?|DATE|NATIONALITY|SEX|OBYWATEL|PLE[CĆ]|DATA|NAZWISKO|IMI[EĘŹ]|IMION|PESEL|NR\s*DOK|DOKUMENT|ORGAN|WYDAJ|WA[ZŻ]N|URODZ|MIEJSCE|PLACE|BIRTH|PERSONAL|NUMMER|NUMBER/i;

    const candidates = lines
      .filter(
        (line) =>
          line.length >= 2 &&
          line.length <= 30 &&
          !headerPattern.test(line) &&
          !/\d/.test(line) &&
          /^[A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż'-]+$/i.test(line),
      )
      .map(toTitleCase);

    if (!lastName && candidates[0]) lastName = candidates[0];
    if (!firstName && candidates[1]) firstName = candidates[1];
  }

  // Issuing authority: after "ORGAN WYDAJĄCY" or "AUTHORITY" label
  let issuedBy: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    if (/ORGAN\s*WYDAJ|AUTHORITY/i.test(lines[i])) {
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const candidate = lines[j];
        if (
          candidate.length >= 3 &&
          !/ORGAN|WYDAJ|AUTHORITY|WA[ZŻ]N|EXPIRY|DATA/i.test(candidate) &&
          !/^\d+$/.test(candidate)
        ) {
          issuedBy = candidate;
          break;
        }
      }
      break;
    }
  }

  // Expiry date: pick the latest valid DD.MM.YYYY / DD/MM/YYYY date
  let expiryDate: string | null = null;
  const dateMatches = fullText.match(/(?<!\d[/])\b\d{2}[./]\d{2}[./]\d{4}\b/g) ?? [];
  let latestTs = -Infinity;

  for (const raw of dateMatches) {
    const parts = raw.split(/[./]/);
    if (parts.length !== 3) continue;
    const [dd, mm, yyyy] = parts;
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (isNaN(d.getTime())) continue;
    if (d.getDate() !== Number(dd) || d.getMonth() + 1 !== Number(mm)) continue;
    if (d.getTime() > latestTs) {
      latestTs = d.getTime();
      expiryDate = `${yyyy}-${mm}-${dd}`;
    }
  }

  return {
    firstName,
    lastName,
    pesel: peselMatch?.[0] ?? null,
    documentNumber: docNumMatch?.[0]?.toUpperCase() ?? null,
    issuedBy,
    expiryDate,
  };
}

// Words that appear as part of bilingual ID card labels — NOT actual names
const LABEL_WORDS =
  /^(GIVEN|NAMES?|SURNAME|NAZWISKO|IMI[EĘŹ]|IMIONA|IMION|DATE|BIRTH|OBYWATELSTWO|NATIONALITY|SEX|PLE[CĆ]|PŁEĆ|DATA|WYDANIA|WAŻNOŚCI|WAZNOSCI|ORGAN|OF|THE|PERSONAL|IDENTITY|CARD|DOCUMENT|NUMMER|NUMBER|NR|DOK|MIEJSCE|URODZENIA|PLACE|RODZINNE)$/i;

function isNameLike(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.length >= 2 &&
    trimmed.length <= 30 &&
    !/\d/.test(trimmed) &&
    !LABEL_WORDS.test(trimmed) &&
    /^[A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż'-]+$/i.test(trimmed)
  );
}

// Scan forward from startIdx to find the first line that is a real name (not a label word)
function findNextNameValue(lines: string[], startIdx: number): string | null {
  for (let j = startIdx; j < Math.min(startIdx + 3, lines.length); j++) {
    if (isNameLike(lines[j])) return lines[j];
  }
  return null;
}

function toTitleCase(name: string): string {
  return name
    .split(/(?<=[-\s])/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}
