'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, FileText, Image } from 'lucide-react';
import { AuditTrail } from '@/components/audit/audit-trail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { InfoRow } from '@/components/ui/info-row';
import { vehicleStatusConfig, fuelTypeLabels, transmissionLabels } from '@/lib/constants';
import { ErrorState } from '@/components/ui/error-state';
import { useVehicle, useArchiveVehicle } from '@/hooks/queries/use-vehicles';
import { useRentals } from '@/hooks/queries/use-rentals';
import { getRentalStatusBadge } from '../../wynajmy/columns';
import { formatDate } from '@/lib/format';

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: vehicle, isLoading, isError, refetch } = useVehicle(params.id);
  const { data: rentals, isLoading: rentalsLoading } = useRentals({ vehicleId: params.id });
  const archiveVehicle = useArchiveVehicle();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const vehicleRentals = rentals ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (!vehicle) {
    return <div className="text-center py-12 text-muted-foreground">Nie znaleziono pojazdu.</div>;
  }

  const statusInfo = vehicleStatusConfig[vehicle.status] ?? {
    label: vehicle.status,
    variant: 'secondary' as const,
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: 'Pojazdy', href: '/pojazdy' }, { label: vehicle.registration }]}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h1 className="font-display font-semibold text-2xl text-charcoal">
            {vehicle.registration}
          </h1>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/pojazdy/${params.id}/edytuj`}>
              <Pencil className="h-4 w-4" />
              Edytuj
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            Usun
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dane">
        <TabsList>
          <TabsTrigger value="dane">Dane</TabsTrigger>
          <TabsTrigger value="wynajmy">Wynajmy</TabsTrigger>
          <TabsTrigger value="dokumenty">Dokumenty</TabsTrigger>
          <TabsTrigger value="audyt">Audyt</TabsTrigger>
        </TabsList>

        <TabsContent value="dane">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h3 className="font-display font-medium text-base text-charcoal">
                    Informacje podstawowe
                  </h3>
                  <div className="w-10 h-px bg-sand mt-1 mb-4" />
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <InfoRow label="Marka" value={vehicle.make} />
                <InfoRow label="Model" value={vehicle.model} />
                <InfoRow label="Rok produkcji" value={String(vehicle.year)} />
                <InfoRow label="Numer VIN" value={vehicle.vin} />
                <InfoRow
                  label="Rodzaj paliwa"
                  value={fuelTypeLabels[vehicle.fuelType] ?? vehicle.fuelType}
                />
                <InfoRow
                  label="Skrzynia biegow"
                  value={transmissionLabels[vehicle.transmission] ?? vehicle.transmission}
                />
                <InfoRow label="Liczba miejsc" value={String(vehicle.seatCount)} />
                <InfoRow label="Przebieg" value={`${vehicle.mileage.toLocaleString('pl-PL')} km`} />
                <InfoRow label="Kolor" value={vehicle.color} />
              </CardContent>
            </Card>

            <div className="space-y-6">
              {vehicle.insurance && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ubezpieczenie</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <InfoRow label="Ubezpieczyciel" value={vehicle.insurance.companyName} />
                    <InfoRow label="Numer polisy" value={vehicle.insurance.policyNumber} />
                    <InfoRow label="Typ" value={vehicle.insurance.coverageType} />
                    <InfoRow label="Wazne do" value={formatDate(vehicle.insurance.expiryDate)} />
                  </CardContent>
                </Card>
              )}

              {vehicle.inspection && (
                <Card>
                  <CardHeader>
                    <CardTitle>Przeglad techniczny</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InfoRow label="Wazny do" value={formatDate(vehicle.inspection.expiryDate)} />
                  </CardContent>
                </Card>
              )}

              {vehicle.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notatki</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{vehicle.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wynajmy">
          <Card>
            <CardHeader>
              <CardTitle>Historia wynajmow</CardTitle>
            </CardHeader>
            <CardContent>
              {rentalsLoading ? (
                <div className="space-y-3 py-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : vehicleRentals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Brak wynajmow dla tego pojazdu.
                </p>
              ) : (
                <div className="space-y-2">
                  {vehicleRentals.map((rental) => (
                    <div
                      key={rental.id}
                      className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/wynajmy/${rental.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/wynajmy/${rental.id}`);
                        }
                      }}
                    >
                      <div className="text-sm">
                        <span className="font-medium">
                          {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                        </span>
                      </div>
                      {getRentalStatusBadge(rental)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dokumenty">
          <Card>
            <CardHeader>
              <CardTitle>Dokumenty i zdjecia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicle.photoUrl ? (
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <Image className="h-5 w-5 text-muted-foreground" />
                    <a
                      href={vehicle.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                    >
                      Zdjecie pojazdu
                    </a>
                  </div>
                ) : null}
                {vehicle.insurance?.documentUrl ? (
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <a
                      href={vehicle.insurance.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                    >
                      Polisa ubezpieczeniowa
                    </a>
                  </div>
                ) : null}
                {vehicle.inspection?.documentUrl ? (
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <a
                      href={vehicle.inspection.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                    >
                      Zaswiadczenie przegladu
                    </a>
                  </div>
                ) : null}
                {!vehicle.photoUrl &&
                  !vehicle.insurance?.documentUrl &&
                  !vehicle.inspection?.documentUrl && (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Brak dokumentow.
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audyt">
          <AuditTrail entityType="Vehicle" entityId={params.id} />
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archiwizowac pojazd?</DialogTitle>
            <DialogDescription>
              Pojazd {vehicle.registration} zostanie przeniesiony do archiwum.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              disabled={archiveVehicle.isPending}
              onClick={() => {
                archiveVehicle.mutate(params.id, {
                  onSuccess: () => router.push('/pojazdy'),
                });
              }}
            >
              {archiveVehicle.isPending ? 'Archiwizowanie...' : 'Archiwizuj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
