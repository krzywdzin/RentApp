'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettlementSummary } from '@/hooks/queries/use-rentals';
import { formatCurrency } from '@/lib/format';

export function SettlementSummaryBar() {
  const { data, isLoading } = useSettlementSummary();

  return (
    <Card className="p-4">
      <div className="flex items-center gap-8">
        <div>
          <p className="text-xs text-muted-foreground font-semibold">Nierozliczone wynajmy</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-semibold text-charcoal">{data?.unsettledCount ?? 0}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-semibold">Laczna kwota nierozliczona</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <p className="text-2xl font-semibold text-charcoal">
              {formatCurrency(data?.unsettledAmount ?? 0)}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
