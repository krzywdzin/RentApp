'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  type PaginationState,
  type SortingState,
  type RowSelectionState,
  getPaginationRowModel,
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table';
import { Plus, Download } from 'lucide-react';
import type { VehicleDto, VehicleStatus } from '@rentapp/shared';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import {
  useVehicles,
  useArchiveVehicle,
  useBulkUpdateVehicles,
} from '@/hooks/queries/use-vehicles';
import { getVehicleColumns } from './columns';
import { VehicleFilterBar } from './filter-bar';
import { exportToCsv } from '@/lib/csv-export';

export function VehiclesPage() {
  const router = useRouter();
  const { data: vehicles, isLoading } = useVehicles();
  const archiveVehicle = useArchiveVehicle();
  const bulkUpdate = useBulkUpdateVehicles();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [deleteTarget, setDeleteTarget] = useState<VehicleDto | null>(null);
  const [bulkStatusDialog, setBulkStatusDialog] = useState<{
    open: boolean;
    status: VehicleStatus | null;
  }>({ open: false, status: null });

  const filteredData = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter((v) => {
      const matchesSearch =
        !search ||
        v.registration.toLowerCase().includes(search.toLowerCase()) ||
        v.vin.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  const columns = useMemo(
    () =>
      getVehicleColumns({
        onDetail: (id) => router.push(`/pojazdy/${id}`),
        onEdit: (id) => router.push(`/pojazdy/${id}/edytuj`),
        onDelete: (vehicle) => setDeleteTarget(vehicle),
      }),
    [router],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedVehicles = selectedRows.map((r) => r.original);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    archiveVehicle.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }, [deleteTarget, archiveVehicle]);

  const handleBulkStatusChange = useCallback((status: VehicleStatus) => {
    setBulkStatusDialog({ open: true, status });
  }, []);

  const confirmBulkStatusChange = useCallback(() => {
    if (!bulkStatusDialog.status) return;
    bulkUpdate.mutate(
      { ids: selectedVehicles.map((v) => v.id), status: bulkStatusDialog.status },
      {
        onSuccess: () => {
          setBulkStatusDialog({ open: false, status: null });
          setRowSelection({});
        },
      },
    );
  }, [bulkStatusDialog.status, selectedVehicles, bulkUpdate]);

  const handleExportCsv = useCallback(() => {
    const dataToExport = selectedVehicles.length > 0 ? selectedVehicles : filteredData;
    exportToCsv(
      dataToExport,
      [
        { key: 'registration', label: 'Rejestracja' },
        { key: 'vin', label: 'VIN' },
        { key: 'make', label: 'Marka' },
        { key: 'model', label: 'Model' },
        { key: 'year', label: 'Rok' },
        { key: 'mileage', label: 'Przebieg' },
        { key: 'status', label: 'Status' },
        { key: 'fuelType', label: 'Paliwo' },
        { key: 'transmission', label: 'Skrzynia' },
      ],
      'pojazdy',
    );
  }, [selectedVehicles, filteredData]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pojazdy</h1>
        <Button asChild>
          <Link href="/pojazdy/nowy">
            <Plus className="h-4 w-4" />
            Dodaj pojazd
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <VehicleFilterBar onSearchChange={handleSearchChange} onStatusChange={handleStatusChange} />

      {/* Bulk operations bar */}
      {selectedVehicles.length > 0 && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            Zaznaczono {selectedVehicles.length}{' '}
            {selectedVehicles.length === 1 ? 'pojazd' : 'pojazdow'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Zmien status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => handleBulkStatusChange('AVAILABLE' as VehicleStatus)}
              >
                Dostepny
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatusChange('SERVICE' as VehicleStatus)}>
                Serwis
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatusChange('RETIRED' as VehicleStatus)}>
                Wycofany
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="h-4 w-4" />
            Eksportuj CSV
          </Button>
        </div>
      )}

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
                    data-state={row.getIsSelected() && 'selected'}
                    className="cursor-pointer"
                    onClick={() => router.push(`/pojazdy/${row.original.id}`)}
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
                    Brak pojazdow
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
            <DialogTitle>Usunac pojazd?</DialogTitle>
            <DialogDescription>
              Pojazd {deleteTarget?.registration} zostanie trwale usuniety. Tej operacji nie mozna
              cofnac.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={archiveVehicle.isPending}
            >
              {archiveVehicle.isPending ? 'Usuwanie...' : 'Usun pojazd'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk status change confirmation */}
      <Dialog
        open={bulkStatusDialog.open}
        onOpenChange={(open) => !open && setBulkStatusDialog({ open: false, status: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmienic status {selectedVehicles.length} pojazdow?</DialogTitle>
            <DialogDescription>
              Status wybranych pojazdow zostanie zmieniony na{' '}
              {bulkStatusDialog.status === 'AVAILABLE'
                ? 'Dostepny'
                : bulkStatusDialog.status === 'SERVICE'
                  ? 'Serwis'
                  : 'Wycofany'}
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkStatusDialog({ open: false, status: null })}
            >
              Anuluj
            </Button>
            <Button onClick={confirmBulkStatusChange} disabled={bulkUpdate.isPending}>
              {bulkUpdate.isPending ? 'Zmieniam...' : 'Zmien status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
