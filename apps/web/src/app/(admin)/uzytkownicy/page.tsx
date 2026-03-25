'use client';

import { useState, useMemo } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { type PaginationState, type SortingState } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/data-table/data-table';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  useUsers,
  useUpdateUser,
  useDeactivateUser,
  useResetPassword,
  type UserDto,
} from '@/hooks/queries/use-users';
import { getUserColumns } from './columns';

const createUserSchema = z.object({
  email: z.string().email('Nieprawidlowy adres email'),
  name: z.string().min(2, 'Imie musi miec co najmniej 2 znaki'),
  role: z.enum(['ADMIN', 'EMPLOYEE'], { required_error: 'Wybierz role' }),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UzytkownicyPage() {
  // Create user form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // DataTable state
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Edit dialog state
  const [editUser, setEditUser] = useState<UserDto | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  // Queries & mutations
  const { data: users, isLoading } = useUsers();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const resetPassword = useResetPassword();

  const columns = useMemo(
    () =>
      getUserColumns({
        onEdit: (user) => {
          setEditUser(user);
          setEditName(user.name);
          setEditRole(user.role);
        },
        onToggleActive: (user) => {
          deactivateUser.mutate({ id: user.id, isActive: !user.isActive });
        },
        onResetPassword: (user) => {
          resetPassword.mutate(user.id);
        },
      }),
    [deactivateUser, resetPassword],
  );

  const pageCount = Math.ceil((users?.length ?? 0) / pagination.pageSize);

  // Client-side pagination/sorting for the simple list
  const paginatedData = useMemo(() => {
    if (!users) return [];
    let sorted = [...users];
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      sorted.sort((a, b) => {
        const aVal = a[id as keyof UserDto];
        const bVal = b[id as keyof UserDto];
        if (aVal == null || bVal == null) return 0;
        if (aVal < bVal) return desc ? 1 : -1;
        if (aVal > bVal) return desc ? -1 : 1;
        return 0;
      });
    }
    const start = pagination.pageIndex * pagination.pageSize;
    return sorted.slice(start, start + pagination.pageSize);
  }, [users, sorting, pagination]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = createUserSchema.safeParse({ email, name, role: role || undefined });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CreateUserForm, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CreateUserForm;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Nie udalo sie utworzyc uzytkownika');
      }

      toast.success('Uzytkownik utworzony. Email z linkiem do ustawienia hasla zostal wyslany.');
      setEmail('');
      setName('');
      setRole('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Wystapil blad');
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditSave() {
    if (!editUser) return;
    updateUser.mutate(
      { id: editUser.id, data: { name: editName, role: editRole } },
      { onSuccess: () => setEditUser(null) },
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Zarzadzanie uzytkownikami</h1>

      {/* Collapsible Create User Form */}
      <Card className="max-w-lg">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setFormOpen(!formOpen)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nowy uzytkownik</CardTitle>
              <CardDescription>
                Utworz konto pracownika. Nowy uzytkownik otrzyma email z linkiem do ustawienia hasla.
              </CardDescription>
            </div>
            {formOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {formOpen && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jan@firma.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Imie i nazwisko</Label>
                <Input
                  id="name"
                  placeholder="Jan Kowalski"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rola</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Wybierz role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                    <SelectItem value="EMPLOYEE">Pracownik</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role}</p>
                )}
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Tworzenie...' : 'Utworz uzytkownika'}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* User DataTable */}
      <DataTable
        columns={columns}
        data={paginatedData}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isLoading}
      />

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj uzytkownika</DialogTitle>
            <DialogDescription>
              Zmien dane uzytkownika {editUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Imie i nazwisko</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rola</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="EMPLOYEE">Pracownik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Anuluj
            </Button>
            <Button onClick={handleEditSave} disabled={updateUser.isPending}>
              {updateUser.isPending ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
