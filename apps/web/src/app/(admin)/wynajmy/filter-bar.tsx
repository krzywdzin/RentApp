'use client';

import { useState } from 'react';
import { RentalStatus } from '@rentapp/shared';
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

interface FilterBarProps {
  statusFilter: RentalStatus | 'ALL';
  onStatusChange: (status: RentalStatus | 'ALL') => void;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  insuranceFilter?: 'ALL' | 'YES' | 'NO';
  onInsuranceChange?: (value: 'ALL' | 'YES' | 'NO') => void;
  insuranceSearch?: string;
  onInsuranceSearchChange?: (value: string) => void;
}

const statusOptions = [
  { value: 'ALL', label: 'Wszystkie' },
  { value: RentalStatus.DRAFT, label: 'Wersja robocza' },
  { value: RentalStatus.ACTIVE, label: 'Aktywny' },
  { value: RentalStatus.EXTENDED, label: 'Przedluzony' },
  { value: RentalStatus.RETURNED, label: 'Zwrócony' },
] as const;

export function RentalFilterBar({
  statusFilter,
  onStatusChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  insuranceFilter = 'ALL',
  onInsuranceChange,
  insuranceSearch = '',
  onInsuranceSearchChange,
}: FilterBarProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as RentalStatus | 'ALL')}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((opt) => (
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
            {dateFrom ? formatDate(dateFrom) : 'Od'}
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
            {dateTo ? formatDate(dateTo) : 'Do'}
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

      {onInsuranceChange && (
        <Select
          value={insuranceFilter}
          onValueChange={(v) => onInsuranceChange(v as 'ALL' | 'YES' | 'NO')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ubezpieczeniowy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Ubezpieczeniowy</SelectItem>
            <SelectItem value="YES">Tak</SelectItem>
            <SelectItem value="NO">Nie</SelectItem>
          </SelectContent>
        </Select>
      )}

      {onInsuranceSearchChange && (
        <Input
          className="w-[200px]"
          placeholder="Szukaj nr sprawy..."
          value={insuranceSearch}
          onChange={(e) => onInsuranceSearchChange(e.target.value)}
        />
      )}

      {(dateFrom ||
        dateTo ||
        statusFilter !== 'ALL' ||
        insuranceFilter !== 'ALL' ||
        insuranceSearch) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onStatusChange('ALL');
            onDateFromChange(undefined);
            onDateToChange(undefined);
            onInsuranceChange?.('ALL');
            onInsuranceSearchChange?.('');
          }}
        >
          <X className="mr-1 h-4 w-4" />
          Wyczysc filtry
        </Button>
      )}
    </div>
  );
}
