import { format } from 'date-fns';
import { pl } from 'date-fns/locale/pl';

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '-';
  return format(parsed, 'd MMM yyyy', { locale: pl });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '-';
  return format(parsed, 'd MMM yyyy, HH:mm', { locale: pl });
}

export function formatCurrency(grosze: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(grosze / 100);
}
