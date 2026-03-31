'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type PaginationState, type SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { type RentalDto, type RentalWithRelations, RentalStatus } from '@rentapp/shared';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/data-table/data-table';
import {
  useRentals,
  useArchivedRentals,
  useArchiveRental,
  useUnarchiveRental,
  useDeleteRental,
} from '@/hooks/queries/use-rentals';
import { getRentalColumns, getArchivedRentalColumns } from './columns';
import { RentalFilterBar } from './filter-bar';
import { CalendarView } from './calendar-view';

export default function RentalsPage() {
  const router = useRouter();
  const { data: rentals, isLoading, isError, refetch } = useRentals();
  const { data: archivedRentals, isLoading: archivedLoading } = useArchivedRentals();
  const archiveRental = useArchiveRental();
  const unarchiveRental = useUnarchiveRental();
  const deleteRental = useDeleteRental();

  const [statusFilter, setStatusFilter] = useState<RentalStatus | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Archived tab state
  const [archivedPagination, setArchivedPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [archivedSorting, setArchivedSorting] = useState<SortingState>([]);

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<RentalWithRelations | null>(null);

  const filtered = useMemo(() => {
    if (!rentals) return [];
    return rentals.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (dateFrom && new Date(r.startDate) < dateFrom) return false;
      if (dateTo && new Date(r.endDate) > dateTo) return false;
      return true;
    });
  }, [rentals, statusFilter, dateFrom, dateTo]);

  const pageData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return filtered.slice(start, start + pagination.pageSize);
  }, [filtered, pagination]);

  const pageCount = Math.ceil(filtered.length / pagination.pageSize);

  const archivedPageCount = Math.ceil((archivedRentals?.length ?? 0) / archivedPagination.pageSize);
  const archivedPageData = useMemo(() => {
    if (!archivedRentals) return [];
    const start = archivedPagination.pageIndex * archivedPagination.pageSize;
    return archivedRentals.slice(start, start + archivedPagination.pageSize);
  }, [archivedRentals, archivedPagination]);

  const columns = useMemo(
    () =>
      getRentalColumns({
        onArchive: (rental) => archiveRental.mutate(rental.id),
        onDelete: (rental) => setDeleteTarget(rental),
      }),
    [archiveRental],
  );

  const archivedColumns = useMemo(
    () =>
      getArchivedRentalColumns({
        onUnarchive: (rental) => unarchiveRental.mutate(rental.id),
        onHardDelete: (rental) => setDeleteTarget(rental),
      }),
    [unarchiveRental],
  );

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteRental.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-2xl text-charcoal">Wynajmy</h1>
        <Button onClick={() => router.push('/wynajmy/nowy')}>
          <Plus className="mr-2 h-4 w-4" />
          Utworz wynajem
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

      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="kalendarz">Kalendarz</TabsTrigger>
          <TabsTrigger value="zarchiwizowane">Zarchiwizowane</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          <RentalFilterBar
            statusFilter={statusFilter}
            onStatusChange={(v) => {
              setStatusFilter(v);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={(v) => {
              setDateFrom(v);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            onDateToChange={(v) => {
              setDateTo(v);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          />

          {!isLoading && filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium">Brak wynajmow</p>
              <p className="text-sm text-muted-foreground">
                Utworz pierwszy wynajem, aby rozpoczac sledzenie floty.
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={pageData}
              pageCount={pageCount}
              pagination={pagination}
              onPaginationChange={setPagination}
              sorting={sorting}
              onSortingChange={setSorting}
              onRowClick={(row: RentalDto) => router.push(`/wynajmy/${row.id}`)}
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="kalendarz">
          <CalendarView />
        </TabsContent>

        <TabsContent value="zarchiwizowane" className="space-y-4">
          {archivedRentals && archivedRentals.length === 0 && !archivedLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium">Brak zarchiwizowanych wynajmow</p>
              <p className="text-sm text-muted-foreground">
                Zarchiwizowane wynajmy pojawia sie tutaj.
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

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trwale usunac wynajem?</DialogTitle>
            <DialogDescription>
              Wynajem #{deleteTarget?.id.slice(0, 8)} zostanie trwale usuniety. Tej operacji nie mozna
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
              disabled={deleteRental.isPending}
            >
              {deleteRental.isPending ? 'Usuwanie...' : 'Usun trwale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
