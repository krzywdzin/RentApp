import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';
import {
  ResetPasswordRequestDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';

@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.login, dto.password);
    return this.authService.login(user.id, dto.deviceId);
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Headers('authorization') authHeader: string,
  ) {
    // Decode JWT without verification since access token may be expired
    const userId = this.extractUserIdFromExpiredToken(authHeader);
    return this.authService.refresh(userId, dto.deviceId, dto.refreshToken);
  }

  @Public()
  @Post('setup-password')
  async setupPassword(@Body() dto: SetupPasswordDto) {
    return this.authService.setupPassword(dto.token, dto.password);
  }

  @Public()
  @Post('reset-password-request')
  async resetPasswordRequest(@Body() dto: ResetPasswordRequestDto) {
    await this.usersService.requestPasswordReset(dto.email);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('logout')
  async logout(
    @CurrentUser() user: { id: string },
    @Body('deviceId') deviceId: string,
  ) {
    return this.authService.logout(user.id, deviceId);
  }

  private extractUserIdFromExpiredToken(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Access token required for refresh');
    }
    const token = authHeader.replace('Bearer ', '');
    try {
      // Decode without verification -- token may be expired
      const decoded = this.jwtService.decode(token) as { sub?: string };
      if (!decoded?.sub) {
        throw new UnauthorizedException('Invalid token');
      }
      return decoded.sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
