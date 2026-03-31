'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAudit, type AuditLogEntry } from '@/hooks/queries/use-audit';
import { formatDateTime } from '@/lib/format';

const actionLabels: Record<string, string> = {
  CREATE: 'Utworzenie',
  UPDATE: 'Edycja',
  DELETE: 'Usuniecie',
};

const entityTypeLabels: Record<string, string> = {
  Vehicle: 'Pojazd',
  Customer: 'Klient',
  Rental: 'Wynajem',
  Contract: 'Umowa',
};

const entityTypeRoutes: Record<string, string> = {
  Vehicle: '/pojazdy',
  Customer: '/klienci',
  Rental: '/wynajmy',
  Contract: '/umowy',
};

interface AuditTrailProps {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function AuditTrail({ entityType, entityId, actorId, dateFrom, dateTo }: AuditTrailProps) {
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useAudit({
    entityType,
    entityId,
    actorId,
    dateFrom,
    dateTo,
    limit,
    offset,
  });

  const entries = response?.data ?? [];
  const total = response?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit);

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function goToPage(page: number) {
    setOffset(page * limit);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Data</TableHead>
                <TableHead>Pracownik</TableHead>
                <TableHead>Akcja</TableHead>
                {!entityType && <TableHead>Typ</TableHead>}
                <TableHead>Referencja</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  {!entityType && (
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-lg font-medium">Nie udalo sie zaladowac danych audytu</p>
        <p className="text-sm text-muted-foreground mt-1">
          Wystapil blad podczas pobierania historii zmian.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
          Sprobuj ponownie
        </Button>
      </div>
    );
  }

  if (entries.length === 0 && offset === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-lg font-medium">Brak wpisow audytu</p>
        <p className="text-sm text-muted-foreground mt-1">
          Historia zmian pojawi sie po pierwszych operacjach w systemie.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Data</TableHead>
              <TableHead>Pracownik</TableHead>
              <TableHead>Akcja</TableHead>
              {!entityType && <TableHead>Typ</TableHead>}
              <TableHead>Referencja</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <AuditRow
                key={entry.id}
                entry={entry}
                showEntityType={!entityType}
                isExpanded={expandedRows.has(entry.id)}
                onToggle={() => toggleRow(entry.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Wierszy na strone</p>
          <Select
            value={String(limit)}
            onValueChange={(value) => {
              setLimit(Number(value));
              setOffset(0);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Strona {currentPage + 1} z {pageCount}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 0}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= pageCount - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditRow({
  entry,
  showEntityType,
  isExpanded,
  onToggle,
}: {
  entry: AuditLogEntry;
  showEntityType: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasChanges =
    entry.changesJson !== null &&
    entry.changesJson !== undefined &&
    Object.keys(entry.changesJson).length > 0;

  const colCount = showEntityType ? 6 : 5;
  const route = entityTypeRoutes[entry.entityType];

  return (
    <>
      <TableRow
        className={hasChanges ? 'cursor-pointer hover:bg-muted/50' : undefined}
        onClick={hasChanges ? onToggle : undefined}
      >
        <TableCell className="w-8">
          {hasChanges ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : null}
        </TableCell>
        <TableCell className="text-sm">{formatDateTime(entry.createdAt)}</TableCell>
        <TableCell className="text-sm">
          {entry.actor?.name ?? entry.actor?.email ?? (
            <span className="text-muted-foreground font-mono text-xs">{entry.id.slice(0, 8)}</span>
          )}
        </TableCell>
        <TableCell className="text-sm">{actionLabels[entry.action] ?? entry.action}</TableCell>
        {showEntityType && (
          <TableCell className="text-sm">
            {entityTypeLabels[entry.entityType] ?? entry.entityType}
          </TableCell>
        )}
        <TableCell className="text-sm">
          {route ? (
            <Link
              href={`${route}/${entry.entityId}`}
              className="font-mono text-xs hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {entry.entityId.slice(0, 8)}...
            </Link>
          ) : (
            <span className="font-mono text-xs">{entry.entityId.slice(0, 8)}...</span>
          )}
        </TableCell>
      </TableRow>
      {isExpanded && hasChanges && (
        <TableRow>
          <TableCell colSpan={colCount} className="bg-muted/30 p-4">
            <ChangesTable changes={entry.changesJson!} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function ChangesTable({ changes }: { changes: Record<string, { old: unknown; new: unknown }> }) {
  const entries = Object.entries(changes);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak szczegolowych zmian</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/3">Pole</TableHead>
          <TableHead className="w-1/3">Stara wartosc</TableHead>
          <TableHead className="w-1/3">Nowa wartosc</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map(([field, diff]) => (
          <TableRow key={field}>
            <TableCell className="text-sm font-medium">{field}</TableCell>
            <TableCell className="text-sm">
              <ChangeValue value={diff.old} />
            </TableCell>
            <TableCell className="text-sm">
              <ChangeValue value={diff.new} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ChangeValue({ value }: { value: unknown }) {
  if (value === '[ENCRYPTED]') {
    return <span className="italic text-muted-foreground">[ZASZYFROWANE]</span>;
  }
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }
  if (typeof value === 'object') {
    return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
  }
  return <span>{String(value)}</span>;
}
