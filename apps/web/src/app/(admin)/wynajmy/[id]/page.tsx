'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { type RentalWithRelations, RentalStatus, ContractStatus, SettlementStatus } from '@rentapp/shared';
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
  useUpdateSettlement,
  useReturnProtocol,
} from '@/hooks/queries/use-rentals';
import { useContractByRental } from '@/hooks/queries/use-contracts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getRentalStatusBadge } from '../columns';
import { getSettlementStatusBadge } from '../settlement-columns';
import { formatDateTime, formatCurrency } from '@/lib/format';
import {
  Loader2,
  Play,
  ArrowLeftRight,
  CalendarPlus,
  RotateCcw,
  Pencil,
  Camera,
  Download,
} from 'lucide-react';
import { AuditTrail } from '@/components/audit/audit-trail';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { toast } from 'sonner';

const contractStatusLabels: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: 'Wersja robocza',
  [ContractStatus.PARTIALLY_SIGNED]: 'Czesciowo podpisana',
  [ContractStatus.SIGNED]: 'Podpisana',
  [ContractStatus.VOIDED]: 'Uniewazniona',
};

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: rental, isLoading } = useRental(id);

  const activateRental = useActivateRental(id);
  const returnRental = useReturnRental(id);
  const extendRental = useExtendRental(id);
  const rollbackRental = useRollbackRental(id);

  const {
    data: contract,
    isLoading: contractLoading,
    isError: contractError,
  } = useContractByRental(id);

  const { data: protocol } = useReturnProtocol(id);

  const [extendOpen, setExtendOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);

  // Extend form
  const [newEndDate, setNewEndDate] = useState('');
  const [extendNotes, setExtendNotes] = useState('');

  // Return form
  const [returnMileage, setReturnMileage] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  // Settlement form
  const updateSettlement = useUpdateSettlement(id);
  const [settlementForm, setSettlementForm] = useState({
    settlementStatus: '' as SettlementStatus,
    settlementAmount: '',
    settlementNotes: '',
  });

  useEffect(() => {
    if (rental) {
      setSettlementForm({
        settlementStatus: (rental as any).settlementStatus ?? 'NIEROZLICZONY',
        settlementAmount: (rental as any).settlementAmount != null ? String((rental as any).settlementAmount / 100) : '',
        settlementNotes: (rental as any).settlementNotes ?? '',
      });
    }
  }, [rental]);

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
    if (!newEndDate || !rental) return;
    const currentEnd = new Date(rental.endDate);
    const selectedEnd = new Date(newEndDate);
    if (selectedEnd <= currentEnd) {
      toast.error('Nowa data musi byc pozniejsza niz obecna data zakonczenia');
      return;
    }
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
    const vehicleMileage = (rental as RentalWithRelations).vehicle?.mileage ?? 0;
    if (mileage < vehicleMileage) {
      toast.error(
        `Przebieg zwrotu nie moze byc mniejszy niz obecny przebieg pojazdu (${vehicleMileage} km)`,
      );
      return;
    }
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h1 className="font-display font-semibold text-2xl text-charcoal">
            Wynajem <span className="font-data">#{id.slice(0, 8)}</span>
          </h1>
          {getRentalStatusBadge(rental)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <TabsTrigger value="rozliczenie">Rozliczenie</TabsTrigger>
        </TabsList>

        <TabsContent value="szczegoly">
          <Card>
            <CardHeader>
              <CardTitle>Szczegoly wynajmu</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="font-body text-sm text-warm-gray">Pojazd</dt>
                  <dd className="font-data text-sm uppercase">
                    {(rental as RentalWithRelations).vehicle?.registration || rental.vehicleId}
                  </dd>
                </div>
                <div>
                  <dt className="font-body text-sm text-warm-gray">Klient</dt>
                  <dd className="font-body text-sm">
                    {(rental as RentalWithRelations).customer
                      ? `${(rental as RentalWithRelations).customer?.firstName} ${(rental as RentalWithRelations).customer?.lastName}`
                      : rental.customerId}
                  </dd>
                </div>
                <div>
                  <dt className="font-body text-sm text-warm-gray">Data od</dt>
                  <dd className="font-data text-sm">{formatDateTime(rental.startDate)}</dd>
                </div>
                <div>
                  <dt className="font-body text-sm text-warm-gray">Data do</dt>
                  <dd className="font-data text-sm">{formatDateTime(rental.endDate)}</dd>
                </div>
                <div>
                  <dt className="font-body text-sm text-warm-gray">Stawka dzienna netto</dt>
                  <dd className="font-data text-sm text-right">
                    {formatCurrency(rental.dailyRateNet)}
                  </dd>
                </div>
                <div>
                  <dt className="font-body text-sm text-warm-gray">Suma netto</dt>
                  <dd className="font-data text-sm text-right">
                    {formatCurrency(rental.totalPriceNet)}
                  </dd>
                </div>
                <div>
                  <dt className="font-body text-sm text-warm-gray">Suma brutto</dt>
                  <dd className="font-data text-sm font-medium text-right">
                    {formatCurrency(rental.totalPriceGross)}
                  </dd>
                </div>
                <div>
                  <dt className="font-body text-sm text-warm-gray">VAT</dt>
                  <dd className="font-data text-sm">{rental.vatRate}%</dd>
                </div>
                {(rental as unknown as { vehicleClassName?: string }).vehicleClassName && (
                  <div>
                    <dt className="font-body text-sm text-warm-gray">Klasa pojazdu</dt>
                    <dd className="font-body text-sm">
                      {(rental as unknown as { vehicleClassName?: string }).vehicleClassName}
                    </dd>
                  </div>
                )}
                {(rental as unknown as { isCompanyRental?: boolean }).isCompanyRental && (
                  <>
                    <div className="col-span-full border-t pt-4 mt-2">
                      <dt className="font-body text-sm font-medium text-charcoal">Dane firmy</dt>
                    </div>
                    <div>
                      <dt className="font-body text-sm text-warm-gray">NIP</dt>
                      <dd className="font-data text-sm">
                        {(rental as unknown as { companyNip?: string }).companyNip ?? '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-body text-sm text-warm-gray">Platnik VAT</dt>
                      <dd className="font-body text-sm">
                        {(() => {
                          const vat = (rental as unknown as { vatPayerStatus?: string }).vatPayerStatus;
                          if (vat === 'FULL_100') return '100%';
                          if (vat === 'HALF_50') return '50%';
                          if (vat === 'NONE') return 'Nie';
                          return '-';
                        })()}
                      </dd>
                    </div>
                  </>
                )}
                {(rental as unknown as { insuranceCaseNumber?: string }).insuranceCaseNumber && (
                  <div>
                    <dt className="font-body text-sm text-warm-gray">Nr sprawy ubezpieczeniowej</dt>
                    <dd className="font-data text-sm">
                      {(rental as unknown as { insuranceCaseNumber?: string }).insuranceCaseNumber}
                    </dd>
                  </div>
                )}
                {((rental as unknown as { pickupLocation?: { address: string } }).pickupLocation ||
                  (rental as unknown as { returnLocation?: { address: string } }).returnLocation) && (
                  <>
                    <div className="col-span-full border-t pt-4 mt-2">
                      <dt className="font-body text-sm font-medium text-charcoal">Lokalizacje</dt>
                    </div>
                    {(rental as unknown as { pickupLocation?: { address: string } }).pickupLocation && (
                      <div>
                        <dt className="font-body text-sm text-warm-gray">Miejsce wydania</dt>
                        <dd className="font-body text-sm">
                          {(rental as unknown as { pickupLocation: { address: string } }).pickupLocation.address}
                        </dd>
                      </div>
                    )}
                    {(rental as unknown as { returnLocation?: { address: string } }).returnLocation && (
                      <div>
                        <dt className="font-body text-sm text-warm-gray">Miejsce zdania</dt>
                        <dd className="font-body text-sm">
                          {(rental as unknown as { returnLocation: { address: string } }).returnLocation.address}
                        </dd>
                      </div>
                    )}
                  </>
                )}
                {rental.returnMileage != null && (
                  <div>
                    <dt className="font-body text-sm text-warm-gray">Przebieg przy zwrocie</dt>
                    <dd className="font-data text-sm">
                      {rental.returnMileage.toLocaleString('pl-PL')} km
                    </dd>
                  </div>
                )}
                {rental.notes && (
                  <div className="col-span-full">
                    <dt className="font-body text-sm text-warm-gray">Notatki</dt>
                    <dd className="font-body text-sm whitespace-pre-wrap">{rental.notes}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-body text-sm text-warm-gray">Utworzono</dt>
                  <dd className="font-data text-sm">{formatDateTime(rental.createdAt)}</dd>
                </div>
                <div>
                  <dt className="font-body text-sm text-warm-gray">Zaktualizowano</dt>
                  <dd className="font-data text-sm">{formatDateTime(rental.updatedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="umowa">
          <Card>
            {contractLoading ? (
              <CardContent className="py-8 space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            ) : contractError || !contract ? (
              <CardContent className="py-8 text-center text-muted-foreground">
                Brak umowy powiazanej z tym wynajmem.
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>Umowa {contract.contractNumber}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Status</dt>
                      <dd className="text-sm font-medium">
                        {contractStatusLabels[contract.status] || contract.status}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Data utworzenia</dt>
                      <dd className="text-sm">{formatDateTime(contract.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Stawka dzienna netto</dt>
                      <dd className="text-sm">{formatCurrency(contract.dailyRateNet)}</dd>
                    </div>
                    {contract.depositAmount != null && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Kaucja</dt>
                        <dd className="text-sm">{formatCurrency(contract.depositAmount)}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm text-muted-foreground">Podpisy</dt>
                      <dd className="text-sm">{contract.signatures?.length || 0} z 4</dd>
                    </div>
                    <div className="col-span-full">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/umowy/${contract.id}`}>Zobacz pelna umowe</Link>
                      </Button>
                    </div>
                  </dl>
                </CardContent>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="inspekcja">
          <div className="space-y-4">
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
            <Card>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Dokumentacja fotograficzna</p>
                  <p className="text-xs text-muted-foreground">
                    Zdjecia pojazdu i mapa uszkodzen z obchodu fotograficznego
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/wynajmy/${id}/dokumentacja`}>
                    <Camera className="mr-2 h-4 w-4" />
                    Zobacz dokumentacje
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audyt">
          <AuditTrail entityType="Rental" entityId={id} />
        </TabsContent>

        <TabsContent value="rozliczenie">
          <Card>
            <CardHeader><CardTitle>Rozliczenie</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status rozliczenia</Label>
                <Select value={settlementForm.settlementStatus} onValueChange={(v) => setSettlementForm(f => ({...f, settlementStatus: v as SettlementStatus}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIEROZLICZONY">Nierozliczony</SelectItem>
                    <SelectItem value="CZESCIOWO_ROZLICZONY">Czesciowo rozliczony</SelectItem>
                    <SelectItem value="ROZLICZONY">Rozliczony</SelectItem>
                    <SelectItem value="ANULOWANY">Anulowany</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zebrana kwota</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" placeholder="0,00" value={settlementForm.settlementAmount}
                    onChange={(e) => setSettlementForm(f => ({...f, settlementAmount: e.target.value}))} />
                  <span className="text-sm text-muted-foreground">PLN</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notatki</Label>
                <Textarea placeholder="Opcjonalne uwagi do rozliczenia..." value={settlementForm.settlementNotes}
                  onChange={(e) => setSettlementForm(f => ({...f, settlementNotes: e.target.value}))} />
              </div>

              {(rental as any)?.settledAt && (rental as any)?.settlementStatus === 'ROZLICZONY' && (
                <div className="space-y-1">
                  <Label>Data rozliczenia</Label>
                  <p className="text-sm font-data">{formatDateTime((rental as any).settledAt)}</p>
                </div>
              )}

              <Button onClick={() => {
                const amountGrosze = settlementForm.settlementAmount ? Math.round(parseFloat(settlementForm.settlementAmount.replace(',', '.')) * 100) : undefined;
                updateSettlement.mutate({
                  settlementStatus: settlementForm.settlementStatus,
                  settlementAmount: amountGrosze,
                  settlementNotes: settlementForm.settlementNotes || undefined,
                });
              }} disabled={updateSettlement.isPending}>
                {updateSettlement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Zapisz rozliczenie
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Protocol download section */}
      {rental.status === RentalStatus.RETURNED && protocol && (
        <Card>
          <CardHeader>
            <CardTitle>Protokol zwrotu</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { url } = await apiClient<{ url: string }>(`/return-protocols/${rental.id}/download`);
                  window.open(url, '_blank');
                } catch {
                  toast.error('Nie udalo sie pobrac protokolu');
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Pobierz protokol
            </Button>
            {protocol.pdfGeneratedAt && (
              <p className="mt-2 text-sm text-muted-foreground">
                Wygenerowano: {formatDateTime(protocol.pdfGeneratedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
