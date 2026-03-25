import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const userKeys = {
  all: ['users'] as const,
  list: () => [...userKeys.all, 'list'] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => apiClient<UserDto[]>('/users'),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; role?: string; isActive?: boolean } }) =>
      apiClient<UserDto>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Uzytkownik zaktualizowany');
    },
    onError: () => {
      toast.error('Nie udalo sie zaktualizowac uzytkownika');
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient<UserDto>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success(variables.isActive ? 'Uzytkownik aktywowany' : 'Uzytkownik dezaktywowany');
    },
    onError: () => {
      toast.error('Nie udalo sie zmienic statusu uzytkownika');
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ success: boolean }>(`/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      toast.success('Email z linkiem do resetu hasla wyslany');
    },
    onError: () => {
      toast.error('Nie udalo sie wyslac emaila z resetem hasla');
    },
  });
}
