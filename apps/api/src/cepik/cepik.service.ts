import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CepikVerificationResult,
  CepikVerificationDto,
} from '@rentapp/shared';
import { CepikVerificationStatus, CepikVerificationSource } from '@rentapp/shared';

// STUB: Replace with real CEPiK Carriers API when Ministry access is granted.
// See: biurocepik2.0@cyfra.gov.pl

@Injectable()
export class CepikService {
  private readonly logger = new Logger(CepikService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Stub implementation of driver license verification.
   * Returns configurable results based on input for testing.
   * In production, this will call the CEPiK Carriers API.
   */
  verifyDriverLicense(
    _firstName: string,
    _lastName: string,
    _licenseNumber: string,
    requiredCategory: string = 'B',
  ): CepikVerificationResult {
    // STUB: Always returns valid license with category B
    const licenseCategories = ['B'];
    const categoryMatch = licenseCategories.includes(requiredCategory);

    return {
      verified: categoryMatch,
      licenseValid: true,
      licenseSuspended: false,
      licenseCategories,
      categoryMatch,
      checkedAt: new Date().toISOString(),
      source: CepikVerificationSource.STUB,
    };
  }

  /**
   * Verify a driver license and persist the result in one operation.
   */
  async verify(
    customerId: string,
    rentalId: string | undefined,
    checkedById: string,
    firstName: string,
    lastName: string,
    licenseNumber: string,
    requiredCategory: string = 'B',
  ): Promise<CepikVerificationDto> {
    const result = this.verifyDriverLicense(
      firstName,
      lastName,
      licenseNumber,
      requiredCategory,
    );

    const status = result.verified
      ? CepikVerificationStatus.PASSED
      : CepikVerificationStatus.FAILED;

    const verification = await this.createVerification(
      customerId,
      rentalId,
      checkedById,
      status,
      result,
    );

    return this.toDto(verification);
  }

  /**
   * Create a CepikVerification record in the database.
   */
  async createVerification(
    customerId: string,
    rentalId: string | undefined,
    checkedById: string,
    status: string,
    result: CepikVerificationResult,
  ) {
    return this.prisma.cepikVerification.create({
      data: {
        customerId,
        rentalId: rentalId ?? null,
        status,
        result: result as any,
        checkedById,
      },
    });
  }

  /**
   * Override a failed verification (ADMIN only).
   */
  async overrideVerification(
    verificationId: string,
    reason: string,
    adminId: string,
  ): Promise<CepikVerificationDto> {
    const existing = await this.findOne(verificationId);

    const updated = await this.prisma.cepikVerification.update({
      where: { id: existing.id },
      data: {
        status: CepikVerificationStatus.OVERRIDDEN,
        overrideReason: reason,
        overriddenById: adminId,
        overriddenAt: new Date(),
      },
    });

    return this.toDto(updated);
  }

  /**
   * Find the latest verification for a rental.
   */
  async findByRental(rentalId: string): Promise<CepikVerificationDto> {
    const verification = await this.prisma.cepikVerification.findFirst({
      where: { rentalId },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      throw new NotFoundException(
        `No CEPiK verification found for rental ${rentalId}`,
      );
    }

    return this.toDto(verification);
  }

  /**
   * Find a single verification by ID.
   */
  async findOne(id: string) {
    const verification = await this.prisma.cepikVerification.findUnique({
      where: { id },
    });

    if (!verification) {
      throw new NotFoundException(`CEPiK verification ${id} not found`);
    }

    return verification;
  }

  private toDto(verification: any): CepikVerificationDto {
    return {
      id: verification.id,
      customerId: verification.customerId,
      rentalId: verification.rentalId,
      status: verification.status as any,
      result: verification.result as CepikVerificationResult | null,
      checkedById: verification.checkedById,
      overrideReason: verification.overrideReason,
      overriddenById: verification.overriddenById,
      overriddenAt: verification.overriddenAt
        ? new Date(verification.overriddenAt).toISOString()
        : null,
      createdAt: new Date(verification.createdAt).toISOString(),
    };
  }
}
