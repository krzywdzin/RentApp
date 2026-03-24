'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RentalStatus } from '@rentapp/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  useRental,
  useActivateRental,
  useReturnRental,
  useExtendRental,
  useRollbackRental,
} from '@/hooks/queries/use-rentals';
import { getRentalStatusBadge } from '../columns';
import { formatDateTime, formatCurrency } from '@/lib/format';
import { Loader2, Play, ArrowLeftRight, CalendarPlus, RotateCcw, Pencil, Camera } from 'lucide-react';
import { AuditTrail } from '@/components/audit/audit-trail';

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: rental, isLoading } = useRental(id);

  const activateRental = useActivateRental(id);
  const returnRental = useReturnRental(id);
  const extendRental = useExtendRental(id);
  const rollbackRental = useRollbackRental(id);

  const [extendOpen, setExtendOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);

  // Extend form
  const [newEndDate, setNewEndDate] = useState('');
  const [extendNotes, setExtendNotes] = useState('');

  // Return form
  const [returnMileage, setReturnMileage] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-lg font-medium">Nie znaleziono wynajmu</p>
      </div>
    );
  }

  function handleExtend() {
    if (!newEndDate) return;
    extendRental.mutate(
      {
        newEndDate: new Date(newEndDate).toISOString(),
        notes: extendNotes || undefined,
      },
      {
        onSuccess: () => {
          setExtendOpen(false);
          setNewEndDate('');
          setExtendNotes('');
        },
      },
    );
  }

  function handleReturn() {
    const mileage = parseInt(returnMileage, 10);
    if (isNaN(mileage) || mileage < 0) return;
    returnRental.mutate(
      {
        returnMileage: mileage,
        notes: returnNotes || undefined,
      },
      {
        onSuccess: () => {
          setReturnOpen(false);
          setReturnMileage('');
          setReturnNotes('');
        },
      },
    );
  }

  function handleRollback() {
    rollbackRental.mutate(undefined, {
      onSuccess: () => setRollbackOpen(false),
    });
  }

  const canEdit = rental.status === RentalStatus.DRAFT;
  const canActivate = rental.status === RentalStatus.DRAFT;
  const canExtend = rental.status === RentalStatus.ACTIVE;
  const canReturn =
    rental.status === RentalStatus.ACTIVE || rental.status === RentalStatus.EXTENDED;
  const canRollback =
    rental.status === RentalStatus.ACTIVE ||
    rental.status === RentalStatus.EXTENDED ||
    rental.status === RentalStatus.RETURNED;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: 'Wynajmy', href: '/wynajmy' }, { label: `#${id.slice(0, 8)}` }]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Wynajem #{id.slice(0, 8)}</h1>
          {getRentalStatusBadge(rental)}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/wynajmy/${id}/dokumentacja`)}>
            <Camera className="mr-2 h-4 w-4" />
            Dokumentacja
          </Button>
          {canEdit && (
            <Button variant="outline" onClick={() => router.push(`/wynajmy/${id}/edytuj`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edytuj
            </Button>
          )}
          {canActivate && (
            <Button
              onClick={() => activateRental.mutate()}
              disabled={activateRental.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {activateRental.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Aktywuj
            </Button>
          )}
          {canExtend && (
            <Button variant="outline" onClick={() => setExtendOpen(true)}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Przedluz
            </Button>
          )}
          {canReturn && (
            <Button variant="outline" onClick={() => setReturnOpen(true)}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Zwroc
            </Button>
          )}
          {canRollback && (
            <Button variant="destructive" onClick={() => setRollbackOpen(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Cofnij status
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="szczegoly">
        <TabsList>
          <TabsTrigger value="szczegoly">Szczegoly</TabsTrigger>
          <TabsTrigger value="umowa">Umowa</TabsTrigger>
          <TabsTrigger value="inspekcja">Inspekcja</TabsTrigger>
          <TabsTrigger value="audyt">Audyt</TabsTrigger>
        </TabsList>

        <TabsContent value="szczegoly">
          <Card>
            <CardHeader>
              <CardTitle>Szczegoly wynajmu</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Pojazd</dt>
                  <dd className="font-mono text-sm">{rental.vehicleId}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Klient</dt>
                  <dd className="font-mono text-sm">{rental.customerId}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Data od</dt>
                  <dd className="text-sm">{formatDateTime(rental.startDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Data do</dt>
                  <dd className="text-sm">{formatDateTime(rental.endDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Stawka dzienna netto</dt>
                  <dd className="text-sm">{formatCurrency(rental.dailyRateNet)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Suma netto</dt>
                  <dd className="text-sm">{formatCurrency(rental.totalPriceNet)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Suma brutto</dt>
                  <dd className="text-sm font-medium">{formatCurrency(rental.totalPriceGross)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">VAT</dt>
                  <dd className="text-sm">{rental.vatRate}%</dd>
                </div>
                {rental.returnMileage != null && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Przebieg przy zwrocie</dt>
                    <dd className="text-sm">{rental.returnMileage.toLocaleString('pl-PL')} km</dd>
                  </div>
                )}
                {rental.notes && (
                  <div className="col-span-full">
                    <dt className="text-sm text-muted-foreground">Notatki</dt>
                    <dd className="text-sm whitespace-pre-wrap">{rental.notes}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted-foreground">Utworzono</dt>
                  <dd className="text-sm">{formatDateTime(rental.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Zaktualizowano</dt>
                  <dd className="text-sm">{formatDateTime(rental.updatedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="umowa">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Brak umowy powiazanej z tym wynajmem.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspekcja">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Wydanie pojazdu</CardTitle>
              </CardHeader>
              <CardContent>
                {rental.handoverData ? (
                  <InspectionDisplay data={rental.handoverData} />
                ) : (
                  <p className="text-sm text-muted-foreground">Brak danych inspekcji wydania</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Zwrot pojazdu</CardTitle>
              </CardHeader>
              <CardContent>
                {rental.returnData ? (
                  <InspectionDisplay data={rental.returnData} />
                ) : (
                  <p className="text-sm text-muted-foreground">Brak danych inspekcji zwrotu</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audyt">
          <AuditTrail entityType="Rental" entityId={id} />
        </TabsContent>
      </Tabs>

      {/* Extend dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przedluz wynajem</DialogTitle>
            <DialogDescription>Ustaw nowa date zakonczenia wynajmu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nowa data zakonczenia</Label>
              <Input
                type="datetime-local"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notatki (opcjonalnie)</Label>
              <Textarea
                value={extendNotes}
                onChange={(e) => setExtendNotes(e.target.value)}
                placeholder="Powod przedluzenia..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExtendOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleExtend} disabled={extendRental.isPending || !newEndDate}>
              {extendRental.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Przedluz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return dialog */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zwrot pojazdu</DialogTitle>
            <DialogDescription>Wprowadz dane zwrotu pojazdu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Przebieg przy zwrocie (km)</Label>
              <Input
                type="number"
                value={returnMileage}
                onChange={(e) => setReturnMileage(e.target.value)}
                placeholder="np. 125000"
              />
            </div>
            <div className="space-y-2">
              <Label>Notatki (opcjonalnie)</Label>
              <Textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Uwagi dotyczace zwrotu..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReturnOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleReturn} disabled={returnRental.isPending || !returnMileage}>
              {returnRental.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zwroc
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback dialog */}
      <Dialog open={rollbackOpen} onOpenChange={setRollbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cofnac status wynajmu?</DialogTitle>
            <DialogDescription>
              Wynajem zostanie przywrocony do poprzedniego stanu. Dane zwrotu moga zostac usuniete.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRollbackOpen(false)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleRollback}
              disabled={rollbackRental.isPending}
            >
              {rollbackRental.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cofnij status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InspectionDisplay({
  data,
}: {
  data: {
    mileage: number;
    areas?: { area: string; condition: string; note?: string }[];
    generalNotes?: string;
  };
}) {
  const conditionLabels: Record<string, string> = {
    good: 'Dobry',
    minor_damage: 'Drobne uszkodzenia',
    major_damage: 'Powazne uszkodzenia',
    missing: 'Brak',
  };

  const areaLabels: Record<string, string> = {
    front: 'Przod',
    rear: 'Tyl',
    left: 'Lewa strona',
    right: 'Prawa strona',
    roof: 'Dach',
    interior: 'Wnetrze',
    trunk: 'Bagaznik',
    engine: 'Silnik',
  };

  return (
    <div className="space-y-3">
      <div>
        <span className="text-sm text-muted-foreground">Przebieg: </span>
        <span className="text-sm font-medium">{data.mileage.toLocaleString('pl-PL')} km</span>
      </div>
      {data.areas && data.areas.length > 0 && (
        <div className="space-y-1">
          {data.areas.map((area) => (
            <div key={area.area} className="flex items-center justify-between text-sm">
              <span>{areaLabels[area.area] || area.area}</span>
              <span className="text-muted-foreground">
                {conditionLabels[area.condition] || area.condition}
              </span>
            </div>
          ))}
        </div>
      )}
      {data.generalNotes && (
        <div>
          <span className="text-sm text-muted-foreground">Uwagi: </span>
          <span className="text-sm">{data.generalNotes}</span>
        </div>
      )}
    </div>
  );
}
