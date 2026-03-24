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
}): string {
  return `Wynajem zostal przedluzony. Nowy termin zwrotu: ${params.newReturnDate} do godz. ${params.newReturnTime}. Kontakt: ${params.companyPhone}`;
}
