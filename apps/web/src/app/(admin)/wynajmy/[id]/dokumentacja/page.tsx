'use client';

import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PhotoComparison } from '@/components/photos/photo-comparison';
import { DamageComparison } from '@/components/photos/damage-comparison';
import { usePhotoComparison, useDamageComparison } from '@/hooks/queries/use-photos';

export default function DokumentacjaPage() {
  const params = useParams();
  const rentalId = params.id as string;
  const photoQuery = usePhotoComparison(rentalId);
  const damageQuery = useDamageComparison(rentalId);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Wynajmy', href: '/wynajmy' },
          { label: `#${rentalId.slice(0, 8)}`, href: `/wynajmy/${rentalId}` },
          { label: 'Dokumentacja' },
        ]}
      />

      <h1 className="text-2xl font-semibold">Dokumentacja fotograficzna</h1>

      <Tabs defaultValue="photos">
        <TabsList>
          <TabsTrigger value="photos">Zdjecia</TabsTrigger>
          <TabsTrigger value="damage">Uszkodzenia</TabsTrigger>
        </TabsList>

        <TabsContent value="photos">
          {photoQuery.isLoading ? (
            <PhotoSkeleton />
          ) : photoQuery.data && photoQuery.data.length > 0 ? (
            <PhotoComparison data={photoQuery.data} />
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        <TabsContent value="damage">
          {damageQuery.isLoading ? (
            <DamageSkeleton />
          ) : (
            <DamageComparison data={damageQuery.data} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brak dokumentacji</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Obchod fotograficzny nie zostal jeszcze wykonany dla tego wynajmu.
        </p>
      </CardContent>
    </Card>
  );
}

function PhotoSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <Skeleton className="aspect-square rounded-md" />
          <Skeleton className="aspect-square rounded-md" />
        </div>
      ))}
    </div>
  );
}

function DamageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-80" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-64 rounded-md" />
        <Skeleton className="h-64 rounded-md" />
      </div>
    </div>
  );
}
