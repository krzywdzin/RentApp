'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { differenceInDays } from 'date-fns';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVehicles } from '@/hooks/queries/use-vehicles';
import { useSearchCustomers } from '@/hooks/queries/use-customers';
import { useCreateRental } from '@/hooks/queries/use-rentals';
import { formatCurrency } from '@/lib/format';
import { Loader2 } from 'lucide-react';

// Client-side form schema (simplified for the form; server validates fully)
const formSchema = z
  .object({
    vehicleId: z.string().uuid('Wybierz pojazd'),
    customerId: z.string().uuid('Wybierz klienta'),
    startDate: z.string().min(1, 'Wymagane'),
    endDate: z.string().min(1, 'Wymagane'),
    dailyRateNet: z
      .number({ required_error: 'Stawka dzienna jest wymagana' })
      .int()
      .min(1, 'Stawka musi byc wieksza niz 0'),
    vatRate: z.number().int().min(0).max(100).default(23),
    notes: z.string().max(2000).optional(),
    status: z.enum(['DRAFT', 'ACTIVE']).default('DRAFT'),
  })
  .refine((d) => !d.startDate || !d.endDate || new Date(d.endDate) > new Date(d.startDate), {
    message: 'Data zakonczenia musi byc po dacie rozpoczecia',
    path: ['endDate'],
  });

type FormValues = z.infer<typeof formSchema>;

export default function NewRentalPage() {
  const router = useRouter();
  const { data: vehicles } = useVehicles();
  const createRental = useCreateRental();

  const [customerSearch, setCustomerSearch] = useState('');
  const { data: customerResults } = useSearchCustomers(customerSearch);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      vatRate: 23,
      status: 'DRAFT',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const dailyRateNet = watch('dailyRateNet');
  const vatRate = watch('vatRate');

  const pricing = useMemo(() => {
    if (!startDate || !endDate || !dailyRateNet) return null;
    const days = differenceInDays(new Date(endDate), new Date(startDate));
    if (days <= 0) return null;
    const totalNet = dailyRateNet * days;
    const totalGross = Math.round(totalNet * (1 + (vatRate || 23) / 100));
    return { days, totalNet, totalGross };
  }, [startDate, endDate, dailyRateNet, vatRate]);

  async function onSubmit(data: FormValues) {
    const payload = {
      vehicleId: data.vehicleId,
      customerId: data.customerId,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      dailyRateNet: data.dailyRateNet,
      vatRate: data.vatRate,
      notes: data.notes || null,
      status: data.status as 'DRAFT' | 'ACTIVE',
      overrideConflict: false,
    };

    try {
      await createRental.mutateAsync(payload);
      router.push('/wynajmy');
    } catch {
      /* handled by mutation onError */
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Wynajmy', href: '/wynajmy' }, { label: 'Nowy wynajem' }]} />

      <h1 className="text-2xl font-semibold">Nowy wynajem</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dane wynajmu</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Vehicle select */}
            <div className="space-y-2">
              <Label>Pojazd</Label>
              <Select onValueChange={(v) => setValue('vehicleId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz pojazd" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registration} - {v.make} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleId && (
                <p className="text-sm text-destructive">{errors.vehicleId.message}</p>
              )}
            </div>

            {/* Customer search */}
            <div className="space-y-2">
              <Label>Klient</Label>
              {selectedCustomer ? (
                <div className="flex items-center gap-2">
                  <span className="flex-1 rounded-md border px-3 py-2 text-sm">
                    {selectedCustomer.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setValue('customerId', '' as unknown as string);
                    }}
                  >
                    Zmien
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Szukaj klienta (nazwisko, telefon)..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    role="combobox"
                    aria-expanded={showDropdown && !!customerResults?.length}
                    aria-haspopup="listbox"
                    aria-autocomplete="list"
                    aria-controls="customer-search-results"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' && showDropdown && customerResults?.length) {
                        e.preventDefault();
                        const first = document.querySelector<HTMLButtonElement>(
                          '#customer-search-results button',
                        );
                        first?.focus();
                      }
                      if (e.key === 'Escape') {
                        setShowDropdown(false);
                      }
                    }}
                  />
                  {showDropdown && customerResults && customerResults.length > 0 && (
                    <div
                      id="customer-search-results"
                      role="listbox"
                      className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md"
                    >
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          role="option"
                          aria-selected={false}
                          className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent"
                          onClick={() => {
                            setValue('customerId', c.id);
                            setSelectedCustomer({
                              id: c.id,
                              name: `${c.firstName} ${c.lastName}`,
                            });
                            setCustomerSearch('');
                            setShowDropdown(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setShowDropdown(false);
                            }
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              const next = e.currentTarget
                                .nextElementSibling as HTMLButtonElement | null;
                              next?.focus();
                            }
                            if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const prev = e.currentTarget
                                .previousElementSibling as HTMLButtonElement | null;
                              prev?.focus();
                            }
                          }}
                        >
                          <span className="font-medium">
                            {c.firstName} {c.lastName}
                          </span>
                          <span className="ml-2 text-muted-foreground">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.customerId && (
                <p className="text-sm text-destructive">{errors.customerId.message}</p>
              )}
            </div>

            {/* Start date */}
            <div className="space-y-2">
              <Label>Data od</Label>
              <Input type="datetime-local" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            {/* End date */}
            <div className="space-y-2">
              <Label>Data do</Label>
              <Input type="datetime-local" {...register('endDate')} />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>

            {/* Daily rate */}
            <div className="space-y-2">
              <Label>Stawka dzienna netto (grosze)</Label>
              <Input
                type="number"
                {...register('dailyRateNet', { valueAsNumber: true })}
                placeholder="np. 15000 (150 zl)"
              />
              {errors.dailyRateNet && (
                <p className="text-sm text-destructive">{errors.dailyRateNet.message}</p>
              )}
            </div>

            {/* VAT rate */}
            <div className="space-y-2">
              <Label>Stawka VAT (%)</Label>
              <Input
                type="number"
                {...register('vatRate', { valueAsNumber: true })}
                defaultValue={23}
              />
              {errors.vatRate && (
                <p className="text-sm text-destructive">{errors.vatRate.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="col-span-full space-y-2">
              <Label>Notatki</Label>
              <Textarea {...register('notes')} placeholder="Opcjonalne notatki..." />
            </div>
          </CardContent>
        </Card>

        {/* Pricing summary */}
        {pricing && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-2 sm:grid-cols-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Dni wynajmu:</span>{' '}
                  <span className="font-medium">{pricing.days}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Suma netto:</span>{' '}
                  <span className="font-medium">{formatCurrency(pricing.totalNet)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Suma brutto:</span>{' '}
                  <span className="font-medium">{formatCurrency(pricing.totalGross)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={createRental.isPending}>
            {createRental.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Utworz wynajem
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit((data) => onSubmit({ ...data, status: 'ACTIVE' }))()}
            disabled={createRental.isPending}
          >
            Utworz i aktywuj
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Anuluj
          </Button>
        </div>
      </form>
    </div>
  );
}
