import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { IdCardOcrFields, DriverLicenseOcrFields } from '@rentapp/shared';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly genAI: GoogleGenerativeAI | null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY', '');
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured — OCR will use regex fallback only');
    }
  }

  async parseIdCardImage(imageBase64: string): Promise<IdCardOcrFields> {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent([
          {
            inlineData: {
              data: imageBase64,
              mimeType: 'image/jpeg',
            },
          },
          `You are reading a Polish national ID card (dowód osobisty) from a photo.
Extract EXACTLY these fields from what you SEE on the card:
- firstName: the person first name (imię) — found after label IMIĘ/IMIONA/GIVEN NAMES on the card. This is a Polish first name like Antoni, Jan, Katarzyna. It is NEVER "Given Names", "Polskie", "Polska" etc.
- lastName: the person surname (nazwisko) — found after label NAZWISKO/SURNAME
- pesel: the 11-digit PESEL number
- documentNumber: the document number — 3 LETTERS + 6 DIGITS format (e.g. DKF187165). Look at the card carefully — OCR often confuses similar letters (E↔F, O↔0, I↔1, S↔5). The first 3 characters are ALWAYS letters.
- issuedBy: the issuing authority (organ wydający) — e.g. "PREZYDENT MIASTA BYDGOSZCZY", "STAROSTA POZNAŃSKI". Found after label ORGAN WYDAJĄCY/AUTHORITY.
- expiryDate: the expiry date (data ważności) in ISO format YYYY-MM-DD — found after label WAŻNY DO/EXPIRY DATE or DATA WAŻNOŚCI/DATE OF EXPIRY.

Return ONLY raw JSON: {"firstName": "...", "lastName": "...", "pesel": "...", "documentNumber": "...", "issuedBy": "...", "expiryDate": "..."}
If a field is unreadable, use null.`,
        ]);

        const text = result.response.text().trim();
        return this.parseJsonResponse<IdCardOcrFields>(text, {
          firstName: null,
          lastName: null,
          pesel: null,
          documentNumber: null,
          issuedBy: null,
          expiryDate: null,
        });
      } catch (err) {
        this.logger.warn(`Gemini Vision ID card attempt ${attempt + 1}/3 failed: ${err}`);
        if (attempt < 2) await this.delay(2000 * (attempt + 1));
      }
    }

    throw new Error('All Gemini Vision attempts failed');
  }

  async parseDriverLicenseImage(imageBase64: string): Promise<DriverLicenseOcrFields> {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent([
          {
            inlineData: {
              data: imageBase64,
              mimeType: 'image/jpeg',
            },
          },
          `You are reading a Polish driver license (prawo jazdy) from a photo.
Extract EXACTLY these fields from what you SEE on the card:
- licenseNumber: the license number in format XXXXX/XX/XXXX (e.g. 12345/67/8901)
- categories: driving categories separated by comma+space (e.g. "B", "B, B+E", "A2, B")
- expiryDate: expiry date in ISO format YYYY-MM-DD

Return ONLY raw JSON: {"licenseNumber": "...", "categories": "...", "expiryDate": "..."}
If a field is unreadable, use null.`,
        ]);

        const text = result.response.text().trim();
        return this.parseJsonResponse<DriverLicenseOcrFields>(text, {
          licenseNumber: null,
          categories: null,
          expiryDate: null,
        });
      } catch (err) {
        this.logger.warn(`Gemini Vision license attempt ${attempt + 1}/3 failed: ${err}`);
        if (attempt < 2) await this.delay(2000 * (attempt + 1));
      }
    }

    throw new Error('All Gemini Vision attempts failed');
  }

  async parseIdCard(texts: string[]): Promise<IdCardOcrFields> {
    if (this.genAI) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await this.parseIdCardWithGemini(texts);
        } catch (err) {
          this.logger.warn(`Gemini ID card attempt ${attempt + 1}/3 failed: ${err}`);
          if (attempt < 2) await this.delay(2000 * (attempt + 1));
        }
      }
      this.logger.error('All Gemini attempts failed, using regex fallback');
    }
    return this.parseIdCardRegex(texts);
  }

  async parseDriverLicense(texts: string[]): Promise<DriverLicenseOcrFields> {
    if (this.genAI) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await this.parseDriverLicenseWithGemini(texts);
        } catch (err) {
          this.logger.warn(`Gemini license attempt ${attempt + 1}/3 failed: ${err}`);
          if (attempt < 2) await this.delay(2000 * (attempt + 1));
        }
      }
      this.logger.error('All Gemini attempts failed, using regex fallback');
    }
    return this.parseDriverLicenseRegex(texts);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ---------- Gemini parsing ----------

  private async parseIdCardWithGemini(texts: string[]): Promise<IdCardOcrFields> {
    const model = this.genAI!.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const prompt = `You are an expert OCR post-processor for Polish national ID cards (dowód osobisty).

TASK: Extract personal data from raw OCR text of a Polish ID card photo.

FIELDS TO EXTRACT:
- firstName: the person's FIRST NAME (imię) — this is NOT nationality, NOT citizenship, NOT document type
- lastName: the person's SURNAME (nazwisko) — a family name like Kowalski, Nowak, Krzywdziński
- pesel: exactly 11 consecutive digits — the PESEL number
- documentNumber: 3 letters followed by 6 digits (e.g. ABC123456)
- issuedBy: the issuing authority (organ wydający) — e.g. "Prezydent Miasta Bydgoszczy", "Starosta Poznański". Found after label ORGAN WYDAJĄCY/AUTHORITY.
- expiryDate: the expiry date (data ważności) in ISO format YYYY-MM-DD — found after label WAŻNY DO/EXPIRY DATE or DATA WAŻNOŚCI/DATE OF EXPIRY. Convert DD.MM.YYYY to YYYY-MM-DD.

CRITICAL RULES:
1. "POLSKIE" / "POLSKIEEOO" / "POLSKA" / "POLAND" / "POLISH" = nationality/country label, NEVER a person's name
2. "OBYWATELSTWO" / "NATIONALITY" / "CITIZENSHIP" = field LABEL, NEVER a name. The VALUE next to it (like "POLSKIE") is also NOT a name.
3. Labels like "NAZWISKO/SURNAME", "IMIĘ/GIVEN NAMES", "DATA URODZENIA/DATE OF BIRTH" etc. are NOT names
4. The firstName is typically found AFTER the label "IMIĘ (IMIONA) / GIVEN NAMES"
5. The lastName is typically found AFTER the label "NAZWISKO / SURNAME"
6. Names contain Polish diacritics: ą, ć, ę, ł, ń, ó, ś, ź, ż
7. Names should be Title Case (Antoni, Krzywdziński — not ANTONI, KRZYWDZIŃSKI)
8. If OCR produced garbage characters, try to reconstruct the likely Polish name
9. If you cannot determine a field with reasonable confidence, return null

Respond ONLY with a raw JSON object, no markdown fences, no explanation:
{"firstName": "...", "lastName": "...", "pesel": "...", "documentNumber": "...", "issuedBy": "...", "expiryDate": "..."}

OCR text blocks:
${texts.map((t, i) => `[${i}] ${t}`).join('\n')}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return this.parseJsonResponse<IdCardOcrFields>(text, {
      firstName: null,
      lastName: null,
      pesel: null,
      documentNumber: null,
      issuedBy: null,
      expiryDate: null,
    });
  }

  private async parseDriverLicenseWithGemini(texts: string[]): Promise<DriverLicenseOcrFields> {
    const model = this.genAI!.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const prompt = `You are an OCR post-processor for Polish driver licenses (prawo jazdy).
Given the following raw OCR text blocks extracted from a photo of a Polish driver license, extract these fields:
- licenseNumber: the license number in format XXXXX/XX/XXXX (e.g. 12345/67/8901)
- categories: driving categories separated by comma+space (e.g. "B", "B, B+E", "A2, B")
- expiryDate: expiry date in ISO format YYYY-MM-DD

The OCR text may contain noise, misspellings, or formatting artifacts — do your best to extract the correct values.
If a field cannot be determined, use null.

Respond ONLY with a JSON object, no markdown, no explanation:
{"licenseNumber": "...", "categories": "...", "expiryDate": "..."}

OCR text blocks:
${texts.map((t, i) => `[${i}] ${t}`).join('\n')}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return this.parseJsonResponse<DriverLicenseOcrFields>(text, {
      licenseNumber: null,
      categories: null,
      expiryDate: null,
    });
  }

  private parseJsonResponse<T>(text: string, fallback: T): T {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    try {
      const parsed = JSON.parse(cleaned);
      return { ...fallback, ...parsed };
    } catch {
      this.logger.warn(`Failed to parse Gemini response as JSON: ${text}`);
      throw new Error('Invalid JSON response from Gemini');
    }
  }

  // ---------- Regex fallback (ported from mobile parsers) ----------

  private parseIdCardRegex(ocrTexts: string[]): IdCardOcrFields {
    const fullText = ocrTexts.join('\n');
    const lines = ocrTexts.map((l) => l.trim()).filter((l) => l.length > 0);

    const peselMatch = fullText.match(/(?<!\d)\d{11}(?!\d)/);
    const docNumMatch = fullText.match(/[A-Za-z]{3}\d{6}/);

    let lastName: string | null = null;
    let firstName: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/NAZWISKO|SURNAME/i.test(line) && !lastName) {
        const value = this.findNextNameValue(lines, i + 1);
        if (value) lastName = this.toTitleCase(value);
      }
      if (
        (/IMI[EĘŹ]|IMION/i.test(line) ||
          (/\bNAME/i.test(line) && !/SURNAME|NAZWISKO/i.test(line))) &&
        !firstName
      ) {
        const value = this.findNextNameValue(lines, i + 1);
        if (value) firstName = this.toTitleCase(value);
      }
    }

    if (!lastName) {
      const m = fullText.match(
        /(?:NAZWISKO|SURNAME)[^\S\n]*[:/]?[^\S\n]*([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż' -]*[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż'])/i,
      );
      if (m) lastName = this.toTitleCase(m[1]);
    }
    if (!firstName) {
      const m = fullText.match(
        /(?:IMI[EĘŹ]|IMION\w*)[^\S\n]*[:/]?[^\S\n]*([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż' -]*[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż'])/i,
      );
      if (m) firstName = this.toTitleCase(m[1]);
    }

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
        .map((l) => this.toTitleCase(l));

      if (!lastName && candidates[0]) lastName = candidates[0];
      if (!firstName && candidates[1]) firstName = candidates[1];
    }

    // Issuing authority: after "ORGAN WYDAJĄCY" or "AUTHORITY" label
    let issuedBy: string | null = null;
    for (let i = 0; i < lines.length; i++) {
      if (/ORGAN\s*WYDAJ|AUTHORITY/i.test(lines[i])) {
        // Value is on the next non-empty, non-label line(s)
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

    // Expiry date: after "WAŻNY DO" / "EXPIRY DATE" / "DATA WAŻNOŚCI" label
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

  private parseDriverLicenseRegex(ocrTexts: string[]): DriverLicenseOcrFields {
    const fullText = ocrTexts.join('\n');

    const licenseNumMatch = fullText.match(/\d{5}\s*\/\s*\d{2}\s*\/\s*\d{4}/);
    const categoryMatch = fullText.match(
      /(?<![A-Za-z])(?:AM|A1|A2|A|B1|B\+E|BE|B|C1\+E|C1|C\+E|CE|C|D1\+E|D1|D\+E|DE|D|T)(?:\s*[,]?\s*(?:AM|A1|A2|A|B1|B\+E|BE|B|C1\+E|C1|C\+E|CE|C|D1\+E|D1|D\+E|DE|D|T))*(?![A-Za-z])/,
    );

    const dateMatches = fullText.match(/(?<!\d[/])\b\d{2}[./]\d{2}[./]\d{4}\b/g) ?? [];
    let expiryDate: string | null = null;
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
      licenseNumber: licenseNumMatch?.[0]?.replace(/\s/g, '') ?? null,
      categories: categoryMatch?.[0]?.replace(/\s+/g, ', ') ?? null,
      expiryDate,
    };
  }

  // ---------- Helpers ----------

  private static readonly LABEL_WORDS =
    /^(GIVEN|NAMES?|SURNAME|NAZWISKO|IMI[EĘŹ]|IMIONA|IMION|DATE|BIRTH|OBYWATELSTWO|NATIONALITY|SEX|PLE[CĆ]|PŁEĆ|DATA|WYDANIA|WAŻNOŚCI|WAZNOSCI|ORGAN|OF|THE|PERSONAL|IDENTITY|CARD|DOCUMENT|NUMMER|NUMBER|NR|DOK|MIEJSCE|URODZENIA|PLACE|RODZINNE)$/i;

  private isNameLike(text: string): boolean {
    const trimmed = text.trim();
    return (
      trimmed.length >= 2 &&
      trimmed.length <= 30 &&
      !/\d/.test(trimmed) &&
      !OcrService.LABEL_WORDS.test(trimmed) &&
      /^[A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż'-]+$/i.test(trimmed)
    );
  }

  private findNextNameValue(lines: string[], startIdx: number): string | null {
    for (let j = startIdx; j < Math.min(startIdx + 3, lines.length); j++) {
      if (this.isNameLike(lines[j])) return lines[j];
    }
    return null;
  }

  private toTitleCase(name: string): string {
    return name
      .split(/(?<=[-\s])/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }
}
