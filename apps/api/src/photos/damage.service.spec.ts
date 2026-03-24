import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DamageService } from './damage.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DamageService', () => {
  let service: DamageService;
  let prisma: any;

  const mockPin = {
    pinNumber: 1,
    svgView: 'top' as const,
    x: 50,
    y: 30,
    damageType: 'scratch' as const,
    severity: 'minor' as const,
    note: 'Small scratch on hood',
  };

  const mockReport = {
    id: 'report-1',
    walkthroughId: 'wt-1',
    pins: [mockPin],
    noDamageConfirmed: false,
  };

  beforeEach(async () => {
    prisma = {
      damageReport: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      photoWalkthrough: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DamageService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DamageService>(DamageService);
  });

  // DMG-01: Damage report creation
  describe('createOrUpdateReport()', () => {
    it('creates damage report with pins array', async () => {
      prisma.damageReport.upsert.mockResolvedValue(mockReport);

      const result = await service.createOrUpdateReport({
        walkthroughId: 'wt-1',
        pins: [mockPin],
      });

      expect(prisma.damageReport.upsert).toHaveBeenCalledWith({
        where: { walkthroughId: 'wt-1' },
        create: expect.objectContaining({
          walkthroughId: 'wt-1',
          pins: [mockPin],
          noDamageConfirmed: false,
        }),
        update: expect.objectContaining({
          pins: [mockPin],
          noDamageConfirmed: false,
        }),
      });
      expect(result).toEqual(mockReport);
    });

    it('validates pin coordinates are 0-100 percentage', async () => {
      const invalidPin = { ...mockPin, x: 150 };

      await expect(
        service.createOrUpdateReport({
          walkthroughId: 'wt-1',
          pins: [invalidPin],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates existing report if one exists for walkthrough', async () => {
      prisma.damageReport.upsert.mockResolvedValue({
        ...mockReport,
        pins: [mockPin, { ...mockPin, pinNumber: 2, x: 60 }],
      });

      const result = await service.createOrUpdateReport({
        walkthroughId: 'wt-1',
        pins: [mockPin, { ...mockPin, pinNumber: 2, x: 60 }],
      });

      expect(prisma.damageReport.upsert).toHaveBeenCalled();
      expect(result.pins).toHaveLength(2);
    });
  });

  // DMG-01: Pin management
  describe('addPin()', () => {
    it('adds a new pin with sequential pinNumber', async () => {
      prisma.damageReport.findUnique.mockResolvedValue({
        ...mockReport,
        pins: [{ ...mockPin, pinNumber: 1 }],
      });
      prisma.damageReport.update.mockResolvedValue({
        ...mockReport,
        pins: [
          { ...mockPin, pinNumber: 1 },
          { ...mockPin, pinNumber: 2, x: 60 },
        ],
      });

      const result = await service.addPin('wt-1', {
        pinNumber: 0, // will be overwritten
        svgView: 'top',
        x: 60,
        y: 30,
        damageType: 'scratch',
        severity: 'minor',
      });

      const updateCall = prisma.damageReport.update.mock.calls[0][0];
      const pins = updateCall.data.pins;
      expect(pins).toHaveLength(2);
      expect(pins[1].pinNumber).toBe(2);
    });

    it('validates damage type is one of 7 predefined types', async () => {
      prisma.damageReport.findUnique.mockResolvedValue(mockReport);

      await expect(
        service.addPin('wt-1', {
          pinNumber: 0,
          svgView: 'top',
          x: 50,
          y: 50,
          damageType: 'invalid_type' as any,
          severity: 'minor',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('validates severity is minor, moderate, or severe', async () => {
      prisma.damageReport.findUnique.mockResolvedValue(mockReport);

      await expect(
        service.addPin('wt-1', {
          pinNumber: 0,
          svgView: 'top',
          x: 50,
          y: 50,
          damageType: 'scratch',
          severity: 'invalid' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removePin()', () => {
    it('removes pin by pinNumber and renumbers remaining pins', async () => {
      const threePin = {
        ...mockReport,
        pins: [
          { ...mockPin, pinNumber: 1 },
          { ...mockPin, pinNumber: 2, x: 60 },
          { ...mockPin, pinNumber: 3, x: 70 },
        ],
      };
      prisma.damageReport.findUnique.mockResolvedValue(threePin);
      prisma.damageReport.update.mockResolvedValue({
        ...mockReport,
        pins: [
          { ...mockPin, pinNumber: 1 },
          { ...mockPin, pinNumber: 2, x: 70 },
        ],
      });

      await service.removePin('wt-1', 2);

      const updateCall = prisma.damageReport.update.mock.calls[0][0];
      const pins = updateCall.data.pins;
      expect(pins).toHaveLength(2);
      expect(pins[0].pinNumber).toBe(1);
      expect(pins[1].pinNumber).toBe(2); // renumbered from 3
    });

    it('throws NotFoundException for non-existent pin', async () => {
      prisma.damageReport.findUnique.mockResolvedValue(mockReport);

      await expect(service.removePin('wt-1', 99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // DMG-01: No damage confirmation
  describe('confirmNoDamage()', () => {
    it('sets noDamageConfirmed to true when pins array is empty', async () => {
      prisma.damageReport.findUnique.mockResolvedValue({
        ...mockReport,
        pins: [],
      });
      prisma.damageReport.update.mockResolvedValue({
        ...mockReport,
        pins: [],
        noDamageConfirmed: true,
      });

      const result = await service.confirmNoDamage('wt-1');

      expect(prisma.damageReport.update).toHaveBeenCalledWith({
        where: { walkthroughId: 'wt-1' },
        data: { noDamageConfirmed: true },
      });
      expect(result.noDamageConfirmed).toBe(true);
    });

    it('throws BadRequestException if pins exist', async () => {
      prisma.damageReport.findUnique.mockResolvedValue(mockReport);

      await expect(service.confirmNoDamage('wt-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirmNoDamage('wt-1')).rejects.toThrow(
        /Cannot confirm no damage when pins exist/,
      );
    });
  });

  // DMG-01: Damage comparison
  describe('getDamageComparison()', () => {
    const handoverPins = [
      { ...mockPin, pinNumber: 1 },
      { ...mockPin, pinNumber: 2, x: 60 },
    ];
    const returnPins = [
      { ...mockPin, pinNumber: 1, isPreExisting: true },
      { ...mockPin, pinNumber: 2, x: 60, isPreExisting: true },
      { ...mockPin, pinNumber: 3, x: 80, isPreExisting: false },
    ];

    it('returns handover pins and return pins separately', async () => {
      prisma.photoWalkthrough.findFirst
        .mockResolvedValueOnce({
          id: 'wt-1',
          type: 'HANDOVER',
          damageReport: { pins: handoverPins },
        })
        .mockResolvedValueOnce({
          id: 'wt-2',
          type: 'RETURN',
          damageReport: { pins: returnPins },
        });

      const result = await service.getDamageComparison('rental-1');

      expect(result.handoverPins).toHaveLength(2);
      expect(result.returnPins).toHaveLength(3);
    });

    it('identifies new pins (in return but not pre-existing)', async () => {
      prisma.photoWalkthrough.findFirst
        .mockResolvedValueOnce({
          id: 'wt-1',
          type: 'HANDOVER',
          damageReport: { pins: handoverPins },
        })
        .mockResolvedValueOnce({
          id: 'wt-2',
          type: 'RETURN',
          damageReport: { pins: returnPins },
        });

      const result = await service.getDamageComparison('rental-1');

      expect(result.newPins).toHaveLength(1);
      expect(result.newPins[0].pinNumber).toBe(3);
      expect(result.newPins[0].isPreExisting).toBe(false);
    });

    it('marks handover pins as isPreExisting in return context', async () => {
      prisma.photoWalkthrough.findFirst
        .mockResolvedValueOnce({
          id: 'wt-1',
          type: 'HANDOVER',
          damageReport: { pins: handoverPins },
        })
        .mockResolvedValueOnce({
          id: 'wt-2',
          type: 'RETURN',
          damageReport: { pins: returnPins },
        });

      const result = await service.getDamageComparison('rental-1');

      const preExisting = result.returnPins.filter((p: any) => p.isPreExisting);
      expect(preExisting).toHaveLength(2);
    });
  });
});
