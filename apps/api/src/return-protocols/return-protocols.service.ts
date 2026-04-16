import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService, ReturnProtocolPdfData } from '../contracts/pdf/pdf.service';
import { MailService } from '../mail/mail.service';
import { StorageService } from '../storage/storage.service';
import { CreateReturnProtocolDto } from './dto/create-return-protocol.dto';
import { CLEANLINESS_LABELS, ProtocolCleanliness } from '@rentapp/shared';

@Injectable()
export class ReturnProtocolsService {
  private readonly logger = new Logger(ReturnProtocolsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly mailService: MailService,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateReturnProtocolDto, userId: string) {
    // 1. Find rental with customer and vehicle
    const rental = await this.prisma.rental.findUnique({
      where: { id: dto.rentalId },
      include: { customer: true, vehicle: true },
    });

    if (!rental) {
      throw new BadRequestException('Rental not found');
    }

    // 2. Check rental is ACTIVE or EXTENDED
    if (rental.status !== 'ACTIVE' && rental.status !== 'EXTENDED') {
      throw new BadRequestException(
        'Protocol can only be created for active or extended rentals',
      );
    }

    // 3. Check no existing protocol
    const existing = await this.prisma.returnProtocol.findUnique({
      where: { rentalId: dto.rentalId },
    });

    if (existing) {
      throw new BadRequestException(
        'Protocol already exists for this rental',
      );
    }

    // 4. Upload signatures
    const customerSigBuffer = Buffer.from(dto.customerSignatureBase64, 'base64');
    const workerSigBuffer = Buffer.from(dto.workerSignatureBase64, 'base64');

    const customerSigKey = `return-protocols/${dto.rentalId}/customer-signature.png`;
    const workerSigKey = `return-protocols/${dto.rentalId}/worker-signature.png`;

    await this.storageService.upload(customerSigKey, customerSigBuffer, 'image/png');
    await this.storageService.upload(workerSigKey, workerSigBuffer, 'image/png');

    // 5. Build PDF data
    const customerName = `${rental.customer.firstName} ${rental.customer.lastName}`;
    const vehicleMakeModel = `${rental.vehicle.make} ${rental.vehicle.model}`;
    const vehicleRegistration = rental.vehicle.registration;

    // Extract address from returnLocation JSON
    const returnLocationJson = rental.returnLocation as { address?: string } | null;
    const returnLocation = returnLocationJson?.address ?? null;

    const cleanlinessLabel = CLEANLINESS_LABELS[dto.cleanliness as ProtocolCleanliness];

    const pdfData: ReturnProtocolPdfData = {
      customerName,
      returnDateTime: new Date().toISOString(),
      vehicleMakeModel,
      vehicleRegistration,
      returnLocation,
      cleanlinessLabel,
      cleanlinessNote: dto.cleanlinessNote ?? null,
      otherNotes: dto.otherNotes ?? null,
      customerSignature: dto.customerSignatureBase64.startsWith('data:')
        ? dto.customerSignatureBase64
        : `data:image/png;base64,${dto.customerSignatureBase64}`,
      workerSignature: dto.workerSignatureBase64.startsWith('data:')
        ? dto.workerSignatureBase64
        : `data:image/png;base64,${dto.workerSignatureBase64}`,
    };

    // 6. Generate PDF
    const pdfBuffer = await this.pdfService.generateReturnProtocolPdf(pdfData);

    // 7. Upload PDF to R2
    const pdfKey = `return-protocols/${dto.rentalId}/protocol.pdf`;
    await this.storageService.upload(pdfKey, pdfBuffer, 'application/pdf');

    // 8. Create ReturnProtocol record
    const protocol = await this.prisma.returnProtocol.create({
      data: {
        rentalId: dto.rentalId,
        customerName,
        returnDateTime: new Date(),
        vehicleMakeModel,
        vehicleRegistration,
        returnLocation,
        cleanliness: dto.cleanliness,
        cleanlinessNote: dto.cleanlinessNote ?? null,
        otherNotes: dto.otherNotes ?? null,
        customerSignatureKey: customerSigKey,
        workerSignatureKey: workerSigKey,
        pdfKey,
        pdfGeneratedAt: new Date(),
        createdById: userId,
      },
    });

    // 9. Fire-and-forget email
    if (rental.customer.email) {
      setImmediate(() => {
        this.mailService
          .sendReturnProtocolEmail(
            rental.customer.email!,
            customerName,
            vehicleRegistration,
            pdfBuffer,
            rental.insuranceCaseNumber,
          )
          .then(() => {
            this.prisma.returnProtocol
              .update({
                where: { id: protocol.id },
                data: { emailSentAt: new Date() },
              })
              .catch(() => {});
          })
          .catch((err: Error) => {
            this.logger.error(
              `Failed to send protocol email for rental ${dto.rentalId}: ${err.message}`,
            );
          });
      });
    }

    return protocol;
  }

  async findByRentalId(rentalId: string) {
    return this.prisma.returnProtocol.findUnique({
      where: { rentalId },
    });
  }

  async getDownloadUrl(rentalId: string): Promise<string> {
    const protocol = await this.prisma.returnProtocol.findUnique({
      where: { rentalId },
    });

    if (!protocol || !protocol.pdfKey) {
      throw new NotFoundException('Protocol not found or PDF not generated');
    }

    return this.storageService.getPresignedDownloadUrl(protocol.pdfKey);
  }
}
