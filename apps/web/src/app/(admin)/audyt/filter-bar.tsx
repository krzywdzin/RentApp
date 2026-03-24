'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface AuditFilterValues {
  actorId: string;
  entityType: string;
  dateFrom: string;
  dateTo: string;
}

interface FilterBarProps {
  values: AuditFilterValues;
  onChange: (values: AuditFilterValues) => void;
}

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'Wszystkie' },
  { value: 'Vehicle', label: 'Pojazd' },
  { value: 'Customer', label: 'Klient' },
  { value: 'Rental', label: 'Wynajem' },
  { value: 'Contract', label: 'Umowa' },
];

export function AuditFilterBar({ values, onChange }: FilterBarProps) {
  const hasFilters =
    values.actorId !== '' ||
    values.entityType !== '' ||
    values.dateFrom !== '' ||
    values.dateTo !== '';

  function clearFilters() {
    onChange({ actorId: '', entityType: '', dateFrom: '', dateTo: '' });
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Pracownik</label>
        <Input
          placeholder="ID pracownika..."
          value={values.actorId}
          onChange={(e) => onChange({ ...values, actorId: e.target.value })}
          className="h-9 w-48"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Typ</label>
        <Select
          value={values.entityType}
          onValueChange={(val) => onChange({ ...values, entityType: val === 'all' ? '' : val })}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Wszystkie" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Zakres dat</label>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={values.dateFrom}
            onChange={(e) => onChange({ ...values, dateFrom: e.target.value })}
            className="h-9 w-36"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input
            type="date"
            value={values.dateTo}
            onChange={(e) => onChange({ ...values, dateTo: e.target.value })}
            className="h-9 w-36"
          />
        </div>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
          <X className="mr-1 h-4 w-4" />
          Wyczysc filtry
        </Button>
      )}
    </div>
  );
}
