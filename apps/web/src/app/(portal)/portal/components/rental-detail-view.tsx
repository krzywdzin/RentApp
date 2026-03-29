'use client';

import type { PortalRentalDto } from '@rentapp/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/format';
import { FileDown } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Wersja robocza',
  ACTIVE: 'Aktywny',
  EXTENDED: 'Przedluzony',
  RETURNED: 'Zwrócony',
};

const STATUS_VARIANTS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  EXTENDED: 'bg-yellow-100 text-yellow-700',
  RETURNED: 'bg-blue-100 text-blue-700',
};

interface RentalDetailViewProps {
  rental: PortalRentalDto;
}

function getDurationDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function RentalDetailView({ rental }: RentalDetailViewProps) {
  const duration = getDurationDays(rental.startDate, rental.endDate);

  return (
    <div className="space-y-4">
      {/* Vehicle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Pojazd</CardTitle>
            <Badge className={STATUS_VARIANTS[rental.status] ?? 'bg-gray-100 text-gray-700'}>
              {STATUS_LABELS[rental.status] ?? rental.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Marka i model:</span>{' '}
            <span className="font-medium">
              {rental.vehicleMake} {rental.vehicleModel}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Rejestracja:</span>{' '}
            <span className="font-medium">{rental.vehicleRegistration}</span>
          </p>
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Okres wynajmu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Od:</span>{' '}
            <span className="font-medium">{formatDate(rental.startDate)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Do:</span>{' '}
            <span className="font-medium">{formatDate(rental.endDate)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Czas trwania:</span>{' '}
            <span className="font-medium">{duration} dni</span>
          </p>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Cennik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Stawka dzienna netto:</span>{' '}
            <span className="font-medium">{formatCurrency(rental.dailyRateNet)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Suma netto:</span>{' '}
            <span className="font-medium">{formatCurrency(rental.totalPriceNet)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">VAT ({rental.vatRate}%):</span>{' '}
            <span className="font-medium">
              {formatCurrency(rental.totalPriceGross - rental.totalPriceNet)}
            </span>
          </p>
          <p className="pt-1 text-base">
            <span className="text-muted-foreground">Suma brutto:</span>{' '}
            <span className="font-bold">{formatCurrency(rental.totalPriceGross)}</span>
          </p>
        </CardContent>
      </Card>

      {/* Contract */}
      {rental.contractNumber && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Umowa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Umowa nr</span>{' '}
              <span className="font-medium">{rental.contractNumber}</span>
            </p>
            {rental.contractPdfUrl && (
              <a href={rental.contractPdfUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Pobierz PDF umowy
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Return inspection */}
      {rental.status === 'RETURNED' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Zwrot pojazdu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {rental.returnMileage != null && (
              <p>
                <span className="text-muted-foreground">Przebieg przy zwrocie:</span>{' '}
                <span className="font-medium">
                  {rental.returnMileage.toLocaleString('pl-PL')} km
                </span>
              </p>
            )}
            {rental.returnData && (
              <>
                {rental.returnData.fuelLevel != null && (
                  <p>
                    <span className="text-muted-foreground">Poziom paliwa:</span>{' '}
                    <span className="font-medium">{rental.returnData.fuelLevel}%</span>
                  </p>
                )}
                {rental.returnData.cleanliness && (
                  <p>
                    <span className="text-muted-foreground">Czystosc:</span>{' '}
                    <span className="font-medium">{rental.returnData.cleanliness}</span>
                  </p>
                )}
                {rental.returnData.notes && (
                  <p>
                    <span className="text-muted-foreground">Uwagi:</span>{' '}
                    <span className="font-medium">{rental.returnData.notes}</span>
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
