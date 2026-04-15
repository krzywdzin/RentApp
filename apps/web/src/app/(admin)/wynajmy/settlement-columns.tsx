'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { type RentalDto, SettlementStatus } from '@rentapp/shared';
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

export function getSettlementColumns(): ColumnDef<RentalDto, unknown>[] {
  return [
    {
      accessorKey: 'customer',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Klient" />,
      cell: ({ row }) => {
        const customer = (
          row.original as unknown as { customer?: { firstName: string; lastName: string } }
        ).customer;
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
        const vehicle = (
          row.original as unknown as {
            vehicle?: { make: string; model: string; registration: string };
          }
        ).vehicle;
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
      cell: ({ row }) => {
        const status = (row.original as unknown as { settlementStatus?: SettlementStatus })
          .settlementStatus;
        return status ? getSettlementStatusBadge(status) : '-';
      },
    },
    {
      accessorKey: 'settlementAmount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kwota" />,
      cell: ({ row }) => {
        const amount = (row.original as unknown as { settlementAmount?: number | null })
          .settlementAmount;
        return (
          <span className="font-data text-sm">{amount != null ? formatCurrency(amount) : '-'}</span>
        );
      },
    },
    {
      accessorKey: 'settledAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data rozliczenia" />,
      cell: ({ row }) => {
        const settledAt = (row.original as unknown as { settledAt?: string | null }).settledAt;
        return (
          <span className="font-data text-sm">{settledAt ? formatDateTime(settledAt) : '-'}</span>
        );
      },
    },
  ];
}
