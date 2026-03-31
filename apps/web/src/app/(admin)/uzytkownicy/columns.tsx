'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { UserDto } from '@/hooks/queries/use-users';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  EMPLOYEE: 'Pracownik',
};

export function getUserColumns({
  onEdit,
  onToggleActive,
  onResetPassword,
  onArchive,
  onDelete,
}: {
  onEdit: (user: UserDto) => void;
  onToggleActive: (user: UserDto) => void;
  onResetPassword: (user: UserDto) => void;
  onArchive?: (user: UserDto) => void;
  onDelete?: (user: UserDto) => void;
}): ColumnDef<UserDto, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Imie i nazwisko" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rola" />,
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return <span>{roleLabels[role] ?? role}</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return isActive ? (
          <Badge variant="success">Aktywny</Badge>
        ) : (
          <Badge variant="secondary">Nieaktywny</Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Utworzono" />,
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt') as string);
        return <span className="font-data text-sm">{date.toLocaleDateString('pl-PL')}</span>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(user)}>Edytuj</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(user)}>
                Resetuj haslo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleActive(user)}>
                {user.isActive ? 'Dezaktywuj' : 'Aktywuj'}
              </DropdownMenuItem>
              {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(user)}>Archiwizuj</DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(user)}>
                  Usun trwale
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}

export function getArchivedUserColumns({
  onUnarchive,
  onHardDelete,
}: {
  onUnarchive: (user: UserDto) => void;
  onHardDelete: (user: UserDto) => void;
}): ColumnDef<UserDto, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Imie i nazwisko" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rola" />,
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return <span>{roleLabels[role] ?? role}</span>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Utworzono" />,
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt') as string);
        return <span className="font-data text-sm">{date.toLocaleDateString('pl-PL')}</span>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUnarchive(user)}>Przywroc</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onHardDelete(user)}>
                Usun trwale
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}
