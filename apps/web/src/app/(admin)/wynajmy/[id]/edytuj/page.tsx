'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RentalStatus } from '@rentapp/shared';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useRental } from '@/hooks/queries/use-rentals';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { rentalKeys } from '@/hooks/queries/use-rentals';
import { Loader2 } from 'lucide-react';

const editRentalSchema = z
  .object({
    startDate: z.string().min(1, 'Data poczatkowa jest wymagana'),
    endDate: z.string().min(1, 'Data koncowa jest wymagana'),
    dailyRateNet: z
      .number({ invalid_type_error: 'Podaj stawke' })
      .positive('Stawka musi byc wieksza od 0'),
    vatRate: z
      .number({ invalid_type_error: 'Podaj stawke VAT' })
      .min(0, 'VAT musi byc >= 0')
      .max(100, 'VAT musi byc miedzy 0 a 100'),
    notes: z.string().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data koncowa musi byc pozniejsza niz poczatkowa',
        path: ['endDate'],
      });
    }
  });

type EditFormValues = z.input<typeof editRentalSchema>;

export default function EditRentalPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const { data: rental, isLoading, isError, refetch } = useRental(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editRentalSchema),
  });

  // Redirect if not DRAFT
  useEffect(() => {
    if (rental && rental.status !== RentalStatus.DRAFT) {
      router.replace(`/wynajmy/${id}`);
    }
  }, [rental, router, id]);

  useEffect(() => {
    if (rental) {
      reset({
        startDate: rental.startDate.slice(0, 16),
        endDate: rental.endDate.slice(0, 16),
        dailyRateNet: rental.dailyRateNet,
        vatRate: rental.vatRate,
        notes: rental.notes || '',
      });
    }
  }, [rental, reset]);

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

  if (!rental || rental.status !== RentalStatus.DRAFT) {
    return null;
  }

  async function onSubmit(data: EditFormValues) {
    try {
      await apiClient(`/rentals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
          dailyRateNet: data.dailyRateNet,
          vatRate: data.vatRate,
          notes: data.notes || null,
        }),
      });
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(id) });
      toast.success('Zmiany zapisane');
      router.push(`/wynajmy/${id}`);
    } catch {
      toast.error('Nie udalo sie zapisac zmian');
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Wynajmy', href: '/wynajmy' },
          { label: `#${id.slice(0, 8)}`, href: `/wynajmy/${id}` },
          { label: 'Edytuj' },
        ]}
      />

      <h1 className="text-2xl font-semibold">Edytuj wynajem</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dane wynajmu</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Data od</Label>
              <Input type="datetime-local" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data do</Label>
              <Input type="datetime-local" {...register('endDate')} />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Stawka dzienna netto (grosze)</Label>
              <Input type="number" {...register('dailyRateNet', { valueAsNumber: true })} />
              {errors.dailyRateNet && (
                <p className="text-sm text-destructive">{errors.dailyRateNet.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Stawka VAT (%)</Label>
              <Input type="number" {...register('vatRate', { valueAsNumber: true })} />
              {errors.vatRate && (
                <p className="text-sm text-destructive">{errors.vatRate.message}</p>
              )}
            </div>
            <div className="col-span-full space-y-2">
              <Label>Notatki</Label>
              <Textarea {...register('notes')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz zmiany
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Anuluj
          </Button>
        </div>
      </form>
    </div>
  );
}
