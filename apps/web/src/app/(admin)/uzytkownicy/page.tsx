'use client';

import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const createUserSchema = z.object({
  email: z.string().email('Nieprawidlowy adres email'),
  name: z.string().min(2, 'Imie musi miec co najmniej 2 znaki'),
  role: z.enum(['ADMIN', 'EMPLOYEE'], { required_error: 'Wybierz role' }),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UzytkownicyPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = createUserSchema.safeParse({ email, name, role: role || undefined });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CreateUserForm, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CreateUserForm;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Nie udalo sie utworzyc uzytkownika');
      }

      toast.success('Uzytkownik utworzony. Email z linkiem do ustawienia hasla zostal wyslany.');
      setEmail('');
      setName('');
      setRole('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Wystapil blad');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Zarzadzanie uzytkownikami</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Nowy uzytkownik</CardTitle>
          <CardDescription>
            Utworz konto pracownika. Nowy uzytkownik otrzyma email z linkiem do ustawienia hasla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jan@firma.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Imie i nazwisko</Label>
              <Input
                id="name"
                placeholder="Jan Kowalski"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rola</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Wybierz role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="EMPLOYEE">Pracownik</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role}</p>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Tworzenie...' : 'Utworz uzytkownika'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
