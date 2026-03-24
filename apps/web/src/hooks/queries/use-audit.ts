import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changesJson: Record<string, { old: unknown; new: unknown }>;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
}

export interface AuditResponse {
  data: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export const auditKeys = {
  all: ['audit'] as const,
  list: (params?: Record<string, unknown>) => [...auditKeys.all, 'list', params] as const,
};

export function useAudit(params?: {
  limit?: number;
  entityType?: string;
  entityId?: string;
  actorId?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.entityType) searchParams.set('entityType', params.entityType);
  if (params?.entityId) searchParams.set('entityId', params.entityId);
  if (params?.actorId) searchParams.set('actorId', params.actorId);

  const qs = searchParams.toString();

  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => apiClient<AuditResponse>(`/audit${qs ? `?${qs}` : ''}`),
  });
}
