import { Metadata } from 'next';
import { PortalHeader } from './portal/components/portal-header';

export const metadata: Metadata = {
  title: 'KITEK - Portal Klienta',
  description: 'Portal klienta wypozyczalni pojazdow',
  referrer: 'no-referrer',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF9F3' }}>
      <PortalHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      <footer className="py-6 text-center">
        <p className="font-body text-sm text-warm-gray">{process.env.NEXT_PUBLIC_COMPANY_NAME ?? 'Wynajem Pojazdów'}</p>
      </footer>
    </div>
  );
}
