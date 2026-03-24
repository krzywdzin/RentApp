'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortalRental } from '@/hooks/use-portal-rentals';
import { RentalDetailView } from '../components/rental-detail-view';

interface PortalRentalDetailPageProps {
  params: Promise<{ rentalId: string }>;
}

export default function PortalRentalDetailPage({ params }: PortalRentalDetailPageProps) {
  const { rentalId } = use(params);
  const { data: rental, isLoading, error } = usePortalRental(rentalId);

  return (
    <div className="space-y-4">
      <Link href="/portal">
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Powrot do listy
        </Button>
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700">
          Nie udalo sie zaladowac danych wynajmu.
        </div>
      ) : rental ? (
        <RentalDetailView rental={rental} />
      ) : null}
    </div>
  );
}
