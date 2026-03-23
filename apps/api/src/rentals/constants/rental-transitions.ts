import { BadRequestException } from '@nestjs/common';
import { RentalStatus } from '@rentapp/shared';

export const RENTAL_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  [RentalStatus.DRAFT]: [RentalStatus.ACTIVE],
  [RentalStatus.ACTIVE]: [RentalStatus.EXTENDED, RentalStatus.RETURNED],
  [RentalStatus.EXTENDED]: [RentalStatus.EXTENDED, RentalStatus.RETURNED],
  [RentalStatus.RETURNED]: [],
};

export const ADMIN_ROLLBACK_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  [RentalStatus.RETURNED]: [RentalStatus.ACTIVE, RentalStatus.EXTENDED],
  [RentalStatus.EXTENDED]: [RentalStatus.ACTIVE],
  [RentalStatus.ACTIVE]: [RentalStatus.DRAFT],
  [RentalStatus.DRAFT]: [],
};

export function validateTransition(
  current: RentalStatus,
  target: RentalStatus,
  isAdminRollback = false,
): void {
  const map = isAdminRollback ? ADMIN_ROLLBACK_TRANSITIONS : RENTAL_TRANSITIONS;
  const allowed = map[current] ?? [];
  if (!allowed.includes(target)) {
    throw new BadRequestException(
      `Cannot transition from ${current} to ${target}. Valid transitions: ${allowed.join(', ') || 'none (terminal state)'}`,
    );
  }
}
