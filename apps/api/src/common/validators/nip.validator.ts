import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidNip } from '@rentapp/shared';

@ValidatorConstraint({ name: 'isValidNip', async: false })
export class IsValidNipConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return typeof value === 'string' && isValidNip(value);
  }

  defaultMessage(): string {
    return 'Invalid NIP number';
  }
}

export function IsValidNip(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidNipConstraint,
    });
  };
}
