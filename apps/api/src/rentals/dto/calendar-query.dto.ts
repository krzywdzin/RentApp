import {
  IsISO8601,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

const MAX_RANGE_DAYS = 184; // ~6 months

@ValidatorConstraint({ name: 'calendarRange', async: false })
class CalendarRangeValidator implements ValidatorConstraintInterface {
  private reason = '';

  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as CalendarQueryDto;
    if (!obj.from || !obj.to) return true; // let @IsISO8601 handle missing

    const fromDate = new Date(obj.from);
    const toDate = new Date(obj.to);

    if (fromDate >= toDate) {
      this.reason = 'from must be before to';
      return false;
    }

    const diffDays =
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > MAX_RANGE_DAYS) {
      this.reason = 'Date range must not exceed 6 months';
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return this.reason;
  }
}

export class CalendarQueryDto {
  @IsISO8601()
  from!: string;

  @IsISO8601()
  @Validate(CalendarRangeValidator)
  to!: string;
}
