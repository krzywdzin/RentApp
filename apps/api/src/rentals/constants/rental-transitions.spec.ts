import { BadRequestException } from '@nestjs/common';
import { RentalStatus } from '@rentapp/shared';
import { validateTransition } from './rental-transitions';

describe('validateTransition', () => {
  it('should allow DRAFT -> ACTIVE', () => {
    expect(() => validateTransition(RentalStatus.DRAFT, RentalStatus.ACTIVE)).not.toThrow();
  });

  it('should reject DRAFT -> RETURNED', () => {
    expect(() => validateTransition(RentalStatus.DRAFT, RentalStatus.RETURNED)).toThrow(
      BadRequestException,
    );
  });

  it('should allow ACTIVE -> EXTENDED', () => {
    expect(() => validateTransition(RentalStatus.ACTIVE, RentalStatus.EXTENDED)).not.toThrow();
  });

  it('should allow ACTIVE -> RETURNED', () => {
    expect(() => validateTransition(RentalStatus.ACTIVE, RentalStatus.RETURNED)).not.toThrow();
  });

  it('should allow EXTENDED -> RETURNED', () => {
    expect(() => validateTransition(RentalStatus.EXTENDED, RentalStatus.RETURNED)).not.toThrow();
  });

  it('should allow EXTENDED -> EXTENDED (re-extend)', () => {
    expect(() => validateTransition(RentalStatus.EXTENDED, RentalStatus.EXTENDED)).not.toThrow();
  });

  it('should reject RETURNED -> anything (terminal state)', () => {
    expect(() => validateTransition(RentalStatus.RETURNED, RentalStatus.ACTIVE)).toThrow(
      BadRequestException,
    );
  });

  it('should reject ACTIVE -> DRAFT without admin rollback', () => {
    expect(() =>
      validateTransition(RentalStatus.ACTIVE, RentalStatus.DRAFT, false),
    ).toThrow(BadRequestException);
  });

  it('should allow RETURNED -> ACTIVE with admin rollback', () => {
    expect(() =>
      validateTransition(RentalStatus.RETURNED, RentalStatus.ACTIVE, true),
    ).not.toThrow();
  });

  it('should allow ACTIVE -> DRAFT with admin rollback', () => {
    expect(() =>
      validateTransition(RentalStatus.ACTIVE, RentalStatus.DRAFT, true),
    ).not.toThrow();
  });
});
