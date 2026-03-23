import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UserRole } from '@rentapp/shared';

jest.mock('argon2');

const mockPrismaService = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockMailService = {
  sendSetupPasswordEmail: jest.fn().mockResolvedValue(undefined),
  sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    (argon2.hash as jest.Mock).mockResolvedValue('hashed-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('createUser', () => {
    const dto = { email: 'test@example.com', name: 'Jan Kowalski', role: UserRole.EMPLOYEE };
    const adminId = 'admin-uuid';
    const createdUser = {
      id: 'user-uuid',
      email: dto.email,
      name: dto.name,
      role: dto.role,
      passwordHash: null,
      setupToken: 'hashed-token',
      setupTokenExpiry: expect.any(Date),
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockPrismaService.user.create.mockResolvedValue(createdUser);
    });

    it('creates user with null passwordHash', async () => {
      await service.createUser(dto, adminId);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: dto.email,
          name: dto.name,
          role: dto.role,
          passwordHash: null,
        }),
      });
    });

    it('generates setup token with 72h expiry', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      await service.createUser(dto, adminId);

      // Verify argon2 was called to hash the token
      expect(argon2.hash).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          memoryCost: 32768,
          timeCost: 3,
          parallelism: 1,
        }),
      );

      // Verify 72h expiry
      const createCall = mockPrismaService.user.create.mock.calls[0][0];
      const expiry = createCall.data.setupTokenExpiry as Date;
      const expectedExpiry = new Date(now + 72 * 60 * 60 * 1000);
      expect(expiry.getTime()).toBe(expectedExpiry.getTime());

      // Verify the token stored is hashed (from argon2 mock), not raw
      expect(createCall.data.setupToken).toBe('hashed-token');

      jest.restoreAllMocks();
    });

    it('calls sendSetupPasswordEmail with raw token', async () => {
      await service.createUser(dto, adminId);

      // argon2.hash receives the raw token as first argument
      const rawToken = (argon2.hash as jest.Mock).mock.calls[0][0];
      expect(typeof rawToken).toBe('string');
      expect(rawToken).toHaveLength(64); // 32 bytes = 64 hex chars

      // Mail service should receive the raw (unhashed) token
      expect(mockMailService.sendSetupPasswordEmail).toHaveBeenCalledWith(
        dto.email,
        dto.name,
        rawToken,
      );

      // Stored token should be the hashed version, not raw
      const createCall = mockPrismaService.user.create.mock.calls[0][0];
      expect(createCall.data.setupToken).toBe('hashed-token');
      expect(createCall.data.setupToken).not.toBe(rawToken);
    });
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      const user = { id: 'user-uuid', email: 'test@example.com', name: 'Jan' };
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(user);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('returns null when not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nobody@example.com');

      expect(result).toBeNull();
    });
  });

  describe('requestPasswordReset', () => {
    const existingUser = {
      id: 'user-uuid',
      email: 'test@example.com',
      name: 'Jan Kowalski',
    };

    it('generates reset token with 1h expiry', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      await service.requestPasswordReset('test@example.com');

      expect(argon2.hash).toHaveBeenCalled();

      const updateCall = mockPrismaService.user.update.mock.calls[0][0];
      const expiry = updateCall.data.setupTokenExpiry as Date;
      const expectedExpiry = new Date(now + 1 * 60 * 60 * 1000);
      expect(expiry.getTime()).toBe(expectedExpiry.getTime());

      expect(mockMailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        existingUser.email,
        existingUser.name,
        expect.any(String),
      );

      jest.restoreAllMocks();
    });

    it('does not throw for non-existent email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.requestPasswordReset('nobody@example.com'),
      ).resolves.toBeUndefined();

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
      expect(mockMailService.sendResetPasswordEmail).not.toHaveBeenCalled();
    });
  });
});
