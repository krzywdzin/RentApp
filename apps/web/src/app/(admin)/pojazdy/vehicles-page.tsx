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
import { Plus, Download, Upload } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { DataTable } from '@/components/data-table/data-table';
import {
  useVehicles,
  useArchiveVehicle,
  useDeleteVehicle,
  useUnarchiveVehicle,
  useArchivedVehicles,
  useBulkUpdateVehicles,
} from '@/hooks/queries/use-vehicles';
import { getVehicleColumns, getArchivedVehicleColumns } from './columns';
import { VehicleFilterBar } from './filter-bar';
import { ImportDialog } from './import-dialog';
import { exportToCsv } from '@/lib/csv-export';

export function VehiclesPage() {
  const router = useRouter();
  const { data: vehicles, isLoading, isError, refetch } = useVehicles();
  const { data: archivedVehicles, isLoading: archivedLoading } = useArchivedVehicles();
  const archiveVehicle = useArchiveVehicle();
  const deleteVehicle = useDeleteVehicle();
  const unarchiveVehicle = useUnarchiveVehicle();
  const bulkUpdate = useBulkUpdateVehicles();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Archived tab pagination
  const [archivedPagination, setArchivedPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [archivedSorting, setArchivedSorting] = useState<SortingState>([]);

  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VehicleDto | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<VehicleDto | null>(null);
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
        onDelete: (vehicle) => setHardDeleteTarget(vehicle),
        onArchive: (vehicle) => archiveVehicle.mutate(vehicle.id),
      }),
    [router, archiveVehicle],
  );

  const archivedColumns = useMemo(
    () =>
      getArchivedVehicleColumns({
        onUnarchive: (vehicle) => unarchiveVehicle.mutate(vehicle.id),
        onHardDelete: (vehicle) => setHardDeleteTarget(vehicle),
      }),
    [unarchiveVehicle],
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

  const archivedPageCount = Math.ceil((archivedVehicles?.length ?? 0) / archivedPagination.pageSize);
  const archivedPageData = useMemo(() => {
    if (!archivedVehicles) return [];
    const start = archivedPagination.pageIndex * archivedPagination.pageSize;
    return archivedVehicles.slice(start, start + archivedPagination.pageSize);
  }, [archivedVehicles, archivedPagination]);

  const handleHardDelete = useCallback(() => {
    if (!hardDeleteTarget) return;
    deleteVehicle.mutate(hardDeleteTarget.id, {
      onSuccess: () => setHardDeleteTarget(null),
    });
  }, [hardDeleteTarget, deleteVehicle]);

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
        <h1 className="font-display font-semibold text-2xl text-charcoal">Pojazdy</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Importuj
          </Button>
          <Button asChild>
            <Link href="/pojazdy/nowy">
              <Plus className="h-4 w-4" />
              Dodaj pojazd
            </Link>
          </Button>
        </div>
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

      <Tabs defaultValue="aktywne">
        <TabsList>
          <TabsTrigger value="aktywne">Aktywne</TabsTrigger>
          <TabsTrigger value="zarchiwizowane">Zarchiwizowane</TabsTrigger>
        </TabsList>

        <TabsContent value="aktywne" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="zarchiwizowane" className="space-y-4">
          {archivedVehicles && archivedVehicles.length === 0 && !archivedLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium">Brak zarchiwizowanych pojazdow</p>
              <p className="text-sm text-muted-foreground">
                Zarchiwizowane pojazdy pojawia sie tutaj.
              </p>
            </div>
          ) : (
            <DataTable
              columns={archivedColumns}
              data={archivedPageData}
              pageCount={archivedPageCount}
              pagination={archivedPagination}
              onPaginationChange={setArchivedPagination}
              sorting={archivedSorting}
              onSortingChange={setArchivedSorting}
              isLoading={archivedLoading}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Hard delete confirmation */}
      <Dialog open={!!hardDeleteTarget} onOpenChange={(open) => !open && setHardDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trwale usunac pojazd?</DialogTitle>
            <DialogDescription>
              Pojazd {hardDeleteTarget?.registration} zostanie trwale usuniety. Tej operacji nie mozna
              cofnac.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHardDeleteTarget(null)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleHardDelete}
              disabled={deleteVehicle.isPending}
            >
              {deleteVehicle.isPending ? 'Usuwanie...' : 'Usun trwale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />

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
