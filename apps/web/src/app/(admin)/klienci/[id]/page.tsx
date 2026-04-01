'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Link2, Copy, Check } from 'lucide-react';
import { AuditTrail } from '@/components/audit/audit-trail';
import { Button } from '@/components/ui/button';
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
import { ErrorState } from '@/components/ui/error-state';
import { useCustomer, useArchiveCustomer } from '@/hooks/queries/use-customers';
import { useRentals } from '@/hooks/queries/use-rentals';
import { getRentalStatusBadge } from '../../wynajmy/columns';
import { formatDate } from '@/lib/format';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: customer, isLoading, isError, refetch } = useCustomer(params.id);
  const { data: rentals, isLoading: rentalsLoading } = useRentals({ customerId: params.id });
  const archiveCustomer = useArchiveCustomer();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [showPortalDialog, setShowPortalDialog] = useState(false);
  const [portalLinkLoading, setPortalLinkLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePortalLink = async () => {
    setPortalLinkLoading(true);
    try {
      const res = await apiClient<{ url: string }>(`/customers/${params.id}/portal-link`, { method: 'POST' });
      setPortalLink(res.url);
      setShowPortalDialog(true);
    } catch {
      toast.error('Nie udało się wygenerować linku portalu');
    } finally {
      setPortalLinkLoading(false);
    }
  };

  const copyPortalLink = async () => {
    if (!portalLink) return;
    await navigator.clipboard.writeText(portalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const customerRentals = rentals ?? [];

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

  if (!customer) {
    return <div className="text-center py-12 text-muted-foreground">Nie znaleziono klienta.</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Klienci', href: '/klienci' },
          { label: `${customer.lastName} ${customer.firstName}` },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-2xl text-charcoal">
          {customer.lastName} {customer.firstName}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={generatePortalLink} disabled={portalLinkLoading}>
            <Link2 className="h-4 w-4" />
            {portalLinkLoading ? 'Generowanie...' : 'Link portalu'}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/klienci/${params.id}/edytuj`}>
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
          <TabsTrigger value="audyt">Audyt</TabsTrigger>
        </TabsList>

        <TabsContent value="dane">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dane kontaktowe</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <InfoRow label="Imie" value={customer.firstName} />
                <InfoRow label="Nazwisko" value={customer.lastName} />
                <InfoRow label="Telefon" value={customer.phone} />
                <InfoRow label="Email" value={customer.email} />
                <InfoRow label="Adres" value={customer.address} />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dokumenty tozsamosci</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <InfoRow label="PESEL" value={customer.pesel} />
                  <InfoRow label="Numer dowodu" value={customer.idNumber} />
                  <InfoRow label="Organ wydajacy" value={customer.idIssuedBy} />
                  <InfoRow
                    label="Data wydania"
                    value={customer.idIssuedDate ? formatDate(customer.idIssuedDate) : null}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prawo jazdy</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <InfoRow label="Numer" value={customer.licenseNumber} />
                  <InfoRow label="Kategoria" value={customer.licenseCategory} />
                  <InfoRow label="Organ wydajacy" value={customer.licenseIssuedBy} />
                </CardContent>
              </Card>
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
              ) : customerRentals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Brak wynajmow dla tego klienta.
                </p>
              ) : (
                <div className="space-y-2">
                  {customerRentals.map((rental) => (
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

        <TabsContent value="audyt">
          <AuditTrail entityType="Customer" entityId={params.id} />
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usunac klienta?</DialogTitle>
            <DialogDescription>
              Dane klienta {customer.firstName} {customer.lastName} zostana trwale usuniete. Tej
              operacji nie mozna cofnac.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              disabled={archiveCustomer.isPending}
              onClick={() => {
                archiveCustomer.mutate(params.id, {
                  onSuccess: () => router.push('/klienci'),
                });
              }}
            >
              {archiveCustomer.isPending ? 'Usuwanie...' : 'Usun klienta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Portal Link Dialog */}
      <Dialog open={showPortalDialog} onOpenChange={setShowPortalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link portalu klienta</DialogTitle>
            <DialogDescription>
              Skopiuj link i wyślij klientowi. Link jest ważny przez 30 dni.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <p className="flex-1 break-all text-xs font-mono text-muted-foreground">{portalLink}</p>
            <Button size="icon" variant="ghost" onClick={copyPortalLink}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={copyPortalLink} className="w-full">
              {copied ? '✓ Skopiowano!' : 'Kopiuj link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
