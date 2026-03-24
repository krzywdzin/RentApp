/**
 * Format date as dd.MM.yyyy (Polish convention)
 */
export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format date as dd.MM.yyyy HH:mm (Polish convention)
 */
export function formatDateTime(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Format amount as PLN currency (e.g., "1 234,56 PLN")
 */
export function formatCurrency(amountGrosze: number): string {
  const zloty = amountGrosze / 100;
  return `${zloty.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} PLN`;
}

/**
 * Format net amount in grosze to gross with 23% VAT
 */
export function formatGross(netGrosze: number, vatRate = 23): string {
  const gross = netGrosze * (1 + vatRate / 100);
  return formatCurrency(Math.round(gross));
}

/**
 * Format mileage (e.g., "12 345 km")
 */
export function formatMileage(km: number): string {
  return `${km.toLocaleString('pl-PL')} km`;
}
