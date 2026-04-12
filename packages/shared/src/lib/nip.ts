/**
 * NIP (Numer Identyfikacji Podatkowej) validator.
 * Polish tax identification number — 10 digits with mod-11 checksum.
 */

export const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

export function isValidNip(nip: string): boolean {
  if (!/^\d{10}$/.test(nip)) return false;

  const digits = nip.split('').map(Number);
  const sum = NIP_WEIGHTS.reduce((acc, weight, i) => acc + weight * digits[i], 0);
  const remainder = sum % 11;

  // remainder of 10 means invalid NIP
  if (remainder === 10) return false;

  return remainder === digits[9];
}
