import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { type AuditLogDto } from '@rentapp/shared';
import { apiClient } from '@/lib/api-client';

export type { AuditLogDto as AuditLogEntry } from '@rentapp/shared';

export interface AuditResponse {
  data: AuditLogDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditFilters {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
}

export const auditKeys = {
  all: ['audit'] as const,
  list: (filters?: Record<string, unknown>) => [...auditKeys.all, 'list', filters] as const,
};

export function useAudit(filters: AuditFilters) {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(filters.limit));
  searchParams.set('offset', String(filters.offset));
  if (filters.entityType) searchParams.set('entityType', filters.entityType);
  if (filters.entityId) searchParams.set('entityId', filters.entityId);
  if (filters.actorId) searchParams.set('actorId', filters.actorId);
  if (filters.dateFrom) searchParams.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) searchParams.set('dateTo', filters.dateTo);

  const qs = searchParams.toString();

  return useQuery({
    queryKey: auditKeys.list(filters as unknown as Record<string, unknown>),
    queryFn: () => apiClient<AuditResponse>(`/audit?${qs}`),
    placeholderData: keepPreviousData,
  });
}
