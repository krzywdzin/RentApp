import type { DamagePin } from '@rentapp/shared';
import apiClient from './client';

export async function createWalkthrough(
  rentalId: string,
): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>('/walkthroughs', {
    rentalId,
    type: 'RETURN',
  });
  return data;
}

export async function createDamageReport(
  walkthroughId: string,
  pins: DamagePin[],
): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>('/damage-reports', {
    walkthroughId,
    pins,
  });
  return data;
}

export async function confirmNoDamage(
  walkthroughId: string,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(
    `/damage-reports/${walkthroughId}/no-damage`,
  );
  return data;
}
