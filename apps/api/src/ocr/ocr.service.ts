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

  async parseIdCard(texts: string[]): Promise<IdCardOcrFields> {
    if (this.genAI) {
      try {
        return await this.parseIdCardWithGemini(texts);
      } catch (err) {
        this.logger.error('Gemini ID card parsing failed, using regex fallback', err);
      }
    }
    return this.parseIdCardRegex(texts);
  }

  async parseDriverLicense(texts: string[]): Promise<DriverLicenseOcrFields> {
    if (this.genAI) {
      try {
        return await this.parseDriverLicenseWithGemini(texts);
      } catch (err) {
        this.logger.error('Gemini driver license parsing failed, using regex fallback', err);
      }
    }
    return this.parseDriverLicenseRegex(texts);
  }

  // ---------- Gemini parsing ----------

  private async parseIdCardWithGemini(texts: string[]): Promise<IdCardOcrFields> {
    const model = this.genAI!.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-05-20',
    });

    const prompt = `You are an OCR post-processor for Polish ID cards (dowód osobisty).
Given the following raw OCR text blocks extracted from a photo of a Polish ID card, extract these fields:
- firstName: the person's first name (imię)
- lastName: the person's surname (nazwisko)
- pesel: the 11-digit PESEL number
- documentNumber: the document number (3 letters + 6 digits, e.g. ABC123456)

Polish names may contain diacritics: ą, ć, ę, ł, ń, ó, ś, ź, ż.
Names should be in Title Case (first letter uppercase, rest lowercase).
The OCR text may contain noise, misspellings, or formatting artifacts — do your best to extract the correct values.
If a field cannot be determined, use null.

Respond ONLY with a JSON object, no markdown, no explanation:
{"firstName": "...", "lastName": "...", "pesel": "...", "documentNumber": "..."}

OCR text blocks:
${texts.map((t, i) => `[${i}] ${t}`).join('\n')}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return this.parseJsonResponse<IdCardOcrFields>(text, {
      firstName: null,
      lastName: null,
      pesel: null,
      documentNumber: null,
    });
  }

  private async parseDriverLicenseWithGemini(texts: string[]): Promise<DriverLicenseOcrFields> {
    const model = this.genAI!.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-05-20',
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

    return {
      firstName,
      lastName,
      pesel: peselMatch?.[0] ?? null,
      documentNumber: docNumMatch?.[0]?.toUpperCase() ?? null,
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
