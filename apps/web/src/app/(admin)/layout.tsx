'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden bg-cream">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto p-6 bg-cream">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
