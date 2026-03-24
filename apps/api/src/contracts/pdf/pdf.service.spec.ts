import * as Handlebars from 'handlebars';

// Mock puppeteer before importing PdfService
const mockPdf = jest.fn().mockResolvedValue(Buffer.from('fake-pdf'));
const mockClose = jest.fn().mockResolvedValue(undefined);
const mockSetContent = jest.fn().mockResolvedValue(undefined);
const mockEvaluateHandle = jest.fn().mockResolvedValue(undefined);
const mockNewPage = jest.fn().mockResolvedValue({
  setContent: mockSetContent,
  evaluateHandle: mockEvaluateHandle,
  pdf: mockPdf,
  close: mockClose,
});
const mockBrowserClose = jest.fn().mockResolvedValue(undefined);
const mockLaunch = jest.fn().mockResolvedValue({
  newPage: mockNewPage,
  close: mockBrowserClose,
});

jest.mock('puppeteer', () => ({
  launch: mockLaunch,
}));

// Mock fs to return template content
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('<html>{{company.name}}</html>'),
}));

import { PdfService } from './pdf.service';
import type { ContractPdfData, AnnexPdfData } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new PdfService();
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should launch Puppeteer browser on init', () => {
    expect(mockLaunch).toHaveBeenCalledWith({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    });
  });

  it('should close browser on destroy', async () => {
    await service.onModuleDestroy();
    expect(mockBrowserClose).toHaveBeenCalled();
  });

  it('should generate a contract PDF buffer', async () => {
    const data: ContractPdfData = {
      contractNumber: 'KITEK/2026/0324/0001',
      company: { name: 'KITEK', owner: 'Pawel Romanowski', address: 'ul. Sieradzka 18', phone: '535766666' },
      customer: {
        firstName: 'Jan', lastName: 'Kowalski', address: 'Torun',
        pesel: '90010100000', idNumber: 'ABC123', idIssuedBy: 'Torun',
        licenseNumber: 'XYZ789', licenseCategory: 'B',
        phone: '500000000', email: 'jan@test.com',
      },
      vehicle: {
        registration: 'CT12345', make: 'Toyota', model: 'Corolla',
        year: 2022, vin: 'VIN123456', mileage: 50000,
      },
      rental: {
        startDate: '2026-03-24T10:00:00Z', endDate: '2026-03-27T10:00:00Z',
        dailyRateNet: 15000, totalPriceNet: 45000, totalPriceGross: 55350, vatRate: 23,
      },
      conditions: { depositAmount: 50000, dailyRateNet: 15000, lateFeeNet: 30000 },
      signatures: {},
      damageSketch: undefined,
      rodoConsent: { accepted: true, timestamp: '2026-03-24T14:30:00Z' },
    };

    const result = await service.generateContractPdf(data);

    expect(result).toBeInstanceOf(Buffer);
    expect(mockNewPage).toHaveBeenCalled();
    expect(mockSetContent).toHaveBeenCalledWith(expect.any(String), { waitUntil: 'networkidle0' });
    expect(mockEvaluateHandle).toHaveBeenCalledWith('document.fonts.ready');
    expect(mockPdf).toHaveBeenCalledWith({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
    });
    expect(mockClose).toHaveBeenCalled();
  });

  it('should generate an annex PDF buffer', async () => {
    const data: AnnexPdfData = {
      annexNumber: 1,
      contractNumber: 'KITEK/2026/0324/0001',
      contractDate: '2026-03-24T10:00:00Z',
      customer: { firstName: 'Jan', lastName: 'Kowalski' },
      vehicle: { registration: 'CT12345', make: 'Toyota', model: 'Corolla' },
      changes: { newEndDate: '2026-03-30T10:00:00Z' },
      createdAt: '2026-03-27T12:00:00Z',
    };

    const result = await service.generateAnnexPdf(data);

    expect(result).toBeInstanceOf(Buffer);
    expect(mockNewPage).toHaveBeenCalled();
    expect(mockPdf).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it('should close page even if PDF generation fails', async () => {
    mockPdf.mockRejectedValueOnce(new Error('PDF error'));

    const data: ContractPdfData = {
      contractNumber: 'KITEK/2026/0324/0001',
      company: { name: 'KITEK', owner: 'Test', address: 'Test', phone: '000' },
      customer: {
        firstName: 'A', lastName: 'B', address: null,
        pesel: '0', idNumber: '0', idIssuedBy: null,
        licenseNumber: '0', licenseCategory: null,
        phone: '0', email: null,
      },
      vehicle: { registration: 'X', make: 'X', model: 'X', year: 2020, vin: 'X', mileage: 0 },
      rental: { startDate: '2026-01-01T00:00:00Z', endDate: '2026-01-02T00:00:00Z', dailyRateNet: 100, totalPriceNet: 100, totalPriceGross: 123, vatRate: 23 },
      conditions: { depositAmount: null, dailyRateNet: 100, lateFeeNet: null },
      signatures: {},
      rodoConsent: { accepted: false, timestamp: null },
    };

    await expect(service.generateContractPdf(data)).rejects.toThrow('PDF error');
    expect(mockClose).toHaveBeenCalled();
  });

  describe('Handlebars helpers', () => {
    it('formatDate converts ISO date to DD.MM.YYYY', () => {
      const helper = Handlebars.helpers['formatDate'] as (date: string) => string;
      expect(helper('2026-03-24T14:30:00Z')).toBe('24.03.2026');
    });

    it('formatDate returns - for null/undefined', () => {
      const helper = Handlebars.helpers['formatDate'] as (date: string) => string;
      expect(helper(null as any)).toBe('-');
      expect(helper(undefined as any)).toBe('-');
    });

    it('formatDateTime converts ISO date to DD.MM.YYYY HH:mm', () => {
      const helper = Handlebars.helpers['formatDateTime'] as (date: string) => string;
      const result = helper('2026-03-24T14:30:00Z');
      // Time depends on local timezone, so just check format
      expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
    });

    it('formatMoney converts grosze to zloty format', () => {
      const helper = Handlebars.helpers['formatMoney'] as (amount: number | null) => string;
      expect(helper(15000)).toBe('150,00 zl');
      expect(helper(100)).toBe('1,00 zl');
      expect(helper(0)).toBe('0,00 zl');
    });

    it('formatMoney returns - for null/undefined', () => {
      const helper = Handlebars.helpers['formatMoney'] as (amount: number | null) => string;
      expect(helper(null)).toBe('-');
      expect(helper(undefined as unknown as null)).toBe('-');
    });
  });
});
