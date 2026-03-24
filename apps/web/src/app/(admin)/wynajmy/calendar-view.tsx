'use client';

import { useMemo, useState } from 'react';
import { addDays, subDays, startOfDay, differenceInDays, format, isToday } from 'date-fns';
import { pl } from 'date-fns/locale/pl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRentalCalendar } from '@/hooks/queries/use-rentals';
import type { CalendarVehicleEntry } from '@rentapp/shared';
import { cn } from '@/lib/utils';

type ZoomLevel = 'day' | 'week';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-zinc-600',
  ACTIVE: 'bg-green-600',
  EXTENDED: 'bg-amber-500',
  RETURNED: 'bg-zinc-500/50',
};

const VEHICLE_COL_WIDTH = 200;

export function CalendarView() {
  const router = useRouter();
  const [zoom, setZoom] = useState<ZoomLevel>('day');
  const [baseDate, setBaseDate] = useState(() => startOfDay(new Date()));

  const dayWidth = zoom === 'day' ? 80 : 40;
  const daysVisible = zoom === 'day' ? 14 : 28;

  const from = subDays(baseDate, 1).toISOString();
  const to = addDays(baseDate, daysVisible + 1).toISOString();

  const { data, isLoading } = useRentalCalendar(from, to);

  const days = useMemo(() => {
    return Array.from({ length: daysVisible }, (_, i) => addDays(baseDate, i));
  }, [baseDate, daysVisible]);

  const timelineWidth = daysVisible * dayWidth;

  function handlePrev() {
    setBaseDate((d) => subDays(d, zoom === 'day' ? 7 : 14));
  }
  function handleNext() {
    setBaseDate((d) => addDays(d, zoom === 'day' ? 7 : 14));
  }
  function handleToday() {
    setBaseDate(startOfDay(new Date()));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Dzisiaj
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-2 text-sm text-muted-foreground">
            {format(days[0], 'd MMM', { locale: pl })} -{' '}
            {format(days[days.length - 1], 'd MMM yyyy', { locale: pl })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={zoom === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setZoom('day')}
          >
            Dzien
          </Button>
          <Button
            variant={zoom === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setZoom('week')}
          >
            Tydzien
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Brak wynajmow w wybranym okresie</p>
          <p className="text-sm text-muted-foreground">
            Wybierz inny zakres dat lub utworz nowy wynajem.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <div className="flex">
            {/* Fixed vehicle names column */}
            <div className="shrink-0 border-r bg-card" style={{ width: VEHICLE_COL_WIDTH }}>
              {/* Header */}
              <div className="flex h-10 items-center border-b px-3 text-xs font-medium text-muted-foreground">
                Pojazd
              </div>
              {/* Vehicle rows */}
              {data.vehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex h-12 items-center border-b px-3">
                  <div className="truncate">
                    <p className="text-sm font-medium">{vehicle.registration}</p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.make} {vehicle.model}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Scrollable timeline */}
            <div className="flex-1 overflow-x-auto">
              <div style={{ width: timelineWidth, minWidth: '100%' }}>
                {/* Day headers */}
                <div className="flex h-10 border-b">
                  {days.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'flex shrink-0 items-center justify-center border-r text-xs',
                        isToday(day) && 'bg-primary/10 font-semibold',
                      )}
                      style={{ width: dayWidth }}
                    >
                      <span>
                        {format(day, zoom === 'day' ? 'EEE d' : 'd', {
                          locale: pl,
                        })}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Vehicle rows with rental blocks */}
                {data.vehicles.map((vehicle) => (
                  <VehicleRow
                    key={vehicle.id}
                    vehicle={vehicle}
                    baseDate={baseDate}
                    dayWidth={dayWidth}
                    daysVisible={daysVisible}
                    onRentalClick={(rentalId) => router.push(`/wynajmy/${rentalId}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-zinc-600" />
          <span>Szkic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-green-600" />
          <span>Aktywny</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-amber-500" />
          <span>Przedluzony</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-zinc-500/50" />
          <span>Zwrocony</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border-2 border-red-500" />
          <span>Konflikt</span>
        </div>
      </div>
    </div>
  );
}

function VehicleRow({
  vehicle,
  baseDate,
  dayWidth,
  daysVisible,
  onRentalClick,
}: {
  vehicle: CalendarVehicleEntry;
  baseDate: Date;
  dayWidth: number;
  daysVisible: number;
  onRentalClick: (id: string) => void;
}) {
  return (
    <div className="relative h-12 border-b">
      {/* Grid lines */}
      <div className="flex h-full">
        {Array.from({ length: daysVisible }).map((_, i) => (
          <div
            key={i}
            className={cn('shrink-0 border-r', isToday(addDays(baseDate, i)) && 'bg-primary/5')}
            style={{ width: dayWidth }}
          />
        ))}
      </div>

      {/* Rental blocks */}
      {vehicle.rentals.map((rental) => {
        const rentalStart = startOfDay(new Date(rental.startDate));
        const rentalEnd = startOfDay(new Date(rental.endDate));
        const offsetDays = differenceInDays(rentalStart, baseDate);
        const durationDays = Math.max(1, differenceInDays(rentalEnd, rentalStart));

        // Skip if fully outside visible range
        if (offsetDays + durationDays < 0 || offsetDays > daysVisible) {
          return null;
        }

        const left = Math.max(0, offsetDays * dayWidth);
        const right = Math.min(daysVisible * dayWidth, (offsetDays + durationDays) * dayWidth);
        const width = right - left;

        if (width <= 0) return null;

        return (
          <div
            key={rental.id}
            className={cn(
              'absolute top-1.5 h-9 cursor-pointer rounded-md px-2 text-xs leading-9 text-white truncate transition-opacity hover:opacity-90',
              STATUS_COLORS[rental.status] || 'bg-zinc-600',
              rental.hasConflict && 'ring-2 ring-red-500',
            )}
            style={{ left, width: Math.max(width, 24) }}
            title={`${rental.customerName} (${rental.status})`}
            onClick={() => onRentalClick(rental.id)}
          >
            {width > 60 ? rental.customerName : ''}
          </div>
        );
      })}
    </div>
  );
}
