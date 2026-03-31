import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface UserDto {
  id: string;
  email: string | null;
  username?: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const userKeys = {
  all: ['users'] as const,
  list: (filters?: Record<string, unknown>) => [...userKeys.all, 'list', filters] as const,
};

export function useUsers(filter: 'active' | 'archived' | 'all' = 'active') {
  return useQuery({
    queryKey: userKeys.list({ filter }),
    queryFn: () => apiClient<UserDto[]>(`/users?filter=${filter}`),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; role?: string; isActive?: boolean };
    }) =>
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

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      username: string;
      password: string;
      role: string;
      email?: string;
    }) =>
      apiClient<UserDto>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Uzytkownik utworzony. Pracownik moze sie zalogowac podanymi danymi.');
    },
    onError: () => {
      toast.error('Nie udalo sie utworzyc uzytkownika');
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

export function useArchiveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<UserDto>(`/users/${id}/archive`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Uzytkownik zarchiwizowany');
    },
    onError: () => {
      toast.error('Wystapil blad podczas archiwizacji uzytkownika');
    },
  });
}

export function useUnarchiveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<UserDto>(`/users/${id}/unarchive`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Uzytkownik przywrocony');
    },
    onError: () => {
      toast.error('Wystapil blad podczas przywracania uzytkownika');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<void>(`/users/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Uzytkownik trwale usuniety');
    },
    onError: () => {
      toast.error('Wystapil blad podczas usuwania uzytkownika');
    },
  });
}
