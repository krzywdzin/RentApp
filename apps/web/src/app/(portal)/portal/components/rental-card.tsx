'use client';

import Link from 'next/link';
import type { PortalRentalDto } from '@rentapp/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/format';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Wersja robocza',
  ACTIVE: 'Aktywny',
  EXTENDED: 'Przedluzony',
  RETURNED: 'Zwrócony',
};

interface RentalCardProps {
  rental: PortalRentalDto;
}

export function RentalCard({ rental }: RentalCardProps) {
  const isActive = rental.status === 'ACTIVE' || rental.status === 'EXTENDED';
  return (
    <Link href={`/portal/${rental.id}`}>
      <Card
        className={`bg-card shadow-inner-soft rounded-md border border-sand transition-shadow hover:shadow-md ${
          isActive ? 'border-l-[3px] border-l-forest-green' : ''
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-display font-medium text-base text-charcoal">
                {rental.vehicleMake} {rental.vehicleModel}
              </h3>
              <p className="font-data text-sm text-warm-gray">{rental.vehicleRegistration}</p>
              <p className="font-body text-sm text-warm-gray">
                {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary">{STATUS_LABELS[rental.status] ?? rental.status}</Badge>
              <span className="font-data text-sm font-medium">
                {formatCurrency(rental.totalPriceGross)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
