import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async createUser(dto: CreateUserDto, adminId: string) {
    // Fast-create path: password provided directly (e.g., worker accounts)
    if (dto.password) {
      const passwordHash = await argon2.hash(dto.password, {
        memoryCost: 32768,
        timeCost: 3,
        parallelism: 1,
      });

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          name: dto.name,
          role: dto.role,
          passwordHash,
          setupToken: null,
          setupTokenExpiry: null,
        },
      });

      return { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role };
    }

    // Email setup flow: generate setup token and send email
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await argon2.hash(rawToken, {
      memoryCost: 32768,
      timeCost: 3,
      parallelism: 1,
    });

    const setupTokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const setupTokenIdentifier = rawToken.slice(0, 8);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        name: dto.name,
        role: dto.role,
        passwordHash: null,
        setupToken: hashedToken,
        setupTokenIdentifier,
        setupTokenExpiry,
      },
    });

    if (dto.email) {
      await this.mailService.sendSetupPasswordEmail(
        user.email!,
        user.name,
        rawToken,
      );
    }

    return { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  private readonly userSelectFields = {
    id: true,
    email: true,
    username: true,
    name: true,
    role: true,
    isActive: true,
    isArchived: true,
    createdAt: true,
  } as const;

  async findAll(filter: 'active' | 'archived' | 'all' = 'active') {
    const where =
      filter === 'all'
        ? {}
        : filter === 'archived'
          ? { isArchived: true }
          : { isArchived: false };
    return this.prisma.user.findMany({
      where,
      select: this.userSelectFields,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: this.userSelectFields,
    });
  }

  async archive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id },
      data: { isArchived: true, isActive: false },
      select: this.userSelectFields,
    });
  }

  async unarchive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id },
      data: { isArchived: false, isActive: true },
      select: this.userSelectFields,
    });
  }

  async hardDelete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check no active rentals reference this user as createdBy
    const activeRentals = await this.prisma.rental.count({
      where: {
        createdById: id,
        status: { in: ['ACTIVE', 'EXTENDED', 'DRAFT'] },
      },
    });
    if (activeRentals > 0) {
      throw new BadRequestException(
        'Cannot delete user with active rentals',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Nullify audit log references
      await tx.auditLog.updateMany({
        where: { actorId: id },
        data: { actorId: null },
      });

      // Delete in-app notifications
      await tx.inAppNotification.deleteMany({ where: { userId: id } });

      // Delete user
      await tx.user.delete({ where: { id } });
    });

    return { id: user.id, name: user.name, email: user.email };
  }

  async resetPasswordByAdmin(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.email) {
      throw new NotFoundException('User has no email address for password reset');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await argon2.hash(rawToken, {
      memoryCost: 32768,
      timeCost: 3,
      parallelism: 1,
    });

    const setupTokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const setupTokenIdentifier = rawToken.slice(0, 8);

    await this.prisma.user.update({
      where: { id },
      data: {
        setupToken: hashedToken,
        setupTokenIdentifier,
        setupTokenExpiry,
      },
    });

    await this.mailService.sendSetupPasswordEmail(
      user.email,
      user.name,
      rawToken,
    );
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await argon2.hash(rawToken, {
      memoryCost: 32768,
      timeCost: 3,
      parallelism: 1,
    });

    const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000);
    const setupTokenIdentifier = rawToken.slice(0, 8);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        setupToken: hashedToken,
        setupTokenIdentifier,
        setupTokenExpiry: resetTokenExpiry,
      },
    });

    await this.mailService.sendResetPasswordEmail(
      user.email!,
      user.name,
      rawToken,
    );
  }
}
