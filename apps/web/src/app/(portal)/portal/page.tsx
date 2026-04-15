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
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="text-5xl">🔐</div>
        <h2 className="text-xl font-semibold">Witaj w Portalu Klienta</h2>
        <p className="text-muted-foreground max-w-sm">
          Aby zobaczyć swoje wynajmy, skorzystaj z linku który otrzymałeś w wiadomości email lub SMS
          od wypożyczalni.
        </p>
        <p className="text-sm text-muted-foreground">
          Link wygasa po 24 godzinach. W razie problemów — skontaktuj się z wypożyczalnią.
        </p>
      </div>
    );
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
