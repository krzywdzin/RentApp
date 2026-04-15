import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, ContractSignature, ContractAnnex } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service';
import { CustomersService } from '../customers/customers.service';
import { PortalService } from '../portal/portal.service';
import { SettingsService } from '../settings/settings.service';
import { RentalDriversService, RentalDriverDto } from '../rental-drivers/rental-drivers.service';
import { PdfEncryptionService } from './pdf/pdf-encryption.service';
import { SmsService } from '../notifications/sms/sms.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { ContractsQueryDto } from './dto/contracts-query.dto';
import type {
  ContractDto,
  ContractAnnexDto,
  ContractFrozenData,
  ContractFrozenDataV2,
  SignatureType,
  SignerRole,
  CustomerDto,
} from '@rentapp/shared';
import { ContractStatus, isV2 } from '@rentapp/shared';
import type { ContractSignatureDto } from '@rentapp/shared';
import type { ContractPdfData } from './pdf/pdf.service';

const CONTRACT_INCLUDE = {
  signatures: true,
  annexes: true,
} as const;

type ContractWithRelations = Prisma.ContractGetPayload<{
  include: typeof CONTRACT_INCLUDE;
}>;

const BASE_SIGNATURE_TYPES: SignatureType[] = [
  'customer_page1',
  'employee_page1',
  'customer_page2',
  'employee_page2',
];

function getRequiredSignatureTypes(frozenData: ContractFrozenData): SignatureType[] {
  const types: SignatureType[] = [...BASE_SIGNATURE_TYPES];
  if (isV2(frozenData) && frozenData.secondDriver) {
    types.push('second_customer_page1', 'second_customer_page2');
  }
  return types;
}

interface RentalForContract {
  startDate: Date | string;
  endDate: Date | string;
  dailyRateNet: number;
  totalPriceNet: number;
  totalPriceGross: number;
  vatRate: number;
  isCompanyRental: boolean;
  companyNip: string | null;
  vatPayerStatus: string | null;
  insuranceCaseNumber: string | null;
  rentalTerms: string | null;
  termsNotes: string | null;
  dailyKmLimit: number | null;
  excessKmRate: number | null;
  deposit: number | null;
  returnDeadlineHour: string | null;
  lateReturnPenalty: number | null;
  fuelLevelRequired: string | null;
  fuelCharge: number | null;
  crossBorderAllowed: boolean;
  dirtyReturnFee: number | null;
  deductible: number | null;
  deductibleWaiverFee: number | null;
}

interface VehicleForContract {
  registration: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  vehicleClass?: { name: string } | null;
}

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
    private portalService: PortalService,
    private settingsService: SettingsService,
    private rentalDriversService: RentalDriversService,
    private readonly pdfEncryptionService: PdfEncryptionService,
    private readonly smsService: SmsService,
  ) {}

  private generateContractNumberFromCount(count: number): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const seq = (count + 1).toString().padStart(4, '0');
    return `KITEK/${year}/${month}${day}/${seq}`;
  }

  /** @deprecated Use buildFrozenDataV2 for new contracts */
  private buildFrozenData(
    rental: RentalForContract,
    customer: CustomerDto,
    vehicle: VehicleForContract,
    conditions: { depositAmount: number | null; dailyRateNet: number; lateFeeNet: number | null },
  ): ContractFrozenData {
    return {
      company: {
        name: this.config.get<string>('COMPANY_NAME', 'KITEK'),
        owner: this.config.get<string>('COMPANY_OWNER', 'Pawel Romanowski'),
        address: this.config.get<string>('COMPANY_ADDRESS', 'ul. Sieradzka 18, 87-100 Torun'),
        phone: this.config.get<string>('COMPANY_PHONE', '535 766 666 / 602 367 100'),
      },
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        address:
          [customer.street, customer.houseNumber, customer.apartmentNumber]
            .filter(Boolean)
            .join(' ') +
            (customer.postalCode ? `, ${customer.postalCode}` : '') +
            (customer.city ? ` ${customer.city}` : '') || null,
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
        startDate:
          rental.startDate instanceof Date ? rental.startDate.toISOString() : rental.startDate,
        endDate: rental.endDate instanceof Date ? rental.endDate.toISOString() : rental.endDate,
        dailyRateNet: rental.dailyRateNet,
        totalPriceNet: rental.totalPriceNet,
        totalPriceGross: rental.totalPriceGross,
        vatRate: rental.vatRate,
      },
      conditions,
    };
  }

  private buildFrozenDataV2(
    rental: RentalForContract,
    customer: CustomerDto,
    vehicle: VehicleForContract,
    conditions: { depositAmount: number | null; dailyRateNet: number; lateFeeNet: number | null },
    termsHtml: string,
    secondDriver: RentalDriverDto | null,
  ): ContractFrozenDataV2 {
    const customerAddress =
      [
        [customer.street, customer.houseNumber].filter(Boolean).join(' '),
        [customer.postalCode, customer.city].filter(Boolean).join(' '),
      ]
        .filter(Boolean)
        .join(', ') || null;

    const secondDriverAddress = secondDriver
      ? [
          [secondDriver.street, secondDriver.houseNumber].filter(Boolean).join(' '),
          [secondDriver.postalCode, secondDriver.city].filter(Boolean).join(' '),
        ]
          .filter(Boolean)
          .join(', ') || null
      : null;

    return {
      version: 2,
      company: {
        name: this.config.get<string>('COMPANY_NAME', 'KITEK'),
        owner: this.config.get<string>('COMPANY_OWNER', 'Pawel Romanowski'),
        address: this.config.get<string>('COMPANY_ADDRESS', 'ul. Sieradzka 18, 87-100 Torun'),
        phone: this.config.get<string>('COMPANY_PHONE', '535 766 666 / 602 367 100'),
      },
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        street: customer.street ?? null,
        houseNumber: customer.houseNumber ?? null,
        postalCode: customer.postalCode ?? null,
        city: customer.city ?? null,
        address: customerAddress,
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
        vehicleClassName: vehicle.vehicleClass?.name ?? null,
      },
      rental: {
        startDate:
          rental.startDate instanceof Date ? rental.startDate.toISOString() : rental.startDate,
        endDate: rental.endDate instanceof Date ? rental.endDate.toISOString() : rental.endDate,
        dailyRateNet: rental.dailyRateNet,
        totalPriceNet: rental.totalPriceNet,
        totalPriceGross: rental.totalPriceGross,
        vatRate: rental.vatRate,
        isCompanyRental: rental.isCompanyRental,
        companyName: null, // Future: populated from GUS/NIP lookup
        companyNip: rental.companyNip ?? null,
        vatPayerStatus: rental.vatPayerStatus ?? null,
        insuranceCaseNumber: rental.insuranceCaseNumber ?? null,
        termsHtml,
        termsNotes: rental.termsNotes ?? null,
        dailyKmLimit: rental.dailyKmLimit ?? null,
        excessKmRate: rental.excessKmRate ?? null,
        deposit: rental.deposit ?? null,
        returnDeadlineHour: rental.returnDeadlineHour ?? null,
        lateReturnPenalty: rental.lateReturnPenalty ?? null,
        fuelLevelRequired: rental.fuelLevelRequired ?? null,
        fuelCharge: rental.fuelCharge ?? null,
        crossBorderAllowed: rental.crossBorderAllowed,
        dirtyReturnFee: rental.dirtyReturnFee ?? null,
        deductible: rental.deductible ?? null,
        deductibleWaiverFee: rental.deductibleWaiverFee ?? null,
      },
      conditions,
      secondDriver: secondDriver
        ? {
            firstName: secondDriver.firstName,
            lastName: secondDriver.lastName,
            pesel: secondDriver.pesel,
            idNumber: secondDriver.idNumber,
            licenseNumber: secondDriver.licenseNumber,
            licenseCategory: secondDriver.licenseCategory ?? null,
            address: secondDriverAddress,
            phone: secondDriver.phone ?? null,
          }
        : null,
    };
  }

  generateContentHash(data: ContractFrozenData): string {
    const sortedStringify = (obj: unknown): string => {
      if (obj === null || obj === undefined) return JSON.stringify(obj);
      if (typeof obj !== 'object') return JSON.stringify(obj);
      if (Array.isArray(obj)) return '[' + obj.map(sortedStringify).join(',') + ']';
      const record = obj as Record<string, unknown>;
      const keys = Object.keys(record).sort();
      return (
        '{' + keys.map((k) => JSON.stringify(k) + ':' + sortedStringify(record[k])).join(',') + '}'
      );
    };
    const serialized = sortedStringify(data);
    return crypto.createHash('sha256').update(serialized, 'utf-8').digest('hex');
  }

  async create(dto: CreateContractDto, userId: string): Promise<ContractDto> {
    // 1. Fetch rental with includes (v2: include vehicleClass on vehicle)
    const rental = await this.prisma.rental.findUnique({
      where: { id: dto.rentalId },
      include: { vehicle: { include: { vehicleClass: true } }, customer: true },
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
      throw new BadRequestException('An active contract already exists for this rental');
    }

    // 3. Get decrypted customer data
    const customer = await this.customersService.findOne(rental.customerId);

    // 4. Fetch second driver and resolve terms (v2)
    const secondDriver = await this.rentalDriversService.findByRentalId(rental.id);
    const termsHtml =
      rental.rentalTerms ?? (await this.settingsService.get('default_rental_terms')) ?? '';

    // 5. Build frozen data v2
    const conditions = {
      depositAmount: dto.depositAmount ?? null,
      dailyRateNet: rental.dailyRateNet,
      lateFeeNet: dto.lateFeeNet ?? null,
    };
    const frozenData = this.buildFrozenDataV2(
      rental,
      customer,
      rental.vehicle,
      conditions,
      termsHtml,
      secondDriver,
    );

    // 5. Generate content hash
    const contentHash = this.generateContentHash(frozenData);

    // 6. Upload damage sketch if provided (before transaction)
    let damageSketchKey: string | null = null;
    if (dto.damageSketchBase64) {
      // Strip data URI prefix if present (e.g. "data:image/png;base64,")
      const rawSketchBase64 = dto.damageSketchBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(rawSketchBase64, 'base64');
      damageSketchKey = await this.storageService.upload(
        `contracts/${rental.id}/damage-sketch.png`,
        buffer,
        'image/png',
      );
    }

    // 7. Atomic contract number generation + create inside transaction
    // Retry once on unique constraint violation (P2002) for concurrent requests
    const MAX_RETRIES = 1;
    let contract: ContractWithRelations | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        contract = await this.prisma.$transaction(async (tx) => {
          const now = new Date();
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const count = await tx.contract.count({
            where: { createdAt: { gte: startOfDay } },
          });
          const contractNumber = this.generateContractNumberFromCount(count);

          return tx.contract.create({
            data: {
              contractNumber,
              rentalId: dto.rentalId,
              createdById: userId,
              status: ContractStatus.DRAFT,
              contractData: frozenData as unknown as Prisma.InputJsonValue,
              contentHash,
              depositAmount: dto.depositAmount ?? null,
              dailyRateNet: rental.dailyRateNet,
              lateFeeNet: dto.lateFeeNet ?? null,
              rodoConsentAt: new Date(dto.rodoConsentAt),
              termsAcceptedAt: dto.termsAcceptedAt ? new Date(dto.termsAcceptedAt) : null,
              damageSketchKey,
            },
            include: CONTRACT_INCLUDE,
          });
        });
        break; // Success - exit retry loop
      } catch (error: unknown) {
        const prismaError = error as { code?: string; meta?: { target?: string[] } };
        const isUniqueViolation =
          prismaError?.code === 'P2002' || prismaError?.meta?.target?.includes('contractNumber');
        if (isUniqueViolation && attempt < MAX_RETRIES) {
          this.logger.warn(`Contract number collision on attempt ${attempt + 1}, retrying...`);
          continue;
        }
        throw error;
      }
    }

    return this.toDto(contract!);
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
      include: CONTRACT_INCLUDE,
    });
    if (!contract) {
      throw new NotFoundException(`Contract with ID "${contractId}" not found`);
    }

    // 2. Validate status
    if (contract.status === 'SIGNED' || contract.status === 'VOIDED') {
      throw new BadRequestException(`Cannot sign a contract with status ${contract.status}`);
    }

    // 3. Verify content hash
    const frozenData = contract.contractData as unknown as ContractFrozenData;
    const currentHash = this.generateContentHash(frozenData);
    if (currentHash !== contract.contentHash) {
      throw new BadRequestException('Contract data integrity check failed');
    }

    // 4. Upload signature to MinIO
    // Strip data URI prefix if present (e.g. "data:image/png;base64,")
    const rawSignatureBase64 = dto.signatureBase64.replace(/^data:image\/\w+;base64,/, '');
    const signatureBuffer = Buffer.from(rawSignatureBase64, 'base64');
    const signatureKey = await this.storageService.upload(
      `contracts/${contract.rentalId}/signatures/${dto.signatureType}.png`,
      signatureBuffer,
      'image/png',
    );

    // 5. Determine signer role and ID
    const signerRole: SignerRole =
      dto.signatureType.startsWith('customer') || dto.signatureType.startsWith('second_customer')
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

    const requiredSignatureTypes = getRequiredSignatureTypes(frozenData);
    if (signatureCount >= requiredSignatureTypes.length) {
      // All signatures collected — generate PDF BEFORE activating rental
      // a. Fetch all signature images as base64
      const signatures: Record<string, string> = {};
      for (const sigType of requiredSignatureTypes) {
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
        const sketchBuffer = await this.storageService.getBuffer(contract.damageSketchKey);
        damageSketch = sketchBuffer.toString('base64');
      }

      // c. Generate PDF — must succeed before rental activation
      let pdfBuffer: Buffer;
      try {
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
            secondCustomerPage1: signatures['secondCustomerPage1']
              ? `data:image/png;base64,${signatures['secondCustomerPage1']}`
              : undefined,
            secondCustomerPage2: signatures['secondCustomerPage2']
              ? `data:image/png;base64,${signatures['secondCustomerPage2']}`
              : undefined,
          },
          damageSketch: damageSketch ? `data:image/png;base64,${damageSketch}` : undefined,
          rodoConsent: {
            accepted: !!contract.rodoConsentAt,
            timestamp: contract.rodoConsentAt?.toISOString() ?? null,
          },
          termsAcceptance: {
            accepted: !!(contract as any).termsAcceptedAt,
            timestamp: (contract as any).termsAcceptedAt?.toISOString() ?? null,
          },
        };

        pdfBuffer = await this.pdfService.generateContractPdf(pdfData);
      } catch (pdfError: unknown) {
        this.logger.error(
          `PDF generation failed for contract ${contract.contractNumber}: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`,
          pdfError instanceof Error ? pdfError.stack : undefined,
        );
        throw new InternalServerErrorException('PDF generation failed');
      }

      // d. Upload PDF to storage — must succeed before rental activation
      const pdfKey = `contracts/${contract.rentalId}/${contract.id}.pdf`;
      try {
        await this.storageService.upload(pdfKey, pdfBuffer, 'application/pdf');
      } catch (uploadError: unknown) {
        this.logger.error(
          `PDF upload failed for contract ${contract.contractNumber}: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`,
          uploadError instanceof Error ? uploadError.stack : undefined,
        );
        throw new InternalServerErrorException('PDF upload failed');
      }

      // e. PDF generated and uploaded successfully — now update contract and activate rental
      const updateData: Prisma.ContractUpdateInput = {
        status: ContractStatus.SIGNED,
        pdfKey,
        pdfGeneratedAt: new Date(),
      };

      // f. Email PDF to customer (with portal magic link) — non-blocking
      const customerEmail = frozenData.customer?.email;
      if (customerEmail) {
        let portalUrl: string | undefined;
        try {
          const rental = await this.prisma.rental.findUnique({
            where: { id: contract.rentalId },
            select: { customerId: true },
          });
          if (rental) {
            portalUrl = await this.portalService.generatePortalToken(rental.customerId);
          }
        } catch (error: unknown) {
          this.logger.error(
            `Failed to generate portal token: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        // Fire and forget — do NOT await, never block contract signing
        const customerName = `${frozenData.customer.firstName} ${frozenData.customer.lastName}`;
        const vehicleReg = frozenData.vehicle.registration;
        const contractNumber = contract.contractNumber;
        const insuranceCaseNumber = isV2(frozenData) ? frozenData.rental.insuranceCaseNumber : null;
        const customerPhone = frozenData.customer.phone;
        // Send encrypted email — independent from SMS
        setImmediate(() => {
          this.pdfEncryptionService
            .encrypt(pdfBuffer, vehicleReg)
            .then((encryptedPdf) =>
              this.mailService.sendContractEmail(
                customerEmail,
                customerName,
                vehicleReg,
                contractNumber,
                encryptedPdf,
                portalUrl,
                insuranceCaseNumber,
              ),
            )
            .then(() => {
              this.logger.log(`Contract email sent for ${contractNumber}`);
            })
            .catch((error: unknown) => {
              this.logger.error(
                `Failed contract delivery for ${contractNumber}: ${error instanceof Error ? error.message : String(error)}`,
              );
              // PDF NOT sent if encryption fails — RODO compliant
            });
        });

        // Send PDF password SMS independently — must not depend on email success
        if (customerPhone) {
          setImmediate(() => {
            this.smsService
              .send(customerPhone, `Haslo do PDF umowy: ${vehicleReg}. KITEK`)
              .then(() => {
                this.logger.log(`PDF password SMS sent for ${contractNumber}`);
              })
              .catch((error: unknown) => {
                this.logger.error(
                  `Failed SMS for ${contractNumber}: ${error instanceof Error ? error.message : String(error)}`,
                );
              });
          });
        }
      }

      // g. Update contract status to SIGNED
      await this.prisma.contract.update({
        where: { id: contractId },
        data: updateData,
      });

      // h. Activate rental ONLY after PDF succeeded (idempotent guard)
      const rental = await this.prisma.rental.findUnique({
        where: { id: contract.rentalId },
        select: { status: true, vehicleId: true },
      });
      if (rental && rental.status === 'DRAFT') {
        await this.prisma.rental.update({
          where: { id: contract.rentalId },
          data: { status: 'ACTIVE' },
        });
        await this.prisma.vehicle.update({
          where: { id: rental.vehicleId },
          data: { status: 'RENTED' },
        });
      }
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
      include: CONTRACT_INCLUDE,
    });
    return this.toDto(updated!);
  }

  async findAll(
    query: ContractsQueryDto,
  ): Promise<{ data: ContractDto[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = query;

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        include: CONTRACT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.contract.count(),
    ]);

    return { data: contracts.map((c) => this.toDto(c)), total, page, limit };
  }

  async findOne(id: string): Promise<ContractDto> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: CONTRACT_INCLUDE,
    });
    if (!contract) {
      throw new NotFoundException(`Contract with ID "${id}" not found`);
    }
    return this.toDto(contract);
  }

  async voidContract(id: string, reason: string, userId: string): Promise<ContractDto> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: CONTRACT_INCLUDE,
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID "${id}" not found`);
    }

    if (contract.status === 'VOIDED') {
      throw new BadRequestException('Contract is already voided');
    }

    if (contract.status === 'SIGNED') {
      throw new BadRequestException(
        'Signed contracts cannot be voided — use annex or manual process',
      );
    }

    const updated = await this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.VOIDED,
        contractData: {
          ...(contract.contractData as Record<string, unknown>),
          voidReason: reason,
          voidedAt: new Date().toISOString(),
          voidedById: userId,
        },
      },
      include: CONTRACT_INCLUDE,
    });

    return this.toDto(updated);
  }

  async findByRental(rentalId: string): Promise<ContractDto[]> {
    const contracts = await this.prisma.contract.findMany({
      where: { rentalId },
      include: CONTRACT_INCLUDE,
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
      this.logger.warn(`No signed contract found for rental ${rentalId} — skipping annex creation`);
      return null;
    }

    // 2. Count existing annexes
    const existingCount = await this.prisma.contractAnnex.count({
      where: { contractId: contract.id },
    });
    const annexNumber = existingCount + 1;

    // 3. Build changes object
    const frozenData = contract.contractData as unknown as ContractFrozenData;
    const changes: Record<string, unknown> = {
      newEndDate: data.newEndDate,
      oldEndDate: frozenData.rental.endDate,
    };
    if (data.newDailyRateNet != null) {
      changes.newDailyRateNet = data.newDailyRateNet;
    }
    if (data.newTotalPriceNet != null) {
      changes.newTotalPriceNet = data.newTotalPriceNet;
    }

    // 4. Generate annex PDF BEFORE any DB write (clean failure if PDF fails)
    const annexId = crypto.randomUUID();
    let pdfKey: string | null = null;
    let pdfBuffer: Buffer | null = null;
    let pdfGeneratedAt: Date | null = null;

    try {
      pdfBuffer = await this.pdfService.generateAnnexPdf({
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
            ? Math.round(data.newTotalPriceNet * (1 + frozenData.rental.vatRate / 100))
            : undefined,
        },
        createdAt: new Date().toISOString(),
      });

      // 5. Upload to MinIO
      pdfKey = `contracts/${rentalId}/annexes/${annexId}.pdf`;
      await this.storageService.upload(pdfKey, pdfBuffer, 'application/pdf');
      pdfGeneratedAt = new Date();
    } catch (error: unknown) {
      this.logger.error(
        `Failed to generate annex PDF for contract ${contract.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 6. Email annex to customer (before DB write, only if PDF was generated)
    let emailSentAt: Date | null = null;
    if (pdfBuffer) {
      const customerEmail = frozenData.customer?.email;
      if (customerEmail) {
        try {
          const customerName = `${frozenData.customer.firstName} ${frozenData.customer.lastName}`;
          const vehicleReg = frozenData.vehicle.registration;
          const insuranceCaseNumber = isV2(frozenData)
            ? frozenData.rental.insuranceCaseNumber
            : null;
          const encryptedPdf = await this.pdfEncryptionService.encrypt(pdfBuffer, vehicleReg);
          await this.mailService.sendAnnexEmail(
            customerEmail,
            customerName,
            contract.contractNumber,
            annexNumber,
            encryptedPdf,
            insuranceCaseNumber,
          );
          emailSentAt = new Date();
          // SMS password notification after successful email
          const customerPhone = frozenData.customer.phone;
          if (customerPhone) {
            try {
              await this.smsService.send(customerPhone, `Haslo do PDF umowy: ${vehicleReg}. KITEK`);
              this.logger.log(
                `PDF password SMS sent for annex ${annexNumber} of ${contract.contractNumber}`,
              );
            } catch (smsError: unknown) {
              this.logger.error(
                `Failed to send PDF password SMS for annex ${contract.contractNumber}: ${smsError instanceof Error ? smsError.message : String(smsError)}`,
              );
              // SMS failure is non-blocking for annex creation
            }
          }
        } catch (error: unknown) {
          this.logger.error(
            `Failed to send annex email for ${contract.contractNumber}: ${error instanceof Error ? error.message : String(error)}`,
          );
          // If encryption fails, email is NOT sent — RODO compliant
        }
      }
    }

    // 7. Single DB create with all fields (no subsequent update needed)
    const annex = await this.prisma.contractAnnex.create({
      data: {
        id: annexId,
        contractId: contract.id,
        annexNumber,
        changes: changes as unknown as Prisma.InputJsonValue,
        pdfKey,
        pdfGeneratedAt,
        emailSentAt,
      },
    });

    return this.toAnnexDto(annex);
  }

  toDto(contract: ContractWithRelations): ContractDto {
    return {
      id: contract.id,
      contractNumber: contract.contractNumber,
      rentalId: contract.rentalId,
      createdById: contract.createdById,
      status: contract.status as ContractStatus,
      contractData: contract.contractData as Record<string, unknown>,
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
      signatures: (contract.signatures ?? []).map(
        (s: ContractSignature): ContractSignatureDto => ({
          id: s.id,
          contractId: s.contractId,
          signatureType: s.signatureType as ContractSignatureDto['signatureType'],
          signerRole: s.signerRole as ContractSignatureDto['signerRole'],
          signerId: s.signerId,
          signatureKey: s.signatureKey,
          contentHash: s.contentHash,
          deviceInfo: s.deviceInfo,
          ipAddress: s.ipAddress,
          signedAt: s.signedAt instanceof Date ? s.signedAt.toISOString() : String(s.signedAt),
        }),
      ),
      annexes: (contract.annexes ?? []).map((a: ContractAnnex) => this.toAnnexDto(a)),
      createdAt: contract.createdAt?.toISOString() ?? contract.createdAt,
      updatedAt: contract.updatedAt?.toISOString() ?? contract.updatedAt,
    };
  }

  private toAnnexDto(annex: ContractAnnex): ContractAnnexDto {
    return {
      id: annex.id,
      contractId: annex.contractId,
      annexNumber: annex.annexNumber,
      changes: annex.changes as Record<string, unknown>,
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
      second_customer_page1: 'secondCustomerPage1',
      second_customer_page2: 'secondCustomerPage2',
    };
    return map[sigType];
  }
}
