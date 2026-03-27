import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { VehiclesPage } from '../vehicles-page';

// Mock hooks
const mockUseVehicles = vi.fn();
const mockUseArchiveVehicle = vi.fn();
const mockUseBulkUpdateVehicles = vi.fn();

vi.mock('@/hooks/queries/use-vehicles', () => ({
  useVehicles: (...args: unknown[]) => mockUseVehicles(...args),
  useArchiveVehicle: (...args: unknown[]) => mockUseArchiveVehicle(...args),
  useBulkUpdateVehicles: (...args: unknown[]) => mockUseBulkUpdateVehicles(...args),
}));

// Mock @rentapp/shared
vi.mock('@rentapp/shared', () => ({}));

// Mock sub-components
vi.mock('../columns', () => ({
  getVehicleColumns: () => [
    {
      id: 'registration',
      accessorKey: 'registration',
      header: 'Rejestracja',
      cell: ({ getValue }: { getValue: () => string }) => getValue(),
    },
    {
      id: 'make',
      accessorKey: 'make',
      header: 'Marka',
      cell: ({ getValue }: { getValue: () => string }) => getValue(),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }: { getValue: () => string }) => getValue(),
    },
  ],
}));

vi.mock('../filter-bar', () => ({
  VehicleFilterBar: (_props: Record<string, unknown>) => (
    <div data-testid="vehicle-filter-bar">Filters</div>
  ),
}));

vi.mock('@/lib/csv-export', () => ({
  exportToCsv: vi.fn(),
}));

describe('VehiclesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseArchiveVehicle.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseBulkUpdateVehicles.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('renders loading state with skeletons', () => {
    mockUseVehicles.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<VehiclesPage />);

    expect(screen.getByText('Pojazdy')).toBeInTheDocument();
    // Should show skeleton rows
    const skeletons = document.querySelectorAll('.h-5');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders vehicle table with data', () => {
    mockUseVehicles.mockReturnValue({
      data: [
        {
          id: 'v1',
          registration: 'WA12345',
          vin: '1234567890',
          make: 'Toyota',
          model: 'Corolla',
          status: 'AVAILABLE',
          year: 2024,
          mileage: 10000,
        },
        {
          id: 'v2',
          registration: 'KR99999',
          vin: '0987654321',
          make: 'Honda',
          model: 'Civic',
          status: 'RENTED',
          year: 2023,
          mileage: 25000,
        },
      ],
      isLoading: false,
    });

    render(<VehiclesPage />);

    expect(screen.getByText('Pojazdy')).toBeInTheDocument();
    expect(screen.getByText('WA12345')).toBeInTheDocument();
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('KR99999')).toBeInTheDocument();
    expect(screen.getByText('Honda')).toBeInTheDocument();
  });

  it('renders empty state when no vehicles', () => {
    mockUseVehicles.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<VehiclesPage />);

    expect(screen.getByText('Brak pojazdow')).toBeInTheDocument();
  });
});
