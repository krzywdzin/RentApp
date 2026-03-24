'use client';

import { useQueryState } from 'nuqs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CustomerFilterBarProps {
  onSearchChange: (value: string) => void;
}

export function CustomerFilterBar({ onSearchChange }: CustomerFilterBarProps) {
  const [searchParam, setSearchParam] = useQueryState('q', { defaultValue: '' });
  const [localSearch, setLocalSearch] = useState(searchParam);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParam(localSearch || null);
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchParam, onSearchChange]);

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj po nazwisku lub telefonie..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
