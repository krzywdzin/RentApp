'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { type RentalDto, RentalStatus } from '@rentapp/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { formatDate, formatCurrency } from '@/lib/format';
import { Eye } from 'lucide-react';
import Link from 'next/link';

const statusConfig: Record<
  RentalStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  }
> = {
  [RentalStatus.DRAFT]: { label: 'Szkic', variant: 'secondary' },
  [RentalStatus.ACTIVE]: { label: 'Aktywny', variant: 'success' },
  [RentalStatus.EXTENDED]: { label: 'Przedluzony', variant: 'warning' },
  [RentalStatus.RETURNED]: { label: 'Zwrocony', variant: 'secondary' },
};

function isOverdue(rental: RentalDto): boolean {
  if (rental.status !== RentalStatus.ACTIVE && rental.status !== RentalStatus.EXTENDED) {
    return false;
  }
  return new Date(rental.endDate) < new Date();
}

export function getRentalStatusBadge(rental: RentalDto) {
  if (isOverdue(rental)) {
    return <Badge variant="destructive">Przeterminowany</Badge>;
  }
  const config = statusConfig[rental.status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export const rentalColumns: ColumnDef<RentalDto, unknown>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nr" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.id.slice(0, 8)}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'vehicleId',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pojazd" />,
    cell: ({ row }) => {
      const vehicle = (row.original as any).vehicle;
      return (
        <span className="text-sm">
          {vehicle?.registration || row.original.vehicleId.slice(0, 8)}
        </span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'customerId',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Klient" />,
    cell: ({ row }) => {
      const customer = (row.original as any).customer;
      return (
        <span className="text-sm">
          {customer
            ? `${customer.firstName} ${customer.lastName}`
            : row.original.customerId.slice(0, 8)}
        </span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'startDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data od" />,
    cell: ({ row }) => formatDate(row.original.startDate),
  },
  {
    accessorKey: 'endDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data do" />,
    cell: ({ row }) => formatDate(row.original.endDate),
  },
  {
    accessorKey: 'totalPriceGross',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kwota brutto" />,
    cell: ({ row }) => formatCurrency(row.original.totalPriceGross),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => getRentalStatusBadge(row.original),
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Link href={`/wynajmy/${row.original.id}`}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
    ),
  },
];
