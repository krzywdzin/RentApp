'use client';

import { useMemo, Suspense } from 'react';
import { usePortalAuth } from '@/hooks/use-portal-auth';
import { usePortalRentals } from '@/hooks/use-portal-rentals';
import { TokenExchange } from './components/token-exchange';
import { RentalCard } from './components/rental-card';
import { Skeleton } from '@/components/ui/skeleton';

function RentalListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

function PortalContent() {
  const { isAuthenticated, isLoading: authLoading } = usePortalAuth();
  const { data: rentals, isLoading: rentalsLoading } = usePortalRentals();

  const sortedRentals = useMemo(() => {
    if (!rentals) return [];
    return [...rentals].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );
  }, [rentals]);

  if (authLoading) {
    return <RentalListSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Twoje wynajmy</h1>
      {rentalsLoading ? (
        <RentalListSkeleton />
      ) : sortedRentals.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Brak wynajmow.</p>
      ) : (
        <div className="space-y-3">
          {sortedRentals.map((rental) => (
            <RentalCard key={rental.id} rental={rental} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortalPage() {
  return (
    <div className="space-y-6">
      <Suspense>
        <TokenExchange />
      </Suspense>
      <PortalContent />
    </div>
  );
}
