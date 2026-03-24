import { Suspense } from 'react';
import { VehiclesPage } from './vehicles-page';
import { Skeleton } from '@/components/ui/skeleton';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <VehiclesPage />
    </Suspense>
  );
}
