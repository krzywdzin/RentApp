'use client';

import { useState } from 'react';
import type {
  DamageComparisonResult,
  DamagePin,
  SeverityLevel,
  DamageType,
  SvgView,
} from '@rentapp/shared';
import { DAMAGE_TYPE_LABELS } from '@rentapp/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DamagePinList } from './damage-pin-list';

const SVG_VIEW_TABS: { value: SvgView; label: string }[] = [
  { value: 'top', label: 'Gora' },
  { value: 'front', label: 'Przod' },
  { value: 'rear', label: 'Tyl' },
  { value: 'left', label: 'Lewa' },
  { value: 'right', label: 'Prawa' },
];

const SEVERITY_PIN_COLORS: Record<SeverityLevel, string> = {
  minor: '#f59e0b', // amber-500
  moderate: '#f97316', // orange-500
  severe: '#ef4444', // red-500
};

const PRE_EXISTING_COLOR = '#71717a'; // zinc-500

interface DamageComparisonProps {
  data: DamageComparisonResult | undefined;
}

export function DamageComparison({ data }: DamageComparisonProps) {
  const [activeSvgView, setActiveSvgView] = useState<SvgView>('top');

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Brak danych uszkodzen.
        </CardContent>
      </Card>
    );
  }

  const handoverFiltered = data.handoverPins.filter((p) => p.svgView === activeSvgView);
  const returnFiltered = data.returnPins.filter((p) => p.svgView === activeSvgView);
  const newPinNumbers = new Set(data.newPins.map((p) => p.pinNumber));

  return (
    <div className="space-y-4">
      {/* SVG view tabs */}
      <Tabs value={activeSvgView} onValueChange={(v) => setActiveSvgView(v as SvgView)}>
        <TabsList>
          {SVG_VIEW_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SVG_VIEW_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {/* Column headers */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="text-center text-sm font-medium text-muted-foreground">
                Stan przy wydaniu
              </div>
              <div className="text-center text-sm font-medium text-muted-foreground">
                Stan przy zwrocie
              </div>
            </div>

            {/* SVG diagrams side by side */}
            <div className="grid grid-cols-2 gap-2">
              {/* Handover diagram */}
              <Card>
                <CardContent className="p-4">
                  <DamageDiagram
                    pins={handoverFiltered}
                    allPreExisting={false}
                    newPinNumbers={new Set()}
                  />
                  {handoverFiltered.length > 0 && (
                    <Badge variant="secondary" className="mt-2">
                      {handoverFiltered.length} uszkodzen
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Return diagram */}
              <Card>
                <CardContent className="p-4">
                  <DamageDiagram
                    pins={returnFiltered}
                    allPreExisting={false}
                    newPinNumbers={newPinNumbers}
                  />
                  {returnFiltered.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      <Badge variant="secondary">{returnFiltered.length} uszkodzen</Badge>
                      {returnFiltered.filter((p) => newPinNumbers.has(p.pinNumber)).length > 0 && (
                        <Badge variant="destructive">
                          {returnFiltered.filter((p) => newPinNumbers.has(p.pinNumber)).length} Nowe
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Pin lists */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Lista uszkodzen - Wydanie</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <DamagePinList pins={data.handoverPins} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Lista uszkodzen - Zwrot</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <DamagePinList pins={data.returnPins} showNewBadge newPinNumbers={newPinNumbers} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * SVG diagram with car outline and damage pin overlays.
 * Pins are positioned using percentage coordinates (0-100) scaled to SVG viewBox (0-1000).
 */
function DamageDiagram({
  pins,
  allPreExisting,
  newPinNumbers,
}: {
  pins: DamagePin[];
  allPreExisting: boolean;
  newPinNumbers: Set<number>;
}) {
  return (
    <TooltipProvider>
      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto border border-border rounded-md bg-card"
        role="img"
        aria-label="Diagram uszkodzen pojazdu"
      >
        {/* Simple car outline - stroke only, zinc-400 */}
        <rect
          x="150"
          y="100"
          width="700"
          height="400"
          rx="60"
          ry="60"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-zinc-400"
        />
        {/* Windshield */}
        <line
          x1="300"
          y1="100"
          x2="300"
          y2="500"
          stroke="currentColor"
          strokeWidth="1"
          className="text-zinc-400"
          strokeDasharray="4 4"
        />
        <line
          x1="700"
          y1="100"
          x2="700"
          y2="500"
          stroke="currentColor"
          strokeWidth="1"
          className="text-zinc-400"
          strokeDasharray="4 4"
        />
        {/* Center line */}
        <line
          x1="150"
          y1="300"
          x2="850"
          y2="300"
          stroke="currentColor"
          strokeWidth="1"
          className="text-zinc-400"
          strokeDasharray="4 4"
        />

        {/* Damage pins */}
        {pins.map((pin) => {
          const cx = pin.x * 10;
          const cy = pin.y * 6; // Scale to 600 height
          const isNew = newPinNumbers.has(pin.pinNumber);
          const isPreExisting = pin.isPreExisting || (allPreExisting && !isNew);
          const fillColor = isPreExisting
            ? PRE_EXISTING_COLOR
            : (SEVERITY_PIN_COLORS[pin.severity as SeverityLevel] ?? '#ef4444');
          const strokeDash = isPreExisting ? '4 2' : 'none';

          const label = DAMAGE_TYPE_LABELS[pin.damageType as DamageType] ?? pin.damageType;
          const tooltipText = `${label} - ${pin.severity}${pin.note ? `: ${pin.note}` : ''}`;

          return (
            <Tooltip key={pin.pinNumber}>
              <TooltipTrigger asChild>
                <g
                  className="cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={tooltipText}
                  focusable="true"
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={16}
                    fill={fillColor}
                    stroke="white"
                    strokeWidth={2}
                    strokeDasharray={strokeDash}
                    opacity={0.9}
                  />
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {pin.pinNumber}
                  </text>
                </g>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </svg>
    </TooltipProvider>
  );
}
