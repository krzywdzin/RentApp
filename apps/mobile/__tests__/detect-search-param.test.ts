import { detectSearchParam } from '../src/api/customers.api';

describe('detectSearchParam', () => {
  it('routes 11 digits as PESEL', () => {
    expect(detectSearchParam('44051401359')).toEqual({
      pesel: '44051401359',
    });
  });

  it('routes 11 digits with spaces/dashes as PESEL (strips formatting)', () => {
    expect(detectSearchParam('440 514 013 59')).toEqual({
      pesel: '44051401359',
    });
  });

  it('routes string starting with + as phone', () => {
    expect(detectSearchParam('+48123456789')).toEqual({
      phone: '+48123456789',
    });
  });

  it('routes string starting with + and spaces as phone (preserves format)', () => {
    expect(detectSearchParam('+48 123 456 789')).toEqual({
      phone: '+48 123 456 789',
    });
  });

  it('routes 9 digits (not 11) as phone', () => {
    expect(detectSearchParam('123456789')).toEqual({
      phone: '123456789',
    });
  });

  it('routes 10 digits as phone (not PESEL)', () => {
    expect(detectSearchParam('1234567890')).toEqual({
      phone: '1234567890',
    });
  });

  it('routes 8 digits as lastName (too short for phone)', () => {
    expect(detectSearchParam('12345678')).toEqual({
      lastName: '12345678',
    });
  });

  it('routes text as lastName', () => {
    expect(detectSearchParam('Kowalski')).toEqual({
      lastName: 'Kowalski',
    });
  });

  it('trims whitespace from input', () => {
    expect(detectSearchParam('  Kowalski  ')).toEqual({
      lastName: 'Kowalski',
    });
  });
});
