import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

export function isValidVin(vin: string): boolean {
  if (typeof vin !== 'string') {
    return false;
  }
  return VIN_REGEX.test(vin);
}

@ValidatorConstraint({ name: 'isValidVin', async: false })
class IsValidVinConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return typeof value === 'string' && isValidVin(value);
  }

  defaultMessage(): string {
    return 'Invalid VIN number';
  }
}

export function IsValidVin(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidVinConstraint,
    });
  };
}
