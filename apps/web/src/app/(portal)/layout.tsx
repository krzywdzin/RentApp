import { Metadata } from 'next';
import { PortalHeader } from './portal/components/portal-header';

export const metadata: Metadata = {
  title: 'KITEK - Portal Klienta',
  description: 'Portal klienta wypozyczalni pojazdow',
  referrer: 'no-referrer',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        KITEK - Wynajem Pojazdow
      </footer>
    </div>
  );
}
