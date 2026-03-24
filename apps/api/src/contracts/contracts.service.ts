import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service';
import { CustomersService } from '../customers/customers.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import type {
  ContractDto,
  ContractAnnexDto,
  ContractFrozenData,
  SignatureType,
  SignerRole,
} from '@rentapp/shared';
import { ContractStatus } from '@rentapp/shared';
import type { ContractPdfData } from './pdf/pdf.service';

const ALL_SIGNATURE_TYPES: SignatureType[] = [
  'customer_page1',
  'employee_page1',
  'customer_page2',
  'employee_page2',
];

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private storageService: StorageService,
    private mailService: MailService,
    private customersService: CustomersService,
    private config: ConfigService,
  ) {}

  private async generateContractNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const startOfDay = new Date(year, now.getMonth(), now.getDate());
    const count = await this.prisma.contract.count({
      where: { createdAt: { gte: startOfDay } },
    });

    const seq = (count + 1).toString().padStart(4, '0');
    return `KITEK/${year}/${month}${day}/${seq}`;
  }

  private buildFrozenData(
    rental: any,
    customer: any,
    vehicle: any,
    conditions: { depositAmount: number | null; dailyRateNet: number; lateFeeNet: number | null },
  ): ContractFrozenData {
    return {
      company: {
        name: 'KITEK',
        owner: 'Pawel Romanowski',
        address: 'ul. Sieradzka 18, 87-100 Torun',
        phone: '535 766 666 / 602 367 100',
      },
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        address: customer.address ?? null,
        pesel: customer.pesel,
        idNumber: customer.idNumber,
        idIssuedBy: customer.idIssuedBy ?? null,
        licenseNumber: customer.licenseNumber,
        licenseCategory: customer.licenseCategory ?? null,
        phone: customer.phone,
        email: customer.email ?? null,
      },
      vehicle: {
        registration: vehicle.registration,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        mileage: vehicle.mileage,
      },
      rental: {
        startDate: rental.startDate instanceof Date ? rental.startDate.toISOString() : rental.startDate,
        endDate: rental.endDate instanceof Date ? rental.endDate.toISOString() : rental.endDate,
        dailyRateNet: rental.dailyRateNet,
        totalPriceNet: rental.totalPriceNet,
        totalPriceGross: rental.totalPriceGross,
        vatRate: rental.vatRate,
      },
      conditions,
    };
  }

  generateContentHash(data: ContractFrozenData): string {
    const sortedStringify = (obj: any): string => {
      if (obj === null || obj === undefined) return JSON.stringify(obj);
      if (typeof obj !== 'object') return JSON.stringify(obj);
      if (Array.isArray(obj)) return '[' + obj.map(sortedStringify).join(',') + ']';
      const keys = Object.keys(obj).sort();
      return '{' + keys.map((k) => JSON.stringify(k) + ':' + sortedStringify(obj[k])).join(',') + '}';
    };
    const serialized = sortedStringify(data);
    return crypto.createHash('sha256').update(serialized, 'utf-8').digest('hex');
  }

  async create(dto: CreateContractDto, userId: string): Promise<ContractDto> {
    // 1. Fetch rental with includes
    const rental = await this.prisma.rental.findUnique({
      where: { id: dto.rentalId },
      include: { vehicle: true, customer: true },
    });
    if (!rental) {
      throw new NotFoundException(`Rental with ID "${dto.rentalId}" not found`);
    }

    // 2. Check no existing non-voided contract for this rental
    const existingContract = await this.prisma.contract.findFirst({
      where: {
        rentalId: dto.rentalId,
        status: { not: 'VOIDED' },
      },
    });
    if (existingContract) {
      throw new BadRequestException(
        'An active contract already exists for this rental',
      );
    }

    // 3. Get decrypted customer data
    const customer = await this.customersService.findOne(rental.customerId);

    // 4. Build frozen data
    const conditions = {
      depositAmount: dto.depositAmount ?? null,
      dailyRateNet: rental.dailyRateNet,
      lateFeeNet: dto.lateFeeNet ?? null,
    };
    const frozenData = this.buildFrozenData(rental, customer, rental.vehicle, conditions);

    // 5. Generate content hash
    const contentHash = this.generateContentHash(frozenData);

    // 6. Generate contract number
    const contractNumber = await this.generateContractNumber();

    // 7. Upload damage sketch if provided
    let damageSketchKey: string | null = null;
    if (dto.damageSketchBase64) {
      const buffer = Buffer.from(dto.damageSketchBase64, 'base64');
      damageSketchKey = await this.storageService.upload(
        `contracts/${rental.id}/damage-sketch.png`,
        buffer,
        'image/png',
      );
    }

    // 8. Create contract
    const contract = await this.prisma.contract.create({
      data: {
        contractNumber,
        rentalId: dto.rentalId,
        createdById: userId,
        status: ContractStatus.DRAFT,
        contractData: frozenData as any,
        contentHash,
        depositAmount: dto.depositAmount ?? null,
        dailyRateNet: rental.dailyRateNet,
        lateFeeNet: dto.lateFeeNet ?? null,
        rodoConsentAt: new Date(dto.rodoConsentAt),
        damageSketchKey,
      },
      include: { signatures: true, annexes: true },
    });

    return this.toDto(contract);
  }

  async sign(
    contractId: string,
    dto: SignContractDto,
    userId: string,
    ipAddress: string,
  ): Promise<ContractDto> {
    // 1. Fetch contract with signatures
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { signatures: true, annexes: true },
    });
    if (!contract) {
      throw new NotFoundException(`Contract with ID "${contractId}" not found`);
    }

    // 2. Validate status
    if (contract.status === 'SIGNED' || contract.status === 'VOIDED') {
      throw new BadRequestException(
        `Cannot sign a contract with status ${contract.status}`,
      );
    }

    // 3. Verify content hash
    const frozenData = contract.contractData as unknown as ContractFrozenData;
    const currentHash = this.generateContentHash(frozenData);
    if (currentHash !== contract.contentHash) {
      throw new BadRequestException('Contract data integrity check failed');
    }

    // 4. Upload signature to MinIO
    const signatureBuffer = Buffer.from(dto.signatureBase64, 'base64');
    const signatureKey = await this.storageService.upload(
      `contracts/${contract.rentalId}/signatures/${dto.signatureType}.png`,
      signatureBuffer,
      'image/png',
    );

    // 5. Determine signer role and ID
    const signerRole: SignerRole = dto.signatureType.startsWith('customer')
      ? 'customer'
      : 'employee';
    const signerId = signerRole === 'employee' ? userId : null;

    // 6. Upsert signature record
    await this.prisma.contractSignature.upsert({
      where: {
        contractId_signatureType: {
          contractId,
          signatureType: dto.signatureType,
        },
      },
      create: {
        contractId,
        signatureType: dto.signatureType,
        signerRole,
        signerId,
        signatureKey,
        contentHash: contract.contentHash,
        deviceInfo: dto.deviceInfo ?? null,
        ipAddress,
      },
      update: {
        signatureKey,
        contentHash: contract.contentHash,
        deviceInfo: dto.deviceInfo ?? null,
        ipAddress,
        signedAt: new Date(),
      },
    });

    // 7. Count total signatures
    const signatureCount = await this.prisma.contractSignature.count({
      where: { contractId },
    });

    if (signatureCount >= ALL_SIGNATURE_TYPES.length) {
      // All signatures collected - generate PDF
      // a. Fetch all signature images as base64
      const signatures: Record<string, string> = {};
      for (const sigType of ALL_SIGNATURE_TYPES) {
        const sig = await this.prisma.contractSignature.findUnique({
          where: {
            contractId_signatureType: { contractId, signatureType: sigType },
          },
        });
        if (sig) {
          const sigBuffer = await this.storageService.getBuffer(sig.signatureKey);
          signatures[this.sigTypeToKey(sigType)] = sigBuffer.toString('base64');
        }
      }

      // b. Fetch damage sketch as base64 if exists
      let damageSketch: string | undefined;
      if (contract.damageSketchKey) {
        const sketchBuffer = await this.storageService.getBuffer(
          contract.damageSketchKey,
        );
        damageSketch = sketchBuffer.toString('base64');
      }

      // c. Generate PDF
      const pdfData: ContractPdfData = {
        ...frozenData,
        contractNumber: contract.contractNumber,
        signatures: {
          employeePage1: signatures['employeePage1']
            ? `data:image/png;base64,${signatures['employeePage1']}`
            : undefined,
          customerPage1: signatures['customerPage1']
            ? `data:image/png;base64,${signatures['customerPage1']}`
            : undefined,
          employeePage2: signatures['employeePage2']
            ? `data:image/png;base64,${signatures['employeePage2']}`
            : undefined,
          customerPage2: signatures['customerPage2']
            ? `data:image/png;base64,${signatures['customerPage2']}`
            : undefined,
        },
        damageSketch: damageSketch
          ? `data:image/png;base64,${damageSketch}`
          : undefined,
        rodoConsent: {
          accepted: !!contract.rodoConsentAt,
          timestamp: contract.rodoConsentAt?.toISOString() ?? null,
        },
      };

      const pdfBuffer = await this.pdfService.generateContractPdf(pdfData);

      // d. Upload PDF to MinIO
      const pdfKey = `contracts/${contract.rentalId}/${contract.id}.pdf`;
      await this.storageService.upload(pdfKey, pdfBuffer, 'application/pdf');

      // e. Update contract status, pdfKey, pdfGeneratedAt
      const updateData: any = {
        status: ContractStatus.SIGNED,
        pdfKey,
        pdfGeneratedAt: new Date(),
      };

      // f. Email PDF to customer
      const customerEmail = frozenData.customer?.email;
      if (customerEmail) {
        try {
          const customerName = `${frozenData.customer.firstName} ${frozenData.customer.lastName}`;
          const vehicleReg = frozenData.vehicle.registration;
          await this.mailService.sendContractEmail(
            customerEmail,
            customerName,
            vehicleReg,
            contract.contractNumber,
            pdfBuffer,
          );
          updateData.emailSentAt = new Date();
          updateData.emailSentTo = customerEmail;
        } catch (error: any) {
          this.logger.error(
            `Failed to send contract email for ${contract.contractNumber}: ${error.message}`,
          );
        }
      }

      await this.prisma.contract.update({
        where: { id: contractId },
        data: updateData,
      });
    } else if (contract.status === 'DRAFT') {
      // Update to PARTIALLY_SIGNED
      await this.prisma.contract.update({
        where: { id: contractId },
        data: { status: ContractStatus.PARTIALLY_SIGNED },
      });
    }

    // Return updated contract
    const updated = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { signatures: true, annexes: true },
    });
    return this.toDto(updated!);
  }

  async findOne(id: string): Promise<ContractDto> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { signatures: true, annexes: true },
    });
    if (!contract) {
      throw new NotFoundException(`Contract with ID "${id}" not found`);
    }
    return this.toDto(contract);
  }

  async findByRental(rentalId: string): Promise<ContractDto[]> {
    const contracts = await this.prisma.contract.findMany({
      where: { rentalId },
      include: { signatures: true, annexes: true },
      orderBy: { createdAt: 'desc' },
    });
    return contracts.map((c) => this.toDto(c));
  }

  async createAnnex(
    rentalId: string,
    data: {
      newEndDate: string;
      createdById: string;
      newDailyRateNet?: number;
      newTotalPriceNet?: number;
    },
  ): Promise<ContractAnnexDto | null> {
    // 1. Find the SIGNED contract for this rental (most recent)
    const contract = await this.prisma.contract.findFirst({
      where: { rentalId, status: 'SIGNED' },
      orderBy: { createdAt: 'desc' },
    });

    if (!contract) {
      this.logger.warn(
        `No signed contract found for rental ${rentalId} — skipping annex creation`,
      );
      return null;
    }

    // 2. Count existing annexes
    const existingCount = await this.prisma.contractAnnex.count({
      where: { contractId: contract.id },
    });
    const annexNumber = existingCount + 1;

    // 3. Build changes object
    const frozenData = contract.contractData as unknown as ContractFrozenData;
    const changes: Record<string, any> = {
      newEndDate: data.newEndDate,
      oldEndDate: frozenData.rental.endDate,
    };
    if (data.newDailyRateNet != null) {
      changes.newDailyRateNet = data.newDailyRateNet;
    }
    if (data.newTotalPriceNet != null) {
      changes.newTotalPriceNet = data.newTotalPriceNet;
    }

    // 4. Create annex record
    const annex = await this.prisma.contractAnnex.create({
      data: {
        contractId: contract.id,
        annexNumber,
        changes,
      },
    });

    // 5. Generate annex PDF
    try {
      const pdfBuffer = await this.pdfService.generateAnnexPdf({
        annexNumber,
        contractNumber: contract.contractNumber,
        contractDate: contract.createdAt.toISOString(),
        customer: {
          firstName: frozenData.customer.firstName,
          lastName: frozenData.customer.lastName,
        },
        vehicle: {
          registration: frozenData.vehicle.registration,
          make: frozenData.vehicle.make,
          model: frozenData.vehicle.model,
        },
        changes: {
          newEndDate: data.newEndDate,
          newDailyRateNet: data.newDailyRateNet,
          newTotalPriceNet: data.newTotalPriceNet,
          newTotalPriceGross: data.newTotalPriceNet
            ? Math.round(data.newTotalPriceNet * 1.23)
            : undefined,
        },
        createdAt: new Date().toISOString(),
      });

      // 6. Upload to MinIO
      const pdfKey = `contracts/${rentalId}/annexes/${annex.id}.pdf`;
      await this.storageService.upload(pdfKey, pdfBuffer, 'application/pdf');

      // 7. Update annex with pdfKey
      const updateData: any = {
        pdfKey,
        pdfGeneratedAt: new Date(),
      };

      // 8. Email annex to customer
      const customerEmail = frozenData.customer?.email;
      if (customerEmail) {
        try {
          const customerName = `${frozenData.customer.firstName} ${frozenData.customer.lastName}`;
          await this.mailService.sendAnnexEmail(
            customerEmail,
            customerName,
            contract.contractNumber,
            annexNumber,
            pdfBuffer,
          );
          updateData.emailSentAt = new Date();
        } catch (error: any) {
          this.logger.error(
            `Failed to send annex email for ${contract.contractNumber}: ${error.message}`,
          );
        }
      }

      await this.prisma.contractAnnex.update({
        where: { id: annex.id },
        data: updateData,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to generate annex PDF for contract ${contract.id}: ${error.message}`,
      );
    }

    // Return updated annex
    const updated = await this.prisma.contractAnnex.findUnique({
      where: { id: annex.id },
    });
    return this.toAnnexDto(updated!);
  }

  toDto(contract: any): ContractDto {
    return {
      id: contract.id,
      contractNumber: contract.contractNumber,
      rentalId: contract.rentalId,
      createdById: contract.createdById,
      status: contract.status as ContractStatus,
      contractData: contract.contractData,
      contentHash: contract.contentHash,
      depositAmount: contract.depositAmount,
      dailyRateNet: contract.dailyRateNet,
      lateFeeNet: contract.lateFeeNet,
      rodoConsentAt: contract.rodoConsentAt?.toISOString() ?? null,
      damageSketchKey: contract.damageSketchKey,
      pdfKey: contract.pdfKey,
      pdfGeneratedAt: contract.pdfGeneratedAt?.toISOString() ?? null,
      emailSentAt: contract.emailSentAt?.toISOString() ?? null,
      emailSentTo: contract.emailSentTo,
      signatures: (contract.signatures ?? []).map((s: any) => ({
        id: s.id,
        contractId: s.contractId,
        signatureType: s.signatureType,
        signerRole: s.signerRole,
        signerId: s.signerId,
        signatureKey: s.signatureKey,
        contentHash: s.contentHash,
        deviceInfo: s.deviceInfo,
        ipAddress: s.ipAddress,
        signedAt: s.signedAt?.toISOString() ?? s.signedAt,
      })),
      annexes: (contract.annexes ?? []).map((a: any) => this.toAnnexDto(a)),
      createdAt: contract.createdAt?.toISOString() ?? contract.createdAt,
      updatedAt: contract.updatedAt?.toISOString() ?? contract.updatedAt,
    };
  }

  private toAnnexDto(annex: any): ContractAnnexDto {
    return {
      id: annex.id,
      contractId: annex.contractId,
      annexNumber: annex.annexNumber,
      changes: annex.changes,
      pdfKey: annex.pdfKey,
      pdfGeneratedAt: annex.pdfGeneratedAt?.toISOString() ?? null,
      emailSentAt: annex.emailSentAt?.toISOString() ?? null,
      createdAt: annex.createdAt?.toISOString() ?? annex.createdAt,
    };
  }

  private sigTypeToKey(sigType: SignatureType): string {
    const map: Record<SignatureType, string> = {
      customer_page1: 'customerPage1',
      employee_page1: 'employeePage1',
      customer_page2: 'customerPage2',
      employee_page2: 'employeePage2',
    };
    return map[sigType];
  }
}
