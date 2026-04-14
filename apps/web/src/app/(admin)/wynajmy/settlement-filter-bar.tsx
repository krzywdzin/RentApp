'use client';

import { useState } from 'react';
import { SettlementStatus } from '@rentapp/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, X } from 'lucide-react';
import { formatDate } from '@/lib/format';

interface SettlementFilterBarProps {
  settlementStatus: SettlementStatus | 'ALL';
  onSettlementStatusChange: (v: SettlementStatus | 'ALL') => void;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (v: Date | undefined) => void;
  onDateToChange: (v: Date | undefined) => void;
  customerSearch: string;
  onCustomerSearchChange: (v: string) => void;
  vehicleSearch: string;
  onVehicleSearchChange: (v: string) => void;
}

const settlementStatusOptions = [
  { value: 'ALL', label: 'Wszystkie' },
  { value: SettlementStatus.NIEROZLICZONY, label: 'Nierozliczony' },
  { value: SettlementStatus.CZESCIOWO_ROZLICZONY, label: 'Czesciowo rozliczony' },
  { value: SettlementStatus.ROZLICZONY, label: 'Rozliczony' },
  { value: SettlementStatus.ANULOWANY, label: 'Anulowany' },
] as const;

export function SettlementFilterBar({
  settlementStatus,
  onSettlementStatusChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  customerSearch,
  onCustomerSearchChange,
  vehicleSearch,
  onVehicleSearchChange,
}: SettlementFilterBarProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const hasFilters =
    settlementStatus !== 'ALL' || dateFrom || dateTo || customerSearch || vehicleSearch;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <Select
        value={settlementStatus}
        onValueChange={(v) => onSettlementStatusChange(v as SettlementStatus | 'ALL')}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Status rozliczenia" />
        </SelectTrigger>
        <SelectContent>
          {settlementStatusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={fromOpen} onOpenChange={setFromOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateFrom ? formatDate(dateFrom) : 'Data od'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateFrom}
            onSelect={(d) => {
              onDateFromChange(d ?? undefined);
              setFromOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <Popover open={toOpen} onOpenChange={setToOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateTo ? formatDate(dateTo) : 'Data do'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateTo}
            onSelect={(d) => {
              onDateToChange(d ?? undefined);
              setToOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <Input
        className="w-[200px]"
        placeholder="Szukaj klienta..."
        value={customerSearch}
        onChange={(e) => onCustomerSearchChange(e.target.value)}
      />

      <Input
        className="w-[180px]"
        placeholder="Nr rejestracyjny..."
        value={vehicleSearch}
        onChange={(e) => onVehicleSearchChange(e.target.value)}
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSettlementStatusChange('ALL');
            onDateFromChange(undefined);
            onDateToChange(undefined);
            onCustomerSearchChange('');
            onVehicleSearchChange('');
          }}
        >
          <X className="mr-1 h-4 w-4" />
          Wyczysc filtry
        </Button>
      )}
    </div>
  );
}
