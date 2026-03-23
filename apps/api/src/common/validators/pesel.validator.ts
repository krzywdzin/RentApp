import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];

export function isValidPesel(pesel: string): boolean {
  if (!/^\d{11}$/.test(pesel)) {
    return false;
  }

  const digits = pesel.split('').map(Number);
  const sum = PESEL_WEIGHTS.reduce(
    (acc, weight, i) => acc + weight * digits[i],
    0,
  );
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === digits[10];
}

@ValidatorConstraint({ name: 'isValidPesel', async: false })
class IsValidPeselConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return typeof value === 'string' && isValidPesel(value);
  }

  defaultMessage(): string {
    return 'Invalid PESEL number';
  }
}

export function IsValidPesel(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPeselConstraint,
    });
  };
}
