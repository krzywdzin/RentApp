'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { type RentalDto, type RentalWithRelations, RentalStatus } from '@rentapp/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatCurrency } from '@/lib/format';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

const statusConfig: Record<
  RentalStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  }
> = {
  [RentalStatus.DRAFT]: { label: 'Wersja robocza', variant: 'secondary' },
  [RentalStatus.ACTIVE]: { label: 'Aktywny', variant: 'success' },
  [RentalStatus.EXTENDED]: { label: 'Przedluzony', variant: 'warning' },
  [RentalStatus.RETURNED]: { label: 'Zwrócony', variant: 'secondary' },
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

export function getRentalColumns({
  onArchive,
  onDelete,
}: {
  onArchive: (rental: RentalWithRelations) => void;
  onDelete: (rental: RentalWithRelations) => void;
}): ColumnDef<RentalWithRelations, unknown>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nr" />,
      cell: ({ row }) => (
        <span className="font-data text-xs text-warm-gray">{row.original.id.slice(0, 8)}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'vehicleId',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pojazd" />,
      cell: ({ row }) => {
        const vehicle = row.original.vehicle;
        return (
          <span className="font-data text-sm uppercase">
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
        const customer = row.original.customer;
        return (
          <span className="font-body text-sm">
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
      cell: ({ row }) => (
        <span className="font-data text-sm">{formatDate(row.original.startDate)}</span>
      ),
    },
    {
      accessorKey: 'endDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data do" />,
      cell: ({ row }) => (
        <span className="font-data text-sm">{formatDate(row.original.endDate)}</span>
      ),
    },
    {
      accessorKey: 'totalPriceGross',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kwota brutto" />,
      cell: ({ row }) => (
        <span className="font-data text-sm text-right">
          {formatCurrency(row.original.totalPriceGross)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => getRentalStatusBadge(row.original),
      enableSorting: false,
    },
    {
      id: 'insurance',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ubezp." />,
      cell: ({ row }) => {
        const caseNumber = (row.original as unknown as { insuranceCaseNumber?: string })
          .insuranceCaseNumber;
        return caseNumber ? (
          <Badge variant="outline" className="text-xs">
            {caseNumber}
          </Badge>
        ) : null;
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const rental = row.original;
        const isReturned = rental.status === RentalStatus.RETURNED;
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
              <DropdownMenuItem asChild>
                <Link href={`/wynajmy/${rental.id}`}>Szczegoly</Link>
              </DropdownMenuItem>
              {isReturned && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onArchive(rental)}>Archiwizuj</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(rental)}>
                    Usun trwale
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

export function getArchivedRentalColumns({
  onUnarchive,
  onHardDelete,
}: {
  onUnarchive: (rental: RentalWithRelations) => void;
  onHardDelete: (rental: RentalWithRelations) => void;
}): ColumnDef<RentalWithRelations, unknown>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nr" />,
      cell: ({ row }) => (
        <span className="font-data text-xs text-warm-gray">{row.original.id.slice(0, 8)}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'vehicleId',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pojazd" />,
      cell: ({ row }) => {
        const vehicle = row.original.vehicle;
        return (
          <span className="font-data text-sm uppercase">
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
        const customer = row.original.customer;
        return (
          <span className="font-body text-sm">
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
      cell: ({ row }) => (
        <span className="font-data text-sm">{formatDate(row.original.startDate)}</span>
      ),
    },
    {
      accessorKey: 'endDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data do" />,
      cell: ({ row }) => (
        <span className="font-data text-sm">{formatDate(row.original.endDate)}</span>
      ),
    },
    {
      accessorKey: 'totalPriceGross',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kwota brutto" />,
      cell: ({ row }) => (
        <span className="font-data text-sm text-right">
          {formatCurrency(row.original.totalPriceGross)}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const rental = row.original;
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
              <DropdownMenuItem onClick={() => onUnarchive(rental)}>Przywroc</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onHardDelete(rental)}>
                Usun trwale
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

// Keep backward-compatible export for any other imports
export const rentalColumns = getRentalColumns({
  onArchive: () => {},
  onDelete: () => {},
});
