'use client';

import { useMemo } from 'react';
import { CalendarClock, Car, Clock, AlertTriangle } from 'lucide-react';
import { useVehicles } from '@/hooks/queries/use-vehicles';
import { useRentals } from '@/hooks/queries/use-rentals';
import { StatCard } from '@/components/dashboard/stat-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Skeleton } from '@/components/ui/skeleton';

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isPast(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export default function DashboardPage() {
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: rentals, isLoading: rentalsLoading } = useRentals();

  const stats = useMemo(() => {
    if (!vehicles || !rentals) return null;

    const activeRentals = rentals.filter((r) => r.status === 'ACTIVE' || r.status === 'EXTENDED');
    const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE');
    const todayReturns = activeRentals.filter((r) => isToday(r.endDate));
    const overdue = activeRentals.filter((r) => isPast(r.endDate));

    return {
      activeCount: activeRentals.length,
      availableCount: availableVehicles.length,
      totalVehicles: vehicles.length,
      todayReturnsCount: todayReturns.length,
      overdueCount: overdue.length,
    };
  }, [vehicles, rentals]);

  const isLoading = vehiclesLoading || rentalsLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-[28px] font-semibold">Pulpit</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Aktywne wynajmy"
            value={stats.activeCount}
            subtitle={`${stats.activeCount} pojazdow w uzyciu`}
            icon={CalendarClock}
          />
          <StatCard
            title="Dostepne pojazdy"
            value={stats.availableCount}
            subtitle={`${stats.availableCount} z ${stats.totalVehicles} w flocie`}
            icon={Car}
          />
          <StatCard
            title="Dzisiejsze zwroty"
            value={stats.todayReturnsCount}
            subtitle={`${stats.todayReturnsCount} zaplanowanych`}
            icon={Clock}
          />
          <StatCard
            title="Przeterminowane"
            value={stats.overdueCount}
            subtitle={`${stats.overdueCount} wymaga uwagi`}
            icon={AlertTriangle}
            variant={stats.overdueCount > 0 ? 'destructive' : 'default'}
          />
        </div>
      ) : null}

      <ActivityFeed />
    </div>
  );
}
