import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { Providers } from '@/lib/providers';
import { cn } from '@/lib/utils';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-data',
  display: 'swap',
  weight: ['400', '500'],
});

const satoshi = localFont({
  src: [
    { path: '../../public/fonts/Satoshi-Variable.woff2', style: 'normal' },
    { path: '../../public/fonts/Satoshi-VariableItalic.woff2', style: 'italic' },
  ],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RentApp - Panel Administracyjny',
  description: 'System zarzadzania flota pojazdow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className={cn(fraunces.variable, satoshi.variable, ibmPlexMono.variable, 'font-body')}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
