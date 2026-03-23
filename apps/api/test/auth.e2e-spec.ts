import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('Auth (e2e)', () => {
  // AUTH-01: Login
  it.todo('POST /auth/login with valid credentials returns access + refresh tokens');
  it.todo('POST /auth/login with invalid credentials returns 401');
  it.todo('POST /auth/login locks account after 5 failed attempts');

  // AUTH-02: Password management
  it.todo('POST /auth/setup-password with valid token sets password');
  it.todo('POST /auth/setup-password with expired token returns 401');
  it.todo('POST /auth/reset-password-request always returns 200 (no email leak)');
  it.todo('POST /auth/reset-password with valid token resets password');

  // AUTH-03: Token refresh
  it.todo('POST /auth/refresh with valid refresh token returns new token pair');
  it.todo('POST /auth/refresh with reused token invalidates all sessions (rotation)');
  it.todo('POST /auth/refresh with expired token returns 401');

  // AUTH-04: Role enforcement
  it.todo('POST /users without ADMIN role returns 403');
  it.todo('POST /users with ADMIN role creates user and returns 201');
  it.todo('GET /health without auth returns 200 (public endpoint)');
  it.todo('GET /users/me without auth returns 401');
});
