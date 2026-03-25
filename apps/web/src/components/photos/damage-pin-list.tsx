'use client';

import type { DamagePin, DamageType, SeverityLevel } from '@rentapp/shared';
import { DAMAGE_TYPE_LABELS, SEVERITY_LABELS } from '@rentapp/shared';
import { Badge } from '@/components/ui/badge';

const SVG_VIEW_LABELS: Record<string, string> = {
  top: 'Gora',
  front: 'Przod',
  rear: 'Tyl',
  left: 'Lewa',
  right: 'Prawa',
};

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  minor: 'border-amber-500 text-amber-500',
  moderate: 'border-orange-500 text-orange-500',
  severe: '',
};

interface DamagePinListProps {
  pins: DamagePin[];
  showNewBadge?: boolean;
  newPinNumbers?: Set<number>;
}

export function DamagePinList({ pins, showNewBadge, newPinNumbers }: DamagePinListProps) {
  if (pins.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">Brak uszkodzen</p>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">
        Lista uszkodzen{' '}
        <span className="font-normal text-muted-foreground">({pins.length} uszkodzen)</span>
      </h4>
      <div className="space-y-1">
        {pins.map((pin) => {
          const isNew = newPinNumbers?.has(pin.pinNumber);

          return (
            <div
              key={`${pin.svgView}-${pin.pinNumber}`}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="font-mono text-xs text-muted-foreground w-6">#{pin.pinNumber}</span>
              <span className="text-xs text-muted-foreground w-12">
                {SVG_VIEW_LABELS[pin.svgView] ?? pin.svgView}
              </span>
              <span className="flex-1">
                {DAMAGE_TYPE_LABELS[pin.damageType as DamageType] ?? pin.damageType}
              </span>
              <SeverityBadge severity={pin.severity} />
              {showNewBadge &&
                (isNew ? (
                  <Badge variant="destructive">Nowe</Badge>
                ) : (
                  <Badge variant="secondary">Istniejace</Badge>
                ))}
              {pin.note && (
                <span
                  className="text-xs text-muted-foreground truncate max-w-[150px]"
                  title={pin.note}
                >
                  {pin.note}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const label = SEVERITY_LABELS[severity as SeverityLevel] ?? severity;

  if (severity === 'severe') {
    return <Badge variant="destructive">{label}</Badge>;
  }

  const colorClass = SEVERITY_COLORS[severity as SeverityLevel] ?? '';
  return (
    <Badge variant="outline" className={colorClass}>
      {label}
    </Badge>
  );
}
