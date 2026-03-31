'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type PaginationState, type SortingState } from '@tanstack/react-table';
import { type ContractDto, ContractStatus } from '@rentapp/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/data-table/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { useContracts } from '@/hooks/queries/use-contracts';
import { contractColumns } from './columns';

const statusOptions = [
  { value: 'ALL', label: 'Wszystkie' },
  { value: ContractStatus.DRAFT, label: 'Wersja robocza' },
  { value: ContractStatus.PARTIALLY_SIGNED, label: 'Czesciowo podpisana' },
  { value: ContractStatus.SIGNED, label: 'Podpisana' },
  { value: ContractStatus.VOIDED, label: 'Uniewazniona' },
] as const;

export default function ContractsPage() {
  const router = useRouter();
  const { data: contracts, isLoading, isError } = useContracts();

  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'ALL'>('ALL');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const filtered = useMemo(() => {
    if (!contracts) return [];
    return contracts.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      return true;
    });
  }, [contracts, statusFilter]);

  const pageData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return filtered.slice(start, start + pagination.pageSize);
  }, [filtered, pagination]);

  const pageCount = Math.ceil(filtered.length / pagination.pageSize);

  return (
    <div className="space-y-6">
      <h1 className="font-display font-semibold text-2xl text-charcoal">Umowy</h1>

      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as ContractStatus | 'ALL');
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-lg font-medium text-destructive">Nie udalo sie zaladowac umow</p>
            <p className="text-sm text-muted-foreground mt-1">
              Sprawdz polaczenie i odswiez strone.
            </p>
          </CardContent>
        </Card>
      )}

      {!isError && !isLoading && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Brak umow</p>
          <p className="text-sm text-muted-foreground">
            Umowy sa tworzone automatycznie przy wynajmach.
          </p>
        </div>
      ) : (
        <DataTable
          columns={contractColumns}
          data={pageData}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          onRowClick={(row: ContractDto) => router.push(`/umowy/${row.id}`)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
