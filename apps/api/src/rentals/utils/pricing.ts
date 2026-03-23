import { BadRequestException } from '@nestjs/common';
import { PricingResult } from '@rentapp/shared';

const DEFAULT_VAT_RATE = 23;

export function calculatePricing(input: {
  totalPriceNet?: number;
  dailyRateNet?: number;
  days: number;
  vatRate?: number;
}): PricingResult {
  const vatRate = input.vatRate ?? DEFAULT_VAT_RATE;
  let dailyRateNet: number;
  let totalPriceNet: number;

  if (input.totalPriceNet != null && input.dailyRateNet != null) {
    dailyRateNet = input.dailyRateNet;
    totalPriceNet = input.totalPriceNet;
  } else if (input.totalPriceNet != null) {
    totalPriceNet = input.totalPriceNet;
    dailyRateNet = Math.round(totalPriceNet / input.days);
  } else if (input.dailyRateNet != null) {
    dailyRateNet = input.dailyRateNet;
    totalPriceNet = dailyRateNet * input.days;
  } else {
    throw new BadRequestException(
      'Either totalPriceNet or dailyRateNet must be provided',
    );
  }

  const totalPriceGross = Math.round(totalPriceNet * (1 + vatRate / 100));

  return { dailyRateNet, totalPriceNet, totalPriceGross, vatRate };
}
