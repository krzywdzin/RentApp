import { CreateCustomerSchema } from './customer.schemas';

describe('CreateCustomerSchema', () => {
  const base = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    phone: '+48123456789',
    pesel: '44051401358',
    idNumber: 'ABC123456',
    licenseNumber: 'DRV789012',
  };

  it('accepts a customer without invoiceEmail (private person)', () => {
    const result = CreateCustomerSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('accepts a customer with a valid invoiceEmail (company)', () => {
    const result = CreateCustomerSchema.safeParse({
      ...base,
      invoiceEmail: 'faktury@firma.pl',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid invoiceEmail', () => {
    const result = CreateCustomerSchema.safeParse({
      ...base,
      invoiceEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('invoiceEmail'))).toBe(true);
    }
  });

  it('allows invoiceEmail to be null', () => {
    const result = CreateCustomerSchema.safeParse({ ...base, invoiceEmail: null });
    expect(result.success).toBe(true);
  });

  it('keeps personal email and invoice email as separate fields', () => {
    const result = CreateCustomerSchema.safeParse({
      ...base,
      email: 'jan@prywatnie.pl',
      invoiceEmail: 'faktury@firma.pl',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('jan@prywatnie.pl');
      expect(result.data.invoiceEmail).toBe('faktury@firma.pl');
    }
  });
});
