'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type PaginationState, type SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { type RentalDto, RentalStatus } from '@rentapp/shared';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table/data-table';
import { useRentals } from '@/hooks/queries/use-rentals';
import { rentalColumns } from './columns';
import { RentalFilterBar } from './filter-bar';
import { CalendarView } from './calendar-view';

export default function RentalsPage() {
  const router = useRouter();
  const { data: rentals, isLoading, isError, refetch } = useRentals();

  const [statusFilter, setStatusFilter] = useState<RentalStatus | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Wynajmy</h1>
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
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          <RentalFilterBar
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
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
              columns={rentalColumns}
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
      </Tabs>
    </div>
  );
}
