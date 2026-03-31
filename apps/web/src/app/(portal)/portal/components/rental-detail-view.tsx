'use client';

import type { PortalRentalDto } from '@rentapp/shared';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/format';
import { FileDown } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Wersja robocza',
  ACTIVE: 'Aktywny',
  EXTENDED: 'Przedluzony',
  RETURNED: 'Zwrócony',
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
    <div className="space-y-10">
      {/* Vehicle */}
      <Card className="bg-card shadow-inner-soft border border-sand rounded-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-2xl text-charcoal">
                {rental.vehicleMake} {rental.vehicleModel}
              </h2>
              <p className="font-data text-lg text-warm-gray">{rental.vehicleRegistration}</p>
            </div>
            <Badge variant="secondary">{STATUS_LABELS[rental.status] ?? rental.status}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Dates */}
      <Card className="bg-card shadow-inner-soft border border-sand rounded-md">
        <CardHeader className="pb-0">
          <h3 className="font-display font-medium text-base text-charcoal">Okres wynajmu</h3>
          <div className="w-10 h-px bg-sand mt-1 mb-4" />
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="font-body text-warm-gray">Od:</span>{' '}
            <span className="font-data font-medium">{formatDate(rental.startDate)}</span>
          </p>
          <p>
            <span className="font-body text-warm-gray">Do:</span>{' '}
            <span className="font-data font-medium">{formatDate(rental.endDate)}</span>
          </p>
          <p>
            <span className="font-body text-warm-gray">Czas trwania:</span>{' '}
            <span className="font-body font-medium text-warm-gray">{duration} dni</span>
          </p>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="bg-card shadow-inner-soft border border-sand rounded-md">
        <CardHeader className="pb-0">
          <h3 className="font-display font-medium text-base text-charcoal">Cennik</h3>
          <div className="w-10 h-px bg-sand mt-1 mb-4" />
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="flex justify-between">
            <span className="font-body text-warm-gray">Stawka dzienna netto:</span>
            <span className="font-data">{formatCurrency(rental.dailyRateNet)}</span>
          </p>
          <p className="flex justify-between">
            <span className="font-body text-warm-gray">Suma netto:</span>
            <span className="font-data">{formatCurrency(rental.totalPriceNet)}</span>
          </p>
          <p className="flex justify-between">
            <span className="font-body text-warm-gray">VAT ({rental.vatRate}%):</span>
            <span className="font-data">
              {formatCurrency(rental.totalPriceGross - rental.totalPriceNet)}
            </span>
          </p>
          <p className="flex justify-between pt-1">
            <span className="font-body text-warm-gray">Suma brutto:</span>
            <span className="font-display font-medium text-forest-green text-lg">
              {formatCurrency(rental.totalPriceGross)}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Contract */}
      {rental.contractNumber && (
        <Card className="bg-card shadow-inner-soft border border-sand rounded-md">
          <CardHeader className="pb-0">
            <h3 className="font-display font-medium text-base text-charcoal">Umowa</h3>
            <div className="w-10 h-px bg-sand mt-1 mb-4" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="font-body text-warm-gray">Umowa nr</span>{' '}
              <span className="font-data font-medium">{rental.contractNumber}</span>
            </p>
            {rental.contractPdfUrl && (
              <a
                href={rental.contractPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest-green font-body hover:underline flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                Pobierz PDF umowy
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Return inspection */}
      {rental.status === 'RETURNED' && (
        <Card className="bg-card shadow-inner-soft border border-sand rounded-md">
          <CardHeader className="pb-0">
            <h3 className="font-display font-medium text-base text-charcoal">Zwrot pojazdu</h3>
            <div className="w-10 h-px bg-sand mt-1 mb-4" />
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {rental.returnMileage != null && (
              <p>
                <span className="font-body text-warm-gray">Przebieg przy zwrocie:</span>{' '}
                <span className="font-data font-medium">
                  {rental.returnMileage.toLocaleString('pl-PL')} km
                </span>
              </p>
            )}
            {rental.returnData && (
              <>
                {rental.returnData.fuelLevel != null && (
                  <p>
                    <span className="font-body text-warm-gray">Poziom paliwa:</span>{' '}
                    <span className="font-data font-medium">{rental.returnData.fuelLevel}%</span>
                  </p>
                )}
                {rental.returnData.cleanliness && (
                  <p>
                    <span className="font-body text-warm-gray">Czystosc:</span>{' '}
                    <span className="font-body font-medium">{rental.returnData.cleanliness}</span>
                  </p>
                )}
                {rental.returnData.notes && (
                  <p>
                    <span className="font-body text-warm-gray">Uwagi:</span>{' '}
                    <span className="font-body font-medium">{rental.returnData.notes}</span>
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
