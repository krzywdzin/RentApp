import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { PortalRentalDto, PortalCustomerInfo, PortalReturnInspectionData } from '@rentapp/shared';

@Injectable()
export class PortalService {
  private readonly logger = new Logger(PortalService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private storageService: StorageService,
    private config: ConfigService,
  ) {}

  /**
   * Generate a portal token for a customer. Returns the portal URL with raw token.
   * Token is hashed with argon2 before storage.
   */
  async generatePortalToken(customerId: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const hashedToken = await argon2.hash(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        portalToken: hashedToken,
        portalTokenExpiresAt: expiresAt,
      },
    });

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    return `${appUrl}/portal?token=${rawToken}&cid=${customerId}`;
  }

  /**
   * Exchange a raw magic link token for a portal JWT.
   */
  async exchangeToken(
    customerId: string,
    rawToken: string,
  ): Promise<{ accessToken: string }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || !customer.portalToken || !customer.portalTokenExpiresAt) {
      throw new UnauthorizedException();
    }

    // Check expiration
    if (customer.portalTokenExpiresAt < new Date()) {
      throw new UnauthorizedException(
        'Link wygasl. Skontaktuj sie z wypozyczalnia.',
      );
    }

    // Verify token
    const isValid = await argon2.verify(customer.portalToken, rawToken);
    if (!isValid) {
      throw new UnauthorizedException();
    }

    // Sign portal JWT
    const accessToken = this.jwtService.sign(
      { sub: customerId, type: 'portal' },
      { expiresIn: '24h' },
    );

    return { accessToken };
  }

  /**
   * Get basic customer info for portal header display.
   * Only firstName + lastName per RODO minimization.
   */
  async getCustomerInfo(customerId: string): Promise<PortalCustomerInfo> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { firstName: true, lastName: true },
    });

    if (!customer) {
      throw new NotFoundException();
    }

    return { firstName: customer.firstName, lastName: customer.lastName };
  }

  /**
   * Get all rentals for the authenticated customer.
   * Includes vehicle info and latest signed contract with presigned PDF URL.
   */
  async getRentals(customerId: string): Promise<PortalRentalDto[]> {
    const rentals = await this.prisma.rental.findMany({
      where: { customerId },
      include: {
        vehicle: true,
        contracts: {
          where: { status: 'SIGNED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results: PortalRentalDto[] = [];

    for (const rental of rentals) {
      const contract = rental.contracts[0] ?? null;
      let contractPdfUrl: string | null = null;

      if (contract?.pdfKey) {
        try {
          contractPdfUrl =
            await this.storageService.getPresignedDownloadUrl(
              contract.pdfKey,
              3600,
            );
        } catch (error: unknown) {
          this.logger.error(
            `Failed to generate presigned URL for ${contract.pdfKey}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      results.push({
        id: rental.id,
        vehicleMake: rental.vehicle.make,
        vehicleModel: rental.vehicle.model,
        vehicleRegistration: rental.vehicle.registration,
        startDate: rental.startDate.toISOString(),
        endDate: rental.endDate.toISOString(),
        status: rental.status,
        dailyRateNet: rental.dailyRateNet,
        totalPriceNet: rental.totalPriceNet,
        totalPriceGross: rental.totalPriceGross,
        vatRate: rental.vatRate,
        returnMileage: rental.returnMileage,
        returnData: rental.returnData as PortalReturnInspectionData | null,
        contractId: contract?.id ?? null,
        contractNumber: contract?.contractNumber ?? null,
        contractPdfUrl,
        createdAt: rental.createdAt.toISOString(),
      });
    }

    return results;
  }

  /**
   * Get rental detail for the authenticated customer.
   * Verifies ownership. Returns full detail with contract PDF URL.
   */
  async getRentalDetail(
    customerId: string,
    rentalId: string,
  ): Promise<PortalRentalDto> {
    const rental = await this.prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        vehicle: true,
        contracts: {
          where: { status: 'SIGNED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!rental || rental.customerId !== customerId) {
      throw new NotFoundException();
    }

    const contract = rental.contracts[0] ?? null;
    let contractPdfUrl: string | null = null;

    if (contract?.pdfKey) {
      try {
        contractPdfUrl =
          await this.storageService.getPresignedDownloadUrl(
            contract.pdfKey,
            3600,
          );
      } catch (error: unknown) {
        this.logger.error(
          `Failed to generate presigned URL for ${contract.pdfKey}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return {
      id: rental.id,
      vehicleMake: rental.vehicle.make,
      vehicleModel: rental.vehicle.model,
      vehicleRegistration: rental.vehicle.registration,
      startDate: rental.startDate.toISOString(),
      endDate: rental.endDate.toISOString(),
      status: rental.status,
      dailyRateNet: rental.dailyRateNet,
      totalPriceNet: rental.totalPriceNet,
      totalPriceGross: rental.totalPriceGross,
      vatRate: rental.vatRate,
      returnMileage: rental.returnMileage,
      returnData: rental.returnData as PortalReturnInspectionData | null,
      contractId: contract?.id ?? null,
      contractNumber: contract?.contractNumber ?? null,
      contractPdfUrl,
      createdAt: rental.createdAt.toISOString(),
    };
  }
}
