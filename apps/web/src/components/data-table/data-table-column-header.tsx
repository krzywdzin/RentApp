'use client';

import { type Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <div
        className={cn(
          'font-body font-medium text-xs uppercase tracking-wider text-warm-gray',
          className,
        )}
      >
        {title}
      </div>
    );
  }

  const isSorted = column.getIsSorted();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 font-body font-medium text-xs uppercase tracking-wider text-warm-gray hover:text-charcoal data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <span className={cn(isSorted ? 'text-charcoal' : 'text-warm-gray')}>{title}</span>
        {isSorted === 'desc' ? (
          <ArrowDown className="ml-1 h-3.5 w-3.5 text-charcoal" />
        ) : isSorted === 'asc' ? (
          <ArrowUp className="ml-1 h-3.5 w-3.5 text-charcoal" />
        ) : (
          <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-warm-gray/30" />
        )}
      </Button>
    </div>
  );
}
