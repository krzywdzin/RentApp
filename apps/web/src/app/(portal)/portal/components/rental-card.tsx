'use client';

import Link from 'next/link';
import type { PortalRentalDto } from '@rentapp/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/format';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Szkic',
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

interface RentalCardProps {
  rental: PortalRentalDto;
}

export function RentalCard({ rental }: RentalCardProps) {
  return (
    <Link href={`/portal/${rental.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-semibold">
                {rental.vehicleMake} {rental.vehicleModel}
              </h3>
              <p className="text-sm text-muted-foreground">{rental.vehicleRegistration}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={STATUS_VARIANTS[rental.status] ?? 'bg-gray-100 text-gray-700'}>
                {STATUS_LABELS[rental.status] ?? rental.status}
              </Badge>
              <span className="text-sm font-medium">{formatCurrency(rental.totalPriceGross)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
