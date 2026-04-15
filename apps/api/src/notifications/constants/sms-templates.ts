export function returnReminderSms(params: {
  returnDate: string;
  returnTime: string;
  companyPhone: string;
}): string {
  return `Przypomnienie: zwrot pojazdu ${params.returnDate} do godz. ${params.returnTime}. W celu przedluzenia prosimy o kontakt pod nr ${params.companyPhone}`;
}

export function overdueSms(params: {
  returnDate: string;
  returnTime: string;
  companyPhone: string;
}): string {
  return `PILNE: Termin zwrotu pojazdu minal (${params.returnDate}, ${params.returnTime}). Prosimy o niezwloczny zwrot lub kontakt: ${params.companyPhone}`;
}

export function extensionSms(params: {
  newReturnDate: string;
  newReturnTime: string;
  companyPhone: string;
  totalPriceGross?: number;
  dailyRateNet?: number;
}): string {
  const pricing = params.totalPriceGross != null
    ? ` Nowa cena: ${(params.totalPriceGross / 100).toFixed(2)} PLN brutto${params.dailyRateNet != null ? ` (${(params.dailyRateNet / 100).toFixed(2)} PLN/dzien netto)` : ''}.`
    : '';
  return `Wynajem zostal przedluzony. Nowy termin zwrotu: ${params.newReturnDate} do godz. ${params.newReturnTime}.${pricing} Kontakt: ${params.companyPhone}`;
}

export function rentalCreatedSms(params: {
  vehicleRegistration: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  companyPhone: string;
}): string {
  return `Potwierdzenie wynajmu pojazdu ${params.vehicleRegistration}. Okres: ${params.startDate} ${params.startTime} - ${params.endDate} ${params.endTime}. Kontakt: ${params.companyPhone}`;
}
