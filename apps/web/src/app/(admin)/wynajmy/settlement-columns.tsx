'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { type RentalWithRelations, SettlementStatus } from '@rentapp/shared';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/format';

export function getSettlementStatusBadge(status: SettlementStatus) {
  switch (status) {
    case SettlementStatus.NIEROZLICZONY:
      return <Badge variant="destructive">Nierozliczony</Badge>;
    case SettlementStatus.CZESCIOWO_ROZLICZONY:
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
          Czesciowo rozliczony
        </Badge>
      );
    case SettlementStatus.ROZLICZONY:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
          Rozliczony
        </Badge>
      );
    case SettlementStatus.ANULOWANY:
      return <Badge variant="secondary">Anulowany</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function getSettlementColumns(): ColumnDef<RentalWithRelations, unknown>[] {
  return [
    {
      accessorKey: 'customer',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Klient" />,
      cell: ({ row }) => {
        const customer = row.original.customer;
        return (
          <span className="font-body text-sm">
            {customer ? `${customer.firstName} ${customer.lastName}` : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'vehicle',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pojazd" />,
      cell: ({ row }) => {
        const vehicle = row.original.vehicle;
        return (
          <span className="font-data text-sm">
            {vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.registration}` : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Daty" />,
      cell: ({ row }) => (
        <span className="font-data text-sm">
          {formatDate(row.original.startDate)} - {formatDate(row.original.endDate)}
        </span>
      ),
    },
    {
      accessorKey: 'settlementStatus',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status rozliczenia" />,
      cell: ({ row }) => getSettlementStatusBadge(row.original.settlementStatus),
    },
    {
      accessorKey: 'settlementAmount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kwota" />,
      cell: ({ row }) => (
        <span className="font-data text-sm">
          {row.original.settlementAmount != null
            ? formatCurrency(row.original.settlementAmount)
            : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'settledAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data rozliczenia" />,
      cell: ({ row }) => (
        <span className="font-data text-sm">
          {row.original.settledAt ? formatDateTime(row.original.settledAt) : '-'}
        </span>
      ),
    },
  ];
}
