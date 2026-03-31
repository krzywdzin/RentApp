'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'font-body text-[13px]',
          style: {
            background: '#2C2C2C',
            color: '#FDFAF6',
            borderRadius: '6px',
            border: 'none',
          },
        }}
      />
    </QueryClientProvider>
  );
}
