import { BadRequestException } from '@nestjs/common';
import { calculatePricing } from './pricing';

describe('calculatePricing', () => {
  it('should calculate daily rate from total price', () => {
    const result = calculatePricing({ totalPriceNet: 50000, days: 5 });
    expect(result).toEqual({
      dailyRateNet: 10000,
      totalPriceNet: 50000,
      totalPriceGross: 61500,
      vatRate: 23,
    });
  });

  it('should calculate total price from daily rate', () => {
    const result = calculatePricing({ dailyRateNet: 10000, days: 5 });
    expect(result).toEqual({
      dailyRateNet: 10000,
      totalPriceNet: 50000,
      totalPriceGross: 61500,
      vatRate: 23,
    });
  });

  it('should round daily rate when total does not divide evenly', () => {
    const result = calculatePricing({ totalPriceNet: 10000, days: 3 });
    expect(result).toEqual({
      dailyRateNet: 3333,
      totalPriceNet: 10000,
      totalPriceGross: 12300,
      vatRate: 23,
    });
  });

  it('should use both values when both totalPriceNet and dailyRateNet provided', () => {
    const result = calculatePricing({
      totalPriceNet: 50000,
      dailyRateNet: 10000,
      days: 5,
    });
    expect(result).toEqual({
      dailyRateNet: 10000,
      totalPriceNet: 50000,
      totalPriceGross: 61500,
      vatRate: 23,
    });
  });

  it('should throw when neither totalPriceNet nor dailyRateNet provided', () => {
    expect(() => calculatePricing({ days: 5 })).toThrow(BadRequestException);
  });

  it('should support custom VAT rate', () => {
    const result = calculatePricing({
      totalPriceNet: 10000,
      days: 1,
      vatRate: 8,
    });
    expect(result).toEqual({
      dailyRateNet: 10000,
      totalPriceNet: 10000,
      totalPriceGross: 10800,
      vatRate: 8,
    });
  });
});
