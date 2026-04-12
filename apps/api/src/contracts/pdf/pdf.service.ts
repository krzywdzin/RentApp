import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import * as Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ContractFrozenData } from '@rentapp/shared';

export type ContractPdfData = ContractFrozenData & {
  contractNumber: string;
  signatures: {
    employeePage1?: string;
    customerPage1?: string;
    employeePage2?: string;
    customerPage2?: string;
  };
  damageSketch?: string;
  rodoConsent: {
    accepted: boolean;
    timestamp: string | null;
  };
}

export interface AnnexPdfData {
  annexNumber: number;
  contractNumber: string;
  contractDate: string;
  customer: { firstName: string; lastName: string };
  vehicle: { registration: string; make: string; model: string };
  changes: {
    newEndDate?: string;
    newDailyRateNet?: number;
    newTotalPriceNet?: number;
    newTotalPriceGross?: number;
  };
  createdAt: string;
}

@Injectable()
export class PdfService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);
  private browser!: Browser;
  private contractTemplate!: Handlebars.TemplateDelegate;
  private annexTemplate!: Handlebars.TemplateDelegate;

  async onModuleInit() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    });
    this.logger.log('Puppeteer browser launched');

    // Register Handlebars helpers
    Handlebars.registerHelper('formatDate', (isoDate: string) => {
      if (!isoDate) return '-';
      const d = new Date(isoDate);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    });

    Handlebars.registerHelper('formatDateTime', (isoDate: string) => {
      if (!isoDate) return '-';
      const d = new Date(isoDate);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    });

    Handlebars.registerHelper('formatMoney', (grosze: number | null | undefined) => {
      if (grosze == null) return '-';
      const zloty = (grosze / 100).toFixed(2).replace('.', ',');
      return `${zloty} zl`;
    });

    // Compile templates
    const contractSource = readFileSync(
      join(__dirname, 'templates', 'contract.hbs'),
      'utf-8',
    );
    this.contractTemplate = Handlebars.compile(contractSource);

    const annexSource = readFileSync(
      join(__dirname, 'templates', 'annex.hbs'),
      'utf-8',
    );
    this.annexTemplate = Handlebars.compile(annexSource);

    this.logger.log('Handlebars templates compiled');
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Puppeteer browser closed');
    }
  }

  async generateContractPdf(data: ContractPdfData): Promise<Buffer> {
    const html = this.contractTemplate(data);
    const page = await this.browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.evaluateHandle('document.fonts.ready');
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  async generateAnnexPdf(data: AnnexPdfData): Promise<Buffer> {
    const html = this.annexTemplate(data);
    const page = await this.browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.evaluateHandle('document.fonts.ready');
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }
}
