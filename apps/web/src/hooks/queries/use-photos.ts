import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PhotoComparisonPair, DamageComparisonResult } from '@rentapp/shared';

export const photoKeys = {
  all: ['photos'] as const,
  comparison: (rentalId: string) => [...photoKeys.all, 'comparison', rentalId] as const,
  damageComparison: (rentalId: string) => [...photoKeys.all, 'damage-comparison', rentalId] as const,
};

export function usePhotoComparison(rentalId: string) {
  return useQuery({
    queryKey: photoKeys.comparison(rentalId),
    queryFn: () => apiClient<PhotoComparisonPair[]>(`/walkthroughs/rentals/${rentalId}/comparison`),
    enabled: !!rentalId,
  });
}

export function useDamageComparison(rentalId: string) {
  return useQuery({
    queryKey: photoKeys.damageComparison(rentalId),
    queryFn: () => apiClient<DamageComparisonResult>(`/damage-reports/comparison/${rentalId}`),
    enabled: !!rentalId,
  });
}
