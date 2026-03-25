'use client';

import { useState } from 'react';
import { AuditTrail } from '@/components/audit/audit-trail';
import { AuditFilterBar, type AuditFilterValues } from './filter-bar';

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilterValues>({
    actorId: '',
    entityType: '',
    dateFrom: '',
    dateTo: '',
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Audyt</h1>

      <AuditFilterBar values={filters} onChange={setFilters} />

      <AuditTrail
        entityType={filters.entityType || undefined}
        actorId={filters.actorId || undefined}
        dateFrom={filters.dateFrom || undefined}
        dateTo={filters.dateTo || undefined}
      />
    </div>
  );
}
