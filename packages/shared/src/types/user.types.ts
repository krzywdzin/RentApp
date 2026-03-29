export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER',
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
  deviceId: string;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  aud?: 'admin' | 'mobile';
  iat?: number;
  exp?: number;
}
