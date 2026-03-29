import { Injectable, NotFoundException } from '@nestjs/common';
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
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await argon2.hash(rawToken, {
      memoryCost: 32768,
      timeCost: 3,
      parallelism: 1,
    });

    const setupTokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        passwordHash: null,
        setupToken: hashedToken,
        setupTokenExpiry,
      },
    });

    await this.mailService.sendSetupPasswordEmail(
      user.email,
      user.name,
      rawToken,
    );

    return { id: user.id, email: user.email, name: user.name, role: user.role };
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
    createdAt: true,
  } as const;

  async findAll() {
    return this.prisma.user.findMany({
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

  async resetPasswordByAdmin(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await argon2.hash(rawToken, {
      memoryCost: 32768,
      timeCost: 3,
      parallelism: 1,
    });

    const setupTokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id },
      data: {
        setupToken: hashedToken,
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        setupToken: hashedToken,
        setupTokenExpiry: resetTokenExpiry,
      },
    });

    await this.mailService.sendResetPasswordEmail(
      user.email,
      user.name,
      rawToken,
    );
  }
}
