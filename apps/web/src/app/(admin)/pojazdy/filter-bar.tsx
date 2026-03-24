'use client';

import { useQueryState } from 'nuqs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VehicleFilterBarProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function VehicleFilterBar({ onSearchChange, onStatusChange }: VehicleFilterBarProps) {
  const [searchParam, setSearchParam] = useQueryState('q', { defaultValue: '' });
  const [statusParam, setStatusParam] = useQueryState('status', { defaultValue: 'ALL' });
  const [localSearch, setLocalSearch] = useState(searchParam);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParam(localSearch || null);
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchParam, onSearchChange]);

  // Sync status
  useEffect(() => {
    onStatusChange(statusParam);
  }, [statusParam, onStatusChange]);

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj po rejestracji lub VIN..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={statusParam} onValueChange={(v) => setStatusParam(v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Wszystkie</SelectItem>
          <SelectItem value="AVAILABLE">Dostepny</SelectItem>
          <SelectItem value="RENTED">Wynajety</SelectItem>
          <SelectItem value="SERVICE">Serwis</SelectItem>
          <SelectItem value="RETIRED">Wycofany</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
