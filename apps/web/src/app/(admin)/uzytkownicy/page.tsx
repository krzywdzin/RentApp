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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table/data-table';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  useResetPassword,
  useArchiveUser,
  useUnarchiveUser,
  useDeleteUser,
  type UserDto,
} from '@/hooks/queries/use-users';
import { getUserColumns, getArchivedUserColumns } from './columns';

const createUserSchema = z.object({
  username: z.string().min(3, 'Nazwa uzytkownika musi miec co najmniej 3 znaki'),
  name: z.string().min(2, 'Imie musi miec co najmniej 2 znaki'),
  password: z.string().min(8, 'Haslo musi miec co najmniej 8 znakow'),
  role: z.enum(['ADMIN', 'EMPLOYEE'], { required_error: 'Wybierz role' }),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UzytkownicyPage() {
  // Create user form state
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserForm, string>>>({});
  const [formOpen, setFormOpen] = useState(false);

  // DataTable state
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Archived tab state
  const [archivedPagination, setArchivedPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [archivedSorting, setArchivedSorting] = useState<SortingState>([]);

  // Edit dialog state
  const [editUser, setEditUser] = useState<UserDto | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);

  // Queries & mutations
  const { data: users, isLoading } = useUsers();
  const { data: archivedUsers, isLoading: archivedLoading } = useUsers('archived');
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const resetPassword = useResetPassword();
  const archiveUser = useArchiveUser();
  const unarchiveUser = useUnarchiveUser();
  const deleteUser = useDeleteUser();

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
        onArchive: (user) => {
          archiveUser.mutate(user.id);
        },
        onDelete: (user) => {
          setDeleteTarget(user);
        },
      }),
    [deactivateUser, resetPassword, archiveUser],
  );

  const archivedColumns = useMemo(
    () =>
      getArchivedUserColumns({
        onUnarchive: (user) => unarchiveUser.mutate(user.id),
        onHardDelete: (user) => setDeleteTarget(user),
      }),
    [unarchiveUser],
  );

  const pageCount = Math.ceil((users?.length ?? 0) / pagination.pageSize);
  const archivedPageCount = Math.ceil((archivedUsers?.length ?? 0) / archivedPagination.pageSize);

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

  const archivedPageData = useMemo(() => {
    if (!archivedUsers) return [];
    const start = archivedPagination.pageIndex * archivedPagination.pageSize;
    return archivedUsers.slice(start, start + archivedPagination.pageSize);
  }, [archivedUsers, archivedPagination]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = createUserSchema.safeParse({ username, name, password, role: role || undefined });
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

    createUser.mutate(result.data, {
      onSuccess: () => {
        setUsername('');
        setName('');
        setPassword('');
        setRole('');
      },
    });
  }

  function handleEditSave() {
    if (!editUser) return;
    if (!editName?.trim()) {
      toast.error('Imie i nazwisko jest wymagane');
      return;
    }
    if (!editRole) {
      toast.error('Rola jest wymagana');
      return;
    }
    updateUser.mutate(
      { id: editUser.id, data: { name: editName, role: editRole } },
      { onSuccess: () => setEditUser(null) },
    );
  }

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Zarzadzanie uzytkownikami</h1>

      {/* Collapsible Create User Form */}
      <Card className="max-w-lg">
        <CardHeader
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          aria-expanded={formOpen}
          onClick={() => setFormOpen(!formOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFormOpen(!formOpen);
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nowy uzytkownik</CardTitle>
              <CardDescription>
                Utworz konto pracownika. Pracownik bedzie mogl od razu zalogowac sie w aplikacji
                mobilnej.
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
                <Label htmlFor="username">Nazwa uzytkownika</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="jkowalski"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
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
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Haslo tymczasowe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 znakow"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
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
                {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
              </div>

              <Button type="submit" disabled={createUser.isPending} className="w-full">
                {createUser.isPending ? 'Tworzenie...' : 'Utworz uzytkownika'}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Users with Tabs */}
      <Tabs defaultValue="aktywni">
        <TabsList>
          <TabsTrigger value="aktywni">Aktywni</TabsTrigger>
          <TabsTrigger value="zarchiwizowani">Zarchiwizowani</TabsTrigger>
        </TabsList>

        <TabsContent value="aktywni">
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
        </TabsContent>

        <TabsContent value="zarchiwizowani">
          {archivedUsers && archivedUsers.length === 0 && !archivedLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium">Brak zarchiwizowanych uzytkownikow</p>
              <p className="text-sm text-muted-foreground">
                Zarchiwizowani uzytkownicy pojawia sie tutaj.
              </p>
            </div>
          ) : (
            <DataTable
              columns={archivedColumns}
              data={archivedPageData}
              pageCount={archivedPageCount}
              pagination={archivedPagination}
              onPaginationChange={setArchivedPagination}
              sorting={archivedSorting}
              onSortingChange={setArchivedSorting}
              isLoading={archivedLoading}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj uzytkownika</DialogTitle>
            <DialogDescription>Zmien dane uzytkownika {editUser?.username ?? editUser?.email ?? editUser?.name}</DialogDescription>
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

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trwale usunac uzytkownika?</DialogTitle>
            <DialogDescription>
              Uzytkownik {deleteTarget?.name} zostanie trwale usuniety. Tej operacji nie mozna cofnac.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? 'Usuwanie...' : 'Usun trwale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
