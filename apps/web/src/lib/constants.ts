export const vehicleStatusConfig: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'secondary' }
> = {
  AVAILABLE: { label: 'Dostepny', variant: 'success' },
  RENTED: { label: 'Wynajety', variant: 'warning' },
  SERVICE: { label: 'Serwis', variant: 'secondary' },
  RETIRED: { label: 'Wycofany', variant: 'secondary' },
  RESERVED: { label: 'Zarezerwowany', variant: 'warning' },
};

export const fuelTypeOptions = [
  { value: 'PETROL', label: 'Benzyna' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'LPG', label: 'LPG' },
  { value: 'HYBRID', label: 'Hybrydowy' },
  { value: 'ELECTRIC', label: 'Elektryczny' },
] as const;

export const transmissionOptions = [
  { value: 'MANUAL', label: 'Manualna' },
  { value: 'AUTOMATIC', label: 'Automatyczna' },
] as const;

export const fuelTypeLabels: Record<string, string> = {
  PETROL: 'Benzyna',
  DIESEL: 'Diesel',
  LPG: 'LPG',
  HYBRID: 'Hybrydowy',
  ELECTRIC: 'Elektryczny',
};

export const transmissionLabels: Record<string, string> = {
  MANUAL: 'Manualna',
  AUTOMATIC: 'Automatyczna',
};
