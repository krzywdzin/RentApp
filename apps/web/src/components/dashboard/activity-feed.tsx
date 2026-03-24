'use client';

import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale/pl';
import { useAudit, type AuditLogEntry } from '@/hooks/queries/use-audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const actionLabels: Record<string, string> = {
  CREATE: 'Utworzono',
  UPDATE: 'Zaktualizowano',
  DELETE: 'Usunieto',
};

const entityLabels: Record<string, string> = {
  Vehicle: 'pojazd',
  Rental: 'wynajem',
  Customer: 'klienta',
  Contract: 'umowe',
  User: 'uzytkownika',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatAction(entry: AuditLogEntry): string {
  const action = actionLabels[entry.action] ?? entry.action;
  const entity = entityLabels[entry.entityType] ?? entry.entityType;
  return `${action} ${entity}`;
}

export function ActivityFeed() {
  const { data, isLoading } = useAudit({ limit: 5, offset: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ostatnia aktywnosc</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.data.length ? (
          <p className="text-sm text-muted-foreground">Brak aktywnosci</p>
        ) : (
          <div className="space-y-4">
            {data.data.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {entry.actor ? getInitials(entry.actor.name) : 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{entry.actor?.name ?? 'System'}</span>{' '}
                    {formatAction(entry)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{entry.entityId.slice(0, 8)}</span>
                    <span>
                      {formatDistanceToNow(new Date(entry.createdAt), {
                        addSuffix: true,
                        locale: pl,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
