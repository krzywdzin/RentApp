import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import RentalsPage from '../page';

// Mock hooks
const mockUseRentals = vi.fn();

vi.mock('@/hooks/queries/use-rentals', () => ({
  useRentals: (...args: unknown[]) => mockUseRentals(...args),
}));

// Mock @rentapp/shared enums
vi.mock('@rentapp/shared', () => ({
  RentalStatus: {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    EXTENDED: 'EXTENDED',
    RETURNED: 'RETURNED',
  },
}));

// Mock sub-components that have complex dependencies
vi.mock('../columns', () => ({
  rentalColumns: [
    {
      id: 'customer',
      accessorFn: (row: Record<string, unknown>) => {
        const customer = row.customer as Record<string, string> | undefined;
        return customer ? `${customer.firstName} ${customer.lastName}` : '';
      },
      header: 'Klient',
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
  RentalFilterBar: () => <div data-testid="rental-filter-bar">Filters</div>,
}));

vi.mock('../calendar-view', () => ({
  CalendarView: () => <div data-testid="calendar-view">Calendar</div>,
}));

describe('RentalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseRentals.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<RentalsPage />);

    expect(screen.getByText('Wynajmy')).toBeInTheDocument();
  });

  it('renders rental list with data', () => {
    mockUseRentals.mockReturnValue({
      data: [
        {
          id: 'r1',
          status: 'ACTIVE',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          customer: { firstName: 'Jan', lastName: 'Kowalski' },
          vehicle: { registration: 'ABC123', make: 'Toyota', model: 'Corolla' },
        },
        {
          id: 'r2',
          status: 'DRAFT',
          startDate: '2026-02-01',
          endDate: '2026-06-30',
          customer: { firstName: 'Anna', lastName: 'Nowak' },
          vehicle: { registration: 'DEF456', make: 'Honda', model: 'Civic' },
        },
      ],
      isLoading: false,
    });

    render(<RentalsPage />);

    expect(screen.getByText('Wynajmy')).toBeInTheDocument();
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
    expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
  });

  it('renders empty state when no rentals', () => {
    mockUseRentals.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<RentalsPage />);

    expect(screen.getByText('Brak wynajmow')).toBeInTheDocument();
  });
});
