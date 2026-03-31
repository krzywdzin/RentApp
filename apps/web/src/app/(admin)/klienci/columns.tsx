'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { CustomerDto } from '@rentapp/shared';
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
import { formatDate } from '@/lib/format';

export function getCustomerColumns({
  onDetail,
  onEdit,
  onDelete,
}: {
  onDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (customer: CustomerDto) => void;
}): ColumnDef<CustomerDto, unknown>[] {
  return [
    {
      accessorKey: 'lastName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nazwisko" />,
      cell: ({ row }) => (
        <span className="font-body text-sm font-medium">{row.getValue('lastName')}</span>
      ),
    },
    {
      accessorKey: 'firstName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Imie" />,
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Telefon" />,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => {
        const email = row.getValue('email') as string | null;
        return <span>{email ?? '-'}</span>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data dodania" />,
      cell: ({ row }) => (
        <span className="font-data text-sm">{formatDate(row.getValue('createdAt'))}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const customer = row.original;
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
              <DropdownMenuItem onClick={() => onDetail(customer.id)}>Szczegoly</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(customer.id)}>Edytuj</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(customer)}>
                Usun
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}
