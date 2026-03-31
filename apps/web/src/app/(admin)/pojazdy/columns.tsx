'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { VehicleDto } from '@rentapp/shared';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { vehicleStatusConfig } from '@/lib/constants';

export function getVehicleColumns({
  onDetail,
  onEdit,
  onDelete,
  onArchive,
}: {
  onDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (vehicle: VehicleDto) => void;
  onArchive?: (vehicle: VehicleDto) => void;
}): ColumnDef<VehicleDto, unknown>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Zaznacz wszystkie"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Zaznacz wiersz"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'registration',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rejestracja" />,
      cell: ({ row }) => <span className="font-data uppercase font-medium">{row.getValue('registration')}</span>,
    },
    {
      id: 'makeModel',
      accessorFn: (row) => `${row.make} ${row.model}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Marka / Model" />,
    },
    {
      accessorKey: 'year',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rok" />,
    },
    {
      accessorKey: 'mileage',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Przebieg" />,
      cell: ({ row }) => {
        const mileage = row.getValue('mileage') as number;
        return <span className="font-data text-sm">{mileage.toLocaleString('pl-PL')} km</span>;
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const config = vehicleStatusConfig[status] ?? {
          label: status,
          variant: 'secondary' as const,
        };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDetail(vehicle.id)}>Szczegoly</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(vehicle.id)}>Edytuj</DropdownMenuItem>
              <DropdownMenuSeparator />
              {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(vehicle)}>
                  Archiwizuj
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(vehicle)}>
                Usun trwale
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}

export function getArchivedVehicleColumns({
  onUnarchive,
  onHardDelete,
}: {
  onUnarchive: (vehicle: VehicleDto) => void;
  onHardDelete: (vehicle: VehicleDto) => void;
}): ColumnDef<VehicleDto, unknown>[] {
  return [
    {
      accessorKey: 'registration',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rejestracja" />,
      cell: ({ row }) => <span className="font-data uppercase font-medium">{row.getValue('registration')}</span>,
    },
    {
      id: 'makeModel',
      accessorFn: (row) => `${row.make} ${row.model}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Marka / Model" />,
    },
    {
      accessorKey: 'year',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rok" />,
    },
    {
      accessorKey: 'mileage',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Przebieg" />,
      cell: ({ row }) => {
        const mileage = row.getValue('mileage') as number;
        return <span className="font-data text-sm">{mileage.toLocaleString('pl-PL')} km</span>;
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const config = vehicleStatusConfig[status] ?? {
          label: status,
          variant: 'secondary' as const,
        };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUnarchive(vehicle)}>
                Przywroc
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onHardDelete(vehicle)}>
                Usun trwale
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}
