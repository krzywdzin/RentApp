import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  RentalDto,
  RentalStatus,
  CalendarResponse,
  ExtendRentalInput,
  ReturnRentalInput,
  CreateRentalInput,
} from '@rentapp/shared';
import { SettlementStatus } from '@rentapp/shared';

export const rentalKeys = {
  all: ['rentals'] as const,
  list: (filters?: Record<string, unknown>) => [...rentalKeys.all, 'list', filters] as const,
  detail: (id: string) => [...rentalKeys.all, 'detail', id] as const,
  calendar: (from: string, to: string) => [...rentalKeys.all, 'calendar', from, to] as const,
};

interface RentalFilters {
  status?: RentalStatus;
  customerId?: string;
  vehicleId?: string;
  filter?: 'active' | 'archived' | 'all';
}

export function useRentals(filters?: RentalFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.customerId) params.set('customerId', filters.customerId);
  if (filters?.vehicleId) params.set('vehicleId', filters.vehicleId);
  if (filters?.filter) params.set('filter', filters.filter);
  const query = params.toString();
  return useQuery({
    queryKey: rentalKeys.list(filters as Record<string, unknown> | undefined),
    queryFn: async () => {
      const res = await apiClient<{
        data: RentalDto[];
        total: number;
        page: number;
        limit: number;
      }>(`/rentals${query ? `?${query}` : ''}`);
      return res.data;
    },
  });
}

export function useArchivedRentals() {
  return useRentals({ filter: 'archived' });
}

export function useRental(id: string) {
  return useQuery({
    queryKey: rentalKeys.detail(id),
    queryFn: () => apiClient<RentalDto>(`/rentals/${id}`),
    enabled: !!id,
  });
}

export function useRentalCalendar(from: string, to: string) {
  return useQuery({
    queryKey: rentalKeys.calendar(from, to),
    queryFn: () =>
      apiClient<CalendarResponse>(
        `/rentals/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
    enabled: !!from && !!to,
  });
}

export function useCreateRental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRentalInput) =>
      apiClient<RentalDto>('/rentals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      toast.success('Wynajem utworzony');
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(
          'Pojazd jest juz zarezerwowany w wybranym terminie. Wybierz inny termin lub pojazd.',
        );
      } else {
        toast.error('Wystapil blad podczas tworzenia wynajmu');
      }
    },
  });
}

export function useActivateRental(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient<RentalDto>(`/rentals/${id}/activate`, {
        method: 'PATCH',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(id) });
      toast.success('Wynajem aktywowany');
    },
    onError: () => {
      toast.error('Nie udalo sie aktywowac wynajmu');
    },
  });
}

export function useReturnRental(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReturnRentalInput) =>
      apiClient<RentalDto>(`/rentals/${id}/return`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(id) });
      toast.success('Zwrot zarejestrowany');
    },
    onError: () => {
      toast.error('Nie udalo sie zarejestrowac zwrotu');
    },
  });
}

export function useExtendRental(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExtendRentalInput) =>
      apiClient<RentalDto>(`/rentals/${id}/extend`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(id) });
      toast.success('Wynajem przedluzony');
    },
    onError: () => {
      toast.error('Nie udalo sie przedluzyc wynajmu');
    },
  });
}

export function useRollbackRental(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient<RentalDto>(`/rentals/${id}/rollback`, {
        method: 'PATCH',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(id) });
      toast.success('Status cofniety');
    },
    onError: () => {
      toast.error('Nie udalo sie cofnac statusu');
    },
  });
}

export function useArchiveRental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<RentalDto>(`/rentals/${id}/archive`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      toast.success('Wynajem zarchiwizowany');
    },
    onError: () => {
      toast.error('Wystapil blad podczas archiwizacji wynajmu');
    },
  });
}

export function useUnarchiveRental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<RentalDto>(`/rentals/${id}/unarchive`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      toast.success('Wynajem przywrocony');
    },
    onError: () => {
      toast.error('Wystapil blad podczas przywracania wynajmu');
    },
  });
}

export function useSettlementRentals(filters?: {
  settlementStatus?: SettlementStatus;
  customerSearch?: string;
  vehicleSearch?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.settlementStatus) params.set('settlementStatus', filters.settlementStatus);
  if (filters?.customerSearch) params.set('customerSearch', filters.customerSearch);
  if (filters?.vehicleSearch) params.set('vehicleSearch', filters.vehicleSearch);
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);
  const query = params.toString();
  return useQuery({
    queryKey: rentalKeys.list({ view: 'settlement', ...filters } as Record<string, unknown>),
    queryFn: async () => {
      const res = await apiClient<{ data: RentalDto[]; total: number; page: number; limit: number }>(
        `/rentals${query ? `?${query}` : ''}`
      );
      return res.data;
    },
  });
}

export function useSettlementSummary() {
  return useQuery({
    queryKey: [...rentalKeys.all, 'settlement-summary'] as const,
    queryFn: () => apiClient<{ unsettledCount: number; unsettledAmount: number }>('/rentals/settlement-summary'),
  });
}

export function useUpdateSettlement(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { settlementStatus: SettlementStatus; settlementAmount?: number; settlementNotes?: string }) =>
      apiClient<RentalDto>(`/rentals/${id}/settlement`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(id) });
      toast.success('Rozliczenie zapisane.');
    },
    onError: () => {
      toast.error('Nie udalo sie zapisac rozliczenia. Sprobuj ponownie.');
    },
  });
}

export function useReturnProtocol(rentalId: string) {
  return useQuery({
    queryKey: ['return-protocol', rentalId],
    queryFn: () => apiClient<{ id: string; rentalId: string; pdfGeneratedAt?: string; emailSentAt?: string }>(`/return-protocols/${rentalId}`),
    enabled: !!rentalId,
    retry: false, // 404 is expected for rentals without protocol
  });
}

export function useDeleteRental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<void>(`/rentals/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      toast.success('Wynajem trwale usuniety');
    },
    onError: () => {
      toast.error('Wystapil blad podczas usuwania wynajmu');
    },
  });
}
