'use client';

import { useParams } from 'next/navigation';
import { Download } from 'lucide-react';
import { AuditTrail } from '@/components/audit/audit-trail';
import type { ContractSignatureDto, ContractAnnexDto } from '@rentapp/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ErrorState } from '@/components/ui/error-state';
import { useContract, getContractPdfUrl } from '@/hooks/queries/use-contracts';
import { getContractStatusBadge } from '../columns';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/format';

const signatureTypeLabels: Record<string, string> = {
  customer_page1: 'Klient str. 1',
  employee_page1: 'Pracownik str. 1',
  customer_page2: 'Klient str. 2',
  employee_page2: 'Pracownik str. 2',
};

export default function ContractDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: contract, isLoading, isError, refetch } = useContract(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-lg font-medium">Nie znaleziono umowy</p>
      </div>
    );
  }

  const frozenData = contract.contractData as Record<string, unknown> | null;
  const company = frozenData?.company as Record<string, string> | undefined;
  const customer = frozenData?.customer as Record<string, string> | undefined;
  const vehicle = frozenData?.vehicle as Record<string, unknown> | undefined;
  const rental = frozenData?.rental as Record<string, unknown> | undefined;
  const conditions = frozenData?.conditions as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: 'Umowy', href: '/umowy' }, { label: contract.contractNumber }]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{contract.contractNumber}</h1>
          {getContractStatusBadge(contract.status)}
        </div>
        {contract.pdfKey && (
          <a href={getContractPdfUrl(contract.id)} target="_blank" rel="noopener noreferrer">
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Pobierz PDF
            </Button>
          </a>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="szczegoly">
        <TabsList>
          <TabsTrigger value="szczegoly">Szczegoly</TabsTrigger>
          <TabsTrigger value="podpisy">Podpisy</TabsTrigger>
          <TabsTrigger value="aneksy">Aneksy</TabsTrigger>
          <TabsTrigger value="audyt">Audyt</TabsTrigger>
        </TabsList>

        <TabsContent value="szczegoly">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Company */}
            {company && (
              <Card>
                <CardHeader>
                  <CardTitle>Firma</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <DetailRow label="Nazwa" value={company.name} />
                    <DetailRow label="Wlasciciel" value={company.owner} />
                    <DetailRow label="Adres" value={company.address} />
                    <DetailRow label="Telefon" value={company.phone} />
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Customer */}
            {customer && (
              <Card>
                <CardHeader>
                  <CardTitle>Klient</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <DetailRow
                      label="Imie i nazwisko"
                      value={`${customer.firstName} ${customer.lastName}`}
                    />
                    <DetailRow label="PESEL" value={customer.pesel} />
                    <DetailRow label="Nr dowodu" value={customer.idNumber} />
                    <DetailRow label="Nr prawa jazdy" value={customer.licenseNumber} />
                    <DetailRow label="Telefon" value={customer.phone} />
                    <DetailRow label="Email" value={customer.email} />
                    <DetailRow label="Adres" value={customer.address} />
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Vehicle */}
            {vehicle && (
              <Card>
                <CardHeader>
                  <CardTitle>Pojazd</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <DetailRow label="Rejestracja" value={String(vehicle.registration ?? '')} />
                    <DetailRow
                      label="Marka i model"
                      value={`${vehicle.make ?? ''} ${vehicle.model ?? ''}`}
                    />
                    <DetailRow label="Rok" value={String(vehicle.year ?? '')} />
                    <DetailRow label="VIN" value={String(vehicle.vin ?? '')} />
                    <DetailRow
                      label="Przebieg"
                      value={
                        vehicle.mileage != null
                          ? `${Number(vehicle.mileage).toLocaleString('pl-PL')} km`
                          : '-'
                      }
                    />
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Rental terms */}
            {rental && (
              <Card>
                <CardHeader>
                  <CardTitle>Warunki wynajmu</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <DetailRow
                      label="Data od"
                      value={rental.startDate ? formatDateTime(String(rental.startDate)) : '-'}
                    />
                    <DetailRow
                      label="Data do"
                      value={rental.endDate ? formatDateTime(String(rental.endDate)) : '-'}
                    />
                    <DetailRow
                      label="Stawka dzienna netto"
                      value={
                        rental.dailyRateNet != null
                          ? formatCurrency(Number(rental.dailyRateNet))
                          : '-'
                      }
                    />
                    <DetailRow
                      label="Suma netto"
                      value={
                        rental.totalPriceNet != null
                          ? formatCurrency(Number(rental.totalPriceNet))
                          : '-'
                      }
                    />
                    <DetailRow
                      label="Suma brutto"
                      value={
                        rental.totalPriceGross != null
                          ? formatCurrency(Number(rental.totalPriceGross))
                          : '-'
                      }
                    />
                    <DetailRow label="VAT" value={rental.vatRate ? `${rental.vatRate}%` : '-'} />
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Conditions */}
            {conditions && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Warunki dodatkowe</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-2 sm:grid-cols-3">
                    <DetailRow
                      label="Kaucja"
                      value={
                        conditions.depositAmount != null
                          ? formatCurrency(Number(conditions.depositAmount))
                          : 'Brak'
                      }
                    />
                    <DetailRow
                      label="Stawka dzienna netto"
                      value={
                        conditions.dailyRateNet != null
                          ? formatCurrency(Number(conditions.dailyRateNet))
                          : '-'
                      }
                    />
                    <DetailRow
                      label="Kara za opoznienie netto"
                      value={
                        conditions.lateFeeNet != null
                          ? formatCurrency(Number(conditions.lateFeeNet))
                          : 'Brak'
                      }
                    />
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="podpisy">
          <Card>
            <CardHeader>
              <CardTitle>Podpisy</CardTitle>
            </CardHeader>
            <CardContent>
              {contract.signatures.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak podpisow</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Typ</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Urzadzenie</TableHead>
                      <TableHead>Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contract.signatures.map((sig: ContractSignatureDto) => (
                      <TableRow key={sig.id}>
                        <TableCell>
                          {signatureTypeLabels[sig.signatureType] || sig.signatureType}
                        </TableCell>
                        <TableCell>{formatDateTime(sig.signedAt)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {sig.deviceInfo || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {sig.contentHash.slice(0, 12)}...
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aneksy">
          <Card>
            <CardHeader>
              <CardTitle>Aneksy</CardTitle>
            </CardHeader>
            <CardContent>
              {contract.annexes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak aneksow</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nr aneksu</TableHead>
                      <TableHead>Zmiany</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contract.annexes.map((annex: ContractAnnexDto) => (
                      <TableRow key={annex.id}>
                        <TableCell className="font-medium">{annex.annexNumber}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {Object.entries(annex.changes).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="text-muted-foreground">{key}:</span>{' '}
                                <span>{JSON.stringify(value)}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(annex.createdAt)}</TableCell>
                        <TableCell>
                          {annex.pdfKey ? (
                            <a
                              href={`/api/contracts/${contract.id}/annexes/${annex.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audyt">
          <AuditTrail entityType="Contract" entityId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || '-'}</dd>
    </div>
  );
}
