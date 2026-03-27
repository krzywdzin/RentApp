'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  type PaginationState,
  type SortingState,
  getPaginationRowModel,
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import type { CustomerDto } from '@rentapp/shared';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { useCustomers, useArchiveCustomer } from '@/hooks/queries/use-customers';
import { getCustomerColumns } from './columns';
import { CustomerFilterBar } from './filter-bar';

export function CustomersPage() {
  const router = useRouter();
  const { data: customers, isLoading, isError, refetch } = useCustomers();
  const archiveCustomer = useArchiveCustomer();

  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const [deleteTarget, setDeleteTarget] = useState<CustomerDto | null>(null);

  const filteredData = useMemo(() => {
    if (!customers) return [];
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.lastName.toLowerCase().includes(q) ||
        c.firstName.toLowerCase().includes(q) ||
        c.phone.includes(q),
    );
  }, [customers, search]);

  const columns = useMemo(
    () =>
      getCustomerColumns({
        onDetail: (id) => router.push(`/klienci/${id}`),
        onEdit: (id) => router.push(`/klienci/${id}/edytuj`),
        onDelete: (customer) => setDeleteTarget(customer),
      }),
    [router],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    archiveCustomer.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }, [deleteTarget, archiveCustomer]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Klienci</h1>
        <Button asChild>
          <Link href="/klienci/nowy">
            <Plus className="h-4 w-4" />
            Dodaj klienta
          </Link>
        </Button>
      </div>

      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-md border border-destructive p-8 gap-4">
          <p className="text-sm text-destructive">
            Nie udalo sie zaladowac danych. Sprawdz polaczenie i sprobuj ponownie.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Ponow probe
          </Button>
        </div>
      )}

      {/* Filters */}
      <CustomerFilterBar onSearchChange={handleSearchChange} />

      {/* Table */}
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((_, j) => (
                      <TableCell key={`skeleton-${i}-${j}`}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/klienci/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-1 py-4">
                      <p className="font-medium">Brak klientow</p>
                      <p className="text-sm">
                        Klienci pojawia sie tutaj po dodaniu pierwszego rekordu.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usunac klienta?</DialogTitle>
            <DialogDescription>
              Dane klienta {deleteTarget?.firstName} {deleteTarget?.lastName} zostana trwale
              usuniete. Tej operacji nie mozna cofnac.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={archiveCustomer.isPending}
            >
              {archiveCustomer.isPending ? 'Usuwanie...' : 'Usun klienta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
