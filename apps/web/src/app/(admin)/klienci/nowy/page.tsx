'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateCustomerSchema, type CreateCustomerInput } from '@rentapp/shared';
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
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { useCreateCustomer } from '@/hooks/queries/use-customers';

export default function NewCustomerPage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();

  const form = useForm({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      pesel: '',
      idNumber: '',
      licenseNumber: '',
      idIssuedBy: '',
      idIssuedDate: '',
      licenseCategory: '',
      licenseIssuedBy: '',
    },
  });

  function onSubmit(data: CreateCustomerInput) {
    // Clean up empty optional fields - replace empty strings with null for optional fields
    const cleaned = { ...data } as Record<string, unknown>;
    for (const [key, value] of Object.entries(cleaned)) {
      if (value === '' || value === null || value === undefined) {
        cleaned[key] = null;
      }
    }
    // Convert date fields from "YYYY-MM-DD" to ISO datetime string
    const dateFields = ['idIssuedDate', 'idExpiryDate', 'dateOfBirth', 'birthDate'];
    for (const field of dateFields) {
      if (cleaned[field] && typeof cleaned[field] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(cleaned[field] as string)) {
        cleaned[field] = new Date(cleaned[field] as string).toISOString();
      }
    }
    createCustomer.mutate(cleaned as CreateCustomerInput, {
      onSuccess: () => router.push('/klienci'),
    });
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Klienci', href: '/klienci' }, { label: 'Nowy klient' }]} />

      <h1 className="font-display font-semibold text-2xl text-charcoal">Nowy klient</h1>

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
                        <Input placeholder="np. Jan" {...field} />
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
                        <Input placeholder="np. Kowalski" {...field} />
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
                        <Input placeholder="np. +48 123 456 789" {...field} />
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
                        <Input
                          type="email"
                          placeholder="np. jan@przyklad.pl"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Adres</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="np. ul. Przykladowa 1, 00-001 Warszawa"
                          {...field}
                          value={field.value ?? ''}
                        />
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
                        <Input placeholder="11 cyfr" maxLength={11} {...field} />
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
                        <Input placeholder="np. ABC 123456" {...field} />
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
                        <Input {...field} />
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
                        <Input placeholder="np. B" {...field} value={field.value ?? ''} />
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
                <Button type="button" variant="outline" onClick={() => router.push('/klienci')}>
                  Anuluj
                </Button>
                <Button type="submit" disabled={createCustomer.isPending}>
                  {createCustomer.isPending ? 'Dodawanie...' : 'Dodaj klienta'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
