import { Injectable, Logger } from '@nestjs/common';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';

@Injectable()
export class PdfEncryptionService {
  private readonly logger = new Logger(PdfEncryptionService.name);
  private readonly MAX_RETRIES = 3;

  async encrypt(pdfBuffer: Buffer, password: string): Promise<Buffer> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const uint8 = new Uint8Array(pdfBuffer);
        const encrypted = await encryptPDF(uint8, password);
        return Buffer.from(encrypted);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `PDF encryption attempt ${attempt}/${this.MAX_RETRIES} failed: ${lastError.message}`,
        );
        if (attempt < this.MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, attempt * 500));
        }
      }
    }
    throw new Error(
      `PDF encryption failed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`,
    );
  }
}
