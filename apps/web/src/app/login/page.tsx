'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(res.status, data);
      }

      router.push('/');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast.error('Nieprawidlowa nazwa uzytkownika lub haslo');
      } else {
        toast.error('Wystapil blad serwera. Sprobuj ponownie za chwile.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="font-display font-semibold text-4xl text-forest-green mb-1">KITEK</h1>
      <p className="font-body text-sm text-warm-gray mb-6">Wynajem Pojazdów</p>
      <div className="bg-card shadow-inner-soft rounded-md border border-sand border-t-2 border-t-forest-green max-w-sm w-full p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nazwa uzytkownika</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="admin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Haslo</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Logowanie...' : 'Zaloguj sie'}
          </Button>
        </form>
      </div>
    </div>
  );
}
