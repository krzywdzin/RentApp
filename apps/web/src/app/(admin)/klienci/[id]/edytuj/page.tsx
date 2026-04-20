'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateCustomerSchema, type UpdateCustomerInput } from '@rentapp/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { useCustomer, useUpdateCustomer } from '@/hooks/queries/use-customers';

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: customer, isLoading } = useCustomer(params.id);
  const updateCustomer = useUpdateCustomer(params.id);

  const form = useForm({
    resolver: zodResolver(UpdateCustomerSchema),
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email,
        street: customer.street,
        houseNumber: customer.houseNumber,
        apartmentNumber: customer.apartmentNumber,
        postalCode: customer.postalCode,
        city: customer.city,
        pesel: customer.pesel,
        idNumber: customer.idNumber,
        licenseNumber: customer.licenseNumber,
        idIssuedBy: customer.idIssuedBy,
        idIssuedDate: customer.idIssuedDate?.slice(0, 10) ?? '',
        licenseCategory: customer.licenseCategory,
        licenseIssuedBy: customer.licenseIssuedBy,
        licenseBookletNumber: customer.licenseBookletNumber,
      });
    }
  }, [customer, form]);

  function onSubmit(data: UpdateCustomerInput) {
    // Clean up empty optional fields - replace empty strings with null
    const cleaned = { ...data } as Record<string, unknown>;
    for (const [key, value] of Object.entries(cleaned)) {
      if (value === '' || value === null || value === undefined) {
        cleaned[key] = null;
      }
    }
    // Convert date fields from "YYYY-MM-DD" to ISO datetime string
    const dateFields = ['idIssuedDate', 'idExpiryDate', 'dateOfBirth', 'birthDate'];
    for (const field of dateFields) {
      if (
        cleaned[field] &&
        typeof cleaned[field] === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(cleaned[field] as string)
      ) {
        cleaned[field] = new Date(cleaned[field] as string).toISOString();
      }
    }
    updateCustomer.mutate(cleaned as UpdateCustomerInput, {
      onSuccess: () => router.push(`/klienci/${params.id}`),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Klienci', href: '/klienci' },
          {
            label: `${customer?.lastName ?? ''} ${customer?.firstName ?? ''}`,
            href: `/klienci/${params.id}`,
          },
          { label: 'Edytuj' },
        ]}
      />

      <h1 className="font-display font-semibold text-2xl text-charcoal">Edytuj klienta</h1>

      <Card>
        <CardHeader>
          <CardTitle>Dane osobowe</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imie</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazwisko</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <CardTitle className="text-base pt-4">Adres zamieszkania</CardTitle>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ulica</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="houseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nr domu</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apartmentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nr lokalu</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kod pocztowy</FormLabel>
                      <FormControl>
                        <Input placeholder="XX-XXX" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miasto</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <CardTitle className="text-base pt-4">Dokumenty tozsamosci</CardTitle>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pesel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PESEL</FormLabel>
                      <FormControl>
                        <Input maxLength={11} {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numer dowodu</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idIssuedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organ wydajacy dowod</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idIssuedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data wydania dowodu</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <CardTitle className="text-base pt-4">Prawo jazdy</CardTitle>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numer prawa jazdy</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategoria prawa jazdy</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseIssuedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organ wydajacy prawo jazdy</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseBookletNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nr blankietu prawa jazdy</FormLabel>
                      <FormControl>
                        <Input placeholder="np. MC 1234567" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/klienci/${params.id}`)}
                >
                  Anuluj
                </Button>
                <Button type="submit" disabled={updateCustomer.isPending}>
                  {updateCustomer.isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
