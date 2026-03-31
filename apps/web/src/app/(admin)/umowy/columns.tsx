'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { type ContractDto, ContractStatus } from '@rentapp/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { formatDate } from '@/lib/format';
import { Eye, Download } from 'lucide-react';
import Link from 'next/link';
import { getContractPdfUrl } from '@/hooks/queries/use-contracts';

const statusConfig: Record<
  ContractStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  }
> = {
  [ContractStatus.DRAFT]: { label: 'Wersja robocza', variant: 'secondary' },
  [ContractStatus.PARTIALLY_SIGNED]: { label: 'Czesciowo podpisana', variant: 'warning' },
  [ContractStatus.SIGNED]: { label: 'Podpisana', variant: 'success' },
  [ContractStatus.VOIDED]: { label: 'Uniewazniona', variant: 'secondary' },
};

export function getContractStatusBadge(status: ContractStatus) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export const contractColumns: ColumnDef<ContractDto, unknown>[] = [
  {
    accessorKey: 'contractNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nr umowy" />,
    cell: ({ row }) => (
      <span className="font-data text-sm font-medium">{row.original.contractNumber}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => getContractStatusBadge(row.original.status),
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data utworzenia" />,
    cell: ({ row }) => (
      <span className="font-data text-sm">{formatDate(row.original.createdAt)}</span>
    ),
  },
  {
    id: 'pdf',
    header: 'PDF',
    cell: ({ row }) =>
      row.original.pdfKey ? (
        <a
          href={getContractPdfUrl(row.original.id)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Link href={`/umowy/${row.original.id}`}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
    ),
  },
];
