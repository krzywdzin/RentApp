import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import RentalsPage from '../page';

// Mock hooks
const mockUseRentals = vi.fn();
const mockUseArchivedRentals = vi.fn();
const mockUseArchiveRental = vi.fn();
const mockUseUnarchiveRental = vi.fn();
const mockUseDeleteRental = vi.fn();

vi.mock('@/hooks/queries/use-rentals', () => ({
  useRentals: (...args: unknown[]) => mockUseRentals(...args),
  useArchivedRentals: (...args: unknown[]) => mockUseArchivedRentals(...args),
  useArchiveRental: (...args: unknown[]) => mockUseArchiveRental(...args),
  useUnarchiveRental: (...args: unknown[]) => mockUseUnarchiveRental(...args),
  useDeleteRental: (...args: unknown[]) => mockUseDeleteRental(...args),
  useSettlementRentals: () => ({ data: [], isLoading: false }),
}));

// Mock @rentapp/shared enums
vi.mock('@rentapp/shared', () => ({
  RentalStatus: {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    EXTENDED: 'EXTENDED',
    RETURNED: 'RETURNED',
  },
  SettlementStatus: {
    NIEROZLICZONY: 'NIEROZLICZONY',
    CZESCIOWO_ROZLICZONY: 'CZESCIOWO_ROZLICZONY',
    ROZLICZONY: 'ROZLICZONY',
    ANULOWANY: 'ANULOWANY',
  },
}));

// Mock sub-components that have complex dependencies
vi.mock('../columns', () => ({
  getRentalColumns: () => [
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
  getArchivedRentalColumns: () => [
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

vi.mock('../settlement-summary-bar', () => ({
  SettlementSummaryBar: () => <div data-testid="settlement-summary-bar">Summary</div>,
}));

vi.mock('../settlement-filter-bar', () => ({
  SettlementFilterBar: () => <div data-testid="settlement-filter-bar">Settlement Filters</div>,
}));

vi.mock('../settlement-columns', () => ({
  getSettlementColumns: () => [],
}));

describe('RentalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseArchivedRentals.mockReturnValue({ data: [], isLoading: false });
    mockUseArchiveRental.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseUnarchiveRental.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseDeleteRental.mockReturnValue({ mutate: vi.fn(), isPending: false });
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
